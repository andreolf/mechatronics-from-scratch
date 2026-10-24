---
id: p01-l17
minutes: 30
summary: A robot is a chain of frames, each placed relative to the one before. You pack a rotation and a translation into one 4 × 4 matrix, derive its inverse without a general matrix inversion, and locate a point seen by a wrist camera in the robot's base frame.
---

## Rotation plus translation in one matrix

A rigid-body pose is a rotation $R$ and a position $\mathbf p$. A point with coordinates $\mathbf x_B$ in frame B has coordinates in frame A

$$\mathbf x_A = R_{AB}\,\mathbf x_B + \mathbf p_{AB}.$$

This is affine, not linear, so it can't be a 3 × 3 matrix. Append a 1 to every point, $\tilde{\mathbf x} = (\mathbf x, 1)$, and it becomes a single matrix product:

$$\begin{pmatrix}\mathbf x_A \\ 1\end{pmatrix} = \underbrace{\begin{pmatrix} R_{AB} & \mathbf p_{AB} \\ \mathbf 0^\top & 1\end{pmatrix}}_{T_{AB}}\begin{pmatrix}\mathbf x_B\\1\end{pmatrix}.$$

These matrices form the group **SE(3)**. Chaining frames is multiplication, $T_{AC} = T_{AB}T_{BC}$, and the subscripts cancel like units, which is a good habit for catching mistakes. Directions (velocities, normals) get a 0 instead of a 1 so the translation doesn't touch them.

## The inverse costs almost nothing

Solve $\mathbf x_A = R\mathbf x_B + \mathbf p$ for $\mathbf x_B$: $\mathbf x_B = R^\top\mathbf x_A - R^\top\mathbf p$. So

$$T^{-1} = \begin{pmatrix} R^\top & -R^\top\mathbf p \\ \mathbf 0^\top & 1\end{pmatrix}.$$

No general 4 × 4 inversion, no pivoting, and the result stays exactly in SE(3). Production code should never call a generic `inv` on a transform.

## Worked example: a wrist camera sees a bolt

The gripper frame G sits at $\mathbf p = (0.5, 0, 0.3)$ m in the base frame B, rotated 90° about z. A camera on the gripper reports a bolt at $\mathbf x_G = (0.1, 0, 0)$ m.

1. $R_z(90°)\,(0.1, 0, 0) = (0, 0.1, 0)$.
2. Add the translation: $\mathbf x_B = (0.5, 0.1, 0.3)$ m.

The inverse transform maps the base frame into the gripper frame:

$$-R^\top\mathbf p = -R_z(-90°)(0.5, 0, 0.3) = -(0, -0.5, 0.3) = (0, 0.5, -0.3).$$

Check: $T^{-1}$ applied to $(0.5, 0.1, 0.3)$ gives $R^\top(0.5, 0.1, 0.3) + (0, 0.5, -0.3) = (0.1, -0.5, 0.3) + (0, 0.5, -0.3) = (0.1, 0, 0)$, the bolt in the camera's frame again.

## Code it from scratch

:::code file=se3.py
```python
import math
import numpy as np

def rotz(t): c, s = math.cos(t), math.sin(t); return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1.0]])
def rotx(t): c, s = math.cos(t), math.sin(t); return np.array([[1.0, 0, 0], [0, c, -s], [0, s, c]])

def transform(R, p):
    T = np.eye(4); T[:3, :3] = R; T[:3, 3] = p
    return T

def inv(T):
    R, p = T[:3, :3], T[:3, 3]
    return transform(R.T, -R.T @ p)

def apply(T, x, point=True):
    return T[:3, :3] @ np.asarray(x, float) + (T[:3, 3] if point else 0)

if __name__ == "__main__":
    T_BG = transform(rotz(math.pi / 2), [0.5, 0, 0.3])
    assert np.allclose(apply(T_BG, [0.1, 0, 0]), [0.5, 0.1, 0.3])
    assert np.allclose(inv(T_BG)[:3, 3], [0, 0.5, -0.3])
    assert np.allclose(apply(inv(T_BG), [0.5, 0.1, 0.3]), [0.1, 0, 0])
    assert np.allclose(apply(T_BG, [1, 0, 0], point=False), [0, 1, 0])   # directions ignore p
    rng = np.random.default_rng(11)
    for _ in range(1000):
        T = transform(rotz(rng.uniform(-3, 3)) @ rotx(rng.uniform(-3, 3)), rng.standard_normal(3))
        U = transform(rotx(rng.uniform(-3, 3)), rng.standard_normal(3))
        x = rng.standard_normal(3)
        assert np.allclose(T @ inv(T), np.eye(4), atol=1e-12)
        assert np.allclose(apply(T, x), T[:3, :3] @ x + T[:3, 3])
        assert np.allclose(apply(T @ U, x), apply(T, apply(U, x)))
    print("T @ inv(T) = I; chained transforms equal sequential application")
```
:::end

## Exercises

:::exercise
A lidar is mounted 0.2 m forward and 0.4 m above a robot's base, with no rotation. It sees an obstacle at $(3, -1, -0.4)$ m in its own frame. Where is the obstacle in the base frame?
:::solution
With $R = I$: $\mathbf x_B = (3, -1, -0.4) + (0.2, 0, 0.4) = (3.2, -1, 0)$ m, on the ground in front and to the right.
:::end

:::exercise
If $T_{WA}$ places robot A in the world and $T_{WB}$ places robot B, what transform gives B's pose as seen by A?
:::solution
$T_{AB} = T_{AW}T_{WB} = T_{WA}^{-1}T_{WB}$. The inner subscripts cancel: A to W to B.
:::end

## Quiz

:::quiz
- type: num
  q: In the worked example, what is the y coordinate of the bolt in the base frame (in metres)?
  answer: 0.1
  tol: 0.001
  unit: m
  py: "(np.array([[0,-1,0],[1,0,0],[0,0,1]]) @ [0.1,0,0] + [0.5,0,0.3])[1]"
  explain: $R_z(90°)$ turns $(0.1,0,0)$ into $(0, 0.1, 0)$; adding $\mathbf p$ gives $(0.5, 0.1, 0.3)$.
- type: mc
  q: What is the translation part of $T^{-1}$?
  options:
    - −p
    - −Rᵀp
    - Rᵀp
    - −Rp
  answer: 1
  explain: From $\mathbf x_B = R^\top(\mathbf x_A - \mathbf p)$.
- type: mc
  q: To transform a velocity vector with a 4 × 4 transform, you append…
  options:
    - a 1, so translation applies
    - a 0, so only rotation applies
    - the norm of the vector
    - nothing; velocities can't be transformed
  answer: 1
  explain: Directions don't depend on where the origin is, so the fourth coordinate is 0.
- type: num
  q: In the lidar example, what is the base-frame x coordinate of the obstacle?
  answer: 3.2
  tol: 0.001
  unit: m
  py: "3 + 0.2"
  explain: There is no rotation, so add the mounting offset, $3 + 0.2 = 3.2$ m.
:::end

:::verify
import numpy as np
Rz = np.array([[0,-1,0],[1,0,0],[0,0,1.]]); p = np.array([.5,0,.3])
assert np.allclose(Rz@[.1,0,0]+p,[.5,.1,.3]) and np.allclose(-Rz.T@p,[0,.5,-.3]) and np.allclose(Rz.T@[.5,.1,.3],[.1,-.5,.3])
assert np.allclose(np.array([3,-1,-.4])+[.2,0,.4],[3.2,-1,0])
:::end
