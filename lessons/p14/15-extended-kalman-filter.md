---
id: p14-l15
minutes: 40
summary: The extended Kalman filter handles nonlinear models by propagating the estimate through the true nonlinear functions and the covariance through their Jacobians. You derive the EKF for a swinging pendulum measured by a noisy angle sensor, implement it, and test that it converges from a badly wrong initial state and tracks large swings far better than a Kalman filter built on the small-angle model.
---

## Linearise around the estimate

Nonlinear model: $x_{k+1} = f(x_k) + w_k$, $z_k = h(x_k) + v_k$. The EKF keeps the Kalman structure but:

- **predicts** the estimate with the nonlinear model, $\hat x^- = f(\hat x)$;
- propagates the covariance with the Jacobian evaluated at the current estimate, $F_k = \left.\partial f/\partial x\right|_{\hat x}$: $P^- = F_kPF_k^T + Q$;
- **updates** with $H_k = \left.\partial h/\partial x\right|_{\hat x^-}$ and innovation $z - h(\hat x^-)$.

It's a first-order approximation: good when the uncertainty is small compared with how fast the functions curve, poor otherwise (lesson 16).

## The pendulum

$\ddot\theta = -\tfrac{g}{\ell}\sin\theta - c\dot\theta$ with state $(\theta, \dot\theta)$, measured angle $z = \theta + v$. For an Euler step of length $T$:

$$F_k \approx \begin{bmatrix}1 & T\\ -\tfrac{g}{\ell}T\cos\hat\theta & 1 - cT\end{bmatrix}.$$

The code uses an RK4 step for $f$ and central differences for its Jacobian, and checks it against this formula. The $\cos\hat\theta$ term is the point: at $\hat\theta = 0$ it's the familiar small-angle model, but near $\pm 90°$ gravity's restoring stiffness vanishes and a linear filter built at $\theta = 0$ is badly wrong.

:::figure widget=ekfpend caption="An EKF tracking a swinging pendulum from noisy angle readings, starting from a wrong guess. Raise the swing amplitude and compare with the small-angle Kalman filter, which loses the angular rate on big swings."
:::end

## Worked example

$\ell = 0.5$ m, $c = 0.1$ s⁻¹, 50 Hz angle sensor with 2° noise.

1. Small-angle frequency $\sqrt{g/\ell} = 4.43$ rad/s (period 1.42 s).
2. At $\hat\theta = 1.2$ rad, $F_{21} = -19.62 \times 0.02 \times \cos 1.2 = -0.142$, against $-0.392$ at $\theta = 0$.
3. Truth starts at 1.2 rad, the filter at $-0.8$ rad and 2 rad/s: within 2° and 0.1 rad/s from 0.32 s onward; over the last 5 s, 0.39° and 0.027 rad/s RMS.
4. A 2 rad swing: EKF rate error 0.022 rad/s RMS, small-angle KF 1.35 rad/s.

## Code it from scratch

