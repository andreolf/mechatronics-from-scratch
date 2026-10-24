import numpy as np
from scipy.stats import chi2

dt = 0.1
F = np.array([[1, dt], [0, 1]]); H = np.array([[1.0, 0.0]])
Qof = lambda q: q * np.array([[dt**3 / 3, dt**2 / 2], [dt**2 / 2, dt]])

def make_log(q_true=2.0, r_true=0.3**2, n=3000, seed=0):
    """a 'recorded' log: a cart moving with random acceleration, measured by a noisy position sensor"""
    rng = np.random.default_rng(seed); L = np.linalg.cholesky(Qof(q_true)); x = np.zeros(2); z = []
    for _ in range(n):
        x = F @ x + L @ rng.normal(size=2); z.append(H @ x + np.sqrt(r_true) * rng.normal(size=1))
    parked = np.sqrt(r_true) * rng.normal(size=500) + 1.234    # a separate log with the cart standing still
    return np.array(z), parked

def run_filter(z, q, r):
    x = np.array([z[0, 0], 0.0]); P = np.diag([r, 10.0]); R = np.array([[r]]); nis, innov, bounds = [], [], []
    for zk in z[1:]:
        x = F @ x; P = F @ P @ F.T + Qof(q)
        S = H @ P @ H.T + R; y = zk - H @ x; K = P @ H.T / S[0, 0]
        x = x + K @ y; P = (np.eye(2) - K @ H) @ P
        nis.append(float(y @ y / S[0, 0])); innov.append(float(y[0])); bounds.append(2 * np.sqrt(S[0, 0]))
    return np.array(nis), np.array(innov), np.array(bounds)

def nis_band(n, m=1, p=0.95):
    lo, hi = chi2.ppf([(1 - p) / 2, (1 + p) / 2], n * m) / n
    return lo, hi

def tune_q(z, r, qs=np.logspace(-2, 2, 41)):
    """pick the q whose average NIS is closest to its expected value m = 1"""
    scores = [abs(np.mean(run_filter(z, q, r)[0]) - 1.0) for q in qs]
    return qs[int(np.argmin(scores))]

def test_r_from_parked_log():
    _, parked = make_log()
    r_hat = np.var(parked, ddof=1)
    print(f"R from the parked log: sigma = {np.sqrt(r_hat):.4f} m (true 0.3)")
    assert abs(np.sqrt(r_hat) / 0.3 - 1) < 0.08

def test_tuned_filter_passes_nis():
    z, parked = make_log(); r = np.var(parked, ddof=1); q = tune_q(z, r)
    nis, innov, b = run_filter(z, q, r)
    lo, hi = nis_band(len(nis))
    inside = np.mean(np.abs(innov) < b)
    print(f"tuned q = {q:.2f} (true 2.0): average NIS {nis.mean():.3f} in [{lo:.3f}, {hi:.3f}], {inside:.1%} of innovations inside 2 sigma")
    assert lo < nis.mean() < hi and 0.5 < q / 2.0 < 2.0 and 0.93 < inside < 0.97

def test_mistuned_filters_fail_nis():
    z, parked = make_log(); r = np.var(parked, ddof=1); lo, hi = nis_band(len(z) - 1)
    small = run_filter(z, 0.02, r)[0].mean(); big = run_filter(z, 200.0, r)[0].mean()
    print(f"q 100x too small: average NIS {small:.2f} (overconfident); q 100x too large: {big:.3f} (too cautious)")
    assert small > hi and big < lo

def test_innovations_white():
    z, parked = make_log(); r = np.var(parked, ddof=1)
    _, innov, _ = run_filter(z, tune_q(z, r), r); y = innov - innov.mean()
    rho1 = np.sum(y[1:] * y[:-1]) / np.sum(y * y)
    _, innov_bad, _ = run_filter(z, 0.02, r); yb = innov_bad - innov_bad.mean()
    rho_bad = np.sum(yb[1:] * yb[:-1]) / np.sum(yb * yb)
    print(f"lag-1 autocorrelation of innovations: tuned {rho1:+.3f}, q too small {rho_bad:+.3f}")
    assert abs(rho1) < 0.1 and rho_bad > 0.3

test_r_from_parked_log()
test_tuned_filter_passes_nis()
test_mistuned_filters_fail_nis()
test_innovations_white()
print("PASS")
