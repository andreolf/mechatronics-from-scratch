---
id: p09-l02
minutes: 40
summary: A brushed DC motor is two coupled first-order equations, one electrical and one mechanical, linked by the motor constant. You derive them, find the steady-state speed under load and the two time constants, simulate a step response, and check the simulation against the closed-form steady state.
---

## Two equations

The armature is a resistance $R$ and inductance $L$ in series with the back-EMF $k\omega$ (lesson 1). The rotor is an inertia $J$ with viscous friction $b$, driven by the motor torque $k i$ and resisted by the load torque $T_L$:

$$L\frac{di}{dt} = V - R i - k\omega, \qquad J\frac{d\omega}{dt} = k i - b\omega - T_L.$$

The same constant $k$ appears twice, as torque per amp (N·m/A) and as volts per rad/s, as the power balance demands.

## Steady state

Set both derivatives to zero. From the second, $i = (b\omega + T_L)/k$; put it into the first:

$$\omega_{ss} = \frac{kV - R\,T_L}{k^2 + R b}.$$

With no load and negligible friction, $\omega_{ss} \approx V/k$: the motor speeds up until its back-EMF nearly cancels the supply. Each unit of load torque costs $R/k^2$ of speed, which is the slope of the torque-speed line (lesson 4).

## Two time scales

Small motors usually have $L/R \ll JR/k^2$, so the dynamics separate:

- **Electrical time constant** $\tau_e = L/R$, typically well under a millisecond: the current settles first.
- **Mechanical time constant** $\tau_m = \dfrac{JR}{k^2 + Rb}$: with the current always "caught up", the speed approaches $\omega_{ss}$ exponentially with this time constant.

The transfer function from voltage to speed is $\dfrac{k}{(Ls + R)(Js + b) + k^2}$, a second-order system with these two poles (Phase 03).

