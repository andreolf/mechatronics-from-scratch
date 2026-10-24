---
id: p15-l15
minutes: 40
summary: Impedance control stops treating contact as a disturbance and instead makes the robot's tool behave like a spring and damper you design, so a person can push it away and it springs back. You derive the Cartesian impedance law tau = J transpose (K (x_d minus x) minus D x dot) plus g(q), run it on the arm lab's arm with different stiffnesses sideways and vertically, push the tool, and test that the measured deflection matches K inverse times the force.
---

## Position control versus contact

A stiff position controller fights anything that pushes the tool. Against a rigid surface it either damages something or saturates. People sharing a workspace with a robot, a peg going into a hole, or a polishing tool on a curved part all need the opposite: a controlled relationship between force and motion. That relationship is the **impedance**.

## A spring at the tool

Choose a desired stiffness $K$ and damping $D$ (both $2 \times 2$ here, symmetric and positive definite) about a rest point $x_d$. The force the controller should apply at the tool is $F = K(x_d - x) - D\dot x$, and lesson 10 says the joint torques for a tool force are $J^TF$. Add gravity compensation:

$$\tau = J(q)^T\big(K(x_d - x) - D\dot x\big) + g(q).$$

At rest with an external force $F_{ext}$ on the tool, the arm settles where the virtual spring balances it:

$$K(x_d - x) + F_{ext} = 0 \quad\Rightarrow\quad x - x_d = K^{-1}F_{ext}.$$

The robot's own inertia remains: this simple form shapes stiffness and damping but not mass. Full impedance control also reshapes the apparent inertia, which needs a force sensor or the full dynamics model.

:::figure widget=impedance caption="Push the arm lab's tool with a force and release it: the tool deflects by the designed amount and springs back. Change the stiffness to make the arm feel soft or stiff, and push diagonally to see that the deflection doesn't line up with a push when the stiffness differs by direction."
:::end

## Worked example

