---
id: p19-l22
minutes: 40
summary: Mains voltage must stay away from anything a person can touch. You learn clearance and creepage, the insulation grades between circuits, and how slots extend surface paths, then write a rule checker with a visibility-graph creepage search and fix an illustrative mains board until every check passes.
---

## Clearance and creepage

Two conductors at different voltages are separated by air and by the board surface:

- **Clearance** is the shortest distance through air. Too little and a voltage surge arcs across.
- **Creepage** is the shortest distance along the surface of the insulation. Too little and dust and moisture form a conductive track over time.

Both requirements grow with working voltage and depend on the pollution degree, the material's tracking resistance (CTI group), the overvoltage category and altitude; IEC 60664-1 and product standards such as IEC 62368-1 give the tables.

## Insulation grades

- **Functional** insulation is needed only for the circuit to work.
- **Basic** insulation gives one level of protection against shock, for example between mains and protective earth.
- **Double** or **reinforced** insulation separates mains from SELV (safety extra-low voltage) circuits a person can touch, and roughly doubles the distances.

A milled **slot** in the board, under an optocoupler or transformer, lengthens creepage because the path must go around it, while clearance through air stays the same. Very narrow slots do not count.

## The rule checker

Clearance between two rectangular pads is a point-to-rectangle distance. Creepage is a shortest path on the board surface around slots: build a graph of points on both pads' outlines and slot corners, join every pair whose straight segment does not cross a slot, and run Dijkstra. The distances required in the code are **illustrative, not from the standard; use the actual IEC table** for your product.

:::figure widget=creepcheck caption="Pads across an isolation barrier with the creepage path. Toggle the slot, move the neutral pad and change the insulation grade; failing pairs turn red."
:::end

## Worked example

1. Check: pads 3 mm apart have 3.000 mm creepage; a 1 mm wide slot reaching 3 mm beyond the pads stretches it to 7.325 mm, matching the hand calculation $2\sqrt{10} + 1$.
2. Before the fix: L–N creepage is 1.20 mm against 1.5 mm, and the optocoupler bridges mains to SELV with 4.50 mm against 5.0 mm reinforced: three failures.
3. After milling a 2 mm slot from the board edge under the optocoupler and moving the neutral pad: L–N 2.50 mm, L–SELV creepage 13.49 mm and N–SELV 8.71 mm (clearance stays 5.00 mm through air): all six checks pass.

## Code it from scratch

:::code file=creepage.py
```python
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
```
:::end

## In practice

In KiCad you set net classes and custom design rules (clearance between net classes, and a creepage constraint in recent versions), draw slots on the Edge.Cuts layer, and let the design rule checker flag violations. Component choice matters too: optocouplers, transformers and Y capacitors come with stated isolation ratings. This lesson is educational; mains designs need the real standard, certified components and testing such as hi-pot tests.

## Exercises

:::exercise
Why does a slot increase creepage but not clearance?
:::solution
Creepage follows the insulating surface, which the slot interrupts, so the path must go around its end. Clearance is a straight line through air, which passes over the slot unchanged.
:::end

:::exercise
Two pads 4 mm apart need 5 mm creepage. A slot between them extends 2 mm beyond both pads' edges. Roughly what creepage results with a 1 mm wide slot centred in the gap?
:::solution
The path goes from a pad corner to the slot corner (1.5 mm across, 2 mm along), across the 1 mm slot end, and back: $2\sqrt{1.5^2 + 2^2} + 1 = 2 \times 2.5 + 1 = 6$ mm, enough.
:::end

## Quiz

:::quiz
- type: num
  q: Creepage around a 1 mm slot reaching 3 mm beyond pads 3 mm apart (mm)?
  answer: 7.325
  tol: 0.002
  py: "2*math.hypot(1,3)+1"
  explain: Two diagonals and the slot width.
- type: num
  q: Reinforced creepage if basic needs 2.5 mm and reinforced doubles it (mm)?
  answer: 5
  tol: 0.001
  py: "2*2.5"
  explain: Roughly twice basic.
- type: num
  q: Clearance between pads at x 17 mm and x 22 mm on the same row (mm)?
  answer: 5
  tol: 0.001
  py: "22-17"
  explain: Straight line through air.
- type: num
  q: Diagonal from (17, 9) to (18.5, 12) in mm?
  answer: 3.354
  tol: 0.002
  py: "math.hypot(1.5,3)"
  explain: Part of the creepage path.
- type: mc
  q: Which insulation grade separates mains from touchable SELV circuits?
  options: ["Double or reinforced", "Functional", "None", "Basic only"]
  answer: 0
  explain: Two levels of protection.
- type: mc
  q: Which distance does a slot lengthen?
  options: ["Creepage", "Clearance", "Both equally", "Neither"]
  answer: 0
  explain: Air paths go over the slot.
:::end
