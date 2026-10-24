---
id: p01-l05
minutes: 35
summary: Solving A x = b is the workhorse of engineering computation. You derive Gaussian elimination as a sequence of row operations, see a 2 × 2 system where skipping pivoting gives a completely wrong answer, and implement a solver with partial pivoting and back substitution.
---

## Elimination turns a system into a triangle

A linear system such as

$$\begin{aligned} 2x_1 + x_2 - x_3 &= 8 \\ -3x_1 - x_2 + 2x_3 &= -11 \\ -2x_1 + x_2 + 2x_3 &= -3 \end{aligned}$$

is written $A\mathbf x = \mathbf b$. Subtracting a multiple $\ell_{ik}$ of row $k$ from row $i$ doesn't change the solution, and choosing $\ell_{ik} = a_{ik}/a_{kk}$ creates a zero below the diagonal. Doing this column by column leaves an upper triangular system $U\mathbf x = \mathbf c$, which you solve from the bottom up:

$$x_n = \frac{c_n}{u_{nn}}, \qquad x_i = \frac{1}{u_{ii}}\Big(c_i - \sum_{j>i} u_{ij} x_j\Big).$$

Each row operation is a left multiplication by an elementary matrix that is the identity except for $-\ell_{ik}$ in position $(i,k)$. That observation leads directly to the LU decomposition of the next lesson.

The cost is about $\tfrac{2}{3}n^3$ floating point operations for the elimination and $n^2$ for back substitution. A 1000 × 1000 system takes about $6.7\times 10^{8}$ operations, well under a second on a laptop.

## Why you must pivot

The division by $a_{kk}$ is the weak point. Consider

$$\begin{pmatrix} 10^{-17} & 1 \\ 1 & 1 \end{pmatrix}\mathbf x = \begin{pmatrix} 1 \\ 2 \end{pmatrix}, \qquad \text{exact solution } \mathbf x \approx (1,\ 1).$$

Without pivoting, $\ell_{21} = 10^{17}$ and the second row becomes $(1 - 10^{17})x_2 = 2 - 10^{17}$. In float64 both sides round to $-10^{17}$, so $x_2 = 1$ and then $x_1 = (1 - x_2)/10^{-17} = 0$. The answer $x_1 = 0$ is completely wrong.

**Partial pivoting** fixes this: before eliminating column $k$, swap in the row with the largest $|a_{ik}|$. All multipliers then satisfy $|\ell_{ik}| \le 1$, so round-off errors can't be multiplied by huge factors. With the rows swapped, the same system gives $x_1 = x_2 = 1$ to full precision.

## Worked example: the 3 × 3 system above

1. Column 1: the largest entry is $|-3|$ in row 2, so swap rows 1 and 2. Multipliers: $\ell_{21} = 2/(-3) = -0.6667$, $\ell_{31} = -2/(-3) = 0.6667$. After elimination:
   $$\left(\begin{array}{ccc|c} -3 & -1 & 2 & -11 \\ 0 & 0.3333 & 0.3333 & 0.6667 \\ 0 & 1.6667 & 0.6667 & 4.3333 \end{array}\right)$$
2. Column 2: $|1.6667| > |0.3333|$, so swap rows 2 and 3. Multiplier $\ell_{32} = 0.3333/1.6667 = 0.2$. Row 3 becomes $(0,\ 0,\ 0.2 \mid -0.2)$.
3. Back substitution: $x_3 = -0.2/0.2 = -1$; $x_2 = (4.3333 - 0.6667\cdot(-1))/1.6667 = 3$; $x_1 = (-11 + 3 - 2\cdot(-1))/(-3) = 2$.

So $\mathbf x = (2, 3, -1)$. Substitute into the first equation: $4 + 3 + 1 = 8$. It checks.

## Code it from scratch

:::code file=gauss.py
```python
import numpy as np

def gauss_solve(A, b, tol=1e-12):
    A = np.array(A, dtype=float)
    b = np.array(b, dtype=float)
    n = len(b)
    scale = np.abs(A).max()
    for k in range(n - 1):
        p = k + np.argmax(np.abs(A[k:, k]))         # partial pivot
        if abs(A[p, k]) <= tol * scale:
            raise np.linalg.LinAlgError("matrix is singular to working precision")
        if p != k:
            A[[k, p]] = A[[p, k]]
            b[[k, p]] = b[[p, k]]
        for i in range(k + 1, n):
            l = A[i, k] / A[k, k]
            A[i, k:] -= l * A[k, k:]
            b[i] -= l * b[k]
    if abs(A[-1, -1]) <= tol * scale:
        raise np.linalg.LinAlgError("matrix is singular to working precision")
    x = np.zeros(n)
    for i in range(n - 1, -1, -1):
        x[i] = (b[i] - A[i, i + 1:] @ x[i + 1:]) / A[i, i]
    return x

if __name__ == "__main__":
    x = gauss_solve([[2, 1, -1], [-3, -1, 2], [-2, 1, 2]], [8, -11, -3])
    assert np.allclose(x, [2, 3, -1])
    assert np.allclose(gauss_solve([[1e-17, 1], [1, 1]], [1, 2]), [1, 1])
    rng = np.random.default_rng(1)
    for _ in range(200):
        n = rng.integers(2, 40)
        A = rng.standard_normal((n, n)) + n * np.eye(n)   # well conditioned
        b = rng.standard_normal(n)
        assert np.linalg.norm(A @ gauss_solve(A, b) - b) < 1e-10
    try:
        gauss_solve([[1, 2], [2, 4]], [1, 2])
    except np.linalg.LinAlgError:
        print("singular matrix detected")
    else:
        raise SystemExit("should have raised")
```
:::end

