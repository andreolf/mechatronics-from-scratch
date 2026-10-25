---
id: p17-l13
minutes: 40
summary: Optical flow measures how image points move between frames, the raw signal for visual odometry and tracking. You derive the brightness-constancy constraint and the Lucas-Kanade solution, track illustrative synthetic motion to within 0.03 px, make large motions trackable with an image pyramid, compare with OpenCV's calcOpticalFlowPyrLK, and meet the aperture problem.
---

## Brightness constancy

Assume a point keeps its brightness as it moves by $(u, v)$ between frames: $I_1(x + u, y + v) = I_0(x, y)$. For a small motion, a first-order Taylor expansion gives one equation per pixel:

$$I_x u + I_y v + I_t = 0,$$

with spatial gradients $I_x, I_y$ and temporal difference $I_t = I_1 - I_0$. One equation, two unknowns: a single pixel only reveals motion along its gradient.

## Lucas-Kanade

Assume all pixels in a small window move together and solve the equations in least squares:

$$\underbrace{\begin{pmatrix} \sum I_x^2 & \sum I_x I_y \\ \sum I_x I_y & \sum I_y^2 \end{pmatrix}}_{G} \begin{pmatrix} u \\ v \end{pmatrix} = -\begin{pmatrix} \sum I_x I_t \\ \sum I_y I_t \end{pmatrix}.$$

$G$ is the structure tensor of lesson 07, so the points that track well are exactly the corners. Iterate: warp by the current estimate, recompute $I_t$, solve again (Gauss-Newton), until the update is tiny.

## The aperture problem and pyramids

If the window contains only an edge or stripes, $G$ is singular and motion along the edge is invisible: the **aperture problem**. Trackers reject points whose smallest eigenvalue of $G$ is too small.

The Taylor step only works for motions smaller than the texture's scale, about a pixel or two. An **image pyramid** halves the resolution repeatedly; a 6 px motion is 1.5 px two levels up. Track at the top, then pass the estimate (doubled) down as the starting point for the next level.

:::figure widget=flow caption="An illustrative textured patch and its shifted copy, with the Lucas-Kanade estimate after each iteration. Change the motion and the window size, and try the stripes pattern to see the aperture problem."
:::end

## Worked example

An illustrative texture rendered exactly at sub-pixel offsets; 5 tracked points; 15 × 15 window.

1. Motion $(1.3, -0.7)$ px: single-level LK is within 0.021 px at every point.
2. Motion $(6.2, 3.5)$ px: single-level LK fails, with errors up to 14.4 px (it converges to a wrong match). A 3-level pyramid tracks within 0.027 px.
3. `cv2.calcOpticalFlowPyrLK` with the same window and 3 levels tracks all points within 0.029 px.
4. Vertical stripes: $G$ has eigenvalues 0 and $1.07 \times 10^5$, so the tracker reports the point as untrackable.

## Code it from scratch

