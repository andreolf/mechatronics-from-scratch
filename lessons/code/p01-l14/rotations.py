import math
import numpy as np

def rotx(t):
    c, s = math.cos(t), math.sin(t)
    return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])

def roty(t):
    c, s = math.cos(t), math.sin(t)
    return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])

def rotz(t):
    c, s = math.cos(t), math.sin(t)
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])

def is_rotation(R, tol=1e-9):
    R = np.asarray(R)
    return R.shape == (3, 3) and np.allclose(R.T @ R, np.eye(3), atol=tol) and abs(np.linalg.det(R) - 1) < tol

def orthonormalise(R):
    U, _, Vt = np.linalg.svd(R)
    D = np.diag([1, 1, np.sign(np.linalg.det(U @ Vt))])
    return U @ D @ Vt

if __name__ == "__main__":
    q = math.pi / 2
    assert np.allclose(rotz(q) @ rotx(q) @ [1, 0, 0], [0, 1, 0])
    assert np.allclose(rotx(q) @ rotz(q) @ [1, 0, 0], [0, 0, 1])
    assert np.allclose(rotz(math.radians(30)) @ [1, 0, 0], [0.866025, 0.5, 0], atol=1e-6)
    assert all(is_rotation(f(0.7)) for f in (rotx, roty, rotz))
    assert not is_rotation(np.diag([1, 1, -1]))

    step = rotz(1e-3) @ roty(2e-3) @ rotx(-1.5e-3)
    R_raw, R_fix = np.eye(3), np.eye(3)
    for k in range(1, 1_000_001):
        R_raw = R_raw @ step
        R_fix = R_fix @ step
        if k % 1000 == 0:
            R_fix = orthonormalise(R_fix)
    drift = lambda R: np.abs(R.T @ R - np.eye(3)).max()
    print(f"after 10^6 compositions: drift without repair {drift(R_raw):.1e}, with repair {drift(R_fix):.1e}")
    assert drift(R_fix) < 1e-13 and is_rotation(R_fix)
