import math
import numpy as np

def z_cap(f, C, esr, esl):
    w = 2 * math.pi * f
    return esr + 1j * (w * esl - 1 / (w * C))

def parallel(*zs):
    return 1 / sum(1 / z for z in zs)

if __name__ == "__main__":
    C, esr, esl = 100e-9, 0.05, 1e-9
    srf = 1 / (2 * math.pi * math.sqrt(esl * C))
    assert abs(srf - 15.915e6) < 1e3
    assert abs(abs(z_cap(srf, C, esr, esl)) - esr) < 1e-9
    z100 = abs(z_cap(100e6, C, esr, esl))
    z2 = abs(parallel(z_cap(100e6, C, esr, esl), z_cap(100e6, C, esr, esl)))
    print(f"|Z| at 100 MHz: one cap {z100:.3f} ohm, two in parallel {z2:.3f} ohm")
    assert abs(z100 - 0.6144) < 1e-3 and abs(z2 - z100 / 2) < 1e-9
    assert abs(0.1 * 10e-9 / C - 0.010) < 1e-12               # droop during a 10 ns, 100 mA spike
    # minimum of |Z| over frequency is at the SRF and equals ESR
    f = np.logspace(5, 9, 40_001)
    zs = np.abs(z_cap(f, C, esr, esl))
    assert abs(f[np.argmin(zs)] / srf - 1) < 1e-3
    # ground shift from a shared return
    assert abs(2.0 * 0.020 / (3.3 / 4096) - 49.6) < 0.1
