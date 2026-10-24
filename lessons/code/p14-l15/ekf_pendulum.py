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
