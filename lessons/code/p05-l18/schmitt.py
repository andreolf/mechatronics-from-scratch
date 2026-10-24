import math
import numpy as np

def thresholds(vref, vh, vl, r1, r2):
    k = r1 / (r1 + r2)
    return vref + (vl - vref) * k, vref + (vh - vref) * k

def comparator(x, lo, hi):
    """Non-inverting-sense comparator with hysteresis: output 1 above hi, 0 below lo, else holds."""
    out, state = np.empty(len(x), dtype=int), int(x[0] > (lo + hi) / 2)
    for i, v in enumerate(x):
        if state and v < lo:
            state = 0
        elif not state and v > hi:
            state = 1
        out[i] = state
    return out

def edges(y):
    return int(np.sum(np.abs(np.diff(y))))

if __name__ == "__main__":
    lo, hi = thresholds(2.5, 5.0, 0.0, 10e3, 100e3)
    assert abs(lo - 2.272727) < 1e-6 and abs(hi - 2.727273) < 1e-6
    rng = np.random.default_rng(18)
    t = np.linspace(0, 3, 6000)                         # three periods: six true crossings
    clean = np.sin(2 * math.pi * t + 0.3)
    x = clean + 0.15 * rng.standard_normal(t.size)
    counts = {h: edges(comparator(x, -h / 2, h / 2)) for h in (0.0, 0.2, 0.5, 1.0)}
    print("edges by hysteresis width:", counts)
    assert edges(comparator(clean, 0, 0)) == 6
    assert counts[0.0] > 30 and counts[0.0] > counts[0.2] > counts[0.5] >= counts[1.0] == 6
