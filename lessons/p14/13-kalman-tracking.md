---
id: p14-l13
minutes: 40
summary: A constant-velocity Kalman filter turns noisy position fixes into a smoother track plus a velocity estimate. You derive the constant-velocity model with white-noise acceleration, track a scooter on a winding road in Bali from simulated GPS-like fixes with 5 m noise, and test that the filtered position error is well below the raw fixes, that the filter's covariance matches its real error, and that the process-noise setting has a sweet spot.
---

## Constant velocity, with surprises

Model the vehicle as moving at constant velocity, with acceleration as white noise of intensity $q$ (m²/s³). Per axis, with state $(p, v)$ and fix interval $T$:

$$F = \begin{bmatrix}1 & T\\ 0 & 1\end{bmatrix}, \qquad Q = q\begin{bmatrix}T^3/3 & T^2/2\\ T^2/2 & T\end{bmatrix}.$$

$Q$ comes from integrating the effect of the random acceleration over one interval: position variance grows as $T^3$, velocity variance as $T$. The two axes are independent, so the 2-D model is two copies side by side; the fixes measure positions only, $H = \begin{bmatrix}I & 0\end{bmatrix}$, $R = \sigma^2I$.

**Choosing $q$.** It encodes how hard the vehicle manoeuvres. Too small and the filter is stiff: it lags behind every bend. Too large and it follows the noise. A rough start: $q \approx a_{rms}^2T$ for typical accelerations $a_{rms}$. Lesson 14 tunes it from data.

## Real-world anchor: a scooter in Bali

Scooters are the everyday transport on Bali's winding roads, and delivery and ride-hailing apps track them from phone GPS. Consumer GPS fixes are typically a few metres off; we simulate 5 m per axis at one fix per second, on an illustrative road at about 30 km/h. The filter also delivers speed and heading, which the raw fixes don't give directly.

:::figure widget=kftrack caption="A scooter on a winding road: the true path, noisy fixes, and the Kalman track with its 2-sigma uncertainty ellipses. Raise the fix noise or change the assumed manoeuvring q and watch the track error change."
:::end

## Worked example

$T = 1$ s, $q = 0.1$ m²/s³, $\sigma = 5$ m.

1. $Q$ per axis: $\begin{bmatrix}0.0333 & 0.05\\ 0.05 & 0.1\end{bmatrix}$.
2. Raw fixes: $5\sqrt2 = 7.07$ m RMS 2-D error. Filtered: about 3.9 m, 55 % of raw, plus speed to 0.8 m/s RMS.
3. With $q = 0.001$ the track lags the bends (11.7 m RMS); with $q = 10$ it follows the noise (5.5 m).

## Code it from scratch

