---
id: p16-l11
minutes: 35
summary: Every planner in this phase spends most of its time asking one question, does the robot hit anything here. You derive the separating axis theorem, which answers it exactly for convex shapes with a handful of projections, and the bounding volumes that rule out most pairs before any exact test. You implement both for 2D polygons and test SAT against a brute-force edge-crossing test on 5000 random pairs, and that the broad phase never misses a collision.
---

## Separating axes

Two convex shapes are disjoint exactly when there is a line between them. Equivalently, there is an **axis** onto which their projections (intervals) don't overlap. The **separating axis theorem** says that for two convex polygons, it is enough to test the axes normal to their edges:

$$P \cap Q = \emptyset \iff \exists\, n \in \{\text{edge normals of } P \text{ and } Q\}: \ \max_{p \in P} n \cdot p < \min_{q \in Q} n \cdot q \ \text{ or the reverse}.$$

Why only those? $P$ and $Q$ overlap exactly when the origin lies in the Minkowski difference $P \oplus (-Q)$ of lesson 01. That is a convex polygon whose edges are all parallel to edges of $P$ or $Q$. If the origin is outside it, one of its edges has the origin on its outer side, and that edge's normal is a separating axis. So a polygon with $m$ edges and one with $n$ need at most $m + n$ tests, fewer when edges are parallel (two rectangles: 4). The test can stop at the first separating axis, which is why it is fast when the shapes are far apart.

Projecting onto an unnormalised normal works, because only the order of the intervals matters. In 3D, the candidate axes are the face normals of both shapes and the cross products of their edge pairs.

SAT needs convex shapes. A concave robot is split into convex pieces and each pair tested.

## The broad phase

Most pairs in a scene are far apart. A **bounding volume** around each shape is a cheap test that can only give false alarms, never misses:

- **AABB** (axis-aligned bounding box): two boxes overlap iff their $x$ intervals and their $y$ intervals both overlap. Four comparisons.
- **Bounding circle**: overlap iff the centre distance is at most the sum of the radii.

Only pairs that pass the broad phase go to the exact test (the **narrow phase**). Libraries organise the bounding volumes in a tree, so a query visits only the branches it overlaps.

:::figure widget=sat caption="A square and a rotating triangle, shown with their projections on one candidate axis. Move and turn the triangle: the shapes turn red when no axis separates them. Step through the axes to see which one separates them."
:::end

## Worked example

1. A unit square and a diamond (the square rotated 45°) centred at $(1.3, 1.3)$: the diamond's lower-left edge $x + y = 1.89$ cuts the square's corner, where $x + y = 2$. SAT reports an overlap.
2. Centred at $(1.6, 1.6)$, the edge is at $x + y = 2.49$: separated, although the bounding boxes still overlap. That is a broad-phase false alarm, resolved by the narrow phase.
3. A square and a triangle (4 + 3 edges) that overlap need all 7 axes tested. When they are clear, here the 6th axis separates them.
4. On 5000 random pairs of convex polygons with 3 to 7 sides, SAT agrees with a brute-force test (edges crossing, or one polygon containing a vertex of the other) every time; 925 pairs overlap.
5. On 5000 pairs scattered over a larger area, AABBs rule out 91 % without running SAT, and miss no collision.

## Code it from scratch

