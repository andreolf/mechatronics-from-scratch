import numpy as np

rng = np.random.default_rng(21)
FS, F0 = 1e6, 40e3

def c_air(T):
    return 331.3 + 0.606 * T

def burst(cycles=10):
    n = int(cycles * FS / F0)
    t = np.arange(n) / FS
    return np.sin(2 * np.pi * F0 * t) * np.sin(np.pi * np.arange(n) / n) ** 2   # transducer-shaped envelope

def received(d, amp, noise, T=20.0, n=14000):
    s = burst()
    x = noise * rng.standard_normal(n)
    delay = 2 * d / c_air(T) * FS
    k0 = int(delay)
    frac = delay - k0
    shifted = np.interp(np.arange(len(s)) - frac, np.arange(len(s)), s, left=0, right=0)
    x[k0:k0 + len(s)] += amp * shifted
    return x

def by_threshold(x, level):
    return np.argmax(np.abs(x) > level) / FS

def by_correlation(x):
    s = burst()
    r = np.correlate(x, s, mode="valid")
    k = int(np.argmax(r))
    y0, y1, y2 = r[k - 1], r[k], r[k + 1]
    return (k + 0.5 * (y0 - y2) / (y0 - 2 * y1 + y2)) / FS   # parabolic peak

if __name__ == "__main__":
    assert abs(c_air(20) - 343.42) < 1e-9 and abs(343.42 * 0.01166 / 2 - 2.002) < 0.001
    worst_thr = worst_cor = 0.0
    for d in np.linspace(0.3, 2.2, 20):
        for amp in (0.05, 0.2, 1.0):                         # weak, medium, strong reflectors
            x = received(d, amp, noise=0.01)
            d_thr = by_threshold(x, 0.04) * c_air(20) / 2
            d_cor = by_correlation(x) * c_air(20) / 2
            worst_thr = max(worst_thr, abs(d_thr - d))
            worst_cor = max(worst_cor, abs(d_cor - d))
    print(f"worst error: threshold {100*worst_thr:.1f} cm, correlation {100*worst_cor:.2f} cm")
    assert worst_cor < 0.01 and worst_thr > 2 * worst_cor
