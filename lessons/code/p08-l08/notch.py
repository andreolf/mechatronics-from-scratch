import numpy as np
from scipy import signal

def notch(f0, fs, r):
    w0 = 2 * np.pi * f0 / fs
    b = np.array([1, -2 * np.cos(w0), 1.0])
    a = np.array([1, -2 * r * np.cos(w0), r * r])
    return b * (a.sum() / b.sum()), a                     # unity gain at DC

def gain_db(b, a, f, fs):
    _, H = signal.freqz(b, a, worN=[f], fs=fs)
    return 20 * np.log10(np.abs(H[0]) + 1e-300)

def bandwidth(b, a, fs, f0):
    f = np.linspace(f0 - 60, f0 + 60, 120_001)
    _, H = signal.freqz(b, a, worN=f, fs=fs)
    below = f[np.abs(H) < 2**-0.5]
    return below.max() - below.min()

if __name__ == "__main__":
    fs, f0, r = 1000.0, 120.0, 0.95
    b, a = notch(f0, fs, r)
    assert np.allclose(a, [1, -1.38504, 0.9025], atol=1e-5)
    depth = gain_db(b, a, f0, fs)
    bw = bandwidth(b, a, fs, f0)
    print(f"depth at 120 Hz {depth:.0f} dB, -3 dB width {bw:.2f} Hz (estimate {(1-r)*fs/np.pi:.2f}), at 100 Hz {gain_db(b, a, 100, fs):.2f} dB")
    assert depth < -30 and abs(bw - (1 - r) * fs / np.pi) < 1.0
    assert gain_db(b, a, 121, fs) < -15 and gain_db(b, a, 122, fs) < -12 and gain_db(b, a, 10, fs) > -0.1
    # scipy's iirnotch with Q = f0 / bandwidth gives (nearly) the same filter
    bs, as_ = signal.iirnotch(f0, f0 / ((1 - r) * fs / np.pi), fs=fs)
    assert np.allclose(as_, a, atol=5e-3)
    # remove a 120 Hz resonance riding on a 5 Hz signal
    t = np.arange(4000) / fs
    x = np.sin(2 * np.pi * 5 * t) + 0.5 * np.sin(2 * np.pi * 120 * t)
    y = signal.lfilter(b, a, x)
    resid = y[1000:] - np.sin(2 * np.pi * 5 * t[1000:])
    assert np.abs(resid).max() < 0.02
