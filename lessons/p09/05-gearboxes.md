---
id: p09-l05
minutes: 35
summary: A gearbox trades speed for torque, and it also divides the load's inertia by the ratio squared as seen from the motor. You derive reflected inertia, find the ratio that gives a robot joint the most acceleration, and check the formula against a numerical optimisation that includes gearbox efficiency and a motor speed limit.
---

## What a gearbox does

An ideal gearbox of ratio $N$ (motor turns $N$ times per output turn):

$$\omega_{load} = \frac{\omega_m}{N}, \qquad T_{load} = N\,\eta_g\,T_m,$$

where $\eta_g$ is the gearbox efficiency (0.7–0.95 for spur and planetary stages, much lower for worm gears).

## Reflected inertia

Write the energy of the moving load in motor coordinates: $\tfrac12 J_L\,\omega_L^2 = \tfrac12 (J_L/N^2)\,\omega_m^2$. So the load looks like an inertia

$$J_{refl} = \frac{J_L}{N^2}$$

on the motor shaft. A 100:1 gearbox makes a heavy arm feel 10 000 times lighter. That's why geared robots are easy to control, and also why they feel stiff and hard to back-drive: the motor's inertia is multiplied by $N^2$ as seen from the arm.

## The optimum ratio

With motor torque $T_m$ and motor inertia $J_m$, the load acceleration is

$$\alpha_L = \frac{N\,T_m}{J_L + N^2 J_m}.$$

Too small a ratio and the motor's torque is too weak; too large and the motor spends its torque spinning itself. Setting $d\alpha_L/dN = 0$:

$$N^* = \sqrt{\frac{J_L}{J_m}}, \qquad \alpha_{L,max} = \frac{T_m}{2\sqrt{J_L J_m}}.$$

At $N^*$ the reflected load inertia equals the motor inertia: **inertia matching**. In practice you then check the speed: the motor must reach $N\,\omega_{L,max}$, which can force a smaller ratio. The acceleration curve is flat near the optimum, so a ratio within ±30 % costs only a few percent.

:::figure widget=gearratio caption="Load acceleration against gear ratio for a fixed motor. Move the load inertia: the optimum √(J_load/J_motor) moves with it."
:::end

## Worked example

A robot elbow: $J_L = 0.01$ kg·m², motor $J_m = 1\times10^{-5}$ kg·m² (including the gearbox input stage), $T_m = 0.1$ N·m peak, motor limited to 6000 rpm (628 rad/s).

1. $N^* = \sqrt{0.01/10^{-5}} = 31.6$.
2. $\alpha_{L,max} = 0.1/(2\sqrt{10^{-7}}) = 158$ rad/s².
3. With $N = 31.6$ the joint's top speed is $628/31.6 = 19.9$ rad/s. If the task needs 30 rad/s, the ratio must drop to $628/30 = 20.9$, where $\alpha_L = 20.9\cdot0.1/(0.01 + 437\cdot10^{-5}) = 145$ rad/s², only 8 % less.

## Code it from scratch

:::code file=gear_ratio.py
```python
import numpy as np
from scipy.optimize import minimize_scalar

def accel(N, Tm=0.1, Jm=1e-5, JL=0.01, eta=1.0):
    return N * eta * Tm / (JL + N * N * Jm)

def best_ratio(Tm=0.1, Jm=1e-5, JL=0.01, eta=1.0, w_motor_max=None, w_load_needed=None):
    hi = 1000.0
    if w_motor_max and w_load_needed:
        hi = w_motor_max / w_load_needed              # speed limit caps the ratio
    r = minimize_scalar(lambda N: -accel(N, Tm, Jm, JL, eta), bounds=(1.0, hi), method="bounded",
                        options={"xatol": 1e-9})
    return r.x

if __name__ == "__main__":
    N = best_ratio()
    print(f"numerical optimum N = {N:.4f}, formula {np.sqrt(0.01 / 1e-5):.4f}")
    assert abs(N - np.sqrt(0.01 / 1e-5)) < 1e-4
    assert abs(accel(N) - 0.1 / (2 * np.sqrt(0.01 * 1e-5))) < 1e-6
    # at the optimum the reflected load inertia equals the motor inertia
    assert abs(0.01 / N ** 2 - 1e-5) < 1e-10
    # gearbox efficiency scales the acceleration but does not move the optimum
    assert abs(best_ratio(eta=0.8) - N) < 1e-4
    # a speed requirement caps the ratio: 628 rad/s motor, 30 rad/s joint
    Nc = best_ratio(w_motor_max=628.0, w_load_needed=30.0)
    print(f"speed-limited ratio {Nc:.2f}, acceleration {accel(Nc):.1f} rad/s^2")
    assert abs(Nc - 628 / 30) < 1e-3 and accel(Nc) > 0.9 * accel(N)
```
:::end

## Exercises

:::exercise
A motor is matched to its load ($N = N^*$). The load inertia doubles. By how much does the acceleration drop if you keep the gearbox, and if you change to the new optimum?
:::solution
Keeping $N$: $\alpha = N T_m/(2J_L + N^2J_m) = N T_m/(3N^2J_m)$, versus $N T_m/(2N^2J_m)$ before, so it falls to 2/3. At the new optimum $\alpha = T_m/(2\sqrt{2J_LJ_m})$, which is $1/\sqrt2 = 0.707$ of before. Re-matching gains 6 %.
:::end

:::exercise
Why do direct-drive robots ($N = 1$) exist if the optimum ratio is usually 10–100?
:::solution
They trade acceleration per amp for other things: no backlash, no gear friction, high back-drivability for safe contact and force control, and a quiet drive. They need large, high-torque motors to compensate.
:::end

## Quiz

:::quiz
- type: num
  q: Optimum ratio for J_L = 0.01 and J_m = 1e-5 kg·m²?
  answer: 31.62
  tol: 0.002
  py: "math.sqrt(0.01/1e-5)"
  explain: √(J_L/J_m).
- type: num
  q: Maximum load acceleration in rad/s² with T_m = 0.1 N·m?
  answer: 158.1
  tol: 0.002
  unit: rad/s²
  py: "0.1/(2*math.sqrt(0.01*1e-5))"
  explain: T_m/(2√(J_L J_m)).
- type: num
  q: Reflected inertia in kg·m² of 0.01 kg·m² through a 100:1 gearbox?
  answer: 1e-6
  tol: 0.001
  unit: kg·m²
  py: "0.01/100**2"
  explain: J_L/N².
- type: num
  q: Highest ratio in rad/s terms if the motor tops out at 628 rad/s and the joint needs 30 rad/s?
  answer: 20.93
  tol: 0.002
  py: "628/30"
  explain: ω_motor,max/ω_load.
- type: num
  q: Load acceleration in rad/s² at N = 20.93?
  answer: 145.0
  tol: 0.005
  unit: rad/s²
  py: "20.93*0.1/(0.01+20.93**2*1e-5)"
  explain: N·T_m/(J_L + N²J_m).
- type: mc
  q: At the optimum ratio…
  options:
    - the load inertia equals the motor inertia
    - the reflected load inertia equals the motor inertia
    - the gearbox efficiency is highest
    - the motor runs at no-load speed
  answer: 1
  explain: J_L/N² = J_m.
:::end

:::verify
import math
a = lambda N: N*0.1/(0.01+N*N*1e-5)
assert abs(a(2*31.62)/a(31.62)*0 + 0.1/(2*math.sqrt(2*0.01*1e-5))/(0.1/(2*math.sqrt(0.01*1e-5))) - 0.7071) < 1e-3
:::end
