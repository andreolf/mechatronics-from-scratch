---
id: p14-l08
minutes: 40
summary: Plain LQR is a proportional controller on the state, so a constant load or a model error leaves a steady offset. You add the integral of the tracking error as an extra state, design one LQR for the augmented system, and test on the lab motor that the speed error goes to zero under a load torque and with a wrong motor model, where LQR with a prefilter leaves an offset.
---

## Why LQR alone leaves an offset

$u = -Kx + \bar Nr$ with the prefilter $\bar N$ chosen so the DC gain from $r$ to $y$ is 1 works only for the exact model and no disturbance. A load torque needs a steady extra voltage, and proportional state feedback only produces that from a steady error.

## Augment with the integral

Add $z$ with $\dot z = r - y = r - Cx$:

$$\frac{d}{dt}\begin{bmatrix}x\\ z\end{bmatrix} = \underbrace{\begin{bmatrix}A & 0\\ -C & 0\end{bmatrix}}_{A_a}\begin{bmatrix}x\\ z\end{bmatrix} + \underbrace{\begin{bmatrix}B\\ 0\end{bmatrix}}_{B_a}u + \begin{bmatrix}0\\ 1\end{bmatrix}r.$$

Design LQR on $(A_a, B_a)$ with a weight on $z$, giving $u = -K_xx - k_zz$. If the closed loop is stable, every state settles, so $\dot z = 0$: $y = r$ exactly, whatever constant load or modelling error is present. That's the integral action of PI, derived as an optimal design. Requirement: $(A_a, B_a)$ controllable, which fails if the plant has a zero at $s = 0$.

:::figure widget=lqi caption="The lab motor's speed loop under LQR with a prefilter and under LQR with integral action. At 0.3 s a load torque arrives: the prefiltered design settles with an offset, the integral design returns to the target. Change the load and the motor's resistance to see which design cares."
:::end

## Worked example

Motor $(i, \omega)$ from the lab: $R = 1.2$ Ω, $L = 2$ mH, $k = 0.05$, $J = 2\times10^{-4}$. Weights $Q = \mathrm{diag}(0, 10^{-3}, 50)$ on $(i, \omega, z)$, $R = 10^{-3}$.

1. LQI: $K_x = (0.663, 2.03)$ and an integral gain of 223.6 V per rad of accumulated error. Poles $-552$ and $-190 \pm 121j$ rad/s.
2. 200 rad/s target, 0.05 N·m load at 0.3 s: LQI returns to 200.000; LQR with the same state weights and a prefilter settles at 198.5 rad/s.
3. With $R$ 30 % high or $J$ doubled in the real motor, LQI still settles at exactly 200 rad/s.

## Code it from scratch

