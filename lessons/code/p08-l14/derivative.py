import numpy as np
from scipy import signal

def finite_difference(x, T):
    return np.diff(x, prepend=x[0]) / T

def filtered_derivative(x, T, tau):
    a = np.exp(-T / tau)                       # matched first-order low-pass
    return signal.lfilter([1 - a], [1, -a], finite_difference(x, T))

def savgol_slope(x, T, M):
    k = np.arange(-M, M + 1)
    taps = k / (T * np.sum(k * k))
    return np.convolve(x, taps[::-1], mode="same")   # correlation with k: centred, zero phase

if __name__ == "__main__":
    fs, sigma = 200.0, 0.01
    T = 1 / fs
    t = np.arange(4000) * T
    rng = np.random.default_rng(3)
    x = np.sin(2 * np.pi * t) + sigma * rng.standard_normal(len(t))

    def rms_error(d, delay):
        s = slice(50, -50)
        return np.sqrt(np.mean((d[s] - 2 * np.pi * np.cos(2 * np.pi * (t[s] - delay))) ** 2))

    e_fd = rms_error(finite_difference(x, T), T / 2)
    e_f = rms_error(filtered_derivative(x, T, 0.02), 0.02 + T / 2)
    e_sg = rms_error(savgol_slope(x, T, 7), 0)
    print(f"rms error: finite difference {e_fd:.2f}, filtered {e_f:.2f}, Savitzky-Golay {e_sg:.3f}")
    assert abs(e_fd - np.sqrt(2) * sigma / T) / (np.sqrt(2) * sigma / T) < 0.05
    assert e_fd / e_f > 5 and e_fd / e_sg > 5
    assert abs(e_sg - sigma / (T * np.sqrt(280))) < 0.02
    # our SG slope equals scipy's quadratic Savitzky-Golay derivative away from the edges
    ref = signal.savgol_filter(x, 15, 2, deriv=1, delta=T)
    assert np.allclose(savgol_slope(x, T, 7)[10:-10], ref[10:-10], atol=1e-9)
