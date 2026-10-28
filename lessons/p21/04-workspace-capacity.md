---
id: p21-l04
minutes: 40
summary: Where can a four-line robot hold a load, and how heavy a load? You turn the tension distribution into a capacity number at every point, map it over a room, and find out why the centre is the best place near the floor and the worst place near the ceiling.
---

## Two questions about a workspace

"Can the robot get there?" has a cable-robot answer that is different from an arm's. Every point inside the four anchors is geometrically reachable: you only have to wind the lines to the right lengths. The real question is whether the lines can **hold** the robot there, with every tension between zero and some limit. The set of poses where they can is called the *wrench-feasible workspace*, and it shrinks as the payload grows.

The second question turns it round: at a given point, what is the heaviest load the lines can hold? Lesson 3 already has the ingredients.

## Capacity at a point

With a tension floor of zero, every tension in the static solution is proportional to the hanging mass: $\mathbf t = m\,\boldsymbol\tau$, where $\boldsymbol\tau$ is the tension per kilogram. The spare degree of freedom lets us choose $\boldsymbol\tau$ along a line, so we pick the one with the smallest peak, subject to $\tau_i \ge 0$:

$$ m_\text{max}(\mathbf p) = \frac{T_\text{max}}{\min_{\lambda}\ \max_i \ \tau_i(\lambda)}, \qquad \boldsymbol\tau(\lambda) = \boldsymbol\tau_p + \lambda\mathbf n,\ \ \tau_i(\lambda) \ge 0 . $$

The inner function is the maximum of four straight lines in $\lambda$, so it is convex and piecewise linear. Its minimum sits either at an end of the feasible interval or where two of the lines cross. Checking at most eight candidates gives the exact answer, fast enough to run 1,600 times every time the simulator redraws its map.

Three consequences fall straight out of the formula:

- **Capacity is linear in the limit.** Halve the allowed tension and you halve the payload everywhere. A map for one limit is a map for all of them, rescaled.
- **The steepness of the lines is everything.** At the centre all four share equally, so $m_\text{max} = 4 T_\text{max} \sin\theta / g$. Low pivot, steep lines, big payload.
- **The mass is everything that hangs.** The gripper, its pole and the power line it hangs from all count against the same tension. The payload you can pick up is what is left.

## The shape of the map

Take Stringman's 7 × 7 × 3 m example room with every line limited to 28 N, the point at which Stringman's motors relax.

| Pivot height | Lowest in the room | Mean | Highest |
|---|---|---|---|
| 0.6 m | 2.97 kg | 3.71 kg | 4.86 kg |
| 1.2 m | 2.66 kg | 3.11 kg | 3.82 kg |
| 1.8 m | 1.89 kg | 2.32 kg | 2.94 kg |
| 2.4 m | 0.99 kg | 1.29 kg | 2.82 kg |

Near the floor the best spot is the centre, 5.15 kg with the gripper on the floor, because the four lines share the load at the steepest common angle. Near the ceiling it flips. At 2.4 m the centre lines are almost horizontal and the best places are under the anchors, where one line hangs nearly straight down and carries the load alone. Close under the ceiling and halfway along a wall is the worst: 0.165 kg at $(3.4, 0, 2.9)$, because two lines run along the wall and two run almost flat across the room.

Neufangled publishes its own version of this map on its home page, with an interactive version for your own room dimensions. Their figure is computed at the rated torque of the DM-H6215 motors, not at the 28 N relax limit, and it quotes up to 2 kg near the floor and 1.25 kg on average over the work volume. In this lesson's point-mass model, 2 kg at the floor centre corresponds to a working tension of about 10.9 N per line, and a 1.25 kg mean to roughly 15 N if you count pivot heights from 0.5 to 2.9 m. We cannot reproduce their figure exactly because we do not have their spool radius or their definition of the work volume, but the order of magnitude says something useful: the relax limit sits about twice above the tension the robot normally works at, so ordinary motion does not trip it.

:::figure widget=cablebot args={"preset":"workspace"} caption="Capacity map. The slice is drawn at the pivot height; coral cells cannot hold the payload within the tension limit. Change the payload, the limit, or the room, and drag the gripper up to see the centre go from best to worst."
:::end

## Worked example: does 1.5 kg fit everywhere at desk height?

A 1.5 kg load in the example room, gripper at a 0.75 m desk, so the pivot is at 1.25 m, and the full 28 N available.

