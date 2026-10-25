import numpy as np
from scipy.optimize import least_squares
try:
    import cv2
except ImportError:
    cv2 = None

K_TRUE = np.array([[820.0, 0, 330], [0, 810.0, 235], [0, 0, 1]])   # illustrative "unknown" camera to recover

def rodrigues(r):
    th = np.linalg.norm(r)
    if th < 1e-12: return np.eye(3)
    k = r / th; S = np.array([[0, -k[2], k[1]], [k[2], 0, -k[0]], [-k[1], k[0], 0]])
    return np.eye(3) + np.sin(th) * S + (1 - np.cos(th)) * S @ S

def board(nx=9, ny=6, sq=0.025):
    """corner positions of a flat checkerboard, z = 0, in metres"""
    g = np.mgrid[0:nx, 0:ny].T.reshape(-1, 2) * sq
    return np.c_[g, np.zeros(len(g))]

def project(P, r, t, K):
    Pc = P @ rodrigues(r).T + t; q = Pc @ K.T
    return q[:, :2] / q[:, 2:]

def make_views(n=12, noise=0.2, seed=0):
    rng = np.random.default_rng(seed); P = board(); views = []
    for _ in range(n):
        r = rng.uniform(-0.5, 0.5, 3); t = np.array([-0.1, -0.06, 0]) + rng.uniform([-0.05, -0.05, 0.35], [0.05, 0.05, 0.6])
        views.append(project(P, r, t, K_TRUE) + rng.normal(0, noise, (len(P), 2)))
    return P, views

def homography(src, dst):
    """DLT with Hartley normalisation: dst ~ H src for planar points (N x 2)"""
    def norm(p):
        m = p.mean(0); s = np.sqrt(2) / np.mean(np.linalg.norm(p - m, axis=1))
        return np.array([[s, 0, -s * m[0]], [0, s, -s * m[1]], [0, 0, 1]])
    Ts, Td = norm(src), norm(dst)
    a = (np.c_[src, np.ones(len(src))] @ Ts.T)[:, :2]; b = (np.c_[dst, np.ones(len(dst))] @ Td.T)[:, :2]
    A = []
    for (x, y), (u, v) in zip(a, b):
        A += [[-x, -y, -1, 0, 0, 0, u * x, u * y, u], [0, 0, 0, -x, -y, -1, v * x, v * y, v]]
    H = np.linalg.svd(np.array(A))[2][-1].reshape(3, 3)
    H = np.linalg.inv(Td) @ H @ Ts
    return H / H[2, 2]

def zhang_linear(P, views):
    """closed-form K from >= 3 homographies: h1' B h2 = 0 and h1' B h1 = h2' B h2, with B = K^-T K^-1"""
    def v(H, i, j):
        hi, hj = H[:, i], H[:, j]
        return np.array([hi[0] * hj[0], hi[0] * hj[1] + hi[1] * hj[0], hi[1] * hj[1],
                         hi[2] * hj[0] + hi[0] * hj[2], hi[2] * hj[1] + hi[1] * hj[2], hi[2] * hj[2]])
    Hs = [homography(P[:, :2], uv) for uv in views]
    V = np.vstack([np.vstack([v(H, 0, 1), v(H, 0, 0) - v(H, 1, 1)]) for H in Hs])
    b = np.linalg.svd(V)[2][-1]
    B11, B12, B22, B13, B23, B33 = b
    v0 = (B12 * B13 - B11 * B23) / (B11 * B22 - B12 ** 2)
    lam = B33 - (B13 ** 2 + v0 * (B12 * B13 - B11 * B23)) / B11
    a = np.sqrt(lam / B11); bb = np.sqrt(lam * B11 / (B11 * B22 - B12 ** 2))
    g = -B12 * a ** 2 * bb / lam; u0 = g * v0 / bb - B13 * a ** 2 / lam
    K = np.array([[a, g, u0], [0, bb, v0], [0, 0, 1]])
    poses = []
    for H in Hs:                                         # extrinsics of each view from K^-1 H = [r1 r2 t] / s
        M = np.linalg.inv(K) @ H; s = 1 / np.linalg.norm(M[:, 0])
        r1, r2, t = s * M[:, 0], s * M[:, 1], s * M[:, 2]
        U, _, Wt = np.linalg.svd(np.c_[r1, r2, np.cross(r1, r2)]); R = U @ Wt
        ang = np.arccos(np.clip((np.trace(R) - 1) / 2, -1, 1))
        w = np.array([R[2, 1] - R[1, 2], R[0, 2] - R[2, 0], R[1, 0] - R[0, 1]])
        poses.append((w / (2 * np.sin(ang)) * ang if ang > 1e-9 else np.zeros(3), t))
    return K, poses

