import math
import numpy as np

L1 = L2 = 0.3

def fk(q):
    q1, q2 = q[..., 0], q[..., 1]
    return np.stack([L1 * np.cos(q1) + L2 * np.cos(q1 + q2), L1 * np.sin(q1) + L2 * np.sin(q1 + q2)], axis=-1)

def jacobian(q):
    q1, q2 = q
    s1, c1, s12, c12 = math.sin(q1), math.cos(q1), math.sin(q1 + q2), math.cos(q1 + q2)
    return np.array([[-L1 * s1 - L2 * s12, -L2 * s12], [L1 * c1 + L2 * c12, L2 * c12]])

if __name__ == "__main__":
    q0 = np.radians([30.0, 60.0])
    assert np.allclose(fk(q0), [0.259808, 0.45], atol=1e-6)
    sq = math.radians(360 / 4096) / math.sqrt(12)
    J = jacobian(q0)
    Sp = sq**2 * J @ J.T
    sx, sy = np.sqrt(np.diag(Sp))
    print(f"sigma_x {sx*1e3:.3f} mm, sigma_y {sy*1e3:.3f} mm")
    assert abs(sx - 2.395e-4) < 1e-6 and abs(sy - 1.150e-4) < 1e-6
    # Monte Carlo with uniform quantisation errors agrees with linear propagation
    rng = np.random.default_rng(9)
    dq = (rng.random((400_000, 2)) - 0.5) * math.radians(360 / 4096)
    P = fk(q0 + dq)
    assert np.max(np.abs(np.cov(P.T) - Sp)) < 0.02 * np.max(np.abs(Sp))
    # with large errors (5 deg) linearisation is visibly off: the mean shifts
    big = fk(q0 + rng.standard_normal((400_000, 2)) * math.radians(5))
    shift = np.linalg.norm(big.mean(axis=0) - fk(q0))
    assert shift > 5e-4                                # more than half a millimetre of bias
