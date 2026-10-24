---
id: p01-l14
minutes: 30
summary: Rotation matrices describe orientation in every robot, drone and IMU. You derive the elementary rotations about x, y and z, prove why RᵀR = I and det R = 1, see that rotation order matters, and keep a matrix valid through a million compositions.
---

## A rotation's columns are the rotated axes

From lesson 4, a matrix's columns are the images of the basis vectors. Rotating the plane by an angle $\theta$ sends $\mathbf e_1 \mapsto (\cos\theta, \sin\theta)$ and $\mathbf e_2 \mapsto (-\sin\theta, \cos\theta)$. In 3D, a rotation about the z axis leaves $\mathbf e_3$ alone:

$$R_z(\theta) = \begin{pmatrix} \cos\theta & -\sin\theta & 0 \\ \sin\theta & \cos\theta & 0 \\ 0 & 0 & 1\end{pmatrix},$$

$$R_x(\theta) = \begin{pmatrix} 1 & 0 & 0 \\ 0 & \cos\theta & -\sin\theta \\ 0 & \sin\theta & \cos\theta\end{pmatrix}, \qquad R_y(\theta) = \begin{pmatrix} \cos\theta & 0 & \sin\theta \\ 0 & 1 & 0 \\ -\sin\theta & 0 & \cos\theta\end{pmatrix}.$$

Note the sign pattern of $R_y$: it follows from the cyclic order $z \to x$, which makes the $-\sin$ land in the bottom row.

## The group SO(3)

A rotation preserves lengths and angles, so for all vectors $(R\mathbf a)\cdot(R\mathbf b) = \mathbf a\cdot\mathbf b$, which means $\mathbf a^\top R^\top R\,\mathbf b = \mathbf a^\top\mathbf b$. That holds for every pair only if

$$R^\top R = I, \qquad\text{so}\qquad R^{-1} = R^\top .$$

Taking determinants, $(\det R)^2 = 1$. Rotations can be reached continuously from the identity, which has $\det = 1$, so $\det R = +1$; matrices with $\det = -1$ include a mirror. The set of such matrices is the **special orthogonal group** SO(3). Its nine entries satisfy six independent constraints ($R^\top R = I$ is symmetric), leaving 3 degrees of freedom: three numbers describe any orientation.

Composition is matrix multiplication, and it doesn't commute. In the frame of a robot, $R = R_1 R_2$ means "apply $R_2$ in the frame already rotated by $R_1$".

:::figure widget=rotation caption="Yaw, pitch and roll build R = R_z(ψ) R_y(θ) R_x(φ). The readout shows R and its determinant, which stays 1 for every setting."
:::end

## Worked example: order matters

Rotate the vector $\mathbf e_1 = (1, 0, 0)$ by 90° about x and 90° about z, in both orders.

- $R_z(90°)R_x(90°)\,\mathbf e_1$: $R_x$ leaves $\mathbf e_1$ alone, then $R_z$ turns it to $(0, 1, 0)$.
- $R_x(90°)R_z(90°)\,\mathbf e_1$: $R_z$ turns it to $(0, 1, 0)$, then $R_x$ turns that to $(0, 0, 1)$.

Same rotations, different end points. A smaller example with numbers: $R_z(30°)\,\mathbf e_1 = (0.8660,\ 0.5,\ 0)$.

## Code it from scratch

Every multiplication adds round-off, so after many compositions $R^\top R$ drifts from $I$. You repair it by projecting back onto SO(3): the nearest rotation to $M = U\Sigma V^\top$ is $UV^\top$ (with a sign fix if the determinant is negative).