def refine(P, views, K0, poses):
    """bundle adjustment: fx, fy, cx, cy and every pose, minimising reprojection error (skew fixed at 0)"""
    x0 = np.r_[K0[0, 0], K0[1, 1], K0[0, 2], K0[1, 2], np.concatenate([np.r_[r, t] for r, t in poses])]
    def res(x):
        K = np.array([[x[0], 0, x[2]], [0, x[1], x[3]], [0, 0, 1]])
        return np.concatenate([(project(P, x[4 + 6 * i:7 + 6 * i], x[7 + 6 * i:10 + 6 * i], K) - uv).ravel() for i, uv in enumerate(views)])
    sol = least_squares(res, x0, method="lm")
    K = np.array([[sol.x[0], 0, sol.x[2]], [0, sol.x[1], sol.x[3]], [0, 0, 1]])
    return K, np.sqrt(np.mean(sol.fun ** 2))

def rel_err(K):
    return np.abs(np.array([K[0, 0], K[1, 1], K[0, 2], K[1, 2]]) / np.array([820, 810, 330, 235]) - 1).max()

def test_noise_free_exact():
    P, views = make_views(noise=0.0)
    K, _ = zhang_linear(P, views)
    print(f"noise-free closed form: fx {K[0, 0]:.4f}, fy {K[1, 1]:.4f}, cx {K[0, 2]:.4f}, cy {K[1, 2]:.4f}")
    assert rel_err(K) < 1e-6

def test_recovers_intrinsics():
    P, views = make_views(noise=0.2)
    K0, poses = zhang_linear(P, views)
    K, rms = refine(P, views, K0, poses)
    print(f"0.2 px noise, 12 views: closed form fx {K0[0, 0]:.1f} fy {K0[1, 1]:.1f} cx {K0[0, 2]:.1f} cy {K0[1, 2]:.1f} (worst {100 * rel_err(K0):.2f} %)")
    print(f"refined fx {K[0, 0]:.1f} fy {K[1, 1]:.1f} cx {K[0, 2]:.1f} cy {K[1, 2]:.1f} (worst {100 * rel_err(K):.2f} %), RMS reprojection {rms:.3f} px")
    assert rel_err(K) < 0.01 and rms < 0.25
    if cv2 is None: print("OpenCV not installed: skipping the comparison"); return
    obj = [P.astype(np.float32)] * len(views); img = [uv.astype(np.float32) for uv in views]
    flags = cv2.CALIB_FIX_K1 | cv2.CALIB_FIX_K2 | cv2.CALIB_FIX_K3 | cv2.CALIB_ZERO_TANGENT_DIST
    rms_cv, Kcv, *_ = cv2.calibrateCamera(obj, img, (640, 480), None, None, flags=flags)
    print(f"cv2.calibrateCamera: fx {Kcv[0, 0]:.1f} fy {Kcv[1, 1]:.1f} cx {Kcv[0, 2]:.1f} cy {Kcv[1, 2]:.1f}, RMS {rms_cv:.3f} px; largest difference {np.abs(K - Kcv).max():.3f} px")
    assert np.abs(K - Kcv).max() < 0.1

def test_too_few_views():
    """each view gives 2 equations on B's 6 entries (5 up to scale): two views leave a 2-dimensional null space"""
    P, views = make_views(n=2, noise=0.0)
    Hs = [homography(P[:, :2], uv) for uv in views]
    def v(H, i, j):
        hi, hj = H[:, i], H[:, j]
        return np.array([hi[0] * hj[0], hi[0] * hj[1] + hi[1] * hj[0], hi[1] * hj[1],
                         hi[2] * hj[0] + hi[0] * hj[2], hi[2] * hj[1] + hi[1] * hj[2], hi[2] * hj[2]])
    V = np.vstack([np.vstack([v(H, 0, 1), v(H, 0, 0) - v(H, 1, 1)]) for H in Hs])
    s = np.linalg.svd(V, compute_uv=False)
    print(f"2 views: V is {V.shape[0]} x 6 with rank {np.linalg.matrix_rank(V)}, so B is not determined; 3 views are the minimum")
    assert np.linalg.matrix_rank(V) == 4

test_noise_free_exact()
test_recovers_intrinsics()
test_too_few_views()
print("PASS")
