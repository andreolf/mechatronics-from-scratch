---
id: p01-l16
minutes: 40
summary: Quaternions store orientation in four numbers with no gimbal lock, cheap composition and easy renormalisation, which is why every flight controller uses them. You derive the axis-angle form, the Hamilton product and the kinematic equation q̇ = ½ q ⊗ ω, then integrate gyro rates and interpolate with slerp.
---

## Four numbers for a rotation

A rotation by angle $\theta$ about a unit axis $\mathbf u$ is the unit quaternion

$$q = \Big(\cos\tfrac{\theta}{2},\ \sin\tfrac{\theta}{2}\,\mathbf u\Big) = (w,\ x,\ y,\ z), \qquad w^2 + x^2 + y^2 + z^2 = 1 .$$

The half angle is not a typo: $q$ and $-q$ give the same rotation (turning by $\theta + 2\pi$ flips every sign), so unit quaternions cover SO(3) twice. Four numbers with one constraint leave three degrees of freedom, like the rotation matrix, but with no singular configuration.

## The Hamilton product

Write $q = (s, \mathbf v)$ with scalar part $s$ and vector part $\mathbf v$. Quaternions multiply as

$$q_1 \otimes q_2 = \big(s_1 s_2 - \mathbf v_1\cdot\mathbf v_2,\ \ s_1\mathbf v_2 + s_2\mathbf v_1 + \mathbf v_1\times\mathbf v_2\big).$$

The cross product makes it non-commutative, matching rotations. Composition is a product, $q_{\text{total}} = q_1 \otimes q_2$, costing 16 multiplications against 27 for 3 × 3 matrices. To rotate a vector $\mathbf p$, embed it as $(0, \mathbf p)$ and compute

$$\mathbf p' = q \otimes (0, \mathbf p) \otimes q^{*}, \qquad q^* = (s, -\mathbf v).$$

Expanding this gives the rotation matrix

$$R(q) = \begin{pmatrix} 1 - 2(y^2 + z^2) & 2(xy - wz) & 2(xz + wy) \\ 2(xy + wz) & 1 - 2(x^2 + z^2) & 2(yz - wx) \\ 2(xz - wy) & 2(yz + wx) & 1 - 2(x^2 + y^2)\end{pmatrix}.$$

## Integrating a gyroscope

A body-frame gyro measures angular velocity $\boldsymbol\omega$. Over a short time $dt$ the body turns by the small rotation $(1, \tfrac12\boldsymbol\omega\,dt)$, so $q(t + dt) = q \otimes (1, \tfrac12\boldsymbol\omega dt)$. Subtract $q$ and divide by $dt$:

$$\dot q = \tfrac12\, q \otimes (0, \boldsymbol\omega).$$

For a rate that is constant over one sample period $h$, the exact update is $q_{k+1} = q_k \otimes \big(\cos\tfrac{\lVert\boldsymbol\omega\rVert h}{2},\ \sin\tfrac{\lVert\boldsymbol\omega\rVert h}{2}\,\hat{\boldsymbol\omega}\big)$. Renormalise after each step to remove round-off; with quaternions that is one division, against an SVD for matrices.

### Slerp

Spherical linear interpolation moves between orientations at constant angular speed:

$$\operatorname{slerp}(q_0, q_1, t) = \frac{\sin((1-t)\Omega)}{\sin\Omega}q_0 + \frac{\sin(t\Omega)}{\sin\Omega}q_1, \qquad \cos\Omega = q_0\cdot q_1 .$$

If $q_0\cdot q_1 < 0$, negate $q_1$ first so you take the short way round.

## Worked example: a 90° yaw

A 90° rotation about z: $q = (\cos 45°, 0, 0, \sin 45°) = (0.7071, 0, 0, 0.7071)$.

1. $R(q)$: $r_{11} = 1 - 2(0.5) = 0$, $r_{21} = 2(wz) = 1$, so $R\,\mathbf e_1 = (0, 1, 0)$, as expected.
2. Two of them: $q\otimes q = (0.5 - 0.5,\ 2 \cdot 0.7071 \cdot (0,0,0.7071)) = (0, 0, 0, 1)$, a 180° yaw.
3. Gyro: spinning at $\omega_z = 1$ rad/s for $\pi/2 = 1.5708$ s reaches the same $q$. With 1 kHz samples that's 1571 updates.
4. Halfway slerp from identity: a 45° yaw, $w = \cos 22.5° = 0.9239$.

## Code it from scratch

