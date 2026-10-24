import numpy as np
from scipy import signal

def welch_psd(x, fs, nperseg=256, overlap=0.5):
    step = int(nperseg * (1 - overlap))
    w = 0.5 - 0.5 * np.cos(2 * np.pi * np.arange(nperseg) / nperseg)       # periodic Hann, as scipy uses
    scale = 1.0 / (fs * np.sum(w ** 2))
    starts = range(0, len(x) - nperseg + 1, step)
    P = np.zeros(nperseg // 2 + 1)
    for s in starts:
        seg = x[s:s + nperseg]
        X = np.fft.rfft((seg - seg.mean()) * w)
        P += np.abs(X) ** 2 * scale
    P /= len(starts)
    P[1:-1] *= 2                                                           # one-sided: fold negative frequencies
    return np.fft.rfftfreq(nperseg, 1 / fs), P, len(starts)

if __name__ == "__main__":
    rng = np.random.default_rng(10)
    fs = 1000.0
    t = np.arange(10_000) / fs
    x = 0.1 * rng.standard_normal(t.size) + 0.05 * np.sin(2 * np.pi * 120 * t)
    f, P, K = welch_psd(x, fs)
    fs_ref, P_ref = signal.welch(x, fs, nperseg=256)
    assert K == 77 and np.allclose(f, fs_ref) and np.allclose(P, P_ref, rtol=1e-10)
    floor = np.median(P[(f > 20) & (np.abs(f - 120) > 20)])
    print(f"{K} segments, noise floor {floor:.2e} (theory 2.0e-05), tone peak at {f[np.argmax(P)]:.1f} Hz")
    assert abs(floor - 2e-5) / 2e-5 < 0.1 and abs(f[np.argmax(P)] - 120) < 4
    # Parseval: integrating the PSD of pure noise returns the variance
    n = 0.1 * rng.standard_normal(100_000)
    f2, P2, _ = welch_psd(n, fs)
    assert abs(np.trapezoid(P2, f2) - n.var()) / n.var() < 0.03
    # averaging tames the scatter: one segment vs many
    one = welch_psd(n[:256], fs)[1][5:-5]
    many = P2[5:-5]
    assert one.std() / one.mean() > 0.6 and many.std() / many.mean() < 0.1
