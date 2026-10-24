import numpy as np
from scipy import signal

def butter_lowpass(n, fc, fs, prewarp=True):
    wc = 2 * fs * np.tan(np.pi * fc / fs) if prewarp else 2 * np.pi * fc
    k = np.arange(1, n + 1)
    p = wc * np.exp(1j * np.pi * (2 * k + n - 1) / (2 * n))          # analogue poles
    z_poles = (1 + p / (2 * fs)) / (1 - p / (2 * fs))                  # bilinear map
    a = np.real(np.poly(z_poles))
    b = np.real(np.poly(-np.ones(n)))                                   # zeros at z = -1
    b *= a.sum() / b.sum()                                              # unit DC gain
    return b, a

def minus3db(b, a, fs):
    w, H = signal.freqz(b, a, worN=200_000, fs=fs)
    return w[np.argmax(np.abs(H) < 2**-0.5)]

if __name__ == "__main__":
    for n in range(1, 9):
        for fc in (10, 100, 300, 450):
            b, a = butter_lowpass(n, fc, 1000)
            bs, as_ = signal.butter(n, fc, fs=1000)
            assert np.allclose(b, bs, rtol=1e-9, atol=1e-14) and np.allclose(a, as_, rtol=1e-9, atol=1e-12), (n, fc)
    b, a = butter_lowpass(2, 100, 1000)
    print("2nd order at 100 Hz:", b.round(4), a.round(4))
    assert np.allclose(a, [1, -1.1430, 0.4128], atol=1e-4)
    assert np.allclose(np.abs(np.roots(a)), 0.6425, atol=1e-4)
    # without prewarping the cutoff falls short, more so near Nyquist
    for fc in (50, 300):
        f_w, f_nw = minus3db(*butter_lowpass(4, fc, 1000), 1000), minus3db(*butter_lowpass(4, fc, 1000, False), 1000)
        print(f"fc {fc} Hz: prewarped -3 dB at {f_w:.2f} Hz, not prewarped {f_nw:.2f} Hz")
        assert abs(f_w - fc) < 0.01 and f_nw < fc
    assert abs(2000 * np.tan(0.1 * np.pi) - 649.84) < 0.01
