import itertools
import math

def diff_amp(v1, v2, R1, R2, R3, R4):
    return v2 * R4 / (R3 + R4) * (1 + R2 / R1) - v1 * R2 / R1

def cmrr_worst(G, tol, R=10e3):
    worst = math.inf
    for s in itertools.product((-1, 1), repeat=4):
        R1, R2, R3, R4 = (R * (1 + k * tol) * (G if i in (1, 3) else 1) for i, k in enumerate(s))
        gd = diff_amp(-0.5, 0.5, R1, R2, R3, R4)
        gcm = abs(diff_amp(1, 1, R1, R2, R3, R4))
        worst = min(worst, gd / gcm if gcm else math.inf)
    return worst

if __name__ == "__main__":
    assert abs(diff_amp(2.5, 2.51, 10e3, 10e3, 10e3, 10e3) - 0.01) < 1e-12
    c1 = cmrr_worst(1, 0.01)
    c100 = cmrr_worst(100, 0.01)
    print(f"difference amp, 1 % parts: CMRR {c1:.1f} ({20*math.log10(c1):.1f} dB) at G=1, {c100:.0f} at G=100")
    assert abs(c1 / (2 / 0.04) - 1) < 0.03 and abs(c100 / (101 / 0.04) - 1) < 0.03
    G = 1 + 49.4e3 / 499
    assert abs(G - 99.998) < 1e-3
    hum_out = G * 1.0 * 10 ** (-100 / 20)
    assert abs(hum_out - 1e-3) < 1e-6
    assert abs(G * 1.0 / c100 - 0.0396) < 0.002       # the plain difference amp lets ~40 mV through
