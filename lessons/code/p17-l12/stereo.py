import numpy as np
try:
    import cv2
except ImportError:
    cv2 = None

F, B, CX, CY, H, W = 400.0, 0.12, 160.0, 120.0, 240, 320              # illustrative rectified pair: f in px, baseline in m
RNG = np.random.default_rng(0); WAVES = RNG.normal(0, 25, (40, 2)); PHASE = RNG.uniform(0, 2 * np.pi, 40)

def texture(X, Y, z0):
    """illustrative surface pattern painted on each plane (a sum of random sinusoids in world metres)"""
    s = np.zeros_like(X)
    for (a, b), p in zip(WAVES, PHASE): s += np.sin(a * X + b * Y + p + 3 * z0)
    return 128 + 22 * s / np.sqrt(len(PHASE) / 2)

def render(cam_x):
    """a camera at (cam_x, 0, 0) sees a 0.6 x 0.5 m box face at 1.6 m in front of a wall at 4 m"""
    v, u = np.mgrid[0:H, 0:W].astype(float); img = np.empty((H, W)); depth = np.empty((H, W))
    for z, box in ((4.0, False), (1.6, True)):
        X = (u - CX) * z / F + cam_x; Y = (v - CY) * z / F
        hit = (np.abs(X) < 0.3) & (np.abs(Y) < 0.25) if box else np.ones((H, W), bool)
        img[hit] = texture(X, Y, z)[hit]; depth[hit] = z
    return np.clip(img, 0, 255).astype(np.uint8), depth

def block_match(L, R, max_d=48, half=4):
    """for each left pixel, the disparity d minimising the sum of absolute differences with the right pixel d columns left,
    refined to sub-pixel by a parabola through the costs at d - 1, d, d + 1"""
    L, R = L.astype(float), R.astype(float); k = 2 * half + 1
    cost = np.full((max_d + 1, H, W), np.inf)
    for d in range(max_d + 1):
        diff = np.abs(L[:, d:] - R[:, :W - d])
        c = np.cumsum(np.cumsum(np.pad(diff, ((half + 1, half), (half + 1, half))), 0), 1)
        box = c[k:, k:] - c[:-k, k:] - c[k:, :-k] + c[:-k, :-k]
        cost[d][:, d:] = box
    d0 = np.argmin(cost, 0); i, j = np.indices(d0.shape)
    inner = (d0 > 0) & (d0 < max_d)
    c0 = cost[np.clip(d0 - 1, 0, max_d), i, j]; c1 = cost[d0, i, j]; c2 = cost[np.clip(d0 + 1, 0, max_d), i, j]
    den = c0 - 2 * c1 + c2
    with np.errstate(all="ignore"):
        sub = np.where(inner & np.isfinite(den) & (den > 0), 0.5 * (c0 - c2) / den, 0.0)
    disp = d0 + sub; best = c1
    second = np.where(np.abs(np.arange(max_d + 1)[:, None, None] - d0) > 1, cost, np.inf).min(0)
    valid = (j >= max_d + half) & (i >= half) & (i < H - half) & (j < W - half) & (best < 0.9 * second)   # uniqueness check
    return disp, valid

def depth_from_disparity(d): return F * B / d

def test_formula():
    d_box, d_wall = F * B / 1.6, F * B / 4.0
    print(f"disparity of the box {d_box:.1f} px, of the wall {d_wall:.1f} px; 1 px of disparity error at 4 m is {4.0 ** 2 / (F * B):.2f} m of depth")
    assert abs(d_box - 30) < 1e-9 and abs(d_wall - 12) < 1e-9

def test_block_matching():
    L, true_z = render(0.0); R, _ = render(B)
    disp, valid = block_match(L, R)
    z = depth_from_disparity(np.maximum(disp, 0.5))
    inner = valid & (np.abs(true_z - np.roll(true_z, 6, 1)) == 0) & (np.abs(true_z - np.roll(true_z, -6, 1)) == 0)
    err_d = np.abs(disp - F * B / true_z)[inner]
    for zz in (1.6, 4.0):
        m = inner & (true_z == zz); e = np.abs(z - true_z)[m]; ed = np.median(np.abs(disp - F * B / zz)[m])
        print(f"surface at {zz} m: median depth {np.median(z[m]):.3f} m, median error {1000 * np.median(e):.1f} mm; "
              f"z^2 / fB times its median disparity error of {ed:.3f} px predicts {1000 * zz ** 2 / (F * B) * ed:.1f} mm")
        assert abs(np.median(e) - zz ** 2 / (F * B) * ed) < 0.2 * np.median(e)
    print(f"{100 * valid.mean():.1f} % of pixels pass the uniqueness check; {100 * (err_d < 0.5).mean():.2f} % of those away from edges are within 0.5 px")
    assert (err_d < 0.5).mean() > 0.97
    if cv2 is None: print("OpenCV not installed: skipping the comparison"); return
    bm = cv2.StereoBM_create(numDisparities=64, blockSize=9); dc = bm.compute(L, R).astype(float) / 16
    ok = inner & (dc > 0)
    print(f"cv2.StereoBM: {100 * (np.abs(dc - F * B / true_z)[ok] < 1).mean():.2f} % of its valid pixels away from edges within 1 px of the truth; "
          f"ours and OpenCV's agree within 1 px on {100 * (np.abs(dc - disp)[ok & valid] < 1).mean():.2f} % of pixels both keep")
    assert (np.abs(dc - disp)[ok & valid] < 1).mean() > 0.95

test_formula()
test_block_matching()
print("PASS")
