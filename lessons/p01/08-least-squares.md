---
id: p01-l08
minutes: 35
summary: Measurements are noisy and you usually have more of them than unknowns. You derive the normal equations by setting a gradient to zero, fit a motor's torque constant from bench data, and check the fit recovers the true value within 1 % at a 20 dB signal-to-noise ratio.
---

## More equations than unknowns

You want a motor's torque constant $k_t$ in $\tau = k_t i$. You measure torque at many currents. Each measurement gives one equation, and with noise no single $k_t$ satisfies them all. Stack them as $A\mathbf x \approx \mathbf b$ with more rows than columns and look for the $\mathbf x$ that makes the residual $\mathbf r = A\mathbf x - \mathbf b$ as small as possible in the squared sense:

$$\min_{\mathbf x}\ J(\mathbf x) = \lVert A\mathbf x - \mathbf b \rVert^2 = (A\mathbf x - \mathbf b)^\top (A\mathbf x - \mathbf b).$$

## The normal equations

Expand $J = \mathbf x^\top A^\top A\mathbf x - 2\mathbf b^\top A\mathbf x + \mathbf b^\top \mathbf b$. Its gradient is

$$\nabla J = 2A^\top A\mathbf x - 2A^\top \mathbf b .$$

Setting it to zero gives the **normal equations**

$$A^\top A\,\mathbf x = A^\top \mathbf b .$$

Geometrically, $A^\top(A\mathbf x - \mathbf b) = 0$ says the residual is perpendicular to every column of $A$: the best fit is the orthogonal projection of $\mathbf b$ onto the column space. The matrix $A^\top A$ is square, symmetric and invertible when the columns of $A$ are independent.

For a line through the origin, $A$ is the single column of currents and the formula reduces to

$$k_t = \frac{\sum_j i_j \tau_j}{\sum_j i_j^2}.$$

:::figure widget=lsq caption="Synthetic bench data with true k_t = 0.075 N·m/A and a 0.01 N·m friction offset. Red lines are residuals. Increase the noise or reduce the samples and watch the estimate wander."
:::end

## Worked example: four bench points

| Current $i$ [A] | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| Torque $\tau$ [N·m] | 0.08 | 0.15 | 0.23 | 0.30 |

**Through the origin.** $\sum i\tau = 0.08 + 0.30 + 0.69 + 1.20 = 2.27$ and $\sum i^2 = 30$, so $k_t = 2.27/30 = 0.07567$ N·m/A.

**With an offset** $\tau = k_t i + c$, the columns are $i$ and a column of ones:

$$A^\top A = \begin{pmatrix} 30 & 10 \\ 10 & 4\end{pmatrix}, \quad A^\top\mathbf b = \begin{pmatrix} 2.27 \\ 0.76\end{pmatrix} \;\Rightarrow\; k_t = 0.0740,\ c = 0.005 .$$

The small positive offset is friction torque the motor must overcome before the output moves. Ignoring it biases $k_t$ upward by about 2 %.

## Code it from scratch

This fits $k_t$ and $c$ by forming the normal equations and solving them with your own elimination code, then checks the 1 % target at 20 dB SNR using 5000 samples, a five-second log at 1 kHz. With only 200 samples the standard error of $k_t$ is about 1.5 %, so the target would fail about half the time.

:::code file=fit_kt.py
```python
import numpy as np

def solve(M, v):                       # small Gaussian elimination with pivoting
    M = np.array(M, float); v = np.array(v, float); n = len(v)
    for k in range(n):
        p = k + np.argmax(abs(M[k:, k])); M[[k, p]] = M[[p, k]]; v[[k, p]] = v[[p, k]]
        for i in range(k + 1, n):
            l = M[i, k] / M[k, k]; M[i] -= l * M[k]; v[i] -= l * v[k]
    x = np.zeros(n)
    for i in reversed(range(n)):
        x[i] = (v[i] - M[i, i + 1:] @ x[i + 1:]) / M[i, i]
    return x

def lstsq_normal(A, b):
    A = np.asarray(A, float)
    return solve(A.T @ A, A.T @ b)

if __name__ == "__main__":
    i = np.array([1, 2, 3, 4.]); tau = np.array([0.08, 0.15, 0.23, 0.30])
    k0 = lstsq_normal(i[:, None], tau)[0]
    k1, c1 = lstsq_normal(np.column_stack([i, np.ones(4)]), tau)
    assert abs(k0 - 0.075667) < 1e-6 and abs(k1 - 0.074) < 1e-9 and abs(c1 - 0.005) < 1e-9

    rng = np.random.default_rng(4)
    kt, c = 0.075, 0.01
    cur = rng.uniform(0.5, 10, 5000)          # a 5 s log at 1 kHz
    clean = kt * cur + c
    sigma = np.sqrt(np.mean(clean ** 2)) / 10      # 20 dB: noise rms is a tenth of signal rms
    meas = clean + rng.normal(0, sigma, cur.size)
    k_hat, c_hat = lstsq_normal(np.column_stack([cur, np.ones_like(cur)]), meas)
    err = abs(k_hat - kt) / kt
    print(f"k_t = {k_hat:.5f} N·m/A (error {100*err:.2f} %), offset {c_hat:.4f} N·m")
    assert err < 0.01
```
:::end

