import cmath
import math
import numpy as np

def z_c(C, w):
    return 1 / (1j * w * C)

def z_l(L, w):
    return 1j * w * L

if __name__ == "__main__":
    w = 2 * math.pi * 1000
    R, C, V = 1000.0, 100e-9, 5.0
    Z = R + z_c(C, w)
    I = V / Z
    Vc = I * z_c(C, w)
    assert abs(abs(Z) - 1879.635) < 1e-3 and abs(math.degrees(cmath.phase(I)) - 57.858) < 1e-3
    assert abs(abs(Vc) - 4.23367) < 1e-5 and abs(abs(I * R + Vc) - V) < 1e-12
    P = 0.5 * V * abs(I) * math.cos(cmath.phase(I))
    assert abs(P - 0.5 * abs(I) ** 2 * R) < 1e-12
    # time-domain check: integrate RC dv/dt = Vs - v and measure the steady-state amplitude
    dt, T = 1e-7, 0.01
    t = np.arange(0, T, dt)
    vs = V * np.sin(w * t)
    v = np.zeros_like(t)
    for k in range(len(t) - 1):
        v[k + 1] = v[k] + dt * (vs[k] - v[k]) / (R * C)
    amp = (v[t > 0.008].max() - v[t > 0.008].min()) / 2
    print(f"|Vc| phasor {abs(Vc):.4f} V, simulated {amp:.4f} V")
    assert abs(amp - abs(Vc)) < 5e-3
