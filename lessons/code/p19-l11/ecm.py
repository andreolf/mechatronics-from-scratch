import numpy as np
from scipy.optimize import least_squares

def ocv(soc): return 3.0 + 1.2 * soc - 0.25 * np.exp(-12 * soc) + 0.05 * np.sin(3 * soc)   # illustrative smooth curve

def simulate(i, dt, q_ah, r0, rcs, soc0=0.9):
    """Thevenin model: OCV(SOC) - i R0 - sum of RC branch voltages, each updated exactly for a step in current."""
    soc = soc0; vs = np.zeros(len(rcs)); out = np.empty(len(i))
    for k, ik in enumerate(i):
        out[k] = ocv(soc) - ik * r0 - vs.sum()
        for j, (r, c) in enumerate(rcs):
            a = np.exp(-dt / (r * c)); vs[j] = a * vs[j] + r * (1 - a) * ik
        soc -= ik * dt / (q_ah * 3600)
    return out

def pulse_test(dt=0.1):
    """10 s rest, 30 s at 6 A (2C), 60 s rest, 30 s at 3 A, 60 s rest."""
    seg = [(10, 0), (30, 6), (60, 0), (30, 3), (60, 0)]
    return np.concatenate([np.full(int(t / dt), a, float) for t, a in seg])

def test_fit_one_rc():
    dt = 0.1; q = 3.0; i = pulse_test(dt); rng = np.random.default_rng(1)
    truth = dict(r0=0.022, rcs=[(0.012, 800.0), (0.008, 6000.0)])           # "real" cell: two RC branches (illustrative)
    v = simulate(i, dt, q, **truth) + rng.normal(0, 0.5e-3, len(i))          # measured with 0.5 mV noise
    def resid(p): return simulate(i, dt, q, p[0], [(p[1], p[2])]) - v
    fit = least_squares(resid, [0.01, 0.01, 1000.0], bounds=([0, 0, 1], [0.2, 0.2, 1e6]), x_scale=[0.01, 0.01, 1000])
    r0, r1, c1 = fit.x; err = resid(fit.x)
    rms, peak = 1000 * np.sqrt(np.mean(err**2)), 1000 * np.max(np.abs(err))
    print(f"1-RC fit: R0 {1000 * r0:.2f} mOhm, R1 {1000 * r1:.2f} mOhm, C1 {c1:.0f} F, tau {r1 * c1:.1f} s")
    print(f"error: rms {rms:.2f} mV, peak {peak:.2f} mV")
    d0 = simulate(i, dt, q, r0, []) - v                                      # resistance only, no RC branch
    print(f"R0-only model: peak error {1000 * np.max(np.abs(d0)):.1f} mV")
    assert rms < 10 and np.max(np.abs(d0)) > 0.05
    def resid2(p): return simulate(i, dt, q, p[0], [(p[1], p[2]), (p[3], p[4])]) - v
    fit2 = least_squares(resid2, [0.01, 0.01, 500.0, 0.01, 5000.0], bounds=([0, 0, 1, 0, 1], [0.2, 0.2, 1e6, 0.2, 1e6]),
                         x_scale=[0.01, 0.01, 500, 0.01, 5000])
    e2 = resid2(fit2.x); taus = sorted([fit2.x[1] * fit2.x[2], fit2.x[3] * fit2.x[4]])
    print(f"2-RC fit: R0 {1000 * fit2.x[0]:.2f} mOhm, tau {taus[0]:.1f} s and {taus[1]:.1f} s, rms {1000 * np.sqrt(np.mean(e2**2)):.2f} mV, peak {1000 * np.max(np.abs(e2)):.2f} mV")
    assert np.max(np.abs(e2)) < 0.4 * peak / 1000
    r0_step = (v[int(10 / dt) - 1] - v[int(10 / dt) + 0]) / 6                # instantaneous drop at the pulse edge
    print(f"R0 from the instantaneous step: {1000 * r0_step:.2f} mOhm (truth 22.00)")
    assert abs(r0_step - 0.022) < 0.002

test_fit_one_rc()
print("PASS")
