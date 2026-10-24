import math
import numpy as np

def laplace(x, s, T=None, n=200_001):
    """Numeric Laplace transform for real s > 0 by Simpson's rule on [0, T]."""
    T = T or 40.0 / s                                  # e^{-sT} = e^{-40}: tail negligible
    t = np.linspace(0, T, n)
    f = x(t) * np.exp(-s * t)
    h = t[1] - t[0]
    return h / 3 * (f[0] + f[-1] + 4 * f[1:-1:2].sum() + 2 * f[2:-1:2].sum())

TABLE = {
    "step":     (lambda t: np.ones_like(t),     lambda s: 1 / s),
    "exp(-2t)": (lambda t: np.exp(-2 * t),      lambda s: 1 / (s + 2)),
    "t":        (lambda t: t,                   lambda s: 1 / s**2),
    "sin(3t)":  (lambda t: np.sin(3 * t),       lambda s: 3 / (s**2 + 9)),
    "cos(3t)":  (lambda t: np.cos(3 * t),       lambda s: s / (s**2 + 9)),
}

if __name__ == "__main__":
    for name, (x, X) in TABLE.items():
        for s in (0.5, 1.0, 3.0, 10.0):
            num, ref = laplace(x, s), X(s)
            assert abs(num - ref) < 1e-8 * max(1, abs(ref)), (name, s, num, ref)
    # derivative rule: L{x'} = s X - x(0) for x = cos 2t
    s = 1.7
    lhs = laplace(lambda t: -2 * np.sin(2 * t), s)
    rhs = s * laplace(lambda t: np.cos(2 * t), s) - 1.0
    assert abs(lhs - rhs) < 1e-8
    # the worked example
    x = lambda t: 0.5 * (1 - np.exp(-2 * t))
    assert abs(laplace(x, 3.0) - 1 / (3.0 * 5.0)) < 1e-9
    print("table verified at s = 0.5, 1, 3, 10; x(1) =", round(float(x(1.0)), 5))
