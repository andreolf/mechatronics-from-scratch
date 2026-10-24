---
id: p01-l04
minutes: 30
summary: A matrix is a machine that moves vectors. You read a matrix column by column as the images of the basis vectors, see why the order of multiplication matters, and write matrix multiplication with three loops before comparing it with NumPy.
---

## A matrix is defined by what it does to the axes

Any vector in the plane is a combination of the basis vectors $\mathbf e_1 = (1,0)$ and $\mathbf e_2 = (0,1)$: $\mathbf x = x_1\mathbf e_1 + x_2 \mathbf e_2$. A linear map $f$ respects sums and scaling, so

$$f(\mathbf x) = x_1 f(\mathbf e_1) + x_2 f(\mathbf e_2).$$

The whole map is therefore fixed by two vectors, $f(\mathbf e_1)$ and $f(\mathbf e_2)$. Stack them as the columns of a matrix and you have $A$:

$$A = \begin{pmatrix} | & | \\ f(\mathbf e_1) & f(\mathbf e_2) \\ | & | \end{pmatrix}, \qquad A\mathbf x = x_1 \,(\text{column 1}) + x_2\,(\text{column 2}).$$

This is the most useful way to read a matrix. A rotation matrix's columns are the rotated axes; a robot's Jacobian columns are the tip velocity each joint produces alone.

:::figure widget=matrix2d caption="Change the four entries. The lime and blue arrows are the columns of A, the images of e₁ and e₂; the grid shows where every other point goes."
:::end

## Composition is multiplication

Applying $B$ first and then $A$ sends $\mathbf x$ to $A(B\mathbf x)$. The matrix of this combined map is the product $AB$, whose column $j$ is $A$ times column $j$ of $B$. Writing out one entry,

$$(AB)_{ij} = \sum_{k} A_{ik} B_{kj}.$$

Because "first $B$, then $A$" differs from "first $A$, then $B$", in general $AB \ne BA$. For an $n\times n$ product each of the $n^2$ entries needs $n$ multiplications, so the cost is $n^3$ multiply-adds.

## Worked example: rotate, then stretch

Let $R$ rotate by 90° and $S$ stretch the x axis by 2:

$$R = \begin{pmatrix} 0 & -1 \\ 1 & 0 \end{pmatrix}, \qquad S = \begin{pmatrix} 2 & 0 \\ 0 & 1 \end{pmatrix}.$$

Rotate first, then stretch: $SR = \begin{pmatrix} 0 & -2 \\ 1 & 0 \end{pmatrix}$, so $SR\,\mathbf e_1 = (0, 1)$. The x axis turns to point up, and the stretch along x no longer affects it.

Stretch first, then rotate: $RS = \begin{pmatrix} 0 & -1 \\ 2 & 0 \end{pmatrix}$, so $RS\,\mathbf e_1 = (0, 2)$. The axis is stretched to length 2 and then turned.

Same two operations, different results. In robotics, the order of joint transforms in a kinematic chain matters for the same reason.

## Code it from scratch

:::code file=matmul.py
```python
import time
import numpy as np

def matmul(A, B):
    n, m = len(A), len(A[0])
    assert m == len(B), "inner dimensions must match"
    p = len(B[0])
    C = [[0.0] * p for _ in range(n)]
    for i in range(n):
        for j in range(p):
            s = 0.0
            for k in range(m):
                s += A[i][k] * B[k][j]
            C[i][j] = s
    return C

if __name__ == "__main__":
    R = [[0, -1], [1, 0]]
    S = [[2, 0], [0, 1]]
    assert matmul(S, R) == [[0, -2], [1, 0]]
    assert matmul(R, S) == [[0, -1], [2, 0]]
    rng = np.random.default_rng(0)
    A, B = rng.standard_normal((120, 80)), rng.standard_normal((80, 100))
    t0 = time.perf_counter(); C1 = np.array(matmul(A.tolist(), B.tolist())); t1 = time.perf_counter()
    C2 = A @ B; t2 = time.perf_counter()
    assert np.allclose(C1, C2, rtol=0, atol=1e-12)
    print(f"loops {1e3*(t1-t0):.1f} ms, NumPy {1e3*(t2-t1):.3f} ms, max diff {abs(C1-C2).max():.1e}")
```
:::end

The loops and NumPy agree to $10^{-12}$, but NumPy is hundreds of times faster because it calls optimised BLAS code that uses the CPU's vector units and caches. You write the loops once to understand the operation, then use the library.

## Exercises

:::exercise
Find the matrix that reflects the plane across the line $y = x$.
:::solution
1. The reflection swaps the axes: $\mathbf e_1 = (1,0) \mapsto (0,1)$ and $\mathbf e_2 = (0,1)\mapsto(1,0)$.
2. Those images are the columns: $A = \begin{pmatrix} 0 & 1 \\ 1 & 0\end{pmatrix}$.
3. Check: $A(3, 5) = (5, 3)$.
:::end

:::exercise
Compute $AB$ and $BA$ for $A = \begin{pmatrix}1 & 2\\3 & 4\end{pmatrix}$ and $B = \begin{pmatrix}0 & 1\\1&0\end{pmatrix}$, and describe what $B$ does in each case.
:::solution
1. $AB = \begin{pmatrix}2 & 1\\4 & 3\end{pmatrix}$: multiplying by $B$ on the right swaps the columns of $A$.
2. $BA = \begin{pmatrix}3 & 4\\1 & 2\end{pmatrix}$: multiplying on the left swaps the rows.
:::end

## Quiz

:::quiz
- type: num
  q: For $A = \begin{pmatrix}1&2\\3&4\end{pmatrix}$ and $B = \begin{pmatrix}0&1\\1&0\end{pmatrix}$, what is the entry $(AB)_{21}$ (row 2, column 1)?
  answer: 4
  tol: 0.0001
  py: "(np.array([[1,2],[3,4]]) @ np.array([[0,1],[1,0]]))[1,0]"
  explain: Row 2 of $A$ is $(3,4)$, column 1 of $B$ is $(0,1)$, so $3\cdot 0 + 4\cdot 1 = 4$.
- type: mc
  q: The second column of a matrix A is…
  options:
    - the image of e₂ under A
    - the image of e₁ under A
    - always a unit vector
    - the second eigenvector
  answer: 0
  explain: $A\mathbf e_2$ picks out column 2. Reading columns as images of the axes is the key picture of this lesson.
- type: num
  q: How many scalar multiplications does the triple-loop product of two 100 × 100 matrices perform?
  answer: 1000000
  tol: 0.0001
  py: "100**3"
  explain: $n^2$ entries times $n$ multiplications each, $100^3 = 10^6$.
- type: mc
  q: If R rotates by 90° and S doubles the x axis, which product means "rotate first, then stretch"?
  options:
    - RS
    - SR
    - Both are the same
    - R + S
  answer: 1
  explain: The matrix nearest the vector acts first, so $SR\mathbf x$ rotates $\mathbf x$ and then stretches it.
:::end

:::verify
import numpy as np
R = np.array([[0,-1],[1,0]]); S = np.array([[2,0],[0,1]])
assert (S@R == [[0,-2],[1,0]]).all() and (R@S == [[0,-1],[2,0]]).all()
assert (S@R@[1,0] == [0,1]).all() and (R@S@[1,0] == [0,2]).all()
A = np.array([[1,2],[3,4]]); B = np.array([[0,1],[1,0]])
assert (A@B == [[2,1],[4,3]]).all() and (B@A == [[3,4],[1,2]]).all()
assert (np.array([[0,1],[1,0]])@[3,5] == [5,3]).all()
:::end
