import numpy as np

# illustrative 8 x 5 m room with a pillar and an alcove, so no two places look the same (wall segments x1, y1, x2, y2)
WALLS = np.array([[0, 0, 8, 0], [8, 0, 8, 5], [8, 5, 3, 5], [3, 5, 3, 4], [3, 4, 0, 4], [0, 4, 0, 0],
                  [5, 1.5, 6, 1.5], [6, 1.5, 6, 2.5], [6, 2.5, 5, 2.5], [5, 2.5, 5, 1.5], [1.5, 0, 1.5, 1.2]], float)
BEAMS = np.radians(np.arange(-180, 180, 60))                          # 6 laser beams, 60 deg apart
MAX_RANGE, SIGMA_R = 4.0, 0.25

def free(x, y):
    """inside the room and outside the pillar and the short wall stub"""
    inside = (x > 0.1) & (x < 7.9) & (y > 0.1) & (((y < 3.9) | (x > 3.1)) & (y < 4.9))
    pillar = (x > 4.9) & (x < 6.1) & (y > 1.4) & (y < 2.6); stub = (x > 1.4) & (x < 1.6) & (y < 1.3)
    return inside & ~pillar & ~stub

def raycast(poses):
    """laser ranges for N poses (x, y, theta): nearest intersection of each beam with every wall segment"""
    ang = poses[:, 2:3] + BEAMS; dx, dy = np.cos(ang)[..., None], np.sin(ang)[..., None]        # N x B x 1
    ox, oy = poses[:, 0, None, None], poses[:, 1, None, None]
    x1, y1, x2, y2 = WALLS.T; ex, ey = x2 - x1, y2 - y1
    den = dx * ey - dy * ex
    with np.errstate(divide="ignore", invalid="ignore"):
        t = ((x1 - ox) * ey - (y1 - oy) * ex) / den; u = ((x1 - ox) * dy - (y1 - oy) * dx) / den
    t = np.where((np.abs(den) > 1e-12) & (t > 0) & (u >= 0) & (u <= 1), t, np.inf)
    return np.minimum(t.min(2), MAX_RANGE)

def motion(particles, ds, dth, rng, a=(0.05, 0.02)):
    """sample the odometry motion model: travel and turn with noise proportional to the motion"""
    n = len(particles); s = ds + rng.normal(0, a[0] * abs(ds) + 0.01, n); r = dth + rng.normal(0, a[1] + 0.05 * abs(dth), n)
    p = particles.copy(); p[:, 2] += r / 2; p[:, 0] += s * np.cos(p[:, 2]); p[:, 1] += s * np.sin(p[:, 2]); p[:, 2] += r / 2
    return p

def weights(particles, z):
    """beam likelihood: Gaussian range error plus a small floor for unexpected readings; zero weight inside walls"""
    pred = raycast(particles)
    lik = 0.9 * np.exp(-0.5 * ((pred - z) / SIGMA_R) ** 2) + 0.1 * 0.2
    logw = np.log(lik).sum(1); logw[~free(particles[:, 0], particles[:, 1])] = -np.inf
    w = np.exp(logw - logw.max()); return w / w.sum()

def low_variance_resample(particles, w, rng):
    """one random offset, n evenly spaced pointers into the cumulative weights: low variance, O(n)"""
    n = len(w); u = (rng.random() + np.arange(n)) / n
    return particles[np.minimum(np.searchsorted(np.cumsum(w), u), n - 1)]

def route():
    """the robot's path: waypoints visited at 0.2 m per step, as (ds, dtheta) odometry commands"""
    pts = np.array([[1, 2.5], [4, 3.2], [7, 3.8], [7, 0.8], [3, 0.8], [2.5, 2.5]]); poses = [np.r_[pts[0], 0]]
    for a, b in zip(pts[:-1], pts[1:]):
        th = np.arctan2(*(b - a)[::-1]); n = int(np.ceil(np.linalg.norm(b - a) / 0.2))
        for k in range(n): poses.append(np.r_[a + (b - a) * (k + 1) / n, th])
    poses = np.array(poses); poses[0, 2] = poses[1, 2]
    d = np.diff(poses, axis=0); ds = np.hypot(d[:, 0], d[:, 1]); dth = (d[:, 2] + np.pi) % (2 * np.pi) - np.pi
    return poses, ds, dth

def run(n=3000, seed=0):
    rng = np.random.default_rng(seed); truth, ds, dth = route()
    p = rng.uniform([0, 0, -np.pi], [8, 5, np.pi], (4 * n, 3)); p = p[free(p[:, 0], p[:, 1])][:n]   # global uncertainty
    errs, spread = [], []
    for k in range(len(ds)):
        p = motion(p, ds[k], dth[k], rng)
        z = raycast(truth[k + 1:k + 2])[0] + rng.normal(0, SIGMA_R, len(BEAMS))
        w = weights(p, z)
        est = (w[:, None] * p[:, :2]).sum(0)
        errs.append(np.linalg.norm(est - truth[k + 1, :2])); spread.append(np.sqrt((w * ((p[:, :2] - est) ** 2).sum(1)).sum()))
        if 1 / (w ** 2).sum() < len(w) / 2: p = low_variance_resample(p, w, rng)   # resample when the effective size halves
    return np.array(errs), np.array(spread)

def test_raycast():
    r = raycast(np.array([[1.0, 2.0, 0.0]]))[0]
    print(f"from (1, 2) facing +x: range ahead {r[3]:.2f} m (the pillar at x = 5), behind {r[0]:.2f} m")
    assert np.allclose([r[3], r[0]], [4, 1])

def test_resampling():
    rng = np.random.default_rng(1); w = np.array([0.5, 0.25, 0.125, 0.125]); p = np.arange(4.0)[:, None]
    counts = np.bincount(low_variance_resample(np.repeat(p, 250, 0), np.repeat(w, 250) / 250, rng)[:, 0].astype(int), minlength=4)
    print(f"weights 0.5, 0.25, 0.125, 0.125 over 1000 particles: resampled counts {counts.tolist()}")
    assert np.abs(counts - 1000 * w).max() <= 1

def test_global_localisation():
    for seed in (0, 1, 2):
        errs, spread = run(seed=seed)
        first = int(np.argmax(np.convolve(errs < 0.3, np.ones(5), "valid") == 5))
        print(f"seed {seed}: error {errs[0]:.2f} m and spread {spread[0]:.2f} m after the first scan, below 0.3 m for good from step {first}; final error {errs[-1]:.3f} m, spread {spread[-1]:.3f} m; "
              f"median error over the last 20 steps {np.median(errs[-20:]):.3f} m")
        assert np.median(errs[-20:]) < 0.15 and (errs[first:] < 0.3).mean() > 0.95

test_raycast()
test_resampling()
test_global_localisation()
print("PASS")
