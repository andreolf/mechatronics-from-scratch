---
id: p12-l18
minutes: 35
summary: An identified model is only good enough if it predicts data it was not fitted to and leaves nothing predictable behind, which you check by cross-validation on a fresh record and by testing that the prediction residuals are white and uncorrelated with the input. You derive the whiteness bounds and the Ljung-Box statistic, fit ARX models of two orders, and test that the correct model's residuals pass the whiteness test while an under-modelled one fails it.
---

## Two questions

1. **Does it predict new data?** Fit on one record (estimation set), evaluate on another (validation set). A model that only fits its own data has learned the noise. The usual score is the normalised fit

$$\text{fit} = 100\left(1 - \frac{\lVert y - \hat y\rVert}{\lVert y - \bar y\rVert}\right)\ \%.$$

2. **Is anything left?** The one-step prediction residuals $\varepsilon_k = y_k - \hat y_{k|k-1}$ of a correct model are the unpredictable noise, so they should be **white** (uncorrelated with their own past) and uncorrelated with past inputs. Structure in the residuals is model you missed.

## The whiteness test

For $N$ white samples the normalised autocorrelation $\hat r(\ell) = \sum \varepsilon_k\varepsilon_{k-\ell}/\sum\varepsilon_k^2$ is approximately normal with variance $1/N$, so 95 % of lags should fall inside $\pm 1.96/\sqrt N$.

Checking 20 lags one at a time flags one by chance in two runs out of three. The **Ljung-Box** statistic tests them jointly:

$$Q = N(N + 2)\sum_{\ell = 1}^{m}\frac{\hat r(\ell)^2}{N - \ell} \sim \chi^2_m,$$

and the residuals pass at the 5 % level if $Q$ is below the 95th percentile of $\chi^2_m$ (31.4 for $m = 20$). A correct model should then pass in about 95 % of experiments, not 100 %.

## ARX models

An ARX model predicts $y_k$ from past outputs and inputs:

$$y_k = a_1y_{k-1} + \cdots + a_ny_{k-n} + b_1u_{k-1} + \cdots + b_nu_{k-n} + e_k.$$

It is linear in the parameters, so least squares gives them in one solve. If the true system has this form, its residuals are exactly $e_k$.

:::figure widget=residualacf caption="Residual autocorrelation of a fitted model with the 95 % whiteness band. A first-order model of a second-order plant leaves bars poking out of the band; the correct order keeps them inside."
:::end

## Worked example

$N = 4000$ samples, $m = 20$ lags.

1. Whiteness band: $\pm 1.96/\sqrt{4000} = \pm 0.031$.
2. A first-order model leaves a lag-1 correlation of, say, 0.3: $Q \ge 4000 \times 4002 \times 0.09/3999 = 360$, far above 31.4. It fails.
3. Probability that at least one of 20 truly white lags falls outside the band: $1 - 0.95^{20} = 64$ %. That's why you use the joint test.

## Code it from scratch

