import numpy as np
from scipy import signal

def fir_lowpass(n_taps, fc, window):
    m = (n_taps - 1) / 2
    k = np.arange(n_taps) - m
    h = 2 * fc * np.sinc(2 * fc * k)                    # np.sinc(x) = sin(pi x)/(pi x)
    h *= window
    return h / h.sum()                                   # unity gain at DC

def hamming(n):
    return 0.54 - 0.46 * np.cos(2 * np.pi * np.arange(n) / (n - 1))

def kaiser(n, beta):
    m = (n - 1) / 2
    return np.i0(beta * np.sqrt(1 - ((np.arange(n) - m) / m) ** 2)) / np.i0(beta)

def kaiser_design(atten_db, df):
    beta = 0.1102 * (atten_db - 8.7) if atten_db > 50 else 0.5842 * (atten_db - 21) ** 0.4 + 0.07886 * (atten_db - 21)
    n = int(np.ceil((atten_db - 8) / (2.285 * 2 * np.pi * df) + 1)) | 1
    return n, beta

def stopband_db(h, f_stop):
    w, H = signal.freqz(h, worN=8192, fs=1.0)
    return 20 * np.log10(np.abs(H[w >= f_stop]).max())

def passband_ripple_db(h, f_pass):
    w, H = signal.freqz(h, worN=8192, fs=1.0)
    g = 20 * np.log10(np.abs(H[w <= f_pass]))
    return g.max() - g.min()

if __name__ == "__main__":
    n, beta = kaiser_design(60, 0.05)
    print("Kaiser design:", n, "taps, beta", round(beta, 3))
    assert n == 75 and abs(beta - 5.653) < 1e-3
    hk = fir_lowpass(n, 0.125, kaiser(n, beta))
    assert np.allclose(hk, signal.firwin(n, 0.25, window=("kaiser", beta)), atol=1e-12)
    sb, pr = stopband_db(hk, 0.15), passband_ripple_db(hk, 0.10)
    print(f"Kaiser: stopband {sb:.1f} dB, passband ripple {pr:.3f} dB")
    assert sb <= -60 and pr < 0.02
    hh = fir_lowpass(n, 0.125, hamming(n))
    assert np.allclose(hh, signal.firwin(n, 0.25, window="hamming"), atol=1e-12)
    ham = stopband_db(hh, 0.15)
    rect = stopband_db(fir_lowpass(n, 0.125, np.ones(n)), 0.15)
    print(f"same 75 taps: Hamming {ham:.1f} dB, rectangular {rect:.1f} dB: neither meets 60 dB")
    assert -60 < ham < -50 and rect > -30
    assert np.allclose(hk, hk[::-1])                     # symmetric: linear phase
