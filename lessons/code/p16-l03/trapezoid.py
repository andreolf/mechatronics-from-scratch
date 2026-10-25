import numpy as np

def trapezoid(D, vmax, amax):
    """rest-to-rest move of distance D >= 0: returns (accel time, cruise time, peak velocity, total time)"""
    if D >= vmax**2 / amax:                       # long enough to reach vmax: trapezoid
        ta, vp = vmax / amax, vmax
        tc = (D - vmax**2 / amax) / vmax
    else:                                         # too short: triangle, peak below vmax
        vp = np.sqrt(amax * D); ta, tc = vp / amax, 0.0
    return ta, tc, vp, 2 * ta + tc

def sample(D, vmax, amax, t):
    """position, velocity and acceleration of the profile at times t (exact, piecewise quadratic)"""
    ta, tc, vp, T = trapezoid(D, vmax, amax); a = vp / ta
    t = np.clip(t, 0, T); p = np.empty_like(t); v = np.empty_like(t); acc = np.empty_like(t)
    m1, m2 = t < ta, (t >= ta) & (t < ta + tc); m3 = ~(m1 | m2)
    p[m1] = a * t[m1]**2 / 2; v[m1] = a * t[m1]; acc[m1] = a
    p[m2] = a * ta**2 / 2 + vp * (t[m2] - ta); v[m2] = vp; acc[m2] = 0
    r = T - t[m3]; p[m3] = D - a * r**2 / 2; v[m3] = a * r; acc[m3] = -a
    return p, v, acc

def synchronise(Ds, vmax, amax):
    """several axes, one move: stretch the faster axes to finish with the slowest, by scaling their limits"""
    T = max(trapezoid(abs(D), v, a)[3] for D, v, a in zip(Ds, vmax, amax))
    out = []
    for D, v, a in zip(Ds, vmax, amax):
        lo, hi = 0.0, 1.0                         # bisect one scale k applied to both limits
        for _ in range(100):
            k = (lo + hi) / 2
            lo, hi = (k, hi) if trapezoid(abs(D), v * k, a * k)[3] > T else (lo, k)
        out.append((hi * v, hi * a))
    return T, out

def test_limits_and_goal():
    t = np.linspace(0, 4, 400001)
    for D, v, a in [(1.0, 0.5, 1.0), (0.1, 0.5, 1.0), (2.0, 1.2, 0.8)]:
        ta, tc, vp, T = trapezoid(D, v, a)
        p, vel, acc = sample(D, v, a, t)
        kind = "trapezoid" if tc > 0 else "triangle"
        print(f"D = {D} m, vmax = {v} m/s, amax = {a} m/s^2: {kind}, peak {vp:.4f} m/s, accel {ta:.4f} s, cruise {tc:.4f} s, total {T:.4f} s")
        assert vel.max() <= v + 1e-12 and np.abs(acc).max() <= a + 1e-12      # never exceeds the limits
        assert abs(p[-1] - D) < 1e-12 and abs(vel[-1]) < 1e-12 and np.all(np.diff(p) >= -1e-15)
        # position matches the integral of velocity (the sampled profile is self-consistent)
        assert abs(np.trapezoid(vel, t) - D) < 1e-6

def test_time_optimal():
    """bang-coast-bang is the fastest: any slower peak or acceleration takes longer"""
    D, v, a = 1.0, 0.5, 1.0; T = trapezoid(D, v, a)[3]
    slower = [trapezoid(D, v * k, a)[3] for k in (0.6, 0.8, 0.95)] + [trapezoid(D, v, a * k)[3] for k in (0.6, 0.8, 0.95)]
    print(f"minimum time {T:.4f} s; with lower limits it takes {min(slower):.4f} s or more")
    assert min(slower) > T

def test_synchronised_axes():
    T, lim = synchronise([0.8, 0.2, -0.5], [0.5, 0.5, 0.5], [1.0, 1.0, 1.0])
    ends = [trapezoid(abs(D), v, a)[3] for D, (v, a) in zip([0.8, 0.2, -0.5], lim)]
    print(f"three axes finish together at {T:.4f} s: " + ", ".join(f"{e:.4f}" for e in ends) + " s")
    assert max(abs(e - T) for e in ends) < 1e-9

test_limits_and_goal()
test_time_optimal()
test_synchronised_axes()
print("PASS")
