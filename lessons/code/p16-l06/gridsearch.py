import heapq
from collections import deque
import numpy as np
from scipy.sparse import lil_matrix
from scipy.sparse.csgraph import dijkstra as reference_dijkstra

def make_map(w=40, h=30):
    """an illustrative occupancy grid (True = blocked): walls with gaps, like rooms and corridors"""
    g = np.zeros((h, w), bool)
    g[5:25, 12] = True; g[14:16, 12] = False            # wall with a door
    g[0:20, 24] = True                                  # wall from the top
    g[22, 18:36] = True; g[22, 30:32] = False           # wall with a door
    g[8:12, 30:38] = True                               # a block
    return g

N4 = [(1, 0), (-1, 0), (0, 1), (0, -1)]
N8 = N4 + [(1, 1), (1, -1), (-1, 1), (-1, -1)]

def neighbours(g, c, conn):
    r, k = c
    for dr, dk in (N4 if conn == 4 else N8):
        n = (r + dr, k + dk)
        if not (0 <= n[0] < g.shape[0] and 0 <= n[1] < g.shape[1]) or g[n]: continue
        if dr and dk and (g[r + dr, k] or g[r, k + dk]): continue     # no cutting blocked corners diagonally
        yield n, (1.0 if not (dr and dk) else np.sqrt(2))

def bfs(g, s, t):
    """fewest 4-connected steps: the first time a cell is reached is via a shortest path"""
    dist = {s: 0}; prev = {s: None}; Q = deque([s])
    while Q:
        c = Q.popleft()
        if c == t: break
        for n, _ in neighbours(g, c, 4):
            if n not in dist: dist[n] = dist[c] + 1; prev[n] = c; Q.append(n)
    return dist.get(t), prev, len(dist)

def dijkstra(g, s, t, conn=8):
    """least-cost path with step costs 1 and sqrt(2); a cell is final when it leaves the priority queue"""
    dist = {s: 0.0}; prev = {s: None}; pq = [(0.0, s)]; done = set()
    while pq:
        d, c = heapq.heappop(pq)
        if c in done: continue
        done.add(c)
        if c == t: break
        for n, w in neighbours(g, c, conn):
            if d + w < dist.get(n, np.inf): dist[n] = d + w; prev[n] = c; heapq.heappush(pq, (d + w, n))
    path = [t]
    while prev.get(path[-1]) is not None: path.append(prev[path[-1]])
    return dist.get(t), path[::-1], len(done)

def all_pairs_reference(g, s, conn):
    """an independent answer: scipy's Dijkstra on the same graph as a sparse matrix"""
    h, w = g.shape; A = lil_matrix((h * w, h * w))
    for r in range(h):
        for k in range(w):
            if not g[r, k]:
                for n, c in neighbours(g, (r, k), conn): A[r * w + k, n[0] * w + n[1]] = c
    return reference_dijkstra(A.tocsr(), indices=s[0] * w + s[1])

def test_optimal_costs():
    g = make_map(); s, t = (2, 2), (27, 37)
    steps, _, seen = bfs(g, s, t)
    cost8, path, expanded = dijkstra(g, s, t, 8)
    cost4 = dijkstra(g, s, t, 4)[0]
    ref8 = all_pairs_reference(g, s, 8)[t[0] * g.shape[1] + t[1]]
    ref4 = all_pairs_reference(g, s, 4)[t[0] * g.shape[1] + t[1]]
    print(f"BFS: {steps} steps (4-connected), discovered {seen} of {(~g).sum()} free cells; Dijkstra 4-connected cost {cost4:.0f}, reference {ref4:.0f}")
    print(f"Dijkstra 8-connected: cost {cost8:.4f}, reference {ref8:.4f}, {expanded} cells expanded, path of {len(path)} cells")
    assert steps == cost4 == ref4 and abs(cost8 - ref8) < 1e-9
    assert all(not g[c] for c in path) and cost8 < steps          # diagonal moves shorten the path

def test_random_maps():
    rng = np.random.default_rng(3); n = 0
    for _ in range(20):
        g = rng.random((15, 15)) < 0.25; g[0, 0] = g[14, 14] = False
        c = dijkstra(g, (0, 0), (14, 14))[0]; r = all_pairs_reference(g, (0, 0), 8)[-1]
        if c is None: assert np.isinf(r); continue
        assert abs(c - r) < 1e-9; n += 1
    print(f"20 random 15 x 15 maps: Dijkstra matches the reference on all {n} solvable ones and reports the rest unreachable")

def test_empty_grid():
    g = np.zeros((10, 10), bool)
    print(f"empty grid (0,0) to (3,5): BFS {bfs(g, (0, 0), (3, 5))[0]} steps, 8-connected cost {dijkstra(g, (0, 0), (3, 5))[0]:.4f} = 3 sqrt(2) + 2")
    assert bfs(g, (0, 0), (3, 5))[0] == 8 and abs(dijkstra(g, (0, 0), (3, 5))[0] - (3 * np.sqrt(2) + 2)) < 1e-12

test_optimal_costs()
test_random_maps()
test_empty_grid()
print("PASS")
