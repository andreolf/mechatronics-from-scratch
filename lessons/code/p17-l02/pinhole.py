import numpy as np
try:
    import cv2
except ImportError:
    cv2 = None

K = np.array([[800.0, 0, 320], [0, 800.0, 240], [0, 0, 1]])        # illustrative 640 x 480 camera, f = 800 px

def rodrigues(rvec):
    """rotation matrix from an axis-angle vector (the axis scaled by the angle)"""
    th = np.linalg.norm(rvec)
    if th < 1e-12: return np.eye(3)
    k = rvec / th; S = np.array([[0, -k[2], k[1]], [k[2], 0, -k[0]], [-k[1], k[0], 0]])
    return np.eye(3) + np.sin(th) * S + (1 - np.cos(th)) * S @ S

def project(Pw, rvec, tvec, K=K):
    """world points (N x 3) -> pixels (N x 2): camera frame X_c = R X_w + t, then u = fx x/z + cx, v = fy y/z + cy"""
    Pc = Pw @ rodrigues(rvec).T + tvec
    if np.any(Pc[:, 2] <= 0): raise ValueError("a point is behind the camera")
    uvw = Pc @ K.T
    return uvw[:, :2] / uvw[:, 2:]

def backproject(uv, z, K=K):
    """pixel and depth -> camera-frame point: the inverse along the ray"""
    x = (uv[0] - K[0, 2]) / K[0, 0] * z; y = (uv[1] - K[1, 2]) / K[1, 1] * z
    return np.array([x, y, z])

def test_single_point():
    uv = project(np.array([[0.1, -0.05, 2.0]]), np.zeros(3), np.zeros(3))[0]
    print(f"point (0.1, -0.05, 2.0) m in the camera frame -> pixel ({uv[0]:.1f}, {uv[1]:.1f})")
    assert np.allclose(uv, [360, 220])
    assert np.allclose(backproject(uv, 2.0), [0.1, -0.05, 2.0])
    fov = 2 * np.degrees(np.arctan(320 / 800))
    print(f"horizontal field of view 2 atan(w / 2f) = {fov:.2f} deg")
    assert abs(fov - 43.60) < 0.01

def test_depth_ambiguity():
    """every point on a ray through the centre of projection lands on the same pixel"""
    P = np.array([[0.3, 0.2, 1.0]]) * np.array([[1], [2.5], [7]])
    uv = project(P, np.zeros(3), np.zeros(3))
    print(f"three points on one ray, at depths 1, 2.5 and 7 m: pixels {np.round(uv, 6).tolist()}")
    assert np.ptp(uv, axis=0).max() < 1e-9

def test_matches_opencv():
    rng = np.random.default_rng(2)
    Pw = rng.uniform([-1, -1, 4], [1, 1, 8], (200, 3)); rvec = np.array([0.1, -0.2, 0.05]); tvec = np.array([0.2, -0.1, 0.5])
    uv = project(Pw, rvec, tvec)
    R = rodrigues(rvec); print(f"R orthonormal to {np.abs(R @ R.T - np.eye(3)).max():.1e}, det {np.linalg.det(R):.6f}")
    if cv2 is None: print("OpenCV not installed: skipping the comparison"); return
    ref, _ = cv2.projectPoints(Pw, rvec, tvec, K, np.zeros(5))
    err = np.abs(uv - ref.reshape(-1, 2)).max()
    print(f"200 random points: largest difference from cv2.projectPoints {err:.1e} px; cv2.Rodrigues differs by {np.abs(cv2.Rodrigues(rvec)[0] - R).max():.1e}")
    assert err < 1e-9

test_single_point()
test_depth_ambiguity()
test_matches_opencv()
print("PASS")
