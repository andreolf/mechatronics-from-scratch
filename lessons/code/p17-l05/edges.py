import numpy as np
try:
    import cv2
except ImportError:
    cv2 = None

def correlate(img, k):
    """2D correlation (convolution without the flip) with OpenCV's default border, reflect-101 (... c b | a b c | b a ...)"""
    r = k.shape[0] // 2; p = np.pad(img.astype(float), r, mode="reflect")
    out = np.zeros(img.shape)
    for i in range(k.shape[0]):
        for j in range(k.shape[1]):
            out += k[i, j] * p[i:i + img.shape[0], j:j + img.shape[1]]
    return out

def gaussian_kernel(sigma, size):
    x = np.arange(size) - size // 2; g = np.exp(-x ** 2 / (2 * sigma ** 2)); g /= g.sum()
    return np.outer(g, g)

SOBEL_X = np.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], float)    # smoothing [1 2 1] across, derivative [-1 0 1] along

def make_image(noise=4.0, seed=0):
    """illustrative 120 x 160 grey scene: a bright square and a darker disc on a mid background"""
    rng = np.random.default_rng(seed); y, x = np.mgrid[0:120, 0:160]
    img = np.full((120, 160), 90.0); img[30:80, 20:70] = 200
    img[(x - 115) ** 2 + (y - 65) ** 2 < 28 ** 2] = 30
    return np.clip(img + rng.normal(0, noise, img.shape), 0, 255).astype(np.uint8)

def canny(img, lo, hi):
    """Gaussian blur, Sobel gradients, non-maximum suppression along the gradient, hysteresis thresholds"""
    g = correlate(img, gaussian_kernel(1.4, 5))
    gx, gy = correlate(g, SOBEL_X), correlate(g, SOBEL_X.T)
    mag = np.hypot(gx, gy); ang = (np.degrees(np.arctan2(gy, gx)) + 180) % 180
    nms = np.zeros_like(mag); H, W = mag.shape
    q = np.round(ang / 45).astype(int) % 4                          # 0: E-W, 1: NE-SW, 2: N-S, 3: NW-SE neighbours
    off = {0: (0, 1), 1: (1, 1), 2: (1, 0), 3: (1, -1)}
    for d, (di, dj) in off.items():
        m = q == d
        a = np.roll(np.roll(mag, -di, 0), -dj, 1); b = np.roll(np.roll(mag, di, 0), dj, 1)
        keep = m & (mag >= a) & (mag >= b); nms[keep] = mag[keep]
    nms[[0, -1], :] = 0; nms[:, [0, -1]] = 0
    strong = nms >= hi; weak = nms >= lo; edges = strong.copy()
    while True:                                                    # grow strong edges through connected weak pixels
        grown = weak & (np.pad(edges, 1)[0:-2, 0:-2] | np.pad(edges, 1)[0:-2, 1:-1] | np.pad(edges, 1)[0:-2, 2:] |
                        np.pad(edges, 1)[1:-1, 0:-2] | np.pad(edges, 1)[1:-1, 2:] | np.pad(edges, 1)[2:, 0:-2] |
                        np.pad(edges, 1)[2:, 1:-1] | np.pad(edges, 1)[2:, 2:] | edges)
        if (grown == edges).all(): break
        edges = grown
    return edges, mag

def test_sobel_step():
    img = np.zeros((5, 6)); img[:, 3:] = 100
    gx = correlate(img, SOBEL_X)
    print(f"Sobel x across a 100-level vertical step: {gx[2].tolist()}")
    assert gx[2, 2] == 400 and gx[2, 3] == 400 and gx[2, 0] == 0

def test_matches_opencv():
    img = make_image()
    gx = correlate(img, SOBEL_X); blur = correlate(img, gaussian_kernel(1.4, 5))
    edges, mag = canny(img, 40, 100)
    print(f"Canny with thresholds 40 and 100: {edges.sum()} edge pixels")
    if cv2 is None: print("OpenCV not installed: skipping the comparison"); return
    e1 = np.abs(gx - cv2.Sobel(img, cv2.CV_64F, 1, 0, ksize=3)).max()
    e2 = np.abs(blur - cv2.GaussianBlur(img.astype(float), (5, 5), 1.4)).max()
    ref = cv2.Canny(cv2.GaussianBlur(img, (5, 5), 1.4), 40, 100, L2gradient=True) > 0
    near = cv2.dilate(ref.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
    agree = (edges & near).sum() / edges.sum(); recall = (ref & (cv2.dilate(edges.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0)).sum() / ref.sum()
    print(f"vs cv2.Sobel {e1:.1e}, cv2.GaussianBlur {e2:.1e}; cv2.Canny {ref.sum()} edge pixels, "
          f"{100 * agree:.1f} % of ours within 1 px of OpenCV's and {100 * recall:.1f} % of OpenCV's within 1 px of ours")
    assert e1 < 1e-9 and e2 < 1e-9 and agree > 0.95 and recall > 0.95

def test_edges_on_boundaries():
    img = make_image(); edges, _ = canny(img, 40, 100)
    y, x = np.nonzero(edges)
    on_sq = (np.minimum.reduce([np.abs(y - 29.5), np.abs(y - 79.5)]) <= 2) & (x >= 18) & (x <= 71) | \
            (np.minimum.reduce([np.abs(x - 19.5), np.abs(x - 69.5)]) <= 2) & (y >= 28) & (y <= 81)
    on_disc = np.abs(np.hypot(x - 115, y - 65) - 28) <= 2
    frac = (on_sq | on_disc).mean()
    print(f"{100 * frac:.1f} % of edge pixels lie within 2 px of a true boundary")
    assert frac > 0.98

test_sobel_step()
test_matches_opencv()
test_edges_on_boundaries()
print("PASS")
