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
