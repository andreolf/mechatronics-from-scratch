import math
import numpy as np

def euler(f, x0, h, n):
    x = np.array(x0, float)
    for _ in range(n):
        x = x + h * f(x)
    return x

def diverges(h, w=10.0, zeta=0.1, t_end=200.0):
    f = lambda s: np.array([s[1], -2 * zeta * w * s[1] - w * w * s[0]])
    x = euler(f, [1.0, 0.0], h, round(t_end / h))
    return np.hypot(w * x[0], x[1]) > w           # energy norm above its starting value

if __name__ == "__main__":
    lo, hi = 1e-4, 0.05                     # bisection on the divergence threshold
    assert not diverges(lo) and diverges(hi)
    for _ in range(40):
        mid = (lo + hi) / 2
        lo, hi = (lo, mid) if diverges(mid) else (mid, hi)
    print(f"measured threshold h = {lo:.5f} s, predicted 2ζ/ω = {2 * 0.1 / 10:.5f} s")
    assert abs(lo - 0.02) < 2e-4
    g = lambda x: -50 * x                    # real mode: limit 2/50 = 0.04 s
    assert abs(euler(g, [1.0], 0.039, 2000)[0]) < 1 and abs(euler(g, [1.0], 0.041, 2000)[0]) > 1
