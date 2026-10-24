---
id: p14-l14
minutes: 40
summary: A Kalman filter is only optimal if Q and R describe the real noise, and the filter's own innovations tell you whether they do. You derive the normalised innovation squared and its chi-square bounds, estimate R from a log of a stationary sensor, tune q from a driving log until the NIS is consistent, and test that the tuned filter passes while filters with q 100 times off fail in opposite directions.
---

## Innovations as a health check

The innovation $y_k = z_k - H\hat x_k^-$ has covariance $S_k = HP_k^-H^T + R$, as computed by the filter. If the model and noise settings are right:

- $y_k$ is zero-mean and **white** (uncorrelated in time);
- the **normalised innovation squared** $\nu_k = y_k^TS_k^{-1}y_k$ is chi-square with $m$ degrees of freedom ($m$ = measurement dimension), mean $m$;
- about 95 % of scalar innovations fall within $\pm 2\sqrt{S_k}$.

Unlike NEES (lesson 12), NIS needs no ground truth: it works on real logs.

Over $N$ steps, $N\bar\nu$ is chi-square with $Nm$ degrees of freedom, giving a band for the average. Average NIS above the band: the filter is overconfident ($Q$ or $R$ too small). Below: too cautious.

## A tuning recipe

1. **R first**, from a log with the system still: the sample variance of the sensor reading is $R$ (if the sensor's noise doesn't depend on motion).
2. **Q next**, from a log of normal operation: sweep $q$ and pick the value whose average NIS is closest to $m$.
3. **Check whiteness**: correlated innovations (a lag-1 autocorrelation well above zero) mean the model is missing dynamics, typically $q$ too small.

:::figure widget=nisplot caption="Innovations of a position filter with their 2-sigma bounds, and the running average NIS against its chi-square band. Slide the assumed q away from the truth: too small and the innovations burst through the bounds; too large and they huddle inside."
:::end

## Worked example

Position sensor with $\sigma = 0.3$ m, true $q = 2$ m²/s³, 10 Hz, 3000 samples.

1. Parked log (500 samples): sample standard deviation 0.307 m, so $R = 0.094$ m².
2. Sweep $q$: the average NIS is closest to 1 at $q \approx 1.6$, within the 95 % band [0.950, 1.051]. 95.7 % of innovations fall inside 2 sigma.
3. With $q = 0.02$: average NIS 5.8 and lag-1 autocorrelation 0.83. With $q = 200$: average NIS 0.54.

## Code it from scratch

