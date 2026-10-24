import math

def simulate(C, I, f=50.0, vrms=12.0, vd=0.7, full=True, T=0.1, dt=1e-6):
    vp = vrms * math.sqrt(2)
    v, lo, hi, t = vp - (2 if full else 1) * vd, 1e9, 0.0, 0.0
    while t < T:
        s = math.sin(2 * math.pi * f * t)
        src = max(0.0, (abs(s) if full else s) * vp - (2 if full else 1) * vd)
        v -= I / C * dt                       # the load drains the capacitor
        v = max(v, src)                       # the diodes recharge it whenever the input is higher
        if t > 0.04:
            lo, hi = min(lo, v), max(hi, v)
        t += dt
    return hi - lo, lo

if __name__ == "__main__":
    assert abs(12 * math.sqrt(2) - 1.4 - 15.5706) < 1e-4
    for C, est in ((1000e-6, 5.0), (6800e-6, 0.7353)):
        ripple, vmin = simulate(C, 0.5)
        print(f"C = {C*1e6:.0f} uF: ripple {ripple:.3f} V (estimate {est:.3f} V), minimum {vmin:.2f} V")
        assert abs(0.5 / (2 * 50 * C) - est) < 1e-3
        assert 0.7 * est < ripple < est             # the estimate is a little pessimistic
    r_half, _ = simulate(6800e-6, 0.5, full=False)
    r_full, _ = simulate(6800e-6, 0.5)
    assert 1.8 < r_half / r_full < 2.3             # half wave ripples about twice as much
