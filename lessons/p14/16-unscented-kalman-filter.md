---
id: p14-l16
minutes: 45
summary: The unscented Kalman filter replaces Jacobians with a small set of carefully chosen sample points pushed through the true nonlinear function, which captures how curvature shifts the mean and reshapes the spread. You derive the sigma points and the unscented transform, apply it to a range-bearing measurement whose uncertainty is a curved banana, and test against Monte Carlo that it gets the mean and covariance far closer than linearisation, and that the UKF update beats the EKF.
---

## Push points, not Jacobians

For a Gaussian $x \sim \mathcal N(m, P)$ with $n$ dimensions, pick $2n + 1$ **sigma points**

$$\mathcal X_0 = m, \qquad \mathcal X_{\pm i} = m \pm \left(\sqrt{(n + \lambda)P}\right)_i, \quad i = 1..n,$$

where $(\cdot)_i$ is the $i$-th column of a matrix square root (Cholesky). With weights $W_0 = \lambda/(n + \lambda)$, $W_{\pm i} = 1/(2(n + \lambda))$, these points have exactly mean $m$ and covariance $P$. Push each through the nonlinear function, $\mathcal Y_i = g(\mathcal X_i)$, and recombine:

$$\bar y = \sum_i W_i\mathcal Y_i, \qquad P_y = \sum_i W_i(\mathcal Y_i - \bar y)(\mathcal Y_i - \bar y)^T, \qquad P_{xy} = \sum_i W_i(\mathcal X_i - m)(\mathcal Y_i - \bar y)^T.$$

This is the **unscented transform**. It's exact for linear $g$ and correct to second order in the mean for smooth nonlinear $g$, where linearisation is only first order. We use Julier's original choice $\lambda = 3 - n$; the scaled variant with $\alpha$, $\beta$ is common too.

The **UKF** uses the transform twice per step: once for the prediction through $f$, once for the measurement through $h$, then forms $K = P_{xz}S^{-1}$ as usual. No derivatives are needed.

## A banana

A target 10 m away at a bearing known to ±30°: in $x$-$y$ it lies on an arc, not an ellipse. The true mean is pulled *inward* along the arc's axis to $10e^{-\sigma_\theta^2/2} = 8.72$ m; linearisation says 10 m, and gets the spread along that axis wrong by a factor of 70.

:::figure widget=unscented caption="A range-bearing uncertainty mapped into x-y: the Monte Carlo cloud, the five sigma points and their recombined ellipse, and the linearised ellipse. Widen the bearing uncertainty: the cloud curls into a banana, the unscented mean follows it inward, the linearised one doesn't."
:::end

## Worked example

$r = 10 \pm 0.2$ m, bearing $90° \pm 30°$ ($\sigma_\theta = 0.524$ rad), $n = 2$, $\lambda = 1$.

1. Monte Carlo (400 000 samples): mean $y = 8.718$ m, variance in $y$ 2.91 m².
2. Unscented: mean 8.721 m, variance 3.31 m².
3. Linearised: mean 10.000 m, variance 0.040 m².
4. One range-bearing fix with a sideways-broad prior, over 300 trials: RMS error EKF 2.73 m, UKF 1.11 m. Average NEES EKF 2295, UKF 20 (ideal 2): both are overconfident after one update from so broad a prior, the EKF wildly so.

## Code it from scratch

