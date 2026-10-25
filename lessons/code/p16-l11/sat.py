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
