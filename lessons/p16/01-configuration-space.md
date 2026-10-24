---
id: p16-l01
minutes: 40
summary: A planner does not reason about the robot's shape at every step. It shrinks the robot to a point in configuration space and grows the obstacles to match. You derive C-obstacles as Minkowski sums for a translating robot, map the C-space of the arm lab's 2-link arm by collision checking a grid of joint angles, search it for a path, and test that the path stays collision-free when checked densely in the workspace.
---

## The robot becomes a point

A configuration $q$ fixes the position of every point of the robot (lesson 01 of Phase 15). The set of all configurations is the **configuration space** $\mathcal{C}$. For a robot that translates in the plane, $\mathcal{C} = \mathbb{R}^2$. For the 2-link arm, $q = (q_1, q_2)$ with both angles wrapping round, so $\mathcal{C}$ is a torus.

Each obstacle $O$ in the workspace becomes a **C-obstacle**: the configurations where the robot touches it,

$$\mathcal{C}_{obs} = \{\, q : R(q) \cap O \neq \emptyset \,\}, \qquad \mathcal{C}_{free} = \mathcal{C} \setminus \mathcal{C}_{obs}.$$

Planning is now finding a curve from $q_{start}$ to $q_{goal}$ inside $\mathcal{C}_{free}$, for a point.

## Minkowski sums

For a robot $R$ that only translates, with its reference point at the origin, the robot at position $p$ overlaps $O$ exactly when $p = o - r$ for some $o \in O$, $r \in R$. So

$$\mathcal{C}_{obs} = O \oplus (-R) = \{\, o - r : o \in O,\ r \in R \,\}.$$

For convex polygons, the Minkowski sum is the convex hull of all pairwise vertex sums, with at most $n + m$ edges. A $0.4$ m square obstacle and a $0.2$ m square robot give a $0.6$ m square C-obstacle: the obstacle grows by the robot's half-width on every side. That is also why a disc-shaped mobile robot can be planned as a point among obstacles inflated by its radius.

## The arm's C-space

Rotation makes the C-obstacles of an arm curved and hard to write down. Instead, sample: check every joint-angle pair on a grid for collision, here by the distance from each link segment to each circular obstacle. One small obstacle near the tool can block a wide band of $(q_1, q_2)$, because many poses reach it.

A grid only checks the cells' centres. Between neighbouring cells, any point of the arm moves at most $(L_1 + L_2)|\Delta q_1| + L_2|\Delta q_2|$. For 2° steps that is 9.1 cm, so every point of the motion is within 4.5 cm of one end of the step. Marking cells as blocked when the clearance is under a 5 cm **margin** makes every grid path safe in the continuous workspace.

:::figure widget=cspace caption="The arm in its workspace (left or top) and the same arm as a point in C-space (right or bottom). Red cells are joint angles where the arm hits an obstacle. Move the joints and watch the point move through C-space."
:::end

## Worked example

The arm lab arm ($L_1 = 1.0$, $L_2 = 0.8$ m), with three illustrative circular obstacles.

1. A 0.2 m square robot and a 0.4 m square obstacle: the C-obstacle is a 0.6 m square, area $0.36$ m².
2. For 2000 random robot positions, "reference point inside the C-obstacle" agrees with a direct polygon-overlap test every time.
3. With a 5 cm margin, 29.7 % of the joint-angle torus is blocked.
4. From $(0°, 30°)$ to $(120°, -30°)$, breadth-first search on the 2° grid finds a path of 110 cells. Checked densely in the workspace, the smallest clearance is 5.3 cm. Moving both joints along a straight line in joint space instead hits an obstacle and would penetrate it by 24.7 cm.

## Code it from scratch

