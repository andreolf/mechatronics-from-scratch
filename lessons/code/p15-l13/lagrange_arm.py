import numpy as np
import sympy as sp

q1, q2, w1, w2 = sp.symbols("q1 q2 w1 w2", real=True)
l1, l2, m1, m2, g = sp.Rational(1), sp.Rational(4, 5), sp.Rational(3, 2), sp.Rational(1), sp.Rational(981, 100)   # the arm lab
lc1, lc2, I1, I2 = l1 / 2, l2 / 2, m1 * l1 ** 2 / 12, m2 * l2 ** 2 / 12
q, w = sp.Matrix([q1, q2]), sp.Matrix([w1, w2])

# centres of mass and their velocities
c1 = sp.Matrix([lc1 * sp.cos(q1), lc1 * sp.sin(q1)])
c2 = sp.Matrix([l1 * sp.cos(q1) + lc2 * sp.cos(q1 + q2), l1 * sp.sin(q1) + lc2 * sp.sin(q1 + q2)])
v1, v2 = c1.jacobian(q) * w, c2.jacobian(q) * w
KE = sp.simplify((m1 * v1.dot(v1) + m2 * v2.dot(v2) + I1 * w1 ** 2 + I2 * (w1 + w2) ** 2) / 2)
PE = m1 * g * c1[1] + m2 * g * c2[1]

M = sp.simplify(sp.hessian(KE, w))                       # KE = 1/2 w^T M w
G = sp.simplify(sp.Matrix([PE]).jacobian(q).T)
# Coriolis and centrifugal terms from the Christoffel symbols c_ijk = 1/2 (dM_ij/dq_k + dM_ik/dq_j - dM_jk/dq_i)
Cvec = sp.zeros(2, 1)
for i in range(2):
    for j in range(2):
        for k in range(2):
            Cvec[i] += sp.Rational(1, 2) * (sp.diff(M[i, j], q[k]) + sp.diff(M[i, k], q[j]) - sp.diff(M[j, k], q[i])) * w[j] * w[k]
Cvec = sp.simplify(Cvec)
print("M(q) =", M)
print("C(q, w) w =", Cvec.T)
print("g(q) =", G.T)

M_f, C_f, G_f = (sp.lambdify((q1, q2, w1, w2), e, "numpy") for e in (M, Cvec, G))
E_f = sp.lambdify((q1, q2, w1, w2), KE + PE, "numpy")

def deriv(s, tau=np.zeros(2), b=0.0):
    Mn = np.array(M_f(*s), float); rhs = tau - np.array(C_f(*s), float).ravel() - np.array(G_f(*s), float).ravel() - b * s[2:]
    return np.concatenate([s[2:], np.linalg.solve(Mn, rhs)])

def simulate(s0, T=5.0, dt=1e-3, b=0.0):
    s = np.array(s0, float); E = [E_f(*s)]
    for _ in range(int(T / dt)):
        k1 = deriv(s, b=b); k2 = deriv(s + dt / 2 * k1, b=b); k3 = deriv(s + dt / 2 * k2, b=b); k4 = deriv(s + dt * k3, b=b)
        s = s + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4); E.append(E_f(*s))
    return s, np.array(E)

def test_matches_lab_model():
    lab_M11 = m1 * lc1 ** 2 + I1 + m2 * (l1 ** 2 + lc2 ** 2 + 2 * l1 * lc2 * sp.cos(q2)) + I2
    assert sp.simplify(M[0, 0] - lab_M11) == 0
    h = m2 * l1 * lc2 * sp.sin(q2)
    assert sp.simplify(Cvec[0] - (-h * (2 * w1 * w2 + w2 ** 2))) == 0 and sp.simplify(Cvec[1] - h * w1 ** 2) == 0
    # M_dot - 2C is skew-symmetric (the property passivity-based control relies on)
    Cm = sp.zeros(2, 2)
    for i in range(2):
        for j in range(2):
            Cm[i, j] = sum(sp.Rational(1, 2) * (sp.diff(M[i, j], q[k]) + sp.diff(M[i, k], q[j]) - sp.diff(M[j, k], q[i])) * w[k] for k in range(2))
    Md = sum((sp.diff(M, q[k]) * w[k] for k in range(2)), sp.zeros(2, 2))
    S = sp.simplify(Md - 2 * Cm); assert sp.simplify(S + S.T) == sp.zeros(2, 2)

def test_energy_conserved():
    s, E = simulate(np.radians([60, -70]).tolist() + [0, 0])
    drift = np.abs(E - E[0]).max()
    print(f"falling from (60, -70) deg for 5 s: energy {E[0]:.4f} J, max drift {drift:.2e} J")
    assert drift < 1e-6 * abs(E).max() + 1e-7

def test_damping_dissipates():
    _, E = simulate(np.radians([60, -70]).tolist() + [0, 0], b=0.6)
    print(f"with the lab's joint damping b = 0.6: energy falls from {E[0]:.3f} to {E[-1]:.3f} J")
    assert np.all(np.diff(E) <= 1e-9)

test_matches_lab_model()
test_energy_conserved()
test_damping_dissipates()
print("PASS")
