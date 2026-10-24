import numpy as np
import sympy as sp

M, m, l, g = 0.8, 0.25, 0.45, 9.81
I = m * l ** 2 / 3

def accel(s, F=0.0):
    x, xd, th, thd = s
    Mm = np.array([[M + m, m * l * np.cos(th)], [m * l * np.cos(th), I + m * l ** 2]])
    rhs = np.array([F + m * l * np.sin(th) * thd ** 2, m * g * l * np.sin(th)])
    xdd, thdd = np.linalg.solve(Mm, rhs)
    return np.array([xd, xdd, thd, thdd])

def energy(s):
    x, xd, th, thd = s
    T = 0.5 * (M + m) * xd ** 2 + m * l * np.cos(th) * xd * thd + 0.5 * (I + m * l ** 2) * thd ** 2
    return T + m * g * l * np.cos(th)

def rk4(f, s, dt, n):
    out = [s]
    for _ in range(n):
        k1 = f(s); k2 = f(s + dt / 2 * k1); k3 = f(s + dt / 2 * k2); k4 = f(s + dt * k3)
        s = s + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4); out.append(s)
    return np.array(out)

def test_lagrange_matches_hand():
    t = sp.symbols("t"); F = sp.symbols("F")
    x, th = sp.Function("x")(t), sp.Function("theta")(t)
    Ms, ms, ls, gs = sp.symbols("M m l g", positive=True)
    Is = ms * ls ** 2 / 3
    T = sp.Rational(1, 2) * (Ms + ms) * x.diff(t) ** 2 + ms * ls * sp.cos(th) * x.diff(t) * th.diff(t) \
        + sp.Rational(1, 2) * (Is + ms * ls ** 2) * th.diff(t) ** 2
    L = T - ms * gs * ls * sp.cos(th)
    e1 = sp.diff(L.diff(x.diff(t)), t) - L.diff(x) - F
    e2 = sp.diff(L.diff(th.diff(t)), t) - L.diff(th)
    sol = sp.solve([e1, e2], [x.diff(t, 2), th.diff(t, 2)], dict=True)[0]
    sub = {Ms: M, ms: m, ls: l, gs: g}
    rng = np.random.default_rng(1)
    for _ in range(20):
        s = rng.uniform(-2, 2, 4); Fv = rng.uniform(-10, 10)
        vals = {x.diff(t): s[1], th: s[2], th.diff(t): s[3], F: Fv}
        xdd = float(sol[x.diff(t, 2)].subs(sub).subs(vals)); thdd = float(sol[th.diff(t, 2)].subs(sub).subs(vals))
        a = accel(s, Fv)
        assert abs(a[1] - xdd) < 1e-9 and abs(a[3] - thdd) < 1e-9

def test_matches_lab_closed_form():
    # the closed form used by the site's live lab (site/src/sim/pendulum.js), friction terms removed
    rng = np.random.default_rng(2)
    for _ in range(200):
        s = rng.uniform(-3, 3, 4); F = rng.uniform(-30, 30)
        sin, cos, tot = np.sin(s[2]), np.cos(s[2]), M + m
        temp = (F + m * l * s[3] ** 2 * sin) / tot
        thdd = (g * sin - cos * temp) / (l * (4 / 3 - m * cos ** 2 / tot))
        xdd = temp - m * l * thdd * cos / tot
        a = accel(s, F)
        assert abs(a[1] - xdd) < 1e-9 and abs(a[3] - thdd) < 1e-9
    print("Lagrangian model matches SymPy and the live lab's closed form")

def test_energy_conserved():
    s0 = np.array([0.0, 0.0, 0.05, 0.0])
    traj = rk4(accel, s0, 1e-3, 10000)
    E = np.array([energy(s) for s in traj])
    drift = np.max(np.abs(E - E[0])) / abs(E[0])
    print(f"10 s frictionless, pole swings through {np.max(np.abs(traj[:, 2])):.2f} rad, energy drift {drift:.1e}")
    assert np.max(np.abs(traj[:, 2])) > 3.0 and drift < 1e-6
    # horizontal momentum is also conserved with F = 0
    p = (M + m) * traj[:, 1] + m * l * np.cos(traj[:, 2]) * traj[:, 3]
    assert np.max(np.abs(p)) < 1e-9

def test_linear_pole_and_fall_time():
    tot = M + m
    p = np.sqrt(m * g * l * tot / ((I + m * l ** 2) * tot - (m * l) ** 2))
    traj = rk4(accel, np.array([0, 0, 0.01, 0]), 1e-4, 15000)
    t_half = np.argmax(traj[:, 2] > 0.5) * 1e-4
    t_lin = np.arccosh(50) / p
    print(f"unstable pole {p:.3f} 1/s; reaches 0.5 rad at {t_half:.3f} s (linear estimate {t_lin:.3f} s)")
    assert abs(p - 4.461) < 1e-3 and abs(t_half - t_lin) < 0.05

test_lagrange_matches_hand()
test_matches_lab_closed_form()
test_energy_conserved()
test_linear_pole_and_fall_time()
print("PASS")