:::code file=validate.py
```python
import numpy as np
from scipy import stats

A_TRUE, B_TRUE = [1.5, -0.7], [0.5, 0.25]          # second-order system, poles at 0.75 +- 0.37j
N, M = 4000, 20

def simulate(seed, noise=0.1):
    rng = np.random.default_rng(seed)
    u = np.sign(rng.normal(size=N))                 # random binary input
    e = rng.normal(0, noise, N)
    y = np.zeros(N)
    for k in range(2, N):
        y[k] = A_TRUE[0] * y[k - 1] + A_TRUE[1] * y[k - 2] + B_TRUE[0] * u[k - 1] + B_TRUE[1] * u[k - 2] + e[k]
    return u, y

def regressors(u, y, n):
    rows = [np.concatenate([y[k - n:k][::-1], u[k - n:k][::-1]]) for k in range(n, len(y))]
    return np.array(rows), y[n:]

def fit_arx(u, y, n):
    Phi, Y = regressors(u, y, n)
    return np.linalg.lstsq(Phi, Y, rcond=None)[0]

def residuals(theta, u, y, n):
    Phi, Y = regressors(u, y, n)
    return Y - Phi @ theta

def simulate_model(theta, u, n):
    y = np.zeros(len(u))
    for k in range(n, len(u)):
        y[k] = theta[:n] @ y[k - n:k][::-1] + theta[n:] @ u[k - n:k][::-1]
    return y

def acf(r, m):
    r = r - r.mean(); d = r @ r
    return np.array([r[l:] @ r[:-l] / d for l in range(1, m + 1)])

def ljung_box(r, m=M):
    n = len(r); rho = acf(r, m)
    Q = n * (n + 2) * np.sum(rho ** 2 / (n - np.arange(1, m + 1)))
    return Q, 1 - stats.chi2.cdf(Q, m)

def fit_percent(y, yhat):
    return 100 * (1 - np.linalg.norm(y - yhat) / np.linalg.norm(y - y.mean()))

def test_correct_order_passes_whiteness():
    u, y = simulate(0); uv, yv = simulate(1)          # estimation and validation records
    th = fit_arx(u, y, 2)
    r = residuals(th, uv, yv, 2)
    Q, p = ljung_box(r)
    fit = fit_percent(yv, simulate_model(th, uv, 2))
    print(f"ARX(2): params {np.round(th, 3)}, validation fit {fit:.1f} %, Ljung-Box Q = {Q:.1f}, p = {p:.2f}")
    assert np.allclose(th, A_TRUE + B_TRUE, atol=0.02)
    assert p > 0.05 and Q < stats.chi2.ppf(0.95, M)
    assert np.max(np.abs(acf(r, 2))) < 1.96 / np.sqrt(len(r)) * 1.5
    # residuals uncorrelated with past input too
    rr = (r - r.mean()) / r.std(); uu = (uv[2:] - uv[2:].mean()) / uv[2:].std()
    xc = [np.mean(rr[l:] * uu[:-l]) for l in range(1, M + 1)]
    assert np.max(np.abs(xc)) < 3 / np.sqrt(len(r))

def test_under_modelled_fails():
    u, y = simulate(0); uv, yv = simulate(1)
    th = fit_arx(u, y, 1)
    r = residuals(th, uv, yv, 1)
    Q, p = ljung_box(r)
    fit = fit_percent(yv, simulate_model(th, uv, 1))
    print(f"ARX(1): validation fit {fit:.1f} %, lag-1 residual correlation {acf(r, 1)[0]:.2f}, Q = {Q:.0f}, p = {p:.1e}")
    assert p < 1e-6

def test_pass_rate_is_about_95_percent():
    passes = 0
    for seed in range(100, 200):
        u, y = simulate(seed)
        th = fit_arx(u, y, 2)
        uv, yv = simulate(seed + 1000)
        passes += ljung_box(residuals(th, uv, yv, 2))[1] > 0.05
    print(f"correct model passes Ljung-Box in {passes} of 100 independent experiments")
    assert 85 <= passes <= 100

test_correct_order_passes_whiteness()
test_under_modelled_fails()
test_pass_rate_is_about_95_percent()
print("PASS")
```
:::end

## Exercises

:::exercise
A higher-order model always fits the estimation data at least as well. How does the validation set protect you from choosing too high an order?
:::solution
Extra parameters fit the particular noise realisation of the estimation record. On fresh data that noise is different, so the extra terms add error instead of removing it, and the validation fit stops improving or gets worse. Choose the lowest order where validation fit levels off and residuals are white.
:::end

:::exercise
Residuals are white but correlated with past inputs. What does that tell you?
:::solution
The noise model is fine but the input-to-output dynamics are wrong or incomplete: something about how $u$ drives $y$ is still predictable from $u$. Typical causes are a missing time delay or too few $b$ terms.
:::end

## Quiz

:::quiz
- type: num
  q: Half-width of the 95 % whiteness band for N = 4000?
  answer: 0.031
  tol: 0.02
  py: "1.96/4000**0.5"
  explain: 1.96/√N.
- type: num
  q: 95th percentile of χ² with 20 degrees of freedom?
  answer: 31.41
  tol: 0.002
  py: "31.41"
  explain: The Ljung-Box threshold for 20 lags.
- type: num
  q: Probability in % that at least one of 20 white-noise lags falls outside its 95 % band?
  answer: 64.2
  tol: 0.005
  unit: "%"
  py: "100*(1-0.95**20)"
  explain: 1 − 0.95²⁰.
- type: num
  q: Number of parameters in an ARX model with n = 2 (two a's and two b's)?
  answer: 4
  tol: 0
  py: "4"
  explain: a₁, a₂, b₁, b₂.
- type: mc
  q: Residuals with significant correlation at lag 1 mean…
  options:
    - the model misses predictable dynamics
    - the model is perfect
    - the noise is too small
    - the input was too large
  answer: 0
  explain: Something in the past still predicts the error.
- type: mc
  q: Why validate on a separate record?
  options:
    - to catch models that fit the estimation noise
    - it's faster
    - least squares needs two records
    - to increase the fit on estimation data
  answer: 0
  explain: Overfitting shows up only on fresh data.
:::end
