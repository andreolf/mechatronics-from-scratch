import numpy as np
from scipy.sparse.csgraph import dijkstra

# Illustrative rule table, NOT from the standard: use the actual IEC 60664-1 / IEC 62368-1 tables for your pollution
# degree, material group, overvoltage category and altitude. (working voltage V, insulation) -> (clearance, creepage) mm
RULES = {(50, "functional"): (0.2, 0.6), (250, "functional"): (1.0, 1.5),
         (250, "basic"): (2.0, 2.5), (250, "reinforced"): (4.0, 5.0)}
BOARD = (0, 0, 32, 20)                               # board outline (mm)
OUTSIDE = [(-50, -50, 82, 0), (-50, 20, 82, 70), (-50, 0, 0, 20), (32, 0, 82, 20)]
MIN_SLOT = 1.0                                       # illustrative: narrower slots do not count for creepage

def rect_dist(a, b):
    dx = max(b[0] - a[2], a[0] - b[2], 0); dy = max(b[1] - a[3], a[1] - b[3], 0); return float(np.hypot(dx, dy))

def crosses(p, q, r, eps=1e-9):
    """does segment p-q pass through the open interior of rectangle r (Liang-Barsky clipping)?"""
    x0, y0, x1, y1 = r[0] + eps, r[1] + eps, r[2] - eps, r[3] - eps; t0, t1 = 0.0, 1.0; d = (q[0] - p[0], q[1] - p[1])
    for pk, qk in ((-d[0], p[0] - x0), (d[0], x1 - p[0]), (-d[1], p[1] - y0), (d[1], y1 - p[1])):
        if pk == 0:
            if qk < 0: return False
        else:
            t = qk / pk
            if pk < 0: t0 = max(t0, t)
            else: t1 = min(t1, t)
            if t0 > t1: return False
    return t1 - t0 > 1e-9

def perimeter_points(r, n=24):
    x0, y0, x1, y1 = r; s = np.linspace(0, 1, n, endpoint=False)
    return ([(x0 + (x1 - x0) * u, y0) for u in s] + [(x1, y0 + (y1 - y0) * u) for u in s] +
            [(x1 - (x1 - x0) * u, y1) for u in s] + [(x0, y1 - (y1 - y0) * u) for u in s])

def creepage(a, b, slots):
    """shortest path along the board surface from pad a to pad b, going around slots (visibility graph + Dijkstra)."""
    slots = [s for s in slots if min(s[2] - s[0], s[3] - s[1]) >= MIN_SLOT]
    if not slots: return rect_dist(a, b)
    slots = slots + OUTSIDE                                                              # the path cannot leave the board
    corners = [(s[i], s[j]) for s in slots for i, j in ((0, 1), (2, 1), (2, 3), (0, 3))]
    A = perimeter_points(a); Bp = perimeter_points(b); nodes = A + Bp + corners; n = len(nodes)
    W = np.zeros((n, n))                                                                 # 0 means no edge
    for i in range(n):
        for j in range(i + 1, n):
            if (i < len(A) and j < len(A)) or (len(A) <= i < len(A) + len(Bp) and len(A) <= j < len(A) + len(Bp)): continue
            if not any(crosses(nodes[i], nodes[j], s) for s in slots):
                W[i, j] = W[j, i] = np.hypot(nodes[i][0] - nodes[j][0], nodes[i][1] - nodes[j][1]) + 1e-12
    dist = dijkstra(W, directed=False, indices=list(range(len(A))), min_only=True)        # from any point on pad a
    return float(dist[len(A):len(A) + len(Bp)].min())

def check(pads, pairs, slots):
    ok = True
    for na, nb, volts, ins in pairs:
        cl_req, cr_req = RULES[(volts, ins)]
        cl = min(rect_dist(a, b) for a in pads[na] for b in pads[nb])
        cr = min(creepage(a, b, slots) for a in pads[na] for b in pads[nb])
        good = cl >= cl_req and cr >= cr_req; ok &= good
        print(f"  {na:>4s}-{nb:<4s} {ins:10s} clearance {cl:5.2f}/{cl_req:.1f}  creepage {cr:5.2f}/{cr_req:.1f}  {'ok' if good else 'FAIL'}")
    return ok

PAIRS = [("L", "N", 250, "functional"), ("L", "PE", 250, "basic"), ("N", "PE", 250, "basic"),
         ("L", "SELV", 250, "reinforced"), ("N", "SELV", 250, "reinforced"), ("SELV", "GND", 50, "functional")]

def board(fixed):
    """mains on the left, an optocoupler bridging the isolation barrier at x = 20 mm, low-voltage logic on the right."""
    pads = {"L": [(2, 2, 6, 5)], "N": [(2, 7.5 if fixed else 6.2, 6, 10.5 if fixed else 9.2)], "PE": [(2, 14, 6, 17)],
            "SELV": [(22, 2, 24, 4), (22, 7, 24, 9)], "GND": [(26, 2, 30, 4)]}
    pads["L"].append((15, 2, 17.5 if not fixed else 17, 4)); pads["N"].append((15, 7, 17.5 if not fixed else 17, 9))   # opto LED side
    slots = [(18.5, -1, 20.5, 12)] if fixed else []          # milled from the board edge
    return pads, slots

def test_rule_checks():
    print("before:"); before = check(*board(False)[:1], PAIRS, board(False)[1])
    print("after (slot under the optocoupler, N pad moved):"); after = check(*board(True)[:1], PAIRS, board(True)[1])
    assert not before and after

def test_creepage_geometry():
    a, b = (0, 0, 1, 1), (4, 0, 5, 1)
    straight = creepage(a, b, []); around = creepage(a, b, [(2, -3, 3, 4)])
    expect = 2 * np.hypot(1, 3) + 1                                            # down to a slot corner, across, back up
    print(f"pads 3 mm apart: straight {straight:.3f} mm; around a 7 mm slot {around:.3f} mm (by hand {expect:.3f})")
    assert abs(straight - 3) < 1e-9 and abs(around - expect) < 0.02

test_creepage_geometry()
test_rule_checks()
print("PASS")
