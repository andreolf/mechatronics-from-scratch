---
id: p14-l12
minutes: 45
summary: The Kalman filter is the linear estimator that minimises the expected squared error, and it alternates a predict step that grows the uncertainty with an update step that shrinks it. You derive the predict and update equations and the gain that minimises the trace of the posterior covariance, implement a Kalman filter class, and test with Monte Carlo runs that its errors are consistent with its own covariance by the NEES chi-square test.
---

## Model

$$x_{k+1} = Fx_k + w_k, \quad w_k \sim \mathcal N(0, Q), \qquad z_k = Hx_k + v_k, \quad v_k \sim \mathcal N(0, R).$$

The filter carries an estimate $\hat x$ and its error covariance $P = \mathrm E[(x - \hat x)(x - \hat x)^T]$.

## Predict

Push the estimate through the model; the error picks up $F$ and the new process noise:

$$\hat x^- = F\hat x, \qquad P^- = FPF^T + Q.$$

## Update

Correct with the **innovation** $y = z - H\hat x^-$, whose covariance is $S = HP^-H^T + R$: $\hat x = \hat x^- + Ky$. For any gain $K$ the new error is $(I - KH)e^- - Kv$, so

$$P = (I - KH)P^-(I - KH)^T + KRK^T \quad\text{(Joseph form).}$$

Minimise the total error variance $\mathrm{tr}\,P$ over $K$. Using $\partial\,\mathrm{tr}(KAK^T)/\partial K = 2KA$:

$$\frac{\partial\,\mathrm{tr}P}{\partial K} = -2(I - KH)P^-H^T + 2KR = 0 \;\Rightarrow\; K = P^-H^TS^{-1}.$$

At that gain the covariance simplifies to $P = (I - KH)P^-$, but the Joseph form is kept in code because it stays symmetric and positive-definite under rounding.

## Is the filter honest? NEES

If the model is right, the **normalised estimation error squared** $\epsilon_k = e_k^TP_k^{-1}e_k$ is chi-square with $n$ degrees of freedom: mean $n$. Average it over $N$ Monte Carlo runs: $N\bar\epsilon$ is chi-square with $Nn$ degrees of freedom, which gives a 95 % band. Above the band means the filter is overconfident (its $P$ is too small); below means it's too cautious.

:::figure widget=kfellipse caption="The 2-sigma covariance ellipse of a position-velocity filter. Predict stretches and shears it (velocity uncertainty leaks into position); update with a position fix squeezes it along the position axis. Step through and watch the gain change."
:::end

## Worked example

Scalar, $F = H = 1$: prior variance $P^- = 4$, measurement variance $R = 1$.

1. $K = 4/(4 + 1) = 0.8$: trust the measurement four times more than the prediction.
2. $P = (1 - 0.8) \times 4 = 0.8$, smaller than either 4 or 1.
3. With prior $\hat x^- = 10$ and $z = 12$: $\hat x = 10 + 0.8 \times 2 = 11.6$.

## Code it from scratch

