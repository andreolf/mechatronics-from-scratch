---
id: p12-l11
minutes: 45
summary: The cart-pole, a pole hinged on a cart that a force pushes along a rail, is the standard benchmark for balance control and the model behind the site's live pendulum lab. You derive its coupled nonlinear equations with Lagrange's method, check them against the closed form the live lab uses, simulate with RK4 and test that total energy stays constant when there's no friction and no force.
---

## The system

A cart of mass $M$ moves along $x$, pushed by force $F$. A uniform pole of mass $m$ and half-length $\ell$ (so its centre of mass is $\ell$ from the hinge, and its inertia about that centre is $I = m\ell^2/3$) is hinged on top. $\theta$ is measured from upright, positive clockwise in the direction of $+x$. The [live pendulum lab](#lab-pendulum) uses exactly this model, with $M = 0.8$ kg, $m = 0.25$ kg, $\ell = 0.45$ m (illustrative values).

## Lagrange's equations

The pole's centre of mass is at $(x + \ell\sin\theta,\ \ell\cos\theta)$, so

$$T = \tfrac12 (M + m)\dot x^2 + m\ell\cos\theta\,\dot x\dot\theta + \tfrac12 (I + m\ell^2)\dot\theta^2, \qquad V = mg\ell\cos\theta.$$

With $L = T - V$ and the force $F$ doing work on $x$ only, lesson 04's recipe gives

$$(M + m)\ddot x + m\ell\cos\theta\,\ddot\theta - m\ell\sin\theta\,\dot\theta^2 = F,$$

$$m\ell\cos\theta\,\ddot x + (I + m\ell^2)\ddot\theta - mg\ell\sin\theta = 0.$$

Solve the 2×2 linear system for $\ddot x$ and $\ddot\theta$ at each step. The coupling is the point: pushing the cart accelerates the pole, and a falling pole pushes the cart back.

## Linearised at upright

For small $\theta$ and with $F = 0$, eliminating $\ddot x$ gives $\ddot\theta = p^2\theta$ with

$$p^2 = \frac{mg\ell(M + m)}{(I + m\ell^2)(M + m) - m^2\ell^2}.$$

For the lab's values $p = 4.46$ s⁻¹. If the cart were bolted down the result would be $\sqrt{g/(\tfrac43\ell)} = 4.04$ s⁻¹: a free cart that slides away from the pole lets it fall faster.

:::figure widget=cartpole caption="The cart-pole falling from near upright with no control and no friction. The energy readout stays constant while kinetic and potential energy trade places. Use the start angle to see how a smaller start delays, but does not prevent, the fall."
:::end

## Worked example

From $\theta_0 = 0.01$ rad (0.57°) with the lab's values:

1. The linear model grows as $\theta_0\cosh(pt)$. It reaches 0.5 rad when $\cosh(4.46t) = 50$, so $t = \operatorname{arccosh}(50)/4.46 = 1.03$ s.
2. Halving the start angle adds only $\ln 2/p = 0.16$ s. This is why balance needs fast feedback, not careful placement.
3. The energy when hanging at $\theta = \pi$ at rest would be $-mg\ell$; starting near upright the energy is $+mg\ell = 1.10$ J, and with no friction the pole swings all the way round, forever.

## Code it from scratch

:::code file=cartpole.py
```python
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
```
:::end

## Exercises

:::exercise
Show that horizontal momentum $(M + m)\dot x + m\ell\cos\theta\,\dot\theta$ is conserved when $F = 0$.
:::solution
$L$ doesn't depend on $x$, so Lagrange's equation for $x$ says $\frac{d}{dt}\frac{\partial L}{\partial \dot x} = F = 0$, and $\partial L/\partial \dot x$ is exactly that expression. The test checks it numerically too.
:::end

:::exercise
Model the pole as a point mass at the tip instead (so $I = 0$ and the mass is at distance $2\ell$). How does the unstable pole change?
:::solution
Replace $\ell$ by $L = 2\ell = 0.9$ m and $I + m\ell^2$ by $mL^2$. Then $p^2 = g(M + m)/(L M) = 9.81 \times 1.05/(0.9 \times 0.8) = 14.3$, so $p = 3.78$ s⁻¹, slower than the rod, because more of the mass sits far from the hinge.
:::end

## Quiz

:::quiz
- type: num
  q: Unstable pole in 1/s of the lab's cart-pole (M = 0.8, m = 0.25, ℓ = 0.45)?
  answer: 4.461
  tol: 0.001
  unit: 1/s
  py: "(0.25*9.81*0.45*1.05/((4/3*0.25*0.45**2)*1.05-(0.25*0.45)**2))**0.5"
  explain: The formula derived above.
- type: num
  q: The same with the cart held fixed?
  answer: 4.044
  tol: 0.001
  unit: 1/s
  py: "(9.81/(4/3*0.45))**0.5"
  explain: sqrt(g/(4ℓ/3)) for a uniform rod.
- type: num
  q: Inertia in kg·m² of the pole about its hinge, I + mℓ²?
  answer: 0.0675
  tol: 0.001
  unit: kg·m²
  py: "4/3*0.25*0.45**2"
  explain: (4/3) m ℓ².
- type: num
  q: Extra time in s to fall if the start angle is halved (p = 4.46)?
  answer: 0.155
  tol: 0.01
  unit: s
  py: "0.6931/4.46"
  explain: ln 2 / p.
- type: mc
  q: Which quantity is conserved when F = 0 and there's no friction?
  options:
    - total energy and horizontal momentum
    - only the pole angle
    - cart velocity
    - nothing
  answer: 0
  explain: Time invariance gives energy; x not appearing in L gives momentum.
- type: mc
  q: Why is the cart-pole hard to balance by careful placement?
  options:
    - the deviation grows exponentially, so tiny errors become large quickly
    - the cart is heavy
    - gravity varies
    - the equations are linear
  answer: 0
  explain: Unstable pole at 4.46 s⁻¹.
:::end
