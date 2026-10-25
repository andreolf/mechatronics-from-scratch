---
id: p17-l02
minutes: 35
summary: A camera squashes the 3D world onto a 2D sensor through a single point. You derive the pinhole projection u = f x/z + cx, write it as the intrinsic matrix K together with the camera pose, implement projection and back-projection, and test against OpenCV's projectPoints, seeing on the way that depth is lost along every ray.
---

## Similar triangles

Put the camera's centre of projection at the origin, looking along $+z$, with $x$ to the right and $y$ down (to match image rows). A point $(x, y, z)$ hits the image plane at distance $f$ where, by similar triangles, it is at $(f x/z,\ f y/z)$. Measuring in pixels from the top-left corner:

$$u = f_x \frac{x}{z} + c_x, \qquad v = f_y \frac{y}{z} + c_y,$$

where $f_x, f_y$ are the focal length in pixels (focal length over pixel pitch) and $(c_x, c_y)$ is the **principal point**, near the image centre.

## The intrinsic matrix

In homogeneous coordinates the projection is linear:

$$\lambda \begin{pmatrix} u \\ v \\ 1 \end{pmatrix} = K \begin{pmatrix} x \\ y \\ z \end{pmatrix}, \qquad K = \begin{pmatrix} f_x & 0 & c_x \\ 0 & f_y & c_y \\ 0 & 0 & 1 \end{pmatrix}, \qquad \lambda = z.$$

A world point first moves into the camera frame with the **extrinsics**, $X_c = R X_w + t$, so the full model is $\lambda\,\tilde u = K [R \mid t]\,\tilde X_w$. OpenCV passes $R$ as an axis-angle vector `rvec`, converted with Rodrigues' formula $R = I + \sin\theta\,[k]_\times + (1 - \cos\theta)[k]_\times^2$.

## Depth is lost

Dividing by $z$ throws depth away: every point on the ray through a pixel projects to that pixel. Back-projection needs the depth from somewhere else, such as a known size, a second camera (lesson 12) or motion. The horizontal field of view is $2\arctan\!\big(W/(2f_x)\big)$.

:::figure widget=pinhole caption="A cube in front of a pinhole camera, seen from above with the camera's field of view, and the image it produces. Change the focal length, move the cube and turn it, and watch the image shrink with distance."
:::end

## Worked example

An illustrative 640 × 480 camera with $f_x = f_y = 800$ px and $(c_x, c_y) = (320, 240)$.

1. The camera-frame point $(0.1, -0.05, 2.0)$ m projects to $u = 800 \times 0.05 + 320 = 360$, $v = 800 \times (-0.025) + 240 = 220$. Back-projecting $(360, 220)$ at depth 2 m returns the point.
2. Horizontal field of view: $2\arctan(320/800) = 43.60°$.
3. Points at depths 1, 2.5 and 7 m on one ray all land on pixel $(560, 400)$.
4. 200 random points with a rotated, translated camera: the code agrees with `cv2.projectPoints` to $8.5 \times 10^{-14}$ px.

## Code it from scratch

:::code file=pinhole.py
```python
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
```
:::end

## Exercises

:::exercise
A 0.2 m wide marker appears 80 px wide to this camera. How far away is it?
:::solution
Width in pixels is $f \cdot W / z$, so $z = 800 \times 0.2 / 80 = 2$ m. A known size gives depth from one image.
:::end

:::exercise
Doubling the focal length (zooming in) does what to the field of view and to an object's size in the image?
:::solution
The object doubles in size in pixels. The field of view shrinks to $2\arctan(320/1600) = 22.6°$, not quite half, because of the arctangent.
:::end

## Quiz

:::quiz
- type: num
  q: Pixel u of the point (0.2, 0, 4) m with fx = 800 px and cx = 320?
  answer: 360
  tol: 0.001
  unit: px
  py: "800*0.2/4+320"
  explain: f x/z + cx.
- type: num
  q: Horizontal field of view of a 1280 px wide image with fx = 1000 px?
  answer: 65.24
  tol: 0.002
  unit: °
  py: "2*math.degrees(math.atan(640/1000))"
  explain: 2 atan(W/2f).
- type: num
  q: Distance to a 0.5 m object that appears 100 px wide with f = 800 px?
  answer: 4
  tol: 0.001
  unit: m
  py: "800*0.5/100"
  explain: z = f W / w.
- type: num
  q: Focal length in pixels of a 4 mm lens on a sensor with 2 µm pixels?
  answer: 2000
  tol: 0.001
  unit: px
  py: "4e-3/2e-6"
  explain: Focal length over pixel pitch.
- type: mc
  q: Every point along one ray through the camera centre…
  options:
    - projects to the same pixel
    - projects to a line in the image
    - is outside the field of view
    - has the same depth
  answer: 0
  explain: Projection divides depth out.
- type: mc
  q: The intrinsic matrix K contains…
  options:
    - the focal lengths and principal point
    - the camera's position and orientation
    - the lens distortion coefficients
    - the image size only
  answer: 0
  explain: Pose is in the extrinsics R and t; distortion is separate (lesson 04).
:::end