The [arm lab](#lab-arm)'s arm at its start pose, with $K = \mathrm{diag}(300, 800)$ N/m (soft sideways, stiff vertically) and $D = \mathrm{diag}(40, 60)$ N·s/m:

1. Push 10 N in $+x$ for 2 s: the tool settles 33.33 mm sideways ($10/300$) and springs back on release, without overshoot at this damping.
2. Push 10 N downwards: 12.5 mm ($10/800$).
3. Push $(6, 8)$ N: the tool moves $(20, 10)$ mm, not parallel to the push, because the soft direction gives more. The effective stiffness along the push is $\|F\|^2/(F \cdot \Delta x) = 100/0.2 = 500$ N/m.
4. All three match $K^{-1}F$ to within 0.2 mm in the nonlinear simulation, including the lab's joint friction.

## Code it from scratch

:::code file=impedance.py
```python
import numpy as np

L1, L2, M1, M2, G, B = 1.0, 0.8, 1.5, 1.0, 9.81, 0.6        # the arm lab's arm and joint damping
lc1, lc2, I1, I2 = L1 / 2, L2 / 2, M1 * L1 ** 2 / 12, M2 * L2 ** 2 / 12

def fk(q): return np.array([L1 * np.cos(q[0]) + L2 * np.cos(q[0] + q[1]), L1 * np.sin(q[0]) + L2 * np.sin(q[0] + q[1])])
def jac(q):
    s1, c1, s12, c12 = np.sin(q[0]), np.cos(q[0]), np.sin(q[0] + q[1]), np.cos(q[0] + q[1])
    return np.array([[-L1 * s1 - L2 * s12, -L2 * s12], [L1 * c1 + L2 * c12, L2 * c12]])
def dyn(q, qd):
    c2, s2 = np.cos(q[1]), np.sin(q[1])
    M = np.array([[M1 * lc1 ** 2 + I1 + M2 * (L1 ** 2 + lc2 ** 2 + 2 * L1 * lc2 * c2) + I2, M2 * (lc2 ** 2 + L1 * lc2 * c2) + I2],
                  [M2 * (lc2 ** 2 + L1 * lc2 * c2) + I2, M2 * lc2 ** 2 + I2]])
    h = M2 * L1 * lc2 * s2
    c = np.array([-h * (2 * qd[0] * qd[1] + qd[1] ** 2), h * qd[0] ** 2]) + B * qd
    g = np.array([(M1 * lc1 + M2 * L1) * G * np.cos(q[0]) + M2 * lc2 * G * np.cos(q[0] + q[1]), M2 * lc2 * G * np.cos(q[0] + q[1])])
    return M, c, g

def impedance(q, qd, x_d, K, D):
    """Cartesian spring and damper at the tool, plus gravity compensation: tau = J^T (K (x_d - x) - D x_dot) + g"""
    J = jac(q); x, xd = fk(q), J @ qd
    return J.T @ (K @ (x_d - x) - D @ xd) + dyn(q, qd)[2]

def simulate(K, D, push, T=4.0, dt=5e-4, q0=np.radians([60, -70])):
    """push(t) is an external force on the tool; it enters the dynamics as J^T F"""
    q, qd = q0.copy(), np.zeros(2); x_d = fk(q0); xs = []
    def f(q, qd, t):
        tau = impedance(q, qd, x_d, K, D) + jac(q).T @ push(t)
        M, c, g = dyn(q, qd); return qd, np.linalg.solve(M, tau - c - g)
    for i in range(int(T / dt)):
        t = i * dt
        a1, b1 = f(q, qd, t); a2, b2 = f(q + dt / 2 * a1, qd + dt / 2 * b1, t + dt / 2)
        a3, b3 = f(q + dt / 2 * a2, qd + dt / 2 * b2, t + dt / 2); a4, b4 = f(q + dt * a3, qd + dt * b3, t + dt)
        q = q + dt / 6 * (a1 + 2 * a2 + 2 * a3 + a4); qd = qd + dt / 6 * (b1 + 2 * b2 + 2 * b3 + b4)
        xs.append(fk(q) - x_d)
    return np.array(xs), dt

K = np.diag([300.0, 800.0])          # N/m: soft sideways, stiff vertically
D = np.diag([40.0, 60.0])            # N s/m

def test_stiffness_matches_design():
    for F in (np.array([10.0, 0.0]), np.array([0.0, -10.0]), np.array([6.0, 8.0])):
        xs, dt = simulate(K, D, lambda t, F=F: F if 0.5 <= t < 2.5 else np.zeros(2))
        held = xs[int(2.4 / dt)]
        expect = np.linalg.solve(K, F)
        k_eff = F @ F / (F @ held)
        print(f"push {F} N: deflection {np.round(held * 1000, 2)} mm (design {np.round(expect * 1000, 2)}), effective stiffness along the push {k_eff:.1f} N/m")
        assert np.allclose(held, expect, atol=2e-4)
        assert np.abs(xs[-1]).max() < 1e-3          # springs back after release

def test_settles_like_a_damped_spring():
    xs, dt = simulate(K, D, lambda t: np.array([10.0, 0.0]) if 0.5 <= t < 2.5 else np.zeros(2))
    over = max(0.0, -xs[int(2.5 / dt):, 0].min() / xs[int(2.4 / dt), 0])
    print(f"after release the tool overshoots by {over * 100:.1f} % in x")
    assert over < 0.2

test_stiffness_matches_design()
test_settles_like_a_damped_spring()
print("PASS")
```
:::end

## Exercises

:::exercise
How do you choose $D$ for a critically damped feel?
:::solution
Along each direction the tool behaves roughly like $m_{eff}\ddot x + D\dot x + Kx = F$, with $m_{eff}$ the arm's apparent mass at the tool, $(JM^{-1}J^T)^{-1}$. Critical damping needs $D = 2\sqrt{Km_{eff}}$. Since $m_{eff}$ changes with pose, practical controllers recompute $D$ online, or accept some variation.
:::end

:::exercise
What happens if the tool touches a rigid wall a little beyond $x_d$?
:::solution
The arm presses on the wall with force $K\delta$, where $\delta$ is the distance from the wall to $x_d$, then stops. Unlike a stiff position controller, the contact force is set by your design. Making $K$ small in the direction normal to the wall gives a gentle, predictable push.
:::end

## Quiz

:::quiz
- type: num
  q: Deflection under a 10 N push with K = 300 N/m?
  answer: 33.33
  tol: 0.002
  unit: mm
  py: "10/300*1000"
  explain: F/K.
- type: num
  q: Force needed to deflect the tool 5 mm vertically with K = 800 N/m?
  answer: 4
  tol: 0.001
  unit: N
  py: "800*0.005"
  explain: K Δx.
- type: num
  q: Effective stiffness along a (6, 8) N push for K = diag(300, 800)?
  answer: 500
  tol: 0.001
  unit: N/m
  py: "100/(6*6/300+8*8/800)"
  explain: The squared magnitude of F over F·Δx.
- type: num
  q: Critical damping for K = 300 N/m and an apparent mass of 2 kg?
  answer: 48.99
  tol: 0.002
  unit: N·s/m
  py: "2*math.sqrt(300*2)"
  explain: 2√(K m).
- type: mc
  q: The impedance law maps the virtual spring force to joint torques using…
  options:
    - the Jacobian transpose
    - the Jacobian inverse
    - the mass matrix
    - inverse kinematics
  answer: 0
  explain: Statics, lesson 10.
- type: mc
  q: The simple law tau = J transpose F plus g shapes…
  options:
    - stiffness and damping, but not the apparent inertia
    - inertia only
    - nothing, unless a force sensor is used
    - only gravity
  answer: 0
  explain: The arm's own mass remains.
:::end
