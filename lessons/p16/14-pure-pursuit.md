---
id: p16-l14
minutes: 40
summary: A planned path is only useful if the robot can follow it. Pure pursuit steers a wheeled robot by repeatedly driving the arc that reaches a point a fixed lookahead distance ahead on the path. You derive the curvature 2y/L² of that arc, implement pure pursuit for a differential-drive robot, and test that it tracks a circle exactly, converges from an offset, and keeps the cross-track error on a stadium-shaped track within a 5 cm spec, then see how steering lag calls for a longer lookahead.
---

## Chase a point ahead

Pick the point on the path a distance $L$ (the **lookahead**) ahead of the robot. In the robot's frame, with $x$ forward and $y$ to the left, it is at $(x, y)$ with $x^2 + y^2 = L^2$. Find the circular arc that starts at the robot, tangent to its heading, and passes through that point.

The arc's centre is on the robot's $y$ axis at $(0, R)$. The goal point is on the circle: $x^2 + (y - R)^2 = R^2$, so $x^2 + y^2 = 2yR$, and

$$\kappa = \frac1R = \frac{2y}{L^2}.$$

Command the turn rate $\omega = v\kappa$ (the unicycle model of Phase 15) and repeat every control cycle with a new goal point.

## Choosing the lookahead

- A **circle** is tracked exactly from any point on it, for any $L$ shorter than its diameter: a chord of a circle, with the robot tangent to it, defines an arc of the same circle.
- Where the curvature changes, such as where a straight meets a curve, the robot starts turning early and **cuts the corner**. The error grows with $L$.
- A short $L$ reacts sharply. If the steering responds with a lag, or the robot moves fast, a short lookahead overcorrects and the robot weaves. A longer $L$ damps it.

So $L$ trades accuracy on curves against stability. Many implementations scale it with speed: $L = \max(L_{min}, k\,v)$.

:::figure widget=purepursuit caption="A differential-drive robot following a stadium track with pure pursuit. The circle is the lookahead distance and the dot is the goal point. Lengthen the lookahead to see it cut corners, shorten it and add steering lag to see it weave."
:::end

## Worked example

An illustrative robot at 0.5 m/s, turn rate limited to 3 rad/s, integrated with exact arcs every 10 ms.

1. A circle of radius 2 m with $L = 0.6$ m: the largest cross-track error is $6 \times 10^{-7}$ m, the sag of the 4000-point polyline the track is stored as.
2. Starting 0.5 m outside that circle: after 10 s the error is 0.02 mm.
3. A stadium track (4 m straights, 1.5 m radius ends), after the first 5 s: the largest error is 0.6 cm with $L = 0.3$ m, 2.5 cm with $0.6$ m, and 10.9 cm with $1.2$ m. Against an illustrative 5 cm spec, 0.3 and 0.6 m pass and 1.2 m fails.
4. With a 0.5 s first-order lag on the turn rate: $L = 0.15$ m weaves, with errors up to 58.6 cm, while $L = 0.6$ m stays within 1.5 cm.

## Code it from scratch

