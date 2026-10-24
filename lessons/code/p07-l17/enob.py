import numpy as np

rng = np.random.default_rng(17)

def adc(x, bits, vref=3.3):
    q = vref / 2**bits
    return np.clip(np.floor(x / q + 0.5), 0, 2**bits - 1) * q

def sinad_db(samples, cycles):
    spec = np.abs(np.fft.rfft(samples - samples.mean())) ** 2
    signal = spec[cycles]
    noise = spec[1:].sum() - signal
    return 10 * np.log10(signal / noise)

def enob(sinad):
    return (sinad - 1.76) / 6.02

if __name__ == "__main__":
    n, cycles, vref = 8192, 997, 3.3                      # prime number of cycles: coherent sampling
    t = np.arange(n)
    for bits in (8, 10, 12, 14, 16):
        q = vref / 2**bits
        x = vref / 2 + (vref / 2 - q) * np.sin(2 * np.pi * cycles * t / n)
        s = sinad_db(adc(x, bits), cycles)
        print(f"{bits:2d} bits: SINAD {s:6.2f} dB (theory {6.02*bits+1.76:6.2f}), ENOB {enob(s):5.2f}")
        assert abs(enob(s) - bits) < 0.1
    # 0.5 mV rms of extra noise on a 12-bit, 3.3 V converter
    q = vref / 4096
    x = vref / 2 + (vref / 2 - q) * np.sin(2 * np.pi * cycles * t / n) + 0.5e-3 * rng.standard_normal(n)
    e = enob(sinad_db(adc(x, 12), cycles))
    assert abs(e - 10.75) < 0.1
    assert abs(np.sqrt(np.mean(rng.uniform(-0.5, 0.5, 1_000_000) ** 2)) - 1 / np.sqrt(12)) < 1e-3
    print(f"with 0.5 mV rms noise: ENOB {e:.2f}")
