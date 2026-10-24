import numpy as np

R_WHEEL, TRACK, TICKS = 0.05, 0.30, 2048      # illustrative small robot: wheel radius, wheel separation (m), encoder counts per wheel turn

def body_velocity(wl, wr, r=R_WHEEL, b=TRACK):
    """wheel speeds (rad/s) -> forward speed v (m/s) and turn rate omega (rad/s)"""
    return r * (wr + wl) / 2, r * (wr - wl) / b

def unicycle(s, v, w):
    x, y, th = s; return np.array([v * np.cos(th), v * np.sin(th), w])

def integrate(wheels, T, dt=1e-4):
    """ground truth: RK4 on the unicycle model; wheels(t) -> (wl, wr)"""
    s = np.zeros(3); path = [s.copy()]
    for i in range(int(T / dt)):
        t = i * dt
        def f(s, t): return unicycle(s, *body_velocity(*wheels(t)))
        k1 = f(s, t); k2 = f(s + dt / 2 * k1, t + dt / 2); k3 = f(s + dt / 2 * k2, t + dt / 2); k4 = f(s + dt * k3, t + dt)
        s = s + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4); path.append(s.copy())
    return np.array(path)

def odometry(dl, dr, s, r=R_WHEEL, b=TRACK):
    """dead reckoning from wheel rotations over one sample: an exact arc for constant speeds"""
    ds, dth = r * (dr + dl) / 2, r * (dr - dl) / b
    x, y, th = s
    if abs(dth) < 1e-9:
        return np.array([x + ds * np.cos(th), y + ds * np.sin(th), th])
    Rc = ds / dth
    return np.array([x + Rc * (np.sin(th + dth) - np.sin(th)), y - Rc * (np.cos(th + dth) - np.cos(th)), th + dth])

def run_odometry(wheels, T, rate=100.0, dt=1e-4, b=TRACK):
    """integrate each wheel's angle finely, quantise to encoder ticks, then dead-reckon at `rate` Hz"""
    n_sub = int(round(1 / (rate * dt))); s = np.zeros(3); angle = np.zeros(2); last = np.zeros(2, int)
    for k in range(int(T * rate)):
        for j in range(n_sub):
            angle += np.array(wheels((k * n_sub + j) * dt)) * dt
        ticks = np.floor(angle / (2 * np.pi) * TICKS).astype(int)
        d = (ticks - last) * 2 * np.pi / TICKS; last = ticks
        s = odometry(d[0], d[1], s, b=b)
    return s

def test_arc_radius():
    wl, wr = 8.0, 12.0
    v, w = body_velocity(wl, wr)
    p = integrate(lambda t: (wl, wr), T=2 * np.pi / w)              # one full circle
    R = TRACK / 2 * (wr + wl) / (wr - wl)
    print(f"wheels {wl}, {wr} rad/s: v = {v:.3f} m/s, omega = {w:.4f} rad/s, circle radius {R:.3f} m (measured {np.ptp(p[:, 1]) / 2:.3f})")
    assert abs(np.ptp(p[:, 1]) / 2 - R) < 1e-4 and np.linalg.norm(p[-1, :2]) < 1e-3

def test_nonholonomic():
    p = integrate(lambda t: (6 + 4 * np.sin(t), 6 + 4 * np.cos(1.3 * t)), T=5)
    vel = np.diff(p[:, :2], axis=0) / 1e-4
    lateral = -vel[:, 0] * np.sin(p[:-1, 2]) + vel[:, 1] * np.cos(p[:-1, 2])
    print(f"largest sideways speed along the path: {np.abs(lateral).max():.1e} m/s")
    assert np.abs(lateral).max() < 1e-3                             # it can't slide sideways

def test_odometry_matches_integration():
    wheels = lambda t: (6 + 4 * np.sin(t), 6 + 4 * np.cos(1.3 * t))
    truth = integrate(wheels, T=10)[-1]; est = run_odometry(wheels, T=10)
    err = np.linalg.norm(truth[:2] - est[:2])
    print(f"after 10 s: truth ({truth[0]:.4f}, {truth[1]:.4f}, {np.degrees(truth[2]):.2f} deg), odometry ({est[0]:.4f}, {est[1]:.4f}, {np.degrees(est[2]):.2f} deg), position error {err * 1000:.2f} mm")
    assert err < 5e-3 and abs(truth[2] - est[2]) < np.radians(0.5)

def test_track_error_drifts():
    wheels = lambda t: (6 + 4 * np.sin(t), 6 + 4 * np.cos(1.3 * t))
    truth = integrate(wheels, T=10)[-1]
    est = run_odometry(wheels, T=10, b=TRACK * 1.01)                  # odometry believes a 1 % wider track
    print(f"with a 1 % track-width error: heading off by {np.degrees(abs(truth[2] - est[2])):.2f} deg, position by {np.linalg.norm(truth[:2] - est[:2]) * 1000:.0f} mm")
    assert np.linalg.norm(truth[:2] - est[:2]) > 5e-3

test_arc_radius()
test_nonholonomic()
test_odometry_matches_integration()
test_track_error_drifts()
print("PASS")
