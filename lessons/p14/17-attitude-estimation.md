---
id: p14-l17
minutes: 45
summary: A drone knows its tilt by fusing a gyro, which is smooth but drifts, with an accelerometer, which knows where gravity is but is noisy. You derive a Mahony-style quaternion complementary filter and an extended Kalman filter on roll, pitch and gyro biases, run both on simulated IMU data, and test that both track to under a degree, that the Kalman filter learns the gyro bias, and that switching the correction off lets the attitude drift.
---

## Two imperfect sensors

- The **gyro** measures body rates $\omega$. Integrating gives attitude with little noise, but a bias $b$ of a few hundredths of a rad/s integrates into a drift of degrees per minute.
- The **accelerometer** measures specific force. In steady flight that's gravity in the body frame, which gives roll and pitch directly: $\phi = \operatorname{atan2}(a_y, a_z)$, $\theta = \operatorname{atan2}(-a_x, \sqrt{a_y^2 + a_z^2})$. But vibration and manoeuvres make it noisy and biased in the short term. It says nothing about yaw.

Fusion takes the gyro at high frequency and the accelerometer at low frequency.

## Mahony-style complementary filter

Keep the attitude as a unit quaternion $q$, integrate $\dot q = \tfrac12 q \otimes (0, \omega_c)$, with a corrected rate

$$\omega_c = \omega + K_pe + K_i\int e\,dt, \qquad e = \hat a \times \hat v,$$

where $\hat a$ is the measured gravity direction and $\hat v$ the direction the current estimate predicts. The cross product is the small rotation that would align them. $K_p$ sets the crossover between trusting the gyro and the accelerometer (here $K_p = 1$ rad/s, so about 0.16 Hz); the integral term learns the gyro bias. A few lines of code and no matrices: it runs on the smallest flight controllers.

## Kalman version

An EKF with state $(\phi, \theta, b_x, b_y, b_z)$: predict with the gyro through the Euler-angle kinematics

$$\dot\phi = p + (q\sin\phi + r\cos\phi)\tan\theta, \qquad \dot\theta = q\cos\phi - r\sin\phi$$

(rates corrected by the bias states), update with roll and pitch from the accelerometer. It weighs the two sensors by their noise and adapts the gain as the covariance settles. A full **quaternion EKF** uses the same predict/update structure with the quaternion as state (an error-state formulation keeps it normalised) and is the usual choice when yaw and large angles matter; the Euler form here is fine away from $\theta = \pm 90°$. Note that $b_z$ is barely observable from gravity alone, which is why yaw needs a magnetometer or GPS.

## Real-world anchor: Switzerland

