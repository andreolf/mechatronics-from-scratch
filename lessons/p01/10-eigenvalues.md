---
id: p01-l10
minutes: 35
summary: Eigenvectors are the directions a matrix only stretches. You find them for 2 × 2 matrices from the characteristic polynomial, then implement power iteration and shifted inverse iteration and measure that power iteration converges at the rate |λ₂/λ₁|.
---

## Directions that don't turn

Most vectors change direction when a matrix acts on them. An **eigenvector** $\mathbf v \ne 0$ only gets scaled:

$$A\mathbf v = \lambda\mathbf v .$$

The scale factor $\lambda$ is the eigenvalue. Rewrite this as $(A - \lambda I)\mathbf v = 0$. A nonzero solution exists only if $A - \lambda I$ is singular, so

$$\det(A - \lambda I) = 0 .$$

For a 2 × 2 matrix this characteristic polynomial is $\lambda^2 - (\operatorname{tr}A)\lambda + \det A = 0$, giving

$$\lambda_{1,2} = \frac{\operatorname{tr}A}{2} \pm \sqrt{\frac{(\operatorname{tr}A)^2}{4} - \det A}.$$

When the square root is imaginary, the eigenvalues are a complex pair and the map rotates every direction. In dynamics, eigenvalues of the system matrix decide stability (Phase 02 lesson 14 and Phase 03), and eigenvectors are the shapes a structure vibrates in (next lesson).

:::figure widget=matrix2d caption="Amber lines are the real eigen-directions; along them A only stretches by λ. Make a₁₂ and a₂₁ opposite in sign to get a rotation with complex eigenvalues." args={"mode":"eigen","m":{"a":2,"b":1,"c":1,"d":2}}
:::end

## Power iteration

Write a starting vector in the eigenvector basis, $\mathbf x_0 = c_1\mathbf v_1 + c_2\mathbf v_2 + \dots$ with $|\lambda_1| > |\lambda_2| \ge \dots$. Multiplying by $A$ $k$ times gives

$$A^k\mathbf x_0 = \lambda_1^k\Big(c_1\mathbf v_1 + c_2\big(\tfrac{\lambda_2}{\lambda_1}\big)^k\mathbf v_2 + \dots\Big).$$

Every other component shrinks by at least $|\lambda_2/\lambda_1|$ per step, so repeatedly multiplying and normalising converges to $\mathbf v_1$. The eigenvalue estimate is the Rayleigh quotient $\lambda \approx \mathbf x^\top A\mathbf x / \mathbf x^\top\mathbf x$.

**Inverse iteration with a shift** $\sigma$ runs power iteration on $(A - \sigma I)^{-1}$, whose largest eigenvalue is $1/(\lambda_i - \sigma)$ for the $\lambda_i$ closest to $\sigma$. With a good shift it converges in a handful of steps to any eigenvalue you choose.

## Worked example: a symmetric 2 × 2

$A = \begin{pmatrix} 2 & 1 \\ 1 & 2\end{pmatrix}$ has $\operatorname{tr}A = 4$ and $\det A = 3$, so $\lambda = 2 \pm 1$: $\lambda_1 = 3$, $\lambda_2 = 1$.

For $\lambda_1 = 3$: $(A - 3I)\mathbf v = \begin{pmatrix} -1 & 1\\1 & -1\end{pmatrix}\mathbf v = 0$ gives $\mathbf v_1 = (1, 1)/\sqrt2$. For $\lambda_2 = 1$: $\mathbf v_2 = (1, -1)/\sqrt2$. They are perpendicular, as eigenvectors of a symmetric matrix always are.

Power iteration's error shrinks by $|\lambda_2/\lambda_1| = 1/3$ per step. To reach $10^{-10}$ from an error of 1 takes $\ln 10^{-10}/\ln(1/3) = 20.96$, so 21 iterations.

## Code it from scratch

