import math
import numpy as np
from scipy import signal

L, C, R = 10e-3, 1e-6, 20.0

def params(R, L, C):
    wn = 1 / math.sqrt(L * C)
    zeta = R / 2 * math.sqrt(C / L)
    return wn, zeta, 1 / (2 * zeta)

if __name__ == "__main__":
    wn, zeta, Q = params(R, L, C)
    assert abs(wn - 1e4) < 1e-9 and abs(zeta - 0.1) < 1e-12 and abs(Q - 5) < 1e-12
    sys = signal.TransferFunction([1], [L * C, R * C, 1])
    t = np.linspace(0, 3e-3, 30001)
    _, y = signal.step(sys, T=t)
    os_sim, tp_sim = y.max() - 1, t[np.argmax(y)]
    os_th = math.exp(-math.pi * zeta / math.sqrt(1 - zeta**2))
    print(f"overshoot {100*os_sim:.2f} % (theory {100*os_th:.2f} %), peak at {tp_sim*1e3:.4f} ms")
    assert abs(os_sim - os_th) < 1e-4 and abs(tp_sim - math.pi / (wn * math.sqrt(1 - zeta**2))) < 1e-6
    # at resonance the capacitor voltage is Q times the source
    w = wn
    H = 1 / (L * C * (1j * w) ** 2 + R * C * (1j * w) + 1)
    assert abs(abs(H) - Q) < 1e-9
    # R for zeta = 0.7
    assert abs(2 * 0.7 * math.sqrt(L / C) - 140) < 1e-9
