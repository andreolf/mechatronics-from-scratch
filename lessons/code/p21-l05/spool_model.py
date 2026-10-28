import math

def spiral(D0, Df, Lf):
    """Spool diameter grows linearly with line wound on: D(s) = D0 + (Df - D0) s / Lf (metres).
    Returns s(theta) and theta(s), theta in revolutions."""
    k1 = D0 * Lf / (Df - D0)
    k2 = math.pi * (Df - D0) / Lf
    return (lambda th: k1 * (math.exp(k2 * th) - 1)), (lambda s: math.log(s / k1 + 1) / k2)

D0 = 0.072
for name, Df, want_revs, want_err in [("fishing", 0.0731, 32.9, -0.057), ("power", 0.0861, 30.3, -0.651)]:
    wound, revs = spiral(D0, Df, 7.5)
    th = revs(7.5)
    assert abs(wound(th) - 7.5) < 1e-12
    # integrate ds/dtheta = pi D(s) numerically as an independent check of the closed form
    s, n = 0.0, 200000
    for _ in range(n):
        s += math.pi * (D0 + (Df - D0) * s / 7.5) * th / n
    assert abs(s - 7.5) < 1e-3
    err = math.pi * D0 * th - 7.5
    print(f"{name}: {th:.1f} revs for 7.5 m; constant-diameter guess is off by {err * 100:.1f} cm")
    assert abs(th - want_revs) < 0.05 and abs(err - want_err) < 0.001

# torque to tension on the empty and the full power-line spool
assert abs(1 / 0.036 - 27.8) < 0.05 and abs(1 / (0.0861 / 2) - 23.2) < 0.05
rpm = 0.4 / 0.036 * 60 / (2 * math.pi)
assert abs(rpm - 106) < 0.5

def tension(tau_measured, tau_hold, metres_per_rev):
    """Stringman-style estimate: torque with the motor's own friction removed, over the lever arm"""
    return 2 * math.pi * (tau_measured - tau_hold) / metres_per_rev

mpr = math.pi * D0
print(f"0.5 N·m measured, 0.02 N·m hold: {tension(0.5, 0.02, mpr):.2f} N")
print(f"uncertainty from 0.033 N·m of unknown friction: {tension(0.033, 0, mpr):.2f} N")
assert abs(tension(0.5, 0.02, mpr) - 13.33) < 0.01

# what one encoder count is worth
for bits in (12, 14):
    print(f"{bits}-bit encoder on a 72 mm spool: {mpr / 2**bits * 1000:.3f} mm per count")
assert abs(mpr / 4096 * 1000 - 0.055) < 0.001

# desk winch
r = 0.010
assert 0.4 / r == 40 and abs(0.2 / r * 60 / (2 * math.pi) - 191) < 0.5
assert abs(2 * math.pi * r / 3200 * 1000 - 0.0196) < 1e-4 and abs(1.5 / (2 * math.pi * r) - 23.9) < 0.05
print("PASS")
