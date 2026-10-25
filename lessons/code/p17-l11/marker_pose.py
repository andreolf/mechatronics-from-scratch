import numpy as np
try:
    import cv2
except ImportError:
    cv2 = None

K = np.array([[800.0, 0, 320], [0, 800.0, 240], [0, 0, 1]])
S = 0.10                                                              # illustrative marker side, 10 cm
OBJ = np.array([[-S / 2, S / 2, 0], [S / 2, S / 2, 0], [S / 2, -S / 2, 0], [-S / 2, -S / 2, 0]])   # OpenCV's corner order

def rot(r):
    th = np.linalg.norm(r)
    if th < 1e-12: return np.eye(3)
    k = r / th; X = np.array([[0, -k[2], k[1]], [k[2], 0, -k[0]], [-k[1], k[0], 0]])
    return np.eye(3) + np.sin(th) * X + (1 - np.cos(th)) * X @ X

def project(P, R, t):
    q = (P @ R.T + t) @ K.T
    return q[:, :2] / q[:, 2:]

def homography(src, dst):
    A = []
    for (x, y), (u, v) in zip(src, dst):
        A += [[-x, -y, -1, 0, 0, 0, u * x, u * y, u], [0, 0, 0, -x, -y, -1, v * x, v * y, v]]
    return np.linalg.svd(np.array(A))[2][-1].reshape(3, 3)

def pose_from_homography(uv):
    """planar PnP, first guess: K^-1 H = s [r1 r2 t]; make the rotation orthonormal with an SVD"""
    M = np.linalg.inv(K) @ homography(OBJ[:, :2], uv)
    M /= np.linalg.norm(M[:, 0]) * np.sign(M[2, 2])                    # scale so |r1| = 1 and the marker is in front
    R0 = np.c_[M[:, 0], M[:, 1], np.cross(M[:, 0], M[:, 1])]
    U, _, Vt = np.linalg.svd(R0); R = U @ np.diag([1, 1, np.linalg.det(U @ Vt)]) @ Vt
    return R, M[:, 2]

def refine(uv, R, t, iters=10):
    """Gauss-Newton on the 8 reprojection residuals over a rotation increment w and the translation"""
    for _ in range(iters):
        r = (project(OBJ, R, t) - uv).ravel(); J = np.zeros((8, 6)); e = 1e-7
        for i in range(6):
            d = np.zeros(6); d[i] = e
            J[:, i] = ((project(OBJ, rot(d[:3]) @ R, t + d[3:]) - uv).ravel() - r) / e
        dx = -np.linalg.lstsq(J, r, rcond=None)[0]
        R, t = rot(dx[:3]) @ R, t + dx[3:]
    return R, t

def angle_between(R1, R2): return np.degrees(np.arccos(np.clip((np.trace(R1.T @ R2) - 1) / 2, -1, 1)))

def decode(bits, dictionary):
    """a marker's ID from its inner bit grid, trying all four rotations (which also gives the corner order)"""
    for k in range(4):
        b = np.rot90(bits, k)
        for mid, code in dictionary.items():
            if (b == code).all(): return mid, k
    return None, None

def trial(rng, noise=0.3):
    R = rot(rng.uniform(-0.6, 0.6, 3)); t = np.array([*rng.uniform(-0.15, 0.15, 2), rng.uniform(0.4, 1.2)])
    uv = project(OBJ, R, t) + rng.normal(0, noise, (4, 2))
    Rh, th = pose_from_homography(uv); Rr, tr = refine(uv, Rh, th)
    return R, t, uv, Rh, th, Rr, tr

def test_decode():
    rng = np.random.default_rng(0); dic = {i: rng.integers(0, 2, (4, 4)) for i in range(5)}
    mid, k = decode(np.rot90(dic[3], -1), dic)
    print(f"a marker seen rotated a quarter turn decodes as ID {mid} with rotation {k}")
    assert mid == 3 and k == 1

def test_pose_accuracy():
    rng = np.random.default_rng(1); ang, pos, ang_h, flips = [], [], [], 0
    for _ in range(200):
        R, t, uv, Rh, th, Rr, tr = trial(rng)
        ang_h.append(angle_between(R, Rh)); ang.append(angle_between(R, Rr)); pos.append(np.linalg.norm(tr - t))
    ang = np.array(ang)
    print(f"200 random poses at 0.4 to 1.2 m, 0.3 px corner noise: median rotation error {np.median(ang_h):.2f} deg from the homography, "
          f"{np.median(ang):.2f} deg refined; 95th percentile {np.percentile(ang, 95):.2f} deg; median position error {1000 * np.median(pos):.1f} mm")
    assert np.median(ang) < 1.0 and np.median(pos) < 0.01

def test_matches_opencv():
    rng = np.random.default_rng(2); diffs = []
    for _ in range(50):
        R, t, uv, Rh, th, Rr, tr = trial(rng)
        if cv2 is None: break
        ok, rv, tv = cv2.solvePnP(OBJ, uv, K, None, flags=cv2.SOLVEPNP_IPPE_SQUARE)
        rv, tv = cv2.solvePnPRefineLM(OBJ, uv, K, None, rv, tv)       # IPPE is closed form; refine as we do
        if angle_between(cv2.Rodrigues(rv)[0], Rr) < 5: diffs.append(np.linalg.norm(tv.ravel() - tr))
    if cv2 is None: print("OpenCV not installed: skipping the comparison"); return
    print(f"cv2.solvePnP (IPPE_SQUARE) plus solvePnPRefineLM lands on the same pose in {len(diffs)} of 50 trials; positions differ by at most {1000 * max(diffs):.3f} mm")
    assert len(diffs) >= 48 and max(diffs) < 1e-4

def test_distance_hurts():
    rng = np.random.default_rng(3)
    for z in (0.5, 2.0):
        errs = []
        for _ in range(200):
            R = rot(rng.uniform(-0.4, 0.4, 3)); t = np.array([0, 0, z])
            uv = project(OBJ, R, t) + rng.normal(0, 0.3, (4, 2))
            errs.append(angle_between(R, refine(uv, *pose_from_homography(uv))[0]))
        print(f"at {z} m the marker is {800 * S / z:.0f} px wide: median rotation error {np.median(errs):.2f} deg")
    assert np.median(errs) > 1.0

test_decode()
test_pose_accuracy()
test_matches_opencv()
test_distance_hurts()
print("PASS")
