---
id: p09-l08
minutes: 35
summary: A stepper turns a fixed angle for every change in its phase currents, so it positions without a sensor. You derive the 1.8 degree step of a hybrid stepper, the sinusoidal torque around each step, and the current tables for full, half and microstepping, then show why only sin/cos microstepping keeps the current vector, and so the holding torque, constant.
---

## Steps from teeth

A two-phase **hybrid stepper** has a rotor with $N_r = 50$ teeth on each of two magnetised end caps, and a stator whose poles carry phases A and B. One full electrical cycle of the phase currents moves the rotor by one tooth pitch, $360°/N_r = 7.2°$. A cycle has four full steps, so

$$\theta_{step} = \frac{360°}{4N_r} = 1.8°, \text{ or 200 steps per revolution}.$$

## Torque around an equilibrium

If the rotor sits $\delta$ away from the position the currents command, the restoring torque is approximately

$$T = -T_h \sin(N_r\,\delta),$$

where $T_h$ is the **holding torque**. It's like a stiff spring for small $\delta$, with stiffness $T_h N_r$, and it can't resist more than $T_h$ (lesson 9). A load torque $T_L$ deflects the rotor by $\delta = \arcsin(T_L/T_h)/N_r$ even when it's not moving.

## Current tables

The rotor aligns with the current vector $(i_A, i_B)$, so stepping means rotating that vector.

- **Full step, two phases on**: $(+,+), (-,+), (-,-), (+,-)$. Magnitude $\sqrt2\,I$, the most torque per step.
- **Half step**: alternate one and two phases, 8 states per cycle. Magnitude alternates between $I$ and $\sqrt2 I$, so the torque ripples by 29 % unless the two-phase steps are reduced to $0.707\,I$.
- **Microstepping**: $i_A = I\cos\theta_e$, $i_B = I\sin\theta_e$ with $\theta_e$ in steps of $90°/m$. The magnitude is constant and the motion is smooth and quiet.

Microsteps improve smoothness more than accuracy. A load of 10 % of $T_h$ deflects the rotor by $\arcsin(0.1)/50 = 0.115°$, more than a whole 1/16 microstep (0.1125°).

:::figure widget=stepper caption="The phase current vector for each drive mode (top) and the two phase currents over one electrical cycle (bottom). Watch the vector's length: only microstepping keeps it on the circle."
:::end

## Worked example

A 200-step motor with $T_h = 0.5$ N·m, driven at 1/16 microstepping, 1.5 A peak, from an 8-bit signed table (±127).

1. Microstep angle: $1.8°/16 = 0.1125°$, 3200 microsteps per revolution.
2. Electrical step: $90°/16 = 5.625°$.
3. Table entry for microstep 3: $127\cos(16.875°) = 121.5 \to 122$ and $127\sin(16.875°) = 36.9 \to 37$.
4. Stiffness near equilibrium: $T_hN_r = 25$ N·m/rad, so a 0.05 N·m load deflects it by 2 mrad, 0.115°.

## Code it from scratch

:::code file=stepper_tables.py
```python
import numpy as np

def full_step():
    return np.array([(1, 1), (-1, 1), (-1, -1), (1, -1)], float)

def half_step(compensated=False):
    s = []
    for k in range(8):
        a = k * np.pi / 4
        v = np.array([np.cos(a), np.sin(a)])
        v = np.where(np.abs(v) < 1e-9, 0, np.sign(v))
        if compensated and np.all(v != 0):
            v = v / np.sqrt(2)
        s.append(v)
    return np.array(s)

def microstep(m, amp=127):
    th = np.arange(4 * m) * (np.pi / 2) / m
    return np.round(amp * np.stack([np.cos(th), np.sin(th)], 1))   # integer DAC codes

def shaft_angle_deg(table, Nr=50):
    return np.degrees(np.unwrap(np.arctan2(table[:, 1], table[:, 0]))) / Nr

if __name__ == "__main__":
    mag = lambda t: np.hypot(t[:, 0], t[:, 1])
    assert np.allclose(mag(full_step()), np.sqrt(2))
    h = mag(half_step())
    print("half-step magnitudes:", np.round(h, 3))
    assert abs(h.max() / h.min() - np.sqrt(2)) < 1e-12
    assert np.allclose(mag(half_step(compensated=True)), 1)
    t = microstep(16)
    m = mag(t)
    print(f"1/16 microstep, 8-bit: magnitude {m.min():.2f}..{m.max():.2f} (ideal 127)")
    assert np.max(np.abs(m - 127)) / 127 < 0.01                # constant within 1 %
    assert tuple(t[3]) == (122.0, 37.0)
    ang = shaft_angle_deg(t)
    steps = np.diff(ang)
    assert abs(np.mean(steps) - 1.8 / 16) < 1e-3 and np.max(np.abs(steps - 1.8 / 16)) < 0.01   # rounding wobble < 0.01 deg
    # 4 full steps per electrical cycle -> 1.8 degrees each with 50 teeth
    assert abs(np.diff(shaft_angle_deg(full_step()))[0] - 1.8) < 1e-12
```
:::end

## Exercises

:::exercise
A 0.9° stepper (400 steps per revolution) has how many rotor teeth, assuming two phases?
:::solution
$\theta_{step} = 360°/(4N_r) = 0.9°$ gives $N_r = 100$ teeth.
:::end

:::exercise
Why do most stepper drivers reduce the current when the motor is standing still?
:::solution
A stepper draws full current all the time, moving or not, so it heats even when holding. Holding usually needs much less torque than accelerating, so drivers drop to 30–70 % ("idle current reduction"), cutting copper loss by $1 - 0.5^2 = 75$ % at half current.
:::end

## Quiz

:::quiz
- type: num
  q: Full-step angle in degrees for 50 rotor teeth?
  answer: 1.8
  tol: 0.001
  unit: °
  py: "360/(4*50)"
  explain: 360°/(4N_r).
- type: num
  q: Microsteps per revolution at 1/16 on a 200-step motor?
  answer: 3200
  tol: 0.001
  py: "200*16"
  explain: 200 × 16.
- type: num
  q: Ratio of the largest to smallest current magnitude in uncompensated half stepping?
  answer: 1.4142
  tol: 0.001
  py: "math.sqrt(2)"
  explain: One phase versus two.
- type: num
  q: Static deflection in degrees under a load of 10 % of holding torque (N_r = 50)?
  answer: 0.1148
  tol: 0.002
  unit: °
  py: "math.degrees(math.asin(0.1))/50"
  explain: arcsin(T_L/T_h)/N_r.
- type: num
  q: 8-bit table value 127·cos(16.875°), rounded?
  answer: 122
  tol: 0.001
  py: "round(127*math.cos(math.radians(16.875)))"
  explain: Microstep 3 of 16.
- type: mc
  q: Which drive mode keeps the current vector's magnitude constant?
  options:
    - full step, one phase on
    - half step
    - sin/cos microstepping
    - wave drive
  answer: 2
  explain: cos² + sin² = 1.
:::end

:::verify
import math
assert round(127*math.sin(math.radians(16.875))) == 37
assert abs(0.5*50 - 25) < 1e-12
:::end
