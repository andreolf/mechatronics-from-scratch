---
id: p16-l09
minutes: 40
summary: Gridding C-space works for two joints but not for six, where even 10 values per joint means a million cells. A probabilistic roadmap samples random free configurations instead and joins nearby ones with collision-free straight edges. You derive why the chance of missing a path shrinks exponentially with the number of samples, implement a PRM for the arm lab's 2-link arm among the obstacles of lesson 01, and test that it finds a safe path, succeeds more often with more samples, and finds nothing when the goal is cut off.
---

## Sample, connect, search

A **probabilistic roadmap** (PRM) works in two phases.

1. **Build.** Draw random configurations and keep the collision-free ones. Connect each to its $k$ nearest neighbours whenever the straight segment between them in C-space is collision-free.
2. **Query.** Add the start and goal, connect them the same way, and run Dijkstra or A* on the graph.

The roadmap depends only on the obstacles, so one roadmap answers many start-goal queries: PRM is a **multi-query** planner.

On the arm's torus, distances must use the shortest angle difference, so $179°$ and $-179°$ are $2°$ apart. An edge is checked at configurations no more than $2°$ apart with a 5 cm margin, exactly the argument of lesson 01, which makes every accepted edge safe in the continuous workspace.

## Probabilistic completeness

Suppose a path exists with clearance: a tube around it, of volume fraction $p$ in some region, that a roadmap must hit. Each uniform sample misses it with probability $1 - p$, so $n$ samples all miss with probability

$$(1 - p)^n \le e^{-pn}.$$

The chance of failure falls exponentially with $n$: PRM is **probabilistically complete**. It is not complete in the strict sense. With a finite number of samples it can miss a narrow passage, and when it finds nothing, that does not prove there is no path.

:::figure widget=prm caption="A roadmap growing in the arm's C-space (red: blocked joint angles). Add samples and watch the free space fill with edges until the start and goal connect. Each new seed draws a different roadmap."
:::end

## Worked example

The arm lab arm and the three obstacles of lesson 01, from $(0°, 30°)$ to $(120°, -30°)$.

1. 300 samples, $k = 10$: 1746 collision-free edges. The path has 10 nodes and 270° of joint motion; checked densely in the workspace, its smallest clearance is 8.2 cm.
2. Over 20 random roadmaps, the fraction that finds a path: 0.80 with 20 samples, 0.95 with 50, and 1.00 with 100 and 200.
3. A goal at $(170°, 0°)$ is free but in a pocket of C-space cut off from the start. An independent flood fill of a 1° grid from the start covers 43.8 % of C-space and never reaches it. A 400-sample roadmap with 2319 edges finds no path either, as it must.

## Code it from scratch

:::code file=prm.py
```python
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
```
:::end

## In practice

OMPL provides PRM and its relatives (PRM*, lazy PRM), and MoveIt uses OMPL to plan for real arms. Lazy PRM postpones the edge collision checks until an edge lands on a candidate path, because edge checks dominate the run time.

## Exercises

:::exercise
A narrow passage takes up 0.1 % of C-space. How many samples give a 99 % chance of putting at least one in it?
:::solution
Need $(1 - 0.001)^n \le 0.01$, so $n \ge \ln 0.01 / \ln 0.999 \approx 4603$. Narrow passages are PRM's weakness; samplers that bias towards obstacle boundaries or bridges help.
:::end

:::exercise
Why connect to the $k$ nearest neighbours instead of to every node within a fixed radius?
:::solution
A fixed radius gives many edges where samples are dense and none where they are sparse, and the edge count grows quadratically with $n$. $k$ nearest bounds the work at $kn$ edge checks. PRM* grows $k$ like $\log n$ to keep asymptotic optimality.
:::end

## Quiz

:::quiz
- type: num
  q: Probability that 500 uniform samples all miss a region of 1 % of C-space?
  answer: 0.00657
  tol: 0.005
  py: "(1-0.01)**500"
  explain: (1 − p)ⁿ.
- type: num
  q: Collision checks along an edge spanning 30° of joint motion at 2° resolution, counting both ends?
  answer: 16
  tol: 0.001
  py: "30/2+1"
  explain: 15 steps, 16 configurations.
- type: num
  q: Grid cells needed for a 6-joint arm at 10 values per joint?
  answer: 1000000
  tol: 0.001
  py: "10**6"
  explain: The curse of dimensionality.
- type: num
  q: Shortest angle difference between 175° and −175°?
  answer: 10
  tol: 0.001
  unit: °
  py: "abs((-175-175+180)%360-180)"
  explain: The torus wraps round.
- type: mc
  q: PRM is called multi-query because…
  options:
    - one roadmap answers many start and goal pairs
    - it runs several searches in parallel
    - it samples many times
    - it needs many queries to the collision checker
  answer: 0
  explain: The roadmap depends on the obstacles, not on the query.
- type: mc
  q: If a PRM finds no path, you know that…
  options:
    - none was found with these samples, which does not prove there is none
    - there is no path
    - the goal is in collision
    - k was too small
  answer: 0
  explain: Probabilistic completeness only bounds the chance of missing a path.
:::end
