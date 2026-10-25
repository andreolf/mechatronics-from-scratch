import heapq
import numpy as np

# illustrative 10 m x 10 m room with three rectangular obstacles (xmin, ymin, xmax, ymax)
RECTS = np.array([[2.0, -1.0, 3.0, 6.5], [5.0, 3.5, 6.0, 11.0], [7.0, 1.0, 9.0, 2.5]])   # the first two run into the walls
START, GOAL = np.array([0.5, 0.5]), np.array([9.5, 9.5])

def seg_hits_rect(p, q, r, eps=1e-9):
    """Liang-Barsky clipping: does segment p-q pass through the open rectangle r?"""
    d = q - p; t0, t1 = 0.0, 1.0
    for k, lo, hi in ((0, r[0], r[2]), (1, r[1], r[3])):
        if abs(d[k]) < 1e-15:
            if p[k] <= lo + eps or p[k] >= hi - eps: return False
        else:
            a, b = (lo + eps - p[k]) / d[k], (hi - eps - p[k]) / d[k]
            t0, t1 = max(t0, min(a, b)), min(t1, max(a, b))
            if t0 >= t1: return False
    return True

def free_seg(p, q): return not any(seg_hits_rect(p, q, r) for r in RECTS)

def optimal_cost():
    """the true shortest path in a polygonal world runs through obstacle corners: Dijkstra on the visibility graph"""
    V = [START, GOAL] + [np.array(c) for r in RECTS for c in ((r[0], r[1]), (r[0], r[3]), (r[2], r[1]), (r[2], r[3]))]
    V = [v for v in V if 0 <= v[0] <= 10 and 0 <= v[1] <= 10]
    dist = {0: 0.0}; pq = [(0.0, 0)]; done = set()
    while pq:
        d, i = heapq.heappop(pq)
        if i in done: continue
        done.add(i)
        for j in range(len(V)):
            if j not in done and free_seg(V[i], V[j]):
                c = d + np.linalg.norm(V[j] - V[i])
                if c < dist.get(j, np.inf): dist[j] = c; heapq.heappush(pq, (c, j))
    return dist[1]

def plan(n, star, seed=0, eta=0.5, goal_bias=0.05, gamma=6.0, every=500):
    """RRT (star=False) or RRT* (star=True) with n samples. Returns the best cost to the goal after every `every` samples."""
    rng = np.random.default_rng(seed)
    P = np.zeros((n + 1, 2)); P[0] = START; parent = np.full(n + 1, -1); cost = np.zeros(n + 1); m = 1
    best, best_i = np.inf, -1; hist = {}
    for it in range(1, n + 1):
        if it > 1 and (it - 1) % every == 0: hist[it - 1] = (best, m)
        x = GOAL if rng.random() < goal_bias else rng.uniform(0, 10, 2)
        d = np.linalg.norm(P[:m] - x, axis=1); i = int(np.argmin(d))
        new = x if d[i] <= eta else P[i] + eta * (x - P[i]) / d[i]                   # steer at most eta towards the sample
        if not free_seg(P[i], new):
            continue
        par, c = i, cost[i] + np.linalg.norm(new - P[i])
        if star:
            r = min(gamma * np.sqrt(np.log(m + 1) / (m + 1)), eta * 2)                # shrinking neighbourhood radius
            near = np.nonzero(np.linalg.norm(P[:m] - new, axis=1) <= r)[0]
            for j in near:                                                            # choose the cheapest parent
                cj = cost[j] + np.linalg.norm(new - P[j])
                if cj < c and free_seg(P[j], new): par, c = j, cj
        P[m], parent[m], cost[m] = new, par, c; k = m; m += 1
        if star:
            for j in near:                                                            # rewire neighbours through the new node
                cj = c + np.linalg.norm(P[j] - new)
                if cj < cost[j] - 1e-12 and free_seg(new, P[j]):
                    delta = cost[j] - cj; parent[j] = k
                    stack = [j]                                                       # push the saving down j's subtree
                    while stack:
                        u = stack.pop(); cost[u] -= delta; stack.extend(np.nonzero(parent[:m] == u)[0].tolist())
        for j in ([k] if not star else range(m)):
            if np.linalg.norm(P[j] - GOAL) < 1e-9 or (np.linalg.norm(P[j] - GOAL) <= eta and free_seg(P[j], GOAL)):
                cg = cost[j] + np.linalg.norm(GOAL - P[j])
                if cg < best: best, best_i = cg, j
    hist[n] = (best, m)
    return hist

def test_rrt_star_improves():
    opt = optimal_cost(); print(f"optimal path cost (visibility graph): {opt:.3f} m")
    rrt, star = plan(4000, False), plan(4000, True)
    for n in (500, 1000, 2000, 4000):
        print(f"after {n} samples: RRT {rrt[n][0]:.3f} m, RRT* {star[n][0]:.3f} m ({(star[n][0] / opt - 1) * 100:.1f} % above optimal, {star[n][1]} nodes)")
    costs = [c for c, _ in star.values()]
    assert all(np.isfinite(costs)) and all(a >= b - 1e-9 for a, b in zip(costs, costs[1:])) and costs[-1] < costs[0]   # cost falls with samples
    assert opt - 1e-9 <= costs[-1] < 1.06 * opt and costs[-1] < rrt[4000][0]

def test_seeds():
    opt = optimal_cost(); r = [plan(2000, False, seed=s)[2000][0] / opt for s in range(1, 6)]; s_ = [plan(2000, True, seed=s)[2000][0] / opt for s in range(1, 6)]
    print(f"5 seeds, 2000 samples, cost / optimal: RRT {np.mean(r):.3f} on average, RRT* {np.mean(s_):.3f}")
    assert np.mean(s_) < np.mean(r)

test_rrt_star_improves()
test_seeds()
print("PASS")
