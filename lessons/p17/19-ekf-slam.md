---
id: p17-l19
minutes: 50
summary: SLAM builds the map and localises in it at the same time. You extend the EKF state with landmark positions, initialise each landmark from its first sighting, and watch the correlations that make a loop closure shrink the uncertainty of the robot and of the whole map, checking consistency with NEES over 40 illustrative runs.
---

## One state for robot and map

Simultaneous localisation and mapping (**SLAM**) drops lesson 16's known map. EKF-SLAM puts everything in one state,

$$x = (x_r, y_r, \theta_r, m_{1x}, m_{1y}, \ldots, m_{Nx}, m_{Ny}),$$

with one $(3 + 2N) \times (3 + 2N)$ covariance. Prediction moves only the robot, so only the robot's rows and columns of $P$ change. Each range-bearing update has a Jacobian with two blocks, $\partial h/\partial x_r$ (as in lesson 16) and $\partial h/\partial m_j$, and its gain changes **every** entry of the state.

## Adding landmarks

When a landmark is seen for the first time, invert the measurement, $m = p_r + r\,(\cos(\theta_r + \beta), \sin(\theta_r + \beta))$, and append it with covariance

$$P_{mm} = G_x P_{rr} G_x^\top + G_z R\, G_z^\top, \qquad P_{m\cdot} = G_x P_{r\cdot},$$

where $G_x$ and $G_z$ are the Jacobians of that inversion. The cross term matters: a landmark placed while the robot was uncertain inherits the robot's error, so the two are **correlated**.

## Why loop closure works

Landmarks mapped in sequence share the robot's drift, so their errors are strongly correlated: the map is rigid in relative terms but uncertain as a whole. When the robot returns and re-observes an early landmark (mapped while it was still well localised), the update corrects the robot and, through the correlations, pulls every landmark along the loop into place. The cost is the dense covariance: $O(N^2)$ memory and time per update, which limits EKF-SLAM to a few hundred landmarks, and the linearisation makes long runs overconfident.

:::figure widget=ekfslam caption="EKF-SLAM around an illustrative loop of eight landmarks. Move along the run and watch the landmark ellipses grow as the robot drifts, then shrink together when it re-observes the first landmark."
:::end

## Worked example

Eight illustrative landmarks around a 5 m radius loop; odometry noise 1 cm and 0.2° per 7.9 cm step; a forward sensor (±60°, 3.5 m) with 10 cm and 2° noise; 1.25 laps, data association known.

1. After 0.6 laps, 5 landmarks are mapped; the $x$ coordinates of the first two are correlated with coefficient 0.76.
2. Just before it re-sees the first landmark (step 420) the robot's position sigma is 48.9 cm; 20 steps later it is 9.7 cm. The other landmarks' mean sigma drops from 41.4 to 29.4 cm. The first landmark, mapped while the robot was certain, stays at about 7.8 cm.
3. Final landmark errors: median 4.8 cm, largest 19.0 cm, with sigmas around 27 cm (the map as a whole can still rotate slightly about the start).
4. 40 runs: average robot NEES 3.24, with 98 % of steps inside the 95 % band $[2.29, 3.81]$: consistent over this run length.

## Code it from scratch

