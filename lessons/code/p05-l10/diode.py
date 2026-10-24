import math

IS, NVT = 1e-14, 0.02585

def diode_i(v):
    return IS * (math.exp(v / NVT) - 1)

def operating_point(V, R, v=0.6, tol=1e-12):
    for k in range(100):
        f = diode_i(v) - (V - v) / R
        df = IS / NVT * math.exp(v / NVT) + 1 / R
        step = f / df
        v -= max(-0.1, min(0.1, step))            # limit the step, as SPICE does
        if abs(step) < tol:
            return v, (V - v) / R, k + 1
    raise RuntimeError("no convergence")

def bisect(V, R, lo=0.0, hi=1.0):
    for _ in range(200):
        mid = (lo + hi) / 2
        if diode_i(mid) - (V - mid) / R > 0:
            hi = mid
        else:
            lo = mid
    return mid

if __name__ == "__main__":
    v, i, iters = operating_point(5.0, 1000.0)
    print(f"V_D = {v:.5f} V, I = {i*1e3:.4f} mA after {iters} Newton steps")
    assert abs(v - 0.692490) < 1e-6 and abs(i - 4.30751e-3) < 1e-8 and iters < 15
    assert abs(bisect(5.0, 1000.0) - v) < 1e-9
    v1 = NVT * math.log(1e-3 / IS + 1)
    v10 = NVT * math.log(1e-2 / IS + 1)
    assert abs(v1 - 0.65474) < 1e-5 and abs((v10 - v1) - NVT * math.log(10)) < 1e-9
    # starting too high without step limiting would overflow math.exp; the limiter copes
    assert abs(operating_point(5.0, 1000.0, v=3.0)[0] - v) < 1e-9
