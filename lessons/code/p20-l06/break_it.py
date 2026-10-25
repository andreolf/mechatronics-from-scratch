import numpy as np
from scipy.linalg import solve_continuous_are

M, m, r, l, Ib, Iw, g, kt, ke, R = 0.9, 0.12, 0.04, 0.07, 0.004, 9.6e-5, 9.81, 0.25, 0.25, 4.0   # Lesson 02 robot
VMAX, T, SUB = 11.1, 0.002, 10                                     # 500 Hz control, plant at 5 kHz

def plant_f(s, v, gain):
    x, xd, th, thd = s; c, sn = np.cos(th), np.sin(th); tau = gain * 2 * kt * (v - ke * (xd / r - thd)) / R
    a, b, d = M + m + Iw / r**2, M * l * c, Ib + M * l**2; f1 = tau / r + M * l * sn * thd**2; f2 = M * g * l * sn - tau
    det = a * d - b * b; return np.array([xd, (d * f1 - b * f2) / det, thd, (a * f2 - b * f1) / det])

def lin():
    eps = 1e-6; A = np.column_stack([(plant_f(np.eye(4)[i] * eps, 0, 1) - plant_f(-np.eye(4)[i] * eps, 0, 1)) / (2 * eps) for i in range(4)])
    return A, (plant_f(np.zeros(4), eps, 1) - plant_f(np.zeros(4), -eps, 1)) / (2 * eps)

A, B = lin()
K = -(B @ solve_continuous_are(A, B[:, None], np.diag([10, 1, 100, 1]), np.array([[1.0]])))

def run(noise=1.0, delay=0, gain=1.0, gyro_bias=0.0, t_end=6.0, seed=0):
    """closed loop with a complementary filter on gyro + accelerometer. Monitors: tilt beyond 30 deg -> torque off;
    measured motor current against the current the command should produce."""
    rng = np.random.default_rng(seed); s = np.array([0, 0, np.radians(3), 0]); th_est = s[2]; buf = [np.zeros(4)] * (delay + 1)
    effort = 0; trips = []; t = 0; v = 0.0; th_log = []; sxy = sxx = 0.0
    while t < t_end:
        gyro = s[3] + gyro_bias + 0.002 * noise * rng.normal(); acc = s[2] + 0.02 * noise * rng.normal()
        th_est = 0.995 * (th_est + gyro * T) + 0.005 * acc
        meas = np.array([s[0] + 1e-4 * noise * rng.normal(), s[1] + 0.005 * noise * rng.normal(), th_est, gyro])
        buf.append(meas); used = buf.pop(0)                              # 'delay' extra samples of latency
        if "tilt > 30 deg" in trips: v = 0.0
        else: v = float(np.clip(K @ used, -VMAX, VMAX))
        i_cmd = 2 * (v - ke * (s[1] / r - s[3])) / R; i_meas = gain * i_cmd + 0.02 * rng.normal()
        sxy = 0.995 * sxy + i_meas * i_cmd; sxx = 0.995 * sxx + i_cmd * i_cmd     # running least-squares torque gain
        if sxx > 0.05 and sxy / sxx < 0.8 and "current mismatch" not in trips: trips.append("current mismatch")
        for _ in range(SUB):
            k1 = plant_f(s, v, gain); k2 = plant_f(s + T / SUB / 2 * k1, v, gain); k3 = plant_f(s + T / SUB / 2 * k2, v, gain); k4 = plant_f(s + T / SUB * k3, v, gain)
            s = s + T / SUB / 6 * (k1 + 2 * k2 + 2 * k3 + k4)
        effort += v * v * T; t += T; th_log.append(s[2])
        if abs(s[2]) > np.radians(30) and "tilt > 30 deg" not in trips: trips.append("tilt > 30 deg")
        if abs(s[2]) > np.radians(80): break
    th_log = np.array(th_log); upright = abs(s[2]) < np.radians(5)
    return dict(upright=upright, effort=effort, trips=trips, tilt_end=np.degrees(np.mean(th_log[-500:])), x=s[0])

def test_faults():
    base = run(); print(f"nominal: upright {base['upright']}, effort {base['effort']:.3f} V^2 s, trips {base['trips']}")
    assert base["upright"] and not base["trips"]
    # 1. ten times the sensor noise: explained, effort grows but balance holds
    n = run(noise=10); print(f"noise x10: upright {n['upright']}, effort {n['effort']:.3f} V^2 s ({n['effort'] / base['effort']:.1f}x)")
    assert n["upright"] and n["effort"] > 2 * base["effort"]
    # 2. delay: explained by the delay margin of Lesson 05 (about 80 ms in continuous time)
    res = {d: run(delay=d)["upright"] for d in (5, 10, 20, 30, 40)}
    print("extra delay: " + ", ".join(f"{2 * d} ms {'ok' if ok else 'falls'}" for d, ok in res.items()))
    first_fail = min([d for d, ok in res.items() if not ok], default=None)
    assert res[5] and first_fail is not None and 2 * first_fail <= 80
    # 3. one motor weak: 60 % torque, inside LQR's guaranteed gain margin of 1/2; the current monitor flags it
    w = run(gain=0.6); print(f"60 % torque: upright {w['upright']}, trips {w['trips']}")
    assert w["upright"] and "current mismatch" in w["trips"]
    # 4. motors lost: the robot falls, the tilt monitor cuts torque
    d = run(gain=0.0); print(f"motor loss: upright {d['upright']}, trips {d['trips']}")
    assert not d["upright"] and "tilt > 30 deg" in d["trips"]
    # 5. gyro bias: explained. The filter's tilt estimate is off by bias * alpha T / (1 - alpha); at equilibrium the true
    #    tilt and rates are zero, so K . (x, 0, offset, bias) = 0 sets where the robot parks: x = -(K2 offset + K3 bias) / K0
    b = run(gyro_bias=0.05, t_end=10); off = 0.05 * 0.995 * T / 0.005; x_pred = -(K[2] * off + K[3] * 0.05) / K[0]
    print(f"gyro bias 0.05 rad/s: upright {b['upright']}, true tilt {b['tilt_end']:.2f} deg, tilt estimate off by {np.degrees(off):.2f} deg, "
          f"robot parks at {100 * b['x']:.1f} cm (predicted {100 * x_pred:.1f} cm)")
    assert b["upright"] and abs(b["x"] - x_pred) < 0.1 * abs(x_pred)

test_faults()
print("PASS")
