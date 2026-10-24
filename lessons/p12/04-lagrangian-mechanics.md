---
id: p12-l04
minutes: 40
summary: The Lagrangian method writes kinetic minus potential energy in whatever coordinates suit the problem and gets the equations of motion by differentiation, with no free-body diagrams and no constraint forces. You derive the Euler-Lagrange equations, use SymPy to derive the double pendulum's equations of motion automatically, check them against the textbook closed form, and test that a simulation conserves energy while the motion itself is chaotic.
---

## L = T − V

Pick **generalised coordinates** $q$, as many as the system's degrees of freedom: two angles for a double pendulum, not four Cartesian positions with two length constraints. Write the kinetic energy $T(q, \dot q)$ and potential energy $V(q)$, and form the **Lagrangian** $L = T - V$. Then for each coordinate

$$\frac{d}{dt}\frac{\partial L}{\partial \dot q_i} - \frac{\partial L}{\partial q_i} = Q_i,$$

where $Q_i$ are the generalised forces that aren't in $V$ (motor torques, friction). Constraint forces, such as the rod tension, never appear: they do no work along the allowed motion.

## The double pendulum

Two point masses $m_1, m_2$ on massless rods $\ell_1, \ell_2$, angles $\theta_1, \theta_2$ from the vertical. Positions: $x_1 = \ell_1\sin\theta_1$, $y_1 = -\ell_1\cos\theta_1$, $x_2 = x_1 + \ell_2\sin\theta_2$, $y_2 = y_1 - \ell_2\cos\theta_2$. Then

$$T = \tfrac12 m_1\ell_1^2\dot\theta_1^2 + \tfrac12 m_2\left[\ell_1^2\dot\theta_1^2 + \ell_2^2\dot\theta_2^2 + 2\ell_1\ell_2\dot\theta_1\dot\theta_2\cos(\theta_1 - \theta_2)\right],$$
$$V = -(m_1 + m_2) g \ell_1\cos\theta_1 - m_2 g\ell_2\cos\theta_2.$$

Doing the derivatives by hand takes a page and is easy to get wrong. A computer algebra system does it reliably: that's the practical reason the method scales to robot arms.

## Energy as a test

Without friction, the total energy $E = T + V$ is constant. That makes it a sharp test of both the derived equations (a sign error usually breaks conservation) and the integrator. It doesn't test everything: chaos means two nearly identical starts diverge, so you can't check the trajectory itself against anything after a few seconds.

:::figure widget=doublependulum caption="Two double pendulums released from almost identical angles. With enough energy to tumble, the traces separate after several seconds (chaos) while each one's energy stays constant."
:::end

## Worked example

$m_1 = m_2 = 1$ kg, $\ell_1 = \ell_2 = 1$ m, released at rest from $\theta_1 = 90°$, $\theta_2 = 0°$.

1. At release $T = 0$ and $V = -(2)(9.81)(1)\cos 90° - (1)(9.81)(1)\cos 0° = -9.81$ J.
2. So $E = -9.81$ J for all time, relative to the pivot.
3. The lowest possible energy (both hanging down, at rest) is $-3 \times 9.81 = -29.43$ J; the pendulum has 19.6 J to play with, enough to flip the lower arm over.

## Code it from scratch

:::code file=double_pendulum.py
```python
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
```
:::end

## Exercises

:::exercise
Add a motor torque $\tau$ at the first joint. Where does it go in the Euler-Lagrange equations?
:::solution
As the generalised force for $\theta_1$: the right-hand side of the first equation becomes $\tau$, the second stays 0. A torque at the second joint acts between the links, so it appears as $Q_1 = -\tau_2$, $Q_2 = +\tau_2$ (with absolute angles), which follows from the virtual work $\tau_2\,\delta(\theta_2 - \theta_1)$.
:::end

:::exercise
Why does a smaller time step make the energy error shrink, but the chaotic trajectory still not "converge" over 30 s?
:::solution
RK4's local error falls as $dt^5$, so energy drift becomes tiny. But any error, even rounding at $10^{-16}$, is amplified exponentially by chaos; after enough seconds two step sizes give completely different trajectories, both conserving energy. You can trust statistics and invariants of a chaotic simulation, not its long-term path.
:::end

## Quiz

:::quiz
- type: num
  q: Energy in J of the worked-example pendulum released at θ₁ = 60°, θ₂ = 0?
  answer: -19.62
  tol: 0.001
  unit: J
  py: "-2*9.81*__import__('math').cos(__import__('math').pi/3) - 9.81"
  explain: V = −(m₁+m₂)gℓ₁cos θ₁ − m₂gℓ₂cos θ₂.
- type: num
  q: Lowest possible energy in J of the worked-example pendulum?
  answer: -29.43
  tol: 0.001
  unit: J
  py: "-3*9.81"
  explain: Both links hanging, at rest.
- type: num
  q: Degrees of freedom of a planar triple pendulum?
  answer: 3
  tol: 0
  py: "3"
  explain: One angle per link.
- type: num
  q: Small-angle period in s of a single 1 m pendulum (g = 9.81)?
  answer: 2.006
  tol: 0.001
  unit: s
  py: "2*__import__('math').pi*(1/9.81)**0.5"
  explain: 2π sqrt(ℓ/g), a quick sanity check for any pendulum model.
- type: mc
  q: Why don't the rod tensions appear in the Lagrangian equations?
  options:
    - constraint forces do no work along the motion the coordinates allow
    - they are zero
    - they are included in V
    - they are approximated away
  answer: 0
  explain: Generalised coordinates satisfy the constraints automatically.
- type: mc
  q: What does energy conservation in the simulation prove?
  options:
    - the equations and integrator are consistent, but not that the trajectory is accurate long-term
    - the trajectory is exact
    - the system is not chaotic
    - nothing
  answer: 0
  explain: Chaos still amplifies tiny errors.
:::end