:::code file=cspace.py
```python
import numpy as np
from collections import deque

cross = lambda u, v: u[0] * v[1] - u[1] * v[0]       # z-component of the 2D cross product

L1, L2 = 1.0, 0.8                                    # the arm lab's 2-link arm (m)
OBST = [(1.1, 0.9, 0.25), (-0.9, 0.8, 0.3), (0.2, -1.2, 0.3)]   # illustrative circular obstacles (x, y, radius)

def links(q1, q2):
    """the two link segments as (start, end) points"""
    e = np.array([L1 * np.cos(q1), L1 * np.sin(q1)])
    t = e + [L2 * np.cos(q1 + q2), L2 * np.sin(q1 + q2)]
    return [(np.zeros(2), e), (e, t)]

def seg_point_dist(a, b, p):
    ab = b - a; u = np.clip((p - a) @ ab / (ab @ ab), 0, 1)
    return np.linalg.norm(a + u * ab - p)

def clearance(q1, q2):
    """smallest distance from either link to any obstacle surface (negative = collision)"""
    return min(seg_point_dist(a, b, np.array(c[:2])) - c[2] for a, b in links(q1, q2) for c in OBST)

def cspace_map(n=180, margin=0.0):
    """occupancy of the C-space torus on an n x n grid of joint angles in [-pi, pi)"""
    qs = -np.pi + 2 * np.pi * np.arange(n) / n
    return np.array([[clearance(a, b) < margin for b in qs] for a in qs]), qs

def bfs(occ, start, goal):
    """8-connected breadth-first search on the C-space grid; both angles wrap around"""
    n = occ.shape[0]; prev = {start: None}; Q = deque([start])
    while Q:
        c = Q.popleft()
        if c == goal: break
        for di in (-1, 0, 1):
            for dj in (-1, 0, 1):
                nb = ((c[0] + di) % n, (c[1] + dj) % n)
                if nb not in prev and not occ[nb]: prev[nb] = c; Q.append(nb)
    if goal not in prev: return None
    path = [goal]
    while prev[path[-1]] is not None: path.append(prev[path[-1]])
    return path[::-1]

def minkowski(A, B):
    """Minkowski sum of two convex polygons (vertices counter-clockwise): the hull of all pairwise sums"""
    pts = np.array([a + b for a in A for b in B])
    pts = pts[np.lexsort((pts[:, 1], pts[:, 0]))]
    def half(P):
        h = []
        for p in P:
            while len(h) >= 2 and cross(h[-1] - h[-2], p - h[-2]) <= 1e-12: h.pop()
            h.append(p)
        return h
    lo, up = half(pts), half(pts[::-1])
    return np.array(lo[:-1] + up[:-1])

def area(P):
    x, y = P[:, 0], P[:, 1]; return 0.5 * abs(x @ np.roll(y, -1) - y @ np.roll(x, -1))

def inside(P, p):
    return all(cross(P[(i + 1) % len(P)] - P[i], p - P[i]) >= -1e-12 for i in range(len(P)))

def seg_cross(a, b, c, d):
    o = lambda p, q, r: np.sign(cross(q - p, r - p))
    return o(a, b, c) != o(a, b, d) and o(c, d, a) != o(c, d, b)

def polys_overlap(P, Q):
    """independent check: an edge crossing, or one polygon containing the other"""
    if any(seg_cross(P[i], P[(i + 1) % len(P)], Q[j], Q[(j + 1) % len(Q)]) for i in range(len(P)) for j in range(len(Q))): return True
    return inside(P, Q[0]) or inside(Q, P[0])

def test_minkowski():
    sq = lambda s: np.array([[-s, -s], [s, -s], [s, s], [-s, s]]) / 2
    C = minkowski(sq(0.4), -sq(0.2))                 # C-obstacle = O (+) (-R) for a translating square robot
    print(f"0.4 m square obstacle, 0.2 m square robot: C-obstacle area {area(C):.3f} m^2 (a 0.6 m square)")
    assert abs(area(C) - 0.36) < 1e-12
    rng = np.random.default_rng(1)
    O = np.array([[0, 0], [0.5, -0.1], [0.6, 0.4], [0.1, 0.5]]); R = np.array([[-0.1, -0.1], [0.15, 0], [-0.05, 0.2]])
    CO = minkowski(O, -R); agree = 0
    for _ in range(2000):
        p = rng.uniform(-0.5, 1.1, 2)
        agree += inside(CO, p) == polys_overlap(O, R + p)
    print(f"robot reference point inside the C-obstacle <=> robot overlaps the obstacle: {agree}/2000 random positions agree")
    assert agree == 2000

def test_cspace_path_is_safe():
    margin = 0.05                                    # inflate so motion between grid cells can't clip an obstacle
    occ, qs = cspace_map(180, margin)
    print(f"C-space: {occ.mean() * 100:.1f} % of the joint-angle torus is blocked (with a {margin * 100:.0f} cm margin)")
    idx = lambda d: int(round((np.radians(d) + np.pi) / (2 * np.pi) * 180)) % 180
    start, goal = (idx(0), idx(30)), (idx(120), idx(-30))
    path = bfs(occ, start, goal); assert path is not None
    # check the path densely in the workspace, including between grid cells (unwrap the angles first)
    q = np.unwrap(np.array([[qs[i], qs[j]] for i, j in path]), axis=0)
    fine = np.concatenate([np.linspace(q[k], q[k + 1], 20, endpoint=False) for k in range(len(q) - 1)] + [q[-1:]])
    worst = min(clearance(*p) for p in fine)
    print(f"path of {len(path)} cells; smallest clearance along the densely checked workspace motion {worst * 100:.1f} cm")
    assert worst > 0
    straight = np.linspace(q[0], [np.radians(120), np.radians(-30)], 400)
    print(f"the straight joint-space line instead dips to {min(clearance(*p) for p in straight) * 100:.1f} cm (negative = collision)")

test_minkowski()
test_cspace_path_is_safe()
print("PASS")
```
:::end

