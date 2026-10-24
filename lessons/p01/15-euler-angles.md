---
id: p01-l15
minutes: 30
summary: Roll, pitch and yaw are how pilots and ground stations talk about attitude. You extract ZYX Euler angles from a rotation matrix, find the singularity at ±90° pitch where two angles merge, and write a converter that detects it instead of returning garbage.
---

## Three angles, one convention

Any rotation can be built from three rotations about coordinate axes. Aerospace and most robotics software use the **ZYX** (yaw-pitch-roll) convention:

$$R = R_z(\psi)\,R_y(\theta)\,R_x(\phi).$$

Read right to left in the world frame, or left to right in the body frame: yaw $\psi$ about z, then pitch $\theta$ about the new y, then roll $\phi$ about the newest x. There are 12 valid orderings and libraries disagree on which to use, so always write down the convention next to the numbers.

Multiplying out, the entries you need are

$$R = \begin{pmatrix} c_\psi c_\theta & \cdot & \cdot \\ s_\psi c_\theta & \cdot & \cdot \\ -s_\theta & c_\theta s_\phi & c_\theta c_\phi\end{pmatrix},$$

where $c_\psi = \cos\psi$ and so on. So the extraction is

$$\theta = -\arcsin r_{31}, \qquad \psi = \operatorname{atan2}(r_{21}, r_{11}), \qquad \phi = \operatorname{atan2}(r_{32}, r_{33}).$$

Use `atan2`, not `atan`: it takes both signs into account and returns the full $(-\pi, \pi]$ range.

## Gimbal lock

When $\theta = \pm 90°$, $c_\theta = 0$, so $r_{11}$, $r_{21}$, $r_{32}$ and $r_{33}$ are all zero and both atan2 calls get $(0, 0)$. Physically, pitching the nose straight up lines up the roll axis with the original yaw axis. Yaw and roll now turn the body about the same axis, and only their difference $\phi - \psi$ (for $\theta = +90°$) is defined. One degree of freedom has vanished from the parametrisation, although nothing is wrong with the rotation itself.

At the singularity you pick a convention, typically $\psi = 0$, and recover $\phi$ from entries that remain informative. With $\psi = 0$ and $\theta = +90°$,

$$R = \begin{pmatrix} 0 & s_\phi & c_\phi\\ 0 & c_\phi & -s_\phi \\ -1 & 0 & 0\end{pmatrix} \;\Rightarrow\; \phi = \operatorname{atan2}(r_{12}, r_{22}).$$

For $\theta = -90°$ the same reasoning gives $\phi = \operatorname{atan2}(-r_{12}, r_{22})$.

Near the singularity, small attitude changes cause large swings in $\psi$ and $\phi$, which is why flight software integrates quaternions (next lesson) and converts to Euler angles only for display.

:::figure widget=rotation caption="Set pitch to 90°. Now move yaw and roll: both spin the body about the same world axis, and the readout reports gimbal lock."
:::end

## Worked example

Take $\psi = 30°$, $\theta = 20°$, $\phi = 10°$.

1. $r_{31} = -\sin 20° = -0.3420$, so $\theta = -\arcsin(-0.3420) = 20°$.
2. $r_{21} = \sin 30°\cos 20° = 0.4698$ and $r_{11} = \cos 30°\cos 20° = 0.8138$, so $\psi = \operatorname{atan2}(0.4698, 0.8138) = 30°$.
3. $r_{32} = \cos 20°\sin 10° = 0.1632$ and $r_{33} = \cos 20°\cos 10° = 0.9254$, so $\phi = 10°$.

## Code it from scratch

