---
id: p15-l04
minutes: 40
summary: The product of exponentials describes a robot by the screw axis of each joint in one fixed frame plus the tool's home pose, with no frame-placement rules at all. You derive the exponential of a twist with the Rodrigues formula, write the screw axes of the lesson 03 arm, implement forward kinematics in the space and body forms, and test that both agree with the DH version.
---

## Joints as screws

Every rigid motion is a rotation about some axis combined with a slide along it: a **screw motion**. A revolute joint is a screw with zero pitch. Describe it in the fixed base frame by a 6-vector

$$S = \begin{bmatrix}\omega\\ v\end{bmatrix}, \qquad v = -\omega \times p,$$

where $\omega$ is the unit axis direction and $p$ is any point on the axis. A prismatic joint has $\omega = 0$ and $v$ equal to the slide direction.

## The exponential map

Moving joint $i$ by $q_i$ moves everything outboard of it by $e^{[S_i]q_i}$, with $[S] = \begin{bmatrix}[\omega] & v\\ 0 & 0\end{bmatrix}$ and $[\omega]$ the skew matrix with $[\omega]x = \omega \times x$. Because $[\omega]^3 = -[\omega]$, the power series collapses (Rodrigues):

$$e^{[\omega]\theta} = I + \sin\theta\,[\omega] + (1 - \cos\theta)[\omega]^2,$$
$$e^{[S]\theta} = \begin{bmatrix}e^{[\omega]\theta} & \left(I\theta + (1 - \cos\theta)[\omega] + (\theta - \sin\theta)[\omega]^2\right)v\\ 0 & 1\end{bmatrix}.$$

## Product of exponentials

Put the robot at $q = 0$ and write the tool pose there as $M$. Moving the last joint first, then the one before it, and so on, gives the **space form**

$$T(q) = e^{[S_1]q_1}e^{[S_2]q_2}\cdots e^{[S_n]q_n}\,M.$$

The same axes expressed in the tool frame, $B_i = \mathrm{Ad}_{M^{-1}}S_i$, give the **body form** $T(q) = M e^{[B_1]q_1}\cdots e^{[B_n]q_n}$. Only two things are needed: the axes, read straight off a drawing of the robot at home, and $M$.

:::figure widget=screwaxes caption="The lesson 03 arm with each joint's screw axis drawn as a line through space. Pick a joint and move it: everything outboard turns about that line, which is what one exponential in the product does."
:::end

## Worked example

The lesson 03 arm at $q = 0$ lies along $x$ at shoulder height 0.4 m.

1. Base yaw: $\omega_1 = (0, 0, 1)$ through the origin, so $S_1 = (0, 0, 1, 0, 0, 0)$.
2. Shoulder: $\omega_2 = (0, -1, 0)$ (positive $q_2$ lifts the arm) through $(0, 0, 0.4)$: $v_2 = -\omega_2 \times p = (0.4, 0, 0)$.
3. Elbow: the same direction through $(0.5, 0, 0.4)$: $v_3 = (0.4, 0, -0.5)$.
4. $M$: tool at $(0.9, 0, 0.4)$ with the DH tool frame's axes $x = (1, 0, 0)$, $y = (0, 0, 1)$, $z = (0, -1, 0)$.
5. At $q = (30°, 45°, -60°)$ the product gives the tool at $(0.6408, 0.3700, 0.6500)$ m, the same as the DH table.

## Code it from scratch

This lesson reuses lesson 03's DH code, in compact form, to check the result.

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

