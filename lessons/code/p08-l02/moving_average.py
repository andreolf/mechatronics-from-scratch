import numpy as np
from collections import deque

class MovingAverage:
    def __init__(self, n):
        self.n, self.buf, self.sum = n, deque([0.0] * n, maxlen=n), 0.0
    def __call__(self, x):
        self.sum += x - self.buf[0]
        self.buf.append(x)
        return self.sum / self.n

def dirichlet(f, n):                                   # f in cycles per sample
    w = 2 * np.pi * f
    return np.abs(np.sin(n * w / 2) / (n * np.sin(w / 2))) if f else 1.0

if __name__ == "__main__":
    rng = np.random.default_rng(2)
    x = rng.standard_normal(5000)
    n = 20
    ma = MovingAverage(n)
    y = np.array([ma(v) for v in x])
    ref = np.convolve(x, np.ones(n) / n)[:len(x)]
    assert np.allclose(y, ref)
    # frequency response from the impulse response matches the closed form
    H = np.fft.rfft(np.ones(n) / n, 4096)
    f = np.arange(len(H)) / 4096
    assert np.allclose(np.abs(H[1:]), [dirichlet(v, n) for v in f[1:]], atol=1e-9)
    # 50 Hz at fs = 1 kHz is nulled, and the delay is (N-1)/2 samples
    t = np.arange(4000) / 1000
    hum = np.sin(2 * np.pi * 50 * t)
    ma = MovingAverage(n)
    out = np.array([ma(v) for v in hum])
    assert np.abs(out[n:]).max() < 1e-9
    slow = np.sin(2 * np.pi * 1 * t)
    ma = MovingAverage(n)
    out = np.array([ma(v) for v in slow])
    lag = np.argmax(np.correlate(out[1000:3000], slow[1000:3000], "full")) - 1999
    assert abs(lag - 9.5) <= 0.5
    assert abs(np.var(y[n:]) - 1 / n) < 0.01
    f3 = next(v for v in np.linspace(0.0001, 0.5, 200000) if dirichlet(v, n) < 2**-0.5)
    print(f"N = {n}: output variance {np.var(y[n:]):.4f} (1/N = {1/n}), -3 dB at {f3*n:.3f} fs/N, 50 Hz nulled")
    assert abs(f3 * n - 0.443) < 0.003
