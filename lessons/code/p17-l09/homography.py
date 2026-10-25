import numpy as np
try:
    import cv2
except ImportError:
    cv2 = None

H_TRUE = np.array([[0.9, -0.15, 40], [0.05, 0.8, 30], [4e-4, -3e-4, 1]])  # illustrative view of a plane

def apply(H, p):
    """map N x 2 points through a homography: lift to (x, y, 1), multiply, divide by the third coordinate"""
    q = np.c_[p, np.ones(len(p))] @ H.T
    return q[:, :2] / q[:, 2:]

def normaliser(p):
    """similarity moving the centroid to 0 and the mean distance to sqrt 2 (Hartley)"""
    m = p.mean(0); s = np.sqrt(2) / np.mean(np.linalg.norm(p - m, axis=1))
    return np.array([[s, 0, -s * m[0]], [0, s, -s * m[1]], [0, 0, 1]])

def dlt(src, dst, normalise=True):
    """H from >= 4 correspondences: two linear equations each in the 9 entries, solved by SVD (smallest singular vector)"""
    Ts, Td = (normaliser(src), normaliser(dst)) if normalise else (np.eye(3), np.eye(3))
    a, b = apply(Ts, src), apply(Td, dst); A = []
    for (x, y), (u, v) in zip(a, b):
        A += [[-x, -y, -1, 0, 0, 0, u * x, u * y, u], [0, 0, 0, -x, -y, -1, v * x, v * y, v]]
    H = np.linalg.svd(np.array(A))[2][-1].reshape(3, 3)
    H = np.linalg.inv(Td) @ H @ Ts
    return H / H[2, 2]

def reproj_rms(H, src, dst): return np.sqrt(np.mean(np.sum((apply(H, src) - dst) ** 2, 1)))

def test_four_points_exact():
    src = np.array([[0, 0], [400, 0], [400, 300], [0, 300]], float); dst = apply(H_TRUE, src)
    H = dlt(src, dst)
    print(f"4 corners of a 400 x 300 page map to {np.round(dst, 1).tolist()}; DLT recovers H to {np.abs(H - H_TRUE).max():.1e}")
    assert np.abs(H - H_TRUE).max() < 1e-9
    if cv2 is not None:
        Hc = cv2.getPerspectiveTransform(src.astype(np.float32), dst.astype(np.float32))
        print(f"cv2.getPerspectiveTransform differs by {np.abs(Hc - H).max():.1e}")
        assert np.abs(Hc - H).max() < 1e-4

def test_noisy_least_squares():
    rng = np.random.default_rng(0); src = rng.uniform([0, 0], [400, 300], (60, 2))
    dst = apply(H_TRUE, src) + rng.normal(0, 0.5, (60, 2))
    Hn, Hr = dlt(src, dst), dlt(src, dst, normalise=False)
    e_n, e_r = reproj_rms(Hn, src, dst), reproj_rms(Hr, src, dst)
    test = rng.uniform([0, 0], [400, 300], (500, 2)); g_n = np.sqrt(np.mean(np.sum((apply(Hn, test) - apply(H_TRUE, test)) ** 2, 1)))
    print(f"60 points with 0.5 px noise: reprojection RMS {e_n:.3f} px normalised, {e_r:.3f} px unnormalised; error of the fitted map on new points {g_n:.3f} px")
    assert e_n < 1.0 and g_n < 0.5
    if cv2 is None: print("OpenCV not installed: skipping the comparison"); return
    Hc, _ = cv2.findHomography(src, dst, 0)
    print(f"cv2.findHomography (least squares) reprojection RMS {reproj_rms(Hc, src, dst):.3f} px; maps differ by at most {np.abs(apply(Hc, test) - apply(Hn, test)).max():.3f} px")
    assert np.abs(apply(Hc, test) - apply(Hn, test)).max() < 0.1

def test_conditioning():
    rng = np.random.default_rng(0); src = rng.uniform([0, 0], [400, 300], (60, 2)); dst = apply(H_TRUE, src)
    A = lambda s, d: np.array(sum(([[-x, -y, -1, 0, 0, 0, u * x, u * y, u], [0, 0, 0, -x, -y, -1, v * x, v * y, v]] for (x, y), (u, v) in zip(s, d)), []))
    Ts, Td = normaliser(src), normaliser(dst)
    sv = np.linalg.svd(A(apply(Ts, src), apply(Td, dst)), compute_uv=False); sr = np.linalg.svd(A(src, dst), compute_uv=False)
    print(f"ratio of largest to second-smallest singular value: {sr[0] / sr[-2]:.1e} in pixels, {sv[0] / sv[-2]:.1e} normalised")
    assert sr[0] / sr[-2] > 100 * sv[0] / sv[-2]

test_four_points_exact()
test_noisy_least_squares()
test_conditioning()
print("PASS")
