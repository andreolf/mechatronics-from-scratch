---
id: p13-l02
minutes: 30
summary: Disturbances such as a load torque on a motor push the output away from its target, and while open-loop control can't see them, feedback divides their effect by one plus the loop gain. You derive the disturbance transfer function for a DC motor speed loop, simulate a load-torque step with fixed voltage and with proportional feedback, and test that the speed drop shrinks by exactly the predicted factor.
---

## A motor under load

From lesson p12-l06, a DC motor with negligible inductance obeys

$$J\dot\omega = \frac{k}{R}(V - k\omega) - b\omega - \tau_L.$$

The [live motor lab](#lab-motor) uses $R = 1.2$ Ω, $k = 0.05$ N·m/A, $J = 2\times10^{-4}$ kg·m², $b = 2\times10^{-5}$ N·m·s (illustrative). Define the motor's own damping $\beta = k^2/R + b$.

**Open loop**: choose the voltage that gives 2000 rpm unloaded. A load step $\tau_L$ lowers the steady speed by

$$\Delta\omega_{ol} = \frac{\tau_L}{\beta}.$$

**Closed loop**: add proportional speed feedback, $V = V_0 + K_p(\omega_r - \omega)$. The controller adds damping $kK_p/R$, so

$$\Delta\omega_{cl} = \frac{\tau_L}{\beta + kK_p/R} = \frac{\Delta\omega_{ol}}{1 + L}, \qquad L = \frac{kK_p}{R\beta}.$$

## The disturbance transfer function

In block-diagram form the load enters between controller and output. With plant $G$ and controller $K$:

$$\frac{Y}{D} = \frac{G_d}{1 + GK}.$$

The same $1/(1 + GK)$ as the sensitivity of lesson 01: feedback that reduces sensitivity to plant changes also rejects disturbances. Proportional control reduces the drop but doesn't remove it; lesson 06 adds integral action to do that.

:::figure widget=loadstep caption="Motor speed when a load torque is applied at 0.2 s, at fixed voltage and with proportional feedback. Raise the gain and the drop shrinks by one plus the loop gain."
:::end

## Worked example

$\tau_L = 0.05$ N·m and $K_p = 0.5$ V per rad/s.

1. $\beta = 0.05^2/1.2 + 2\times10^{-5} = 2.103\times10^{-3}$ N·m·s.
2. Open-loop drop: $0.05/0.002103 = 23.8$ rad/s, which is 227 rpm.
3. Loop gain: $L = 0.05 \times 0.5/(1.2 \times 0.002103) = 9.9$, so the closed-loop drop is $23.8/10.9 = 2.18$ rad/s, about 21 rpm.
4. Closed-loop time constant: $J/(\beta(1 + L)) = 8.7$ ms, against 95 ms open loop.

## Code it from scratch

:::code file=loadstep.py
```python
import numpy as np

R, k, J, b = 1.2, 0.05, 2e-4, 2e-5
beta = k * k / R + b
w_ref = 2000 * 2 * np.pi / 60
V0 = beta * w_ref * R / k                      # voltage for the reference speed unloaded

def simulate(Kp, tl=0.05, T=1.6, dt=2e-5, t_step=0.2):
    w, out = w_ref, []
    for i in range(int(T / dt)):
        t = i * dt
        V = V0 + Kp * (w_ref - w)
        load = tl if t >= t_step else 0.0
        f = lambda w: (k / R * (V - k * w) - b * w - load) / J
        k1 = f(w); k2 = f(w + dt / 2 * k1); k3 = f(w + dt / 2 * k2); k4 = f(w + dt * k3)
        w += dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4); out.append(w)
    return np.array(out)

def test_open_loop_drop():
    w = simulate(0.0)
    drop = w_ref - w[-1]
    print(f"V0 = {V0:.2f} V; open-loop drop {drop:.2f} rad/s ({drop * 60 / (2 * np.pi):.0f} rpm), predicted {0.05 / beta:.2f}")
    assert abs(drop - 0.05 / beta) < 0.01

def test_drop_reduced_by_loop_gain():
    ol = w_ref - simulate(0.0)[-1]
    for Kp in (0.1, 0.5, 2.0):
        L = k * Kp / (R * beta)
        cl = w_ref - simulate(Kp)[-1]
        print(f"Kp = {Kp}: loop gain {L:5.1f}, drop {cl:.3f} rad/s, ratio {ol / cl:.2f} (1 + L = {1 + L:.2f})")
        assert abs(ol / cl - (1 + L)) / (1 + L) < 1e-3

def test_faster_recovery():
    for Kp in (0.0, 0.5):
        w = simulate(Kp)
        drop = w_ref - w[-1]
        k63 = np.argmax(w_ref - w[10000:] > 0.632 * drop)
        tc = (k63 + 1) * 2e-5
        pred = J / (beta + k * Kp / R)
        assert abs(tc - pred) / pred < 0.01

test_open_loop_drop()
test_drop_reduced_by_loop_gain()
test_faster_recovery()
print("PASS")
```
:::end

## Exercises

:::exercise
Why is a "stiff" motor (small speed drop under load) at fixed voltage the same as a motor with a large back-EMF damping $k^2/R$?
:::solution
At fixed voltage, a speed drop raises the current by $k\Delta\omega/R$, and that extra current makes torque $k^2\Delta\omega/R$ to fight the load. So $k^2/R$ is a built-in proportional speed feedback; low-resistance motors with large $k$ are stiffer open loop.
:::end

:::exercise
The motor drives a fan whose torque grows with speed squared, rather than a step load. Does the $1/(1 + L)$ result still apply?
:::solution
Locally, yes: linearise the fan torque around the operating speed (lesson p12-l10), which adds damping $2c\omega_0$ to $\beta$. Disturbances in fan load are then reduced by $1 + L$ with that new $\beta$.
:::end

## Quiz

:::quiz
- type: num
  q: Motor damping β in N·m·s for R = 1.2 Ω, k = 0.05, b = 2e-5?
  answer: 0.002103
  tol: 0.002
  py: "0.05**2/1.2+2e-5"
  explain: k²/R + b.
- type: num
  q: Open-loop speed drop in rad/s for a 0.05 N·m load?
  answer: 23.77
  tol: 0.003
  unit: rad/s
  py: "0.05/(0.05**2/1.2+2e-5)"
  explain: τ_L/β.
- type: num
  q: Loop gain with K_p = 0.5 V per rad/s?
  answer: 9.906
  tol: 0.003
  py: "0.05*0.5/(1.2*(0.05**2/1.2+2e-5))"
  explain: kK_p/(Rβ).
- type: num
  q: Closed-loop speed drop in rad/s?
  answer: 2.181
  tol: 0.005
  unit: rad/s
  py: "23.77/10.906"
  explain: Open-loop drop over 1 + L.
- type: mc
  q: The disturbance transfer function with feedback is…
  options:
    - G_d/(1 + GK)
    - GK/(1 + GK)
    - G_d·GK
    - 1 + GK
  answer: 0
  explain: The same sensitivity factor.
- type: mc
  q: Proportional speed feedback against a step load leaves…
  options:
    - a smaller but non-zero steady speed error
    - zero steady error
    - a larger error
    - an oscillation
  answer: 0
  explain: Integral action is needed for zero error.
:::end