:::code file=purepursuit.py
```python
import numpy as np

def stadium(straight=4.0, R=1.5, n=4000):
    """an illustrative closed track: two straights joined by semicircles, as a dense polyline (counter-clockwise)"""
    u = np.linspace(0, 1, n, endpoint=False) * (2 * straight + 2 * np.pi * R); pts = []
    for d in u:
        if d < straight: pts.append((d - straight / 2, -R))
        elif d < straight + np.pi * R: a = -np.pi / 2 + (d - straight) / R; pts.append((straight / 2 + R * np.cos(a), R * np.sin(a)))
        elif d < 2 * straight + np.pi * R: pts.append((straight / 2 - (d - straight - np.pi * R), R))
        else: a = np.pi / 2 + (d - 2 * straight - np.pi * R) / R; pts.append((-straight / 2 + R * np.cos(a), R * np.sin(a)))
    return np.array(pts)

def circle(R=2.0, n=4000):
    a = np.linspace(0, 2 * np.pi, n, endpoint=False); return np.stack([R * np.cos(a), R * np.sin(a)], 1)

def curvature_to(goal, pose):
    """pure pursuit: the arc through the robot and the goal point, tangent to the heading, has curvature 2 y / L^2"""
    x, y, th = pose; dx, dy = goal[0] - x, goal[1] - y
    yl = -np.sin(th) * dx + np.cos(th) * dy                  # lateral offset of the goal point in the robot frame
    return 2 * yl / (dx * dx + dy * dy)

def lookahead_point(track, pos, L, i0):
    """first track point at least L ahead of the robot, searching forward from the closest point near the last index"""
    n = len(track); idx = (i0 + np.arange(-50, 400)) % n
    i = idx[np.argmin(np.linalg.norm(track[idx] - pos, axis=1))]
    j = i
    while np.linalg.norm(track[(j + 1) % n] - pos) < L: j += 1
    a, b = track[j % n], track[(j + 1) % n]                  # the exact point at distance L on segment a-b
    d, f = b - a, a - pos; A_, B_, C_ = d @ d, 2 * f @ d, f @ f - L * L
    t = (-B_ + np.sqrt(max(B_ * B_ - 4 * A_ * C_, 0.0))) / (2 * A_)
    return a + np.clip(t, 0, 1) * d, i

def cross_track(track, pos):
    """distance to the nearest segment of the polyline"""
    a, b = track, np.roll(track, -1, axis=0); d = b - a
    t = np.clip(np.sum((pos - a) * d, 1) / np.sum(d * d, 1), 0, 1)
    return np.min(np.linalg.norm(a + t[:, None] * d - pos, axis=1))

def run(track, L, v=0.5, T=40.0, dt=0.01, pose=None, lag=0.0, wmax=3.0):
    """unicycle at speed v; the turn rate follows the commanded v * kappa through a first-order lag and a limit"""
    p = np.array(pose if pose is not None else [track[0, 0], track[0, 1], np.arctan2(*(track[1] - track[0])[::-1])], float)
    w = 0.0; i = 0; cte = []
    for k in range(int(T / dt)):
        g, i = lookahead_point(track, p[:2], L, i)
        wc = np.clip(v * curvature_to(g, p), -wmax, wmax)
        w = wc if lag == 0 else w + dt / lag * (wc - w)
        if abs(w) < 1e-9: p += [v * dt * np.cos(p[2]), v * dt * np.sin(p[2]), 0.0]          # exact arc for constant v, w over dt
        else: p += [v / w * (np.sin(p[2] + w * dt) - np.sin(p[2])), -v / w * (np.cos(p[2] + w * dt) - np.cos(p[2])), w * dt]
        cte.append(cross_track(track, p[:2]))
    return np.array(cte)

def test_circle_tracked_exactly():
    c = run(circle(2.0), L=0.6, pose=[2.0, 0.0, np.pi / 2], T=20)
    print(f"circle of radius 2 m: largest cross-track error {c.max():.1e} m (any chord of a circle subtends an arc of that circle)")
    assert c.max() < 1e-5                                    # what is left is the polyline sagging between its points

def test_converges_from_offset():
    c = run(circle(2.0), L=0.6, pose=[2.5, 0.0, np.pi / 2], T=30)
    print(f"start 0.5 m outside the circle: error {c[0]:.3f} m, after 10 s {c[1000] * 1000:.2f} mm, after 30 s {c[-1]:.1e} m")
    assert c[-1] < 1e-5

def test_stadium_within_spec():
    tr = stadium(); spec = 0.05                                # illustrative spec: 5 cm
    res = {L: run(tr, L, T=45) for L in (0.3, 0.6, 1.2)}
    for L, c in res.items(): print(f"stadium, lookahead {L} m: largest cross-track error after the first 5 s {c[500:].max() * 100:.1f} cm")
    assert res[0.3][500:].max() < spec and res[1.2][500:].max() > res[0.3][500:].max()   # longer lookahead cuts corners more

def test_lag_needs_longer_lookahead():
    tr = stadium()
    short, long_ = run(tr, 0.15, T=45, lag=0.5), run(tr, 0.6, T=45, lag=0.5)
    print(f"with a 0.5 s steering lag: lookahead 0.15 m error up to {short[500:].max() * 100:.1f} cm, 0.6 m up to {long_[500:].max() * 100:.1f} cm")
    assert short[500:].max() > long_[500:].max()

test_circle_tracked_exactly()
test_converges_from_offset()
test_stadium_within_spec()
test_lag_needs_longer_lookahead()
print("PASS")
```
:::end

## In practice

Nav2's Regulated Pure Pursuit controller adds speed regulation on tight curves and near obstacles to this law. Pure pursuit goes back to path-tracking work for autonomous vehicles at Carnegie Mellon in the 1980s.

## Exercises

:::exercise
The goal point is at $(0.4, 0.3)$ in the robot frame. What are $L$, $\kappa$ and the turning radius?
:::solution
$L = 0.5$ m, $\kappa = 2 \times 0.3 / 0.25 = 2.4$ 1/m, $R = 0.417$ m, to the left.
:::end

:::exercise
Why can't pure pursuit follow a path with a sharp 90° corner exactly?
:::solution
It always drives arcs and starts turning once the goal point is round the corner, a distance $L$ early, so it cuts inside. A differential-drive robot could stop and turn on the spot, but pure pursuit's continuous arcs never do. Smooth the path first (lesson 05), or shrink $L$ near corners.
:::end

## Quiz

:::quiz
- type: num
  q: Curvature to a goal point with lateral offset y = 0.1 m and L = 0.5 m?
  answer: 0.8
  tol: 0.001
  unit: 1/m
  py: "2*0.1/0.5**2"
  explain: 2y/L².
- type: num
  q: Turn rate at 0.5 m/s for that curvature?
  answer: 0.4
  tol: 0.001
  unit: rad/s
  py: "0.5*0.8"
  explain: ω = vκ.
- type: num
  q: Turning radius for κ = 0.8 1/m?
  answer: 1.25
  tol: 0.001
  unit: m
  py: "1/0.8"
  explain: R = 1/κ.
- type: num
  q: Curvature when the goal point is straight ahead (y = 0)?
  answer: 0
  tol: 0.001
  unit: 1/m
  py: "0.0"
  explain: Drive straight.
- type: mc
  q: A longer lookahead distance…
  options:
    - cuts corners more but steers more calmly
    - always reduces the cross-track error
    - makes the robot weave
    - has no effect on a circle smaller than L
  answer: 0
  explain: It trades accuracy on curves for stability.
- type: mc
  q: Pure pursuit tracks a circle exactly because…
  options:
    - the arc through the robot and a goal point on the circle, tangent to the circle, is the circle
    - the lookahead is zero
    - the robot slows down on curves
    - the cross-track error is fed back
  answer: 0
  explain: A chord and a tangent define the circle uniquely.
:::end
