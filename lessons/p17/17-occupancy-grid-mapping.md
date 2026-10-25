---
id: p17-l17
minutes: 40
summary: An occupancy grid divides the world into cells, each holding the probability that it is occupied. You implement Bresenham ray tracing and the log-odds update that turns laser scans from known poses into a map, and build an illustrative room map that classifies over 98 % of observed cells correctly, the map format Nav2 plans on.
---

## Grids and log-odds

An **occupancy grid** stores, for each cell, $p(m_i = \text{occupied} \mid z_{1:t}, x_{1:t})$, assuming known robot poses and independent cells. Bayes' rule for a binary variable is simplest in **log-odds**, $\ell = \log\frac{p}{1 - p}$:

$$\ell_i \leftarrow \ell_i + \underbrace{\log\frac{p(m_i \mid z_t, x_t)}{1 - p(m_i \mid z_t, x_t)}}_{\text{inverse sensor model}} - \ell_0.$$

Each observation **adds** a constant: here $+0.85$ for a beam ending in the cell (hit), $-0.4$ for a beam passing through it (free). With prior $\ell_0 = 0$ ($p = 0.5$, unknown), $p = 1 - 1/(1 + e^\ell)$. **Clamping** $\ell$ to $[-4, 4]$ keeps the map able to change when a door opens or a chair moves.

## Tracing the beams

For each beam, the cells between the sensor and the end point are free and the end cell is occupied (if the beam hit something within range). **Bresenham's line algorithm** lists those cells with integer additions only. A beam that returns maximum range marks only free cells.

## What the map gets wrong

Range noise and the cell size blur wall surfaces: a beam that ends a few centimetres short marks a wall cell as free, one that ends long marks the cell behind. Errors therefore concentrate within a cell or two of surfaces. The free-space evidence also outweighs hits on thin obstacles seen at grazing angles, which is why the hit increment is larger than the free one.

:::figure widget=occgrid caption="An illustrative room mapped from laser scans along a known path. Add scans one by one and watch unknown grey cells turn free (dark) or occupied (bright)."
:::end

## Worked example

An illustrative 8 × 5 m area at 5 cm cells (160 × 100) with outer walls, a pillar and two wall stubs; 180 beams per scan every 2°, 2 cm range noise; scans along a known S-shaped path. A cell counts as observed when $|\ell| > 0.5$.

1. Three hits on a cell: $\ell = 2.55$, $p = 0.928$; one more pass-through brings it to 0.896.
2. Bresenham from $(0, 0)$ to $(3, 7)$ visits 8 cells.
3. 1 scan: 7.4 % of cells observed (a single free pass, $-0.4$, is below the threshold), 96.2 % correct. 5 scans: 69.2 % observed, 98.8 % correct. 20 scans: 92.2 % observed, 98.3 % correct, with 99.7 % of observed wall cells marked occupied.
4. All 245 misclassified cells after 20 scans are within 2 cells (10 cm) of a wall surface.

## Code it from scratch

