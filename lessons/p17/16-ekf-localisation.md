---
id: p17-l16
minutes: 45
summary: With known landmarks and a decent initial guess, an extended Kalman filter localises a robot with a few matrix products per step. You derive the range-bearing measurement Jacobians, check them numerically, run the EKF along an illustrative 60 m loop, and verify that it is consistent with the NEES test across 50 runs, while odometry alone drifts by metres.
---

## The EKF for localisation

The state is the pose $x = (x, y, \theta)$ with covariance $P$. **Predict** with odometry $u = (\Delta s, \Delta\theta)$ exactly as in lesson 14:

$$\hat x \leftarrow f(\hat x, u), \qquad P \leftarrow F P F^\top + G Q G^\top.$$

**Correct** with each measurement $z$ of a known landmark $m$: range and bearing

$$h(x) = \begin{pmatrix} \sqrt{q} \\ \operatorname{atan2}(m_y - y, m_x - x) - \theta \end{pmatrix}, \qquad q = |m - p|^2,$$

with Jacobian (writing $\delta = m - p$)

$$H = \begin{pmatrix} -\delta_x/\sqrt q & -\delta_y/\sqrt q & 0 \\ \delta_y/q & -\delta_x/q & -1 \end{pmatrix}.$$

Then $S = HPH^\top + R$, $K = PH^\top S^{-1}$, $\hat x \leftarrow \hat x + K\nu$ with the innovation $\nu = z - h(\hat x)$ and its bearing **wrapped** to $(-\pi, \pi]$. The Joseph form $P \leftarrow (I - KH)P(I - KH)^\top + KRK^\top$ keeps $P$ symmetric and positive definite.

## Checking the filter

Two tests catch most EKF bugs:

- **Jacobians**: compare each analytic Jacobian with central finite differences.
- **Consistency**: in simulation, where the truth is known, the normalised estimation error squared $\epsilon = e^\top P^{-1} e$ should follow a $\chi^2$ distribution with 3 degrees of freedom. Averaged over $M$ runs it should lie in the 95 % band $\chi^2_{3M}(0.025, 0.975)/M$. Too large means the filter is overconfident (it will start ignoring good measurements), too small means it is too cautious.

Linearisation fails where $h$ curves sharply. Bearing to a landmark a few centimetres away changes wildly with position, so real sensors (and this simulation) ignore landmarks closer than a minimum range.

:::figure widget=ekfloc caption="EKF localisation of an illustrative robot driving a loop among five landmarks. Step through time and change the sensor noise, and watch the uncertainty ellipse grow between sightings and shrink at each one."
:::end

## Worked example

Five illustrative landmarks; odometry noise 5 cm and 1° per 0.1 m step; range noise 10 cm, bearing 2°; landmarks seen between 0.5 and 6 m; 600 steps (60 m) around a loop of radius 4.8 m.

1. Analytic and numerical Jacobians agree to $2 \times 10^{-10}$.
2. 50 Monte Carlo runs: average NEES 3.12, with 95 % of time steps inside the band $[2.36, 3.72]$, so the filter is consistent.
3. After 60 m, odometry alone is 5.55 m off (its own predicted sigma is 3.14 m). With landmarks the error is 0.7 cm with sigma 5.2 cm, worst 17.1 cm along the way.
4. Before adding the 0.5 m minimum range, runs where the robot passed within a few centimetres of a landmark had NEES spikes in the thousands: a bearing innovation of 2.25 rad from a 5 cm position error.

## Code it from scratch

