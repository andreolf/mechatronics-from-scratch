import math
import numpy as np

A0, GBW = 1e5, 1e6
FP = GBW / A0                                       # dominant pole at 10 Hz

def A(f):
    return A0 / (1 + 1j * f / FP)

def closed_loop(f, beta):
    a = A(f)
    return a / (1 + a * beta)

if __name__ == "__main__":
    g0 = closed_loop(0, 0.1)
    assert abs(g0.real - 9.99900) < 1e-5
    g10k = closed_loop(1e4, 0.1)
    print(f"|G(10 kHz)| = {abs(g10k):.4f}, phase {math.degrees(np.angle(g10k)):.2f} deg")
    assert abs(abs(g10k) - 9.9494) < 1e-3 and abs(math.degrees(np.angle(g10k)) + 5.71) < 0.01
    # find the -3 dB frequency numerically and compare with GBW/G
    f = np.logspace(3, 7, 200_000)
    mag = np.abs(closed_loop(f, 0.1))
    f3 = f[np.argmin(np.abs(mag - abs(g0) / math.sqrt(2)))]
    assert abs(f3 / 1e5 - 1) < 0.01
    # gain 100 -> 10 kHz
    mag100 = np.abs(closed_loop(f, 0.01))
    f3_100 = f[np.argmin(np.abs(mag100 - abs(closed_loop(0, 0.01)) / math.sqrt(2)))]
    assert abs(f3_100 / 1e4 - 1) < 0.01
    assert abs(1e-3 / 0.1 - 0.01) < 1e-15            # offset times noise gain