:::code file=occupancy_grid.py
```python
import numpy as np
from scipy.ndimage import binary_dilation, binary_erosion

RES = 0.05                                                            # illustrative 5 cm cells
W, H = 160, 100                                                      # an 8 x 5 m area
L_OCC, L_FREE, L_MIN, L_MAX = 0.85, -0.4, -4.0, 4.0                   # inverse sensor model in log-odds, with clamping

def true_map():
    """illustrative ground truth: outer walls, a pillar and a wall stub (True = occupied)"""
    g = np.zeros((H, W), bool); g[:2, :] = g[-2:, :] = True; g[:, :2] = g[:, -2:] = True
    g[30:50, 100:120] = True; g[:24, 30:33] = True; g[70:, 60:63] = True
    return g

def cast(grid, x, y, ang, max_range=6.0):
    """march along a beam in quarter-cell steps until it hits an occupied cell (a simple stand-in for a real laser)"""
    for r in np.arange(0, max_range, RES / 4):
        i, j = int((y + r * np.sin(ang)) / RES), int((x + r * np.cos(ang)) / RES)
        if not (0 <= i < H and 0 <= j < W): return r, False
        if grid[i, j]: return r, True
    return max_range, False

def bresenham(i0, j0, i1, j1):
    """the cells on the line from (i0, j0) to (i1, j1), integer arithmetic only"""
    cells = []; di, dj = abs(i1 - i0), abs(j1 - j0); si, sj = (1 if i1 > i0 else -1), (1 if j1 > j0 else -1); err = dj - di
    while True:
        cells.append((i0, j0))
        if (i0, j0) == (i1, j1): return cells
        e2 = 2 * err
        if e2 > -di: err -= di; j0 += sj
        if e2 < dj: err += dj; i0 += si

def integrate(L, x, y, th, ranges, angles, hits):
    """log-odds update: cells the beam passes through become more likely free, the end cell more likely occupied"""
    i0, j0 = int(y / RES), int(x / RES)
    for r, a, hit in zip(ranges, angles, hits):
        ex, ey = x + r * np.cos(th + a), y + r * np.sin(th + a)
        i1, j1 = min(max(int(ey / RES), 0), H - 1), min(max(int(ex / RES), 0), W - 1)
        cells = bresenham(i0, j0, i1, j1)
        for i, j in cells[:-1]: L[i, j] += L_FREE
        if hit: L[i1, j1] += L_OCC
        else: L[i1, j1] += L_FREE
    np.clip(L, L_MIN, L_MAX, out=L)

def prob(L): return 1 - 1 / (1 + np.exp(L))

def build(n_scans, noise=0.02, seed=0):
    rng = np.random.default_rng(seed); g = true_map(); L = np.zeros((H, W))
    path = [(0.8 + 6.4 * t, 2.5 - 0.8 * np.sin(2 * np.pi * t), 0.3 * t) for t in np.linspace(0, 1, n_scans)]
    angles = np.radians(np.arange(0, 360, 2))
    for x, y, th in path:
        rh = [cast(g, x, y, th + a) for a in angles]
        ranges = np.array([r for r, _ in rh]) + rng.normal(0, noise, len(angles))
        integrate(L, x, y, th, ranges, angles, [h for _, h in rh])
    return L, g

def score(L, g):
    known = np.abs(L) > 0.5; p = prob(L)
    agree = ((p > 0.5) == g)[known].mean(); occ_recall = (g & known & (p > 0.5)).sum() / (g & known).sum()
    return known.mean(), agree, occ_recall

def test_log_odds():
    l = 0.0
    for _ in range(3): l += L_OCC
    print(f"three hits on a cell: log-odds {l:.2f}, probability {prob(np.array(l)):.3f}; one more miss: {prob(np.array(l + L_FREE)):.3f}")
    assert abs(prob(np.array(0.0)) - 0.5) < 1e-12 and prob(np.array(l)) > 0.9

def test_bresenham():
    c = bresenham(0, 0, 3, 7)
    print(f"cells from (0, 0) to (3, 7): {c}")
    assert c[0] == (0, 0) and c[-1] == (3, 7) and len(c) == 8

def test_map_matches_truth():
    for n in (1, 5, 20):
        L, g = build(n); seen, agree, rec = score(L, g)
        print(f"{n:2d} scans: {100 * seen:.1f} % of cells observed, {100 * agree:.1f} % of observed cells classified correctly, "
              f"{100 * rec:.1f} % of observed wall cells marked occupied")
    assert agree > 0.95 and seen > 0.6
    wrong = (np.abs(L) > 0.5) & ((prob(L) > 0.5) != g); surface = g & ~binary_erosion(g)
    near = binary_dilation(surface, iterations=2)
    print(f"all {wrong.sum()} misclassified cells within 2 cells (10 cm) of a wall surface: {bool((wrong <= near).all())}")
    assert (wrong <= near).all()

test_log_odds()
test_bresenham()
test_map_matches_truth()
print("PASS")
```
:::end

## In practice

Nav2 plans on occupancy grids (`nav_msgs/OccupancyGrid`, values 0 to 100 and -1 for unknown), saved as an image plus YAML by `map_saver`. The map is usually built once with a SLAM package (slam_toolbox), then AMCL (lesson 15) localises in it. Costmaps layer obstacles seen live on top.

## Exercises

:::exercise
How many consistent hits are needed to take an unknown cell above $p = 0.95$ with $+0.85$ per hit?
:::solution
$\ell = \log(0.95/0.05) = 2.94$, so $2.94 / 0.85 = 3.5$: four hits.
:::end

:::exercise
Why not just set a cell to "occupied" whenever a beam ends in it?
:::solution
A single spurious reading (a person walking past, a reflection) would mark it forever. Adding evidence lets later free observations overturn it, and clamping makes sure that is always possible.
:::end

## Quiz

:::quiz
- type: num
  q: Probability of a cell with log-odds 2?
  answer: 0.8808
  tol: 0.002
  py: "1/(1+math.exp(-2))"
  explain: 1 - 1/(1 + e^2).
- type: num
  q: Log-odds after two hits (+0.85 each) and one pass-through (-0.4)?
  answer: 1.3
  tol: 0.002
  py: "2*0.85-0.4"
  explain: Updates add.
- type: num
  q: Cells in a 20 × 20 m map at 5 cm resolution?
  answer: 160000
  tol: 0.001
  py: "400*400"
  explain: 400 cells per side.
- type: num
  q: Log-odds of p = 0.5?
  answer: 0
  tol: 0.001
  py: "0.0"
  explain: log(1) = 0, unknown.
- type: mc
  q: Log-odds clamping is used so that…
  options:
    - the map can still change when the world changes
    - the map uses less memory
    - beams can pass through walls
    - Bresenham's algorithm works
  answer: 0
  explain: Without it, long-observed cells could never flip.
- type: mc
  q: Occupancy grid mapping as presented here assumes…
  options:
    - the robot's poses are known
    - the map is known
    - the laser has no noise
    - only one scan
  answer: 0
  explain: Mapping with known poses; SLAM drops that assumption.
:::end
