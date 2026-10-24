import numpy as np

def fractional_delay(x, d):
    """Delay x by d samples (any real d) with an exact FFT phase shift."""
    n = len(x)
    f = np.fft.rfftfreq(n)
    return np.fft.irfft(np.fft.rfft(x) * np.exp(-2j * np.pi * f * d), n)

def xcorr_fft(a, b):
    n = len(a)
    m = 1 << (2 * n - 1).bit_length()                  # pad: no wrap-around
    r = np.fft.irfft(np.fft.rfft(b, m) * np.conj(np.fft.rfft(a, m)), m)
    lags = np.r_[np.arange(0, n), np.arange(-n + 1, 0)]
    r = np.r_[r[:n], r[m - n + 1:]]
    order = np.argsort(lags)
    return lags[order], r[order]

def estimate_delay(a, b, max_lag):
    lags, r = xcorr_fft(a, b)
    keep = np.abs(lags) <= max_lag
    lags, r = lags[keep], r[keep]
    i = int(np.argmax(r))
    y0, y1, y2 = r[i - 1], r[i], r[i + 1]
    return lags[i] + 0.5 * (y0 - y2) / (y0 - 2 * y1 + y2)

if __name__ == "__main__":
    rng = np.random.default_rng(15)
    n = 4096
    # band-limited source: white noise through a gentle low-pass
    src = np.convolve(rng.standard_normal(n + 64), np.hanning(9), mode="same")[:n]
    src /= src.std()
    noise = 10 ** (-10 / 20)                            # 10 dB SNR per channel
    # check FFT correlation against the direct sum
    a0, b0 = rng.standard_normal(50), rng.standard_normal(50)
    lags, r = xcorr_fft(a0, b0)
    direct = [sum(b0[k + j] * a0[j] for j in range(50) if 0 <= k + j < 50) for k in lags]
    assert np.allclose(r, direct)
    worst = 0
    for d in np.linspace(-6, 6, 49):
        a = src + noise * rng.standard_normal(n)
        b = fractional_delay(src, d) + noise * rng.standard_normal(n)
        worst = max(worst, abs(estimate_delay(a, b, 28) - d))
    print(f"worst delay error over 49 delays at 10 dB SNR: {worst:.3f} samples")
    assert worst < 0.1
    # worked example
    D = 10 + 0.5 * (0.80 - 0.92) / (0.80 - 2 + 0.92)
    theta = np.degrees(np.arcsin(D / 48000 * 343 / 0.20))
    assert abs(D - 10.214) < 1e-3 and abs(theta - 21.4) < 0.1
