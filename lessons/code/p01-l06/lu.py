import time
import numpy as np

def lu(A):
    U = np.array(A, dtype=float)
    n = U.shape[0]
    L, perm = np.eye(n), np.arange(n)
    for k in range(n - 1):
        p = k + np.argmax(np.abs(U[k:, k]))
        if p != k:
            U[[k, p], k:] = U[[p, k], k:]
            L[[k, p], :k] = L[[p, k], :k]
            perm[[k, p]] = perm[[p, k]]
        for i in range(k + 1, n):
            L[i, k] = U[i, k] / U[k, k]
            U[i, k:] -= L[i, k] * U[k, k:]
    P = np.eye(n)[perm]
    return P, L, U

def lu_solve(P, L, U, b):
    y = P @ np.asarray(b, dtype=float)
    n = len(y)
    for i in range(n):                        # forward, L has a unit diagonal
        y[i] -= L[i, :i] @ y[:i]
    x = np.zeros(n)
    for i in range(n - 1, -1, -1):            # back substitution
        x[i] = (y[i] - U[i, i + 1:] @ x[i + 1:]) / U[i, i]
    return x

if __name__ == "__main__":
    P, L, U = lu([[4, 3], [6, 3]])
    assert np.allclose(L, [[1, 0], [2/3, 1]]) and np.allclose(U, [[6, 3], [0, 1]])
    assert np.allclose(lu_solve(P, L, U, [10, 12]), [1, 2])
    rng = np.random.default_rng(2)
    A = rng.standard_normal((120, 120))
    P, L, U = lu(A)
    assert np.allclose(P @ A, L @ U, atol=1e-12)
    B = rng.standard_normal((120, 30))
    t0 = time.perf_counter()
    X = np.column_stack([lu_solve(P, L, U, B[:, j]) for j in range(30)])
    t1 = time.perf_counter()
    for j in range(30):
        lu(A)                                  # re-eliminating every time
    t2 = time.perf_counter()
    assert np.allclose(A @ X, B, atol=1e-9)
    print(f"30 solves with one factorisation: {1e3*(t1-t0):.1f} ms; 30 re-eliminations: {1e3*(t2-t1):.1f} ms")
