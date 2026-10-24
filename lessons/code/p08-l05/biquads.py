import numpy as np
from scipy import signal

def biquad_df2t(b, a, x):
    s1 = s2 = 0.0
    y = np.empty(len(x))
    for n, xn in enumerate(x):
        yn = b[0] * xn + s1
        s1 = b[1] * xn - a[1] * yn + s2
        s2 = b[2] * xn - a[2] * yn
        y[n] = yn
    return y

def sos_filter(sos, x):
    for sec in sos:
        x = biquad_df2t(sec[:3], sec[3:], x)
    return x

def quantise(c, frac_bits):
    return np.round(np.asarray(c) * 2**frac_bits) / 2**frac_bits

if __name__ == "__main__":
    rng = np.random.default_rng(5)
    x = rng.standard_normal(3000)
    sos = signal.butter(6, 0.2, output="sos")
    y = sos_filter(sos, x)
    err = np.abs(y - signal.sosfilt(sos, x)).max()
    print(f"6th-order cascade vs scipy sosfilt: max difference {err:.2e}")
    assert err < 1e-12
    # quantisation sensitivity: 8th-order low-pass at 0.02 fs, coefficients on a 2^-12 grid
    b, a = signal.butter(8, 0.04)
    sos8 = signal.butter(8, 0.04, output="sos")
    r_tf = np.abs(np.roots(quantise(a, 12))).max()
    r_sos = max(np.abs(np.roots(quantise(sec[3:], 12))).max() for sec in sos8)
    print(f"largest pole radius after rounding to 12 fraction bits: direct form {r_tf:.4f}, cascade {r_sos:.4f}")
    assert r_tf > 1.0 and r_sos < 1.0
    # the quantised cascade still matches the ideal response closely in the passband
    q = sos8.copy()
    q[:, 3:] = quantise(sos8[:, 3:], 12)              # feedback coefficients rounded; gains kept exact
    w, H = signal.sosfreqz(sos8, worN=2048)
    _, Hq = signal.sosfreqz(q, worN=2048)
    band = w < 0.03 * np.pi
    assert np.abs(np.abs(Hq[band]) - np.abs(H[band])).max() < 0.1
    assert np.abs(a).max() > 50
    assert np.abs(np.roots(quantise(a, 20))).max() > 1.0  # even 20 fraction bits can't save the direct form
