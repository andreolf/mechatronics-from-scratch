import numpy as np

g, T, DUR = 9.81, 1 / 250, 60.0              # 250 Hz IMU, one minute of flight
BIAS = np.array([0.02, -0.015, 0.01])        # gyro bias (rad/s), illustrative for a MEMS gyro after a warm-up
GN, AN = 0.005, 0.3                          # gyro noise (rad/s), accelerometer noise and vibration (m/s^2)

def euler_rates(phi, th, w):
    p, q, r = w
    return np.array([p + (q * np.sin(phi) + r * np.cos(phi)) * np.tan(th), q * np.cos(phi) - r * np.sin(phi)])

def accel_model(phi, th):                    # specific force in the body frame (z down) when not accelerating
    return g * np.array([np.sin(th), -np.cos(th) * np.sin(phi), -np.cos(th) * np.cos(phi)])

def accel_tilt(a):                           # tilt from the accelerometer alone
    return np.array([np.arctan2(-a[1], -a[2]), np.arctan2(a[0], np.hypot(a[1], a[2]))])

def flight(seed=0):
    """manoeuvring flight: roll +-20 deg, pitch +-15 deg, steady yaw; IMU with bias, noise and linear acceleration"""
    rng = np.random.default_rng(seed); t = np.arange(0, DUR, T); acc_dist = np.zeros(3); out = []
    for tk in t:
        phi, th = np.radians(20) * np.sin(2 * np.pi * 0.5 * tk), np.radians(15) * np.sin(2 * np.pi * 0.3 * tk + 1)
        dphi, dth, dpsi = np.radians(20) * np.pi * np.cos(np.pi * tk), np.radians(15) * 0.6 * np.pi * np.cos(0.6 * np.pi * tk + 1), 0.05
        w = np.array([dphi - dpsi * np.sin(th), dth * np.cos(phi) + dpsi * np.cos(th) * np.sin(phi),
                      -dth * np.sin(phi) + dpsi * np.cos(th) * np.cos(phi)])
        acc_dist += T / 0.5 * (rng.normal(0, 0.3, 3) * np.sqrt(2 * 0.5 / T) - acc_dist)   # 0.3 m/s^2 manoeuvre acceleration, 0.5 s
        out.append((np.array([phi, th]), w + BIAS + rng.normal(0, GN, 3), accel_model(phi, th) + acc_dist + rng.normal(0, AN, 3)))
    return out

def gyro_only(data):
    x = data[0][0].copy(); est = []
    for _, w, _ in data: x = x + T * euler_rates(*x, w); est.append(x.copy())
    return est

def accel_only(data): return [accel_tilt(a) for _, _, a in data]

def complementary(data, alpha=0.99):
    x = accel_tilt(data[0][2]); est = []
    for _, w, a in data:
        x = alpha * (x + T * euler_rates(*x, w)) + (1 - alpha) * accel_tilt(a); est.append(x.copy())
    return est

def ekf(data, q_ang=1e-7, q_b=1e-9, r_acc=0.5**2):
    """state (roll, pitch, bias p, bias q, bias r); predict with the gyro, correct with the accelerometer"""
    x = np.r_[accel_tilt(data[0][2]), 0, 0, 0]; P = np.diag([0.01, 0.01, 1e-3, 1e-3, 1e-3]); est = []
    Q = np.diag([q_ang] * 2 + [q_b] * 3); R = np.eye(3) * r_acc
    for _, w, a in data:
        f = lambda s: np.r_[s[:2] + T * euler_rates(s[0], s[1], w - s[2:]), s[2:]]
        F = np.zeros((5, 5)); e = 1e-6
        for j in range(5): d = np.zeros(5); d[j] = e; F[:, j] = (f(x + d) - f(x - d)) / (2 * e)
        x = f(x); P = F @ P @ F.T + Q
        H = np.zeros((3, 5))
        for j in range(2): d = np.zeros(2); d[j] = e; H[:, j] = (accel_model(*(x[:2] + d)) - accel_model(*(x[:2] - d))) / (2 * e)
        S = H @ P @ H.T + R; Kg = P @ H.T @ np.linalg.inv(S)
        x = x + Kg @ (a - accel_model(*x[:2])); P = (np.eye(5) - Kg @ H) @ P; est.append(x.copy())
    return est

def errors(data, est):
    e = np.degrees(np.array([np.abs(x[:2] - tr) for (tr, _, _), x in zip(data, est)]))
    late = e[len(e) // 6:]                    # after the first 10 s settling
    return np.sqrt((late**2).mean()), np.percentile(late, 95), late.max()

def test_filters():
    data = flight(); res = {}
    for name, est in [("gyro only", gyro_only(data)), ("accel only", accel_only(data)),
                      ("complementary 0.99", complementary(data)), ("EKF with bias", ekf(data))]:
        res[name] = errors(data, est); print(f"{name}: RMS error {res[name][0]:.2f} deg, 95 % below {res[name][1]:.2f} deg, max {res[name][2]:.2f} deg")
    b = ekf(data)[-1][2:]; print("EKF bias estimate (rad/s):", np.round(b, 4), "true", BIAS)
    assert res["gyro only"][0] > 10 and res["accel only"][0] > 2          # neither sensor alone meets the spec
    for k in ("complementary 0.99", "EKF with bias"): assert res[k][0] < 2                     # spec: RMS error below 2 deg
    assert res["EKF with bias"][0] < res["complementary 0.99"][0] and res["EKF with bias"][1] < 2.5
    assert np.allclose(b[:2], BIAS[:2], atol=0.005)
    print(f"largest gyro bias {np.degrees(np.abs(BIAS).max()):.2f} deg/s: integrated alone, it is tens of degrees within a minute")

test_filters(); print("PASS")