:::code file=euler.py
```python
import math
import numpy as np

def rotx(t): c, s = math.cos(t), math.sin(t); return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])
def roty(t): c, s = math.cos(t), math.sin(t); return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])
def rotz(t): c, s = math.cos(t), math.sin(t); return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])

def euler_zyx_to_R(yaw, pitch, roll):
    return rotz(yaw) @ roty(pitch) @ rotx(roll)

def R_to_euler_zyx(R, eps=1e-9):
    """Returns (yaw, pitch, roll, singular). At the singularity yaw is set to 0."""
    r31 = max(-1.0, min(1.0, R[2, 0]))
    pitch = -math.asin(r31)
    if abs(abs(r31) - 1) > eps:
        return math.atan2(R[1, 0], R[0, 0]), pitch, math.atan2(R[2, 1], R[2, 2]), False
    if r31 < 0:   # pitch = +90°
        return 0.0, math.pi / 2, math.atan2(R[0, 1], R[1, 1]), True
    return 0.0, -math.pi / 2, math.atan2(-R[0, 1], R[1, 1]), True

if __name__ == "__main__":
    d = math.radians
    y, p, r, sing = R_to_euler_zyx(euler_zyx_to_R(d(30), d(20), d(10)))
    assert not sing and np.allclose([y, p, r], [d(30), d(20), d(10)])
    rng = np.random.default_rng(9)
    for _ in range(10000):
        a = rng.uniform([-math.pi, -1.5, -math.pi], [math.pi, 1.5, math.pi])
        R = euler_zyx_to_R(*a)
        b = R_to_euler_zyx(R)
        assert not b[3] and np.allclose(b[:3], a, atol=1e-9)
    for pitch in (math.pi / 2, -math.pi / 2):
        R = euler_zyx_to_R(d(40), pitch, d(-25))
        y, p, r, sing = R_to_euler_zyx(R)
        assert sing and np.allclose(euler_zyx_to_R(y, p, r), R, atol=1e-12)
    print("round trip < 1e-9 away from the singularity; ±90° pitch detected and handled")
```
:::end

The singular case returns different angles from the ones you started with, but the same rotation matrix, which is the only thing that is well defined there.

## Exercises

:::exercise
A matrix has $r_{31} = 0.5$, $r_{11} = r_{21} = 0.6124$, $r_{32} = 0$ and $r_{33} = 0.8660$. Find the ZYX angles.
:::solution
1. $\theta = -\arcsin 0.5 = -30°$.
2. $\psi = \operatorname{atan2}(0.6124, 0.6124) = 45°$.
3. $\phi = \operatorname{atan2}(0, 0.866) = 0°$.
:::end

:::exercise
Why can't you fix gimbal lock by choosing a different Euler angle order?
:::solution
Every three-angle sequence has a singular configuration somewhere, because three angles can't cover SO(3) smoothly without one. A different order only moves the singularity, which can help if the vehicle never reaches it, as with a car that never pitches 90°. Quaternions avoid the problem by using four numbers.
:::end

## Quiz

:::quiz
- type: num
  q: For ψ = 30°, θ = 20°, φ = 10°, what is $r_{11} = \cos\psi\cos\theta$?
  answer: 0.8138
  tol: 0.001
  py: "math.cos(math.radians(30))*math.cos(math.radians(20))"
  explain: $0.8660 \times 0.9397 = 0.8138$.
- type: num
  q: A rotation matrix has $r_{31} = 0.5$. What is the pitch angle in degrees?
  answer: -30
  tol: 0.001
  unit: °
  py: "-math.degrees(math.asin(0.5))"
  explain: $\theta = -\arcsin(r_{31}) = -30°$.
- type: mc
  q: What happens at θ = ±90° in the ZYX convention?
  options:
    - The rotation matrix becomes singular
    - Yaw and roll act about the same axis, so only their combination is defined
    - Pitch becomes undefined
    - The determinant becomes zero
  answer: 1
  explain: The matrix is a perfectly good rotation; it's the angle parametrisation that loses a degree of freedom.
- type: mc
  q: Why use atan2(y, x) rather than atan(y/x)?
  options:
    - It is faster
    - It uses the signs of both arguments to return the correct quadrant over (−π, π]
    - It works in degrees
    - It avoids the need for sine
  answer: 1
  explain: atan only returns $(-\pi/2, \pi/2)$ and can't tell $(1,1)$ from $(-1,-1)$.
:::end

:::verify
import math, numpy as np
d = math.radians
assert abs(-math.sin(d(20))+0.3420)<5e-5
assert abs(math.sin(d(30))*math.cos(d(20))-0.4698)<5e-5 and abs(math.cos(d(30))*math.cos(d(20))-0.8138)<5e-5
assert abs(math.cos(d(20))*math.sin(d(10))-0.1632)<5e-5 and abs(math.cos(d(20))*math.cos(d(10))-0.9254)<5e-5
assert abs(math.degrees(math.atan2(0.4698,0.8138))-30)<0.01
# exercise: psi=45, theta=-30, phi=0
assert abs(math.cos(d(45))*math.cos(d(-30))-0.6124)<5e-5 and abs(-math.sin(d(-30))-0.5)<1e-12 and abs(math.cos(d(-30))-0.8660)<5e-5
:::end
