import math
import numpy as np
from scipy.linalg import expm

def hat(w):
    return np.array([[0, -w[2], w[1]], [w[2], 0, -w[0]], [-w[1], w[0], 0]], float)

def vee(K):
    return np.array([K[2, 1], K[0, 2], K[1, 0]])

def expm_so3(w):
    th = np.linalg.norm(w)
    K = hat(w)
    if th < 1e-8:                                   # series: I + K + K²/2
        return np.eye(3) + K + 0.5 * K @ K
    return np.eye(3) + math.sin(th) / th * K + (1 - math.cos(th)) / th ** 2 * K @ K

def logm_so3(R):
    c = (np.trace(R) - 1) / 2
    s = np.linalg.norm(vee(R - R.T)) / 2           # sinθ
    th = math.atan2(s, c)                           # accurate at every angle, unlike acos
    if th < 1e-8:
        return vee(R - R.T) / 2                     # sinθ/θ → 1
    if math.pi - th < 1e-6:                         # axis from R + I = 2uuᵀ
        B = (R + np.eye(3)) / 2
        u = B[:, np.argmax(np.diag(B))]; u /= np.linalg.norm(u)
        return th * u
    return th / (2 * math.sin(th)) * vee(R - R.T)

if __name__ == "__main__":
    assert np.allclose(expm_so3([0, 0, math.pi / 2]), [[0, -1, 0], [1, 0, 0], [0, 0, 1]])
    rng = np.random.default_rng(12)
    for _ in range(2000):
        u = rng.standard_normal(3); u /= np.linalg.norm(u)
        w = u * rng.uniform(1e-10, 3.1)             # angles below π, where log is unique
        R = expm_so3(w)
        assert np.allclose(R, expm(hat(w)), atol=1e-10)
        assert np.allclose(logm_so3(R), w, atol=1e-8)
    for w in ([math.pi, 0, 0], [0, math.pi - 1e-9, 0], [1e-12, 0, 0]):
        assert np.allclose(expm_so3(logm_so3(expm_so3(w))), expm_so3(w), atol=1e-8)
    print("expm_so3 matches scipy.linalg.expm to 1e-10; log map round-trips, including θ ≈ 0 and θ ≈ π")