Forming $A^\top A$ squares the condition number of the problem (lesson 13). For a two-parameter motor fit that is harmless; for high-order polynomial fits it loses accuracy, and the QR method of the next lesson avoids it.

## Exercises

:::exercise
Fit $y = mx$ to the points $(1, 2.1)$, $(2, 3.9)$, $(3, 6.2)$.
:::solution
1. $\sum xy = 2.1 + 7.8 + 18.6 = 28.5$, $\sum x^2 = 14$.
2. $m = 28.5/14 = 2.0357$.
:::end

:::exercise
Show that the least-squares residual of a fit with an offset column sums to zero.
:::solution
1. The normal equations say $A^\top\mathbf r = 0$, so $\mathbf r$ is perpendicular to every column.
2. One column is all ones, so $\mathbf 1^\top \mathbf r = \sum_j r_j = 0$. A fitted line with an intercept always passes through the mean of the data.
:::end

## Quiz

:::quiz
- type: num
  q: Fit $\tau = k_t i$ (no offset) to the four bench points. What is $k_t$ in N·m/A?
  answer: 0.075667
  tol: 0.001
  py: "np.dot([1,2,3,4],[0.08,0.15,0.23,0.30])/30"
  explain: $2.27/30 = 0.07567$.
- type: num
  q: Fit $y = mx$ to $(1, 2.1)$, $(2, 3.9)$, $(3, 6.2)$. What is $m$?
  answer: 2.0357
  tol: 0.001
  py: "np.dot([1,2,3],[2.1,3.9,6.2])/14"
  explain: $28.5/14 = 2.0357$.
- type: mc
  q: What does the equation $A^\top(A\mathbf x - \mathbf b) = 0$ say geometrically?
  options:
    - The residual is zero
    - The residual is perpendicular to every column of A
    - A is square
    - x is a unit vector
  answer: 1
  explain: Each row of $A^\top$ is a column of $A$, and its dot product with the residual is zero.
- type: num
  q: A 20 dB signal-to-noise ratio means the signal power is how many times the noise power?
  answer: 100
  tol: 0.0001
  py: "10**(20/10)"
  explain: $10^{20/10} = 100$, so the noise rms is a tenth of the signal rms.
- type: mc
  q: Why can forming $A^\top A$ be a bad idea for ill-conditioned problems?
  options:
    - It is not symmetric
    - It squares the condition number, amplifying round-off
    - It needs more memory than A
    - It removes the offset
  answer: 1
  explain: $\kappa(A^\top A) = \kappa(A)^2$, so a problem with $\kappa = 10^7$ becomes one with $10^{14}$.
:::end

:::verify
import numpy as np
i = np.array([1,2,3,4.]); t = np.array([.08,.15,.23,.30])
assert abs(i@t - 2.27) < 1e-12 and abs(i@i - 30) < 1e-12
A = np.column_stack([i, np.ones(4)])
assert np.allclose(A.T@A, [[30,10],[10,4]]) and np.allclose(A.T@t, [2.27, .76])
k, c = np.linalg.lstsq(A, t, rcond=None)[0]; assert abs(k-.074)<1e-12 and abs(c-.005)<1e-12
assert 0.015 < (2.27/30)/0.074 - 1 < 0.025
assert abs(28.5/14 - 2.0357) < 5e-5
:::end
