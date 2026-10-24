import math
import numpy as np

def sin_taylor(x, order):
    term, total = x, x
    for k in range(3, order + 1, 2):
        term *= -x * x / ((k - 1) * k)
        total += term
    return total

def rel_err(theta, order):
    return abs(sin_taylor(theta, order) - math.sin(theta)) / abs(math.sin(theta))

if __name__ == "__main__":
    # find the angle where sinθ ≈ θ reaches 1 % error, by bisection
    lo, hi = 0.01, 1.0
    for _ in range(60):
        mid = (lo + hi) / 2
        lo, hi = (mid, hi) if rel_err(mid, 1) < 0.01 else (lo, mid)
    crossing = math.degrees(lo)
    print(f"sin θ ≈ θ is within 1 % up to {crossing:.2f}°")
    assert 13.9 < crossing < 14.0
    for deg in np.arange(0.5, 13.9, 0.5):
        assert rel_err(math.radians(deg), 1) < 0.01
    for order, limit in ((3, 1e-3), (5, 1e-5)):
        assert rel_err(math.radians(30), order) < limit
    assert abs((2 + 0.25 * 0.1) - math.sqrt(4.1)) < 1.6e-4
