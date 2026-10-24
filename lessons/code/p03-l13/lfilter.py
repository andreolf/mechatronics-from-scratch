import numpy as np
from scipy import signal

def lfilter(b, a, u):
    """Direct form I difference equation; a[0] normalises the coefficients."""
    b, a = np.asarray(b, float) / a[0], np.asarray(a, float) / a[0]
    y = np.zeros(len(u))
    for n in range(len(u)):
        acc = sum(b[k] * u[n - k] for k in range(len(b)) if n - k >= 0)
        acc -= sum(a[k] * y[n - k] for k in range(1, len(a)) if n - k >= 0)
        y[n] = acc
    return y

def stable(a):
    return bool(np.all(np.abs(np.roots(a)) < 1))

if __name__ == "__main__":
    rng = np.random.default_rng(3)
    u = rng.standard_normal(500)
    for b, a in (([0.095163], [1, -0.904837]),
                 ([0.2, 0.3, 0.1], [1, -0.5, 0.25]),
                 ([1, -2, 1], [2.0, -1.2, 0.5])):
        assert np.max(np.abs(lfilter(b, a, u) - signal.lfilter(b, a, u))) < 1e-12
    p = np.exp(-100 * 1e-3)
    step = lfilter([1 - p], [1, -p], np.ones(50))
    assert np.allclose(step, 1 - p ** (np.arange(50) + 1))
    assert abs(step[9] - (1 - np.exp(-1))) < 1e-12        # 10 samples = one time constant
    assert stable([1, -0.904837]) and not stable([1, -1.1])
    r, th = 0.9, np.radians(30)                            # pole pair from the widget
    assert stable([1, -2 * r * np.cos(th), r * r])
    print(f"pole z = {p:.6f}; y after 10 samples = {step[9]:.4f}")
