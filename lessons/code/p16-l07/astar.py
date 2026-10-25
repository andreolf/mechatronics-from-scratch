import heapq
import numpy as np

def make_map(w=40, h=30):
    """the illustrative building map of lesson 06 (True = blocked)"""
    g = np.zeros((h, w), bool)
    g[5:25, 12] = True; g[14:16, 12] = False
    g[0:20, 24] = True
    g[22, 18:36] = True; g[22, 30:32] = False
    g[8:12, 30:38] = True
    return g

N8 = [(1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)]

def neighbours(g, c):
    r, k = c
    for dr, dk in N8:
        n = (r + dr, k + dk)
        if not (0 <= n[0] < g.shape[0] and 0 <= n[1] < g.shape[1]) or g[n]: continue
        if dr and dk and (g[r + dr, k] or g[r, k + dk]): continue
        yield n, (np.sqrt(2) if dr and dk else 1.0)

def octile(a, b):
    """exact cost on an empty 8-connected grid: an admissible and consistent heuristic"""
    dx, dy = abs(a[0] - b[0]), abs(a[1] - b[1])
    return max(dx, dy) + (np.sqrt(2) - 1) * min(dx, dy)

def astar(g, s, t, h=octile, w=1.0):
    """A*: expand by f = g + w h. w = 1 and h = 0 is Dijkstra; w > 1 is weighted A*"""
    cost = {s: 0.0}; prev = {s: None}; pq = [(w * h(s, t), 0.0, s)]; done = set()
    while pq:
        f, d, c = heapq.heappop(pq)
        if c in done: continue
        done.add(c)
        if c == t: break
        for n, step in neighbours(g, c):
            if d + step < cost.get(n, np.inf) - 1e-12:
                cost[n] = d + step; prev[n] = c; heapq.heappush(pq, (d + step + w * h(n, t), d + step, n))
    if t not in cost: return None, None, len(done)
    path = [t]
    while prev[path[-1]] is not None: path.append(prev[path[-1]])
    return cost[t], path[::-1], len(done)

zero = lambda a, b: 0.0

def test_same_cost_fewer_expansions():
    g = make_map(); s, t = (2, 2), (27, 37)
    cd, _, ed = astar(g, s, t, zero)
    ca, path, ea = astar(g, s, t)
    cw, _, ew = astar(g, s, t, w=3.0)
    print(f"Dijkstra: cost {cd:.4f}, {ed} cells expanded")
    print(f"A* (octile): cost {ca:.4f}, {ea} cells expanded ({ea / ed * 100:.0f} %)")
    print(f"weighted A* (w = 3): cost {cw:.4f} ({(cw / cd - 1) * 100:.1f} % longer), {ew} cells expanded")
    assert abs(ca - cd) < 1e-9 and ea < ed
    assert cd - 1e-9 <= cw <= 3 * cd and ew <= ea

def test_random_maps():
    rng = np.random.default_rng(7); fewer = total = 0; worst_w = 1.0
    for _ in range(40):
        g = rng.random((30, 30)) < 0.3; s, t = (0, 0), (29, 29); g[s] = g[t] = False
        cd, _, ed = astar(g, s, t, zero); ca, _, ea = astar(g, s, t)
        if cd is None: assert ca is None; continue
        total += 1; fewer += ea <= ed
        assert abs(ca - cd) < 1e-9                     # admissible heuristic: same optimal cost
        worst_w = max(worst_w, astar(g, s, t, w=3.0)[0] / cd)
    print(f"40 random 30 x 30 maps (30 % blocked): A* matched Dijkstra's cost on all {total} solvable maps, expanding no more cells on {fewer}; weighted A* (w = 3) was up to {(worst_w - 1) * 100:.1f} % longer")
    assert fewer == total and 1 < worst_w <= 3

def test_heuristic_is_consistent():
    """h(a) <= step(a, b) + h(b) for every edge: then every expanded cell is already final"""
    g = make_map(); t = (27, 37); worst = 0.0
    for r in range(g.shape[0]):
        for k in range(g.shape[1]):
            if g[r, k]: continue
            for n, step in neighbours(g, (r, k)): worst = max(worst, octile((r, k), t) - step - octile(n, t))
    print(f"largest h(a) - step - h(b) over all edges: {worst:.1e} (<= 0 up to rounding)")
    assert worst <= 1e-12

test_same_cost_fewer_expansions()
test_random_maps()
test_heuristic_is_consistent()
print("PASS")