:::code file=lqi_motor.py
```python
import numpy as np
from scipy.linalg import solve_continuous_are

R_, L_, k_, J_, b_ = 1.2, 0.002, 0.05, 2e-4, 2e-5           # the lab motor
def motor(R=R_, J=J_):
    """x = [i, w], u = V, load torque enters the speed equation"""
    A = np.array([[-R / L_, -k_ / L_], [k_ / J, -b_ / J]]); B = np.array([[1 / L_], [0.0]])
    E = np.array([0.0, -1 / J]); C = np.array([[0.0, 1.0]])
    return A, B, C, E

def lqi(A, B, C, Q, R):
    """augment with z' = r - y and solve one LQR for [x, z]"""
    n = len(A)
    Aa = np.block([[A, np.zeros((n, 1))], [-C, np.zeros((1, 1))]]); Ba = np.vstack([B, [[0.0]]])
    P = solve_continuous_are(Aa, Ba, Q, R); K = np.linalg.solve(R, Ba.T @ P)[0]
    return K[:n], K[n]

def lqr_with_prefilter(A, B, C, Q, R):
    P = solve_continuous_are(A, B, Q, R); K = np.linalg.solve(R, B.T @ P)[0]
    Nbar = 1.0 / (C @ np.linalg.solve(-(A - B @ K[None, :]), B)).item()   # unit DC gain from r to y
    return K, Nbar

Q = np.diag([0.0, 1e-3, 50.0]); Rw = np.array([[1e-3]])

def simulate(ctrl, plant=None, r=200.0, load=0.05, t_load=0.3, T=0.8, dt=2e-5):
    A, B, C, E = plant or motor()
    x = np.zeros(2); z = 0.0; ys = []
    for n in range(int(T / dt)):
        t = n * dt; y = x[1]
        u = ctrl(x, z, r)
        tl = load if t >= t_load else 0.0
        f = lambda x: A @ x + B[:, 0] * u + E * tl
        k1 = f(x); k2 = f(x + dt / 2 * k1); k3 = f(x + dt / 2 * k2); k4 = f(x + dt * k3)
        x = x + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4); z += dt * (r - y); ys.append(x[1])
    return np.array(ys)

def test_lqi_zero_steady_error():
    A, B, C, _ = motor()
    Kx, kz = lqi(A, B, C, Q, Rw)
    Klq, Nbar = lqr_with_prefilter(A, B, C, Q[:2, :2], Rw)       # same state weights, no integral
    y_i = simulate(lambda x, z, r: -Kx @ x - kz * z)
    y_p = simulate(lambda x, z, r: -Klq @ x + Nbar * r)
    print(f"LQI gains Kx = {np.round(Kx, 4)}, integral gain -kz = {-kz:.2f} V per rad")
    print(f"before the load: LQI {y_i[14999]:.3f}, LQR + prefilter {y_p[14999]:.3f} rad/s")
    print(f"after a 0.05 N·m load: LQI {y_i[-1]:.4f} rad/s, LQR + prefilter {y_p[-1]:.2f} rad/s (target 200)")
    assert abs(y_i[-1] - 200) < 1e-3 and abs(y_p[-1] - 200) > 1.0

def test_robust_to_model_error():
    A, B, C, _ = motor(); Kx, kz = lqi(A, B, C, Q, Rw)
    for name, plant in (("R +30 %", motor(R=1.56)), ("J x2", motor(J=4e-4))):
        y = simulate(lambda x, z, r: -Kx @ x - kz * z, plant=plant, T=1.2)
        print(f"LQI on the wrong plant ({name}): final speed {y[-1]:.4f} rad/s")
        assert abs(y[-1] - 200) < 1e-2

def test_augmented_poles_stable():
    A, B, C, _ = motor(); Kx, kz = lqi(A, B, C, Q, Rw)
    Aa = np.block([[A - B @ Kx[None, :], -B * kz], [-C, np.zeros((1, 1))]])
    lam = np.linalg.eigvals(Aa)
    print("closed-loop poles:", np.round(np.sort_complex(lam), 1))
    assert np.all(lam.real < 0)

test_lqi_zero_steady_error()
test_robust_to_model_error()
test_augmented_poles_stable()
print("PASS")
```
:::end

## Exercises

:::exercise
What happens to the LQI if the actuator saturates for a long time?
:::solution
$z$ keeps integrating while the input is pinned: integrator windup, just as in Phase 13. Apply the same fixes: stop integrating while saturated in the direction that worsens it, or back-calculate from the saturated input.
:::end

:::exercise
Why does a weight of zero on $z$ fail?
:::solution
Then the cost doesn't care about the integral, and the optimal gain on $z$ is zero: the integrator state is uncontrolled and sits on the imaginary axis (detectability fails). You need $Q_z > 0$ to make the integral matter.
:::end

## Quiz

:::quiz
- type: num
  q: How many states does the augmented system have for a 2-state motor with one integrated output?
  answer: 3
  tol: 0.001
  py: "2+1"
  explain: x plus the integral z.
- type: num
  q: Steady voltage in V needed to hold 200 rad/s against 0.05 N·m (R = 1.2, k = 0.05, b = 2e-5)?
  answer: 11.296
  tol: 0.001
  unit: V
  py: "1.2*(0.05+2e-5*200)/0.05+0.05*200"
  explain: V = R i + k ω with i = (τ_L + bω)/k.
- type: num
  q: LQR plus prefilter error in rad/s under the load in the worked example?
  answer: 1.54
  tol: 0.02
  unit: rad/s
  py: "200-198.46"
  explain: Proportional feedback needs an error to make the extra voltage.
- type: num
  q: Steady-state error of the LQI under that load?
  answer: 0
  tol: 0.001
  py: "0"
  explain: ż = 0 forces y = r.
- type: mc
  q: Integral action fails to be possible when the plant…
  options:
    - has a zero at s = 0
    - is unstable
    - has two states
    - is a motor
  answer: 0
  explain: The augmented pair is then uncontrollable.
- type: mc
  q: Why is LQR with a prefilter sensitive to model error even without load?
  options:
    - the prefilter is computed from the model's DC gain
    - LQR is unstable
    - the prefilter integrates
    - the weights change
  answer: 0
  explain: A wrong DC gain gives a wrong steady state.
:::end
