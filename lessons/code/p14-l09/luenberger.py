import numpy as np
from scipy.signal import place_poles
from scipy.linalg import solve_continuous_are

M, m, l, g = 0.8, 0.25, 0.45, 9.81

def deriv(s, F):
    """the live lab's cart-pole"""
    x, xd, th, thd = s
    sn, cs, tot = np.sin(th), np.cos(th), M + m
    temp = (F + m * l * thd * thd * sn) / tot
    thdd = (g * sn - cs * temp) / (l * (4 / 3 - m * cs * cs / tot)) - 0.02 * thd
    return np.array([xd, temp - m * l * thdd * cs / tot - 0.3 * xd, thd, thdd])

def linearise():
    A = np.column_stack([(deriv(e * 1e-6, 0) - deriv(-e * 1e-6, 0)) / 2e-6 for e in np.eye(4)])
    B = ((deriv(np.zeros(4), 1e-6) - deriv(np.zeros(4), -1e-6)) / 2e-6)[:, None]
    return A, B

A, B = linearise()
C = np.array([[1.0, 0, 0, 0], [0, 0, 1.0, 0]])            # cart encoder and pole encoder: no velocity sensors
K = np.linalg.solve([[0.05]], B.T @ solve_continuous_are(A, B, np.diag([5.0, 1, 50, 1]), np.array([[0.05]])))[0]

def observer_gain(poles):
    """dual pole placement: eig(A - L C) = eig(A^T - C^T L^T)"""
    return place_poles(A.T, C.T, poles).gain_matrix.T

def run(Lg, th0=np.radians(5), xhat0=np.zeros(4), sigma=0.0, T=4.0, seed=0):
    """plant under LQR on the TRUE state; the observer runs alongside so its error can be judged"""
    h = 1e-3; rng = np.random.default_rng(seed)
    s = np.array([0.0, 0.0, th0, 0.0]); xh = xhat0.copy(); errs, fd, true = [], [], []
    y_prev = C @ s
    for k in range(int(T / h)):
        F = float(np.clip(-K @ s, -30, 30))
        y = C @ s + sigma * rng.normal(size=2)
        xh = xh + h * (A @ xh + B[:, 0] * F + Lg @ (y - C @ xh))    # Luenberger observer, forward Euler at 1 kHz
        fd.append((y - y_prev) / h); y_prev = y                      # naive alternative: differentiate the encoders
        k1 = deriv(s, F); k2 = deriv(s + h / 2 * k1, F); k3 = deriv(s + h / 2 * k2, F); k4 = deriv(s + h * k3, F)
        s = s + h / 6 * (k1 + 2 * k2 + 2 * k3 + k4)
        errs.append(s - xh); true.append(s)
    return np.array(errs), np.array(fd), np.array(true)

POLES = [-20, -22, -24, -26]

def test_error_dynamics_placed():
    Lg = observer_gain(POLES)
    got = np.sort(np.linalg.eigvals(A - Lg @ C).real)
    print("observer gain L^T =\n", np.round(Lg.T, 1))
    assert np.allclose(got, sorted(POLES), atol=1e-6)

def test_estimation_error_converges():
    Lg = observer_gain(POLES)
    e, _, _ = run(Lg, xhat0=np.array([0.1, 0.5, -0.05, 1.0]))        # start the estimate badly wrong
    n0, n1 = np.linalg.norm(e[0]), np.abs(e[-1000:]).max()
    print(f"estimation error: {n0:.3f} at start, below {n1:.1e} over the last second")
    assert n1 < 1e-3 and np.abs(e[500:, 3]).max() < 0.01

def test_better_than_differentiating():
    Lg = observer_gain(POLES); sig = np.array([0.0005, np.radians(0.1)])     # 0.5 mm and 0.1 deg encoder noise
    e, fd, true = run(Lg, sigma=sig, T=4.0, seed=2)
    rms_obs = np.sqrt(np.mean(e[1000:, 3] ** 2))
    rms_fd = np.sqrt(np.mean((fd[1000:, 1] - true[999:-1, 3]) ** 2))      # differentiated angle vs the true rate
    print(f"angle-rate error: observer {rms_obs:.3f} rad/s RMS, differentiated encoder {rms_fd:.2f} rad/s RMS"
          f" (theory sigma*sqrt(2)/h = {sig[1] * np.sqrt(2) / 1e-3:.2f})")
    assert rms_obs < 0.1 * rms_fd

test_error_dynamics_placed()
test_estimation_error_converges()
test_better_than_differentiating()
print("PASS")