:::code file=optical_flow.py
```python
import numpy as np
try:
    import cv2
except ImportError:
    cv2 = None

RNG = np.random.default_rng(0); WAVES = RNG.normal(0, 0.35, (30, 2)); PHASE = RNG.uniform(0, 2 * np.pi, 30)

def scene(x, y):
    """illustrative continuous texture, so shifted frames can be rendered exactly at any sub-pixel offset"""
    s = sum(np.sin(a * x + b * y + p) for (a, b), p in zip(WAVES, PHASE))
    return 128 + 60 * s / np.sqrt(len(PHASE) / 2)

def frame(dx=0.0, dy=0.0, H=120, W=160):
    y, x = np.mgrid[0:H, 0:W].astype(float)
    return np.clip(scene(x - dx, y - dy), 0, 255)

def bilinear(img, x, y):
    x = np.clip(x, 0, img.shape[1] - 1.001); y = np.clip(y, 0, img.shape[0] - 1.001)    # clamp at the border
    x0, y0 = np.floor(x).astype(int), np.floor(y).astype(int); ax, ay = x - x0, y - y0
    return ((1 - ay) * ((1 - ax) * img[y0, x0] + ax * img[y0, x0 + 1]) + ay * ((1 - ax) * img[y0 + 1, x0] + ax * img[y0 + 1, x0 + 1]))

def lucas_kanade(I0, I1, pt, half=7, iters=20, d0=(0.0, 0.0)):
    """the shift d minimising sum (I1(p + d) - I0(p))^2 over a window: Gauss-Newton with the structure tensor of I0"""
    gy, gx = np.gradient(I0)
    ys, xs = np.mgrid[-half:half + 1, -half:half + 1]; X, Y = pt[0] + xs.ravel(), pt[1] + ys.ravel()
    Ix, Iy, T = bilinear(gx, X, Y), bilinear(gy, X, Y), bilinear(I0, X, Y)
    G = np.array([[Ix @ Ix, Ix @ Iy], [Ix @ Iy, Iy @ Iy]]); d = np.array(d0, float); ev = np.linalg.eigvalsh(G)
    if ev[0] < 1e-6 * max(ev[1], 1e-12): return np.full(2, np.nan), ev    # untrackable: no texture in some direction
    for _ in range(iters):
        e = bilinear(I1, X + d[0], Y + d[1]) - T
        step = -np.linalg.solve(G, np.array([Ix @ e, Iy @ e])); d += step
        if np.linalg.norm(step) < 1e-4: break
    return d, ev

def downsample(img):
    """blur with [1 4 6 4 1] / 16 and keep every second pixel: one level of a Gaussian pyramid"""
    k = np.array([1, 4, 6, 4, 1]) / 16
    b = np.apply_along_axis(lambda r: np.convolve(np.pad(r, 2, mode="reflect"), k, "valid"), 1, img)
    b = np.apply_along_axis(lambda c: np.convolve(np.pad(c, 2, mode="reflect"), k, "valid"), 0, b)
    return b[::2, ::2]

def pyramidal_lk(I0, I1, pt, levels=3, half=7):
    """track coarse to fine: large motions become small at the top of the pyramid"""
    P0, P1 = [I0], [I1]
    for _ in range(levels - 1): P0.append(downsample(P0[-1])); P1.append(downsample(P1[-1]))
    d = np.zeros(2)
    for L in range(levels - 1, -1, -1):
        s = 2 ** L
        d = lucas_kanade(P0[L], P1[L], np.asarray(pt) / s, half, d0=d / s)[0] * s   # start from the coarser estimate
    return d

PTS = [(40, 40), (80, 60), (120, 40), (60, 85), (110, 85)]

def test_small_motion():
    I0, I1 = frame(), frame(1.3, -0.7)
    errs = [np.linalg.norm(lucas_kanade(I0, I1, p)[0] - [1.3, -0.7]) for p in PTS]
    print(f"motion (1.3, -0.7) px, single-level LK at 5 points: largest error {max(errs):.3f} px")
    assert max(errs) < 0.2

def test_large_motion_needs_pyramid():
    I0, I1 = frame(), frame(6.2, 3.5)
    e1 = [np.linalg.norm(lucas_kanade(I0, I1, p, iters=50)[0] - [6.2, 3.5]) for p in PTS]
    e3 = [np.linalg.norm(pyramidal_lk(I0, I1, p) - [6.2, 3.5]) for p in PTS]
    print(f"motion (6.2, 3.5) px: single level largest error {max(e1):.2f} px, 3-level pyramid {max(e3):.3f} px")
    assert max(e3) < 0.2 and max(e1) > 1.0
    if cv2 is None: print("OpenCV not installed: skipping the comparison"); return
    p0 = np.array(PTS, np.float32).reshape(-1, 1, 2)
    p1, st, _ = cv2.calcOpticalFlowPyrLK(I0.astype(np.uint8), I1.astype(np.uint8), p0, None, winSize=(15, 15), maxLevel=2)
    ec = np.linalg.norm((p1 - p0).reshape(-1, 2) - [6.2, 3.5], axis=1)
    print(f"cv2.calcOpticalFlowPyrLK (15 x 15 window, 3 levels): all tracked {bool(st.all())}, largest error {ec.max():.3f} px")
    assert st.all() and ec.max() < 0.2

def test_aperture_problem():
    y, x = np.mgrid[0:120, 0:160].astype(float)
    stripes = lambda dx: 128 + 80 * np.sin(0.4 * (x - dx))           # vertical stripes: no texture along y
    d, ev = lucas_kanade(stripes(0), stripes(1.0), (80, 60))
    assert np.isnan(d).all()
    print(f"vertical stripes: structure tensor eigenvalues {ev[0]:.2e} and {ev[1]:.2e}, so motion along the stripes cannot be seen")
    assert ev[0] < 1e-6 * ev[1]

test_small_motion()
test_large_motion_needs_pyramid()
test_aperture_problem()
print("PASS")
```
:::end

## Exercises

:::exercise
A window on a corner has $G = \begin{pmatrix} 400 & 0 \\ 0 & 100 \end{pmatrix}$ and right-hand side $-(-200, 50)$. What is the motion?
:::solution
$u = 200/400 = 0.5$ px, $v = -50/100 = -0.5$ px.
:::end

:::exercise
Brightness constancy fails when an auto-exposure camera brightens the whole image by 10 %. What happens to LK and how is it usually handled?
:::solution
$I_t$ picks up the brightness change and is misread as motion, biasing the estimate. Subtract the window mean and normalise (zero-mean normalised matching), or estimate a gain and offset alongside the motion.
:::end

## Quiz

:::quiz
- type: num
  q: Motion u from Ix = 20, Iy = 0, It = -10 at one pixel?
  answer: 0.5
  tol: 0.002
  unit: px
  py: "10/20"
  explain: Ix u + It = 0.
- type: num
  q: Size of a 6 px motion three pyramid levels up (each level halves)?
  answer: 0.75
  tol: 0.002
  unit: px
  py: "6/2**3"
  explain: 6 / 8.
- type: num
  q: Unknowns solved by Lucas-Kanade per tracked point?
  answer: 2
  tol: 0.001
  py: "2"
  explain: The motion (u, v).
- type: num
  q: Equations in a 15 × 15 Lucas-Kanade window?
  answer: 225
  tol: 0.001
  py: "15*15"
  explain: One per pixel.
- type: mc
  q: The aperture problem means that on a straight edge…
  options:
    - motion along the edge cannot be measured
    - motion across the edge cannot be measured
    - no motion can be measured
    - the pyramid is needed
  answer: 0
  explain: Only the gradient direction gives information.
- type: mc
  q: Image pyramids let Lucas-Kanade…
  options:
    - track motions larger than a pixel or two
    - track along edges
    - ignore brightness changes
    - skip the iteration
  answer: 0
  explain: Large motions become small at coarse levels.
:::end
