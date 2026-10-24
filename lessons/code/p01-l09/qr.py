import numpy as np

def mgs(A):
    A = np.array(A, float); m, n = A.shape
    Q, R = np.zeros((m, n)), np.zeros((n, n))
    V = A.copy()
    for j in range(n):
        R[j, j] = np.linalg.norm(V[:, j])
        Q[:, j] = V[:, j] / R[j, j]
        for k in range(j + 1, n):              # subtract the projection immediately
            R[j, k] = Q[:, j] @ V[:, k]
            V[:, k] -= R[j, k] * Q[:, j]
    return Q, R

def householder_qr(A):
    R = np.array(A, float); m, n = R.shape
    Q = np.eye(m)
    for k in range(n):
        x = R[k:, k]
        v = x.copy(); v[0] += np.copysign(np.linalg.norm(x), x[0])
        if np.linalg.norm(v) == 0: continue
        v /= np.linalg.norm(v)
        R[k:, :] -= 2 * np.outer(v, v @ R[k:, :])
        Q[:, k:] -= 2 * np.outer(Q[:, k:] @ v, v)
    return Q[:, :n], R[:n]

def back(R, y):
    x = np.zeros(len(y))
    for i in reversed(range(len(y))):
        x[i] = (y[i] - R[i, i + 1:] @ x[i + 1:]) / R[i, i]
    return x

if __name__ == "__main__":
    Q, R = mgs([[1, 1], [1, 0], [0, 1]])
    assert np.allclose(R, [[2 ** .5, 2 ** -.5], [0, 1.5 ** .5]])
    rng = np.random.default_rng(5)
    A = rng.standard_normal((50, 8))
    for Q, R in (mgs(A), householder_qr(A)):
        assert np.allclose(Q.T @ Q, np.eye(8), atol=1e-12) and np.allclose(Q @ R, A)
    # ill-conditioned fit: degree-11 polynomial on [0, 1]
    t = np.linspace(0, 1, 60)
    V = np.vander(t, 12, increasing=True)
    c_true = rng.standard_normal(12)
    b = V @ c_true
    Q, R = householder_qr(V)
    c_qr = back(R, Q.T @ b)
    c_ne = np.linalg.solve(V.T @ V, V.T @ b)
    e_qr = np.linalg.norm(c_qr - c_true) / np.linalg.norm(c_true)
    e_ne = np.linalg.norm(c_ne - c_true) / np.linalg.norm(c_true)
    print(f"cond(V) = {np.linalg.cond(V):.1e}; error QR {e_qr:.1e}, normal equations {e_ne:.1e}")
    assert e_qr < 1e-4 and e_ne > 100 * e_qr
