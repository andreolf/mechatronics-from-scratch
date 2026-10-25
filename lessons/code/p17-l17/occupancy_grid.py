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
