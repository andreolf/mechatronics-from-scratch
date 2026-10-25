---
id: p17-l09
minutes: 35
summary: Any two views of a flat surface are related by a homography, a 3 × 3 matrix acting on homogeneous pixels. You derive the direct linear transform, solve it with the SVD, see why Hartley normalisation matters, and fit an illustrative homography to sub-pixel accuracy, matching OpenCV's getPerspectiveTransform and findHomography.
---

## Homographies

A **homography** maps points of one plane to another through a $3 \times 3$ matrix in homogeneous coordinates:

$$\lambda \begin{pmatrix} u \\ v \\ 1 \end{pmatrix} = H \begin{pmatrix} x \\ y \\ 1 \end{pmatrix}, \qquad u = \frac{h_{11}x + h_{12}y + h_{13}}{h_{31}x + h_{32}y + h_{33}}.$$

$H$ is defined up to scale, so it has 8 degrees of freedom. It relates two images of a plane (a page, a floor, a marker), and two images taken by a camera that only rotates (panoramas). It keeps straight lines straight but not parallel lines parallel.

## The direct linear transform

Cross-multiplying removes $\lambda$ and leaves two equations per correspondence that are **linear** in the nine entries $h$:

$$\begin{pmatrix} -x & -y & -1 & 0 & 0 & 0 & ux & uy & u \\ 0 & 0 & 0 & -x & -y & -1 & vx & vy & v \end{pmatrix} h = 0.$$

Four points give 8 equations, exactly enough. With more points, minimise $|Ah|$ subject to $|h| = 1$: the answer is the right singular vector of $A$ with the smallest singular value.

## Normalise first

Pixel coordinates in the hundreds put entries of order 1, 100 and 10 000 into the same matrix. The SVD then solves a badly conditioned problem and noise is amplified. **Hartley normalisation** moves each point set's centroid to the origin and scales it so the mean distance is $\sqrt 2$, solves, and undoes the transforms: $H = T_d^{-1} \hat H\, T_s$. The DLT minimises an algebraic error; a final nonlinear refinement of the pixel error is common.

:::figure widget=homography caption="An illustrative page seen in perspective. Drag the four corners (or use the sliders) and the grid on the page follows the homography fitted to them."
:::end

## Worked example

An illustrative homography maps a 400 × 300 page's corners to $(40, 30)$, $(344.8, 43.1)$, $(331.8, 271.0)$ and $(-5.5, 296.7)$.

1. DLT on the 4 corners recovers $H$ to $7.8 \times 10^{-14}$; `cv2.getPerspectiveTransform` agrees to $3 \times 10^{-8}$ (it works in 32-bit floats).
2. 60 points with 0.5 px noise per coordinate: reprojection RMS 0.702 px per point (the noise itself is $0.5\sqrt2 = 0.707$), and the fitted map is off by only 0.185 px on new points.
3. `cv2.findHomography` (least squares) gives the same RMS; the two maps differ by at most 0.03 px.
4. Conditioning: the ratio of the largest to the second-smallest singular value of $A$ is $3 \times 10^5$ in pixels and $3.3$ after normalisation.

## Code it from scratch

:::code file=homography.py
```python
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
```
:::end

## Exercises

:::exercise
Why can't you fit a homography to four points of which three lie on one line?
:::solution
Three collinear points pin down only one line's mapping, so the equations become dependent and $A$ has more than a one-dimensional null space. A homography needs four points with no three collinear.
:::end

:::exercise
How do you rectify a photographed page into a flat 400 × 300 image?
:::solution
Fit $H$ from the page's four photographed corners to $(0, 0)$, $(400, 0)$, $(400, 300)$, $(0, 300)$. For each output pixel, map it through $H^{-1}$ into the photo and sample there (inverse mapping, as in lesson 04). OpenCV's `warpPerspective` does exactly this.
:::end

## Quiz

:::quiz
- type: num
  q: Degrees of freedom of a homography?
  answer: 8
  tol: 0.001
  py: "9-1"
  explain: Nine entries up to scale.
- type: num
  q: Minimum number of point correspondences to fit a homography?
  answer: 4
  tol: 0.001
  py: "8/2"
  explain: Two equations each.
- type: num
  q: u for the point (100, 50) under H = [[1, 0, 10], [0, 1, 0], [0.001, 0, 1]]?
  answer: 100
  tol: 0.001
  unit: px
  py: "(100+10)/(0.001*100+1)"
  explain: 110 / 1.1.
- type: num
  q: Rows of the DLT matrix for 30 correspondences?
  answer: 60
  tol: 0.001
  py: "30*2"
  explain: Two per correspondence.
- type: mc
  q: The DLT solution with more than four points is…
  options:
    - the right singular vector with the smallest singular value
    - the inverse of A
    - the eigenvector with the largest eigenvalue of A A'
    - the mean of the four-point solutions
  answer: 0
  explain: It minimises |Ah| with |h| = 1.
- type: mc
  q: Two images are related by a homography when…
  options:
    - they show a plane, or the camera only rotates
    - the camera translates in front of a 3D scene
    - they come from different cameras
    - always
  answer: 0
  explain: Otherwise parallax breaks the single mapping.
:::end