:::code file=tuning_q_r.py
```python
import numpy as np
from scipy.stats import chi2

dt = 0.1
F = np.array([[1, dt], [0, 1]]); H = np.array([[1.0, 0.0]])
Qof = lambda q: q * np.array([[dt**3 / 3, dt**2 / 2], [dt**2 / 2, dt]])

def make_log(q_true=2.0, r_true=0.3**2, n=3000, seed=0):
    """a 'recorded' log: a cart moving with random acceleration, measured by a noisy position sensor"""
    rng = np.random.default_rng(seed); L = np.linalg.cholesky(Qof(q_true)); x = np.zeros(2); z = []
    for _ in range(n):
        x = F @ x + L @ rng.normal(size=2); z.append(H @ x + np.sqrt(r_true) * rng.normal(size=1))
    parked = np.sqrt(r_true) * rng.normal(size=500) + 1.234    # a separate log with the cart standing still
    return np.array(z), parked

def run_filter(z, q, r):
    x = np.array([z[0, 0], 0.0]); P = np.diag([r, 10.0]); R = np.array([[r]]); nis, innov, bounds = [], [], []
    for zk in z[1:]:
        x = F @ x; P = F @ P @ F.T + Qof(q)
        S = H @ P @ H.T + R; y = zk - H @ x; K = P @ H.T / S[0, 0]
        x = x + K @ y; P = (np.eye(2) - K @ H) @ P
        nis.append(float(y @ y / S[0, 0])); innov.append(float(y[0])); bounds.append(2 * np.sqrt(S[0, 0]))
    return np.array(nis), np.array(innov), np.array(bounds)

def nis_band(n, m=1, p=0.95):
    lo, hi = chi2.ppf([(1 - p) / 2, (1 + p) / 2], n * m) / n
    return lo, hi

def tune_q(z, r, qs=np.logspace(-2, 2, 41)):
    """pick the q whose average NIS is closest to its expected value m = 1"""
    scores = [abs(np.mean(run_filter(z, q, r)[0]) - 1.0) for q in qs]
    return qs[int(np.argmin(scores))]

def test_r_from_parked_log():
    _, parked = make_log()
    r_hat = np.var(parked, ddof=1)
    print(f"R from the parked log: sigma = {np.sqrt(r_hat):.4f} m (true 0.3)")
    assert abs(np.sqrt(r_hat) / 0.3 - 1) < 0.08

def test_tuned_filter_passes_nis():
    z, parked = make_log(); r = np.var(parked, ddof=1); q = tune_q(z, r)
    nis, innov, b = run_filter(z, q, r)
    lo, hi = nis_band(len(nis))
    inside = np.mean(np.abs(innov) < b)
    print(f"tuned q = {q:.2f} (true 2.0): average NIS {nis.mean():.3f} in [{lo:.3f}, {hi:.3f}], {inside:.1%} of innovations inside 2 sigma")
    assert lo < nis.mean() < hi and 0.5 < q / 2.0 < 2.0 and 0.93 < inside < 0.97

def test_mistuned_filters_fail_nis():
    z, parked = make_log(); r = np.var(parked, ddof=1); lo, hi = nis_band(len(z) - 1)
    small = run_filter(z, 0.02, r)[0].mean(); big = run_filter(z, 200.0, r)[0].mean()
    print(f"q 100x too small: average NIS {small:.2f} (overconfident); q 100x too large: {big:.3f} (too cautious)")
    assert small > hi and big < lo

def test_innovations_white():
    z, parked = make_log(); r = np.var(parked, ddof=1)
    _, innov, _ = run_filter(z, tune_q(z, r), r); y = innov - innov.mean()
    rho1 = np.sum(y[1:] * y[:-1]) / np.sum(y * y)
    _, innov_bad, _ = run_filter(z, 0.02, r); yb = innov_bad - innov_bad.mean()
    rho_bad = np.sum(yb[1:] * yb[:-1]) / np.sum(yb * yb)
    print(f"lag-1 autocorrelation of innovations: tuned {rho1:+.3f}, q too small {rho_bad:+.3f}")
    assert abs(rho1) < 0.1 and rho_bad > 0.3

test_r_from_parked_log()
test_tuned_filter_passes_nis()
test_mistuned_filters_fail_nis()
test_innovations_white()
print("PASS")
```
:::end

## Exercises

:::exercise
The tuned $q$ came out at 1.6 rather than the true 2.0. Is that a failure?
:::solution
No. The average NIS is a statistic of a finite log, and $R$ was itself estimated (about 2 % high in standard deviation here, 5 % in variance, which pushes $q$ down to compensate). The filter's performance is flat near the optimum, so a factor of 1.3 in $q$ barely changes the error. What matters is that the consistency tests pass.
:::end

:::exercise
Average NIS looks fine, but innovations are strongly correlated. What does that suggest?
:::solution
The model is wrong in a way that the noise levels can't fix, for example a missing bias state or an unmodelled resonance. Errors that persist from one step to the next show up as correlation. Add the missing state (as the attitude filter in lesson 17 does with gyro bias) rather than inflating $Q$.
:::end

## Quiz

:::quiz
- type: num
  q: Expected NIS for a 2-D position measurement?
  answer: 2
  tol: 0.001
  py: "2"
  explain: Chi-square with m = 2 has mean 2.
- type: num
  q: Upper 97.5 % point of the average NIS over 2999 scalar innovations?
  answer: 1.0513
  tol: 0.002
  py: "__import__('scipy.stats', fromlist=['chi2']).chi2.ppf(0.975, 2999)/2999"
  explain: chi2(N)/N.
- type: num
  q: R in m² for a sensor with 0.3 m standard deviation?
  answer: 0.09
  tol: 0.001
  unit: m²
  py: "0.3**2"
  explain: The variance.
- type: num
  q: Fraction of scalar innovations expected inside ±2√S?
  answer: 0.9545
  tol: 0.002
  py: "math.erf(2/math.sqrt(2))"
  explain: The Gaussian 2-sigma probability.
- type: mc
  q: Average NIS well above its band means…
  options:
    - Q or R is too small and the filter is overconfident
    - Q or R is too large
    - the filter is optimal
    - the sensor is perfect
  answer: 0
  explain: Innovations are bigger than the filter expects.
- type: mc
  q: Why is NIS usable on real logs when NEES is not?
  options:
    - it needs only measurements, not the true state
    - it is always smaller
    - it ignores R
    - it needs no covariance
  answer: 0
  explain: NEES needs ground truth.
:::end