:::code file=eig.py
```python
import numpy as np

def power_iteration(A, iters=500, tol=1e-13, x0=None):
    A = np.asarray(A, float)
    x = np.ones(len(A)) if x0 is None else np.asarray(x0, float)
    x /= np.linalg.norm(x)
    lam, errs = 0.0, []
    for _ in range(iters):
        y = A @ x
        lam_new = x @ y
        x_new = y / np.linalg.norm(y)
        if x_new @ x < 0: x_new = -x_new       # fix the sign for comparison
        errs.append(np.linalg.norm(x_new - x))
        x, lam = x_new, lam_new
        if errs[-1] < tol: break
    return lam, x, errs

def inverse_iteration(A, shift, iters=50):
    A = np.asarray(A, float); n = len(A)
    M = A - shift * np.eye(n)
    x = np.ones(n) / np.sqrt(n)
    for _ in range(iters):
        y = np.linalg.solve(M, x)              # a real code would factor M once (lesson 6)
        x = y / np.linalg.norm(y)
    return x @ A @ x, x

if __name__ == "__main__":
    lam, v, errs = power_iteration([[2, 1], [1, 2]], x0=[1, 0])
    assert abs(lam - 3) < 1e-12 and np.allclose(abs(v), [2 ** -.5] * 2)
    ratios = [errs[k + 1] / errs[k] for k in range(3, 12)]
    assert all(abs(r - 1 / 3) < 0.02 for r in ratios), ratios
    rng = np.random.default_rng(6)
    B = rng.standard_normal((6, 6)); S = B + B.T
    for true in np.linalg.eigvalsh(S):
        lam, v = inverse_iteration(S, true + 0.05)
        assert abs(lam - true) < 1e-9 and np.linalg.norm(S @ v - lam * v) < 1e-9
    print("power iteration ratio ≈", np.mean(ratios).round(4), "; all eigenpairs found by inverse iteration")
```
:::end

## Exercises

:::exercise
Find the eigenvalues of $\begin{pmatrix} 4 & 1 \\ 2 & 3\end{pmatrix}$ and an eigenvector for the larger one.
:::solution
1. $\operatorname{tr} = 7$, $\det = 10$: $\lambda^2 - 7\lambda + 10 = 0$, so $\lambda = 5$ or $2$.
2. For $\lambda = 5$: $(A - 5I) = \begin{pmatrix} -1 & 1 \\ 2 & -2\end{pmatrix}$, so $\mathbf v = (1, 1)$.
3. Check: $A(1,1) = (5, 5)$.
:::end

:::exercise
Power iteration on a matrix with $\lambda_1 = 10$ and $\lambda_2 = 9$ is slow. How many steps reduce the error by $10^{6}$, and how would you speed it up?
:::solution
1. Rate $0.9$: $k = \ln 10^{-6}/\ln 0.9 = 131.1$, so about 132 steps.
2. Use inverse iteration with a shift near 10: the rate becomes $|10 - \sigma|/|9 - \sigma|$, for example $0.1/0.9 = 0.11$ with $\sigma = 9.9$.
:::end

## Quiz

:::quiz
- type: num
  q: What is the larger eigenvalue of $\begin{pmatrix}4&1\\2&3\end{pmatrix}$?
  answer: 5
  tol: 0.0001
  py: "max(np.linalg.eigvals([[4,1],[2,3]]).real)"
  explain: $\lambda^2 - 7\lambda + 10 = (\lambda-5)(\lambda-2)$.
- type: num
  q: Power iteration has $|\lambda_2/\lambda_1| = 0.9$. How many iterations reduce the error by a factor of $10^6$? Give the real number $\ln 10^{-6}/\ln 0.9$.
  answer: 131.13
  tol: 0.002
  py: "math.log(1e-6)/math.log(0.9)"
  explain: $-13.82/-0.1054 = 131.1$.
- type: mc
  q: What does inverse iteration with shift σ converge to?
  options:
    - The largest eigenvalue
    - The eigenvalue closest to σ
    - The smallest eigenvalue in magnitude, always
    - σ itself
  answer: 1
  explain: $(A - \sigma I)^{-1}$ has eigenvalues $1/(\lambda_i - \sigma)$, largest for the $\lambda_i$ nearest $\sigma$.
- type: mc
  q: The matrix $\begin{pmatrix}0&-1\\1&0\end{pmatrix}$ has eigenvalues…
  options:
    - 1 and −1
    - ±i, because it rotates every vector by 90°
    - 0 and 0
    - 1 and 1
  answer: 1
  explain: $\operatorname{tr} = 0$, $\det = 1$, so $\lambda^2 + 1 = 0$. No real direction survives a 90° rotation.
- type: num
  q: For $A = \begin{pmatrix}2&1\\1&2\end{pmatrix}$, what is $\det A$, which equals the product of the eigenvalues?
  answer: 3
  tol: 0.0001
  py: "np.prod(np.linalg.eigvalsh([[2,1],[1,2]]))"
  explain: $\lambda_1\lambda_2 = 3 \times 1 = 3 = \det A$.
:::end

:::verify
import numpy as np, math
assert np.allclose(sorted(np.linalg.eigvalsh([[2,1],[1,2]])),[1,3])
assert abs(math.log(1e-10)/math.log(1/3) - 20.96) < 0.005
assert np.allclose(np.array([[4,1],[2,3]])@[1,1],[5,5])
assert abs(abs(10-9.9)/abs(9-9.9) - 0.111) < 0.001
:::end