The [live motor lab](#lab-motor) on the home page runs this same model in 3D.

:::figure widget=dcmotor caption="Speed and current after a voltage step. The current spikes at start, because there's no back-EMF yet, then falls as the motor speeds up. The amber line is the closed-form steady state."
:::end

## Worked example

A small 12 V motor has $R = 1.2$ Ω, $L = 0.6$ mH, $k = 0.02$ N·m/A, $J = 3\times10^{-6}$ kg·m² and $b = 2\times10^{-6}$ N·m·s.

1. No load: $\omega_{ss} = 0.24/(0.0004 + 0.0000024) = 596.4$ rad/s, which is 5695 rpm.
2. With $T_L = 0.05$ N·m: $\omega_{ss} = (0.24 - 0.06)/0.0004024 = 447.3$ rad/s.
3. $\tau_e = 0.6\text{ mH}/1.2\ \Omega = 0.5$ ms and $\tau_m = 3\times10^{-6}\cdot1.2/0.0004024 = 8.95$ ms.
4. Starting current: $V/R = 10$ A for an instant, while the steady load current is $(b\omega + T_L)/k = 2.54$ A.

## Code it from scratch

:::code file=dc_motor.py
```python
import numpy as np
from scipy import signal

R, L, k, J, b = 1.2, 0.6e-3, 0.02, 3e-6, 2e-6

def deriv(x, V, TL):
    i, w = x
    return np.array([(V - R * i - k * w) / L, (k * i - b * w - TL) / J])

def simulate(V, TL, T=0.08, dt=5e-6):
    x = np.zeros(2); out = [x.copy()]
    for _ in range(int(round(T / dt))):          # classic RK4
        k1 = deriv(x, V, TL); k2 = deriv(x + dt / 2 * k1, V, TL)
        k3 = deriv(x + dt / 2 * k2, V, TL); k4 = deriv(x + dt * k3, V, TL)
        x = x + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4); out.append(x.copy())
    return np.arange(len(out)) * dt, np.array(out)

def steady_speed(V, TL):
    return (k * V - R * TL) / (k * k + R * b)

if __name__ == "__main__":
    for TL in (0.0, 0.05):
        t, x = simulate(12.0, TL)
        print(f"T_L = {TL}: simulated {x[-1, 1]:.2f} rad/s, formula {steady_speed(12.0, TL):.2f} rad/s")
        assert abs(x[-1, 1] - steady_speed(12.0, TL)) < 1e-3 * steady_speed(12.0, TL)
    # inrush current approaches V/R, because there is no back-EMF at standstill
    t, x = simulate(12.0, 0.0, T=0.002)
    assert 0.8 * 10 < x[:, 0].max() < 10
    # mechanical time constant: 63 % of final speed after about tau_m (plus a little electrical lag)
    t, x = simulate(12.0, 0.0)
    tau_m = J * R / (k * k + R * b)
    t63 = t[np.argmax(x[:, 1] >= 0.632 * x[-1, 1])]
    assert abs(t63 - tau_m) < 0.1 * tau_m
    # cross-check against the state-space model with SciPy
    sys = signal.StateSpace([[-R / L, -k / L], [k / J, -b / J]], [[1 / L], [0]], [[0, 1]], [[0]])
    ts = np.linspace(0, 0.08, 2001)
    _, y = signal.step(sys, T=ts)
    _, x = simulate(12.0, 0.0, T=0.08, dt=4e-5)
    assert np.max(np.abs(12 * y - x[:, 1])) < 0.5
```
:::end

## Exercises

:::exercise
The motor runs at 447 rad/s under a 0.05 N·m load. The supply drops from 12 V to 10 V. What's the new speed?
:::solution
$\omega_{ss} = (0.02 \cdot 10 - 1.2 \cdot 0.05)/0.0004024 = 0.14/0.0004024 = 347.9$ rad/s. Speed is linear in voltage at a fixed load, with slope $k/(k^2 + Rb) = 49.7$ rad/s per volt.
:::end

:::exercise
Why can't you treat this motor as first order if you want to design a 2 kHz current loop?
:::solution
A 2 kHz loop is fast compared with $\tau_e = 0.5$ ms (318 Hz). The inductance is exactly what the current loop controls, so the electrical pole must be in the model. The mechanical motion barely changes in that time, so it can be treated as a slowly varying back-EMF disturbance instead (lesson 7).
:::end

## Quiz

:::quiz
- type: num
  q: No-load steady speed in rad/s at 12 V (worked-example motor)?
  answer: 596.4
  tol: 0.001
  unit: rad/s
  py: "(0.02*12)/(0.02**2+1.2*2e-6)"
  explain: kV/(k² + Rb).
- type: num
  q: Steady speed in rad/s at 12 V with a 0.05 N·m load?
  answer: 447.3
  tol: 0.001
  unit: rad/s
  py: "(0.02*12-1.2*0.05)/(0.02**2+1.2*2e-6)"
  explain: (kV − R·T_L)/(k² + Rb).
- type: num
  q: Electrical time constant in ms?
  answer: 0.5
  tol: 0.001
  unit: ms
  py: "0.6e-3/1.2*1000"
  explain: L/R.
- type: num
  q: Mechanical time constant in ms?
  answer: 8.946
  tol: 0.002
  unit: ms
  py: "3e-6*1.2/(0.02**2+1.2*2e-6)*1000"
  explain: JR/(k² + Rb).
- type: num
  q: Starting (inrush) current in A at 12 V?
  answer: 10
  tol: 0.001
  unit: A
  py: "12/1.2"
  explain: No back-EMF at standstill, so V/R.
- type: mc
  q: At no load and no friction, a DC motor's speed is set by…
  options:
    - its inertia
    - V/k, where back-EMF balances the supply
    - its inductance
    - the load torque
  answer: 1
  explain: It accelerates until kω ≈ V.
:::end

:::verify
import math
w = (0.02*12)/(0.02**2+1.2*2e-6)
assert abs(w*60/(2*math.pi) - 5695) < 1
assert abs((2e-6*447.3+0.05)/0.02 - 2.54) < 0.01
:::end
