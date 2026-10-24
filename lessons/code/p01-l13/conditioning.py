import numpy as np

def cond2(A):
    s = np.linalg.svd(A, compute_uv=False)
    return s[0] / s[-1]

def hilbert(n):
    i = np.arange(1, n + 1)
    return 1.0 / (i[:, None] + i[None, :] - 1)

if __name__ == "__main__":
    A = np.array([[1, 1], [1, 1.0001]])
    x1 = np.linalg.solve(A, [2, 2.0001]); x2 = np.linalg.solve(A, [2, 2.0002])
    assert np.allclose(x1, [1, 1], atol=1e-8) and np.allclose(x2, [0, 2], atol=1e-8)
    rng = np.random.default_rng(8)
    eps = np.finfo(float).eps
    print(" n   cond(H)    rel. perturbation   measured error   bound")
    for n in (3, 5, 7, 9, 11):
        H = hilbert(n); k = cond2(H)
        x = rng.standard_normal(n); b = H @ x
        db = rng.standard_normal(n); db *= 1e-10 * np.linalg.norm(b) / np.linalg.norm(db)
        x_hat = np.linalg.solve(H, b + db)
        err = np.linalg.norm(x_hat - x) / np.linalg.norm(x)
        bound = k * (1e-10 + 10 * n * eps)        # data error plus solver round-off
        print(f"{n:2d} {k:10.2e} {1e-10:16.0e} {err:16.2e} {bound:10.2e}")
        assert err <= bound
