---
id: p17-l04
minutes: 35
summary: Real lenses bend straight lines. You implement the Brown-Conrady distortion model OpenCV uses, with radial terms k1, k2, k3 and tangential terms p1, p2, invert it by fixed-point iteration, build the per-pixel map that straightens an image, and match OpenCV's projectPoints, undistortPoints and initUndistortRectifyMap.
---

## Radial and tangential distortion

A pinhole maps straight lines to straight lines; a real lens does not. Wide-angle lenses show **barrel** distortion (lines bow outwards, points are pulled towards the centre), telephoto lenses **pincushion**. The model works on normalised coordinates $x = X/Z$, $y = Y/Z$, with $r^2 = x^2 + y^2$:

$$x_d = x(1 + k_1 r^2 + k_2 r^4 + k_3 r^6) + 2p_1 xy + p_2(r^2 + 2x^2),$$
$$y_d = y(1 + k_1 r^2 + k_2 r^4 + k_3 r^6) + p_1(r^2 + 2y^2) + 2p_2 xy.$$

Negative $k_1$ is barrel. The tangential terms $p_1, p_2$ model a lens slightly tilted relative to the sensor. Then $u = f_x x_d + c_x$. Calibration (lesson 03) estimates the coefficients along with $K$.

## Inverting it

Going from a detected (distorted) pixel back to the ideal ray has no closed form. Fixed-point iteration works for moderate distortion: start at $x = x_d$ and repeat

$$x \leftarrow \frac{x_d - \Delta x_{\text{tan}}(x, y)}{1 + k_1 r^2 + k_2 r^4 + k_3 r^6}.$$

OpenCV's `undistortPoints` does this, by default for only 5 iterations.

## Straightening a whole image

To undistort an image, loop over the pixels of the **output**: for each, compute where it came from in the distorted image (a forward evaluation of the model) and sample there with interpolation. The map is computed once and reused for every frame (`initUndistortRectifyMap` then `remap`). This inverse mapping leaves no holes, unlike pushing source pixels forward.

:::figure widget=distortgrid caption="A straight grid seen through an illustrative lens. Change the radial and tangential coefficients to bend it into barrel or pincushion shapes, and switch on undistortion to straighten it again."
:::end

## Worked example

An illustrative 640 × 480 camera, $f = 800$ px, with $k_1 = -0.28$, $k_2 = 0.09$, $p_1 = 0.001$, $p_2 = -0.0005$.

1. The ideal image's top-left corner, at $r = 0.5$ from the centre in normalised units, lands at pixel $(20.6, 15.7)$ of the distorted image: barrel distortion pulls it about 25 px inwards. The centre stays put.
2. 500 random pixels distorted and then undistorted with 20 iterations come back to within $1.1 \times 10^{-13}$ px.
3. Against OpenCV: `projectPoints` agrees to $1.1 \times 10^{-13}$ px; `undistortPoints` run to convergence agrees to $1.1 \times 10^{-12}$ px (its default 5 iterations leave 0.003 px here); `initUndistortRectifyMap` agrees to $3 \times 10^{-5}$ px, the precision of its 32-bit floats.

## Code it from scratch

:::code file=distortion.py
```python
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
```
:::end

## Exercises

:::exercise
Why must you undistort detected corners before using the pinhole equations, for example for pose estimation?
:::solution
The pinhole model assumes straight-line projection. Distorted pixels sit on the wrong rays, by tens of pixels near the edges here, which biases any pose or depth computed from them. Undistort the points (cheap) rather than the whole image (expensive) when only points are needed.
:::end

:::exercise
A lens has $k_1 = -0.28$ and no other terms. At what normalised radius does $1 + k_1 r^2$ reach 0.9?
:::solution
$r^2 = 0.1/0.28 = 0.357$, $r = 0.598$, about 478 px from the centre with $f = 800$. Points there are pulled 10 % inwards.
:::end

## Quiz

:::quiz
- type: num
  q: Radial factor 1 + k1 r^2 + k2 r^4 at r = 0.5 with k1 = -0.28 and k2 = 0.09?
  answer: 0.9356
  tol: 0.002
  py: "1-0.28*0.25+0.09*0.0625"
  explain: 1 - 0.07 + 0.005625.
- type: num
  q: Distorted x of x = 0.4, y = 0 with only k1 = -0.2?
  answer: 0.3872
  tol: 0.002
  py: "0.4*(1-0.2*0.16)"
  explain: x (1 + k1 r^2).
- type: num
  q: Distance in pixels from the centre of normalised radius 0.3 with f = 800 px?
  answer: 240
  tol: 0.001
  unit: px
  py: "0.3*800"
  explain: Normalised units times f.
- type: num
  q: Coefficients in OpenCV's standard 5-term distortion vector?
  answer: 5
  tol: 0.001
  py: "5"
  explain: k1, k2, p1, p2, k3.
- type: mc
  q: Negative k1 gives…
  options:
    - barrel distortion
    - pincushion distortion
    - a shifted principal point
    - no visible effect
  answer: 0
  explain: Points are pulled towards the centre.
- type: mc
  q: To undistort an image, for each output pixel you…
  options:
    - compute where it came from in the distorted image and sample there
    - push each source pixel to its undistorted location
    - solve the inverse model in closed form
    - blur the edges
  answer: 0
  explain: Inverse mapping leaves no holes and only needs the forward model.
:::end
