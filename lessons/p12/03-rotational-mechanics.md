---
id: p12-l03
minutes: 35
summary: Rotational systems obey J times angular acceleration equals the sum of torques, and a real shaft is a torsional spring, so a motor driving a load through it becomes a two-inertia system with a resonance and an anti-resonance. You derive both frequencies, simulate a motor-shaft-load with compliance, and test that the simulated frequency response peaks and dips exactly where the formulas say.
---

## Torques and inertias

Rotation mirrors translation: angle $\theta$ for position, inertia $J$ (kg·m²) for mass, torque $\tau$ for force. For each rigid body,

$$J\ddot\theta = \sum \tau.$$

A shaft of length $\ell$, shear modulus $G$ and polar moment $I_p = \pi d^4/32$ twists like a spring with **torsional stiffness** $k = G I_p/\ell$ (N·m/rad). A coupling or gearbox adds its own compliance in series. Viscous friction and material damping add $c\,\Delta\dot\theta$.

## Motor, shaft, load

With motor inertia $J_m$, load inertia $J_L$ and a shaft of stiffness $k$ and damping $c$:

$$J_m\ddot\theta_m = \tau_m - k(\theta_m - \theta_L) - c(\dot\theta_m - \dot\theta_L),$$
$$J_L\ddot\theta_L = k(\theta_m - \theta_L) + c(\dot\theta_m - \dot\theta_L).$$

Two inertias, one spring: one rigid-body mode (both turn together) and one twisting mode. From the motor torque to the **motor** speed the transfer function has

- an **anti-resonance** (a zero pair) at $\omega_a = \sqrt{k/J_L}$, where the load swings against the shaft and the motor barely moves;
- a **resonance** (a pole pair) at $\omega_r = \sqrt{k\,(1/J_m + 1/J_L)} = \omega_a\sqrt{1 + J_L/J_m}$.

The ratio $J_L/J_m$ sets how far apart they are. A speed loop closed on the motor encoder sees the dip first and the peak after it, and too much controller gain at $\omega_r$ makes the shaft ring: the classic servo resonance problem.

:::figure widget=shafttwist caption="A motor turning a load through a compliant shaft, with the twist exaggerated. Drive it at different frequencies: near the anti-resonance the motor stands almost still while the load swings; at the resonance the twist is largest."
:::end

## Worked example

$J_m = 1\times10^{-4}$ kg·m², $J_L = 4\times10^{-4}$ kg·m², $k = 50$ N·m/rad.

1. $\omega_a = \sqrt{50/4\times10^{-4}} = 353.6$ rad/s = **56.3 Hz**.
2. $\omega_r = \sqrt{50 \times (10^4 + 2500)} = 790.6$ rad/s = **125.8 Hz**.
3. Check: $\omega_r/\omega_a = \sqrt{1 + 4} = 2.236$.
4. A speed loop with 50 Hz bandwidth on this axis is in trouble; keep it below about a third of $\omega_a$, or add a notch filter.

## Code it from scratch

