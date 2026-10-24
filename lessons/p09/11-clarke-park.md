---
id: p09-l11
minutes: 35
summary: Three sinusoidal phase currents are awkward to control, because their setpoints keep moving. You derive the Clarke transform to two orthogonal axes and the Park transform into a frame that rotates with the rotor, where balanced currents become two constants, then implement both with inverses and check the round trip to 1e-12.
---

## Three currents, two degrees of freedom

In a star-connected motor without a neutral wire, $i_a + i_b + i_c = 0$, so only two currents are independent. The **Clarke transform** projects them onto two orthogonal stationary axes, α (along phase a) and β (90° ahead):

$$\begin{bmatrix}i_\alpha\\ i_\beta\end{bmatrix} = \frac23\begin{bmatrix}1 & -\tfrac12 & -\tfrac12\\ 0 & \tfrac{\sqrt3}{2} & -\tfrac{\sqrt3}{2}\end{bmatrix}\begin{bmatrix}i_a\\ i_b\\ i_c\end{bmatrix}.$$

The factor 2/3 makes it **amplitude-invariant**: a balanced set of amplitude $I$ becomes a vector of length $I$. (With $\sqrt{2/3}$ instead it's power-invariant; drives mostly use 2/3.) With $i_a + i_b + i_c = 0$, it simplifies to $i_\alpha = i_a$ and $i_\beta = (i_a + 2i_b)/\sqrt3$, which needs only two current sensors.

## Rotating with the rotor

For a balanced set $i_a = I\cos(\theta + \gamma)$ and so on, $(i_\alpha, i_\beta)$ is a vector of length $I$ spinning at the electrical speed. The **Park transform** rotates by $-\theta$, the rotor's electrical angle:

$$\begin{bmatrix}i_d\\ i_q\end{bmatrix} = \begin{bmatrix}\cos\theta & \sin\theta\\ -\sin\theta & \cos\theta\end{bmatrix}\begin{bmatrix}i_\alpha\\ i_\beta\end{bmatrix} = I\begin{bmatrix}\cos\gamma\\ \sin\gamma\end{bmatrix}.$$

The result is two **constants**: $i_d$ along the magnet's flux (d for direct) and $i_q$ in quadrature, 90° ahead. Constants are what PI controllers are good at (lesson 7), which is the whole idea of field-oriented control (lesson 12).

The inverses are the transpose of the rotation and $i_a = i_\alpha$, $i_b = -\tfrac12 i_\alpha + \tfrac{\sqrt3}2 i_\beta$, $i_c = -\tfrac12 i_\alpha - \tfrac{\sqrt3}2 i_\beta$.

:::figure widget=clarkepark caption="Phase currents against rotor angle (top), and the α–β vector with the rotating d–q axes (bottom). Slide the rotor angle: a, b and c change, but i_d and i_q stay fixed."
:::end

## Worked example

At $\theta = 40°$ the phase currents are $i_a = -0.643$, $i_b = 0.985$, $i_c = -0.342$ A (a 1 A set with $\gamma = 90°$).

1. Clarke: $i_\alpha = \tfrac23(-0.643 - 0.4925 + 0.171) = -0.643$; $i_\beta = (0.985 + 0.342)/\sqrt3 = 0.766$.
2. Park: $i_d = -0.643\cos40° + 0.766\sin40° = -0.4925 + 0.4925 = 0.000$.
3. $i_q = 0.643\sin40° + 0.766\cos40° = 0.413 + 0.587 = 1.000$ A.

All the current is in the torque-producing q axis.

## Code it from scratch

:::code file=clarke_park.py
```python
import numpy as np

S3 = np.sqrt(3)

def clarke(a, b, c):
    return (2 / 3) * (a - b / 2 - c / 2), (b - c) / S3

def inv_clarke(al, be):
    return al, -al / 2 + S3 / 2 * be, -al / 2 - S3 / 2 * be

def park(al, be, th):
    return al * np.cos(th) + be * np.sin(th), -al * np.sin(th) + be * np.cos(th)

def inv_park(d, q, th):
    return d * np.cos(th) - q * np.sin(th), d * np.sin(th) + q * np.cos(th)

if __name__ == "__main__":
    rng = np.random.default_rng(11)
    th = rng.uniform(-np.pi, np.pi, 100000)
    d0, q0 = rng.normal(size=th.size), rng.normal(size=th.size)
    a, b, c = inv_clarke(*inv_park(d0, q0, th))
    assert np.max(np.abs(a + b + c)) < 1e-12                 # inverse Clarke gives a balanced set
    d1, q1 = park(*clarke(a, b, c), th)
    err = max(np.max(np.abs(d1 - d0)), np.max(np.abs(q1 - q0)))
    print(f"round-trip error {err:.2e}")
    assert err < 1e-12
    # a balanced rotating set becomes constants in dq
    t = np.linspace(0, 2 * np.pi, 1000); g = np.radians(90)
    ia, ib, ic = (np.cos(t + g - k * 2 * np.pi / 3) for k in range(3))
    d, q = park(*clarke(ia, ib, ic), t)
    assert np.ptp(d) < 1e-12 and np.ptp(q) < 1e-12 and abs(q[0] - 1) < 1e-12
    # the two-sensor shortcut matches when a + b + c = 0
    al, be = clarke(ia, ib, ic)
    assert np.allclose(al, ia) and np.allclose(be, (ia + 2 * ib) / S3)
    # worked example
    d, q = park(*clarke(*(np.cos(np.radians(40) + g - k * 2 * np.pi / 3) for k in range(3))), np.radians(40))
    assert abs(d) < 1e-12 and abs(q - 1) < 1e-12
```
:::end

## Exercises

:::exercise
Why does the drive need the rotor angle θ to be accurate, and what happens if it's off by 10°?
:::solution
Park rotates by θ, so a 10° error rotates the computed dq frame by 10°. The controller then puts the current at 10° from where it thinks: a demanded pure $i_q$ becomes $i_q\cos10° = 0.985\,i_q$ of torque current plus $i_q\sin10° = 0.17\,i_q$ on the d axis, which wastes current. Large errors (90°) kill torque entirely.
:::end

:::exercise
Show that the Park transform preserves the vector's length.
:::solution
It's a rotation matrix: $R^TR = I$, so $i_d^2 + i_q^2 = i_\alpha^2 + i_\beta^2$. Rotations never change length.
:::end

## Quiz

:::quiz
- type: num
  q: i_β in A for i_a = −0.643, i_b = 0.985, i_c = −0.342?
  answer: 0.766
  tol: 0.002
  unit: A
  py: "(0.985+0.342)/math.sqrt(3)"
  explain: (i_b − i_c)/√3.
- type: num
  q: i_q in A at θ = 40° for i_α = −0.643, i_β = 0.766?
  answer: 1.0
  tol: 0.002
  unit: A
  py: "0.643*math.sin(math.radians(40))+0.766*math.cos(math.radians(40))"
  explain: −i_α sin θ + i_β cos θ.
- type: num
  q: Torque-current fraction with a 10° angle error?
  answer: 0.9848
  tol: 0.001
  py: "math.cos(math.radians(10))"
  explain: cos of the error.
- type: num
  q: Length of the α–β vector for a balanced set of amplitude 2 A (amplitude-invariant Clarke)?
  answer: 2
  tol: 0.001
  unit: A
  py: "2"
  explain: The 2/3 factor keeps amplitude.
- type: mc
  q: In the dq frame, balanced sinusoidal currents look like…
  options:
    - sinusoids at twice the frequency
    - constants
    - square waves
    - noise
  answer: 1
  explain: The frame rotates with them.
- type: mc
  q: The d axis points…
  options:
    - along phase a
    - along the rotor magnet's flux
    - 90° ahead of the rotor flux
    - along the stator current
  answer: 1
  explain: q is 90° ahead of d.
:::end

:::verify
import math
t, g = math.radians(40), math.radians(90)
ia, ib, ic = (math.cos(t + g - k*2*math.pi/3) for k in range(3))
assert abs(ia + 0.643) < 1e-3 and abs(ib - 0.985) < 1e-3 and abs(ic + 0.342) < 1e-3
:::end
