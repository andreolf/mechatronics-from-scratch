import numpy as np

def scurve(D, vmax, amax, jmax):
    """seven-segment jerk-limited rest-to-rest move. Returns the segment durations and jerks."""
    def accel_phase(v):                           # jerk time, constant-accel time, distance to reach v from rest
        tj = min(amax / jmax, np.sqrt(v / jmax)); ta = v / (jmax * tj) - tj
        return tj, ta, v * (2 * tj + ta) / 2
    v = vmax
    if 2 * accel_phase(v)[2] > D:                 # too short to reach vmax: lower the peak velocity (bisection)
        lo, hi = 0.0, vmax
        for _ in range(200):
            v = (lo + hi) / 2; lo, hi = (v, hi) if 2 * accel_phase(v)[2] < D else (lo, v)
        v = lo
    tj, ta, da = accel_phase(v); tv = (D - 2 * da) / v
    durs = [tj, ta, tj, tv, tj, ta, tj]
    jerks = [jmax, 0, -jmax, 0, -jmax, 0, jmax]
    return durs, jerks

def integrate(durs, jerks, t):
    """exact piecewise-cubic position, velocity, acceleration, jerk at times t"""
    p = v = a = 0.0; t0 = 0.0; out = np.zeros((4, len(t)))
    for d, j in zip(durs, jerks):
        m = (t >= t0) & (t < t0 + d); s = t[m] - t0
        out[:, m] = [p + v * s + a * s**2 / 2 + j * s**3 / 6, v + a * s + j * s**2 / 2, a + j * s, np.full_like(s, j)]
        p, v, a = p + v * d + a * d**2 / 2 + j * d**3 / 6, v + a * d + j * d**2 / 2, a + j * d; t0 += d
    out[:, t >= t0] = np.array([[p], [v], [a], [0]])
    return out, t0

def trapezoid(D, vmax, amax):
    ta = vmax / amax; tc = D / vmax - ta          # assumes the cruise exists
    return [ta, tc, ta], [amax, 0, -amax]

def residual(base_acc, t, fn=4.0, zeta=0.02):
    """a flexible load on the moving axis: deflection e'' + 2 zeta wn e' + wn^2 e = -base acceleration.
    Returns the largest deflection after the move ends."""
    wn = 2 * np.pi * fn; dt = t[1] - t[0]; e = de = 0.0; E = np.zeros(len(t))
    f = lambda e, de, u: (de, -2 * zeta * wn * de - wn**2 * e - u)
    for i in range(len(t) - 1):
        u0, u1 = base_acc[i], base_acc[i + 1]; um = (u0 + u1) / 2
        k1 = f(e, de, u0); k2 = f(e + dt / 2 * k1[0], de + dt / 2 * k1[1], um)
        k3 = f(e + dt / 2 * k2[0], de + dt / 2 * k2[1], um); k4 = f(e + dt * k3[0], de + dt * k3[1], u1)
        e += dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); de += dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]); E[i + 1] = e
    return E

D, V, A = 0.5, 0.6, 2.0                          # illustrative axis: 0.5 m move, 0.6 m/s, 2 m/s^2

def test_limits():
    t = np.linspace(0, 3, 300001)
    for J in (20.0, 8.0):
        durs, jerks = scurve(D, V, A, J); (p, v, a, j), T = integrate(durs, jerks, t)
        print(f"jerk limit {J:g} m/s^3: segments " + ", ".join(f"{d:.4f}" for d in durs) + f" s, total {T:.4f} s, peak v {v.max():.4f}, peak a {np.abs(a).max():.4f}")
        assert v.max() <= V + 1e-12 and np.abs(a).max() <= A + 1e-12 and np.abs(j).max() <= J + 1e-12
        assert abs(p[-1] - D) < 1e-12 and abs(v[-1]) < 1e-12 and abs(a[-1]) < 1e-12
    durs, jerks = scurve(0.02, V, A, 20.0); (p, v, a, j), T = integrate(durs, jerks, t)
    print(f"short 2 cm move: peak velocity lowered to {v.max():.4f} m/s, total {T:.4f} s")
    assert abs(p[-1] - 0.02) < 1e-9 and v.max() < V

def test_vibration_reduced():
    t = np.linspace(0, 3, 60001)
    trap_d, trap_j = trapezoid(D, V, A)
    acc_trap = np.select([t < trap_d[0], t < trap_d[0] + trap_d[1], t < sum(trap_d)], [A, 0, -A], 0)
    E_trap = residual(acc_trap, t); T_trap = sum(trap_d)
    res = {}
    for J in (20.0, 8.0):
        durs, jerks = scurve(D, V, A, J); (p, v, a, j), T = integrate(durs, jerks, t)
        E = residual(a, t); res[J] = (np.abs(E[t > T]).max(), T, durs[0])
    r_trap = np.abs(E_trap[t > T_trap]).max()
    print(f"4 Hz load, residual vibration after the move: trapezoid {r_trap * 1000:.2f} mm ({T_trap:.3f} s)")
    for J, (r, T, tj) in res.items():
        print(f"   S-curve, jerk {J:g} m/s^3 (jerk time {tj:.3f} s): {r * 1000:.3f} mm ({T:.3f} s)")
    assert res[20.0][0] < r_trap and res[8.0][0] < r_trap / 20   # a jerk time equal to the 0.25 s period nearly cancels it

test_limits()
test_vibration_reduced()
print("PASS")
