import numpy as np

ONE = 1 << 15
MAX, MIN = ONE - 1, -ONE

def sat(x):
    return max(MIN, min(MAX, x))

def to_q15(x):
    return sat(int(round(x * ONE)))

def q15_add(a, b):
    return sat(a + b)

def q15_mul(a, b, rounding=True):
    p = a * b
    return sat((p + (1 << 14)) >> 15 if rounding else p >> 15)   # >> is floor division, like the hardware

if __name__ == "__main__":
    a, b = to_q15(0.7), to_q15(-0.3)
    assert (a, b) == (22938, -9830) and q15_mul(a, b) == -6881 and q15_mul(a, b, False) == -6882
    assert q15_mul(MIN, MIN) == MAX                                 # -1 * -1 saturates
    assert q15_add(to_q15(0.75), to_q15(0.75)) == MAX               # saturates instead of wrapping
    rng = np.random.default_rng(15)
    A = rng.integers(MIN, MAX + 1, 50_000); B = rng.integers(MIN, MAX + 1, 50_000)
    err_r = np.array([q15_mul(int(x), int(y)) for x, y in zip(A, B)]) - A * B / ONE
    err_t = np.array([q15_mul(int(x), int(y), False) for x, y in zip(A, B)]) - A * B / ONE
    ok = ~((A == MIN) & (B == MIN))
    print(f"rounding: max |err| {np.abs(err_r[ok]).max():.4f} LSB, mean {err_r.mean():+.4f}; truncation mean {err_t.mean():+.4f} LSB")
    assert np.abs(err_r[ok]).max() <= 0.5 and abs(err_r.mean()) < 0.01   # within half an LSB, unbiased
    assert -1 < err_t.min() and err_t.max() <= 0 and abs(err_t.mean() + 0.5) < 0.01
