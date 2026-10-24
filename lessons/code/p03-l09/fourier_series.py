import numpy as np

def coefficients(x, T, K, n=200_000):
    """a0, a_k, b_k (k = 1..K) by numerical projection over one period."""
    t = np.arange(n) * T / n                     # periodic rectangle rule is spectrally accurate
    w0 = 2 * np.pi / T
    xs = x(t)
    a0 = xs.mean()
    a = np.array([2 * np.mean(xs * np.cos(k * w0 * t)) for k in range(1, K + 1)])
    b = np.array([2 * np.mean(xs * np.sin(k * w0 * t)) for k in range(1, K + 1)])
    return a0, a, b

def synth(a0, a, b, t, T):
    w0 = 2 * np.pi / T
    return a0 + sum(a[k - 1] * np.cos(k * w0 * t) + b[k - 1] * np.sin(k * w0 * t) for k in range(1, len(a) + 1))

if __name__ == "__main__":
    T = 1.0
    square = lambda t: np.where((t % T) < T / 2, 1.0, -1.0)
    a0, a, b = coefficients(square, T, 15)
    k = np.arange(1, 16)
    assert np.allclose(b, np.where(k % 2, 4 / (k * np.pi), 0), atol=1e-4)
    assert np.max(np.abs(a)) < 1e-4 and abs(a0) < 1e-4
    # PWM 0..12 V, 25 % duty: amplitudes 2V/(k pi)|sin(k pi d)|
    pwm = lambda t: np.where((t % T) < 0.25 * T, 12.0, 0.0)
    a0, a, b = coefficients(pwm, T, 8)
    c = np.hypot(a, b)
    kk = np.arange(1, 9)
    assert abs(a0 - 3) < 1e-3 and np.allclose(c, 24 / (kk * np.pi) * np.abs(np.sin(kk * np.pi / 4)), atol=1e-3)
    # Gibbs: the overshoot stays near 9 % of the jump as N grows
    t = np.linspace(0, 0.05, 200_001)
    for N, peak in ((99, 1.17901), (999, 1.17898)):
        kk = np.arange(1, N + 1, 2)
        s = (4 / (np.pi * kk)[:, None] * np.sin(2 * np.pi * kk[:, None] * t)).sum(0)
        assert abs(s.max() - peak) < 2e-4, (N, s.max())
    print("square-wave and PWM coefficients match theory; Gibbs peak ~1.179")
