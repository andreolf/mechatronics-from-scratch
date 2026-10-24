import numpy as np
from scipy import signal

def bearing_frequencies(n_balls, d, D, fr, phi=0.0):
    r = d / D * np.cos(phi)
    return {"BPFO": n_balls / 2 * fr * (1 - r), "BPFI": n_balls / 2 * fr * (1 + r),
            "FTF": fr / 2 * (1 - r), "BSF": D / (2 * d) * fr * (1 - r * r)}

def analytic(x):
    """Analytic signal by the FFT: keep DC and Nyquist, double positive, zero negative."""
    n = len(x)
    X = np.fft.fft(x)
    g = np.zeros(n)
    g[0] = 1
    g[1:(n + 1) // 2] = 2
    if n % 2 == 0:
        g[n // 2] = 1
    return np.fft.ifft(X * g)

def simulate(fs, n, bpfo, fault, rng, f_res=3000.0):
    x = np.zeros(n)
    period = fs / bpfo
    k = 0
    while k * period < n:
        n0 = int(round(k * period + 3 * rng.standard_normal()))       # slip jitter
        m = np.arange(300)
        idx = n0 + m
        ok = (idx >= 0) & (idx < n)
        x[idx[ok]] += fault * np.exp(-m[ok] / 40) * np.sin(2 * np.pi * f_res * m[ok] / fs)
        k += 1
    t = np.arange(n) / fs
    return x + 0.6 * np.sin(2 * np.pi * 25 * t) + 0.5 * rng.standard_normal(n)

def spectrum(x, fs):
    w = np.hanning(len(x))
    return np.fft.rfftfreq(len(x), 1 / fs), np.abs(np.fft.rfft((x - x.mean()) * w))

def envelope_spectrum(x, fs, band=(2000, 4000)):
    sos = signal.butter(4, band, btype="bandpass", fs=fs, output="sos")
    env = np.abs(analytic(signal.sosfiltfilt(sos, x)))
    return spectrum(env, fs)

if __name__ == "__main__":
    f = bearing_frequencies(9, 7.94, 39.0, 25.0)
    print({k: round(v, 2) for k, v in f.items()})
    assert abs(f["BPFO"] - 89.6) < 0.05 and abs(f["BPFI"] - 135.4) < 0.05 and abs(f["BSF"] - 58.9) < 0.05

    x = np.random.default_rng(0).standard_normal(1001)
    assert np.allclose(analytic(x), signal.hilbert(x))                 # matches SciPy

    fs, n, bpfo = 20000.0, 2 ** 15, f["BPFO"]
    rng = np.random.default_rng(16)
    x = simulate(fs, n, bpfo, 1.0, rng)
    fr, R = spectrum(x, fs)
    lo = (fr > 5) & (fr < 500)
    raw_peak = fr[lo][np.argmax(R[lo])]
    fe, E = envelope_spectrum(x, fs)
    env_peak = fe[lo][np.argmax(E[lo])]
    print(f"largest line below 500 Hz: raw {raw_peak:.1f} Hz, envelope {env_peak:.1f} Hz")
    assert abs(raw_peak - 25) < 1                                      # raw: shaft dominates
    assert abs(env_peak - bpfo) < 1.5                                  # envelope: the fault
    assert abs(fe[lo][np.argmax(E[lo] * (fe[lo] > 150))] - 2 * bpfo) < 2.5   # and its harmonic

    # the BPFO line grows with the defect
    def bpfo_level(fault):
        fe, E = envelope_spectrum(simulate(fs, n, bpfo, fault, np.random.default_rng(1)), fs)
        band = np.abs(fe - bpfo) < 2
        ref = (fe > 300) & (fe < 500)
        return 20 * np.log10(E[band].max() / np.median(E[ref]))
    levels = [bpfo_level(a) for a in (0.0, 0.3, 1.0)]
    print("BPFO above floor (dB):", [round(v, 1) for v in levels])
    assert levels[0] < 6 < levels[1] and levels[2] > levels[1] + 6        # healthy: no line; growing defect: rising line
