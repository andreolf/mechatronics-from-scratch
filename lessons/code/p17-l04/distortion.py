import numpy as np
try:
    import cv2
except ImportError:
    cv2 = None

K = np.array([[800.0, 0, 320], [0, 800.0, 240], [0, 0, 1]])
D = np.array([-0.28, 0.09, 0.001, -0.0005, 0.0])                  # illustrative k1, k2, p1, p2, k3 (barrel distortion)

def distort(xy, d=D):
    """normalised ideal coordinates (x/z, y/z) -> distorted ones: radial (k1, k2, k3) and tangential (p1, p2) terms"""
    k1, k2, p1, p2, k3 = d; x, y = xy[:, 0], xy[:, 1]; r2 = x * x + y * y
    rad = 1 + k1 * r2 + k2 * r2 ** 2 + k3 * r2 ** 3
    xd = x * rad + 2 * p1 * x * y + p2 * (r2 + 2 * x * x)
    yd = y * rad + p1 * (r2 + 2 * y * y) + 2 * p2 * x * y
    return np.c_[xd, yd]

def to_pixels(xy, K=K): return xy @ K[:2, :2].T + K[:2, 2]
def to_norm(uv, K=K): return (uv - K[:2, 2]) @ np.linalg.inv(K[:2, :2]).T

def undistort(xyd, d=D, iters=20):
    """invert distort() by fixed-point iteration x <- (x_d - tangential(x)) / radial(x), as OpenCV does"""
    k1, k2, p1, p2, k3 = d; x, y = xyd[:, 0].copy(), xyd[:, 1].copy()
    for _ in range(iters):
        r2 = x * x + y * y; rad = 1 + k1 * r2 + k2 * r2 ** 2 + k3 * r2 ** 3
        dx = 2 * p1 * x * y + p2 * (r2 + 2 * x * x); dy = p1 * (r2 + 2 * y * y) + 2 * p2 * x * y
        x = (xyd[:, 0] - dx) / rad; y = (xyd[:, 1] - dy) / rad
    return np.c_[x, y]

def undistort_map(w=640, h=480):
    """for every pixel of the corrected image, where to sample the distorted image (the inverse mapping)"""
    u, v = np.meshgrid(np.arange(w, dtype=float), np.arange(h, dtype=float))
    src = to_pixels(distort(to_norm(np.c_[u.ravel(), v.ravel()])))
    return src[:, 0].reshape(h, w), src[:, 1].reshape(h, w)

def test_corner_shift():
    corner = np.array([[0.0, 0.0]]); xy = to_norm(corner)
    shifted = to_pixels(distort(xy))[0]
    print(f"top-left pixel (0, 0) of the ideal image lands at ({shifted[0]:.1f}, {shifted[1]:.1f}) in the distorted one; r = {np.hypot(*xy[0]):.3f}")
    assert shifted[0] > 15 and shifted[1] > 10                     # barrel: the corner is pulled towards the centre
    centre = to_pixels(distort(to_norm(np.array([[320.0, 240.0]]))))[0]
    assert np.allclose(centre, [320, 240])

def test_round_trip():
    rng = np.random.default_rng(1); uv = rng.uniform([0, 0], [640, 480], (500, 2))
    xyd = distort(to_norm(uv)); back = to_pixels(undistort(xyd))
    err = np.abs(back - uv).max()
    print(f"500 pixels distorted then undistorted (20 iterations): largest error {err:.2e} px")
    assert err < 1e-3

def test_matches_opencv():
    rng = np.random.default_rng(2); P = rng.uniform([-1, -0.8, 2], [1, 0.8, 3], (300, 3))
    uv = to_pixels(distort(P[:, :2] / P[:, 2:]))
    m1, m2 = undistort_map()
    if cv2 is None: print("OpenCV not installed: skipping the comparison"); return
    ref = cv2.projectPoints(P, np.zeros(3), np.zeros(3), K, D)[0].reshape(-1, 2)
    e1 = np.abs(uv - ref).max()
    crit = (cv2.TERM_CRITERIA_COUNT | cv2.TERM_CRITERIA_EPS, 50, 1e-12)             # the default stops after 5 iterations
    und = cv2.undistortPoints(ref.reshape(-1, 1, 2), K, D, None, None, K, crit).reshape(-1, 2)
    e2 = np.abs(to_pixels(undistort(to_norm(ref))) - und).max()
    c1, c2 = cv2.initUndistortRectifyMap(K, D, None, K, (640, 480), cv2.CV_32FC1)
    e3 = max(np.abs(m1 - c1).max(), np.abs(m2 - c2).max())
    print(f"vs cv2.projectPoints {e1:.1e} px, cv2.undistortPoints {e2:.1e} px, cv2.initUndistortRectifyMap {e3:.1e} px")
    assert e1 < 1e-9 and e2 < 1e-3 and e3 < 1e-3

test_corner_shift()
test_round_trip()
test_matches_opencv()
print("PASS")