:::code file=ukf.py
```python
import numpy as np

def sigma_points(m, P, alpha=1.0, beta=0.0, kappa=None):
    """unscented transform (Julier: alpha = 1, beta = 0, kappa = 3 - n): 2n+1 points and weights"""
    n = len(m); kappa = 3.0 - n if kappa is None else kappa
    lam = alpha**2 * (n + kappa) - n
    S = np.linalg.cholesky((n + lam) * P)
    X = np.vstack([m, m + S.T, m - S.T])
    Wm = np.full(2 * n + 1, 1 / (2 * (n + lam))); Wc = Wm.copy()
    Wm[0] = lam / (n + lam); Wc[0] = Wm[0] + 1 - alpha**2 + beta
    return X, Wm, Wc

def unscented_transform(fun, m, P, noise=None):
    X, Wm, Wc = sigma_points(m, P)
    Y = np.array([fun(x) for x in X]); my = Wm @ Y
    D = Y - my; Py = (Wc[:, None] * D).T @ D
    Pxy = (Wc[:, None] * (X - m)).T @ D
    return my, Py + (0 if noise is None else noise), Pxy

def linearised_transform(fun, m, P, noise=None):
    J = np.column_stack([(fun(m + e * 1e-6) - fun(m - e * 1e-6)) / 2e-6 for e in np.eye(len(m))])
    return fun(m), J @ P @ J.T + (0 if noise is None else noise), P @ J.T

polar_to_xy = lambda p: np.array([p[0] * np.cos(p[1]), p[0] * np.sin(p[1])])
xy_to_polar = lambda x: np.array([np.hypot(x[0], x[1]), np.arctan2(x[1], x[0])])

def test_transform_of_a_banana():
    # range 10 m +/- 0.2, bearing 90 deg +/- 30 deg: the true distribution in x, y is a curved banana
    m, P = np.array([10.0, np.pi / 2]), np.diag([0.2**2, np.radians(30)**2])
    rng = np.random.default_rng(0); S = rng.multivariate_normal(m, P, 400000)
    Y = np.column_stack([S[:, 0] * np.cos(S[:, 1]), S[:, 0] * np.sin(S[:, 1])])
    mt, Pt = Y.mean(axis=0), np.cov(Y.T)
    mu, Pu, _ = unscented_transform(polar_to_xy, m, P); ml, Pl, _ = linearised_transform(polar_to_xy, m, P)
    print(f"true mean y {mt[1]:.3f} m (shrinks by exp(-s^2/2) = {10 * np.exp(-np.radians(30)**2 / 2):.3f}); UT {mu[1]:.3f}; linearised {ml[1]:.3f}")
    print(f"true var x {Pt[0, 0]:.2f}, y {Pt[1, 1]:.3f}; UT {Pu[0, 0]:.2f}, {Pu[1, 1]:.3f}; linearised {Pl[0, 0]:.2f}, {Pl[1, 1]:.3f}")
    assert abs(mu[1] - mt[1]) < 0.1 * abs(ml[1] - mt[1])            # UT gets the mean shift that linearisation misses
    assert abs(Pu[1, 1] - Pt[1, 1]) < 0.2 * abs(Pl[1, 1] - Pt[1, 1])

def filters_on_range_bearing(runs=300, seed=1):
    """a static target near (0, 10) with a prior that is broad sideways; one range-bearing fix"""
    rng = np.random.default_rng(seed); R = np.diag([0.05**2, np.radians(1)**2])
    m0, P0 = np.array([0.0, 10.0]), np.diag([6.0**2, 0.5**2])
    res = {"EKF": [], "UKF": []}; nees = {"EKF": [], "UKF": []}
    for _ in range(runs):
        x = rng.multivariate_normal(m0, P0)
        z = xy_to_polar(x) + rng.multivariate_normal(np.zeros(2), R)
        for name, T in (("EKF", linearised_transform), ("UKF", unscented_transform)):
            zh, S, Pxz = T(xy_to_polar, m0, P0, R)
            K = Pxz @ np.linalg.inv(S); xh = m0 + K @ (z - zh); P = P0 - K @ S @ K.T
            e = x - xh; res[name].append(e @ e); nees[name].append(e @ np.linalg.solve(P, e))
    return {k: np.sqrt(np.mean(v)) for k, v in res.items()}, {k: np.mean(v) for k, v in nees.items()}

def test_ukf_beats_ekf():
    rms, nees = filters_on_range_bearing()
    print(f"after one range-bearing fix: RMS error EKF {rms['EKF']:.2f} m, UKF {rms['UKF']:.2f} m; average NEES EKF {nees['EKF']:.1f}, UKF {nees['UKF']:.1f} (ideal 2)")
    assert rms["UKF"] < 0.7 * rms["EKF"] and abs(nees["UKF"] - 2) < abs(nees["EKF"] - 2)

def test_linear_case_identical():
    A = np.array([[1.0, 2.0], [0.5, -1.0]]); m = np.array([1.0, 2.0]); P = np.array([[2.0, 0.3], [0.3, 1.0]])
    mu, Pu, _ = unscented_transform(lambda x: A @ x, m, P)
    assert np.allclose(mu, A @ m) and np.allclose(Pu, A @ P @ A.T)    # exact for linear maps

test_transform_of_a_banana()
test_ukf_beats_ekf()
test_linear_case_identical()
print("PASS")
```
:::end

## Exercises

:::exercise
Why are only $2n + 1$ points enough, when a Monte Carlo needs thousands?
:::solution
They are not random: they are placed to match the first two moments exactly, and the transform only aims to get the output's first two moments right. Monte Carlo approximates the whole distribution and its error falls only as $1/\sqrt N$. The price is that the UT knows nothing beyond the mean and covariance, so multimodal outputs still need particles.
:::end

:::exercise
Why does the true mean of the banana move inward?
:::solution
$\mathrm E[r\sin\theta]$ with $\theta \sim \mathcal N(90°, \sigma^2)$ is $r\,e^{-\sigma^2/2}$: points on either side of the arc's middle are lower than the middle, so their average is too. Linearisation replaces the arc by its tangent, which has no curvature, so it can't see the shift.
:::end

## Quiz

:::quiz
- type: num
  q: Number of sigma points for a 6-state filter?
  answer: 13
  tol: 0.001
  py: "2*6+1"
  explain: 2n + 1.
- type: num
  q: Central weight W₀ for n = 2 and λ = 1?
  answer: 0.3333
  tol: 0.001
  py: "1/3"
  explain: λ/(n + λ).
- type: num
  q: True mean distance in m along the bearing axis for r = 10 m and σ_θ = 30°?
  answer: 8.7193
  tol: 0.001
  unit: m
  py: "10*math.exp(-math.radians(30)**2/2)"
  explain: r e^(−σ²/2).
- type: num
  q: Weight of each of the other sigma points for n = 2 and λ = 1?
  answer: 0.16667
  tol: 0.001
  py: "1/(2*3)"
  explain: 1/(2(n + λ)).
- type: mc
  q: For a linear function the unscented transform is…
  options:
    - exact
    - first-order accurate
    - biased
    - undefined
  answer: 0
  explain: Mean and covariance pass through a linear map exactly.
- type: mc
  q: What does the UKF avoid that the EKF needs?
  options:
    - Jacobians of f and h
    - a covariance matrix
    - a measurement model
    - an initial estimate
  answer: 0
  explain: Points are pushed through the functions directly.
:::end
