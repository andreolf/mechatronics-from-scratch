---
id: p01-l13
minutes: 30
summary: Some problems amplify tiny input errors into huge output errors, whatever algorithm you use. You derive the condition number as the worst-case amplification factor, watch a 0.005 % change in a measurement flip a solution, and confirm the error bound on Hilbert matrices.
---

## Sensitivity is a property of the problem

Solve $A\mathbf x = \mathbf b$, then perturb the data: $A(\mathbf x + \delta\mathbf x) = \mathbf b + \delta\mathbf b$. Subtracting gives $\delta\mathbf x = A^{-1}\delta\mathbf b$, so $\lVert\delta\mathbf x\rVert \le \lVert A^{-1}\rVert\lVert\delta\mathbf b\rVert$. Also $\lVert\mathbf b\rVert \le \lVert A\rVert\lVert\mathbf x\rVert$. Divide one by the other:

$$\frac{\lVert\delta\mathbf x\rVert}{\lVert\mathbf x\rVert} \;\le\; \underbrace{\lVert A\rVert\,\lVert A^{-1}\rVert}_{\kappa(A)}\;\frac{\lVert\delta\mathbf b\rVert}{\lVert\mathbf b\rVert}.$$

In the 2-norm, $\lVert A\rVert = \sigma_{\max}$ and $\lVert A^{-1}\rVert = 1/\sigma_{\min}$, so

$$\kappa(A) = \frac{\sigma_{\max}}{\sigma_{\min}} \ge 1 .$$

The bound is tight: some $\delta\mathbf b$ achieves it. No algorithm can beat it, because the data itself is uncertain.

### Machine epsilon sets the floor

Storing $\mathbf b$ in float64 already perturbs it by a relative $\varepsilon \approx 2.2\times10^{-16}$. So even a perfect solver has a relative error of up to about $\kappa\,\varepsilon$. A rule of thumb: you lose about $\log_{10}\kappa$ of your 16 significant digits. With $\kappa = 10^{12}$, four digits remain.

## Worked example: two nearly parallel lines

$$\begin{pmatrix} 1 & 1 \\ 1 & 1.0001\end{pmatrix}\mathbf x = \begin{pmatrix} 2 \\ 2.0001\end{pmatrix} \;\Rightarrow\; \mathbf x = (1, 1).$$

Change the second measurement to 2.0002, a relative change in $\mathbf b$ of $3.5\times 10^{-5}$. The new solution is $\mathbf x = (0, 2)$: a relative change of 100 %. The condition number is $\kappa = 4.0\times10^{4}$, and indeed $4.0\times10^4 \times 3.5\times10^{-5} = 1.4 \ge 1.0$.

This is the situation of a sensor pair whose lines of sight are nearly parallel, or two least-squares regressors that are almost collinear. The fix is in the experiment design, not in the solver.

The Hilbert matrix $H_{ij} = 1/(i + j - 1)$ is the classic ill-conditioned example. Its condition number grows exponentially: $\kappa(H_5) = 4.8\times 10^5$, $\kappa(H_{10}) = 1.6\times 10^{13}$, and $H_{13}$ is singular to working precision.

## Code it from scratch

:::code file=conditioning.py
```python
import numpy as np

def cond2(A):
    s = np.linalg.svd(A, compute_uv=False)
    return s[0] / s[-1]

def hilbert(n):
    i = np.arange(1, n + 1)
    return 1.0 / (i[:, None] + i[None, :] - 1)

if __name__ == "__main__":
    A = np.array([[1, 1], [1, 1.0001]])
    x1 = np.linalg.solve(A, [2, 2.0001]); x2 = np.linalg.solve(A, [2, 2.0002])
    assert np.allclose(x1, [1, 1], atol=1e-8) and np.allclose(x2, [0, 2], atol=1e-8)
    rng = np.random.default_rng(8)
    eps = np.finfo(float).eps
    print(" n   cond(H)    rel. perturbation   measured error   bound")
    for n in (3, 5, 7, 9, 11):
        H = hilbert(n); k = cond2(H)
        x = rng.standard_normal(n); b = H @ x
        db = rng.standard_normal(n); db *= 1e-10 * np.linalg.norm(b) / np.linalg.norm(db)
        x_hat = np.linalg.solve(H, b + db)
        err = np.linalg.norm(x_hat - x) / np.linalg.norm(x)
        bound = k * (1e-10 + 10 * n * eps)        # data error plus solver round-off
        print(f"{n:2d} {k:10.2e} {1e-10:16.0e} {err:16.2e} {bound:10.2e}")
        assert err <= bound
```
:::end

