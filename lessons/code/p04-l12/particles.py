import math
import numpy as np

def systematic_resample(w, rng):
    M = len(w)
    c = np.cumsum(w / np.sum(w))
    c[-1] = 1.0
    u = (rng.random() + np.arange(M)) / M
    return np.searchsorted(c, u)

def ess(w):
    w = w / np.sum(w)
    return 1.0 / np.sum(w**2)

if __name__ == "__main__":
    rng = np.random.default_rng(12)
    x = rng.normal(4.0, 1.0, 4000)
    w = np.exp(-4 * x + 8)
    est = np.mean((x > 4) * w)
    print(f"P(X>4) ~ {est:.3e} (exact 3.167e-05)")
    assert abs(est / 3.167124e-05 - 1) < 0.08

    assert abs(ess(np.ones(10)) - 10) < 1e-12 and abs(ess(np.array([1, 0, 0, 0.0])) - 1) < 1e-12
    wq = np.array([0.5, 0.3, 0.15, 0.05])
    for _ in range(200):
        cnt = np.bincount(systematic_resample(wq, rng), minlength=4)
        assert cnt[0] == 2 and np.all(np.abs(cnt - 4 * wq) < 1)

    # particle filter vs Kalman filter on a 1-D random walk
    T, q, r, M = 300, 0.1, 0.5, 500
    truth = np.cumsum(q * rng.standard_normal(T))
    z = truth + r * rng.standard_normal(T)
    p = rng.normal(0, 1, M)
    m, P = 0.0, 1.0
    epf, ekf = [], []
    for k in range(T):
        p = p + q * rng.standard_normal(M)
        wk = np.exp(-0.5 * ((z[k] - p) / r) ** 2)
        epf.append(np.sum(wk * p) / np.sum(wk) - truth[k])
        p = p[systematic_resample(wk, rng)]
        P += q * q
        K = P / (P + r * r)
        m += K * (z[k] - m)
        P *= 1 - K
        ekf.append(m - truth[k])
    rpf, rkf = math.sqrt(np.mean(np.square(epf[50:]))), math.sqrt(np.mean(np.square(ekf[50:])))
    print(f"RMS error: particle {rpf:.3f}, Kalman {rkf:.3f}, raw sensor {r}")
    assert rkf < 0.3 and abs(rpf / rkf - 1) < 0.1
