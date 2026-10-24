import numpy as np

def svd_via_eig(A):
    A = np.asarray(A, float)
    w, V = np.linalg.eigh(A.T @ A)              # symmetric eigensolver (see lesson 11 for Jacobi)
    idx = np.argsort(w)[::-1]; w, V = w[idx], V[:, idx]
    s = np.sqrt(np.clip(w, 0, None))
    U = (A @ V) / s
    return U, s, V

def svd_jacobi(A, tol=1e-14, sweeps=60):
    U = np.array(A, float); n = U.shape[1]; V = np.eye(n)
    for _ in range(sweeps):
        rotated = False
        for p in range(n - 1):
            for q in range(p + 1, n):
                a, b = U[:, p] @ U[:, p], U[:, q] @ U[:, q]
                g = U[:, p] @ U[:, q]
                if abs(g) <= tol * np.sqrt(a * b): continue
                rotated = True
                zeta = (b - a) / (2 * g)
                t = np.sign(zeta) / (abs(zeta) + np.sqrt(1 + zeta ** 2)) if zeta != 0 else 1.0
                c = 1 / np.sqrt(1 + t * t); s = c * t
                for M in (U, V):
                    Mp, Mq = M[:, p].copy(), M[:, q].copy()
                    M[:, p], M[:, q] = c * Mp - s * Mq, s * Mp + c * Mq
        if not rotated: break
    sig = np.linalg.norm(U, axis=0)
    idx = np.argsort(sig)[::-1]
    return U[:, idx] / sig[idx], sig[idx], V[:, idx]

if __name__ == "__main__":
    U, s, V = svd_via_eig([[3, 0], [4, 5]])
    assert np.allclose(s, [45 ** .5, 5 ** .5]) and np.allclose(abs(U[:, 0]), [0.31623, 0.94868], atol=1e-5)
    rng = np.random.default_rng(7)
    for shape in [(5, 3), (8, 8), (12, 4)]:
        A = rng.standard_normal(shape)
        for f in (svd_via_eig, svd_jacobi):
            U, s, V = f(A)
            assert np.allclose(U @ np.diag(s) @ V.T, A, atol=1e-10)
            assert np.allclose(s, np.linalg.svd(A, compute_uv=False), rtol=1e-9)
    print("both SVDs reconstruct A and match NumPy's singular values")