Typical random perturbations land well below the bound, because the worst case needs $\delta\mathbf b$ aligned with the smallest singular direction. The bound is what you design to.

## Exercises

:::exercise
A matrix has singular values 50, 2 and 0.01. What is its condition number, and how many significant digits can you trust in a float64 solve?
:::solution
1. $\kappa = 50/0.01 = 5000$.
2. $\log_{10} 5000 \approx 3.7$, so of 16 digits you keep about 12.
:::end

:::exercise
Your sensor data has a relative error of $10^{-3}$ and the system matrix has $\kappa = 200$. Bound the relative error of the solution.
:::solution
$\lVert\delta\mathbf x\rVert/\lVert\mathbf x\rVert \le 200 \times 10^{-3} = 0.2$, so up to 20 %. Measurement noise, not round-off, dominates here.
:::end

## Quiz

:::quiz
- type: num
  q: What is the 2-norm condition number of $\begin{pmatrix}1&1\\1&1.0001\end{pmatrix}$? (Scientific notation is fine.)
  answer: 40002
  tol: 0.001
  py: "np.linalg.cond([[1,1],[1,1.0001]])"
  explain: $\sigma_{\max} \approx 2.00005$ and $\sigma_{\min} \approx 5.0\times10^{-5}$, so $\kappa \approx 4.0\times10^4$.
- type: num
  q: Singular values 50, 2 and 0.01. What is κ?
  answer: 5000
  tol: 0.0001
  py: "50/0.01"
  explain: $\sigma_{\max}/\sigma_{\min} = 5000$.
- type: mc
  q: Which statement about the condition number is true?
  options:
    - A better algorithm can always remove ill-conditioning
    - It bounds how much relative input error can be amplified in the output, for any algorithm
    - It equals the determinant
    - It is always less than 1
  answer: 1
  explain: Conditioning belongs to the problem. Stable algorithms achieve the bound; none can beat it.
- type: mc
  q: In float64, roughly how many significant digits survive a solve with κ = 10¹⁰?
  options:
    - "16"
    - "10"
    - "6"
    - "0"
  answer: 2
  explain: You lose about $\log_{10}\kappa = 10$ of the 16 digits.
- type: num
  q: Data relative error $10^{-3}$, κ = 200. What is the bound on the relative solution error?
  answer: 0.2
  tol: 0.001
  py: "200*1e-3"
  explain: $\kappa \times 10^{-3} = 0.2$.
:::end

:::verify
import numpy as np
A = np.array([[1,1],[1,1.0001]]); k = np.linalg.cond(A); assert 3.99e4 < k < 4.01e4
rel = np.linalg.norm([0,0.0001])/np.linalg.norm([2,2.0001]); assert abs(rel-3.5e-5) < 1e-6
assert abs(np.linalg.norm(np.array([0,2])-[1,1])/np.linalg.norm([1,1]) - 1) < 1e-12
assert 1.39 < k*rel < 1.42
i = np.arange(1,6); H5 = 1/(i[:,None]+i-1); assert 4.7e5 < np.linalg.cond(H5) < 4.8e5
i = np.arange(1,11); H10 = 1/(i[:,None]+i-1); assert 1.5e13 < np.linalg.cond(H10) < 1.7e13
assert abs(np.log10(5000)-3.7) < 0.01
:::end
