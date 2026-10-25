import numpy as np
from collections import deque
try:
    import cv2
except ImportError:
    cv2 = None

def make_image(n=9, noise=30.0, seed=3):
    """illustrative 120 x 160 image of n non-overlapping bright parts (discs) on a dark conveyor, with noise"""
    rng = np.random.default_rng(seed); y, x = np.mgrid[0:120, 0:160]
    img = np.full((120, 160), 60.0); truth = []
    while len(truth) < n:
        c = rng.uniform([14, 14], [106, 146]); r = rng.uniform(6, 11)
        if all(np.hypot(*(c - d)) > r + s + 4 for d, s in truth):
            truth.append((c, r)); img[(y - c[0]) ** 2 + (x - c[1]) ** 2 <= r * r] = rng.uniform(160, 210)
    img = np.clip(img + rng.normal(0, noise, img.shape), 0, 255).astype(np.uint8)
    return img, truth

def otsu(img):
    """the threshold t that maximises the between-class variance w0 w1 (mu0 - mu1)^2 of the histogram"""
    p = np.bincount(img.ravel(), minlength=256) / img.size; levels = np.arange(256)
    w0 = np.cumsum(p); mu = np.cumsum(p * levels); mu_t = mu[-1]
    with np.errstate(divide="ignore", invalid="ignore"):
        sb = (mu_t * w0 - mu) ** 2 / (w0 * (1 - w0))
    sb[~np.isfinite(sb)] = 0
    return int(np.argmax(sb))                                        # pixels > t are foreground

def components(mask, min_area=1):
    """8-connected components by breadth-first flood fill: label image and (area, centroid row, centroid col) per blob"""
    H, W = mask.shape; lab = np.zeros((H, W), int); stats = []
    for i0 in range(H):
        for j0 in range(W):
            if mask[i0, j0] and not lab[i0, j0]:
                k = len(stats) + 1; lab[i0, j0] = k; q = deque([(i0, j0)]); pix = []
                while q:
                    i, j = q.popleft(); pix.append((i, j))
                    for di in (-1, 0, 1):
                        for dj in (-1, 0, 1):
                            a, b = i + di, j + dj
                            if 0 <= a < H and 0 <= b < W and mask[a, b] and not lab[a, b]:
                                lab[a, b] = k; q.append((a, b))
                pix = np.array(pix); stats.append((len(pix), *pix.mean(0)))
    keep = [s for s in stats if s[0] >= min_area]
    return lab, keep

def open3(mask):
    """morphological opening with a 3 x 3 square: erode then dilate, which removes isolated noise pixels"""
    def shift_all(m, op):
        p = np.pad(m, 1, constant_values=op is np.logical_and)       # erosion pads with True, dilation with False
        out = p[1:-1, 1:-1].copy()
        for di in (0, 1, 2):
            for dj in (0, 1, 2):
                out = op(out, p[di:di + m.shape[0], dj:dj + m.shape[1]])
        return out
    return shift_all(shift_all(mask, np.logical_and), np.logical_or)

def test_otsu_bimodal():
    img = np.r_[np.full(500, 50), np.full(500, 200)].astype(np.uint8).reshape(10, 100)
    t = otsu(img); print(f"two levels 50 and 200, equal counts: Otsu threshold {t}")
    assert 50 <= t < 200

def test_counts_match_truth():
    img, truth = make_image()
    t = otsu(img); mask = img > t
    _, raw = components(mask); _, blobs = components(open3(mask), min_area=20)
    print(f"Otsu threshold {t}; raw mask {len(raw)} components, after a 3 x 3 opening and a 20-pixel minimum {len(blobs)} (truth {len(truth)})")
    assert len(blobs) == len(truth)
    err = max(min(np.hypot(b[1] - c[0], b[2] - c[1]) for b in blobs) for c, _ in truth)
    print(f"largest centroid error {err:.2f} px")
    assert err < 1.0
    if cv2 is None: print("OpenCV not installed: skipping the comparison"); return
    t_cv, _ = cv2.threshold(img, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    n_cv, lab_cv, st, cen = cv2.connectedComponentsWithStats(mask.astype(np.uint8), connectivity=8)
    lab, _ = components(mask)
    print(f"cv2 Otsu threshold {t_cv:.0f}; cv2.connectedComponentsWithStats finds {n_cv - 1} components in the raw mask; label images agree: {bool(((lab > 0) == (lab_cv > 0)).all())}")
    assert t == int(t_cv) and n_cv - 1 == len(raw)

test_otsu_bimodal()
test_counts_match_truth()
print("PASS")
