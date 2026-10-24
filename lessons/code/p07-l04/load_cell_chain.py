import numpy as np

rng = np.random.default_rng(11)
CAP, SENS, VEX, VREF, BITS = 5.0, 2e-3, 3.3, 3.3, 16

def chain(mass, G=200, gauge_offset=0.15e-3, noise_uV=1.0, n_avg=1):
    """Mass in kg to ADC code: bridge, INA around a mid-rail reference, ratiometric ADC."""
    vb = VEX * SENS * mass / CAP + gauge_offset                          # bridge imbalance at zero load
    vb = vb + noise_uV * 1e-6 * rng.standard_normal(n_avg)
    vo = np.clip(VREF / 2 + G * vb, 0, VREF)
    return float(np.mean(np.floor(vo / VREF * 2**BITS).clip(0, 2**BITS - 1)))

if __name__ == "__main__":
    GF, eps = 2.0, 1000e-6
    assert abs(GF * eps - 0.002) < 1e-15 and abs(VEX * GF * eps - 6.6e-3) < 1e-12
    assert 1.65 / 6.6e-3 == 250
    counts_per_kg = 200 * VEX * SENS / CAP / VREF * 2**BITS
    assert abs(counts_per_kg - 5242.88) < 0.01
    # calibrate: tare, then a 5 kg reference (each averaged over 64 samples)
    tare = chain(0, n_avg=64)
    g = (chain(5.0, n_avg=64) - tare) / 5.0
    worst = 0
    for m in np.linspace(0.25, 5.0, 20):
        est = (chain(m, n_avg=64) - tare) / g
        worst = max(worst, abs(est - m) / m)
    print(f"{counts_per_kg:.0f} counts/kg, worst relative error {100*worst:.3f} %")
    assert worst < 0.005
    # too much gain clips: 400 x 6.6 mV + 1.65 V exceeds the rail
    assert chain(5.0, G=400) == 2**BITS - 1
