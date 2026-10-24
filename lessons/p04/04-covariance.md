---
id: p04-l04
minutes: 35
summary: Errors on different axes are often correlated, and a covariance matrix captures that in one object. You define covariance and correlation, derive the covariance ellipse from eigenvectors, compute how much probability sits inside 1σ and 2σ in 2D, and estimate a covariance from samples.
---

## Covariance and correlation

For two variables, the **covariance** measures whether they move together:

$$\operatorname{Cov}(X, Y) = \mathbb E[(X - \mu_X)(Y - \mu_Y)], \qquad \rho = \frac{\operatorname{Cov}(X, Y)}{\sigma_X\sigma_Y} \in [-1, 1].$$

Stack $n$ variables in a vector $\mathbf x$ and collect all pairs in the **covariance matrix**

$$\Sigma = \mathbb E[(\mathbf x - \boldsymbol\mu)(\mathbf x - \boldsymbol\mu)^T] = \begin{bmatrix}\sigma_x^2 & \rho\sigma_x\sigma_y\\ \rho\sigma_x\sigma_y & \sigma_y^2\end{bmatrix}.$$

It's symmetric and positive semi-definite: the variance of any projection $\mathbf a^T\mathbf x$ is $\mathbf a^T\Sigma\mathbf a \ge 0$. Zero correlation doesn't imply independence in general, but for jointly Gaussian variables it does.

## The covariance ellipse

The multivariate Gaussian density is constant on curves of fixed **Mahalanobis distance**

$$d^2 = (\mathbf x - \boldsymbol\mu)^T\Sigma^{-1}(\mathbf x - \boldsymbol\mu).$$

Diagonalise $\Sigma = V\Lambda V^T$ (Phase 01 lesson 10). In the eigenvector coordinates $\mathbf u = V^T(\mathbf x - \boldsymbol\mu)$, $d^2 = u_1^2/\lambda_1 + u_2^2/\lambda_2$, an axis-aligned ellipse. So the $k\sigma$ ellipse has semi-axes $k\sqrt{\lambda_i}$ along the eigenvectors.

How much probability is inside? In 2D, $d^2$ follows a chi-square distribution with 2 degrees of freedom, which is an exponential with mean 2:

$$P(d \le k) = 1 - e^{-k^2/2}.$$

That's 39.3 % inside 1σ, 86.5 % inside 2σ and 98.9 % inside 3σ. The 1D rule "68 % within 1σ" doesn't carry over: a 2D 1σ ellipse holds well under half the points. For a 95 % ellipse use $k = 2.448$.

:::figure widget=covariance caption="600 correlated samples with their 1σ (lime) and 2σ (amber) ellipses. Raise the correlation and the ellipse tilts and thins; the share inside 2σ stays near 86.5 %."
:::end

## Worked example

A tilt sensor's x and y errors have $\sigma_x = 1.5$, $\sigma_y = 0.8$ (arbitrary units) and $\rho = 0.6$.

1. $\Sigma = \begin{bmatrix}2.25 & 0.72\\ 0.72 & 0.64\end{bmatrix}$.
2. Eigenvalues: $\lambda = 2.525$ and $0.365$, so the 1σ semi-axes are 1.589 and 0.604.
3. The major axis points along the eigenvector for 2.525, at $\frac12\arctan\frac{2\times0.72}{2.25 - 0.64} = 20.9°$ above the x axis.
4. The 2σ ellipse has semi-axes 3.178 and 1.208 and holds 86.5 % of readings.
5. The variance along the 45° direction is $\mathbf a^T\Sigma\mathbf a = \frac12(2.25 + 2\times0.72 + 0.64) = 2.165$.

## Code it from scratch

