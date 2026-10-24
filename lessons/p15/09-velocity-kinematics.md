---
id: p15-l09
minutes: 40
summary: The Jacobian maps joint speeds to tool velocity, and for revolute joints each column can be written down from the joint's axis and position without differentiating anything. You derive the geometric Jacobian, with columns z cross (p minus p_i) and z, compute it for the lesson 03 arm, draw the velocity ellipsoid and the manipulability, and test every column against numerical differentiation of forward kinematics.
---

## One column per joint

Turn only joint $i$, at rate $\dot q_i$, about its axis: a unit vector $z_{i-1}$ through the point $p_{i-1}$, both in base coordinates. Everything outboard rotates rigidly, so the tool at $p$ moves with

$$v = \dot q_i\, z_{i-1} \times (p - p_{i-1}), \qquad \omega = \dot q_i\, z_{i-1}.$$

Adding all joints gives the **geometric Jacobian**:

$$\begin{bmatrix}v\\ \omega\end{bmatrix} = J(q)\,\dot q, \qquad J_i = \begin{bmatrix}z_{i-1} \times (p - p_{i-1})\\ z_{i-1}\end{bmatrix} \text{ (revolute)}, \qquad J_i = \begin{bmatrix}z_{i-1}\\ 0\end{bmatrix} \text{ (prismatic)}.$$

The $z_{i-1}$ and $p_{i-1}$ are just the $z$ axis and origin of DH frame $i - 1$, which forward kinematics already computes.

## The velocity ellipsoid

Joint speeds inside the unit ball $\|\dot q\| \le 1$ map to tool velocities inside an **ellipsoid** with semi-axes along the left singular vectors of $J_v$ (the linear rows), of lengths $\sigma_i$. A long axis is a direction the tool moves easily; a short one is hard. The volume measure

$$w = \sqrt{\det(J_vJ_v^T)} = \sigma_1\sigma_2\cdots$$

is the **manipulability**. It is zero at singular poses. For the arm lab's 2-link arm, $w = |\det J| = \ell_1\ell_2|\sin q_2|$, largest with the elbow at a right angle.

:::figure widget=velellipse caption="The arm lab's arm with its velocity ellipse at the tool: the tool velocities you get from all joint speed combinations of unit size. Straighten the elbow and the ellipse collapses to a line."
:::end

## Worked example

Lesson 03's arm at $q = (30°, 45°, -60°)$, tool at $p = (0.641, 0.370, 0.650)$ m:

1. Base yaw, $z_0 = (0, 0, 1)$ at the origin: $z_0 \times p = (-0.370, 0.641, 0)$.
2. The shoulder axis is $z_1 = (0.5, -0.866, 0)$ through $(0, 0, 0.4)$: $J_2 = (-0.217, -0.125, 0.740)$.
3. $J_v$ has singular values 0.854, 0.740 and 0.203 m/s per rad/s, so $w = 0.128$.
4. The shoulder at 0.5 rad/s alone moves the tool at $(-0.108, -0.063, 0.370)$ m/s, mostly upwards.
5. Numerical differentiation of FK agrees column by column to $10^{-7}$.

## Code it from scratch

This lesson reuses lesson 03's DH code.

:::code file=dh_fk.py
```python
import numpy as np   # lesson 03's DH forward kinematics, compact

def dh(theta, d, a, alpha):
    ct, st, ca, sa = np.cos(theta), np.sin(theta), np.cos(alpha), np.sin(alpha)
    return np.array([[ct, -st * ca, st * sa, a * ct], [st, ct * ca, -ct * sa, a * st], [0, sa, ca, d], [0, 0, 0, 1]])

DH_TABLE = [(0.0, 0.4, 0.0, np.pi / 2), (0.0, 0.0, 0.5, 0.0), (0.0, 0.0, 0.4, 0.0)]

def fk_dh(q, table=DH_TABLE):
    T = np.eye(4); frames = [T]
    for qi, (off, d, a, al) in zip(q, table):
        T = T @ dh(qi + off, d, a, al); frames.append(T)
    return T, frames
```
:::end

