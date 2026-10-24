import numpy as np

def power_iteration(A, iters=500, tol=1e-13, x0=None):
    A = np.asarray(A, float)
    x = np.ones(len(A)) if x0 is None else np.asarray(x0, float)
    x /= np.linalg.norm(x)
    lam, errs = 0.0, []
    for _ in range(iters):
        y = A @ x
        lam_new = x @ y
        x_new = y / np.linalg.norm(y)
        if x_new @ x < 0: x_new = -x_new       # fix the sign for comparison
        errs.append(np.linalg.norm(x_new - x))
        x, lam = x_new, lam_new
        if errs[-1] < tol: break
    return lam, x, errs

def inverse_iteration(A, shift, iters=50):
    A = np.asarray(A, float); n = len(A)
    M = A - shift * np.eye(n)
    x = np.ones(n) / np.sqrt(n)
    for _ in range(iters):
        y = np.linalg.solve(M, x)              # a real code would factor M once (lesson 6)
        x = y / np.linalg.norm(y)
    return x @ A @ x, x

if __name__ == "__main__":
    lam, v, errs = power_iteration([[2, 1], [1, 2]], x0=[1, 0])
    assert abs(lam - 3) < 1e-12 and np.allclose(abs(v), [2 ** -.5] * 2)
    ratios = [errs[k + 1] / errs[k] for k in range(3, 12)]
    assert all(abs(r - 1 / 3) < 0.02 for r in ratios), ratios
    rng = np.random.default_rng(6)
    B = rng.standard_normal((6, 6)); S = B + B.T
    for true in np.linalg.eigvalsh(S):
        lam, v = inverse_iteration(S, true + 0.05)
        assert abs(lam - true) < 1e-9 and np.linalg.norm(S @ v - lam * v) < 1e-9
    print("power iteration ratio ≈", np.mean(ratios).round(4), "; all eigenpairs found by inverse iteration")