:::code file=ekf_localisation.py
```python
import numpy as np
from scipy.stats import chi2

LANDMARKS = np.array([[2.0, 1.0], [8.5, 1.0], [5.0, 8.0], [2.0, 7.0], [9.5, 9.5]])   # illustrative known beacons, m
Q_ODO = np.diag([0.05 ** 2, np.radians(1.0) ** 2])                     # per-step noise on travel and turn
R_SENS = np.diag([0.10 ** 2, np.radians(2.0) ** 2])                    # range and bearing noise
MIN_RANGE, MAX_RANGE = 0.5, 6.0                                  # the sensor sees landmarks 0.5 to 6 m away

def wrap(a): return (a + np.pi) % (2 * np.pi) - np.pi

def f(x, u):
    """unicycle motion with odometry u = (ds, dtheta): move along the mid-heading"""
    th = x[2] + u[1] / 2
    return np.array([x[0] + u[0] * np.cos(th), x[1] + u[0] * np.sin(th), wrap(x[2] + u[1])])

def F_jac(x, u):
    th = x[2] + u[1] / 2
    return np.array([[1, 0, -u[0] * np.sin(th)], [0, 1, u[0] * np.cos(th)], [0, 0, 1]])

def G_jac(x, u):
    th = x[2] + u[1] / 2
    return np.array([[np.cos(th), -u[0] * np.sin(th) / 2], [np.sin(th), u[0] * np.cos(th) / 2], [0, 1]])

def h(x, lm):
    """range and bearing from the robot to a landmark"""
    d = lm - x[:2]; return np.array([np.hypot(*d), wrap(np.arctan2(d[1], d[0]) - x[2])])

def H_jac(x, lm):
    d = lm - x[:2]; q = d @ d; r = np.sqrt(q)
    return np.array([[-d[0] / r, -d[1] / r, 0], [d[1] / q, -d[0] / q, -1]])

def ekf_step(x, P, u, zs):
    x_new = f(x, u); F, G = F_jac(x, u), G_jac(x, u)
    P = F @ P @ F.T + G @ Q_ODO @ G.T; x = x_new
    for i, z in zs:                                                     # one update per visible landmark (known identity)
        Hm = H_jac(x, LANDMARKS[i]); S = Hm @ P @ Hm.T + R_SENS; K = P @ Hm.T @ np.linalg.inv(S)
        nu = z - h(x, LANDMARKS[i]); nu[1] = wrap(nu[1])
        x = x + K @ nu; x[2] = wrap(x[2])
        I_KH = np.eye(3) - K @ Hm; P = I_KH @ P @ I_KH.T + K @ R_SENS @ K.T     # Joseph form keeps P symmetric positive
    return x, P

def commands(n=600):
    """drive a loop: 0.1 m per step with a gentle constant turn"""
    return np.tile([0.1, 2 * np.pi / 300], (n, 1))

def simulate(seed, n=600, use_landmarks=True):
    rng = np.random.default_rng(seed); x = np.array([5.0, 1.0, 0.0]); xh = x.copy(); P = np.diag([0.1, 0.1, 0.05]) ** 2
    xh = x + rng.multivariate_normal(np.zeros(3), P); nees, err = [], []
    for u in commands(n):
        x = f(x, u + rng.multivariate_normal(np.zeros(2), Q_ODO))       # the true motion differs from the odometry
        zs = []
        if use_landmarks:
            for i, lm in enumerate(LANDMARKS):
                z = h(x, lm)
                if MIN_RANGE < z[0] < MAX_RANGE: zs.append((i, z + rng.multivariate_normal(np.zeros(2), R_SENS)))
        xh, P = ekf_step(xh, P, u, zs)
        e = x - xh; e[2] = wrap(e[2]); nees.append(e @ np.linalg.solve(P, e)); err.append(np.hypot(*e[:2]))
    return np.array(nees), np.array(err), P

def test_jacobians():
    x = np.array([3.0, 2.0, 0.4]); u = np.array([0.3, 0.1]); lm = LANDMARKS[1]; e = 1e-6
    num = lambda fn, v: np.column_stack([(fn(v + e * np.eye(len(v))[i]) - fn(v - e * np.eye(len(v))[i])) / (2 * e) for i in range(len(v))])
    errs = [np.abs(num(lambda v: f(v, u), x) - F_jac(x, u)).max(), np.abs(num(lambda v: f(x, v), u) - G_jac(x, u)).max(),
            np.abs(num(lambda v: h(v, lm), x) - H_jac(x, lm)).max()]
    print(f"analytic vs numerical Jacobians: F {errs[0]:.1e}, G {errs[1]:.1e}, H {errs[2]:.1e}")
    assert max(errs) < 1e-7

def test_consistent():
    runs = 50; nees = np.array([simulate(s)[0] for s in range(runs)])
    avg = nees.mean(0); lo, hi = chi2.ppf([0.025, 0.975], 3 * runs) / runs
    inside = ((avg > lo) & (avg < hi)).mean()
    print(f"{runs} runs: average NEES {avg.mean():.2f} (3 expected for a 3-dimensional state); "
          f"{100 * inside:.0f} % of time steps inside the 95 % band [{lo:.2f}, {hi:.2f}]")
    assert 2.6 < avg.mean() < 3.4 and inside > 0.85

def test_landmarks_bound_the_error():
    _, e_odo, P_odo = simulate(0, use_landmarks=False); _, e_ekf, P = simulate(0)
    print(f"after 600 steps (60 m): odometry alone {e_odo[-1]:.2f} m off with predicted sigma {np.sqrt(P_odo[0, 0] + P_odo[1, 1]):.2f} m; "
          f"with landmarks {100 * e_ekf[-1]:.1f} cm off, sigma {100 * np.sqrt(P[0, 0] + P[1, 1]):.1f} cm, worst {100 * e_ekf.max():.1f} cm")
    assert e_ekf.max() < 0.3 and np.sqrt(P_odo[0, 0] + P_odo[1, 1]) > 5 * np.sqrt(P[0, 0] + P[1, 1])

test_jacobians()
test_consistent()
test_landmarks_bound_the_error()
print("PASS")
```
:::end

