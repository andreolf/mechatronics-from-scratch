import numpy as np

def sigma_points(m, P, alpha=1.0, beta=0.0, kappa=None):
    """unscented transform (Julier: alpha = 1, beta = 0, kappa = 3 - n): 2n+1 points and weights"""
    n = len(m); kappa = 3.0 - n if kappa is None else kappa
    lam = alpha**2 * (n + kappa) - n
    S = np.linalg.cholesky((n + lam) * P)
    X = np.vstack([m, m + S.T, m - S.T])
    Wm = np.full(2 * n + 1, 1 / (2 * (n + lam))); Wc = Wm.copy()
    Wm[0] = lam / (n + lam); Wc[0] = Wm[0] + 1 - alpha**2 + beta
    return X, Wm, Wc

def unscented_transform(fun, m, P, noise=None):
    X, Wm, Wc = sigma_points(m, P)
    Y = np.array([fun(x) for x in X]); my = Wm @ Y
    D = Y - my; Py = (Wc[:, None] * D).T @ D
    Pxy = (Wc[:, None] * (X - m)).T @ D
    return my, Py + (0 if noise is None else noise), Pxy

def linearised_transform(fun, m, P, noise=None):
    J = np.column_stack([(fun(m + e * 1e-6) - fun(m - e * 1e-6)) / 2e-6 for e in np.eye(len(m))])
    return fun(m), J @ P @ J.T + (0 if noise is None else noise), P @ J.T

polar_to_xy = lambda p: np.array([p[0] * np.cos(p[1]), p[0] * np.sin(p[1])])
xy_to_polar = lambda x: np.array([np.hypot(x[0], x[1]), np.arctan2(x[1], x[0])])

def test_transform_of_a_banana():
    # range 10 m +/- 0.2, bearing 90 deg +/- 30 deg: the true distribution in x, y is a curved banana
    m, P = np.array([10.0, np.pi / 2]), np.diag([0.2**2, np.radians(30)**2])
    rng = np.random.default_rng(0); S = rng.multivariate_normal(m, P, 400000)
    Y = np.column_stack([S[:, 0] * np.cos(S[:, 1]), S[:, 0] * np.sin(S[:, 1])])
    mt, Pt = Y.mean(axis=0), np.cov(Y.T)
    mu, Pu, _ = unscented_transform(polar_to_xy, m, P); ml, Pl, _ = linearised_transform(polar_to_xy, m, P)
    print(f"true mean y {mt[1]:.3f} m (shrinks by exp(-s^2/2) = {10 * np.exp(-np.radians(30)**2 / 2):.3f}); UT {mu[1]:.3f}; linearised {ml[1]:.3f}")
    print(f"true var x {Pt[0, 0]:.2f}, y {Pt[1, 1]:.3f}; UT {Pu[0, 0]:.2f}, {Pu[1, 1]:.3f}; linearised {Pl[0, 0]:.2f}, {Pl[1, 1]:.3f}")
    assert abs(mu[1] - mt[1]) < 0.1 * abs(ml[1] - mt[1])            # UT gets the mean shift that linearisation misses
    assert abs(Pu[1, 1] - Pt[1, 1]) < 0.2 * abs(Pl[1, 1] - Pt[1, 1])

def filters_on_range_bearing(runs=300, seed=1):
    """a static target near (0, 10) with a prior that is broad sideways; one range-bearing fix"""
    rng = np.random.default_rng(seed); R = np.diag([0.05**2, np.radians(1)**2])
    m0, P0 = np.array([0.0, 10.0]), np.diag([6.0**2, 0.5**2])
    res = {"EKF": [], "UKF": []}; nees = {"EKF": [], "UKF": []}
    for _ in range(runs):
        x = rng.multivariate_normal(m0, P0)
        z = xy_to_polar(x) + rng.multivariate_normal(np.zeros(2), R)
        for name, T in (("EKF", linearised_transform), ("UKF", unscented_transform)):
            zh, S, Pxz = T(xy_to_polar, m0, P0, R)
            K = Pxz @ np.linalg.inv(S); xh = m0 + K @ (z - zh); P = P0 - K @ S @ K.T
            e = x - xh; res[name].append(e @ e); nees[name].append(e @ np.linalg.solve(P, e))
    return {k: np.sqrt(np.mean(v)) for k, v in res.items()}, {k: np.mean(v) for k, v in nees.items()}

def test_ukf_beats_ekf():
    rms, nees = filters_on_range_bearing()
    print(f"after one range-bearing fix: RMS error EKF {rms['EKF']:.2f} m, UKF {rms['UKF']:.2f} m; average NEES EKF {nees['EKF']:.1f}, UKF {nees['UKF']:.1f} (ideal 2)")
    assert rms["UKF"] < 0.7 * rms["EKF"] and abs(nees["UKF"] - 2) < abs(nees["EKF"] - 2)

def test_linear_case_identical():
    A = np.array([[1.0, 2.0], [0.5, -1.0]]); m = np.array([1.0, 2.0]); P = np.array([[2.0, 0.3], [0.3, 1.0]])
    mu, Pu, _ = unscented_transform(lambda x: A @ x, m, P)
    assert np.allclose(mu, A @ m) and np.allclose(Pu, A @ P @ A.T)    # exact for linear maps

test_transform_of_a_banana()
test_ukf_beats_ekf()
test_linear_case_identical()
print("PASS")