:::code file=kf_tracking.py
```python
import numpy as np

def cv_model(dt, q):
    """2-D constant velocity: x = [px, py, vx, vy], white-noise acceleration of intensity q (m^2/s^3)"""
    F = np.eye(4); F[0, 2] = F[1, 3] = dt
    Q1 = q * np.array([[dt**3 / 3, dt**2 / 2], [dt**2 / 2, dt]])
    Q = np.zeros((4, 4)); Q[np.ix_([0, 2], [0, 2])] = Q1; Q[np.ix_([1, 3], [1, 3])] = Q1
    H = np.array([[1.0, 0, 0, 0], [0, 1.0, 0, 0]])
    return F, Q, H

def road(t):
    """an illustrative winding road: about 30 km/h with bends, positions in metres"""
    s = 8.3 * t
    x = s; y = 60 * np.sin(s / 200) + 10 * np.sin(s / 80)
    return np.array([x, y])

def track(sigma=5.0, q=0.1, dt=1.0, T=300, seed=0):
    rng = np.random.default_rng(seed); F, Q, H = cv_model(dt, q); R = sigma**2 * np.eye(2)
    ts = np.arange(0, T, dt); truth = np.array([road(t) for t in ts])
    z = truth + sigma * rng.normal(size=truth.shape)
    x = np.array([z[0, 0], z[0, 1], 0.0, 0.0]); P = np.diag([sigma**2, sigma**2, 100.0, 100.0])
    est, covs = [], []
    for k in range(len(ts)):
        if k:
            x = F @ x; P = F @ P @ F.T + Q                       # predict
        S = H @ P @ H.T + R; K = P @ H.T @ np.linalg.inv(S)       # update
        x = x + K @ (z[k] - H @ x); I_KH = np.eye(4) - K @ H; P = I_KH @ P @ I_KH.T + K @ R @ K.T
        est.append(x.copy()); covs.append(P.copy())
    return ts, truth, z, np.array(est), np.array(covs)

def rms(e): return np.sqrt(np.mean(np.sum(e**2, axis=1)))

def test_filter_beats_raw_fixes():
    ts, truth, z, est, _ = track()
    raw, kf = rms(z[10:] - truth[10:]), rms(est[10:, :2] - truth[10:])
    true_v = np.gradient(truth, ts, axis=0); verr = rms(est[10:, 2:] - true_v[10:])
    print(f"position error: raw fixes {raw:.2f} m RMS, Kalman filter {kf:.2f} m RMS ({kf / raw:.0%} of raw); speed error {verr:.2f} m/s RMS")
    assert kf < 0.6 * raw and verr < 1.5

def test_covariance_reflects_error():
    ts, truth, z, est, covs = track(seed=1)
    sig_pred = np.sqrt(np.mean([c[0, 0] + c[1, 1] for c in covs[20:]]))
    actual = rms(est[20:, :2] - truth[20:])
    print(f"filter's own 1-sigma position spread {sig_pred:.2f} m vs actual RMS {actual:.2f} m")
    assert 0.6 < actual / sig_pred < 1.6

def test_q_tradeoff():
    res = {}
    for q in (0.001, 0.1, 10.0):
        _, truth, _, est, _ = track(q=q, seed=2); res[q] = rms(est[10:, :2] - truth[10:])
    print("RMS position error vs assumed q:", ", ".join(f"q = {k}: {v:.2f} m" for k, v in res.items()))
    assert res[0.1] < res[0.001] and res[0.1] < res[10.0]       # too stiff lags the bends, too loose follows the noise

test_filter_beats_raw_fixes()
test_covariance_reflects_error()
test_q_tradeoff()
print("PASS")
```
:::end

## Exercises

:::exercise
The phone loses GPS for 10 s in a tunnel. What does the filter do, and what happens to the ellipse?
:::solution
Skip the update and keep predicting: the scooter is dead-reckoned at its last estimated velocity. Position variance grows with each predict, roughly as $P_{vv}t^2 + qt^3/3$, so the ellipse balloons. When fixes return, the first update has a large gain and snaps the track back.
:::end

:::exercise
Why does the velocity estimate come for free?
:::solution
The velocity is observable from positions (lesson 03), and the filter's model links them: the gain's velocity rows turn each position innovation into a velocity correction, effectively an optimally smoothed derivative instead of a noisy difference of fixes.
:::end

## Quiz

:::quiz
- type: num
  q: Position entry of Q for q = 0.1 and T = 1 s?
  answer: 0.03333
  tol: 0.001
  unit: m²
  py: "0.1/3"
  explain: qT³/3.
- type: num
  q: RMS 2-D error in m of raw fixes with 5 m noise per axis?
  answer: 7.071
  tol: 0.001
  unit: m
  py: "5*math.sqrt(2)"
  explain: √(σ² + σ²).
- type: num
  q: Speed in m/s of 30 km/h?
  answer: 8.333
  tol: 0.001
  unit: m/s
  py: "30/3.6"
  explain: Divide by 3.6.
- type: num
  q: Velocity entry of Q for q = 0.1 and T = 1 s?
  answer: 0.1
  tol: 0.001
  unit: m²/s²
  py: "0.1*1"
  explain: qT.
- type: mc
  q: An assumed q far too small makes the track…
  options:
    - lag behind every bend
    - follow the noise
    - diverge immediately
    - exact
  answer: 0
  explain: The filter trusts its straight-line model too much.
- type: mc
  q: During a GPS outage the filter…
  options:
    - keeps predicting and lets the covariance grow
    - stops and freezes the covariance
    - resets to zero
    - uses the last fix as truth
  answer: 0
  explain: Predict-only steps.
:::end
