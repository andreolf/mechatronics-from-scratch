import numpy as np

def cv_model(dt, q):
    """2-D constant velocity: x = [px, py, vx, vy], white-noise acceleration of intensity q (m^2/s^3)"""
    F = np.eye(4); F[0, 2] = F[1, 3] = dt
    Q1 = q * np.array([[dt**3 / 3, dt**2 / 2], [dt**2 / 2, dt]])
    Q = np.zeros((4, 4)); Q[np.ix_([0, 2], [0, 2])] = Q1; Q[np.ix_([1, 3], [1, 3])] = Q1
    H = np.array([[1.0, 0, 0, 0], [0, 1.0, 0, 0]])
    return F, Q, H

def road(t):
    """an illustrative winding road: about 30 km/h with bends, positions in metres"""
    s = 8.3 * t
    x = s; y = 60 * np.sin(s / 200) + 10 * np.sin(s / 80)
    return np.array([x, y])

def track(sigma=5.0, q=0.1, dt=1.0, T=300, seed=0):
    rng = np.random.default_rng(seed); F, Q, H = cv_model(dt, q); R = sigma**2 * np.eye(2)
    ts = np.arange(0, T, dt); truth = np.array([road(t) for t in ts])
    z = truth + sigma * rng.normal(size=truth.shape)
    x = np.array([z[0, 0], z[0, 1], 0.0, 0.0]); P = np.diag([sigma**2, sigma**2, 100.0, 100.0])
    est, covs = [], []
    for k in range(len(ts)):
        if k:
            x = F @ x; P = F @ P @ F.T + Q                       # predict
        S = H @ P @ H.T + R; K = P @ H.T @ np.linalg.inv(S)       # update
        x = x + K @ (z[k] - H @ x); I_KH = np.eye(4) - K @ H; P = I_KH @ P @ I_KH.T + K @ R @ K.T
        est.append(x.copy()); covs.append(P.copy())
    return ts, truth, z, np.array(est), np.array(covs)

def rms(e): return np.sqrt(np.mean(np.sum(e**2, axis=1)))

def test_filter_beats_raw_fixes():
    ts, truth, z, est, _ = track()
    raw, kf = rms(z[10:] - truth[10:]), rms(est[10:, :2] - truth[10:])
    true_v = np.gradient(truth, ts, axis=0); verr = rms(est[10:, 2:] - true_v[10:])
    print(f"position error: raw fixes {raw:.2f} m RMS, Kalman filter {kf:.2f} m RMS ({kf / raw:.0%} of raw); speed error {verr:.2f} m/s RMS")
    assert kf < 0.6 * raw and verr < 1.5

def test_covariance_reflects_error():
    ts, truth, z, est, covs = track(seed=1)
    sig_pred = np.sqrt(np.mean([c[0, 0] + c[1, 1] for c in covs[20:]]))
    actual = rms(est[20:, :2] - truth[20:])
    print(f"filter's own 1-sigma position spread {sig_pred:.2f} m vs actual RMS {actual:.2f} m")
    assert 0.6 < actual / sig_pred < 1.6

def test_q_tradeoff():
    res = {}
    for q in (0.001, 0.1, 10.0):
        _, truth, _, est, _ = track(q=q, seed=2); res[q] = rms(est[10:, :2] - truth[10:])
    print("RMS position error vs assumed q:", ", ".join(f"q = {k}: {v:.2f} m" for k, v in res.items()))
    assert res[0.1] < res[0.001] and res[0.1] < res[10.0]       # too stiff lags the bends, too loose follows the noise

test_filter_beats_raw_fixes()
test_covariance_reflects_error()
test_q_tradeoff()
print("PASS")
