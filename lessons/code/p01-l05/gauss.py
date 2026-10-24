import numpy as np

def gauss_solve(A, b, tol=1e-12):
    A = np.array(A, dtype=float)
    b = np.array(b, dtype=float)
    n = len(b)
    scale = np.abs(A).max()
    for k in range(n - 1):
        p = k + np.argmax(np.abs(A[k:, k]))         # partial pivot
        if abs(A[p, k]) <= tol * scale:
            raise np.linalg.LinAlgError("matrix is singular to working precision")
        if p != k:
            A[[k, p]] = A[[p, k]]
            b[[k, p]] = b[[p, k]]
        for i in range(k + 1, n):
            l = A[i, k] / A[k, k]
            A[i, k:] -= l * A[k, k:]
            b[i] -= l * b[k]
    if abs(A[-1, -1]) <= tol * scale:
        raise np.linalg.LinAlgError("matrix is singular to working precision")
    x = np.zeros(n)
    for i in range(n - 1, -1, -1):
        x[i] = (b[i] - A[i, i + 1:] @ x[i + 1:]) / A[i, i]
    return x

if __name__ == "__main__":
    x = gauss_solve([[2, 1, -1], [-3, -1, 2], [-2, 1, 2]], [8, -11, -3])
    assert np.allclose(x, [2, 3, -1])
    assert np.allclose(gauss_solve([[1e-17, 1], [1, 1]], [1, 2]), [1, 1])
    rng = np.random.default_rng(1)
    for _ in range(200):
        n = rng.integers(2, 40)
        A = rng.standard_normal((n, n)) + n * np.eye(n)   # well conditioned
        b = rng.standard_normal(n)
        assert np.linalg.norm(A @ gauss_solve(A, b) - b) < 1e-10
    try:
        gauss_solve([[1, 2], [2, 4]], [1, 2])
    except np.linalg.LinAlgError:
        print("singular matrix detected")
    else:
        raise SystemExit("should have raised")
