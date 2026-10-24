import math
import numpy as np

def gauss_markov(n, T, sigma, dt, rng):
    phi = math.exp(-dt / T)
    q = sigma**2 * (1 - phi**2)
    x = np.empty(n)
    x[0] = sigma * rng.standard_normal()
    w = math.sqrt(q) * rng.standard_normal(n)
    for k in range(1, n):
        x[k] = phi * x[k - 1] + w[k]
    return x, phi, q

if __name__ == "__main__":
    rng = np.random.default_rng(8)
    x, phi, q = gauss_markov(400_000, 600.0, 0.5, 1.0, rng)
    assert abs(phi - 0.998335) < 1e-6 and abs(math.sqrt(q) - 0.028843) < 1e-6
    assert abs(x.std() - 0.5) < 0.05                       # stationary at sigma
    lag = 600
    rho = np.corrcoef(x[:-lag], x[lag:])[0, 1]
    print(f"autocorrelation at T: {rho:.3f} (theory {math.exp(-1):.3f})")
    assert abs(rho - math.exp(-1)) < 0.06
    # random walk: variance grows linearly with time
    walks = np.cumsum(rng.standard_normal((4000, 400)) * 0.1, axis=1)
    assert abs(walks[:, 99].var() / (100 * 0.01) - 1) < 0.08
    assert abs(walks[:, 399].var() / walks[:, 99].var() - 4) < 0.5
