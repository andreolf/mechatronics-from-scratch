import math
import numpy as np
from scipy import stats

def standardised_sums(n, m, rng):
    s = rng.random((m, n)).sum(axis=1)
    return (s - n / 2) / math.sqrt(n / 12)

def ks_statistic(z):
    """Largest gap between the empirical CDF and the standard normal CDF."""
    z = np.sort(z); m = len(z)
    F = 0.5 * (1 + np.vectorize(math.erf)(z / math.sqrt(2)))
    return max(np.max(np.arange(1, m + 1) / m - F), np.max(F - np.arange(m) / m))

if __name__ == "__main__":
    rng = np.random.default_rng(12)
    m = 5000
    crit = 1.358 / math.sqrt(m)                       # 5 % critical value for large m
    D = {n: ks_statistic(standardised_sums(n, m, rng)) for n in (1, 2, 12, 30)}
    print({n: round(d, 4) for n, d in D.items()}, "critical", round(crit, 4))
    assert D[1] > crit                                # a single uniform is clearly not Gaussian
    assert D[12] < crit and D[30] < crit              # 12 or more pass
    z = standardised_sums(12, m, rng)
    assert abs(ks_statistic(z) - stats.kstest(z, "norm").statistic) < 1e-9
    # tolerance stack: 10 parts, uniform +-0.1 mm
    stack = (rng.random((200_000, 10)) * 0.2 - 0.1).sum(axis=1)
    assert abs(stack.std() - 0.1 / math.sqrt(3) * math.sqrt(10)) < 0.002
    assert abs(np.mean(np.abs(stack) <= 0.548) - 0.9973) < 0.002
