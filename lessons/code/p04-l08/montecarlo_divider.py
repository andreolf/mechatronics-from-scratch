import numpy as np

def divider(r1, r2, vin=5.0):
    return vin * r2 / (r1 + r2)

def mc(tol, M, seed=0):
    rng = np.random.default_rng(seed)
    r1 = 10.0 * (1 + tol * (2 * rng.random(M) - 1))
    r2 = 10.0 * (1 + tol * (2 * rng.random(M) - 1))
    return divider(r1, r2)

if __name__ == "__main__":
    lo, hi = divider(10.5, 9.5), divider(9.5, 10.5)
    assert abs(lo - 2.375) < 1e-12 and abs(hi - 2.625) < 1e-12
    v = mc(0.05, 1_000_000)
    fail = np.mean(np.abs(v - 2.5) > 0.05)
    print(f"sigma {v.std():.4f} V, failing {100*fail:.2f} %")
    assert abs(v.std() - 0.125 * 0.5 / np.sqrt(3) * np.sqrt(2)) < 5e-4
    assert abs(fail - 0.36) < 3 * np.sqrt(0.36 * 0.64 / 1e6) + 0.002   # within MC error (+ linearisation)
    assert lo <= v.min() and v.max() <= hi                             # Monte Carlo never beats worst case
    assert np.all(np.abs(mc(0.01, 100_000) - 2.5) < 0.05)              # 1 % parts: 100 % yield
    # standard error shrinks like 1/sqrt(M)
    errs = [np.std([np.mean(np.abs(mc(0.05, M, s) - 2.5) > 0.05) for s in range(60)]) for M in (1_000, 16_000)]
    assert 2.8 < errs[0] / errs[1] < 5.5                               # about sqrt(16) = 4