:::code file=quat.py
```python
import math
import numpy as np

def qmul(a, b):
    w1, x1, y1, z1 = a; w2, x2, y2, z2 = b
    return np.array([w1*w2 - x1*x2 - y1*y2 - z1*z2,
                     w1*x2 + x1*w2 + y1*z2 - z1*y2,
                     w1*y2 - x1*z2 + y1*w2 + z1*x2,
                     w1*z2 + x1*y2 - y1*x2 + z1*w2])

def qnormalise(q): return np.asarray(q, float) / np.linalg.norm(q)

def from_axis_angle(u, theta):
    u = np.asarray(u, float) / np.linalg.norm(u)
    return np.concatenate([[math.cos(theta / 2)], math.sin(theta / 2) * u])

def to_matrix(q):
    w, x, y, z = q
    return np.array([[1 - 2*(y*y + z*z), 2*(x*y - w*z), 2*(x*z + w*y)],
                     [2*(x*y + w*z), 1 - 2*(x*x + z*z), 2*(y*z - w*x)],
                     [2*(x*z - w*y), 2*(y*z + w*x), 1 - 2*(x*x + y*y)]])

def integrate_gyro(q, omega, h):
    n = np.linalg.norm(omega)
    if n < 1e-12: return q
    dq = np.concatenate([[math.cos(n * h / 2)], math.sin(n * h / 2) * np.asarray(omega) / n])
    return qnormalise(qmul(q, dq))

def slerp(q0, q1, t):
    d = float(np.dot(q0, q1))
    if d < 0: q1, d = -np.asarray(q1), -d
    if d > 0.9995: return qnormalise((1 - t) * np.asarray(q0) + t * np.asarray(q1))
    om = math.acos(d)
    return (math.sin((1 - t) * om) * np.asarray(q0) + math.sin(t * om) * np.asarray(q1)) / math.sin(om)

def rodrigues(u, th):
    u = np.asarray(u, float) / np.linalg.norm(u)
    K = np.array([[0, -u[2], u[1]], [u[2], 0, -u[0]], [-u[1], u[0], 0]])
    return np.eye(3) + math.sin(th) * K + (1 - math.cos(th)) * K @ K

if __name__ == "__main__":
    q = from_axis_angle([0, 0, 1], math.pi / 2)
    assert np.allclose(q, [2 ** -.5, 0, 0, 2 ** -.5]) and np.allclose(to_matrix(q) @ [1, 0, 0], [0, 1, 0])
    assert np.allclose(qmul(q, q), [0, 0, 0, 1])
    rng = np.random.default_rng(10)
    for _ in range(500):
        u, th = rng.standard_normal(3), rng.uniform(-math.pi, math.pi)
        assert np.allclose(to_matrix(from_axis_angle(u, th)), rodrigues(u, th), atol=1e-12)
    g = np.array([0.0, 0.0, 1.0]); qi = np.array([1.0, 0, 0, 0]); h = 1e-3
    for _ in range(round((math.pi / 2) / h)):
        qi = integrate_gyro(qi, g, h)
    assert np.allclose(qi, from_axis_angle(g, round((math.pi / 2) / h) * h), atol=1e-12)
    w_axis = np.array([0.3, -0.5, 0.8]); qi = np.array([1.0, 0, 0, 0])
    for _ in range(2000): qi = integrate_gyro(qi, w_axis, h)
    assert np.allclose(to_matrix(qi), rodrigues(w_axis, np.linalg.norm(w_axis) * 2.0), atol=1e-10)
    assert abs(slerp([1, 0, 0, 0], q, 0.5)[0] - math.cos(math.pi / 8)) < 1e-12
    print("quaternion matrix matches Rodrigues; gyro integration matches the analytic rotation")
```
:::end

## Exercises

:::exercise
Write the quaternion for a 60° roll (about x) and rotate $(0, 1, 0)$ with it.
:::solution
1. $q = (\cos 30°, \sin 30°, 0, 0) = (0.8660, 0.5, 0, 0)$.
2. Column 2 of $R(q)$: $(2(xy - wz),\ 1 - 2(x^2+z^2),\ 2(yz + wx)) = (0,\ 1 - 0.5,\ 2 \times 0.866 \times 0.5) = (0, 0.5, 0.8660)$.
3. That is $(0, \cos 60°, \sin 60°)$, the y axis turned 60° toward z.
:::end

:::exercise
A drone's gyro reads $\boldsymbol\omega = (0, 0, 2)$ rad/s for 0.25 s. What quaternion does the attitude change by?
:::solution
$\lVert\boldsymbol\omega\rVert h = 0.5$ rad, so $\Delta q = (\cos 0.25, 0, 0, \sin 0.25) = (0.9689, 0, 0, 0.2474)$, a 28.6° yaw.
:::end

## Quiz

:::quiz
- type: num
  q: What is the scalar part $w$ of the quaternion for a 60° rotation about any axis?
  answer: 0.86603
  tol: 0.001
  py: "math.cos(math.radians(30))"
  explain: $w = \cos(\theta/2) = \cos 30° = 0.8660$.
- type: num
  q: What is $w$ for the slerp halfway between the identity and a 90° yaw?
  answer: 0.92388
  tol: 0.001
  py: "math.cos(math.pi/8)"
  explain: Halfway is a 45° rotation, so $w = \cos 22.5° = 0.9239$.
- type: mc
  q: Why does the axis-angle form use θ/2?
  options:
    - To make the numbers smaller
    - Because q and −q represent the same rotation, unit quaternions cover SO(3) twice
    - It is a convention with no reason
    - To avoid computing cosines
  answer: 1
  explain: The map $\mathbf p \mapsto q\mathbf p q^*$ uses $q$ twice, so the angle in $q$ is half the rotation angle.
- type: mc
  q: Which equation propagates attitude from body-frame gyro rates?
  options:
    - q̇ = ω ⊗ q
    - q̇ = ½ q ⊗ (0, ω)
    - q̇ = 2 q ⊗ ω
    - q̇ = q · ω
  answer: 1
  explain: Body-frame rates multiply on the right, with the factor ½ from the half angle.
- type: num
  q: The gyro reads 2 rad/s about z for 0.25 s. What is the z component of $\Delta q$?
  answer: 0.2474
  tol: 0.002
  py: "math.sin(0.25)"
  explain: The rotation angle is 0.5 rad, so $z = \sin(0.25) = 0.2474$.
:::end

:::verify
import math
assert abs(math.cos(math.radians(30))-0.8660)<5e-5 and abs(2*0.8660254*0.5-0.8660)<5e-5
assert abs(math.cos(.25)-.9689)<5e-5 and abs(math.sin(.25)-.2474)<5e-5 and abs(math.degrees(.5)-28.6)<0.05
assert round((math.pi/2)/1e-3) == 1571
assert abs(math.cos(math.pi/8)-.9239)<5e-5
:::end
