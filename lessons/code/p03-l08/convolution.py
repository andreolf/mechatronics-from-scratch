import numpy as np

def conv_loop(h, u):
    """Direct convolution, O(N*M): y[n] = sum_k h[k] u[n-k]."""
    y = np.zeros(len(h) + len(u) - 1)
    for n in range(len(y)):
        for k in range(max(0, n - len(u) + 1), min(n, len(h) - 1) + 1):
            y[n] += h[k] * u[n - k]
    return y

def conv_fft(h, u):
    """Zero-pad to avoid circular wrap-around, multiply spectra, invert."""
    n = len(h) + len(u) - 1
    N = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(h, N) * np.fft.rfft(u, N), N)[:n]

if __name__ == "__main__":
    rng = np.random.default_rng(1)
    a, b = rng.standard_normal(300), rng.standard_normal(200)
    assert np.max(np.abs(conv_loop(a, b) - conv_fft(a, b))) < 1e-10
    assert np.allclose(conv_loop(a, b), np.convolve(a, b), atol=1e-12)
    # RC filter driven by a 1 s pulse, dt = 1 ms
    dt, tau = 1e-3, 0.5
    t = np.arange(0, 4, dt)
    h = np.exp(-t / tau) / tau
    u = (t < 1).astype(float)
    y = conv_fft(h, u)[: len(t)] * dt
    exact = np.where(t < 1, 1 - np.exp(-t / tau), (1 - np.exp(-2)) * np.exp(-(t - 1) / tau))
    err = np.max(np.abs(y - exact))
    print(f"y(1) = {y[999]:.4f}, y(2) = {y[1999]:.4f}, max error vs exact {err:.2e}")
    assert err < 2.1e-3                      # rectangle-rule error is O(dt)
    assert abs(exact[1500] - 0.3181) < 1e-4 and abs(exact[2000] - 0.1170) < 1e-4
