import math
import numpy as np

def det_lu(A):
    U = np.array(A, dtype=float)
    n, sign = U.shape[0], 1.0
    for k in range(n):
        p = k + np.argmax(np.abs(U[k:, k]))
        if U[p, k] == 0.0:
            return 0.0
        if p != k:
            U[[k, p]] = U[[p, k]]
            sign = -sign
        U[k + 1:, k:] -= np.outer(U[k + 1:, k] / U[k, k], U[k, k:])
    return sign * np.prod(np.diag(U))

def is_singular(A, rtol=1e-12):
    s = np.abs(np.array(A, dtype=float)).max()
    return abs(det_lu(A)) <= rtol * s ** len(A)

if __name__ == "__main__":
    assert abs(det_lu([[2, 1, -1], [-3, -1, 2], [-2, 1, 2]]) - (-1)) < 1e-12
    rng = np.random.default_rng(3)
    for _ in range(300):
        A = rng.standard_normal((6, 6)); B = rng.standard_normal((6, 6))
        assert math.isclose(det_lu(A), np.linalg.det(A), rel_tol=1e-9)
        assert math.isclose(det_lu(A @ B), det_lu(A) * det_lu(B), rel_tol=1e-8)
    J = lambda q2, l1=0.3, l2=0.2: [[-l1 - l2 * math.cos(q2), -l2 * math.cos(q2)],
                                     [-l2 * math.sin(q2), -l2 * math.sin(q2)]]
    assert abs(det_lu(J(math.radians(30))) - 0.03) < 1e-12
    assert is_singular(J(0.0)) and is_singular([[1, 2], [2, 4]])
    print("det via LU matches NumPy; singular configurations flagged")
