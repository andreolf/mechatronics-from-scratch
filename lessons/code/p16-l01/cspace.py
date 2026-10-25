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
