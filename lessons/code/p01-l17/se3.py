import math
import numpy as np

def rotz(t): c, s = math.cos(t), math.sin(t); return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1.0]])
def rotx(t): c, s = math.cos(t), math.sin(t); return np.array([[1.0, 0, 0], [0, c, -s], [0, s, c]])

def transform(R, p):
    T = np.eye(4); T[:3, :3] = R; T[:3, 3] = p
    return T

def inv(T):
    R, p = T[:3, :3], T[:3, 3]
    return transform(R.T, -R.T @ p)

def apply(T, x, point=True):
    return T[:3, :3] @ np.asarray(x, float) + (T[:3, 3] if point else 0)

if __name__ == "__main__":
    T_BG = transform(rotz(math.pi / 2), [0.5, 0, 0.3])
    assert np.allclose(apply(T_BG, [0.1, 0, 0]), [0.5, 0.1, 0.3])
    assert np.allclose(inv(T_BG)[:3, 3], [0, 0.5, -0.3])
    assert np.allclose(apply(inv(T_BG), [0.5, 0.1, 0.3]), [0.1, 0, 0])
    assert np.allclose(apply(T_BG, [1, 0, 0], point=False), [0, 1, 0])   # directions ignore p
    rng = np.random.default_rng(11)
    for _ in range(1000):
        T = transform(rotz(rng.uniform(-3, 3)) @ rotx(rng.uniform(-3, 3)), rng.standard_normal(3))
        U = transform(rotx(rng.uniform(-3, 3)), rng.standard_normal(3))
        x = rng.standard_normal(3)
        assert np.allclose(T @ inv(T), np.eye(4), atol=1e-12)
        assert np.allclose(apply(T, x), T[:3, :3] @ x + T[:3, 3])
        assert np.allclose(apply(T @ U, x), apply(T, apply(U, x)))
    print("T @ inv(T) = I; chained transforms equal sequential application")
