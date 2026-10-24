import numpy as np

def amplitude_spectrum(x, fs, window=True):
    N = len(x)
    w = 0.5 - 0.5 * np.cos(2 * np.pi * np.arange(N) / N) if window else np.ones(N)
    X = np.fft.rfft(x * w)
    amp = 2 * np.abs(X) / np.sum(w)                # coherent-gain correction
    return np.fft.rfftfreq(N, 1 / fs), amp

if __name__ == "__main__":
    fs, N = 2000, 2048
    t = np.arange(N) / fs
    x = 1.0 * np.sin(2*np.pi*50*t) + 0.4 * np.sin(2*np.pi*100*t) + 0.25 * np.sin(2*np.pi*250*t)
    X = np.fft.fft(x)
    assert abs(np.sum(x**2) - np.sum(np.abs(X)**2) / N) < 1e-9 * np.sum(x**2)      # Parseval
    f, amp = amplitude_spectrum(x, fs)
    peaks = sorted(f[i] for i in np.argsort(amp)[-3:])
    print("strongest bins at", [round(p, 1) for p in peaks], "Hz")
    for target, a in ((50, 1.0), (100, 0.4), (250, 0.25)):
        k = np.argmin(np.abs(f - target))
        assert abs(f[k] - target) < fs / N
        assert abs(amp[k] - a) / a < 0.16                  # Hann scalloping loss is at most 15 %
    assert abs(np.sqrt(np.mean(x**2)) - 0.7818) < 0.003     # RMS from the time domain
    # leakage: the rectangular window spreads far more energy away from 50 Hz
    _, rect = amplitude_spectrum(x, fs, window=False)
    far = (f > 150) & (f < 230)
    assert rect[far].max() > 20 * amp[far].max()
