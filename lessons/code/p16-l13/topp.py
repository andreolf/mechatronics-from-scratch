import numpy as np
from scipy.optimize import linprog

VMAX, AMAX = np.array([1.0, 1.0]), np.array([2.0, 2.0])     # illustrative per-axis limits (m/s, m/s^2)
M = 400                                                     # path stages
s = np.linspace(0, 1, M + 1); ds = s[1] - s[0]

def path(s):
    """an illustrative wavy path in the plane: q(s), q'(s), q''(s) for s in [0, 1]"""
    w = 2 * np.pi
    q = np.stack([2 * s, 0.4 * np.sin(w * s)], 1)
    dq = np.stack([np.full_like(s, 2.0), 0.4 * w * np.cos(w * s)], 1)
    ddq = np.stack([np.zeros_like(s), -0.4 * w * w * np.sin(w * s)], 1)
    return q, dq, ddq

Q, dQ, ddQ = path(s)

def stage_constraints(k):
    """constraints at stage k as G @ [x, u] <= h, with x = sdot^2 and u = sddot (x' = 2u along s)"""
    G, h = [], []
    for i in range(2):
        G += [[ddQ[k, i], dQ[k, i]], [-ddQ[k, i], -dQ[k, i]]]; h += [AMAX[i], AMAX[i]]     # |q'' x + q' u| <= amax
        G += [[dQ[k, i]**2, 0.0]]; h += [VMAX[i]**2]                                       # (q' sdot)^2 <= vmax^2
    G += [[-1.0, 0.0]]; h += [0.0]                                                         # x >= 0
    return np.array(G), np.array(h)

def u_range(k, x):
    """interval of path accelerations allowed at stage k for a given x"""
    G, h = stage_constraints(k); lo, hi = -np.inf, np.inf
    for (gx, gu), hh in zip(G, h):
        r = hh - gx * x
        if abs(gu) < 1e-12:
            if r < -1e-9: return 1.0, -1.0                    # x itself infeasible
        elif gu > 0: hi = min(hi, r / gu)
        else: lo = max(lo, r / gu)
    return lo, hi

def topp():
    """reachability analysis as in TOPP-RA: a backward pass of controllable sets, then a greedy forward pass"""
    K = np.zeros((M + 1, 2)); K[M] = [0.0, 0.0]                # stop at the end
    for k in range(M - 1, -1, -1):
        G, h = stage_constraints(k)
        A = np.vstack([G, [[1, 2 * ds], [-1, -2 * ds]]]); b = np.concatenate([h, [K[k + 1, 1], -K[k + 1, 0]]])
        lo = linprog([1, 0], A_ub=A, b_ub=b, bounds=[(None, None)] * 2, method='highs')
        hi = linprog([-1, 0], A_ub=A, b_ub=b, bounds=[(None, None)] * 2, method='highs')
        K[k] = [lo.x[0], hi.x[0]]
    x = np.zeros(M + 1); u = np.zeros(M)
    for k in range(M):
        lo, hi = u_range(k, x[k])
        hi = min(hi, (K[k + 1, 1] - x[k]) / (2 * ds))          # stay inside the next controllable set
        u[k] = hi; x[k + 1] = max(0.0, x[k] + 2 * ds * u[k])
    return x, u

def duration(x):
    return np.sum(2 * ds / (np.sqrt(x[:-1]) + np.sqrt(x[1:])))

def test_respects_limits_and_is_fast():
    x, u = topp(); T = duration(x)
    worst = 0.0
    for k in range(M):
        G, h = stage_constraints(k); worst = max(worst, np.max(G @ [x[k], u[k]] - h))
    vel = dQ * np.sqrt(x)[:, None]; acc = ddQ[:-1] * x[:-1, None] + dQ[:-1] * u[:, None]
    print(f"time-optimal: {T:.4f} s; peak |velocity| {np.abs(vel).max(0).round(4)} m/s, peak |acceleration| {np.abs(acc).max(0).round(4)} m/s^2; worst constraint violation {worst:.1e}")
    assert worst < 1e-7 and x[0] == 0 and abs(x[-1]) < 1e-9
    # at every stage some constraint is tight: the profile is bang-bang along the limits
    slack = [np.max((G @ [x[k], u[k]]) / np.where(h > 0, h, 1)) for k in range(M) for G, h in [stage_constraints(k)]]
    print(f"stages with a limit within 0.1 % of active: {np.mean(np.array(slack) > 0.999) * 100:.1f} %")
    assert np.mean(np.array(slack) > 0.999) > 0.99
    # compare: the usual safe alternative, one constant path speed with linear ramps, as fast as the limits allow
    def feasible(sd, ar):
        xs = np.minimum.reduce([np.full(M + 1, sd**2), 2 * ar * s, 2 * ar * (1 - s)]); us = (xs[1:] - xs[:-1]) / (2 * ds)
        return all(np.all(stage_constraints(k)[0] @ [xs[k], us[k]] <= stage_constraints(k)[1] + 1e-12) for k in range(M)), xs
    best = np.inf
    for sd in np.linspace(0.05, 2.0, 40):
        lo, hi = 0.0, 50.0
        for _ in range(30):
            mid = (lo + hi) / 2; lo, hi = (mid, hi) if feasible(sd, mid)[0] else (lo, mid)
        if lo > 0: best = min(best, duration(feasible(sd, lo)[1]))
    print(f"best constant path speed with ramps: {best:.4f} s, {best / T:.2f} times longer")
    assert T < best
    return x, u

def test_time_domain_check():
    """rebuild s(t) with constant path acceleration in each stage, then difference q(s(t)) in time"""
    x, u = topp(); dt = 2 * ds / (np.sqrt(x[:-1]) + np.sqrt(x[1:])); t = np.concatenate([[0], np.cumsum(dt)])
    tf = np.linspace(0, t[-1], 40001); k = np.clip(np.searchsorted(t, tf, side='right') - 1, 0, M - 1); tau = tf - t[k]
    sf = s[k] + np.sqrt(x[k]) * tau + u[k] * tau**2 / 2
    qf = path(sf)[0]; v = np.gradient(qf, tf, axis=0); a = np.gradient(v, tf, axis=0)
    print(f"q(t) differenced in time: peak |v| {np.abs(v).max(0).round(3)} m/s, peak |a| {np.abs(a[5:-5]).max(0).round(3)} m/s^2")
    assert np.all(np.abs(v).max(0) <= VMAX * 1.01) and np.all(np.abs(a[5:-5]).max(0) <= AMAX * 1.03)

test_respects_limits_and_is_fast()
test_time_domain_check()
print("PASS")