## In practice

FilterPy's `ExtendedKalmanFilter` takes your $f$, $h$ and Jacobians and handles the algebra. `robot_localization` in ROS 2 runs an EKF over odometry, IMU and absolute pose inputs. The EKF needs the landmark's identity (data association) and a starting pose; when either is missing, a particle filter (lesson 15) is the safer choice.

## Exercises

:::exercise
Compute $H$ for a robot at $(0, 0, 0)$ and a landmark at $(3, 4)$.
:::solution
$\delta = (3, 4)$, $q = 25$, $\sqrt q = 5$: $H = \begin{pmatrix} -0.6 & -0.8 & 0 \\ 0.16 & -0.12 & -1 \end{pmatrix}$.
:::end

:::exercise
Your filter's average NEES is 40. Name two likely causes.
:::solution
The filter is overconfident: process or measurement noise set too small, a Jacobian bug, a missing angle wrap on the innovation, or wrong data association. Check the Jacobians numerically first, then the noise settings.
:::end

## Quiz

:::quiz
- type: num
  q: Range from (1, 1) to a landmark at (4, 5)?
  answer: 5
  tol: 0.001
  unit: m
  py: "math.hypot(3,4)"
  explain: The distance.
- type: num
  q: Bearing (degrees) to a landmark at (1, 1) from (0, 0) with heading 0?
  answer: 45
  tol: 0.001
  unit: °
  py: "45"
  explain: atan2(1, 1) - 0.
- type: num
  q: Expected mean NEES for a consistent filter with a 3-dimensional state?
  answer: 3
  tol: 0.001
  py: "3"
  explain: The mean of chi-squared with 3 degrees of freedom.
- type: num
  q: Wrapped value of a bearing innovation of 350°?
  answer: -10
  tol: 0.001
  unit: °
  py: "-10"
  explain: Into (-180, 180].
- type: mc
  q: Average NEES far above its band means the filter is…
  options:
    - overconfident: its covariance is too small
    - too cautious: its covariance is too large
    - perfectly tuned
    - converging faster than expected
  answer: 0
  explain: Errors are larger than the filter believes.
- type: mc
  q: The EKF update needs, for each measurement…
  options:
    - which landmark it came from
    - the full particle set
    - a new map
    - the robot's true pose
  answer: 0
  explain: Data association is assumed known here.
:::end
