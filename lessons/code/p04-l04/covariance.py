import math
import numpy as np

def sample_cov(X):
    """Unbiased covariance of rows-as-samples data."""
    Xc = X - X.mean(axis=0)
    return Xc.T @ Xc / (len(X) - 1)

def ellipse(Sigma, k=1.0):
    w, V = np.linalg.eigh(Sigma)
    i = np.argmax(w)
    angle = math.degrees(math.atan2(V[1, i], V[0, i])) % 180
    return k * np.sqrt(w[::-1]), angle            # (major, minor), degrees

def correlated(Sigma, n, rng):
    L = np.linalg.cholesky(Sigma)                 # Sigma = L L^T
    return rng.standard_normal((n, 2)) @ L.T

if __name__ == "__main__":
    Sigma = np.array([[2.25, 0.72], [0.72, 0.64]])
    axes, ang = ellipse(Sigma)
    print(f"1-sigma semi-axes {axes.round(3)}, major axis at {ang:.1f} deg")
    assert np.allclose(axes, [1.5890, 0.6041], atol=1e-4) and abs(ang - 20.90) < 0.01
    rng = np.random.default_rng(4)
    X = correlated(Sigma, 200_000, rng)
    S = sample_cov(X)
    assert np.max(np.abs(S - Sigma)) < 0.03
    assert np.allclose(S, np.cov(X.T))
    d2 = np.einsum("ij,jk,ik->i", X, np.linalg.inv(Sigma), X)
    for k in (1, 2, 3):
        assert abs(np.mean(d2 <= k * k) - (1 - math.exp(-k * k / 2))) < 0.004
    a = np.array([1, 1]) / math.sqrt(2)
    assert abs(a @ Sigma @ a - 2.165) < 1e-12
    # convergence: error of the estimate shrinks as samples grow
    errs = [np.max(np.abs(sample_cov(correlated(Sigma, n, rng)) - Sigma)) for n in (100, 10_000)]
    assert errs[1] < errs[0]
