import numpy as np

def buck_switched(vin=12.0, D=0.275, L=22e-6, Cc=47e-6, R=1.65, fs=500e3, periods=600, steps=200):
    """ideal synchronous buck: the switch node is Vin for D T and 0 for (1 - D) T; integrate the L-C-R filter"""
    T = 1 / fs; dt = T / steps; tr_i, tr_v = [], []
    vC = D * vin; iL = vC / R                                           # start at the averaged operating point: no slow LC ringing
    for k in range(periods * steps):
        vsw = vin if (k % steps) < round(D * steps) else 0.0
        diL = (vsw - vC) / L; dvC = (iL - vC / R) / Cc
        iL += dt * diL; vC += dt * dvC                                    # step small against T, so forward Euler is fine
        if k >= (periods - 4) * steps: tr_i.append(iL); tr_v.append(vC)
    return np.array(tr_i), np.array(tr_v)

def buck_averaged(vin=12.0, D=0.275, L=22e-6, Cc=47e-6, R=1.65, t_end=1.2e-3, dt=50e-9):
    """averaged model: replace the switch node by its average D Vin; no ripple, same slow dynamics"""
    iL, vC = 0.0, 0.0; out = []
    for _ in range(int(t_end / dt)):
        iL += dt * (D * vin - vC) / L; vC += dt * (iL - vC / R) / Cc; out.append(vC)
    return np.array(out)

def ripple_formulas(vin, D, L, Cc, fs):
    vout = D * vin; di = (vin - vout) * D / (L * fs)                     # inductor current ripple, peak to peak
    return vout, di, di / (8 * Cc * fs)                                  # capacitor voltage ripple, ideal capacitor

def test_volt_second_balance():
    vin, D, L, Cc, fs = 12.0, 0.275, 22e-6, 47e-6, 500e3
    i, v = buck_switched(vin, D, L, Cc, fs=fs); vout, di, dv = ripple_formulas(vin, D, L, Cc, fs)
    sim_di, sim_dv = i.max() - i.min(), v.max() - v.min()
    print(f"Vout: formula D Vin = {vout:.3f} V, switched simulation mean {v.mean():.3f} V, averaged model {buck_averaged()[-1]:.3f} V")
    print(f"inductor ripple: formula {di:.4f} A, simulation {sim_di:.4f} A; mean current {i.mean():.3f} A (load {vout / 1.65:.3f} A)")
    print(f"output ripple: formula {1000 * dv:.3f} mV, simulation {1000 * sim_dv:.3f} mV")
    assert abs(v.mean() - vout) < 0.02 and abs(sim_di - di) / di < 0.02 and abs(sim_dv - dv) / dv < 0.05

def test_design_inductor():
    vin, vout, iout, fs = 12.0, 3.3, 2.0, 500e3; D = vout / vin
    L = (vin - vout) * D / (0.3 * iout * fs)                              # pick L for 30 % ripple
    print(f"inductor for 30 % ripple at 2 A: {1e6 * L:.2f} uH; peak current {iout * 1.15:.2f} A (choose saturation above this)")
    assert abs(ripple_formulas(vin, D, L, 47e-6, fs)[1] - 0.6) < 1e-9

test_volt_second_balance()
test_design_inductor()
print("PASS")
