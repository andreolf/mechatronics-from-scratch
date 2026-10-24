import math
import numpy as np
from scipy import signal

def lowpass(f, R, C):
    return 1 / (1 + 1j * 2 * math.pi * f * R * C)

if __name__ == "__main__":
    R, C = 3.3e3, 100e-9
    fc = 1 / (2 * math.pi * R * C)
    assert abs(fc - 482.29) < 0.01
    assert abs(20 * math.log10(abs(lowpass(fc, R, C))) + 3.0103) < 1e-4
    assert abs(math.degrees(np.angle(lowpass(fc, R, C))) + 45) < 1e-9
    H5k = abs(lowpass(5000, R, C))
    print(f"fc = {fc:.1f} Hz, |H(5 kHz)| = {H5k:.4f} ({20*math.log10(H5k):.2f} dB)")
    assert abs(H5k - 0.09601) < 1e-5
    # slope far above fc is -20 dB/decade
    d = 20 * math.log10(abs(lowpass(1e6, R, C))) - 20 * math.log10(abs(lowpass(1e5, R, C)))
    assert abs(d + 20) < 0.01
    # agrees with scipy
    w = 2 * math.pi * np.logspace(1, 5, 50)
    _, Hs = signal.freqresp(signal.TransferFunction([1], [R * C, 1]), w)
    assert np.allclose(Hs, lowpass(w / (2 * math.pi), R, C))
    # unbuffered cascade of two identical stages: poles at 0.382 fc and 2.618 fc
    tau = R * C
    poles = np.roots([tau**2, 3 * tau, 1])
    assert np.allclose(sorted(-poles * tau), [0.381966, 2.618034], atol=1e-6)