1. At the centre, $\sin\theta = 1.75 / \sqrt{24.5 + 1.75^2} = 0.333$, so $m_\text{max} = 4 \times 28 \times 0.333 / 9.81 = 3.80$ kg.
2. The lowest capacity at that height, close to a wall, is about 2.55 kg.
3. Even that leaves room for the gripper's own weight. With the working tension nearer 11 N, though, the same map scales by 11/28, and the wall becomes about 1.0 kg. A 1.5 kg load at desk height near the walls would then need the motors to work above their rated tension.

That last line is the kind of check worth doing before you promise a payload: decide which limit you mean, rated or trip, and read the map at that limit.

## Code it from scratch

:::code file=capacity_map.py
```python
import numpy as np, time

G = 9.81
def anchors(w, d, h):
    return np.array([[-w/2, -d/2, h], [w/2, -d/2, h], [w/2, d/2, h], [-w/2, d/2, h]])

def capacity(A, p, t_max):
    """largest hanging mass at pivot p with every tension in [0, t_max]"""
    v = A - p
    U = (v / np.linalg.norm(v, axis=1)[:, None]).T
    tau = U.T @ np.linalg.solve(U @ U.T, [0, 0, G])            # tensions per kg, minimum norm
    n = np.linalg.svd(U)[2][-1]
    lo = max([-tau[i] / n[i] for i in range(4) if n[i] > 1e-12], default=-np.inf)
    hi = min([-tau[i] / n[i] for i in range(4) if n[i] < -1e-12], default=np.inf)
    if lo > hi:
        return 0.0                                             # no all-pulling solution: outside the workspace
    cands = [lo, hi] + [(tau[j] - tau[i]) / (n[i] - n[j]) for i in range(4) for j in range(i+1, 4) if abs(n[i] - n[j]) > 1e-12]
    peak = min(np.max(tau + c * n) for c in cands if lo - 1e-9 <= c <= hi + 1e-9)
    return t_max / peak

A = anchors(7, 7, 3)
c0 = capacity(A, np.array([0, 0, 0.5]), 28)
s = 2.5 / np.sqrt(24.5 + 2.5**2)
assert abs(c0 - 4 * 28 * s / G) < 1e-9                       # centre: four equal lines, m = 4 T sin(theta) / g
print(f"centre, gripper on the floor: {c0:.2f} kg at 28 N")
for p, want in [((1.0, -0.5, 0.9), 3.91), ((3.0, -0.5, 0.9), 3.17), ((3.4, 0, 2.9), 0.165), ((0, 0, 2.5), 1.15)]:
    c = capacity(A, np.array(p), 28); print(p, f"{c:.3f} kg"); assert abs(c - want) < 0.006
assert capacity(A, np.array([4.0, 0, 1.0]), 28) == 0          # beyond the footprint
t0 = time.time()
xs = (np.arange(24) + 0.5) / 24 * 7 - 3.5
zs = 0.5 + (np.arange(12) + 0.5) / 12 * 2.4
caps = np.array([[[capacity(A, np.array([x, y, z]), 28) for x in xs] for y in xs] for z in zs])
print(f"mean over pivot heights 0.5-2.9 m: {caps.mean():.2f} kg ({time.time()-t0:.1f} s)")
for z, layer in zip(zs[::3], caps[::3]):
    print(f"  z = {z:.1f} m: min {layer.min():.2f}, mean {layer.mean():.2f}, max {layer.max():.2f} kg")

assert 2.2 < caps.mean() < 2.45
# near the floor the centre is best; near the ceiling it is the worst place in the room
assert capacity(A, np.array([0, 0, 0.6]), 28) > capacity(A, np.array([3.2, 3.2, 0.6]), 28)
assert capacity(A, np.array([0, 0, 2.8]), 28) < capacity(A, np.array([3.2, 3.2, 2.8]), 28)
# capacity is linear in the limit: halve the allowed tension, halve the payload
assert abs(capacity(A, np.array([1.0, -0.5, 0.9]), 14) * 2 - capacity(A, np.array([1.0, -0.5, 0.9]), 28)) < 1e-9
# what working tension would give 2 kg at the floor centre, and 1.25 kg on average?
print(f"tension for 2 kg at the floor centre: {28 * 2 / c0:.1f} N; for a 1.25 kg mean: {28 * 1.25 / caps.mean():.1f} N")
print("PASS")
```
:::end

## In practice

