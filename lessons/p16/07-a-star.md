---
id: p16-l07
minutes: 35
summary: Dijkstra spreads evenly in every direction, even away from the goal. A* adds an estimate of the remaining cost so the search leans towards the goal, and it still returns the optimal path as long as the estimate never overestimates. You derive why an admissible heuristic preserves optimality, implement A* with the octile heuristic, and test that it matches Dijkstra's cost on the lesson 06 map and on random maps while expanding far fewer cells.
---

## Cost so far plus cost to go

A* orders its priority queue by

$$f(n) = g(n) + h(n),$$

where $g(n)$ is the cost from the start (as in Dijkstra) and $h(n)$ is a **heuristic** estimate of the cost from $n$ to the goal. With $h = 0$, A* is Dijkstra.

On an 8-connected grid with no obstacles, the exact cost from $(x, y)$ to the goal is the **octile distance**:

$$h = \max(\Delta x, \Delta y) + (\sqrt 2 - 1)\min(\Delta x, \Delta y).$$

Obstacles can only make the true cost larger, so $h$ never overestimates. On a 4-connected grid, the Manhattan distance $\Delta x + \Delta y$ plays the same role.

## Why admissible means optimal

A heuristic is **admissible** if $h(n) \le h^*(n)$, the true remaining cost, for every $n$. Suppose A* is about to finish with a suboptimal goal cost $g(t) > C^*$. Some cell $n$ on an optimal path is still in the queue, with $f(n) = g(n) + h(n) \le g(n) + h^*(n) = C^*$. Since $f(n) \le C^* < g(t) = f(t)$, $n$ would come out first. So A* can't finish with a worse path.

A stronger property, **consistency**, requires $h(a) \le w(a, b) + h(b)$ for every edge. Then $f$ never decreases along a path, and every expanded cell is already final, as in Dijkstra. The octile distance is consistent.

Inflating the heuristic, $f = g + w\,h$ with $w > 1$, is **weighted A***. It expands fewer cells but gives up optimality; the cost is at most $w$ times the optimum.

:::figure widget=astar caption="Cells expanded by Dijkstra, A* and weighted A* on the same map. All find a path; compare the number of cells each had to expand and the cost it paid."
:::end

## Worked example

The 40 × 30 building map from lesson 06, from $(2, 2)$ to $(27, 37)$:

1. Dijkstra: cost 47.70, after expanding 975 cells.
2. A* with the octile heuristic: the same cost 47.70, after expanding 309 cells, 32 % of Dijkstra's work.
3. Weighted A* with $w = 3$: 40 cells expanded. Here its path happens to be optimal too.
4. On 40 random 30 × 30 maps with 30 % of cells blocked, A* matched Dijkstra's cost on all 19 solvable maps and never expanded more cells. Weighted A* was up to 18.1 % longer.
5. Over every edge of the map, $h(a) - w(a, b) - h(b) \le 7 \times 10^{-15}$: consistent up to rounding.

## Code it from scratch

:::code file=astar.py
```python
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
```
:::end

## In practice

Nav2's grid planner offers both Dijkstra and A* on a costmap. When cells cost more near obstacles, the plain octile distance (which assumes the cheapest cell cost everywhere) is still admissible.

## Exercises

:::exercise
Is the Euclidean distance admissible on an 8-connected grid? Is it better or worse than octile?
:::solution
Admissible: no grid path is shorter than the straight line. But it is smaller than the octile distance, which is the exact cost without obstacles, so it is less informed and A* expands more cells.
:::end

:::exercise
What happens if the heuristic overestimates, say $h = 2 \times$ octile?
:::solution
That is weighted A* with $w = 2$. The search heads for the goal more greedily and expands fewer cells, but it can commit to a worse route. Its cost is guaranteed to be at most twice the optimum.
:::end

## Quiz

:::quiz
- type: num
  q: Octile distance from (0, 0) to (7, 3)?
  answer: 8.243
  tol: 0.002
  py: "7+(math.sqrt(2)-1)*3"
  explain: max + (√2 − 1) min.
- type: num
  q: Manhattan distance from (0, 0) to (7, 3), the 4-connected heuristic?
  answer: 10
  tol: 0.001
  py: "7+3"
  explain: Δx + Δy.
- type: num
  q: Worst-case cost bound for weighted A* with w = 1.5 when the optimum is 40?
  answer: 60
  tol: 0.001
  py: "1.5*40"
  explain: At most w times optimal.
- type: num
  q: Fraction of Dijkstra's expansions A* needed on the building map?
  answer: 0.317
  tol: 0.005
  py: "309/975"
  explain: 309 of 975 cells.
- type: mc
  q: A heuristic is admissible when…
  options:
    - it never overestimates the true remaining cost
    - it never underestimates it
    - it is zero at the start
    - it equals the Euclidean distance
  answer: 0
  explain: Then A* returns an optimal path.
- type: mc
  q: A* with h = 0 is…
  options:
    - Dijkstra's algorithm
    - breadth-first search on any grid
    - greedy best-first search
    - depth-first search
  answer: 0
  explain: It orders cells by g alone.
:::end
