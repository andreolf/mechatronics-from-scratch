import numpy as np

# an illustrative quadruped, not a model of any particular robot (m)
HIPS = {"LF": (0.30, 0.20), "RF": (0.30, -0.20), "LH": (-0.30, 0.20), "RH": (-0.30, -0.20)}
ORDER = ["LH", "LF", "RH", "RF"]           # the crawl sequence: one leg at a time, a quarter cycle apart
CYCLE, STEP = 2.0, 0.20                    # s, m: body speed STEP / CYCLE = 0.1 m/s
DUTY = 0.85                                # fraction of the cycle each foot is on the ground

def swing_window(leg, duty=None):
    k = ORDER.index(leg); return k / 4, k / 4 + (1 - (DUTY if duty is None else duty))

def feet_at(t):
    """planted foot positions (x, y) at time t; a foot in swing is left out.
    The body moves at STEP / CYCLE; each foot lands DUTY/2 of a step ahead of its hip and lifts DUTY/2 behind it."""
    ph = (t / CYCLE) % 1.0; feet = {}
    for leg, (hx, hy) in HIPS.items():
        a, b = swing_window(leg)
        if a <= ph < b: continue
        t_down = CYCLE * (np.floor(t / CYCLE - b) + b)                  # the last touchdown
        feet[leg] = (hx + STEP * t_down / CYCLE + DUTY / 2 * STEP, hy)
    return feet

def sway_profile(ph):
    """-1 (lean right) while the left legs swing, +1 while the right legs swing, ramping in the four-foot phases"""
    a = 1 - DUTY                                   # swing length; LH and LF swing in [0, 0.25 + a)
    if ph < 0.25 + a: return -1.0
    if ph < 0.5: return -1.0 + 2 * (ph - 0.25 - a) / (0.25 - a)
    if ph < 0.75 + a: return 1.0
    return 1.0 - 2 * (ph - 0.75 - a) / (0.25 - a)

def com_at(t, sway=0.0):
    """body centre moves forward steadily, leaning sideways by `sway` towards the side that keeps three feet down"""
    return np.array([STEP * t / CYCLE, sway * sway_profile((t / CYCLE) % 1.0)])

def polygon(points):
    """convex hull, counter-clockwise (gift wrapping is enough for 3 or 4 feet)"""
    pts = sorted(set(points)); 
    def cross(o, a, b): return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    lower, upper = [], []
    for p in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0: lower.pop()
        lower.append(p)
    for p in reversed(pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0: upper.pop()
        upper.append(p)
    return lower[:-1] + upper[:-1]

def margin(c, poly):
    """signed distance from c to the nearest edge: positive inside the support polygon"""
    d = []
    for i in range(len(poly)):
        a, b = np.array(poly[i]), np.array(poly[(i + 1) % len(poly)])
        e = b - a; n = np.array([-e[1], e[0]]) / np.linalg.norm(e)      # inward normal for a CCW polygon
        d.append(n @ (c - a))
    return min(d)

def worst_margin(sway, T=6.0, dt=0.002):
    out = []
    for t in np.arange(CYCLE, T, dt):                                   # skip the first cycle (start-up)
        f = feet_at(t); out.append(margin(com_at(t, sway), polygon(list(f.values()))))
    return min(out), np.array(out)

def test_feet_advance():
    f0, f1 = feet_at(2.9), feet_at(4.9)
    for leg in f0:
        if leg in f1: assert abs(f1[leg][0] - f0[leg][0] - STEP) < 1e-12    # one step per cycle
    n = [len(feet_at(t)) for t in np.arange(2.0, 4.0, 0.01)]
    assert min(n) == 3 and max(n) == 4                                       # never fewer than three feet down

def test_com_stays_in_support_polygon():
    m0, _ = worst_margin(0.0)
    m1, arr = worst_margin(0.04)
    print(f"duty {DUTY}, no sway : worst stability margin {m0 * 1000:5.1f} mm")
    print(f"duty {DUTY}, 4 cm sway: worst stability margin {m1 * 1000:5.1f} mm (mean {arr.mean() * 1000:.1f} mm)")
    assert 0 < m0 < 0.01 and m1 > 0.03

def test_duty_075_is_marginal():
    global DUTY
    keep, DUTY = DUTY, 0.75
    m, _ = worst_margin(0.0); DUTY = keep
    print(f"duty 0.75, no sway : worst margin {m * 1000:.1f} mm, the centre of mass sits on the diagonal at each leg change")
    assert abs(m) < 1e-9

test_feet_advance()
test_com_stays_in_support_polygon()
test_duty_075_is_marginal()
print("PASS")