:::code file=two_inertia.py
```python
import numpy as np
from scipy.linalg import expm

Jm, JL, k, c = 1e-4, 4e-4, 50.0, 2e-3

# state x = [theta_m, theta_L, w_m, w_L], input = motor torque
A = np.array([[0, 0, 1, 0],
              [0, 0, 0, 1],
              [-k / Jm, k / Jm, -c / Jm, c / Jm],
              [k / JL, -k / JL, c / JL, -c / JL]])
B = np.array([0, 0, 1 / Jm, 0.0])

def predicted():
    wa = np.sqrt(k / JL)
    wr = np.sqrt(k * (1 / Jm + 1 / JL))
    return wa / (2 * np.pi), wr / (2 * np.pi)

def speed_amplitude(f_hz, dt=2e-5, settle=0.5, periods=10):
    """drive with a 1 mN*m sine torque, let transients die, then fit the motor-speed sine"""
    Ad = expm(A * dt)
    w = 2 * np.pi * f_hz
    n_settle = int(settle / dt); n_meas = int(periods / f_hz / dt)
    x = np.zeros(4); ts, ys = [], []
    for i in range(n_settle + n_meas):
        t = i * dt
        x = Ad @ x + dt * B * 1e-3 * np.sin(w * (t + dt / 2))     # midpoint input, exact plant
        if i >= n_settle:
            ts.append(t + dt); ys.append(x[2])
    ts, ys = np.array(ts), np.array(ys)
    M = np.column_stack([np.sin(w * ts), np.cos(w * ts), np.ones_like(ts)])
    a, b, _ = np.linalg.lstsq(M, ys, rcond=None)[0]
    return np.hypot(a, b)

def extremum(lo, hi, kind, n=25):
    fs = np.linspace(lo, hi, n)
    amps = [speed_amplitude(f) for f in fs]
    i = int(np.argmax(amps) if kind == "max" else np.argmin(amps))
    return fs[i], fs

def test_resonances():
    fa, fr = predicted()
    coarse = np.geomspace(30, 200, 25)
    amps = [speed_amplitude(f) for f in coarse]
    ip = int(np.argmax(amps)); ia = int(np.argmin(amps[:ip]))
    peak, _ = extremum(coarse[ip - 1], coarse[ip + 1], "max")
    notch, _ = extremum(coarse[ia - 1], coarse[ia + 1], "min")
    print(f"predicted anti-resonance {fa:.1f} Hz, resonance {fr:.1f} Hz; simulated dip {notch:.1f} Hz, peak {peak:.1f} Hz")
    assert abs(peak - fr) / fr < 0.01 and abs(notch - fa) / fa < 0.01

def test_eigenvalues():
    ev = np.linalg.eigvals(A)
    osc = sorted(abs(e.imag) for e in ev if abs(e.imag) > 1)
    assert abs(osc[0] / (2 * np.pi) - predicted()[1]) < 0.05    # the pole pair is the resonance
    assert sum(abs(e) < 1e-6 for e in ev) == 2                   # rigid-body rotation: a double pole at 0 (angle and speed)

def test_shaft_formula():
    G, d, l = 79e9, 0.006, 0.2                    # steel, 6 mm, 200 mm
    kshaft = G * np.pi * d ** 4 / 32 / l
    print(f"a 6 mm steel shaft 200 mm long: k = {kshaft:.1f} N*m/rad")
    assert 49 < kshaft < 51                       # the lesson's k

test_resonances()
test_eigenvalues()
test_shaft_formula()
print("PASS")
```
:::end

## Exercises

:::exercise
You double the load inertia. What happens to the two frequencies?
:::solution
$\omega_a = \sqrt{k/J_L}$ drops by $\sqrt 2$, to 39.8 Hz. $\omega_r = \sqrt{k(1/J_m + 1/J_L)}$ drops less, from 125.8 to 118.6 Hz, because the motor inertia term dominates. The gap between dip and peak widens, which makes the resonance more troublesome for a motor-side speed loop.
:::end

:::exercise
Why does the load-side speed not show an anti-resonance?
:::solution
From motor torque to load speed the transfer function has the resonance poles but no zeros at $\omega_a$: the shaft is the only path to the load, and it transmits more torque as it twists more. The dip on the motor side is the load acting as a tuned absorber on the motor.
:::end

## Quiz

:::quiz
- type: num
  q: Anti-resonance in Hz for k = 200 N·m/rad and J_L = 2×10⁻³ kg·m²?
  answer: 50.33
  tol: 0.002
  unit: Hz
  py: "(200/2e-3)**0.5/(2*__import__('math').pi)"
  explain: sqrt(k/J_L).
- type: num
  q: Ratio ω_r/ω_a when J_L = 9 J_m?
  answer: 3.162
  tol: 0.001
  py: "(1 + 9)**0.5"
  explain: sqrt(1 + J_L/J_m).
- type: num
  q: Torsional stiffness in N·m/rad of a 10 mm steel shaft (G = 79 GPa) 500 mm long?
  answer: 155.1
  tol: 0.002
  unit: N·m/rad
  py: "79e9*__import__('math').pi*0.01**4/32/0.5"
  explain: G·πd⁴/(32ℓ).
- type: num
  q: Resonance in Hz of the worked-example axis?
  answer: 125.8
  tol: 0.002
  unit: Hz
  py: "(50*(1/1e-4 + 1/4e-4))**0.5/(2*__import__('math').pi)"
  explain: sqrt(k(1/J_m + 1/J_L)).
- type: mc
  q: At the anti-resonance, what does the motor do?
  options:
    - it barely moves while the load swings against the shaft
    - it spins fastest
    - it stalls permanently
    - it reverses
  answer: 0
  explain: The motor-side response dips.
- type: mc
  q: Why does the motor-shaft-load model have a pole at zero?
  options:
    - both inertias can rotate together freely, with no spring to the frame
    - because of friction
    - because the motor has inductance
    - it doesn't
  answer: 0
  explain: The rigid-body mode.
:::end