Drones flying in Swiss Alpine valleys, for mapping, inspection or filming, meet gusty winds that rock them continuously. Our simulated drone rocks in roll and pitch by up to about 15°, with illustrative MEMS-grade sensors: 0.01 rad/s gyro noise, biases of 0.01–0.03 rad/s, and 0.5 m/s² accelerometer vibration noise at 200 Hz. The [quadrotor lab](#lab-quad) lets you switch its IMU filter off and watch the attitude drift.

:::figure widget=attitude caption="Roll estimated by gyro integration alone, by the accelerometer alone, and by the complementary filter, on a drone rocking in gusts. Switch the filter off to see the gyro bias drift; raise the gain to see accelerometer noise leak in."
:::end

## Worked example

1. Gyro bias 0.03 rad/s, uncorrected, about a fixed axis: $0.03 \times 60 = 1.8$ rad (103°) of error per minute. Our drone also yaws slowly (0.1 rad/s), which keeps turning the body-axis bias relative to gravity, so the roll/pitch error swings instead of growing without bound, on the order of $b/\dot\psi = 0.3$ rad: 20° after 120 s in the simulation.
2. Accelerometer alone: 2.9° RMS roll/pitch error from vibration.
3. Mahony ($K_p = 1$, $K_i = 0.1$): 0.17° RMS. EKF: 0.30° RMS, with bias estimates $(0.0305, -0.0201)$ rad/s against the true $(0.03, -0.02)$.

## Code it from scratch

:::code file=attitude_filters.py
```python
import numpy as np

g = 9.81; dt = 0.005                                   # 200 Hz IMU
BIAS = np.array([0.03, -0.02, 0.01])                   # gyro bias, rad/s (illustrative MEMS values)

def truth(t):
    """roll and pitch of a drone rocking in gusts, slow yaw: ZYX Euler angles"""
    phi = 0.20 * np.sin(0.7 * t) + 0.08 * np.sin(2.3 * t + 0.4)
    th = 0.15 * np.sin(0.5 * t + 1.0) + 0.05 * np.sin(1.9 * t)
    psi = 0.1 * t
    return np.array([phi, th, psi])

def body_rates(e, ed):
    phi, th, _ = e; dphi, dth, dpsi = ed
    return np.array([dphi - dpsi * np.sin(th),
                     dth * np.cos(phi) + dpsi * np.cos(th) * np.sin(phi),
                     -dth * np.sin(phi) + dpsi * np.cos(th) * np.cos(phi)])

def gravity_body(phi, th):
    return g * np.array([-np.sin(th), np.cos(th) * np.sin(phi), np.cos(th) * np.cos(phi)])

def make_imu(T=120.0, seed=0):
    rng = np.random.default_rng(seed); ts = np.arange(0, T, dt)
    E = np.array([truth(t) for t in ts]); Ed = np.gradient(E, dt, axis=0)
    gyro = np.array([body_rates(e, ed) for e, ed in zip(E, Ed)]) + BIAS + 0.01 * rng.normal(size=(len(ts), 3))
    acc = np.array([gravity_body(e[0], e[1]) for e in E]) + 0.5 * rng.normal(size=(len(ts), 3))   # vibration noise
    return ts, E, gyro, acc

def qmul(a, b):
    w1, x1, y1, z1 = a; w2, x2, y2, z2 = b
    return np.array([w1*w2 - x1*x2 - y1*y2 - z1*z2, w1*x2 + x1*w2 + y1*z2 - z1*y2,
                     w1*y2 - x1*z2 + y1*w2 + z1*x2, w1*z2 + x1*y2 - y1*x2 + z1*w2])

def q_to_roll_pitch(q):
    w, x, y, z = q
    return np.array([np.arctan2(2 * (w * x + y * z), 1 - 2 * (x * x + y * y)), np.arcsin(np.clip(2 * (w * y - z * x), -1, 1))])

def mahony(gyro, acc, kp=1.0, ki=0.1, use_acc=True):
    """quaternion complementary filter: gyro integration corrected towards the measured gravity direction"""
    q = np.array([1.0, 0, 0, 0]); integ = np.zeros(3); out = []
    for w, a in zip(gyro, acc):
        if use_acc:
            qw, qx, qy, qz = q
            v = np.array([2 * (qx * qz - qw * qy), 2 * (qw * qx + qy * qz), qw * qw - qx * qx - qy * qy + qz * qz])  # estimated "up" in body
            e = np.cross(a / np.linalg.norm(a), v)
            integ += ki * e * dt; w = w + kp * e + integ
        q = q + 0.5 * qmul(q, np.array([0.0, *w])) * dt; q /= np.linalg.norm(q)
        out.append(q_to_roll_pitch(q))
    return np.array(out)

def euler_dot(phi, th, w):
    p, q, r = w
    return np.array([p + (q * np.sin(phi) + r * np.cos(phi)) * np.tan(th), q * np.cos(phi) - r * np.sin(phi)])

def attitude_ekf(gyro, acc, qa=1e-6, qb=1e-8, r_acc=0.05**2):
    """EKF on [roll, pitch, bias_x, bias_y, bias_z]: predict with the gyro, update with roll and pitch from the accelerometer"""
    x = np.zeros(5); P = np.diag([0.1, 0.1, 1e-3, 1e-3, 1e-3]); Q = np.diag([qa, qa, qb, qb, qb]); out = []
    H = np.hstack([np.eye(2), np.zeros((2, 3))])
    for w, a in zip(gyro, acc):
        fx = lambda s: np.concatenate([s[:2] + dt * euler_dot(s[0], s[1], w - s[2:]), s[2:]])
        Fk = np.column_stack([(fx(x + e * 1e-6) - fx(x - e * 1e-6)) / 2e-6 for e in np.eye(5)])
        x = fx(x); P = Fk @ P @ Fk.T + Q
        z = np.array([np.arctan2(a[1], a[2]), np.arctan2(-a[0], np.hypot(a[1], a[2]))])   # tilt from gravity
        S = H @ P @ H.T + r_acc * np.eye(2); K = P @ H.T @ np.linalg.inv(S)
        x = x + K @ (z - H @ x); P = (np.eye(5) - K @ H) @ P
        out.append(x.copy())
    return np.array(out)

def rms_deg(est, E, start):
    return np.degrees(np.sqrt(np.mean((est[start:, :2] - E[start:, :2]) ** 2)))

def test_both_track_and_gyro_only_drifts():
    ts, E, gyro, acc = make_imu(); s = int(20 / dt)
    m = mahony(gyro, acc); k = attitude_ekf(gyro, acc); d = mahony(gyro, acc, use_acc=False)
    raw = np.column_stack([np.arctan2(acc[:, 1], acc[:, 2]), np.arctan2(-acc[:, 0], np.hypot(acc[:, 1], acc[:, 2]))])
    print(f"roll/pitch RMS error after 20 s: Mahony {rms_deg(m, E, s):.2f} deg, EKF {rms_deg(k, E, s):.2f} deg,"
          f" accelerometer alone {rms_deg(raw, E, s):.2f} deg")
    drift = np.degrees(np.abs(d[-1] - E[-1, :2]).max())
    print(f"filter disabled (gyro integration only): error {drift:.1f} deg after {ts[-1]:.0f} s")
    assert rms_deg(m, E, s) < 1.0 and rms_deg(k, E, s) < 1.0 and drift > 5.0

def test_ekf_learns_gyro_bias():
    ts, E, gyro, acc = make_imu(seed=1); k = attitude_ekf(gyro, acc)
    print(f"EKF bias estimate {np.round(k[-1, 2:4], 4)} rad/s (true {BIAS[:2]})")
    assert np.abs(k[-1, 2:4] - BIAS[:2]).max() < 0.005

test_both_track_and_gyro_only_drifts()
test_ekf_learns_gyro_bias()
print("PASS")
```
:::end

## Exercises

:::exercise
The drone accelerates forward at 2 m/s² for 3 s. What does each filter do?
:::solution
The accelerometer now sees gravity plus the acceleration, so it reports a false pitch of about $\arctan(2/9.81) = 11.5°$. The complementary filter drifts towards it at the rate set by $K_p$; the EKF does the same at its gain. Remedies: lower the accelerometer trust when $\|a\|$ differs from $g$, or use a velocity sensor (GPS) to subtract the known acceleration.
:::end

:::exercise
Why does the Mahony integral term estimate the gyro bias?
:::solution
In steady state the correction must cancel the bias, otherwise the attitude would keep drifting and $e$ would keep growing. A proportional term alone can only cancel it with a constant error $e = b/K_p$; the integral term accumulates until it equals $-b$ and lets $e$ return to zero.
:::end

## Quiz

:::quiz
- type: num
  q: Crossover frequency in Hz of a complementary filter with K_p = 1 rad/s?
  answer: 0.159
  tol: 0.01
  unit: Hz
  py: "1/(2*math.pi)"
  explain: K_p/(2π).
- type: num
  q: False pitch in degrees seen by an accelerometer during a 2 m/s² forward acceleration?
  answer: 11.52
  tol: 0.01
  unit: deg
  py: "math.degrees(math.atan(2/9.81))"
  explain: atan(a/g).
- type: num
  q: Angle drift in degrees after 60 s from an uncorrected 0.03 rad/s gyro bias about a fixed axis?
  answer: 103.1
  tol: 0.01
  unit: deg
  py: "math.degrees(0.03*60)"
  explain: Bias × time.
- type: num
  q: Steady attitude error in rad of a proportional-only correction with K_p = 1 and bias 0.03 rad/s?
  answer: 0.03
  tol: 0.001
  unit: rad
  py: "0.03/1"
  explain: e = b/K_p; the integral term removes it.
- type: mc
  q: Which state is barely observable from gyro plus accelerometer?
  options:
    - yaw and the z gyro bias
    - roll
    - pitch
    - the x gyro bias
  answer: 0
  explain: Gravity doesn't change with yaw.
- type: mc
  q: With the accelerometer correction disabled, the attitude…
  options:
    - drifts with the integrated gyro bias
    - stays exact
    - becomes noisier but unbiased
    - locks to gravity
  answer: 0
  explain: Nothing pulls it back.
:::end