:::code file=covariance.py
```python
import math
import numpy as np

def sample_cov(X):
    """Unbiased covariance of rows-as-samples data."""
    Xc = X - X.mean(axis=0)
    return Xc.T @ Xc / (len(X) - 1)

def ellipse(Sigma, k=1.0):
    w, V = np.linalg.eigh(Sigma)
    i = np.argmax(w)
    angle = math.degrees(math.atan2(V[1, i], V[0, i])) % 180
    return k * np.sqrt(w[::-1]), angle            # (major, minor), degrees

def correlated(Sigma, n, rng):
    L = np.linalg.cholesky(Sigma)                 # Sigma = L L^T
    return rng.standard_normal((n, 2)) @ L.T

if __name__ == "__main__":
    Sigma = np.array([[2.25, 0.72], [0.72, 0.64]])
    axes, ang = ellipse(Sigma)
    print(f"1-sigma semi-axes {axes.round(3)}, major axis at {ang:.1f} deg")
    assert np.allclose(axes, [1.5890, 0.6041], atol=1e-4) and abs(ang - 20.90) < 0.01
    rng = np.random.default_rng(4)
    X = correlated(Sigma, 200_000, rng)
    S = sample_cov(X)
    assert np.max(np.abs(S - Sigma)) < 0.03
    assert np.allclose(S, np.cov(X.T))
    d2 = np.einsum("ij,jk,ik->i", X, np.linalg.inv(Sigma), X)
    for k in (1, 2, 3):
        assert abs(np.mean(d2 <= k * k) - (1 - math.exp(-k * k / 2))) < 0.004
    a = np.array([1, 1]) / math.sqrt(2)
    assert abs(a @ Sigma @ a - 2.165) < 1e-12
    # convergence: error of the estimate shrinks as samples grow
    errs = [np.max(np.abs(sample_cov(correlated(Sigma, n, rng)) - Sigma)) for n in (100, 10_000)]
    assert errs[1] < errs[0]
```
:::end

## Exercises

:::exercise
Two independent axes have $\sigma_x = 2$ and $\sigma_y = 1$. Describe the 2σ ellipse.
:::solution
$\Sigma = \operatorname{diag}(4, 1)$, eigenvectors along the axes, semi-axes $2\times2 = 4$ along x and $2\times1 = 2$ along y, no tilt. It contains 86.5 % of points.
:::end

:::exercise
Why must a covariance matrix have $|\rho| \le 1$?
:::solution
$\det\Sigma = \sigma_x^2\sigma_y^2(1 - \rho^2)$ must be non-negative because $\Sigma$ is positive semi-definite, so $\rho^2 \le 1$. At $|\rho| = 1$ the ellipse collapses to a line: one variable is an exact linear function of the other.
:::end

## Quiz

:::quiz
- type: num
  q: What fraction of 2D Gaussian samples lie inside the 2σ ellipse?
  answer: 0.86466
  tol: 0.001
  py: "1-math.exp(-2)"
  explain: $1 - e^{-k^2/2}$ with $k = 2$.
- type: num
  q: What fraction lies inside the 1σ ellipse in 2D?
  answer: 0.39347
  tol: 0.001
  py: "1-math.exp(-0.5)"
  explain: $1 - e^{-1/2}$.
- type: num
  q: What is the covariance $\Sigma_{12}$ for $\sigma_x = 1.5$, $\sigma_y = 0.8$ and $\rho = 0.6$?
  answer: 0.72
  tol: 0.001
  py: "0.6*1.5*0.8"
  explain: $\rho\sigma_x\sigma_y$.
- type: num
  q: What is the length of the 1σ major semi-axis for $\Sigma = [[2.25, 0.72], [0.72, 0.64]]$?
  answer: 1.589
  tol: 0.001
  py: "math.sqrt(max(np.linalg.eigvalsh([[2.25,0.72],[0.72,0.64]])))"
  explain: The square root of the largest eigenvalue.
- type: mc
  q: The axes of the covariance ellipse point along…
  options:
    - the x and y axes always
    - the eigenvectors of Σ
    - the rows of Σ
    - the mean vector
  answer: 1
  explain: Diagonalising Σ aligns the ellipse with its eigenvectors.
- type: num
  q: Which scale factor $k$ gives a 95 % ellipse in 2D?
  answer: 2.4477
  tol: 0.001
  py: "math.sqrt(-2*math.log(0.05))"
  explain: Solve $1 - e^{-k^2/2} = 0.95$.
:::end

:::verify
import numpy as np, math
w = np.linalg.eigvalsh([[2.25,0.72],[0.72,0.64]]); assert abs(w[1]-2.525)<5e-4 and abs(w[0]-0.365)<5e-4
assert abs(0.5*math.degrees(math.atan2(1.44,1.61))-20.9)<0.05 and abs(2*1.589-3.178)<1e-9 and abs(2*0.6041-1.208)<1e-3
assert abs((1-math.exp(-4.5))-0.989)<5e-4
:::end
