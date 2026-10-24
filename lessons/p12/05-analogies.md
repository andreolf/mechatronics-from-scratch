---
id: p12-l05
minutes: 30
summary: A mass on a spring with a damper and an RLC circuit obey the same second-order equation, so every result about one transfers to the other once you map mass to inductance, damping to resistance and stiffness to inverse capacitance (or, in the other analogy, mass to capacitance). You derive both the force-voltage and force-current analogies, simulate a mass-spring-damper and its circuit twins, and test that their responses are identical after scaling.
---

## One equation, many systems

A mass $m$ on a spring $k$ with a damper $c$, pushed by a force $F$:

$$m\ddot x + c\dot x + kx = F.$$

A series RLC loop driven by a voltage $V$, with charge $q$:

$$L\ddot q + R\dot q + \frac{1}{C}q = V.$$

Same equation. So natural frequency, damping ratio, overshoot and resonance are the same mathematics in both: $\omega_n = \sqrt{k/m} = 1/\sqrt{LC}$ and $\zeta = c/(2\sqrt{km}) = (R/2)\sqrt{C/L}$.

## The two analogies

| mechanical | force-voltage (series) | force-current (parallel) |
|---|---|---|
| force $F$ | voltage $V$ | current $I$ |
| velocity $v$ | current $i$ | voltage $u$ |
| mass $m$ | inductance $L$ | capacitance $C$ |
| damper $c$ | resistance $R$ | conductance $1/R$ |
| spring $k$ | inverse capacitance $1/C$ | inverse inductance $1/L$ |

The **force-voltage** analogy keeps equations looking the same. The **force-current** (mobility) analogy keeps the *topology*: elements that share a velocity in the mechanism (in parallel mechanically) share a voltage in the circuit, so you can draw the circuit straight from the mechanism. In the parallel RLC, $C\dot u + u/R + \frac{1}{L}\int u\,dt = I$ is the same equation with $u$ playing velocity.

Analogies are why circuit simulators are used for mechanical and acoustic systems, and why the energy view (lesson 01) works across domains: mass and inductance store kinetic-like energy $\frac12 mv^2 = \frac12 Li^2$, springs and capacitors store potential-like energy.

:::figure widget=analogy caption="A mass-spring-damper and its series RLC twin, stepped together. The traces stay on top of each other whatever values you choose, because the circuit's values are mapped from the mechanism's."
:::end

## Worked example

$m = 2$ kg, $c = 3$ N·s/m, $k = 50$ N/m, a 10 N step.

1. $\omega_n = \sqrt{50/2} = 5$ rad/s, $\zeta = 3/(2\sqrt{100}) = 0.15$.
2. Force-voltage twin: $L = 2$ H, $R = 3$ Ω, $C = 1/50 = 0.02$ F, a 10 V step. The charge $q(t)$ in coulombs equals $x(t)$ in metres; the steady charge is $CV = 0.2$ C, the steady displacement $F/k = 0.2$ m.
3. Overshoot: $e^{-\pi\zeta/\sqrt{1 - \zeta^2}} = 62$ %, in both.
4. For realistic parts, scale charge and time too: with $q = 10^{-3}x$ and time 1000× faster, $L = m b^2/\alpha = 2$ mH, $R = c b/\alpha = 3$ Ω, $C = \alpha/k = 20$ µF and the same 10 V step reproduce the curve in 10 ms instead of 10 s, with the same $\zeta$.

## Code it from scratch