:::code file=jacobian.py
```python
import numpy as np
from dh_fk import fk_dh                    # lesson 03's arm, saved next to this file

def geometric_jacobian(q):
    """6 x n: linear rows z_{i-1} x (p - p_{i-1}), angular rows z_{i-1} (all joints revolute)"""
    T, frames = fk_dh(q); p = T[:3, 3]; J = np.zeros((6, len(q)))
    for i in range(len(q)):
        z, pi = frames[i][:3, 2], frames[i][:3, 3]
        J[:3, i] = np.cross(z, p - pi); J[3:, i] = z
    return J

def numeric_jacobian(q, h=1e-6):
    """central differences of position, and of orientation via R(q+h) R(q-h)^T"""
    J = np.zeros((6, len(q)))
    for i in range(len(q)):
        dq = np.zeros(len(q)); dq[i] = h
        Tp, _ = fk_dh(q + dq); Tm, _ = fk_dh(q - dq)
        J[:3, i] = (Tp[:3, 3] - Tm[:3, 3]) / (2 * h)
        A = Tp[:3, :3] @ Tm[:3, :3].T; W = (A - A.T) / (4 * h)         # skew part ~ skew(omega)
        J[3:, i] = [W[2, 1], W[0, 2], W[1, 0]]
    return J

def manipulability(Jv):
    return np.sqrt(max(np.linalg.det(Jv @ Jv.T), 0.0))

def test_matches_numeric():
    rng = np.random.default_rng(12)
    for q in rng.uniform(-np.pi, np.pi, (200, 3)):
        assert np.allclose(geometric_jacobian(q), numeric_jacobian(q), atol=1e-7)

def test_worked_example():
    q = np.radians([30, 45, -60]); J = geometric_jacobian(q); Jv = J[:3]
    np.set_printoptions(precision=4, suppress=True)
    print("linear Jacobian at (30, 45, -60) deg:\n", Jv)
    s = np.linalg.svd(Jv, compute_uv=False)
    print("singular values (m/s per rad/s):", s, " manipulability", round(manipulability(Jv), 4))
    v = Jv @ np.array([0.0, 0.5, 0.0])
    print("shoulder at 0.5 rad/s moves the tool at", v, "m/s")
    assert np.allclose(Jv[:, 0], np.cross([0, 0, 1], fk_dh(q)[0][:3, 3]))       # base yaw: z x p
    assert abs(manipulability(Jv) - np.prod(s)) < 1e-12

def test_singular_poses():
    # elbow straight (q3 = 0) or tool over the base axis (r = 0) both lose rank
    assert np.linalg.matrix_rank(geometric_jacobian(np.radians([10, 30, 0]))[:3], tol=1e-9) == 2
    q = np.array([0.3, np.radians(90), 0.0])          # arm straight up: tool on the base axis, and elbow straight
    assert manipulability(geometric_jacobian(q)[:3]) < 1e-9
    assert manipulability(geometric_jacobian(np.radians([30, 45, -60]))[:3]) > 0.05

test_matches_numeric()
test_worked_example()
test_singular_poses()
print("PASS")
```
:::end

## Exercises

:::exercise
The lesson 03 arm points straight up ($q_2 = 90°$, $q_3 = 0$). Name the two singularities at once.
:::solution
The elbow is straight, so the arm can't move the tool along its own length: lost radial motion. And the tool lies on the base axis, so the base yaw doesn't move it at all ($z_0 \times p = 0$). The rank of $J_v$ drops to 1.
:::end

:::exercise
Why is the geometric Jacobian's angular part not the derivative of roll, pitch and yaw?
:::solution
$\omega$ is the physical angular velocity vector. Rates of Euler angles are a different set of numbers related to it by a pose-dependent matrix, which is itself singular at gimbal lock. The derivative of an Euler-angle FK gives the *analytic* Jacobian, which differs from the geometric one by that matrix.
:::end

## Quiz

:::quiz
- type: num
  q: Manipulability of the lab arm at q2 = 90°?
  answer: 0.8
  tol: 0.001
  unit: m²
  py: "1.0*0.8*math.sin(math.pi/2)"
  explain: l1 l2 |sin q2|.
- type: num
  q: Manipulability of the lab arm at q2 = 30°?
  answer: 0.4
  tol: 0.001
  unit: m²
  py: "0.8*math.sin(math.radians(30))"
  explain: Half of the maximum.
- type: num
  q: Tool speed from the base yaw alone at 1 rad/s when the tool is 0.74 m from the vertical axis?
  answer: 0.74
  tol: 0.001
  unit: m/s
  py: "1*0.74"
  explain: "|z × p| is the distance from the axis."
- type: num
  q: Rank of the linear Jacobian of the lesson 03 arm with the elbow straight (q3 = 0) in a general pose?
  answer: 2
  tol: 0.001
  py: "2"
  explain: Radial motion along the arm is lost.
- type: mc
  q: Column i of the geometric Jacobian for a revolute joint has a linear part…
  options:
    - z(i−1) × (p − p(i−1))
    - p − p(i−1)
    - z(i−1)
    - zero
  answer: 0
  explain: The velocity of a point on a rotating body.
- type: mc
  q: The semi-axes of the velocity ellipsoid have lengths…
  options:
    - the singular values of the linear Jacobian
    - the joint lengths
    - the eigenvalues of q
    - one over the singular values
  answer: 0
  explain: The unit ball of joint speeds maps through J.
:::end
