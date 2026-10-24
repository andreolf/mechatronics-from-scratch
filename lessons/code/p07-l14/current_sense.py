import numpy as np

def shunt_design(i_max, v_fs=0.05, adc_span=3.3, bits=12):
    R = v_fs / i_max
    G = (adc_span / 2) / v_fs                              # bidirectional around mid-rail
    amps_per_count = adc_span / 2**bits / (G * R)
    return R, i_max**2 * R, G, amps_per_count

def phase_current(t, duty, i_avg=10.0, ripple=4.0, ring=6.0):
    """t in PWM periods [0, 1); centre-aligned, on in the middle."""
    t = np.asarray(t) % 1.0
    on0, on1 = 0.5 - duty / 2, 0.5 + duty / 2
    rising = (t >= on0) & (t < on1)
    x_off = np.where(t < on0, (t + 1 - on1) / (1 - duty), (t - on1) / (1 - duty))
    i = np.where(rising, i_avg - ripple / 2 + ripple * (t - on0) / duty, i_avg + ripple / 2 - ripple * x_off)
    for edge in (on0, on1):
        dt = t - edge
        i = i + np.where((dt >= 0) & (dt < 0.04), ring * np.exp(-dt / 0.012) * np.cos(2 * np.pi * dt / 0.012), 0)
    return i

if __name__ == "__main__":
    R, P, G, lsb = shunt_design(20)
    print(f"R = {R*1e3:.2f} mOhm, loss {P:.2f} W, gain {G:.0f}, {lsb*1e3:.2f} mA per count")
    assert abs(R - 2.5e-3) < 1e-12 and abs(P - 1.0) < 1e-12 and abs(G - 33) < 1e-12 and abs(lsb - 9.766e-3) < 1e-5
    t = np.linspace(0, 1, 200_000, endpoint=False)
    for duty in (0.2, 0.5, 0.8):
        true_avg = phase_current(t, duty, ring=0).mean()
        centre = float(phase_current(0.5, duty))           # middle of the on-time (PWM counter at its peak)
        valley = float(phase_current(0.0, duty))           # middle of the off-time
        near_edge = float(phase_current(0.5 - duty / 2 + 0.005, duty))
        assert abs(centre - true_avg) < 1e-3 and abs(valley - true_avg) < 1e-3
        assert abs(near_edge - true_avg) > 1.0
    print("centre-aligned sampling returns the average current at every duty cycle")