:::code file=poe.py
```python
import numpy as np
from scipy.linalg import expm
from dh_fk import fk_dh            # lesson 03's DH forward kinematics, saved next to this file

def skew(w):
    return np.array([[0, -w[2], w[1]], [w[2], 0, -w[0]], [-w[1], w[0], 0]])

def se3(S):
    """6-vector screw (omega, v) -> 4x4 matrix [S]"""
    M = np.zeros((4, 4)); M[:3, :3] = skew(S[:3]); M[:3, 3] = S[3:]; return M

def exp_screw(S, th):
    """closed form of e^([S] theta) for a unit rotation axis (Rodrigues) or a pure translation"""
    w, v = np.asarray(S[:3], float), np.asarray(S[3:], float)
    T = np.eye(4)
    if np.linalg.norm(w) < 1e-12:
        T[:3, 3] = v * th; return T
    W = skew(w)
    T[:3, :3] = np.eye(3) + np.sin(th) * W + (1 - np.cos(th)) * W @ W
    T[:3, 3] = (np.eye(3) * th + (1 - np.cos(th)) * W + (th - np.sin(th)) * W @ W) @ v
    return T

def screw_revolute(axis, point):
    w = np.asarray(axis, float); return np.concatenate([w, -np.cross(w, point)])

def adjoint(T):
    R, p = T[:3, :3], T[:3, 3]; A = np.zeros((6, 6))
    A[:3, :3] = R; A[3:, 3:] = R; A[3:, :3] = skew(p) @ R; return A

# the lesson 03 arm at q = 0: stretched along x at shoulder height 0.4 m
S_LIST = [screw_revolute([0, 0, 1], [0, 0, 0]),        # base yaw about the vertical axis
          screw_revolute([0, -1, 0], [0, 0, 0.4]),     # shoulder: axis -y (positive lifts the arm)
          screw_revolute([0, -1, 0], [0.5, 0, 0.4])]   # elbow
M = np.array([[1, 0, 0, 0.9], [0, 0, -1, 0], [0, 1, 0, 0.4], [0, 0, 0, 1.0]])   # tool frame at home

def fk_space(q, S=S_LIST, M=M):
    T = np.eye(4)
    for Si, qi in zip(S, q): T = T @ exp_screw(Si, qi)
    return T @ M

def fk_body(q, S=S_LIST, M=M):
    B = [np.linalg.inv(adjoint(M)) @ Si for Si in S]     # the same axes seen from the tool frame
    T = M.copy()
    for Bi, qi in zip(B, q): T = T @ exp_screw(Bi, qi)
    return T

def test_closed_form_exponential():
    rng = np.random.default_rng(4)
    for _ in range(50):
        w = rng.normal(size=3); w /= np.linalg.norm(w); S = np.concatenate([w, rng.normal(size=3)]); th = rng.uniform(-3, 3)
        assert np.allclose(exp_screw(S, th), expm(se3(S) * th), atol=1e-10)

def test_agrees_with_dh():
    rng = np.random.default_rng(5)
    for q in rng.uniform(-np.pi, np.pi, (300, 3)):
        Tdh, _ = fk_dh(q)
        assert np.allclose(fk_space(q), Tdh) and np.allclose(fk_body(q), Tdh)
    q = np.radians([30, 45, -60])
    print("PoE tool position:", np.round(fk_space(q)[:3, 3], 4))
    print("screw axes S_i (omega, v):"); [print("  ", np.round(s, 3)) for s in S_LIST]

test_closed_form_exponential()
test_agrees_with_dh()
print("PASS")
```
:::end

## Exercises

:::exercise
Why does the space-form product apply $e^{[S_n]q_n}$ next to $M$ rather than $e^{[S_1]q_1}$?
:::solution
Move the last joint first: with every other joint at zero, its axis is exactly where the home drawing shows it, so $S_n$ is correct. Then move joint $n - 1$: it carries joint $n$ with it, but its own axis hasn't moved, and so on back to the base. Each axis is used while it is still at its home location.
:::end

:::exercise
Write $S$ for a prismatic joint that slides along the base $z$ axis.
:::solution
$S = (0, 0, 0, 0, 0, 1)$: no rotation, unit velocity along $z$. Its exponential is a pure translation by $q$ along $z$.
:::end

## Quiz

:::quiz
- type: num
  q: The x component of v for the elbow screw axis of the lesson 03 arm?
  answer: 0.4
  tol: 0.001
  unit: m
  py: "-np.cross([0,-1,0],[0.5,0,0.4])[0]"
  explain: v = −ω × p.
- type: num
  q: The z component of v for the elbow screw axis?
  answer: -0.5
  tol: 0.001
  unit: m
  py: "-np.cross([0,-1,0],[0.5,0,0.4])[2]"
  explain: The axis passes 0.5 m out along x.
- type: num
  q: How many numbers describe one screw axis?
  answer: 6
  tol: 0.001
  py: "3+3"
  explain: ω and v.
- type: num
  q: Trace of e^([ω]θ) for θ = 90° (any unit axis)?
  answer: 1
  tol: 0.001
  py: "1+2*math.cos(math.pi/2)"
  explain: A rotation's trace is 1 + 2 cos θ.
- type: mc
  q: Compared with DH, the product of exponentials needs…
  options:
    - no frame at each link, only the axes and the home pose M
    - exactly 4 numbers per joint
    - a frame on every link
    - the Jacobian
  answer: 0
  explain: Axes and M are all you need.
- type: mc
  q: A prismatic joint's screw has…
  options:
    - ω = 0
    - v = 0
    - ω parallel to v with pitch 1
    - an infinite rotation
  answer: 0
  explain: Pure translation.
:::end
