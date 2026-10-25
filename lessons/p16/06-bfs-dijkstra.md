---
id: p16-l06
minutes: 40
summary: The simplest planners treat the map as a grid of free and blocked cells and search it as a graph. You derive why breadth-first search finds the fewest steps when every step costs the same, and why Dijkstra's algorithm finds the cheapest path when steps have different costs, implement both on an occupancy grid, and test their path costs against an independent shortest-path solver on a building-like map and on random maps.
---

## Grids are graphs

An **occupancy grid** divides the map into cells, each free or blocked. Every free cell is a node, joined to its free neighbours: 4-connected (up, down, left, right, each cost 1) or 8-connected (adding diagonals of cost $\sqrt 2$). A diagonal step is allowed only if neither of the cells it cuts past is blocked, so the path can't slip through a corner. Mobile robots plan this way on maps built from their lidar (Phase 17).

## Breadth-first search

BFS expands cells in rings: first the start, then everything 1 step away, then 2, and so on, using a first-in first-out queue. The first time it reaches a cell, it has used the fewest possible steps, because every cell at distance $d$ is dequeued before any at $d + 1$. Each cell and edge is handled once: $O(V + E)$.

BFS is optimal only when all steps cost the same. On an 8-connected grid it would treat a diagonal as 1, not $\sqrt 2$.

## Dijkstra's algorithm

Dijkstra keeps a priority queue ordered by the cost so far, $g$. It repeatedly removes the cheapest cell, marks it final and **relaxes** its neighbours: if $g(c) + w(c, n) < g(n)$, update $g(n)$.

Why is a removed cell final? Every cell still in the queue has $g \ge g(c)$, and costs are non-negative, so any other route to $c$ through them costs at least $g(c)$. With a binary heap, the cost is $O((V + E)\log V)$. Negative step costs break this argument, but distances can't be negative.

:::figure widget=wavefront caption="Breadth-first search or Dijkstra spreading from the start across an occupancy grid. The colour is the cost to reach each cell, and the path is traced back from the goal once it is reached. Move the slider to step through the expansion."
:::end

## Worked example

On an empty grid from $(0, 0)$ to $(3, 5)$: BFS needs $3 + 5 = 8$ steps; 8-connected Dijkstra pays $3\sqrt2 + 2 = 6.243$, three diagonals and two straight steps.

An illustrative 40 × 30 building map with walls and doors, from cell $(2, 2)$ to $(27, 37)$:

1. BFS: 60 steps, having discovered 1000 of the 1114 free cells before reaching the goal. Dijkstra on the 4-connected grid also costs 60, and so does SciPy's shortest-path solver on the same graph.
2. Dijkstra on the 8-connected grid: cost 47.70, matching SciPy, after expanding 975 cells. The path has 40 cells.
3. On 20 random 15 × 15 maps with 25 % of cells blocked, Dijkstra matches the reference on all 15 solvable maps and reports the other 5 unreachable.

## Code it from scratch

:::code file=gridsearch.py
```python
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
```
:::end

## In practice

Nav2, the ROS 2 navigation stack, plans with grid searches like these on a costmap, where cells near obstacles cost more than open floor rather than being simply free or blocked. Dijkstra handles that directly: the step cost becomes the distance times the cell's cost.

## Exercises

:::exercise
Dijkstra expanded 975 cells to find one path. When is that work not wasted?
:::solution
When the start is fixed and you need paths to many goals, or a cost-to-go map for a controller: one Dijkstra run from the goal gives every cell's distance to it, and the robot can descend that field from wherever it is. For a single start and goal, A* (lesson 07) expands far fewer cells.
:::end

:::exercise
Why do 8-connected grid paths still look jagged, and why are they not the true shortest paths?
:::solution
They can only move in 8 directions, so a path at 20° zig-zags between straight and diagonal steps. Its length can exceed the straight line by up to about 8 % (at 22.5°). Any-angle planners such as Theta*, or smoothing the path afterwards, remove the zig-zags.
:::end

## Quiz

:::quiz
- type: num
  q: BFS steps on an empty 4-connected grid from (0, 0) to (6, 2)?
  answer: 8
  tol: 0.001
  py: "6+2"
  explain: The Manhattan distance.
- type: num
  q: 8-connected Dijkstra cost on an empty grid from (0, 0) to (6, 2)?
  answer: 6.828
  tol: 0.002
  py: "2*math.sqrt(2)+4"
  explain: Two diagonals and four straight steps.
- type: num
  q: Largest ratio of 8-connected path length to straight-line distance, at 22.5° (cos 22.5° + (√2 − 1) sin 22.5°)?
  answer: 1.0824
  tol: 0.002
  py: "math.cos(math.radians(22.5))+(math.sqrt(2)-1)*math.sin(math.radians(22.5))"
  explain: The worst angle for an 8-direction grid, about 8 % too long.
- type: num
  q: Edges in a fully free 4-connected 10 × 10 grid, counting each once?
  answer: 180
  tol: 0.001
  py: "2*10*9"
  explain: 9 horizontal edges in each of 10 rows, and the same vertically.
- type: mc
  q: BFS finds optimal paths only when…
  options:
    - every step has the same cost
    - the grid is 8-connected
    - there are no obstacles
    - the goal is reachable in under 100 steps
  answer: 0
  explain: It counts steps, not costs.
- type: mc
  q: Dijkstra can mark a dequeued cell final because…
  options:
    - every other queued cell costs at least as much and step costs are non-negative
    - it has the fewest steps
    - it is the closest to the goal
    - it was added first
  answer: 0
  explain: No detour through a more expensive cell can make it cheaper.
:::end
