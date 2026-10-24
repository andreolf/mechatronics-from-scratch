---
id: p07-l09
minutes: 35
summary: A MEMS accelerometer is a microscopic mass on springs, and at rest it measures gravity. You derive the proof-mass model and its bandwidth, compute roll and pitch with atan2, and show that averaging beats noise and vibration to give static tilt within 1 degree, while sustained acceleration still fools it.
---

## A mass on a spring, on a chip

Inside the package, a proof mass $m$ hangs on silicon springs of stiffness $k$, and comb capacitors measure its displacement. Under acceleration $a$ the mass deflects by $x = m a/k = a/\omega_n^2$, where $\omega_n = \sqrt{k/m}$ is its resonance. A higher resonance gives more bandwidth but less deflection per g, so more noise. Typical consumer parts resonate at a few kHz, with noise around 100–300 µg/√Hz.

An accelerometer measures **specific force**: acceleration minus gravity. At rest on a table it reads +1 g *up*, because the table pushes it up.

## Tilt from gravity

Take axes with z up through the board when level. At rest, the sensor reads the gravity vector in its own frame, so for roll $\phi$ (about x) and pitch $\theta$ (about y, nose up positive):

$$\phi = \operatorname{atan2}(a_y, a_z),\qquad \theta = \operatorname{atan2}\!\left(a_x, \sqrt{a_y^2 + a_z^2}\right).$$

Use `atan2`, not `atan`, so all four quadrants work and $a_z = 0$ doesn't divide by zero. Yaw is invisible: rotating about the gravity vector doesn't change it.

**Limits**:

- **Linear acceleration** looks exactly like tilt. Accelerating forward at 0.1 g reads as about 5.7° of pitch.
- **Vibration** adds zero-mean noise, which averaging or low-pass filtering removes, as long as it doesn't saturate the range or alias (lesson 16).
- Both are why lesson 18 fuses the accelerometer with a gyro.

:::figure widget=tilt caption="The sensor axes and the measured specific force. At rest atan2 recovers the pitch exactly; add forward acceleration and the estimate tilts with it."
:::end

## Worked example

A board pitched 20° nose-up and rolled 0° reads $a_x = 0.342$ g, $a_y = 0$, $a_z = 0.940$ g.

1. $\theta = \operatorname{atan2}(0.342, 0.940) = 20.0°$.
2. Noise of 0.02 g rms per sample gives about 1.1° of scatter per reading. Averaging 100 readings brings it to 0.11°.
3. A 0.5 g vibration at 50 Hz, sampled at 1 kHz and averaged over 0.1 s (5 whole cycles), cancels almost exactly.
4. Forward acceleration of 0.1 g while level: $\operatorname{atan2}(0.1, 1) = 5.7°$ of false pitch.

## Code it from scratch

:::code file=tilt.py
```python
import numpy as np

rng = np.random.default_rng(9)

def Rx(a):
    c, s = np.cos(a), np.sin(a)
    return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])

def Ry(a):
    c, s = np.cos(a), np.sin(a)
    return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])

def specific_force(roll, pitch, accel_world=(0.0, 0.0, 0.0)):
    """Accelerometer reading in g for roll and nose-up pitch (rad). World frame: x forward, z up."""
    f_world = np.array(accel_world) + np.array([0, 0, 1.0])      # a - g, with g = (0, 0, -1) g
    return Rx(-roll) @ Ry(pitch) @ f_world                         # world -> body

def tilt(ax, ay, az):
    return np.degrees(np.arctan2(ay, az)), np.degrees(np.arctan2(ax, np.hypot(ay, az)))

if __name__ == "__main__":
    for roll, pitch in [(0, 20), (30, -10), (-60, 45), (170, 5)]:
        assert roll != 0 or abs(specific_force(0, np.radians(pitch))[0] - np.sin(np.radians(pitch))) < 1e-12
        f = specific_force(np.radians(roll), np.radians(pitch))
        r_est, p_est = tilt(*f)
        assert abs(r_est - roll) < 1e-9 and abs(p_est - pitch) < 1e-9, (roll, pitch, r_est, p_est)
    # noisy, vibrating, static board at roll 12, pitch -7: average 0.1 s at 1 kHz
    fs, n = 1000, 100
    t = np.arange(n) / fs
    f = specific_force(np.radians(12), np.radians(-7))
    vib = 0.5 * np.sin(2 * np.pi * 50 * t)
    samples = f[:, None] + 0.02 * rng.standard_normal((3, n)) + np.array([0.0, 0.3, 1.0])[:, None] * vib
    r1, p1 = tilt(*samples[:, 0])
    r, p = tilt(*samples.mean(axis=1))
    print(f"single sample: roll {r1:.1f}, pitch {p1:.1f}; averaged: roll {r:.2f}, pitch {p:.2f} (true 12, -7)")
    assert abs(r - 12) < 1 and abs(p + 7) < 1
    # sustained forward acceleration of 0.1 g while level reads as false pitch
    f = specific_force(0.0, 0.0, accel_world=(0.1, 0, 0))
    false_pitch = abs(tilt(*f)[1])
    assert abs(false_pitch - np.degrees(np.arctan(0.1))) < 1e-9
    print(f"0.1 g forward acceleration looks like {false_pitch:.2f} deg of pitch")
```
:::end

## Exercises

:::exercise
Why is yaw unobservable from an accelerometer at rest?
:::solution
Gravity is along the vertical. Rotating about the vertical leaves the gravity vector in the sensor frame unchanged, so the readings carry no information about yaw. A magnetometer (lesson 11) supplies it.
:::end

:::exercise
A proof mass resonates at 5 kHz. How far does it deflect under 1 g?
:::solution
$x = a/\omega_n^2 = 9.81/(2\pi\cdot5000)^2 = 9.9$ nm. The comb capacitors detect fractions of that.
:::end

## Quiz

:::quiz
- type: num
  q: Pitch in degrees for a_x = 0.342 g and a_z = 0.940 g (a_y = 0)?
  answer: 19.997
  tol: 0.002
  unit: °
  py: "math.degrees(math.atan2(0.342,0.940))"
  explain: atan2.
- type: num
  q: False pitch in degrees from 0.1 g of forward acceleration?
  answer: 5.7106
  tol: 0.001
  unit: °
  py: "math.degrees(math.atan(0.1))"
  explain: Acceleration is indistinguishable from tilt.
- type: mc
  q: At rest on a level table, an accelerometer's z axis reads…
  options:
    - 0 g
    - +1 g (up)
    - −1 g
    - 9.81 g
  answer: 1
  explain: It measures specific force.
- type: num
  q: Deflection in nm of a 5 kHz proof mass under 1 g?
  answer: 9.94
  tol: 0.01
  unit: nm
  py: "9.81/(2*math.pi*5000)**2*1e9"
  explain: a/ω².
- type: mc
  q: atan2 is used instead of atan because…
  options:
    - it is faster
    - it handles all quadrants and a zero denominator
    - it removes noise
    - it gives yaw
  answer: 1
  explain: Full ±180° range.
- type: num
  q: Scatter in degrees after averaging 100 readings with 1.1° per reading?
  answer: 0.11
  tol: 0.001
  unit: °
  py: "1.1/10"
  explain: √N.
:::end

:::verify
import math
assert abs(math.degrees(math.atan2(0.342,0.94)) - 20) < 0.01
:::end
