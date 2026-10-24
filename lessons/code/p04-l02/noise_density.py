import math
import numpy as np

def welford(xs):
    """Numerically stable running mean and sample variance."""
    n, mean, m2 = 0, 0.0, 0.0
    for x in xs:
        n += 1
        d = x - mean
        mean += d / n
        m2 += d * (x - mean)
    return mean, m2 / (n - 1)

def first_order_lowpass(x, fc, fs):
    """Exact discretisation (ZOH pole) of a first-order low-pass."""
    a = math.exp(-2 * math.pi * fc / fs)
    y = np.empty_like(x); acc = 0.0
    for i, v in enumerate(x):
        acc = a * acc + (1 - a) * v
        y[i] = acc
    return y

if __name__ == "__main__":
    rho, fs, fc = 150e-6, 20_000, 100.0          # g/sqrt(Hz), sample rate, filter corner
    rng = np.random.default_rng(7)
    white = rng.standard_normal(400_000) * rho * math.sqrt(fs / 2)
    y = first_order_lowpass(white, fc, fs)[2000:]          # drop the start-up transient
    rms = math.sqrt(np.mean(y**2))
    pred = rho * math.sqrt(math.pi / 2 * fc)
    print(f"simulated {rms*1e6:.0f} ug RMS, predicted {pred*1e6:.0f} ug RMS")
    assert abs(rms - pred) / pred < 0.05
    assert abs(rho * math.sqrt(100) - 1.5e-3) < 1e-12
    m, v = welford(1e9 + rng.standard_normal(20_000))     # big offset, unit noise
    assert abs(v - 1) < 0.05 and abs(m - 1e9) < 0.05
