import numpy as np
try:
    import cv2
except ImportError:
    cv2 = None

SHAPES = [np.array([[30, 30], [70, 30], [70, 60], [30, 60]], float),      # illustrative scene: a rectangle,
          np.array([[95, 25], [135, 45], [105, 70]], float),                 # a triangle
          np.array([[40, 80], [80, 85], [75, 110], [50, 105]], float)]       # and a quadrilateral (x, y in pixels)
CORNERS = np.vstack(SHAPES)

def inside(px, py, poly):
    """even-odd point-in-polygon test, vectorised over pixel samples"""
    c = np.zeros(px.shape, bool); n = len(poly)
    for i in range(n):
        (x1, y1), (x2, y2) = poly[i], poly[(i + 1) % n]
        cross = ((y1 > py) != (y2 > py)) & (px < (x2 - x1) * (py - y1) / (y2 - y1 + 1e-12) + x1)
        c ^= cross
    return c

def render(angle_deg=0.0, size=(130, 160), ss=4):
    """draw the shapes rotated about the image centre, 4 x 4 supersampled so edges are anti-aliased"""
    H, W = size; c = np.array([W / 2, H / 2]); a = np.radians(angle_deg)
    R = np.array([[np.cos(a), -np.sin(a)], [np.sin(a), np.cos(a)]])
    off = (np.arange(ss) + 0.5) / ss - 0.5
    py, px = np.meshgrid(np.arange(H), np.arange(W), indexing="ij")
    img = np.zeros((H, W))
    for oy in off:
        for ox in off:
            for k, s in enumerate(SHAPES):
                img += inside(px + ox, py + oy, (s - c) @ R.T + c) * (140 + 40 * k) / ss ** 2
    return (img + 30).astype(np.uint8), (CORNERS - c) @ R.T + c

def correlate(img, k):
    r = k.shape[0] // 2; p = np.pad(img.astype(float), r, mode="reflect"); out = np.zeros(img.shape)
    for i in range(k.shape[0]):
        for j in range(k.shape[1]):
            out += k[i, j] * p[i:i + img.shape[0], j:j + img.shape[1]]
    return out

SOBEL = np.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], float)

def harris(img, k=0.04, block=3):
    """R = det(M) - k tr(M)^2 with M the gradient outer products summed over a block x block window"""
    gx, gy = correlate(img, SOBEL) / 255, correlate(img, SOBEL.T) / 255
    box = np.ones((block, block))
    a, b, c = correlate(gx * gx, box), correlate(gx * gy, box), correlate(gy * gy, box)
    return a * c - b * b - k * (a + c) ** 2

def detect(R, rel=0.01, radius=4):
    """corners: responses above rel x max that are the largest within a (2 radius + 1) square"""
    H, W = R.shape; p = np.pad(R, radius, constant_values=-np.inf); mx = np.full(R.shape, -np.inf)
    for di in range(2 * radius + 1):
        for dj in range(2 * radius + 1):
            mx = np.maximum(mx, p[di:di + H, dj:dj + W])
    ys, xs = np.nonzero((R == mx) & (R > rel * R.max()))
    return np.c_[xs, ys].astype(float)

def match_rate(found, truth, tol=3.0):
    d = np.linalg.norm(found[:, None] - truth[None], axis=2)
    return (d.min(0) <= tol).mean(), (d.min(1) <= tol).mean()

def test_flat_edge_corner():
    img = np.zeros((21, 21)); img[10:, 10:] = 255
    R = harris(img)
    print(f"R at a corner {R[10, 10]:.2f}, on an edge {R[16, 10]:.2f}, in a flat area {R[3, 3]:.2f}")
    assert R[10, 10] > 0 and R[16, 10] < 0 and abs(R[3, 3]) < 1e-12

def test_finds_corners():
    img, truth = render(0)
    found = detect(harris(img))
    recall, precision = match_rate(found, truth)
    print(f"upright scene: {len(found)} detections, {100 * recall:.0f} % of the {len(truth)} true corners found within 3 px, {100 * precision:.0f} % of detections are true corners")
    assert recall == 1 and precision == 1
    err = np.linalg.norm(found[:, None] - truth[None], axis=2).min(1)
    print(f"localisation error: median {np.median(err):.2f} px, largest {err.max():.2f} px (at the sharpest triangle corners)")
    if cv2 is None: print("OpenCV not installed: skipping the comparison"); return
    ref = cv2.cornerHarris(img.astype(np.float32), 3, 3, 0.04)
    rho = np.corrcoef(ref.ravel(), harris(img).ravel())[0, 1]
    print(f"correlation with cv2.cornerHarris {rho:.6f}; same detections: {bool(np.array_equal(detect(ref.astype(float)), found))}")
    assert rho > 0.9999

def test_rotation_repeatable():
    rates = []
    for ang in (15, 30, 45, 60):
        img, truth = render(ang); found = detect(harris(img))
        rates.append(match_rate(found, truth)[0])
    print(f"rotated by 15, 30, 45, 60 deg: repeatability {[round(100 * r) for r in rates]} %")
    assert min(rates) >= 0.9

test_flat_edge_corner()
test_finds_corners()
test_rotation_repeatable()
print("PASS")
