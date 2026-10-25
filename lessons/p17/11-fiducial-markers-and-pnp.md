---
id: p17-l11
minutes: 40
summary: A printed square marker gives a robot its full 3D pose from one image. You decode a marker ID independent of rotation, get a first pose from the marker's homography, refine it by Gauss-Newton on the reprojection error, reach a median rotation error of 0.6° in an illustrative simulation and match OpenCV's solvePnP, and see accuracy fall with distance.
---

## Fiducial markers

ArUco and AprilTag markers are black squares with a grid of bits inside. Detection finds quadrilaterals in a thresholded image (lesson 06), warps each to a square with a homography (lesson 09), and reads the bits. A dictionary of codes chosen far apart in Hamming distance makes false detections rare and allows a few bit errors to be corrected. Trying the four 90° rotations of the grid gives the ID **and** which corner is which, needed for the pose.

## Perspective-n-Point

Given the marker's corners in its own frame (side $s$, $Z = 0$) and their pixels, find $R$ and $t$ with $\lambda \tilde u_i = K(R X_i + t)$: the **PnP** problem. For a plane:

1. Fit the homography $H$ from marker coordinates to pixels.
2. $K^{-1}H = \sigma[r_1\ r_2\ t]$: scale so $|r_1| = 1$, set $r_3 = r_1 \times r_2$, and snap the result to the nearest rotation with an SVD.
3. Refine $R$ and $t$ by Gauss-Newton on the 8 reprojection residuals, updating the rotation as $R \leftarrow \exp([\omega]_\times)R$ so it stays a rotation.

## Accuracy and ambiguity

Rotation accuracy depends on how much perspective the corners show, so it degrades quickly as the marker shrinks in the image. A small or distant marker viewed nearly head-on also has two poses, tilted towards or away from the camera, that fit almost equally well; IPPE returns both, and tracking over time or a bigger marker resolves it.

:::figure widget=markerpose caption="An illustrative 10 cm marker in front of a camera, its projected outline and the pose recovered from noisy corners. Tilt and move it, add corner noise, and watch the rotation error."
:::end

## Worked example

An illustrative camera ($f = 800$ px), a 10 cm marker, corners detected with 0.3 px noise.

1. A marker seen rotated a quarter turn decodes as ID 3 with rotation 1.
2. 200 random poses at 0.4 to 1.2 m: the homography alone gives a median rotation error of 2.77°; Gauss-Newton refinement brings it to **0.61°** (95th percentile 2.02°), with median position error 1.3 mm.
3. `cv2.solvePnP` with `SOLVEPNP_IPPE_SQUARE` followed by `solvePnPRefineLM` lands on the same pose in all 50 trials, to 0.001 mm.
4. At 0.5 m the marker is 160 px wide and the median rotation error is 0.53°; at 2 m it is 40 px wide and the error is 2.57°.

## Code it from scratch

:::code file=marker_pose.py
```python
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
```
:::end

## Exercises

:::exercise
You need rotation error below 1° at 2 m. What could you change?
:::solution
Make the marker appear bigger: a larger marker (around 25 cm here) or a longer focal length. Alternatively use several markers on a rigid board, whose corners spread over a large area, or average over frames when the robot is still.
:::end

:::exercise
Why is position along the viewing axis usually less accurate than across it?
:::solution
Depth comes from the marker's apparent size, $z = f s / w$, so an error $\delta w$ in the width gives $\delta z = z\,\delta w / w$, which grows with $z^2$. Sideways position comes directly from where the marker is in the image, far better conditioned.
:::end

## Quiz

:::quiz
- type: num
  q: Width in pixels of a 0.1 m marker at 2 m with f = 800 px?
  answer: 40
  tol: 0.001
  unit: px
  py: "800*0.1/2"
  explain: f s / z.
- type: num
  q: Reprojection residuals for one square marker?
  answer: 8
  tol: 0.001
  py: "4*2"
  explain: 4 corners, 2 coordinates each.
- type: num
  q: Unknowns in a 6-DOF pose?
  answer: 6
  tol: 0.001
  py: "3+3"
  explain: Three for rotation, three for translation.
- type: num
  q: Distance to a 0.15 m marker that appears 60 px wide with f = 800 px?
  answer: 2
  tol: 0.001
  unit: m
  py: "800*0.15/60"
  explain: z = f s / w.
- type: mc
  q: Trying the four rotations of a marker's bit grid tells you…
  options:
    - its ID and which corner is which
    - its distance
    - the camera's focal length
    - the lighting direction
  answer: 0
  explain: The pose needs corners in a known order.
- type: mc
  q: A distant marker seen nearly head-on may give…
  options:
    - two poses that fit almost equally well
    - no solution at all
    - an exact pose regardless of noise
    - a wrong ID
  answer: 0
  explain: Tilting towards or away from the camera looks nearly the same.
:::end