:::code file=ekf_slam.py
```python
import numpy as np
from scipy.stats import chi2

LANDMARKS = np.array([[0, 6.5], [4.5, 4.5], [6.5, 0], [4.5, -4.5], [0, -6.5], [-4.5, -4.5], [-6.5, 0], [-4.5, 4.5]], float)
Q = np.diag([0.01 ** 2, np.radians(0.2) ** 2])                         # odometry noise per step (travel, turn)
R = np.diag([0.10 ** 2, np.radians(2.0) ** 2])                         # range-bearing noise
FOV, MAX_R = np.radians(60), 3.5                                       # a forward-looking sensor: +-60 deg, 3.5 m

def wrap(a): return (a + np.pi) % (2 * np.pi) - np.pi

def motion(x, u):
    th = x[2] + u[1] / 2
    return np.array([x[0] + u[0] * np.cos(th), x[1] + u[0] * np.sin(th), wrap(x[2] + u[1])])

def observe(x, lm):
    d = lm - x[:2]; return np.array([np.hypot(*d), wrap(np.arctan2(d[1], d[0]) - x[2])])

class EKFSLAM:
    """state = [robot x, y, theta, landmark 1 x, y, landmark 2 x, y, ...]; the covariance couples all of them"""
    def __init__(self, x0, P0):
        self.x = np.array(x0, float); self.P = np.array(P0, float); self.ids = {}

    def predict(self, u):
        x = self.x; th = x[2] + u[1] / 2; n = len(x)
        F = np.eye(n); F[0, 2] = -u[0] * np.sin(th); F[1, 2] = u[0] * np.cos(th)
        G = np.zeros((n, 2)); G[:3] = [[np.cos(th), -u[0] * np.sin(th) / 2], [np.sin(th), u[0] * np.cos(th) / 2], [0, 1]]
        self.x[:3] = motion(x[:3], u); self.P = F @ self.P @ F.T + G @ Q @ G.T   # only the robot rows and columns change

    def add(self, i, z):
        """first sighting: put the landmark where the measurement says, with covariance from both robot and sensor"""
        x = self.x; a = x[2] + z[1]; lm = x[:2] + z[0] * np.array([np.cos(a), np.sin(a)])
        Gx = np.array([[1, 0, -z[0] * np.sin(a)], [0, 1, z[0] * np.cos(a)]]); Gz = np.array([[np.cos(a), -z[0] * np.sin(a)], [np.sin(a), z[0] * np.cos(a)]])
        n = len(x); P = np.zeros((n + 2, n + 2)); P[:n, :n] = self.P
        P[n:, n:] = Gx @ self.P[:3, :3] @ Gx.T + Gz @ R @ Gz.T
        P[n:, :n] = Gx @ self.P[:3, :]; P[:n, n:] = P[n:, :n].T
        self.x = np.r_[x, lm]; self.P = P; self.ids[i] = n

    def update(self, i, z):
        if i not in self.ids: return self.add(i, z)
        j = self.ids[i]; x = self.x; d = x[j:j + 2] - x[:2]; q = d @ d; r = np.sqrt(q)
        H = np.zeros((2, len(x)))
        H[:, :3] = [[-d[0] / r, -d[1] / r, 0], [d[1] / q, -d[0] / q, -1]]; H[:, j:j + 2] = [[d[0] / r, d[1] / r], [-d[1] / q, d[0] / q]]
        S = H @ self.P @ H.T + R; K = self.P @ H.T @ np.linalg.inv(S)
        nu = z - observe(x[:3], x[j:j + 2]); nu[1] = wrap(nu[1])
        self.x = x + K @ nu; self.x[2] = wrap(self.x[2])
        I_KH = np.eye(len(x)) - K @ H; self.P = I_KH @ self.P @ I_KH.T + K @ R @ K.T

def run(seed, laps=1.25, steps_per_lap=400):
    rng = np.random.default_rng(seed); radius = 5.0; ds = 2 * np.pi * radius / steps_per_lap; u = np.array([ds, 2 * np.pi / steps_per_lap])
    x = np.array([radius, 0.0, np.pi / 2]); slam = EKFSLAM(x, np.diag([1e-6] * 3)); log = []
    for k in range(int(laps * steps_per_lap)):
        x = motion(x, u + rng.multivariate_normal(np.zeros(2), Q))
        slam.predict(u)
        seen_first = False
        for i, lm in enumerate(LANDMARKS):
            z = observe(x, lm)
            if z[0] < MAX_R and abs(z[1]) < FOV:
                slam.update(i, z + rng.multivariate_normal(np.zeros(2), R)); seen_first |= slam.ids[i] == 3
        e = x - slam.x[:3]; e[2] = wrap(e[2])
        lm_sig = np.sqrt(np.trace(slam.P[3:5, 3:5])) if len(slam.x) > 3 else np.nan      # the first landmark mapped
        others = [np.sqrt(np.trace(slam.P[j:j + 2, j:j + 2])) for j in range(5, len(slam.x), 2)]
        log.append((k, e @ np.linalg.solve(slam.P[:3, :3], e), np.sqrt(slam.P[0, 0] + slam.P[1, 1]), lm_sig, seen_first,
                    np.mean(others) if others else np.nan))
    return np.array(log), slam

def test_correlations():
    log, slam = run(0, laps=0.6)
    j1, j2 = 3, 5; P = slam.P                                           # the first two landmarks mapped
    rho = P[j1, j2] / np.sqrt(P[j1, j1] * P[j2, j2])
    print(f"after 0.6 laps: {len(slam.ids)} landmarks mapped; correlation between the x coordinates of the first two landmarks mapped: {rho:.2f}")
    assert rho > 0.5

def test_loop_closure():
    log, slam = run(0)
    seen = log[:, 4].astype(bool); k_close = int(np.argmax(seen & (log[:, 0] > 200)))      # the first landmark, seen again
    before = log[k_close - 1]; after = log[min(k_close + 20, len(log) - 1)]
    print(f"robot sigma just before re-seeing the first landmark (step {k_close}) {100 * before[2]:.1f} cm, that landmark's sigma {100 * before[3]:.1f} cm; "
          f"20 steps after the loop closes {100 * after[2]:.1f} cm and {100 * after[3]:.1f} cm")
    print(f"mean sigma of the other landmarks: {100 * before[5]:.1f} cm before, {100 * after[5]:.1f} cm after")
    assert after[2] < 0.6 * before[2] and after[5] < 0.8 * before[5]
    err = np.linalg.norm(slam.x[3:].reshape(-1, 2) - LANDMARKS[sorted(slam.ids, key=slam.ids.get)], axis=1)
    sig = [np.sqrt(np.trace(slam.P[j:j + 2, j:j + 2])) for j in sorted(slam.ids.values())]
    print(f"final landmark errors: median {100 * np.median(err):.1f} cm, largest {100 * err.max():.1f} cm; their sigmas median {100 * np.median(sig):.1f} cm")

def test_consistent():
    runs = 40; nees = np.array([run(s)[0][:, 1] for s in range(runs)]); avg = nees.mean(0)
    lo, hi = chi2.ppf([0.025, 0.975], 3 * runs) / runs; inside = ((avg > lo) & (avg < hi)).mean()
    print(f"{runs} runs of 1.25 laps: average robot NEES {avg.mean():.2f} (3 expected), {100 * inside:.0f} % of steps inside [{lo:.2f}, {hi:.2f}]")
    assert 2.4 < avg.mean() < 3.8 and inside > 0.8

test_correlations()
test_loop_closure()
test_consistent()
print("PASS")
```
:::end

