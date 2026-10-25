---
id: p17-l18
minutes: 40
summary: Two laser scans of the same place, taken from different poses, overlap once one is moved onto the other. You implement the closed-form best rigid transform with the SVD and the iterative closest point algorithm around it, align two illustrative scans from a 9 cm and 4° odometry guess to about a millimetre, and map out where ICP stops converging.
---

## Best rigid transform

Given paired points $a_i \leftrightarrow b_i$, the rotation and translation minimising $\sum |R a_i + t - b_i|^2$ have a closed form (Kabsch, Arun):

1. Subtract the centroids: $a_i' = a_i - \bar a$, $b_i' = b_i - \bar b$.
2. SVD of the cross-covariance $\sum a_i' b_i'^\top = U \Sigma V^\top$.
3. $R = V D U^\top$ with $D = \operatorname{diag}(1, \det(VU^\top))$, which prevents a reflection; $t = \bar b - R\bar a$.

## Iterative closest point

Scans do not come with correspondences. **ICP** guesses them:

1. Transform the source scan with the current estimate.
2. Pair each source point with its **nearest** target point (a k-d tree makes this $O(\log n)$).
3. Reject pairs farther apart than a threshold (parts not seen in both scans).
4. Solve for the best rigid transform of the pairs, compose it with the estimate, and repeat until the error stops falling.

Without outlier rejection, neither the re-pairing nor the solve can increase the error, so ICP settles, but only into the **nearest** local minimum. It needs a good initial guess, usually odometry (lesson 14), and fails in featureless places such as long corridors, where sliding along the walls costs nothing.

## Variants

Point-to-**plane** (in 2D, point-to-line) ICP minimises the distance along the target surface normal, letting points slide along walls; it converges in far fewer iterations. Robust kernels downweight outliers instead of a hard cut-off. Real scans also differ by occlusion and point density, which is why the final RMS pair distance never reaches the sensor noise.

:::figure widget=icp caption="Two illustrative scans of an L-shaped room. Set the initial offset and rotation, then step through ICP iterations and watch the pairs and the alignment."
:::end

## Worked example

An illustrative L-shaped room with a box, sampled as points; two scans from poses 32 cm and 8.6° apart, each keeping a random 80 % of the points with 1 cm noise (occlusion is ignored).

1. With known correspondences, the SVD solution recovers a transform to $10^{-16}$.
2. From an odometry guess 9.4 cm and 4.0° off: after 17 iterations the error is 1.25 mm and 0.067°; the RMS pair distance falls from 10.7 to 1.88 cm (the remainder is point spacing and noise, since the scans sample different points).
3. Initial errors of 15 cm and 5°, 15° or 30°: 8 of 8 trials converge. At 60°: only 4 of 8.

## Code it from scratch

