import heapq
import numpy as np

L1, L2 = 1.0, 0.8                                            # the arm lab arm and the obstacles of lesson 01
OBST = np.array([(1.1, 0.9, 0.25), (-0.9, 0.8, 0.3), (0.2, -1.2, 0.3)])
MARGIN, RES = 0.05, np.radians(2)                            # as in lesson 01: 2 degree checks are safe with a 5 cm margin

def clearance(Q):
    """clearance of many configurations at once (rows of Q are (q1, q2)); negative = collision"""
    Q = np.atleast_2d(Q); e = np.stack([L1 * np.cos(Q[:, 0]), L1 * np.sin(Q[:, 0])], 1)
    t = e + np.stack([L2 * np.cos(Q.sum(1)), L2 * np.sin(Q.sum(1))], 1)
    best = np.full(len(Q), np.inf)
    for a, b in ((np.zeros_like(e), e), (e, t)):
        ab = b - a
        for cx, cy, r in OBST:
            p = np.array([cx, cy]); u = np.clip(np.sum((p - a) * ab, 1) / np.sum(ab * ab, 1), 0, 1)
            best = np.minimum(best, np.linalg.norm(a + u[:, None] * ab - p, axis=1) - r)
    return best

def wrap(d): return (d + np.pi) % (2 * np.pi) - np.pi        # shortest signed angle difference

def edge_free(a, b):
    d = wrap(b - a); n = max(1, int(np.ceil(np.abs(d).max() / RES)))
    return clearance(a + np.outer(np.linspace(0, 1, n + 1), d)).min() >= MARGIN

def prm(start, goal, n=300, k=10, seed=0):
    """sample free configurations on the torus, connect each to its k nearest with collision-free edges, search the graph"""
    rng = np.random.default_rng(seed); S = []
    while len(S) < n:
        q = rng.uniform(-np.pi, np.pi, (n, 2)); S.extend(q[clearance(q) >= MARGIN])
    V = np.array([start, goal] + S[:n]); adj = {i: [] for i in range(len(V))}; edges = 0
    for i in range(len(V)):
        dist = np.linalg.norm(wrap(V - V[i]), axis=1)
        for j in np.argsort(dist)[1:k + 1]:
            if j in (e for e, _ in adj[i]): continue
            if edge_free(V[i], V[j]): adj[i].append((j, dist[j])); adj[j].append((i, dist[j])); edges += 1
    cost = {0: 0.0}; prev = {0: None}; pq = [(0.0, 0)]; done = set()        # Dijkstra on the roadmap
    while pq:
        d, i = heapq.heappop(pq)
        if i in done: continue
        done.add(i)
        for j, w in adj[i]:
            if d + w < cost.get(j, np.inf): cost[j] = d + w; prev[j] = i; heapq.heappush(pq, (d + w, j))
    if 1 not in cost: return None, edges
    path = [1]
    while prev[path[-1]] is not None: path.append(prev[path[-1]])
    return V[path[::-1]], edges

R = np.radians
def test_finds_safe_path():
    path, edges = prm(R([0, 30]), R([120, -30]))
    assert path is not None
    dense = np.concatenate([a + np.outer(np.linspace(0, 1, 50, endpoint=False), wrap(b - a)) for a, b in zip(path[:-1], path[1:])])
    length = sum(np.linalg.norm(wrap(b - a)) for a, b in zip(path[:-1], path[1:]))
    print(f"PRM, 300 samples, k = 10: {edges} edges; path of {len(path)} nodes, {np.degrees(length):.0f} deg of joint motion, smallest workspace clearance {clearance(dense).min() * 100:.1f} cm")
    assert clearance(dense).min() > 0

def test_success_grows_with_samples():
    rates = {}
    for n in (20, 50, 100, 200):
        rates[n] = np.mean([prm(R([0, 30]), R([120, -30]), n=n, seed=s)[0] is not None for s in range(20)])
    print("fraction of 20 random roadmaps that find a path: " + ", ".join(f"{n} samples {r:.2f}" for n, r in rates.items()))
    assert rates[200] == 1.0 and rates[20] < rates[200]

def test_unreachable_goal():
    """a goal in a free pocket cut off from the start: no roadmap can connect them"""
    goal = R([170, 0]); assert clearance(goal)[0] >= MARGIN
    # independent check: flood-fill the 1 degree C-space grid from the start (angles wrap) and see if the goal is reached
    qs = -np.pi + 2 * np.pi * np.arange(360) / 360; G = np.stack(np.meshgrid(qs, qs, indexing='ij'), -1).reshape(-1, 2)
    free = (clearance(G) >= MARGIN).reshape(360, 360); seen = np.zeros_like(free); cell = lambda q: tuple(np.round((q + np.pi) / (2 * np.pi) * 360).astype(int) % 360)
    stack = [cell(R([0, 30]))]; seen[stack[0]] = True
    while stack:
        i, j = stack.pop()
        for di, dj in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            n = ((i + di) % 360, (j + dj) % 360)
            if free[n] and not seen[n]: seen[n] = True; stack.append(n)
    print(f"flood fill from the start reaches {seen.mean() * 100:.1f} % of C-space; the goal cell reached: {bool(seen[cell(goal)])}")
    assert not seen[cell(goal)]
    path, edges = prm(R([0, 30]), goal, n=400)
    print(f"goal (170, 0) deg sits in a separate free region: {edges} edges, path found: {path is not None}")
    assert path is None

test_finds_safe_path()
test_success_grows_with_samples()
test_unreachable_goal()
print("PASS")
