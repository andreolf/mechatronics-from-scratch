import math
import numpy as np
from scipy import stats

def z_test(xbar, sigma, n):
    z = xbar / (sigma / math.sqrt(n))
    return z, 2 * (1 - stats.norm.cdf(abs(z)))

def nis(nu, S):
    return float(nu @ np.linalg.solve(S, nu))

if __name__ == "__main__":
    z, p = z_test(0.005, 0.02, 100)
    assert abs(z - 2.5) < 1e-12 and abs(p - 0.012419) < 1e-6
    # simulate: under H0, a 5 % test rejects about 5 % of the time
    rng = np.random.default_rng(6)
    means = rng.standard_normal((20_000, 100)).mean(axis=1) * 0.02
    alpha = np.mean(np.abs(means / 0.002) > 1.96)
    power = np.mean(np.abs((means + 0.006) / 0.002) > 1.96)
    print(f"false alarm {alpha:.3f}, power {power:.3f}")
    assert abs(alpha - 0.05) < 0.006 and abs(power - 0.8508) < 0.01
    # chi-square gate on a consistent 2-D measurement model
    S = np.array([[4.0, 1.2], [1.2, 1.0]])
    L = np.linalg.cholesky(S)
    d2 = np.array([nis(L @ rng.standard_normal(2), S) for _ in range(20_000)])
    gate = stats.chi2.ppf(0.95, 2)
    assert abs(gate - 5.9915) < 1e-4 and abs(np.mean(d2 > gate) - 0.05) < 0.006
    assert nis(np.array([6.0, 0.0]), S) > gate           # a 6 m outlier east is rejected
