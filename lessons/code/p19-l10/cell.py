import numpy as np
from scipy.interpolate import PchipInterpolator

SOC = np.array([0, .05, .1, .2, .3, .4, .5, .6, .7, .8, .9, 1.0])
NMC = PchipInterpolator(SOC, [3.00, 3.30, 3.45, 3.55, 3.62, 3.68, 3.74, 3.82, 3.90, 3.98, 4.07, 4.20])   # illustrative curves,
LFP = PchipInterpolator(SOC, [2.50, 3.10, 3.20, 3.25, 3.27, 3.28, 3.29, 3.30, 3.31, 3.32, 3.34, 3.60])   # not from a datasheet

def discharge(c_rate, q_ah=3.0, r0=0.030, v_cut=3.0, ocv=NMC, dt=1.0):
    """constant-current discharge from full until the terminal voltage V = OCV(SOC) - I R0 reaches the cut-off."""
    i = c_rate * q_ah; soc = 1.0; t = e = 0.0
    while True:
        v = float(ocv(soc)) - i * r0
        if v <= v_cut or soc <= 0: break
        e += v * i * dt; soc -= i * dt / (q_ah * 3600); t += dt
    return (1 - soc) * q_ah, e / 3600, t / 60

def test_ocv_shapes():
    s = np.linspace(0.2, 0.8, 61)
    slope_nmc = np.mean(NMC(s, 1)); slope_lfp = np.mean(LFP(s, 1))
    print(f"mean OCV slope between 20 and 80 % SOC: NMC {1000 * slope_nmc / 100:.2f} mV/%, LFP {1000 * slope_lfp / 100:.2f} mV/%")
    for name, f in (("NMC", NMC), ("LFP", LFP)): assert np.all(np.diff(f(np.linspace(0, 1, 501))) > 0), name
    print(f"a 10 mV voltage error is {10 / (1000 * slope_nmc / 100):.1f} % SOC on NMC, {10 / (1000 * slope_lfp / 100):.1f} % on LFP")
    assert slope_nmc > 5 * slope_lfp

def test_c_rates():
    rows = [(c, *discharge(c)) for c in (0.2, 1, 2, 5)]
    for c, q, e, t in rows: print(f"{c:3.1f}C: {q:.3f} Ah, {e:.2f} Wh, {t:6.1f} min")
    qs = [r[1] for r in rows]; es = [r[2] for r in rows]
    assert all(np.diff(qs) < 0) and all(np.diff(es) < 0)               # higher rate: less charge and energy before cut-off
    assert abs(rows[1][3] - 60 * rows[1][1] / 3.0) < 0.5                  # 1C drains the delivered charge in its share of an hour

test_ocv_shapes()
test_c_rates()
print("PASS")