Hang the anchors as high as you can and as close to the true corners as the room allows. Every centimetre of height steepens the lines and raises the whole map; Neufangled's sizing guidance gives the range of room shapes it supports, from 2 to 10 m across the diagonal and a length-to-height ratio between 0.9 and 2.5, which is the same geometry argument in product form. Keep heavy work near the floor and the centre, and treat the space close under the ceiling as a place to travel through, not a place to lift.

## Exercises

:::exercise
Show that at the centre of a square room the capacity is $4T_\text{max}\sin\theta/g$ and compute it with the pivot at 1.5 m.
:::solution
By symmetry the minimum-norm tensions are equal and the minimax over the null space cannot do better than equal (moving along $(1,-1,1,-1)$ raises one pair). Four equal tensions $T$ give a vertical force $4T\sin\theta = mg$. With $\sin\theta = 1.5/5.172 = 0.290$: $4 \times 28 \times 0.290 / 9.81 = 3.31$ kg.
:::end

:::exercise
Why does the best spot move from the centre to the corners as the pivot rises?
:::solution
At the centre the lines become shallower as the pivot rises, and $\sin\theta$ falls towards zero at the ceiling. Under an anchor one line becomes nearly vertical and can carry the whole weight on its own at a tension close to $mg$, so the corner capacity stays near $T_\text{max}/g = 2.85$ kg all the way up.
:::end

## Quiz

:::quiz
- type: num
  q: Capacity at the centre of the 7 × 7 × 3 m room, gripper on the floor (pivot 0.5 m), with a 28 N limit (kg)?
  answer: 5.15
  tol: 0.005
  py: "4*28*(2.5/math.sqrt(24.5+6.25))/9.81"
  explain: 4 T sin θ / g with sin θ = 2.5/5.545.
- type: mc
  q: You lower the tension limit from 28 N to 14 N. What happens to the capacity map?
  options: ["Every value halves", "Only the corners change", "The centre goes up", "Nothing, capacity depends only on geometry"]
  answer: 0
  explain: Tensions scale with the mass, so capacity is linear in the limit.
- type: mc
  q: Close under the ceiling, where does a four-line robot hold the most?
  options: ["Under an anchor, where one line hangs nearly vertical", "At the centre", "Halfway along a wall", "Everywhere equally"]
  answer: 0
  explain: At the centre the lines are nearly flat there; under an anchor one line can take the whole load.
- type: num
  q: Capacity at the centre with the pivot at 1.5 m and a 28 N limit (kg)?
  answer: 3.31
  tol: 0.005
  py: "4*28*(1.5/math.sqrt(26.75))/9.81"
  explain: sin θ = 0.290.
- type: mc
  q: The capacity of the lines is 3 kg at a point and the gripper weighs 0.6 kg. What can it pick up there?
  options: ["2.4 kg", "3 kg", "3.6 kg", "0.6 kg"]
  answer: 0
  explain: Everything that hangs counts against the same tensions.
- type: num
  q: In the point-mass model, what working tension per line gives 2 kg at the floor centre (N)?
  answer: 10.9
  tol: 0.01
  py: "2*9.81/(4*2.5/math.sqrt(30.75))"
  explain: T = m g / (4 sin θ).
:::end

:::verify
import math
s = lambda z: (3-z)/math.sqrt(24.5+(3-z)**2)
assert abs(4*28*s(0.5)/9.81 - 5.15) < 0.005 and abs(4*28*s(1.5)/9.81 - 3.31) < 0.005
assert abs(s(1.25) - 0.333) < 5e-4 and abs(4*28*s(1.25)/9.81 - 3.80) < 0.006
assert abs(2*9.81/(4*s(0.5)) - 10.9) < 0.025 and abs(28/9.81 - 2.85) < 0.005
assert abs(math.sqrt(24.5+2.25) - 5.172) < 5e-4 and abs(2.55*11/28 - 1.0) < 0.03
:::end

## Sources

- Neufangled, [Stringman home page and tech specs](https://neufangled.com/) (payload map at rated torque in a 7 × 7 × 3 m room, up to 2 kg near the floor and 1.25 kg average, DM-H6215 1 N·m actuators, room sizes 2 to 10 m diagonal and length-to-height 0.9 to 2.5, 28 N relax limit).
- P. Bosscher, A. Riechel and I. Ebert-Uphoff, ["Wrench-feasible workspace generation for cable-driven robots"](https://doi.org/10.1109/tro.2006.878967), *IEEE Transactions on Robotics*, 2006.
- A. Pott, [*Cable-Driven Parallel Robots: Theory and Application*](https://doi.org/10.1007/978-3-319-76138-1), Springer, 2018.