:::code file=analogies.py
```python
import numpy as np

def rk4(f, x0, T, dt):
    x = np.array(x0, float); out = [x]
    for _ in range(int(round(T / dt))):
        k1 = f(x); k2 = f(x + dt / 2 * k1); k3 = f(x + dt / 2 * k2); k4 = f(x + dt * k3)
        x = x + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4); out.append(x)
    return np.array(out)

def mechanical(m, c, k, F):
    return lambda s: np.array([s[1], (F - c * s[1] - k * s[0]) / m])                 # [x, v]

def series_rlc(L, R, C, V):
    return lambda s: np.array([s[1], (V - R * s[1] - s[0] / C) / L])                 # [q, i]

def parallel_rlc(C, R, L, I):
    """node voltage u and inductor current iL: C du/dt = I - u/R - iL, L diL/dt = u"""
    return lambda s: np.array([(I - s[0] / R - s[1]) / C, s[0] / L])                 # [u, iL]

def test_force_voltage():
    m, c, k, F = 2.0, 3.0, 50.0, 10.0
    X = rk4(mechanical(m, c, k, F), [0, 0], 10, 1e-3)
    Q = rk4(series_rlc(m, c, 1 / k, F), [0, 0], 10, 1e-3)
    assert np.max(np.abs(X - Q)) < 1e-12                  # identical, step for step
    zeta = c / (2 * np.sqrt(k * m)); os = np.exp(-np.pi * zeta / np.sqrt(1 - zeta ** 2))
    peak = X[:, 0].max()
    print(f"x peak {peak:.4f} m vs predicted {0.2 * (1 + os):.4f} m (overshoot {os * 100:.1f} %)")
    assert abs(peak - 0.2 * (1 + os)) < 1e-4

def test_force_current():
    m, c, k, F = 2.0, 3.0, 50.0, 10.0
    X = rk4(mechanical(m, c, k, F), [0, 0], 10, 1e-3)
    U = rk4(parallel_rlc(m, 1 / c, 1 / k, F), [0, 0], 10, 1e-3)
    assert np.max(np.abs(U[:, 0] - X[:, 1])) < 1e-12      # node voltage = velocity
    assert np.max(np.abs(U[:, 1] - k * X[:, 0])) < 1e-9   # inductor current = spring force
    print("force-current twin: node voltage equals velocity, inductor current equals spring force")

def test_scaled():
    """q(t') = alpha * x(t'/b): charge scaled by alpha, time by b, same 10 V source"""
    m, c, k, F = 2.0, 3.0, 50.0, 10.0
    alpha, b = 1e-3, 1e-3                                 # practical parts, 1000x faster
    L, R, C = m * b ** 2 / alpha, c * b / alpha, alpha / k
    X = rk4(mechanical(m, c, k, F), [0, 0], 10, 1e-3)
    Q = rk4(series_rlc(L, R, C, F), [0, 0], 10 * b, 1e-3 * b)
    q_as_x = Q[:, 0] / alpha
    assert np.max(np.abs(q_as_x - X[:, 0])) < 1e-9
    print(f"scaled circuit: L = {L:.3g} H, R = {R:.3g} ohm, C = {C * 1e6:.3g} uF, same curve in 1/1000 of the time")

test_force_voltage()
test_force_current()
test_scaled()
print("PASS")
```
:::end

## Exercises

:::exercise
Two masses joined by a spring, the first one also tied to the wall with a damper. Draw the force-current analogue.
:::solution
Each mass becomes a capacitor from its node to ground (masses are referenced to the inertial frame). The spring between the masses becomes an inductor between the two nodes; the damper from mass 1 to the wall becomes a resistor from node 1 to ground. A force on a mass is a current source into its node.
:::end

:::exercise
In the force-voltage analogy, what does a mechanical system with two masses connected *in series* by a spring look like, and why is it awkward?
:::solution
Elements sharing a force are in series in a force-voltage circuit, but the topology gets inverted relative to the mechanism, so you usually have to take the dual of the circuit you'd naively draw. That's exactly what the force-current analogy avoids.
:::end

## Quiz

:::quiz
- type: num
  q: Natural frequency in rad/s of L = 0.5 H, C = 2 mF?
  answer: 31.62
  tol: 0.001
  unit: rad/s
  py: "1/(0.5*2e-3)**0.5"
  explain: 1/sqrt(LC).
- type: num
  q: Damping ratio of m = 1 kg, c = 4 N·s/m, k = 100 N/m?
  answer: 0.2
  tol: 0.001
  py: "4/(2*(100*1)**0.5)"
  explain: c/(2 sqrt(km)).
- type: num
  q: Capacitance in F that models a 25 N/m spring in the force-voltage analogy?
  answer: 0.04
  tol: 0.001
  unit: F
  py: "1/25"
  explain: C = 1/k.
- type: num
  q: Percent overshoot for ζ = 0.15?
  answer: 62.09
  tol: 0.002
  unit: "%"
  py: "100*__import__('math').exp(-__import__('math').pi*0.15/(1-0.15**2)**0.5)"
  explain: Same for both twins.
- type: mc
  q: In the force-current analogy, mass corresponds to…
  options:
    - capacitance
    - inductance
    - resistance
    - voltage
  answer: 0
  explain: Velocity is voltage; m dv/dt ↔ C du/dt.
- type: mc
  q: Which analogy preserves the topology of the mechanism?
  options:
    - force-current
    - force-voltage
    - both
    - neither
  answer: 0
  explain: Elements sharing a velocity share a node voltage.
:::end
