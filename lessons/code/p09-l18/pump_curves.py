import numpy as np
from scipy.optimize import brentq

H0, K, RHO, G, ETA = 20.0, 0.08, 1000.0, 9.81, 0.6

def pump_head(Q, n=1.0):
    return n * n * H0 - K * Q * Q

def operating_point(n, Hs, r):
    f = lambda Q: pump_head(Q, n) - (Hs + r * Q * Q)
    if f(0.0) <= 0:
        return 0.0, Hs                                  # can't lift the water at all
    Q = brentq(f, 0.0, 100.0)
    return Q, Hs + r * Q * Q

def shaft_power(Q, H):
    return RHO * G * (Q / 3600) * H / ETA               # Q in m3/h, H in m, P in W

if __name__ == "__main__":
    # affinity laws hold exactly for a pure-friction system (Hs = 0)
    Q1, H1 = operating_point(1.0, 0.0, 0.04); P1 = shaft_power(Q1, H1)
    for n in (0.5, 0.7, 0.9):
        Q, H = operating_point(n, 0.0, 0.04)
        assert abs(Q / Q1 - n) < 1e-9 and abs(H / H1 - n * n) < 1e-9 and abs(shaft_power(Q, H) / P1 - n ** 3) < 1e-9
    # with a 6 m static lift, flow falls faster than speed
    Qf, Hf = operating_point(1.0, 6.0, 0.04)
    Qh, _ = operating_point(0.8, 6.0, 0.04)
    print(f"full speed {Qf:.2f} m3/h at {Hf:.2f} m, {shaft_power(Qf, Hf):.0f} W; 80 % speed {Qh:.2f} m3/h")
    assert Qh < 0.8 * Qf and operating_point(np.sqrt(6 / 20) * 0.99, 6.0, 0.04)[0] == 0.0
    # deliver 7 m3/h: throttle valve versus VFD
    Qt = 7.0
    P_throttle = shaft_power(Qt, pump_head(Qt))
    n = np.sqrt((6.0 + (K + 0.04) * Qt * Qt) / H0)
    Qv, Hv = operating_point(n, 6.0, 0.04)
    P_vfd = shaft_power(Qv, Hv)
    print(f"7 m3/h: throttled {P_throttle:.0f} W, VFD at {100*n:.1f} % speed {P_vfd:.0f} W")
    assert abs(Qv - Qt) < 1e-9 and P_vfd < 0.55 * P_throttle
    assert abs(shaft_power(Qf, Hf) - 523) < 1 and abs(P_throttle - 511) < 1 and abs(P_vfd - 253) < 1