## Exercises

:::exercise
Solve $\begin{pmatrix} 1 & 2 \\ 3 & 4\end{pmatrix}\mathbf x = \begin{pmatrix} 5 \\ 6 \end{pmatrix}$ by elimination with partial pivoting.
:::solution
1. Pivot: $|3| > |1|$, so swap the rows: $(3, 4 \mid 6)$ and $(1, 2 \mid 5)$.
2. $\ell_{21} = 1/3$. Row 2 becomes $(0,\ 2 - 4/3 \mid 5 - 2) = (0,\ 0.6667 \mid 3)$.
3. $x_2 = 3/0.6667 = 4.5$, $x_1 = (6 - 4\cdot 4.5)/3 = -4$.
4. Check: $-4 + 2\cdot 4.5 = 5$ and $-12 + 18 = 6$.
:::end

:::exercise
Why does elimination fail on $\begin{pmatrix} 1 & 2 \\ 2 & 4 \end{pmatrix}$, and what does that say about the system?
:::solution
1. $\ell_{21} = 2$ turns row 2 into $(0,\ 0)$, so the pivot $u_{22}$ is zero.
2. The second row was twice the first: the two equations describe the same line, so there are either no solutions or infinitely many. The matrix is singular and the solver must raise instead of dividing by zero.
:::end

## Quiz

:::quiz
- type: num
  q: Roughly how many floating point operations does Gaussian elimination take for n = 1000 (use 2n³/3)?
  answer: 6.6667e8
  tol: 0.001
  py: "2*1000**3/3"
  explain: $\tfrac{2}{3}\times 10^9 \approx 6.7\times 10^8$.
- type: mc
  q: What does partial pivoting guarantee?
  options:
    - The matrix becomes symmetric
    - Every multiplier has magnitude at most 1, which limits round-off growth
    - The answer is exact
    - Elimination needs fewer operations
  answer: 1
  explain: Choosing the largest pivot in the column makes $|\ell_{ik}| \le 1$.
- type: num
  q: In the worked example, after swapping rows, what multiplier $\ell_{21}$ eliminates the entry 2 under the pivot −3? Give the value to 4 decimal places.
  answer: -0.6667
  tol: 0.001
  py: "2/(-3)"
  explain: $\ell_{21} = a_{21}/a_{11} = 2/(-3) = -0.6667$.
- type: num
  q: Solve $\begin{pmatrix}1&2\\3&4\end{pmatrix}\mathbf x = (5, 6)$. What is $x_2$?
  answer: 4.5
  tol: 0.0001
  py: "np.linalg.solve([[1,2],[3,4]],[5,6])[1]"
  explain: Elimination gives $0.6667\,x_2 = 3$, so $x_2 = 4.5$ and $x_1 = -4$.
- type: mc
  q: Without pivoting, what does float64 return for $x_1$ in the system with $a_{11} = 10^{-17}$?
  options:
    - 1
    - 0
    - 10¹⁷
    - NaN
  answer: 1
  explain: The huge multiplier swamps the second row, $x_2$ rounds to exactly 1 and then $x_1 = (1 - 1)/10^{-17} = 0$.
:::end

:::verify
import numpy as np
A = np.array([[1e-17,1],[1,1.]]); b = np.array([1,2.])
l = A[1,0]/A[0,0]; u22 = A[1,1]-l*A[0,1]; c2 = b[1]-l*b[0]; x2 = c2/u22; x1 = (b[0]-x2)/A[0,0]
assert x2 == 1.0 and x1 == 0.0
M = np.array([[-3,-1,2,-11],[2,1,-1,8],[-2,1,2,-3.]])
M[1] -= (2/-3)*M[0]; M[2] -= (-2/-3)*M[0]
assert np.allclose(M[1],[0,1/3,1/3,2/3]) and np.allclose(M[2],[0,5/3,2/3,13/3])
M[[1,2]] = M[[2,1]]; l = M[2,1]/M[1,1]; assert abs(l-0.2)<1e-12; M[2] -= l*M[1]
assert np.allclose(M[2],[0,0,0.2,-0.2])
assert np.allclose(np.linalg.solve([[2,1,-1],[-3,-1,2],[-2,1,2]],[8,-11,-3]),[2,3,-1])
assert np.allclose(np.linalg.solve([[1,2],[3,4]],[5,6]),[-4,4.5])
:::end
