import numpy as np
import sympy as sp

# Illustrative two-wheeled robot: body M, wheels (both) m, wheel radius r, body centre of mass l above the axle.
P = dict(M=0.9, m=0.12, r=0.04, l=0.07, Ib=0.004, Iw=0.12 * 0.04**2 / 2, g=9.81, kt=0.25, ke=0.25, R=4.0)

def derive():
    """Lagrange: q = (x, th); the motor torque acts between body and wheels, so its virtual work is tau d(x/r - th)."""
    t = sp.symbols("t"); M, m, r, l, Ib, Iw, g, tau = sp.symbols("M m r l Ib Iw g tau", positive=True)
    x, th = sp.Function("x")(t), sp.Function("th")(t); xd, thd = x.diff(t), th.diff(t)
    T = sp.Rational(1, 2) * (m + Iw / r**2) * xd**2 + sp.Rational(1, 2) * M * ((xd + l * sp.cos(th) * thd)**2 + (l * sp.sin(th) * thd)**2) + sp.Rational(1, 2) * Ib * thd**2
    V = M * g * l * sp.cos(th); Lg = T - V
    eqs = [sp.simplify(Lg.diff(qd).diff(t) - Lg.diff(q)) for q, qd in ((x, xd), (th, thd))]
    Q = [tau / r, -tau]
    xdd, thdd = sp.symbols("xdd thdd"); w, wt = sp.symbols("w wt"); X, TH = sp.symbols("X TH")
    sub = {x.diff(t, 2): xdd, th.diff(t, 2): thdd, xd: w, thd: wt, x: X, th: TH}
    sol = sp.solve([sp.Eq(e.subs(sub), q) for e, q in zip(eqs, Q)], [xdd, thdd], dict=True)[0]
    return sp.lambdify((X, w, TH, wt, tau, M, m, r, l, Ib, Iw, g), [sol[xdd], sol[thdd]], "numpy")

ACC = derive()

def f(s, v, p=P):
    """state s = (x, x', th, th'), input: motor voltage v. Two motors: tau = 2 kt (v - ke w_rel) / R."""
    x, w, th, wt = s; w_rel = w / p["r"] - wt
    tau = 2 * p["kt"] * (v - p["ke"] * w_rel) / p["R"]
    xdd, thdd = ACC(x, w, th, wt, tau, p["M"], p["m"], p["r"], p["l"], p["Ib"], p["Iw"], p["g"])
    return np.array([w, xdd, wt, thdd])

def rk4(s, v, dt):
    k1 = f(s, v); k2 = f(s + dt / 2 * k1, v); k3 = f(s + dt / 2 * k2, v); k4 = f(s + dt * k3, v)
    return s + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4)

def linearise(eps=1e-6):
    A = np.zeros((4, 4)); B = np.zeros(4); s0 = np.zeros(4)
    for i in range(4):
        d = np.zeros(4); d[i] = eps; A[:, i] = (f(s0 + d, 0) - f(s0 - d, 0)) / (2 * eps)
    B = (f(s0, eps) - f(s0, -eps)) / (2 * eps)
    return A, B

def test_linear_matches_nonlinear():
    A, B = linearise(); ev = np.linalg.eigvals(A)
    print("eigenvalues of A: " + ", ".join(f"{e.real:+.3f}" + (f"{e.imag:+.3f}j" if abs(e.imag) > 1e-9 else "") for e in sorted(ev, key=lambda e: e.real)))
    p = P; den = p["Ib"] + p["M"] * p["l"]**2 - (p["M"] * p["l"])**2 / (p["M"] + p["m"] + p["Iw"] / p["r"]**2)
    print(f"A[3,2] = {A[3, 2]:.3f} 1/s^2; hand derivation M g l / (Ib + M l^2 - (M l)^2 / (M + m + Iw/r^2)) = {p['M'] * p['g'] * p['l'] / den:.3f}")
    assert abs(A[3, 2] - p["M"] * p["g"] * p["l"] / den) < 1e-4 and max(ev.real) > 0
    dt = 1e-3; s = np.array([0, 0, np.radians(2), 0]); z = s.copy(); err = 0
    for _ in range(300):
        s = rk4(s, 0.0, dt); z = z + dt * (A @ z); err = max(err, abs(s[2] - z[2]))
    print(f"2 deg start, 0.3 s uncontrolled: nonlinear tilt {np.degrees(s[2]):.3f} deg, linear {np.degrees(z[2]):.3f} deg, max gap {np.degrees(err):.3f} deg")
    assert np.degrees(err) < 0.1 * np.degrees(s[2])

def test_falls_uncontrolled():
    s = np.array([0, 0, np.radians(2), 0]); t = 0
    while abs(s[2]) < np.radians(45): s = rk4(s, 0.0, 1e-3); t += 1e-3
    print(f"uncontrolled: from 2 deg to 45 deg in {t:.3f} s, the wheels rolled {100 * s[0]:.1f} cm")
    assert 0.2 < t < 2

test_linear_matches_nonlinear()
test_falls_uncontrolled()
print("PASS")
