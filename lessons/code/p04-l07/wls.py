import numpy as np

def wls(A, z, sigma):
    W = np.diag(1 / np.asarray(sigma) ** 2)
    cov = np.linalg.inv(A.T @ W @ A)
    return cov @ A.T @ W @ z, cov

if __name__ == "__main__":
    est, cov = wls(np.array([[1.0], [1.0]]), np.array([10.0, 10.6]), [0.5, 1.0])
    assert abs(est[0] - 10.12) < 1e-12 and abs(np.sqrt(cov[0, 0]) - 1 / np.sqrt(5)) < 1e-12

    x = np.arange(0, 11.0)
    sig = 0.1 + 0.2 * x
    A = np.c_[x, np.ones_like(x)]
    _, cw = wls(A, np.zeros_like(x), sig)
    P = np.linalg.pinv(A)                                  # OLS estimator matrix
    co = P @ np.diag(sig**2) @ P.T
    print("WLS std errors", np.sqrt(np.diag(cw)).round(3), "OLS", np.sqrt(np.diag(co)).round(3))
    assert np.allclose(np.sqrt(np.diag(cw)), [0.0752, 0.0957], atol=1e-4)
    assert np.allclose(np.sqrt(np.diag(co)), [0.1322, 0.4280], atol=1e-4)

    # Monte Carlo: WLS estimates really scatter as (A^T W A)^-1 predicts
    rng = np.random.default_rng(2)
    k, b = 2.0, 0.5
    fits = np.array([wls(A, k * x + b + rng.standard_normal(x.size) * sig, sig)[0] for _ in range(20_000)])
    assert np.allclose(fits.mean(axis=0), [k, b], atol=0.005)
    assert np.allclose(fits.std(axis=0), np.sqrt(np.diag(cw)), rtol=0.03)
