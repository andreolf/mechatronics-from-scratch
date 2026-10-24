---
id: p12-l12
minutes: 40
summary: A two-wheeled self-balancing robot is an inverted pendulum whose base is driven through the wheels by a motor between wheel and body, so the same torque that moves the robot also twists the body back. You derive its equations with Lagrange's method, including the reaction torque on the body, linearise with lesson 10's Jacobian and test that the open-loop linear model is unstable with exactly the pole the hand formula predicts.
---

## The robot

A body of mass $m_b$, with centre of mass $L$ above the axle and inertia $I_b$ about it, sits on two wheels of radius $r$, total mass $m_w$ and total inertia $I_w$. A motor between body and wheels applies torque $\tau$ to the wheels and $-\tau$ to the body. States: wheel position $x = r\varphi$ and body tilt $\theta$ from vertical (both assumed planar, no slip). Values here are illustrative, roughly a small hobby robot: $r = 4$ cm, $m_w = 0.3$ kg, $I_w = \tfrac12 m_w r^2$, $m_b = 1$ kg, $L = 8$ cm, $I_b = m_b(0.16)^2/12$.

## Lagrange with a reaction torque

$$T = \tfrac12\left(m_w + m_b + \tfrac{I_w}{r^2}\right)\dot x^2 + m_bL\cos\theta\,\dot x\dot\theta + \tfrac12(I_b + m_bL^2)\dot\theta^2, \qquad V = m_bgL\cos\theta.$$

The motor does work at rate $\tau(\dot\varphi - \dot\theta)$, because it acts on the angle between wheel and body. So the generalised forces are $Q_x = \tau/r$ and $Q_\theta = -\tau$:

$$M_{11}\ddot x + m_bL\cos\theta\,\ddot\theta - m_bL\sin\theta\,\dot\theta^2 = \tau/r,$$

$$m_bL\cos\theta\,\ddot x + M_{22}\ddot\theta - m_bgL\sin\theta = -\tau,$$

with $M_{11} = m_w + m_b + I_w/r^2$ and $M_{22} = I_b + m_bL^2$.

It's the cart-pole of lesson 11 with two changes: the wheels' rotation adds effective mass $I_w/r^2$, and the drive torque pushes on the body directly as well as through the base.

## The open-loop pole

Linearised at upright with $\tau = 0$:

$$p^2 = \frac{m_bgL\,M_{11}}{M_{11}M_{22} - m_b^2L^2}.$$

For the values above $M_{11} = 1.45$ kg, $M_{22} = 8.53\times10^{-3}$ kg·m² and $p = 13.8$ s⁻¹: a tilt error doubles every 50 ms. Holding the wheels still would give $\sqrt{m_bgL/M_{22}} = 9.59$ s⁻¹. A short robot falls fast; the controller in Phase 14 needs a loop well above 14 rad/s.

:::figure widget=wipfall caption="The wheeled robot falling with no control from a small tilt. A constant motor torque drives the wheels one way and tips the body the other, which is why the robot must first drive under its own lean to recover."
:::end

## Worked example

Using the linear model, compute $A$ and $B$ for state $[x, \dot x, \theta, \dot\theta]$ and input $\tau$:

1. Invert the mass matrix at $\theta = 0$: $\Delta = M_{11}M_{22} - m_b^2L^2 = 0.01237 - 0.0064 = 5.97\times10^{-3}$.
2. $\ddot\theta = (M_{11} m_bgL\,\theta - M_{11}\tau - m_bL\tau/r)/\Delta$, so $A_{43} = p^2 = 190.5$ s⁻² and $B_4 = -(1.45 + 2)/\Delta = -578$ (N·m·s²)⁻¹.
3. The torque's sign: positive $\tau$ drives the wheels forward and tips the body back. That is non-minimum-phase behaviour, the first move must go the "wrong" way, and it limits how fast any controller can be.

## Code it from scratch