## In practice

FilterPy provides the EKF machinery but not the SLAM bookkeeping; EKF-SLAM is now mostly a teaching tool. Practical systems use graph-based SLAM (lesson 20): slam_toolbox in ROS 2 for 2D lidar, ORB-SLAM3 and VINS for cameras. Data association, deciding which landmark a measurement came from, is the hard part in practice; a wrong association can wreck an EKF-SLAM map irrecoverably.

## Exercises

:::exercise
How large is the covariance matrix for 500 landmarks, and why is that a problem?
:::solution
$(3 + 1000)^2 \approx 10^6$ entries, all updated at every measurement: about a million multiply-adds per update, and much more for the gain products. Graph-based methods exploit sparsity instead.
:::end

:::exercise
Why does the first landmark's uncertainty barely change at the loop closure?
:::solution
It was mapped at the start, when the robot was well localised, so its own uncertainty was already close to the sensor noise. The loop closure transfers that certainty to the robot and the later landmarks.
:::end

## Quiz

:::quiz
- type: num
  q: State dimension of EKF-SLAM with a 2D robot and 20 landmarks?
  answer: 43
  tol: 0.001
  py: "3+2*20"
  explain: 3 robot plus 2 per landmark.
- type: num
  q: Entries in its covariance matrix?
  answer: 1849
  tol: 0.001
  py: "43**2"
  explain: 43 squared.
- type: num
  q: Non-zero columns in a single range-bearing Jacobian row in EKF-SLAM?
  answer: 5
  tol: 0.001
  py: "3+2"
  explain: The robot's 3 and the landmark's 2.
- type: num
  q: Landmark x from a robot at (1, 2, 0) measuring range 3 at bearing 0?
  answer: 4
  tol: 0.001
  unit: m
  py: "1+3"
  explain: x + r cos(theta + beta).
- type: mc
  q: Loop closure reduces the uncertainty of landmarks not currently observed because…
  options:
    - their errors are correlated with the robot's
    - the filter re-measures them all
    - their covariance is reset
    - landmarks never move
  answer: 0
  explain: The gain spreads the correction through the correlations.
- type: mc
  q: The main scaling problem of EKF-SLAM is…
  options:
    - the dense covariance grows quadratically with the number of landmarks
    - it needs a GPU
    - it cannot use range-bearing sensors
    - it requires known landmark positions
  answer: 0
  explain: Every update touches every pair of landmarks.
:::end
