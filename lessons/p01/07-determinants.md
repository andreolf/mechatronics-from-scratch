---
id: p01-l07
minutes: 25
summary: The determinant tells you how much a matrix scales area or volume, and whether it collapses space entirely. You compute it from the LU pivots you already have, and see how a zero determinant flags the arm configuration where a robot loses a direction of motion.
---

## Determinant as signed volume

Apply a 2 × 2 matrix to the unit square. The square becomes a parallelogram spanned by the columns $(a, c)$ and $(b, d)$, and its signed area is

$$\det\begin{pmatrix} a & b \\ c & d\end{pmatrix} = ad - bc .$$

In 3D the unit cube becomes a parallelepiped with signed volume $\det A = \mathbf a_1 \cdot (\mathbf a_2 \times \mathbf a_3)$, the triple product of the columns. The sign records orientation: a negative determinant means the map includes a mirror flip.

:::figure widget=matrix2d caption="The shaded square's area is det A. Drag the entries until the two columns line up: the area collapses to zero and the shading turns red when the orientation flips." args={"m":{"a":1,"b":0.6,"c":0.4,"d":1}}
:::end

Three properties follow from the volume picture:

- $\det(AB) = \det A\,\det B$: scaling volumes twice multiplies the factors.
- $\det A = 0$ exactly when the columns are linearly dependent, so $A$ squashes space into a lower dimension and has no inverse.
- Swapping two rows flips the sign; adding a multiple of one row to another leaves it unchanged.

## Compute it from LU

The last property means elimination doesn't change the determinant, only the row swaps do. From $PA = LU$ and $\det L = 1$:

$$\det A = (-1)^{s}\prod_{i} u_{ii},$$

where $s$ is the number of row swaps. This costs $\tfrac23 n^3$ operations. The textbook cofactor expansion costs $n!$ operations, which for $n = 20$ is $2.4 \times 10^{18}$: never use it in code.

## Worked example: when an arm loses a direction

For the 3 × 3 system of lesson 5, elimination swapped rows twice and produced pivots $-3$, $1.6667$ and $0.2$. So

$$\det A = (+1)(-3)(1.6667)(0.2) = -1 .$$

Now a robot example. A planar two-link arm with link lengths $l_1$, $l_2$ has a Jacobian (Phase 07) whose determinant is

$$\det J = l_1 l_2 \sin q_2 .$$

With $l_1 = 0.3$ m, $l_2 = 0.2$ m and the elbow at $q_2 = 30°$, $\det J = 0.3 \times 0.2 \times 0.5 = 0.03$ m². At $q_2 = 0$ the arm is stretched straight, $\det J = 0$, and the tip can't move radially outward no matter what the motors do. That configuration is a **singularity**, and the determinant is how a controller detects it.

## Code it from scratch

:::code file=det.py
```python
import math
import numpy as np

def det_lu(A):
    U = np.array(A, dtype=float)
    n, sign = U.shape[0], 1.0
    for k in range(n):
        p = k + np.argmax(np.abs(U[k:, k]))
        if U[p, k] == 0.0:
            return 0.0
        if p != k:
            U[[k, p]] = U[[p, k]]
            sign = -sign
        U[k + 1:, k:] -= np.outer(U[k + 1:, k] / U[k, k], U[k, k:])
    return sign * np.prod(np.diag(U))

def is_singular(A, rtol=1e-12):
    s = np.abs(np.array(A, dtype=float)).max()
    return abs(det_lu(A)) <= rtol * s ** len(A)

if __name__ == "__main__":
    assert abs(det_lu([[2, 1, -1], [-3, -1, 2], [-2, 1, 2]]) - (-1)) < 1e-12
    rng = np.random.default_rng(3)
    for _ in range(300):
        A = rng.standard_normal((6, 6)); B = rng.standard_normal((6, 6))
        assert math.isclose(det_lu(A), np.linalg.det(A), rel_tol=1e-9)
        assert math.isclose(det_lu(A @ B), det_lu(A) * det_lu(B), rel_tol=1e-8)
    J = lambda q2, l1=0.3, l2=0.2: [[-l1 - l2 * math.cos(q2), -l2 * math.cos(q2)],
                                     [-l2 * math.sin(q2), -l2 * math.sin(q2)]]
    assert abs(det_lu(J(math.radians(30))) - 0.03) < 1e-12
    assert is_singular(J(0.0)) and is_singular([[1, 2], [2, 4]])
    print("det via LU matches NumPy; singular configurations flagged")
```
:::end

The Jacobian in the code is written in a frame attached to link 1, which keeps its entries short; its determinant is the same $l_1 l_2 \sin q_2$ as in any other frame.

## Exercises

:::exercise
Compute $\det\begin{pmatrix} 3 & 1 \\ 2 & 4\end{pmatrix}$ and explain what it means for the unit square.
:::solution
1. $3\cdot 4 - 1\cdot 2 = 10$.
2. The unit square maps to a parallelogram of area 10 with the same orientation (positive sign).
:::end

:::exercise
If $A$ is 3 × 3 with $\det A = 5$, what is $\det(2A)$?
:::solution
Scaling every column by 2 scales the volume by $2^3$, so $\det(2A) = 8 \times 5 = 40$.
:::end

## Quiz

:::quiz
- type: num
  q: What is $\det\begin{pmatrix}3&1\\2&4\end{pmatrix}$?
  answer: 10
  tol: 0.0001
  py: "np.linalg.det([[3,1],[2,4]])"
  explain: $ad - bc = 12 - 2 = 10$.
- type: num
  q: A 3 × 3 matrix has $\det A = 5$. What is $\det(2A)$?
  answer: 40
  tol: 0.0001
  py: "np.linalg.det(2*np.diag([5,1,1]))"
  explain: Each of the three columns is doubled, so the volume grows by $2^3 = 8$.
- type: num
  q: A two-link arm has $l_1 = 0.4$ m, $l_2 = 0.25$ m and $q_2 = 90°$. What is $\det J = l_1 l_2 \sin q_2$ in m²?
  answer: 0.1
  tol: 0.0001
  py: "0.4*0.25*math.sin(math.pi/2)"
  explain: $0.4 \times 0.25 \times 1 = 0.1$ m². The elbow at 90° is the best-conditioned pose.
- type: mc
  q: Elimination on a 4 × 4 matrix used 3 row swaps and produced pivots 2, −1, 4, 0.5. What is det A?
  options:
    - "4"
    - "−4"
    - "5.5"
    - "0"
  answer: 0
  explain: The product of pivots is $-4$ and three swaps contribute $(-1)^3 = -1$, so $\det A = 4$.
- type: mc
  q: Why is cofactor expansion never used for large determinants in software?
  options:
    - It gives the wrong sign
    - Its cost grows like n!, while LU costs about 2n³/3
    - It only works for symmetric matrices
    - It needs complex numbers
  answer: 1
  explain: For $n = 20$ that is $2.4\times10^{18}$ operations against about 5300.
:::end

:::verify
import numpy as np, math
assert abs(np.linalg.det([[2,1,-1],[-3,-1,2],[-2,1,2]]) + 1) < 1e-12
assert abs(-3*(5/3)*0.2 + 1) < 1e-12
assert abs(0.3*0.2*math.sin(math.radians(30)) - 0.03) < 1e-15
assert abs(math.factorial(20) - 2.43e18) < 1e16
assert abs(2*(-1)*4*0.5*(-1)**3 - 4) < 1e-12
assert abs(2*20**3/3 - 5333) < 1
:::end
