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
