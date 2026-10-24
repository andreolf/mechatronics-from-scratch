import numpy as np
from scipy import signal

N = 1024

def window(kind):
    if kind == "rect":
        return np.ones(N)
    if kind == "hann":
        return signal.get_window("hann", N)
    return signal.get_window("flattop", N)

def peak_amplitude(offset_bins, kind, k0=100):
    w = window(kind)
    n = np.arange(N)
    x = np.sin(2 * np.pi * (k0 + offset_bins) * n / N)
    X = np.fft.rfft(x * w)
    return 2 * np.abs(X).max() / w.sum()                 # coherent-gain corrected

def sidelobe_db(kind):
    W = np.abs(np.fft.rfft(window(kind), 64 * N))
    W /= W[0]
    # end of the main lobe = first local minimum (flat-top's top bulges, so not the first rise)
    first_null = np.where((W[1:-1] < W[:-2]) & (W[1:-1] < W[2:]))[0][0] + 1
    return 20 * np.log10(W[first_null:].max())

if __name__ == "__main__":
    offsets = np.linspace(0, 0.5, 51)
    worst = {k: min(20 * np.log10(peak_amplitude(o, k)) for o in offsets) for k in ("rect", "hann", "flattop")}
    print({k: round(v, 3) for k, v in worst.items()})
    assert abs(worst["rect"] + 3.92) < 0.02 and abs(worst["hann"] + 1.42) < 0.02 and worst["flattop"] > -0.1
    assert abs(20 * np.log10(peak_amplitude(0.3, "rect")) - 20 * np.log10(np.sinc(0.3))) < 0.02
    sl = {k: sidelobe_db(k) for k in ("rect", "hann", "flattop")}
    print({k: round(v, 1) for k, v in sl.items()})
    assert -14 < sl["rect"] < -13 and -32 < sl["hann"] < -31 and sl["flattop"] < -85
    # a tone on a bin doesn't leak with any window
    assert abs(peak_amplitude(0.0, "rect") - 1) < 1e-9