:::code file=kalman_filter.py
```python
import numpy as np
from scipy.stats import chi2

class KalmanFilter:
    """linear Kalman filter: x_{k+1} = F x_k + w (cov Q), z_k = H x_k + v (cov R)"""
    def __init__(self, F, H, Q, R, x0, P0):
        self.F, self.H, self.Q, self.R = F, H, Q, R
        self.x, self.P = x0.astype(float).copy(), P0.astype(float).copy()

    def predict(self):
        self.x = self.F @ self.x
        self.P = self.F @ self.P @ self.F.T + self.Q

    def gain(self):
        S = self.H @ self.P @ self.H.T + self.R
        return self.P @ self.H.T @ np.linalg.inv(S), S

    def update(self, z, K=None):
        Kopt, S = self.gain(); K = Kopt if K is None else K
        y = z - self.H @ self.x                                     # innovation
        self.x = self.x + K @ y
        I_KH = np.eye(len(self.x)) - K @ self.H
        self.P = I_KH @ self.P @ I_KH.T + K @ self.R @ K.T         # Joseph form: valid for any K, stays symmetric
        return y, S

dt = 0.1
F = np.array([[1, dt], [0, 1]]); H = np.array([[1.0, 0.0]])
q = 0.5; Q = q * np.array([[dt**3 / 3, dt**2 / 2], [dt**2 / 2, dt]])    # white-noise acceleration of intensity q
R = np.array([[0.25]])

def test_gain_minimises_trace():
    kf = KalmanFilter(F, H, Q, R, np.zeros(2), np.diag([4.0, 1.0])); kf.predict()
    K, _ = kf.gain()
    def trace_after(Kt):
        I_KH = np.eye(2) - Kt @ H
        return np.trace(I_KH @ kf.P @ I_KH.T + Kt @ R @ Kt.T)
    best = trace_after(K); rng = np.random.default_rng(0)
    assert all(trace_after(K + 0.05 * rng.normal(size=K.shape)) > best for _ in range(500))
    # and the derivative of the trace vanishes at K: -2 (I - K H) P H' + 2 K R = 0
    grad = -2 * (np.eye(2) - K @ H) @ kf.P @ H.T + 2 * K @ R
    print(f"optimal gain {np.round(K.ravel(), 4)}, trace {best:.4f}; gradient at K {np.abs(grad).max():.1e}")
    assert np.abs(grad).max() < 1e-12

def test_nees_consistent():
    runs, steps = 200, 100; rng = np.random.default_rng(1)
    nees = np.zeros(steps); Lq = np.linalg.cholesky(Q)
    for _ in range(runs):
        x = np.array([0.0, 1.0]); P0 = np.diag([1.0, 1.0])
        kf = KalmanFilter(F, H, Q, R, x + np.linalg.cholesky(P0) @ rng.normal(size=2), P0)
        for k in range(steps):
            x = F @ x + Lq @ rng.normal(size=2)
            kf.predict(); kf.update(H @ x + np.sqrt(R[0, 0]) * rng.normal(size=1))
            e = x - kf.x; nees[k] += e @ np.linalg.solve(kf.P, e)
    avg = nees / runs
    lo, hi = chi2.ppf([0.025, 0.975], 2 * runs) / runs               # 95 % bounds on the average NEES
    inside = np.mean((avg > lo) & (avg < hi))
    print(f"average NEES over {runs} runs: mean {avg.mean():.3f} (ideal 2), {inside:.0%} of steps inside [{lo:.2f}, {hi:.2f}]")
    assert abs(avg.mean() - 2) < 0.1 and inside > 0.85

def test_inconsistent_filter_fails_nees():
    # a filter that believes the noise is 10x smaller than it is becomes overconfident
    runs, steps = 100, 100; rng = np.random.default_rng(2); total = 0.0; Lq = np.linalg.cholesky(Q)
    for _ in range(runs):
        x = np.array([0.0, 1.0]); kf = KalmanFilter(F, H, Q / 10, R / 10, x.copy(), np.eye(2))
        for k in range(steps):
            x = F @ x + Lq @ rng.normal(size=2)
            kf.predict(); kf.update(H @ x + np.sqrt(R[0, 0]) * rng.normal(size=1))
            e = x - kf.x; total += e @ np.linalg.solve(kf.P, e)
    print(f"overconfident filter: average NEES {total / (runs * steps):.1f} (should be 2)")
    assert total / (runs * steps) > 5

test_gain_minimises_trace()
test_nees_consistent()
test_inconsistent_filter_fails_nees()
print("PASS")
```
:::end

## Exercises

:::exercise
Show that for the scalar case, $1/P = 1/P^- + 1/R$.
:::solution
$P = (1 - K)P^- = \left(1 - \frac{P^-}{P^- + R}\right)P^- = \frac{RP^-}{P^- + R}$, so $\frac{1}{P} = \frac{P^- + R}{RP^-} = \frac{1}{R} + \frac{1}{P^-}$. Information (inverse variance) adds.
:::end

:::exercise
Why does the code use the Joseph form instead of $(I - KH)P^-$?
:::solution
The short form is only valid at the exact optimal gain and loses symmetry with rounding; over thousands of updates $P$ can become indefinite and the filter diverges. The Joseph form is a sum of symmetric positive semi-definite terms for any $K$, so it stays well-behaved. It's also the right formula when you deliberately use a suboptimal gain.
:::end

## Quiz

:::quiz
- type: num
  q: Kalman gain for prior variance 4 and measurement variance 1?
  answer: 0.8
  tol: 0.001
  py: "4/(4+1)"
  explain: K = P⁻/(P⁻ + R).
- type: num
  q: Posterior variance in that case?
  answer: 0.8
  tol: 0.001
  py: "(1-0.8)*4"
  explain: (1 − K)P⁻.
- type: num
  q: Expected NEES for a 2-state filter that is consistent?
  answer: 2
  tol: 0.001
  py: "2"
  explain: Chi-square mean equals the degrees of freedom.
- type: num
  q: Upper 97.5 % point of the average NEES over 200 runs of a 2-state filter?
  answer: 2.2869
  tol: 0.005
  py: "__import__('scipy.stats', fromlist=['chi2']).chi2.ppf(0.975, 400)/200"
  explain: chi2(Nn) / N.
- type: mc
  q: An average NEES far above the band means the filter is…
  options:
    - overconfident, with P too small
    - too cautious, with P too large
    - optimal
    - unobservable
  answer: 0
  explain: Errors are bigger than the filter believes.
- type: mc
  q: The predict step generally…
  options:
    - increases the uncertainty by adding Q
    - decreases the uncertainty
    - uses the measurement
    - changes the gain only
  answer: 0
  explain: Process noise adds uncertainty between measurements.
:::end
