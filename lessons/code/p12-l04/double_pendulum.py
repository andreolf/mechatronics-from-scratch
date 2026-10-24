import numpy as np
import sympy as sp

t = sp.symbols("t")
m1, m2, l1, l2, g = sp.symbols("m1 m2 l1 l2 g", positive=True)
th1, th2 = sp.Function("th1")(t), sp.Function("th2")(t)

x1, y1 = l1 * sp.sin(th1), -l1 * sp.cos(th1)
x2, y2 = x1 + l2 * sp.sin(th2), y1 - l2 * sp.cos(th2)
T = sp.Rational(1, 2) * m1 * (x1.diff(t) ** 2 + y1.diff(t) ** 2) + sp.Rational(1, 2) * m2 * (x2.diff(t) ** 2 + y2.diff(t) ** 2)
V = m1 * g * y1 + m2 * g * y2
L = sp.simplify(T - V)

# Euler-Lagrange for each coordinate, then solve for the two angular accelerations
eqs = [sp.diff(L.diff(q.diff(t)), t) - L.diff(q) for q in (th1, th2)]
a1, a2 = sp.symbols("a1 a2"); w1, w2, q1, q2 = sp.symbols("w1 w2 q1 q2")
subs = {th1.diff(t, 2): a1, th2.diff(t, 2): a2}
eqs = [e.subs(subs) for e in eqs]
subs2 = {th1.diff(t): w1, th2.diff(t): w2}
eqs = [e.subs(subs2).subs({th1: q1, th2: q2}) for e in eqs]
sol = sp.solve(eqs, [a1, a2], dict=True)[0]
P = {m1: 1.0, m2: 1.0, l1: 1.0, l2: 1.0, g: 9.81}
acc = sp.lambdify((q1, q2, w1, w2), [sol[a1].subs(P), sol[a2].subs(P)], "numpy")
energy = sp.lambdify((q1, q2, w1, w2), (T + V).subs(subs2).subs({th1: q1, th2: q2}).subs(P), "numpy")

def textbook(s):
    """the standard closed form, written out independently, for comparison"""
    q1_, q2_, w1_, w2_ = s
    M1, M2, L1, L2, G = 1.0, 1.0, 1.0, 1.0, 9.81
    d = q1_ - q2_
    den = 2 * M1 + M2 - M2 * np.cos(2 * d)
    A1 = (-G * (2 * M1 + M2) * np.sin(q1_) - M2 * G * np.sin(q1_ - 2 * q2_) - 2 * np.sin(d) * M2 * (w2_ ** 2 * L2 + w1_ ** 2 * L1 * np.cos(d))) / (L1 * den)
    A2 = (2 * np.sin(d) * (w1_ ** 2 * L1 * (M1 + M2) + G * (M1 + M2) * np.cos(q1_) + w2_ ** 2 * L2 * M2 * np.cos(d))) / (L2 * den)
    return np.array([A1, A2])

def f(s):
    a = acc(*s)
    return np.array([s[2], s[3], a[0], a[1]], float)

def rk4(s0, T_end, dt):
    s = np.array(s0, float); out = [s]
    for _ in range(int(round(T_end / dt))):
        k1 = f(s); k2 = f(s + dt / 2 * k1); k3 = f(s + dt / 2 * k2); k4 = f(s + dt * k3)
        s = s + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4); out.append(s)
    return np.array(out)

def test_matches_textbook():
    rng = np.random.default_rng(0)
    for _ in range(200):
        s = rng.uniform(-3, 3, 4)
        assert np.allclose(acc(*s), textbook(s), atol=1e-9)
    print("SymPy-derived accelerations match the textbook closed form at 200 random states")

def test_energy_conserved():
    s0 = [np.pi / 2, 0.0, 0.0, 0.0]
    E0 = energy(*s0)
    assert abs(E0 + 9.81) < 1e-12
    X = rk4(s0, 10.0, 1e-3)
    E = np.array([energy(*s) for s in X])
    drift = np.max(np.abs(E - E0))
    print(f"E0 = {E0:.3f} J; worst energy error over 10 s: {drift:.2e} J")
    assert drift < 1e-5

def test_chaos():
    q0 = 2 * np.pi / 3                                       # both links at 120 degrees: enough energy to tumble
    a = rk4([q0, q0, 0.0, 0.0], 20.0, 2e-3)
    b = rk4([q0 + 1e-6, q0, 0.0, 0.0], 20.0, 2e-3)
    sep = np.abs(a[:, 1] - b[:, 1])
    t_big = np.argmax(sep > 0.1) * 2e-3
    print(f"from 120/120 degrees, a 1e-6 rad difference grows past 0.1 rad after {t_big:.1f} s")
    assert sep[500] < 1e-4 and sep.max() > 1.0

test_matches_textbook()
test_energy_conserved()
test_chaos()
print("PASS")