:::code file=rotations.py
```python
import math
import numpy as np

def rotx(t):
    c, s = math.cos(t), math.sin(t)
    return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])

def roty(t):
    c, s = math.cos(t), math.sin(t)
    return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])

def rotz(t):
    c, s = math.cos(t), math.sin(t)
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])

def is_rotation(R, tol=1e-9):
    R = np.asarray(R)
    return R.shape == (3, 3) and np.allclose(R.T @ R, np.eye(3), atol=tol) and abs(np.linalg.det(R) - 1) < tol

def orthonormalise(R):
    U, _, Vt = np.linalg.svd(R)
    D = np.diag([1, 1, np.sign(np.linalg.det(U @ Vt))])
    return U @ D @ Vt

if __name__ == "__main__":
    q = math.pi / 2
    assert np.allclose(rotz(q) @ rotx(q) @ [1, 0, 0], [0, 1, 0])
    assert np.allclose(rotx(q) @ rotz(q) @ [1, 0, 0], [0, 0, 1])
    assert np.allclose(rotz(math.radians(30)) @ [1, 0, 0], [0.866025, 0.5, 0], atol=1e-6)
    assert all(is_rotation(f(0.7)) for f in (rotx, roty, rotz))
    assert not is_rotation(np.diag([1, 1, -1]))

    step = rotz(1e-3) @ roty(2e-3) @ rotx(-1.5e-3)
    R_raw, R_fix = np.eye(3), np.eye(3)
    for k in range(1, 1_000_001):
        R_raw = R_raw @ step
        R_fix = R_fix @ step
        if k % 1000 == 0:
            R_fix = orthonormalise(R_fix)
    drift = lambda R: np.abs(R.T @ R - np.eye(3)).max()
    print(f"after 10^6 compositions: drift without repair {drift(R_raw):.1e}, with repair {drift(R_fix):.1e}")
    assert drift(R_fix) < 1e-13 and is_rotation(R_fix)
```
:::end

## Exercises

:::exercise
Show that $R_z(\alpha)R_z(\beta) = R_z(\alpha + \beta)$.
:::solution
Multiply out the top-left 2 × 2 block: the $(1,1)$ entry is $\cos\alpha\cos\beta - \sin\alpha\sin\beta = \cos(\alpha+\beta)$ and the $(2,1)$ entry is $\sin\alpha\cos\beta + \cos\alpha\sin\beta = \sin(\alpha + \beta)$. The others follow the same way. Rotations about the same axis do commute.
:::end

:::exercise
Is $M = \begin{pmatrix} 0 & 1 & 0 \\ 1 & 0 & 0 \\ 0 & 0 & 1\end{pmatrix}$ a rotation?
:::solution
$M^\top M = I$, so it is orthogonal, but swapping two rows of $I$ gives $\det M = -1$. It is a reflection across the plane $x = y$, not a rotation.
:::end

## Quiz

:::quiz
- type: num
  q: What is the y component of $R_z(30°)\,(1, 0, 0)$?
  answer: 0.5
  tol: 0.001
  py: "math.sin(math.radians(30))"
  explain: The first column of $R_z(30°)$ is $(\cos 30°, \sin 30°, 0) = (0.866, 0.5, 0)$.
- type: mc
  q: What is the inverse of a rotation matrix R?
  options:
    - −R
    - Rᵀ
    - R itself
    - 1/det R
  answer: 1
  explain: $R^\top R = I$ means $R^\top$ undoes $R$, which is why inverting a rotation costs nothing.
- type: num
  q: How many degrees of freedom does SO(3) have?
  answer: 3
  tol: 0.0001
  py: "9 - 6"
  explain: Nine entries minus the six independent constraints in $R^\top R = I$.
- type: mc
  q: What does $R_x(90°)R_z(90°)$ do to $(1,0,0)$?
  options:
    - (0, 1, 0)
    - (0, 0, 1)
    - (1, 0, 0)
    - (0, −1, 0)
  answer: 1
  explain: $R_z$ acts first and gives $(0,1,0)$; $R_x(90°)$ then turns $\mathbf e_2$ into $\mathbf e_3$.
- type: mc
  q: The matrix that swaps x and y is orthogonal. Why isn't it a rotation?
  options:
    - Its determinant is −1, so it is a reflection
    - It changes lengths
    - It is not square
    - It has no inverse
  answer: 0
  explain: Rotations have $\det R = +1$.
:::end

:::verify
import numpy as np, math
c, s = math.cos(math.radians(30)), math.sin(math.radians(30))
assert abs(c-0.8660)<5e-5 and abs(s-0.5)<1e-12
M = np.array([[0,1,0],[1,0,0],[0,0,1.]]); assert np.allclose(M.T@M,np.eye(3)) and abs(np.linalg.det(M)+1)<1e-12
:::end
