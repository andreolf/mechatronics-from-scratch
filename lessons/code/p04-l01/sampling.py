import math
import numpy as np

class LCG:
    """Tiny 64-bit linear congruential generator (Knuth's MMIX constants): the only randomness used."""
    def __init__(self, seed=1):
        self.s = seed
    def uniform(self, n):
        out = np.empty(n)
        for i in range(n):
            self.s = (6364136223846793005 * self.s + 1442695040888963407) % 2**64
            out[i] = ((self.s >> 11) + 0.5) / 2**53          # in (0, 1), never exactly 0
        return out

def exponential(g, n, lam):
    return -np.log(1 - g.uniform(n)) / lam

def gaussian(g, n):
    u1, u2 = g.uniform(n), g.uniform(n)
    return np.sqrt(-2 * np.log(u1)) * np.cos(2 * np.pi * u2)

def check(x, mean, var, name):
    n = len(x)
    se_mean = math.sqrt(var / n)
    m4 = np.mean((x - x.mean())**4)
    se_var = math.sqrt((m4 - var**2) / n)                    # standard error of the sample variance
    assert abs(x.mean() - mean) < 3 * se_mean, (name, x.mean())
    assert abs(x.var() - var) < 3 * se_var, (name, x.var())
    print(f"{name:12s} mean {x.mean():+.4f} (theory {mean}), var {x.var():.4f} (theory {var})")

if __name__ == "__main__":
    g, n = LCG(2026), 100_000
    check(g.uniform(n) * 2 - 1, 0.0, 4 / 12, "uniform")
    check(exponential(g, n, 0.5), 2.0, 4.0, "exponential")
    z = gaussian(g, n)
    check(z, 0.0, 1.0, "gaussian")
    for k, p in ((1, 0.6827), (2, 0.9545), (3, 0.9973)):
        frac = np.mean(np.abs(z) < k)
        assert abs(frac - p) < 3 * math.sqrt(p * (1 - p) / n)
    t = exponential(g, n, 0.5)
    assert abs(np.mean(t > 5) - math.exp(-2.5)) < 3 * math.sqrt(0.082 * 0.918 / n)
