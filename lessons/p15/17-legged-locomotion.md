---
id: p15-l17
minutes: 40
summary: A walking robot stays upright in a slow, static gait by keeping its centre of mass over the polygon formed by the feet on the ground. You derive the support polygon and the stability margin, work out why a crawl gait needs each foot down for more than three quarters of the cycle, simulate a generic quadruped's crawl kinematically with and without a sideways body sway, and test that the centre of mass never leaves the support polygon.
---

## Static stability

Walk slowly enough that the dynamics don't matter. The robot is statically stable when the vertical projection of its centre of mass (CoM) lies inside the **support polygon**, the convex hull of the feet in contact. The **stability margin** is the distance from the CoM projection to the nearest edge: positive inside, negative outside. A margin of zero means the robot is balanced on a line and the smallest push tips it over.

Three feet are needed for a polygon with area, so a static walker lifts one leg at a time.

## Gaits

A gait is the pattern of which feet are down when. Two numbers describe each leg:

- the **duty factor** $\beta$, the fraction of the cycle the foot is on the ground;
- the **phase**, when in the cycle its swing starts.

The quadruped **crawl** swings the legs in the order left hind, left front, right hind, right front, a quarter cycle apart. With $\beta = 0.75$ exactly one leg swings at a time and the switch from one support triangle to the next is instantaneous. When the left front lands and the right hind lifts, the triangles before and after share only the diagonal between left hind and right front. The CoM must be in both triangles, so on that diagonal: the margin is zero. With $\beta > 0.75$ there are short four-foot phases between swings, and the body can move its CoM across into the next triangle before the next leg lifts.

## Leaning into the support

While a left leg swings the support triangle is on the right, and vice versa. So the body sways sideways: towards the right during the two left swings, then across during a four-foot phase, then towards the left. Real quadrupeds combine sway with fore-aft shifts, and the dynamic gaits (trot, pace, gallop) give up static stability altogether in exchange for speed, balancing like a running animal.

:::figure widget=crawlgait caption="A generic quadruped in a crawl gait seen from above. The shaded polygon joins the feet on the ground and the dot is the centre of mass. Scrub through the cycle, change the duty factor and switch the body sway on and off to watch the stability margin."
:::end

## Worked example

An illustrative quadruped (hips at $\pm 0.30$ m fore-aft and $\pm 0.20$ m sideways), with a 2 s cycle and 0.20 m steps (0.1 m/s), walking a crawl:

1. $\beta = 0.75$, no sway: the worst margin is 0.0 mm. The CoM touches the diagonal at every leg change.
2. $\beta = 0.85$, no sway: 5.9 mm. Positive but tiny: a small push or a rock underfoot would tip it.
3. $\beta = 0.85$ with a 4 cm sideways sway: 38.2 mm worst case, 96 mm on average. Never fewer than three feet down, and the CoM stays well inside.

Legged robots are a field where Switzerland is strong. ETH Zurich's legged-robotics research led to the quadrupeds that the Zurich company ANYbotics now builds for industrial inspection. The robot in this lesson is generic, not a model of any of them.

## Code it from scratch

:::code file=crawl_gait.py
```python
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
```
:::end

## Exercises

:::exercise
Why does a faster crawl eventually fail even with sway?
:::solution
A higher speed at the same step length means a shorter cycle, so the four-foot phases (when the body shifts across) get shorter and the sway must happen faster. The inertial forces of that faster sway move the effective point of support (the zero-moment point) away from the CoM projection, and the static argument stops holding. At that point you switch to a dynamic gait such as the trot.
:::end

:::exercise
Where should the CoM be for the largest margin on three feet at the corners of a triangle?
:::solution
At the triangle's **incentre**, the point equidistant from all three edges. Its distance from the edges is the inradius, area divided by half the perimeter: the best possible margin for that stance.
:::end

## Quiz

:::quiz
- type: num
  q: Body speed with 0.20 m steps and a 2 s cycle?
  answer: 0.1
  tol: 0.001
  unit: m/s
  py: "0.2/2"
  explain: One step per cycle.
- type: num
  q: Minimum number of feet on the ground for static stability with area?
  answer: 3
  tol: 0.001
  py: "3"
  explain: Three points make a triangle.
- type: num
  q: Fraction of the cycle with four feet down in a crawl with duty factor 0.85?
  answer: 0.4
  tol: 0.001
  py: "1-4*(1-0.85)"
  explain: Each of the four swings takes 0.15 of the cycle.
- type: num
  q: Inradius of a 3-4-5 right triangle of feet (m)?
  answer: 1
  tol: 0.001
  unit: m
  py: "(3*4/2)/((3+4+5)/2)"
  explain: Area over half the perimeter.
- type: mc
  q: A crawl gait with duty factor exactly 0.75 has…
  options:
    - zero stability margin at each leg change
    - four feet down half the time
    - two feet down at times
    - the largest possible margin
  answer: 0
  explain: The CoM must sit on the shared diagonal.
- type: mc
  q: The body sways right while a left leg swings because…
  options:
    - the remaining support triangle lies on the right
    - the left legs are heavier
    - it looks natural
    - the motors need it
  answer: 0
  explain: It keeps the CoM inside the polygon.
:::end
