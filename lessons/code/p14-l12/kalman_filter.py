import numpy as np
from scipy.stats import chi2

class KalmanFilter:
    """linear Kalman filter: x_{k+1} = F x_k + w (cov Q), z_k = H x_k + v (cov R)"""
    def __init__(self, F, H, Q, R, x0, P0):
        self.F, self.H, self.Q, self.R = F, H, Q, R
        self.x, self.P = x0.astype(float).copy(), P0.astype(float).copy()

    def predict(self):
        self.x = self.F @ self.x
        self.P = self.F @ self.P @ self.F.T + self.Q

    def gain(self):
        S = self.H @ self.P @ self.H.T + self.R
        return self.P @ self.H.T @ np.linalg.inv(S), S

    def update(self, z, K=None):
        Kopt, S = self.gain(); K = Kopt if K is None else K
        y = z - self.H @ self.x                                     # innovation
        self.x = self.x + K @ y
        I_KH = np.eye(len(self.x)) - K @ self.H
        self.P = I_KH @ self.P @ I_KH.T + K @ self.R @ K.T         # Joseph form: valid for any K, stays symmetric
        return y, S

dt = 0.1
F = np.array([[1, dt], [0, 1]]); H = np.array([[1.0, 0.0]])
q = 0.5; Q = q * np.array([[dt**3 / 3, dt**2 / 2], [dt**2 / 2, dt]])    # white-noise acceleration of intensity q
R = np.array([[0.25]])

def test_gain_minimises_trace():
    kf = KalmanFilter(F, H, Q, R, np.zeros(2), np.diag([4.0, 1.0])); kf.predict()
    K, _ = kf.gain()
    def trace_after(Kt):
        I_KH = np.eye(2) - Kt @ H
        return np.trace(I_KH @ kf.P @ I_KH.T + Kt @ R @ Kt.T)
    best = trace_after(K); rng = np.random.default_rng(0)
    assert all(trace_after(K + 0.05 * rng.normal(size=K.shape)) > best for _ in range(500))
    # and the derivative of the trace vanishes at K: -2 (I - K H) P H' + 2 K R = 0
    grad = -2 * (np.eye(2) - K @ H) @ kf.P @ H.T + 2 * K @ R
    print(f"optimal gain {np.round(K.ravel(), 4)}, trace {best:.4f}; gradient at K {np.abs(grad).max():.1e}")
    assert np.abs(grad).max() < 1e-12

def test_nees_consistent():
    runs, steps = 200, 100; rng = np.random.default_rng(1)
    nees = np.zeros(steps); Lq = np.linalg.cholesky(Q)
    for _ in range(runs):
        x = np.array([0.0, 1.0]); P0 = np.diag([1.0, 1.0])
        kf = KalmanFilter(F, H, Q, R, x + np.linalg.cholesky(P0) @ rng.normal(size=2), P0)
        for k in range(steps):
            x = F @ x + Lq @ rng.normal(size=2)
            kf.predict(); kf.update(H @ x + np.sqrt(R[0, 0]) * rng.normal(size=1))
            e = x - kf.x; nees[k] += e @ np.linalg.solve(kf.P, e)
    avg = nees / runs
    lo, hi = chi2.ppf([0.025, 0.975], 2 * runs) / runs               # 95 % bounds on the average NEES
    inside = np.mean((avg > lo) & (avg < hi))
    print(f"average NEES over {runs} runs: mean {avg.mean():.3f} (ideal 2), {inside:.0%} of steps inside [{lo:.2f}, {hi:.2f}]")
    assert abs(avg.mean() - 2) < 0.1 and inside > 0.85

def test_inconsistent_filter_fails_nees():
    # a filter that believes the noise is 10x smaller than it is becomes overconfident
    runs, steps = 100, 100; rng = np.random.default_rng(2); total = 0.0; Lq = np.linalg.cholesky(Q)
    for _ in range(runs):
        x = np.array([0.0, 1.0]); kf = KalmanFilter(F, H, Q / 10, R / 10, x.copy(), np.eye(2))
        for k in range(steps):
            x = F @ x + Lq @ rng.normal(size=2)
            kf.predict(); kf.update(H @ x + np.sqrt(R[0, 0]) * rng.normal(size=1))
            e = x - kf.x; total += e @ np.linalg.solve(kf.P, e)
    print(f"overconfident filter: average NEES {total / (runs * steps):.1f} (should be 2)")
    assert total / (runs * steps) > 5

test_gain_minimises_trace()
test_nees_consistent()
test_inconsistent_filter_fails_nees()
print("PASS")
