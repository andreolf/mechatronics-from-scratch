---
id: p04-l07
minutes: 35
summary: Maximum likelihood turns "which parameters best explain the data" into an optimisation. You show that Gaussian noise makes MLE equal to least squares, that unequal noise makes it weighted least squares, and fuse two sensors and calibrate a load cell with honest error bars.
---

## Likelihood

Given data $z_1 \dots z_N$ and a model with parameters $\theta$, the **likelihood** $L(\theta) = p(z_1 \dots z_N \mid \theta)$ is the probability density of what you observed, viewed as a function of $\theta$. The maximum-likelihood estimate (MLE) is the $\theta$ that makes the data least surprising.

With independent Gaussian errors, $z_i = h_i(\theta) + v_i$ with $v_i \sim \mathcal N(0, \sigma_i^2)$:

$$-\ln L(\theta) = \frac12\sum_i\left(\frac{z_i - h_i(\theta)}{\sigma_i}\right)^2 + \text{const}.$$

So **maximising likelihood = minimising the weighted sum of squared residuals.** If every $\sigma_i$ is the same, that's ordinary least squares (Phase 01 lesson 15). If not, each residual is scaled by its own σ: precise points pull harder.

## Weighted least squares

For a linear model $\mathbf z = A\theta + \mathbf v$ with $W = \operatorname{diag}(1/\sigma_i^2)$, setting the gradient to zero gives

$$\hat\theta = (A^TWA)^{-1}A^TW\mathbf z, \qquad \operatorname{Cov}(\hat\theta) = (A^TWA)^{-1}.$$

The covariance formula comes from the propagation law of lesson 5, with $\Sigma_z = W^{-1}$. It's the error bar you should report next to every fitted parameter.

**Simplest case: fusing two sensors.** Measuring one value twice ($A = [1, 1]^T$) gives the inverse-variance weighted mean

$$\hat x = \frac{z_1/\sigma_1^2 + z_2/\sigma_2^2}{1/\sigma_1^2 + 1/\sigma_2^2}, \qquad \frac{1}{\sigma^2} = \frac{1}{\sigma_1^2} + \frac{1}{\sigma_2^2}.$$

The fused estimate is always more precise than the better sensor. That's the Kalman filter's update step in one dimension.

:::figure widget=lsq caption="Least squares in action. Drag points away from the line and watch the fit respond. Weighting would make noisier points pull less."
:::end

## Worked example

**Fusion.** A lidar reads 10.0 m (σ = 0.5 m) and an ultrasonic sensor reads 10.6 m (σ = 1.0 m).

1. The weights are $1/0.25 = 4$ and $1/1 = 1$.
2. $\hat x = (4\times10.0 + 1\times10.6)/5 = 10.12$ m.
3. $\sigma = 1/\sqrt5 = 0.447$ m, better than the lidar's 0.5 m alone.

**Load-cell calibration.** Known loads of 0 to 10 kg in 1 kg steps; the reading noise grows with load, $\sigma_i = 0.1 + 0.2x_i$ (in mV). Fit $z = kx + b$.

1. Ordinary least squares ignores the σs. Its true standard errors (from the propagation law with the real noise) are 0.132 for $k$ and 0.428 for $b$.
2. Weighted least squares gives 0.075 for $k$ and 0.096 for $b$: the offset is over four times more precise, because WLS trusts the quiet low-load points that pin down the intercept.

## Code it from scratch