## In practice

OMPL, the Open Motion Planning Library, plans in exactly this abstraction: you give it a state space and a function that says whether a state is valid, and it never sees the robot's geometry directly. Industrial arms, such as those made by ABB, headquartered in Zurich, are planned the same way. Their 6-dimensional C-spaces are far too big to grid, which is why the sampling planners of lessons 09 and 10 exist.

## Exercises

:::exercise
A disc robot of radius 0.25 m moves among point obstacles. What are the C-obstacles?
:::solution
Discs of radius 0.25 m centred on the points. The Minkowski sum of a point and the reflected disc is the disc. Planning for the disc among points is planning for a point among 0.25 m discs.
:::end

:::exercise
Why can't you plan for a rotating rectangular mobile robot in a 2D C-space?
:::solution
Its configuration is $(x, y, \theta)$, three numbers. Whether it collides depends on its heading, so the C-obstacles live in 3D: each slice of constant $\theta$ is a different Minkowski sum. Planners either work in 3D or use a bounding disc and accept the lost space.
:::end

## Quiz

:::quiz
- type: num
  q: C-obstacle side length for a 0.5 m square obstacle and a 0.3 m square robot that only translates?
  answer: 0.8
  tol: 0.001
  unit: m
  py: "0.5+0.3"
  explain: The obstacle grows by half the robot's width on each side.
- type: num
  q: The most edges the Minkowski sum of a convex 4-gon and a convex 3-gon can have?
  answer: 7
  tol: 0.001
  py: "4+3"
  explain: Each edge of either polygon appears at most once, ordered by angle.
- type: num
  q: Largest movement of any point of the arm (L1 = 1.0, L2 = 0.8 m) when both joints step by 2°?
  answer: 9.08
  tol: 0.005
  unit: cm
  py: "((1.0+0.8)+0.8)*math.radians(2)*100"
  explain: "(L1 + L2)|Δq1| + L2|Δq2|."
- type: num
  q: Cells in a C-space grid for a 2-link arm at 2° resolution?
  answer: 32400
  tol: 0.001
  py: "180*180"
  explain: 180 values per joint, squared.
- type: mc
  q: The C-space of a planar 2-link arm with unlimited revolute joints is…
  options:
    - a torus
    - a plane
    - a sphere
    - a disc
  answer: 0
  explain: Both angles wrap round.
- type: mc
  q: Why add a safety margin when gridding C-space?
  options:
    - the arm moves between cell centres, and the grid only checks the centres
    - to make the search faster
    - because the Minkowski sum is approximate
    - to remove the wrap-around
  answer: 0
  explain: The margin covers the motion between neighbouring checked configurations.
:::end
