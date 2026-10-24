---
id: p15-l13
minutes: 45
summary: The Lagrangian method gets an arm's equations of motion from two scalar energies, and writes them in the standard form M(q) times q double-dot plus C(q, q dot) q dot plus g(q) equals tau. You derive the kinetic and potential energy of the arm lab's 2-link arm, let SymPy build the mass matrix, the Christoffel-symbol Coriolis terms and the gravity vector, simulate the arm falling, and test that energy is conserved without damping and dissipated with it.
---

## From energies to equations

For generalised coordinates $q$, the **Lagrangian** is $\mathcal L = T - V$, kinetic minus potential energy. The equations of motion are

$$\frac{d}{dt}\frac{\partial\mathcal L}{\partial\dot q_i} - \frac{\partial\mathcal L}{\partial q_i} = \tau_i.$$

No constraint forces appear: the joints' reaction forces do no work, so they never enter. That is the method's big advantage over free-body diagrams.

## Energies of a 2-link arm

Each link's kinetic energy is that of its centre of mass plus its spin about it:

$$T = \sum_i \tfrac12 m_i\|v_{c_i}\|^2 + \tfrac12 I_i\omega_i^2, \qquad \omega_1 = \dot q_1, \;\; \omega_2 = \dot q_1 + \dot q_2.$$

Since $v_{c_i} = J_{c_i}(q)\dot q$, $T = \tfrac12\dot q^TM(q)\dot q$ with $M = \sum_i m_iJ_{c_i}^TJ_{c_i} + \ldots$: the **mass matrix** is the Hessian of $T$ in $\dot q$. Potential energy is $V = \sum_i m_ig\,y_{c_i}$, and $g(q) = \partial V/\partial q$.

## Christoffel symbols

Expanding the Lagrange equations gives $M\ddot q + C(q, \dot q)\dot q + g(q) = \tau$ with

$$[C(q, \dot q)\dot q]_i = \sum_{j,k} c_{ijk}\,\dot q_j\dot q_k, \qquad c_{ijk} = \tfrac12\left(\frac{\partial M_{ij}}{\partial q_k} + \frac{\partial M_{ik}}{\partial q_j} - \frac{\partial M_{jk}}{\partial q_i}\right).$$

The $\dot q_j^2$ terms are centrifugal and the $\dot q_j\dot q_k$ terms Coriolis. With this choice of $C$, $\dot M - 2C$ is skew-symmetric, a property used by passivity-based controllers and in the energy argument below.

:::figure widget=armfall caption="The arm lab's arm released from rest with no motor torque. The lower plot tracks kinetic, potential and total energy. Without damping the total stays flat; switch on the lab's joint damping and it drains away."
:::end

## Worked example

For the [arm lab](#lab-arm)'s arm ($\ell = (1.0, 0.8)$ m, $m = (1.5, 1.0)$ kg, uniform rods), SymPy finds

1. $M_{11} = 1.7133 + 0.8\cos q_2$, $M_{12} = 0.2133 + 0.4\cos q_2$, $M_{22} = 0.2133$ kg·m².
2. $C\dot q = 0.4\sin q_2\,\big({-(2\dot q_1\dot q_2 + \dot q_2^2)},\; \dot q_1^2\big)$.
3. $g = \big(17.17\cos q_1 + 3.924\cos(q_1 + q_2),\; 3.924\cos(q_1 + q_2)\big)$ N·m.
4. These are exactly the terms the lab integrates. At $q_2 = -70°$, $M_{11} = 1.987$, the same as lesson 12's RNEA.
5. Released from $(60°, -70°)$, the total energy of 14.186 J drifts by only $3 \times 10^{-7}$ J over 5 s of RK4 at 1 ms. With $b = 0.6$ N·m·s/rad it falls monotonically as the arm settles hanging down.

## Code it from scratch

:::code file=lagrange_arm.py
```python
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
```
:::end

## Exercises

:::exercise
Show that with $\tau = -b\dot q$ the energy can only fall.
:::solution
$\dot E = \dot q^TM\ddot q + \tfrac12\dot q^T\dot M\dot q + \dot q^Tg = \dot q^T(\tau - C\dot q - g) + \tfrac12\dot q^T\dot M\dot q + \dot q^Tg = \dot q^T\tau + \tfrac12\dot q^T(\dot M - 2C)\dot q$. The last term is zero by skew-symmetry, so $\dot E = -b\|\dot q\|^2 \le 0$.
:::end

:::exercise
Why does $M$ depend on $q_2$ but not on $q_1$?
:::solution
Turning the whole arm about the shoulder ($q_1$) changes nothing about how the mass is arranged relative to the shoulder, so the inertia is the same. Bending the elbow ($q_2$) moves the forearm's mass closer to or further from the shoulder: $M_{11}$ is largest with the arm straight ($\cos q_2 = 1$).
:::end

## Quiz

:::quiz
- type: num
  q: M11 of the lab arm with the elbow straight (q2 = 0)?
  answer: 2.5133
  tol: 0.002
  unit: kg·m²
  py: "257/150+0.8"
  explain: The forearm is as far from the shoulder as it can be.
- type: num
  q: M11 of the lab arm at q2 = 90°?
  answer: 1.7133
  tol: 0.002
  unit: kg·m²
  py: "257/150"
  explain: cos q2 = 0.
- type: num
  q: Coefficient of cos q1 in the shoulder gravity torque?
  answer: 17.1675
  tol: 0.002
  unit: N·m
  py: "(1.5*0.5+1.0*1.0)*9.81"
  explain: (m1 lc1 + m2 l1) g.
- type: num
  q: Potential energy change when the 1.0 kg forearm's centre drops 0.5 m?
  answer: -4.905
  tol: 0.002
  unit: J
  py: "-1.0*9.81*0.5"
  explain: m g Δy.
- type: mc
  q: Constraint forces in the joints do not appear in the Lagrange equations because…
  options:
    - they do no work on motions the joints allow
    - they are small
    - gravity cancels them
    - they act only at rest
  answer: 0
  explain: Generalised coordinates satisfy the constraints automatically.
- type: mc
  q: Terms in C q-dot proportional to q-dot1 times q-dot2 are called…
  options:
    - Coriolis terms
    - centrifugal terms
    - gravity terms
    - friction terms
  answer: 0
  explain: Squared terms are centrifugal.
:::end