:::code file=wls.py
```python
import numpy as np

def wls(A, z, sigma):
    W = np.diag(1 / np.asarray(sigma) ** 2)
    cov = np.linalg.inv(A.T @ W @ A)
    return cov @ A.T @ W @ z, cov

if __name__ == "__main__":
    est, cov = wls(np.array([[1.0], [1.0]]), np.array([10.0, 10.6]), [0.5, 1.0])
    assert abs(est[0] - 10.12) < 1e-12 and abs(np.sqrt(cov[0, 0]) - 1 / np.sqrt(5)) < 1e-12

    x = np.arange(0, 11.0)
    sig = 0.1 + 0.2 * x
    A = np.c_[x, np.ones_like(x)]
    _, cw = wls(A, np.zeros_like(x), sig)
    P = np.linalg.pinv(A)                                  # OLS estimator matrix
    co = P @ np.diag(sig**2) @ P.T
    print("WLS std errors", np.sqrt(np.diag(cw)).round(3), "OLS", np.sqrt(np.diag(co)).round(3))
    assert np.allclose(np.sqrt(np.diag(cw)), [0.0752, 0.0957], atol=1e-4)
    assert np.allclose(np.sqrt(np.diag(co)), [0.1322, 0.4280], atol=1e-4)

    # Monte Carlo: WLS estimates really scatter as (A^T W A)^-1 predicts
    rng = np.random.default_rng(2)
    k, b = 2.0, 0.5
    fits = np.array([wls(A, k * x + b + rng.standard_normal(x.size) * sig, sig)[0] for _ in range(20_000)])
    assert np.allclose(fits.mean(axis=0), [k, b], atol=0.005)
    assert np.allclose(fits.std(axis=0), np.sqrt(np.diag(cw)), rtol=0.03)
```
:::end

## Exercises

:::exercise
Show that the MLE of the mean of $N$ equal-σ Gaussian samples is the sample mean.
:::solution
$-\ln L = \frac{1}{2\sigma^2}\sum(z_i - \mu)^2 + c$. Differentiate with respect to μ: $-\frac{1}{\sigma^2}\sum(z_i - \mu) = 0$, so $\mu = \frac1N\sum z_i$.
:::end

:::exercise
Three thermometers read 20.2 °C (σ 0.1), 20.6 °C (σ 0.3) and 19.0 °C (σ 2.0). Find the fused value and its σ.
:::solution
Weights 100, 11.11, 0.25 (sum 111.36). $\hat x = (2020 + 228.9 + 4.75)/111.36 = 20.24$ °C, $\sigma = 1/\sqrt{111.36} = 0.095$ °C. The poor thermometer barely matters.
:::end

## Quiz

:::quiz
- type: num
  q: Fuse 10.0 m (σ 0.5) with 10.6 m (σ 1.0). What is the estimate in metres?
  answer: 10.12
  tol: 0.0005
  unit: m
  py: "(10/0.25+10.6/1)/(1/0.25+1)"
  explain: The inverse-variance weighted mean.
- type: num
  q: What is the σ of that fused estimate in metres?
  answer: 0.44721
  tol: 0.002
  unit: m
  py: "1/math.sqrt(1/0.25+1)"
  explain: Information (1/σ²) adds.
- type: mc
  q: With independent Gaussian noise of equal σ, the maximum-likelihood fit is…
  options:
    - the median fit
    - ordinary least squares
    - the fit through the first and last points
    - weighted by the residual size
  answer: 1
  explain: −ln L is proportional to the sum of squared residuals.
- type: mc
  q: In weighted least squares, $\operatorname{Cov}(\hat\theta)$ equals…
  options:
    - $A^TWA$
    - $(A^TWA)^{-1}$
    - $W$
    - $(A^TA)^{-1}$ always
  answer: 1
  explain: It follows from propagating $\Sigma_z = W^{-1}$ through the estimator.
- type: num
  q: The three-thermometer exercise. What is the fused σ in °C?
  answer: 0.094763
  tol: 0.003
  unit: °C
  py: "1/math.sqrt(1/0.01+1/0.09+1/4)"
  explain: Add the weights 100, 11.11 and 0.25.
- type: mc
  q: The fused estimate of two sensors is…
  options:
    - always less precise than the better sensor
    - always at least as precise as the better sensor
    - the plain average
    - only valid if σ1 = σ2
  answer: 1
  explain: $1/\sigma^2 = 1/\sigma_1^2 + 1/\sigma_2^2 \ge 1/\sigma_1^2$.
:::end

:::verify
w = [100, 1/0.09, 0.25]; z = [20.2, 20.6, 19.0]
assert abs(sum(a*b for a,b in zip(w,z))/sum(w) - 20.24) < 0.005
:::end
