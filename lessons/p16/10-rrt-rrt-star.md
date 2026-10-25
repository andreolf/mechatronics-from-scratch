---
id: p16-l10
minutes: 45
summary: A rapidly-exploring random tree grows from the start towards random samples, and its biggest gaps attract the next samples, so it spreads into unexplored space fast. You derive the Voronoi bias that makes it explore, and why plain RRT keeps whatever path it finds first while RRT* rewires the tree and converges to the optimum. You implement both for a point robot in a room, and test that RRT*'s path cost falls with more samples towards the true optimum found on the visibility graph.
---

## Grow towards random points

RRT keeps a tree rooted at the start. Each iteration:

1. sample a random point $x$ (with a small probability, the goal itself: **goal bias**);
2. find the nearest tree node $q_{near}$;
3. **steer**: step at most $\eta$ from $q_{near}$ towards $x$, giving $q_{new}$;
4. if the segment is collision-free, add $q_{new}$ with parent $q_{near}$.

## Voronoi bias

Which node gets extended? The one nearest to the sample: so a node's chance is the area of its **Voronoi cell**, the region closer to it than to any other node. Nodes at the frontier of the tree have huge Voronoi cells extending into unexplored space; nodes deep inside have tiny ones. The tree is pulled outwards, which is why it is "rapidly exploring". RRT is single-query and probabilistically complete.

## RRT*

Plain RRT never revises a node's parent, so its first path stays jagged, and its cost converges to something worse than optimal. RRT* adds two steps for each new node, using a neighbourhood of radius $r_n \propto (\log n / n)^{1/d}$:

- **choose parent**: connect $q_{new}$ to the neighbour that gives it the lowest cost from the start, not just to $q_{near}$;
- **rewire**: for each neighbour, if going through $q_{new}$ is cheaper, make $q_{new}$ its parent, and pass the saving down its subtree.

With the radius shrinking at that rate, each new node still has about $\log n$ neighbours, and RRT* is **asymptotically optimal**: its cost converges to the optimum as $n \to \infty$.

:::figure widget=rrt caption="An RRT or RRT* tree growing across a room. Add samples and compare: RRT keeps its first jagged path, while RRT* rewires the tree into straighter branches and its path cost keeps falling."
:::end

## Worked example

An illustrative 10 m × 10 m room with three rectangular obstacles, from $(0.5, 0.5)$ to $(9.5, 9.5)$, step $\eta = 0.5$ m, 5 % goal bias. In a world of polygons, the shortest path bends only at obstacle corners, so Dijkstra on the **visibility graph** (start, goal and corners, joined where they can see each other) gives the true optimum: 18.736 m.

| samples | RRT (m) | RRT* (m) | RRT* above optimal |
|---|---|---|---|
| 500 | 23.456 | 20.370 | 8.7 % |
| 1000 | 23.456 | 20.097 | 7.3 % |
| 2000 | 23.456 | 19.743 | 5.4 % |
| 4000 | 23.456 | 19.731 | 5.3 % |

RRT's path never improves after it is found. Over 5 other seeds with 2000 samples, RRT averages 1.337 times the optimum and RRT* 1.080 times.

## Code it from scratch

:::code file=rrt.py
```python
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
```
:::end

## In practice

OMPL's RRTConnect, which grows trees from both ends and meets in the middle, is the usual default in MoveIt for arm planning: it finds a feasible path fast, and the path is then shortened and smoothed. RRT* and its successors (Informed RRT*, BIT*) are used when path quality matters more than planning time.

## Exercises

:::exercise
Why does a small goal bias help, and why not set it to 50 %?
:::solution
Sampling the goal occasionally pulls the tree towards it once the way is open. At 50 %, the tree spends half its effort trying to grow straight at the goal, gets stuck against obstacles in between, and stops exploring: the Voronoi bias is lost.
:::end

:::exercise
RRT* at 4000 samples is still 5.3 % above optimal. Where is the remaining cost?
:::solution
Mostly near the corners the optimal path wraps around. The tree must have nodes very close to each corner to cut it tightly, and uniform sampling puts few there. Informed RRT* samples only the ellipse of points that could improve the current path, which concentrates samples where they matter.
:::end

## Quiz

:::quiz
- type: num
  q: Expected number of goal samples in 1000 iterations with a 5 % goal bias?
  answer: 50
  tol: 0.001
  py: "0.05*1000"
  explain: 5 % of the samples.
- type: num
  q: Nodes needed in a straight line of 0.5 m steps to cover 12 m?
  answer: 24
  tol: 0.001
  py: "12/0.5"
  explain: Each extension moves at most η.
- type: num
  q: Length of a path from (0, 0) to (3, 4) via no obstacles?
  answer: 5
  tol: 0.001
  unit: m
  py: "math.hypot(3,4)"
  explain: The straight line, which the visibility graph finds when it's free.
- type: num
  q: Ratio of the RRT* radius at n = 4000 to that at n = 1000 in 2D, (log n/n)^½?
  answer: 0.5479
  tol: 0.005
  py: "math.sqrt(math.log(4000)/4000)/math.sqrt(math.log(1000)/1000)"
  explain: The neighbourhood shrinks slightly slower than 1/√n.
- type: mc
  q: The Voronoi bias of RRT means…
  options:
    - frontier nodes, with large Voronoi cells, are extended most often
    - the tree grows towards the goal only
    - samples are taken on a grid
    - nodes are connected to all neighbours
  answer: 0
  explain: The nearest node to a uniform sample is likely to border unexplored space.
- type: mc
  q: What makes RRT* asymptotically optimal, unlike RRT?
  options:
    - choosing the cheapest parent and rewiring neighbours
    - a larger goal bias
    - a smaller step size
    - growing two trees
  answer: 0
  explain: The tree keeps being repaired as samples arrive.
:::end