:::code file=icp.py
```python
import numpy as np
from scipy.spatial import cKDTree

def room_points(n_per_m=40):
    """illustrative 2D scene sampled as points: an L-shaped room outline plus a box (a laser scan's raw material)"""
    segs = [((0, 0), (6, 0)), ((6, 0), (6, 3)), ((6, 3), (3, 3)), ((3, 3), (3, 5)), ((3, 5), (0, 5)), ((0, 5), (0, 0)),
            ((1.5, 1.0), (2.3, 1.0)), ((2.3, 1.0), (2.3, 1.6)), ((2.3, 1.6), (1.5, 1.6)), ((1.5, 1.6), (1.5, 1.0))]
    pts = []
    for a, b in segs:
        a, b = np.array(a, float), np.array(b, float); n = int(np.linalg.norm(b - a) * n_per_m)
        pts.append(a + np.linspace(0, 1, n, endpoint=False)[:, None] * (b - a))
    return np.vstack(pts)

def se2(x, y, th):
    c, s = np.cos(th), np.sin(th); return np.array([[c, -s, x], [s, c, y], [0, 0, 1]])

def transform(T, p): return p @ T[:2, :2].T + T[:2, 2]

def best_fit(A, B):
    """the rigid transform minimising sum |R a_i + t - b_i|^2 (Kabsch / Arun): centre, SVD of the cross-covariance"""
    ca, cb = A.mean(0), B.mean(0); U, _, Vt = np.linalg.svd((A - ca).T @ (B - cb))
    D = np.diag([1, np.sign(np.linalg.det(Vt.T @ U.T))])               # guard against a reflection
    R = Vt.T @ D @ U.T; T = np.eye(3); T[:2, :2] = R; T[:2, 2] = cb - R @ ca
    return T

def icp(src, dst, T0=np.eye(3), iters=60, reject=0.5, tol=1e-7):
    """point-to-point ICP: pair each source point with its nearest target point, solve, repeat"""
    tree = cKDTree(dst); T = T0.copy(); prev = np.inf; hist = []
    for k in range(iters):
        p = transform(T, src); d, idx = tree.query(p)
        keep = d < reject                                               # drop pairs too far apart (no overlap)
        T = best_fit(p[keep], dst[idx[keep]]) @ T
        err = np.sqrt(np.mean(d[keep] ** 2)); hist.append(err)
        if abs(prev - err) < tol: break
        prev = err
    return T, np.array(hist)

def scan(pts, T_world_robot, rng, noise=0.01, keep_frac=0.8):
    """what the robot sees: the scene in its own frame, a random 80 % of points, with noise (occlusion is ignored here)"""
    local = transform(np.linalg.inv(T_world_robot), pts); m = rng.random(len(pts)) < keep_frac
    return local[m] + rng.normal(0, noise, (m.sum(), 2))

def pose_error(T, T_true):
    E = np.linalg.inv(T_true) @ T; return np.hypot(*E[:2, 2]), abs(np.degrees(np.arctan2(E[1, 0], E[0, 0])))

def test_best_fit_exact():
    rng = np.random.default_rng(0); A = rng.normal(0, 1, (30, 2)); T = se2(0.4, -0.2, 0.3)
    e = np.abs(best_fit(A, transform(T, A)) - T).max()
    print(f"known correspondences: the SVD solution recovers the transform to {e:.1e}")
    assert e < 1e-12

def setup(seed=1):
    rng = np.random.default_rng(seed); pts = room_points()
    T1, T2 = se2(2.0, 2.0, 0.1), se2(2.3, 1.9, 0.25)                    # two robot poses
    s1, s2 = scan(pts, T1, rng), scan(pts, T2, rng)
    return s1, s2, np.linalg.inv(T1) @ T2                              # true relative pose: scan 2 points into scan 1's frame

def test_converges_from_odometry_guess():
    s1, s2, T_rel = setup()
    guess = T_rel @ se2(0.08, -0.05, np.radians(4))                    # odometry guess: 9 cm and 4 deg off
    T, hist = icp(s2, s1, guess)
    dp, da = pose_error(T, T_rel); dp0, da0 = pose_error(guess, T_rel)
    print(f"initial error {100 * dp0:.1f} cm, {da0:.1f} deg -> after {len(hist)} iterations {1000 * dp:.2f} mm, {da:.3f} deg; RMS pair distance {100 * hist[0]:.1f} -> {100 * hist[-1]:.2f} cm")
    assert dp < 0.01 and da < 0.3

def test_basin_of_convergence():
    s1, s2, T_rel = setup(); res = []
    for ang in (5, 15, 30, 60):
        ok = 0
        for k in range(8):
            off = se2(0.15 * np.cos(k * np.pi / 4), 0.15 * np.sin(k * np.pi / 4), np.radians(ang) * (1 if k % 2 else -1))
            dp, da = pose_error(icp(s2, s1, T_rel @ off, iters=100)[0], T_rel); ok += (dp < 0.02) and (da < 0.5)
        res.append(ok)
        print(f"initial error 15 cm and {ang} deg: converged in {ok} of 8 trials")
    assert res[0] == 8 and res[-1] < 8

test_best_fit_exact()
test_converges_from_odometry_guess()
test_basin_of_convergence()
print("PASS")
```
:::end

## In practice

Open3D's `registration_icp` offers point-to-point and point-to-plane ICP for 3D point clouds, plus global registration from features to get the initial guess. In ROS 2, slam_toolbox uses scan matching to correct odometry between scans, and libpointmatcher and KISS-ICP are common for lidar odometry.

## Exercises

:::exercise
Why is ICP between two scans of a long, straight corridor poorly constrained?
:::solution
Sliding one scan along the corridor moves every point along its wall, so the nearest-neighbour distances barely change. The along-corridor translation is unobservable; only sideways position and heading are fixed. Fuse odometry for the missing direction.
:::end

:::exercise
What does the determinant check in the SVD step guard against?
:::solution
With noisy or nearly collinear points the best orthogonal matrix can be a reflection ($\det = -1$), which is not a physical motion. Flipping the sign of the last singular direction gives the best proper rotation.
:::end

## Quiz

:::quiz
- type: num
  q: Centroid x of the points (0, 0), (2, 0) and (4, 3)?
  answer: 2
  tol: 0.001
  unit: m
  py: "(0+2+4)/3"
  explain: The mean.
- type: num
  q: Degrees of freedom of a 2D rigid transform?
  answer: 3
  tol: 0.001
  py: "3"
  explain: x, y and the angle.
- type: num
  q: Determinant of a proper rotation matrix?
  answer: 1
  tol: 0.001
  py: "1"
  explain: Reflections have -1.
- type: num
  q: Point pairs needed at minimum to fix a 2D rigid transform?
  answer: 2
  tol: 0.001
  py: "2"
  explain: Two distinct points fix x, y and the angle.
- type: mc
  q: ICP needs a good initial guess because…
  options:
    - it converges to the nearest local minimum
    - the SVD needs a starting point
    - k-d trees need it
    - it only uses two points
  answer: 0
  explain: Nearest-neighbour pairing is only right near the solution.
- type: mc
  q: Point-to-plane ICP improves on point-to-point by…
  options:
    - letting points slide along surfaces, converging faster
    - using fewer points
    - removing the need for nearest neighbours
    - making the problem convex
  answer: 0
  explain: It measures distance along the surface normal.
:::end
