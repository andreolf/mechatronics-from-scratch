import numpy as np
from scipy import signal

FS, BITS, FP = 1000.0, 12, 100.0

def attenuation_db(order, fc, f):
    b, a = signal.butter(order, 2 * np.pi * fc, analog=True)
    _, h = signal.freqs(b, a, worN=[2 * np.pi * f])
    return -20 * np.log10(abs(h[0]))

def aliased_amplitude_lsb(order, fc, f_tone, amp=1.0):
    """Sample a filtered full-scale tone (steady state) at FS, quantise, and measure what lands in-band."""
    b, a = signal.butter(order, 2 * np.pi * fc, analog=True)
    _, h = signal.freqs(b, a, worN=[2 * np.pi * f_tone])
    n = np.arange(4000)
    x = amp * abs(h[0]) * np.sin(2 * np.pi * f_tone * n / FS + np.angle(h[0]))
    lsb = 2 * amp / 2**BITS
    q = np.round(x / lsb) * lsb
    spec = np.abs(np.fft.rfft(q * np.hanning(len(q)))) / (len(q) / 4)   # amplitude, Hann-corrected
    f_alias = abs(f_tone - FS * round(f_tone / FS))
    k = int(round(f_alias / FS * len(q)))
    return spec[k - 2:k + 3].max() / lsb, f_alias

if __name__ == "__main__":
    need = 20 * np.log10(2 ** (BITS - 1))
    assert abs(need - 66.23) < 0.01
    orders = {n: attenuation_db(n, FP, FS - FP) for n in range(1, 7)}
    best = min(n for n, att in orders.items() if att >= need)
    print({n: round(v, 1) for n, v in orders.items()}, "-> minimum order", best)
    assert best == 4 and abs(orders[4] - 76.3) < 0.1
    amp4, fa = aliased_amplitude_lsb(4, FP, 900.0)
    amp2, _ = aliased_amplitude_lsb(2, FP, 900.0)
    print(f"900 Hz full-scale tone aliases to {fa:.0f} Hz: {amp4:.2f} LSB with 4th order, {amp2:.1f} LSB with 2nd order")
    assert fa == 100 and amp4 < 1 and amp2 > 1
    assert attenuation_db(2, FP, 9900) > 79