:::code file=sat.py
```python
import numpy as np

cross = lambda u, v: u[0] * v[1] - u[1] * v[0]

def sat_overlap(P, Q):
    """separating axis theorem for convex polygons: they are disjoint iff the projections onto some edge normal don't overlap.
    Returns (overlap?, number of axes tested)."""
    tested = 0
    for poly in (P, Q):
        for i in range(len(poly)):
            e = poly[(i + 1) % len(poly)] - poly[i]; n = np.array([-e[1], e[0]])   # an edge normal (needn't be unit length)
            tested += 1
            a, b = P @ n, Q @ n
            if a.max() < b.min() or b.max() < a.min(): return False, tested      # found a separating axis: stop early
    return True, tested

def aabb_overlap(P, Q):
    """broad phase: axis-aligned bounding boxes, two comparisons per axis"""
    return not (P[:, 0].max() < Q[:, 0].min() or Q[:, 0].max() < P[:, 0].min() or P[:, 1].max() < Q[:, 1].min() or Q[:, 1].max() < P[:, 1].min())

def circle_overlap(P, Q):
    """broad phase: bounding circles about the vertex centroids"""
    cp, cq = P.mean(0), Q.mean(0)
    return np.linalg.norm(cp - cq) <= np.linalg.norm(P - cp, axis=1).max() + np.linalg.norm(Q - cq, axis=1).max()

def brute_overlap(P, Q):
    """independent check: an edge of one crosses an edge of the other, or one contains a vertex of the other"""
    def inside(poly, p): return all(cross(poly[(i + 1) % len(poly)] - poly[i], p - poly[i]) >= 0 for i in range(len(poly)))
    def cross_seg(a, b, c, d):
        d1, d2, d3, d4 = cross(b - a, c - a), cross(b - a, d - a), cross(d - c, a - c), cross(d - c, b - c)
        return d1 * d2 < 0 and d3 * d4 < 0
    for i in range(len(P)):
        for j in range(len(Q)):
            if cross_seg(P[i], P[(i + 1) % len(P)], Q[j], Q[(j + 1) % len(Q)]): return True
    return inside(P, Q[0]) or inside(Q, P[0])

def random_convex(rng, n, centre, size):
    """a random convex polygon: points on a circle at sorted random angles (counter-clockwise)"""
    a = np.sort(rng.uniform(0, 2 * np.pi, n)); r = size * rng.uniform(0.6, 1.0)
    return centre + r * np.stack([np.cos(a), np.sin(a)], 1)

def test_matches_brute_force():
    rng = np.random.default_rng(5); agree = hits = 0; N = 5000
    for _ in range(N):
        P = random_convex(rng, rng.integers(3, 8), rng.uniform(0, 4, 2), 1.0)
        Q = random_convex(rng, rng.integers(3, 8), rng.uniform(0, 4, 2), 1.0)
        s = sat_overlap(P, Q)[0]; agree += s == brute_overlap(P, Q); hits += s
    print(f"{N} random pairs of convex polygons: SAT agrees with the brute-force test on {agree}, {hits} overlap")
    assert agree == N

def test_known_cases():
    sq = np.array([[0, 0], [1, 0], [1, 1], [0, 1]], float)
    rot = lambda P, a, c: (P - P.mean(0)) @ np.array([[np.cos(a), np.sin(a)], [-np.sin(a), np.cos(a)]]) + c
    diamond = rot(sq, np.pi / 4, np.array([1.3, 1.3]))       # its lower-left edge x + y = 1.89 cuts the square's corner (x + y = 2)
    gap = rot(sq, np.pi / 4, np.array([1.6, 1.6]))           # edge x + y = 2.49: clear of the corner
    print(f"diamond centred at (1.3, 1.3): overlap {sat_overlap(sq, diamond)[0]}; at (1.6, 1.6): overlap {sat_overlap(sq, gap)[0]}, "
          f"although their bounding boxes overlap: {aabb_overlap(sq, gap)}")
    assert sat_overlap(sq, diamond)[0] and not sat_overlap(sq, gap)[0] and aabb_overlap(sq, gap)
    tri = np.array([[0, 0], [2, 0], [0, 2]], float)
    print(f"square clear of a triangle: separating axis found on test {sat_overlap(sq + [2, 2], tri)[1]} of 7; overlapping: all {sat_overlap(sq, tri)[1]} axes tested")
    assert sat_overlap(sq, tri) == (True, 7)

def test_broad_phase_is_conservative():
    """a broad phase may report false alarms but must never miss a collision"""
    rng = np.random.default_rng(9); missed = culled = 0; N = 5000
    for _ in range(N):
        P = random_convex(rng, 5, rng.uniform(0, 8, 2), 1.0); Q = random_convex(rng, 5, rng.uniform(0, 8, 2), 1.0)
        exact = sat_overlap(P, Q)[0]
        missed += exact and not (aabb_overlap(P, Q) and circle_overlap(P, Q))
        culled += not aabb_overlap(P, Q)
    print(f"broad phase: AABBs rule out {culled / N * 100:.0f} % of {N} pairs without SAT, and miss {missed} collisions")
    assert missed == 0

test_matches_brute_force()
test_known_cases()
test_broad_phase_is_conservative()
print("PASS")
```
:::end

## In practice

FCL, the Flexible Collision Library used by MoveIt and OMPL, organises each robot link and obstacle mesh in a tree of bounding volumes, then runs exact tests on triangle pairs. It also returns distances, which planners such as lesson 12's optimiser use as a clearance cost.

## Exercises

:::exercise
Why is the brute-force edge test in the code not enough by itself, without the containment check?
:::solution
A small polygon entirely inside a large one has no edge crossings at all, yet they overlap. The check that one polygon contains a vertex of the other covers that case.
:::end

:::exercise
How many axes must SAT test for two boxes in 3D?
:::solution
3 face normals of each box plus the $3 \times 3$ cross products of their edge directions: 15. That is the classic oriented bounding box test.
:::end

## Quiz

:::quiz
- type: num
  q: Most axes SAT tests for a convex pentagon against a convex hexagon?
  answer: 11
  tol: 0.001
  py: "5+6"
  explain: One per edge normal.
- type: num
  q: Distinct axes for two rectangles in 2D, at any angles?
  answer: 4
  tol: 0.001
  py: "2+2"
  explain: Each rectangle has only two edge directions.
- type: num
  q: Projection interval length of a unit square onto the unit axis at 45°?
  answer: 1.4142
  tol: 0.002
  py: "math.sqrt(2)"
  explain: The diagonal.
- type: num
  q: Axes for two oriented boxes in 3D?
  answer: 15
  tol: 0.001
  py: "3+3+3*3"
  explain: Face normals plus edge-pair cross products.
- type: mc
  q: SAT applies directly to…
  options:
    - pairs of convex shapes
    - any polygons
    - only rectangles
    - only circles
  answer: 0
  explain: Concave shapes are split into convex pieces first.
- type: mc
  q: A broad phase must never…
  options:
    - report two shapes as clear when they collide
    - report a collision that the exact test rejects
    - use bounding boxes
    - be faster than the narrow phase
  answer: 0
  explain: False alarms cost time; misses cost crashes.
:::end