:::code file=wip.py
```python
import numpy as np

r, mw, mb, L, g = 0.04, 0.3, 1.0, 0.08, 9.81
Iw, Ib = 0.5 * mw * r ** 2, mb * 0.16 ** 2 / 12
M11, M22 = mw + mb + Iw / r ** 2, Ib + mb * L ** 2

def f(s, u):
    x, xd, th, thd = s; tau = u[0]
    Mm = np.array([[M11, mb * L * np.cos(th)], [mb * L * np.cos(th), M22]])
    rhs = np.array([tau / r + mb * L * np.sin(th) * thd ** 2, mb * g * L * np.sin(th) - tau])
    xdd, thdd = np.linalg.solve(Mm, rhs)
    return np.array([xd, xdd, thd, thdd])

def jacobians(f, x0, u0):
    def jac(g_, z):
        cols = []
        for j in range(len(z)):
            e = np.zeros(len(z)); e[j] = 1e-6
            cols.append((g_(z + e) - g_(z - e)) / 2e-6)
        return np.column_stack(cols)
    return jac(lambda x: f(x, u0), x0), jac(lambda u: f(x0, u), u0)

def rk4(s, u, dt, n):
    out = [s]
    for _ in range(n):
        k1 = f(s, u); k2 = f(s + dt / 2 * k1, u); k3 = f(s + dt / 2 * k2, u); k4 = f(s + dt * k3, u)
        s = s + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4); out.append(s)
    return np.array(out)

p_hand = np.sqrt(mb * g * L * M11 / (M11 * M22 - (mb * L) ** 2))

def test_linear_unstable_expected_pole():
    A, B = jacobians(f, np.zeros(4), np.zeros(1))
    ev = np.linalg.eigvals(A)
    print("eigenvalues:", np.round(np.sort_complex(ev), 4), f"; hand formula +-{p_hand:.4f}")
    assert np.max(ev.real) > 0                                  # unstable
    assert abs(np.max(ev.real) - p_hand) < 1e-5                 # exactly the predicted pole
    assert abs(np.min(ev.real) + p_hand) < 1e-5
    assert np.sum(np.abs(ev) < 1e-6) == 2                       # two integrators: position, and velocity drift
    delta = M11 * M22 - (mb * L) ** 2
    assert abs(A[3, 2] - p_hand ** 2) < 1e-4 and abs(B[3, 0] + (M11 + mb * L / r) / delta) < 1e-3
    print(f"A[3,2] = {A[3, 2]:.1f}, B[3] = {B[3, 0]:.0f}, wheels-held pole {np.sqrt(mb * g * L / M22):.2f}")

def test_nonlinear_falls_at_linear_rate():
    traj = rk4(np.array([0, 0, 1e-3, 0]), np.zeros(1), 1e-4, 6000)
    th = traj[:, 2]
    k = np.argmax(th > 0.05)
    t = k * 1e-4
    t_lin = np.arccosh(50) / p_hand
    print(f"tilt 1 mrad -> 0.05 rad in {t * 1000:.0f} ms (linear {t_lin * 1000:.0f} ms)")
    assert abs(t - t_lin) < 0.01

def test_torque_tips_body_backwards():
    traj = rk4(np.zeros(4), np.array([0.05]), 1e-4, 300)
    assert traj[-1, 1] > 0 and traj[-1, 2] < 0                 # wheels forward, body tilts back

def test_energy_with_no_torque():
    traj = rk4(np.array([0, 0, 0.2, 0]), np.zeros(1), 1e-4, 4000)
    E = [0.5 * M11 * s[1] ** 2 + mb * L * np.cos(s[2]) * s[1] * s[3] + 0.5 * M22 * s[3] ** 2 + mb * g * L * np.cos(s[2]) for s in traj]
    assert np.ptp(E) / E[0] < 1e-6

test_linear_unstable_expected_pole()
test_nonlinear_falls_at_linear_rate()
test_torque_tips_body_backwards()
test_energy_with_no_torque()
print("PASS")
```
:::end

## Exercises

:::exercise
If the motor is driven by voltage rather than torque, $\tau = k_t(V - k_e(\dot\varphi - \dot\theta))/R$. How does that change the model?
:::solution
The back-EMF term adds damping on the relative speed $\dot\varphi - \dot\theta = \dot x/r - \dot\theta$, which appears in both equations with opposite signs. The unstable pole moves a little but stays positive, because damping can't stabilise an upright pendulum on its own.
:::end

:::exercise
Would a taller body (larger $L$) be easier or harder to balance? Use the pole formula.
:::solution
Easier. For a slender body $p \approx \sqrt{g/L_{eff}}$, so doubling $L$ lowers $p$ by about $\sqrt2$, giving the controller more time. That's why it's easier to balance a broom than a pencil.
:::end

## Quiz

:::quiz
- type: num
  q: Effective translational mass M₁₁ in kg of the example robot?
  answer: 1.45
  tol: 0.001
  unit: kg
  py: "0.3+1.0+0.5*0.3"
  explain: m_w + m_b + I_w/r², with I_w/r² = m_w/2.
- type: num
  q: Open-loop unstable pole in 1/s?
  answer: 13.80
  tol: 0.003
  unit: 1/s
  py: "(1*9.81*0.08*1.45/(1.45*(1*0.16**2/12+1*0.08**2)-0.08**2))**0.5"
  explain: The formula above.
- type: num
  q: Time in ms for a tilt error to double at p = 13.8 s⁻¹?
  answer: 50.2
  tol: 0.01
  unit: ms
  py: "1000*0.6931/13.8"
  explain: ln 2/p.
- type: num
  q: Number of zero eigenvalues of the open-loop linear model?
  answer: 2
  tol: 0
  py: "2"
  explain: Position and wheel velocity drift freely.
- type: mc
  q: Why does the body's equation contain −τ?
  options:
    - the motor's reaction torque acts on the body
    - friction
    - gravity
    - it's a sign error
  answer: 0
  explain: The motor sits between wheel and body.
- type: mc
  q: A positive torque step initially makes the body…
  options:
    - tilt back, away from the direction of travel
    - tilt forward
    - stay still
    - jump
  answer: 0
  explain: The reaction torque acts first.
:::end