:::code file=ekf_pendulum.py
```python
import numpy as np

g, l, c = 9.81, 0.5, 0.1                 # pendulum: length 0.5 m, light damping
dt = 0.02                                # 50 Hz angle sensor

def f(x):
    """one RK4 step of th'' = -(g/l) sin th - c th'"""
    d = lambda s: np.array([s[1], -g / l * np.sin(s[0]) - c * s[1]])
    k1 = d(x); k2 = d(x + dt / 2 * k1); k3 = d(x + dt / 2 * k2); k4 = d(x + dt * k3)
    return x + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4)

def F_jac(x):
    """Jacobian of the discrete step, by central differences (an analytic Euler version is in the text)"""
    return np.column_stack([(f(x + e * 1e-6) - f(x - e * 1e-6)) / 2e-6 for e in np.eye(2)])

H = np.array([[1.0, 0.0]])

def ekf(z, x0, P0, q=0.01, r=np.radians(2)**2, linear_about_zero=False):
    x, P = x0.copy(), P0.copy(); Q = q * np.array([[dt**3 / 3, dt**2 / 2], [dt**2 / 2, dt]]); out = []
    F0 = F_jac(np.zeros(2))
    for zk in z:
        if linear_about_zero:
            x = F0 @ x; Fk = F0                         # a plain KF on the small-angle model
        else:
            Fk = F_jac(x); x = f(x)                     # EKF: nonlinear prediction, Jacobian for the covariance
        P = Fk @ P @ Fk.T + Q
        S = H @ P @ H.T + r; K = P @ H.T / S[0, 0]
        x = x + (K * (zk - H @ x)).ravel(); P = (np.eye(2) - K @ H) @ P
        out.append(x.copy())
    return np.array(out)

def simulate(x0=np.array([1.2, 0.0]), T=10.0, seed=0, sigma=np.radians(2)):
    rng = np.random.default_rng(seed); x = x0.copy(); xs, z = [], []
    for _ in range(int(T / dt)):
        x = f(x); xs.append(x.copy()); z.append(x[0] + sigma * rng.normal())
    return np.array(xs), np.array(z)

def test_converges_from_wrong_start():
    xs, z = simulate()
    est = ekf(z, x0=np.array([-0.8, 2.0]), P0=np.diag([1.0, 4.0]))
    err = np.abs(est - xs)
    bad = np.where(np.any(err >= [np.radians(2), 0.1], axis=1))[0]
    t_conv = (bad[-1] + 1) * dt if len(bad) else 0.0               # from then on it stays inside
    print(f"EKF from a wrong start (-0.8 rad, 2 rad/s vs 1.2 rad, 0): stays within 2 deg and 0.1 rad/s from {t_conv:.2f} s;"
          f" last 5 s RMS {np.degrees(np.sqrt(np.mean(err[250:, 0]**2))):.2f} deg, {np.sqrt(np.mean(err[250:, 1]**2)):.3f} rad/s")
    assert t_conv < 2.0 and np.sqrt(np.mean(err[250:, 1]**2)) < 0.1

def test_beats_small_angle_kf_on_big_swings():
    xs, z = simulate(x0=np.array([2.0, 0.0]), seed=1)
    e_ekf = ekf(z, np.array([2.0, 0.0]), np.eye(2) * 0.1) - xs
    e_lin = ekf(z, np.array([2.0, 0.0]), np.eye(2) * 0.1, linear_about_zero=True) - xs
    r1, r2 = (np.sqrt(np.mean(e[100:, 1]**2)) for e in (e_ekf, e_lin))
    print(f"2 rad swing, angular-rate RMS error: EKF {r1:.3f} rad/s, small-angle KF {r2:.3f} rad/s")
    assert r1 < 0.5 * r2

def test_jacobian_matches_analytic_euler_limit():
    x = np.array([0.7, -1.1]); J = F_jac(x)
    Je = np.eye(2) + dt * np.array([[0, 1], [-g / l * np.cos(x[0]), -c]])      # Euler-step Jacobian
    assert np.abs(J - Je).max() < 0.05 and abs(J[1, 0] - Je[1, 0]) / abs(Je[1, 0]) < 0.05

test_converges_from_wrong_start()
test_beats_small_angle_kf_on_big_swings()
test_jacobian_matches_analytic_euler_limit()
print("PASS")
```
:::end

## Exercises

:::exercise
Suppose the sensor measures the bob's horizontal position, $z = \ell\sin\theta$. What changes?
:::solution
Now $h$ is nonlinear: $H_k = (\ell\cos\hat\theta, 0)$. Near $\theta = \pm 90°$ the measurement barely changes with angle, $H_k \to 0$, and the update does almost nothing: the angle becomes nearly unobservable there and the covariance grows until the pendulum swings back.
:::end

:::exercise
Why can an EKF diverge where a linear Kalman filter can't?
:::solution
The EKF's $F_k$ and $H_k$ depend on its own estimate. A bad estimate gives wrong Jacobians, which give a wrong covariance and gain, which can make the estimate worse. The linear KF's gain doesn't depend on the data. Remedies: a sensible initial covariance, slightly inflated $Q$, or the UKF.
:::end

## Quiz

:::quiz
- type: num
  q: Small-angle natural frequency in rad/s of a 0.5 m pendulum?
  answer: 4.429
  tol: 0.001
  unit: rad/s
  py: "math.sqrt(9.81/0.5)"
  explain: √(g/ℓ).
- type: num
  q: F₂₁ of the Euler-step Jacobian at θ = 1.2 rad with T = 0.02 s?
  answer: -0.14216
  tol: 0.01
  py: "-9.81/0.5*0.02*math.cos(1.2)"
  explain: −(g/ℓ)T cos θ.
- type: num
  q: Same entry at θ = 0?
  answer: -0.3924
  tol: 0.001
  py: "-9.81/0.5*0.02"
  explain: cos 0 = 1.
- type: num
  q: Angle noise variance in rad² for a 2° sensor?
  answer: 0.0012185
  tol: 0.01
  unit: rad²
  py: "math.radians(2)**2"
  explain: R = σ².
- type: mc
  q: The EKF propagates the covariance using…
  options:
    - the Jacobian of f at the current estimate
    - the nonlinear function itself
    - sigma points
    - a fixed matrix computed offline
  answer: 0
  explain: First-order linearisation around the estimate.
- type: mc
  q: The small-angle KF fails on big swings because…
  options:
    - its model has the restoring stiffness of θ = 0 everywhere
    - it uses too large a Q
    - the sensor is nonlinear
    - it predicts too often
  answer: 0
  explain: Gravity's stiffness falls as cos θ.
:::end
