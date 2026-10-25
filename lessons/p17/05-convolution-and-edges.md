---
id: p17-l05
minutes: 40
summary: Most image processing is sliding a small kernel over the image. You implement 2D correlation with OpenCV's border rule, Gaussian smoothing and Sobel gradients, then build a Canny edge detector with non-maximum suppression and hysteresis, matching OpenCV's filters exactly and its edges to within a pixel.
---

## Sliding a kernel

A linear filter replaces each pixel by a weighted sum of its neighbourhood:

$$g(i, j) = \sum_{a, b} k(a, b)\, f(i + a, j + b).$$

Strictly that is **correlation**; convolution flips the kernel first, which only matters for asymmetric kernels. Near the border some neighbours do not exist, so the image is padded. OpenCV's default, `BORDER_REFLECT_101`, mirrors without repeating the edge pixel: $\ldots c\,b \mid a\,b\,c \ldots$.

A **Gaussian** kernel, $k \propto e^{-(a^2 + b^2)/2\sigma^2}$ normalised to sum 1, smooths noise. It is separable (an outer product of 1D kernels), so a $k \times k$ blur costs $2k$ instead of $k^2$ operations per pixel.

## Gradients

The **Sobel** kernel combines a derivative $[-1\ 0\ 1]$ along $x$ with smoothing $[1\ 2\ 1]$ across:

$$S_x = \begin{pmatrix} -1 & 0 & 1 \\ -2 & 0 & 2 \\ -1 & 0 & 1 \end{pmatrix}, \qquad S_y = S_x^\top.$$

The gradient magnitude $\sqrt{g_x^2 + g_y^2}$ is large at edges and its direction $\operatorname{atan2}(g_y, g_x)$ is perpendicular to them.

## Canny

Thresholding the magnitude gives thick, broken edges. Canny's detector fixes both:

1. **Smooth** with a Gaussian.
2. **Gradient** with Sobel.
3. **Non-maximum suppression**: keep a pixel only if its magnitude is at least that of both neighbours along the gradient direction (rounded to 0°, 45°, 90° or 135°). Edges become one pixel thick.
4. **Hysteresis**: pixels above a high threshold are edges; pixels above a low threshold are edges only if connected to one. Noise rarely forms connected chains, true edges do.

:::figure widget=edges caption="An illustrative noisy scene through each stage of Canny. Pick the stage to show and move the two hysteresis thresholds and the blur."
:::end

## Worked example

An illustrative 160 × 120 grey scene: a bright square and a dark disc on a mid-grey background, with noise of standard deviation 4.

1. Sobel $x$ across a 100-level vertical step gives $400$ on the two columns either side of it (the kernel weights 1 + 2 + 1 = 4 times the step) and 0 elsewhere.
2. Our Sobel equals `cv2.Sobel` exactly, and our Gaussian blur matches `cv2.GaussianBlur` to $1.7 \times 10^{-13}$.
3. Canny with thresholds 40 and 100 finds 404 edge pixels; `cv2.Canny` (with the L2 gradient) finds 403. Every one of ours is within 1 px of one of OpenCV's and vice versa; the small differences come from the rounding of the blurred image and the direction bins.
4. All edge pixels lie within 2 px of a true boundary.

## Code it from scratch

:::code file=edges.py
```python
import numpy as np
try:
    import cv2
except ImportError:
    cv2 = None

def correlate(img, k):
    """2D correlation (convolution without the flip) with OpenCV's default border, reflect-101 (... c b | a b c | b a ...)"""
    r = k.shape[0] // 2; p = np.pad(img.astype(float), r, mode="reflect")
    out = np.zeros(img.shape)
    for i in range(k.shape[0]):
        for j in range(k.shape[1]):
            out += k[i, j] * p[i:i + img.shape[0], j:j + img.shape[1]]
    return out

def gaussian_kernel(sigma, size):
    x = np.arange(size) - size // 2; g = np.exp(-x ** 2 / (2 * sigma ** 2)); g /= g.sum()
    return np.outer(g, g)

SOBEL_X = np.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], float)    # smoothing [1 2 1] across, derivative [-1 0 1] along

def make_image(noise=4.0, seed=0):
    """illustrative 120 x 160 grey scene: a bright square and a darker disc on a mid background"""
    rng = np.random.default_rng(seed); y, x = np.mgrid[0:120, 0:160]
    img = np.full((120, 160), 90.0); img[30:80, 20:70] = 200
    img[(x - 115) ** 2 + (y - 65) ** 2 < 28 ** 2] = 30
    return np.clip(img + rng.normal(0, noise, img.shape), 0, 255).astype(np.uint8)

def canny(img, lo, hi):
    """Gaussian blur, Sobel gradients, non-maximum suppression along the gradient, hysteresis thresholds"""
    g = correlate(img, gaussian_kernel(1.4, 5))
    gx, gy = correlate(g, SOBEL_X), correlate(g, SOBEL_X.T)
    mag = np.hypot(gx, gy); ang = (np.degrees(np.arctan2(gy, gx)) + 180) % 180
    nms = np.zeros_like(mag); H, W = mag.shape
    q = np.round(ang / 45).astype(int) % 4                          # 0: E-W, 1: NE-SW, 2: N-S, 3: NW-SE neighbours
    off = {0: (0, 1), 1: (1, 1), 2: (1, 0), 3: (1, -1)}
    for d, (di, dj) in off.items():
        m = q == d
        a = np.roll(np.roll(mag, -di, 0), -dj, 1); b = np.roll(np.roll(mag, di, 0), dj, 1)
        keep = m & (mag >= a) & (mag >= b); nms[keep] = mag[keep]
    nms[[0, -1], :] = 0; nms[:, [0, -1]] = 0
    strong = nms >= hi; weak = nms >= lo; edges = strong.copy()
    while True:                                                    # grow strong edges through connected weak pixels
        grown = weak & (np.pad(edges, 1)[0:-2, 0:-2] | np.pad(edges, 1)[0:-2, 1:-1] | np.pad(edges, 1)[0:-2, 2:] |
                        np.pad(edges, 1)[1:-1, 0:-2] | np.pad(edges, 1)[1:-1, 2:] | np.pad(edges, 1)[2:, 0:-2] |
                        np.pad(edges, 1)[2:, 1:-1] | np.pad(edges, 1)[2:, 2:] | edges)
        if (grown == edges).all(): break
        edges = grown
    return edges, mag

def test_sobel_step():
    img = np.zeros((5, 6)); img[:, 3:] = 100
    gx = correlate(img, SOBEL_X)
    print(f"Sobel x across a 100-level vertical step: {gx[2].tolist()}")
    assert gx[2, 2] == 400 and gx[2, 3] == 400 and gx[2, 0] == 0

def test_matches_opencv():
    img = make_image()
    gx = correlate(img, SOBEL_X); blur = correlate(img, gaussian_kernel(1.4, 5))
    edges, mag = canny(img, 40, 100)
    print(f"Canny with thresholds 40 and 100: {edges.sum()} edge pixels")
    if cv2 is None: print("OpenCV not installed: skipping the comparison"); return
    e1 = np.abs(gx - cv2.Sobel(img, cv2.CV_64F, 1, 0, ksize=3)).max()
    e2 = np.abs(blur - cv2.GaussianBlur(img.astype(float), (5, 5), 1.4)).max()
    ref = cv2.Canny(cv2.GaussianBlur(img, (5, 5), 1.4), 40, 100, L2gradient=True) > 0
    near = cv2.dilate(ref.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
    agree = (edges & near).sum() / edges.sum(); recall = (ref & (cv2.dilate(edges.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0)).sum() / ref.sum()
    print(f"vs cv2.Sobel {e1:.1e}, cv2.GaussianBlur {e2:.1e}; cv2.Canny {ref.sum()} edge pixels, "
          f"{100 * agree:.1f} % of ours within 1 px of OpenCV's and {100 * recall:.1f} % of OpenCV's within 1 px of ours")
    assert e1 < 1e-9 and e2 < 1e-9 and agree > 0.95 and recall > 0.95

def test_edges_on_boundaries():
    img = make_image(); edges, _ = canny(img, 40, 100)
    y, x = np.nonzero(edges)
    on_sq = (np.minimum.reduce([np.abs(y - 29.5), np.abs(y - 79.5)]) <= 2) & (x >= 18) & (x <= 71) | \
            (np.minimum.reduce([np.abs(x - 19.5), np.abs(x - 69.5)]) <= 2) & (y >= 28) & (y <= 81)
    on_disc = np.abs(np.hypot(x - 115, y - 65) - 28) <= 2
    frac = (on_sq | on_disc).mean()
    print(f"{100 * frac:.1f} % of edge pixels lie within 2 px of a true boundary")
    assert frac > 0.98

test_sobel_step()
test_matches_opencv()
test_edges_on_boundaries()
print("PASS")
```
:::end

## Exercises

:::exercise
What does the kernel $\tfrac19\mathbf 1_{3 \times 3}$ do, and why is a Gaussian usually preferred?
:::solution
It is a box blur: the mean of the 3 × 3 neighbourhood. Its frequency response has ripples, so it leaves some high-frequency noise and creates artefacts; the Gaussian falls off smoothly and is the only kernel that is both separable and rotationally symmetric.
:::end

:::exercise
Why does Canny use two thresholds rather than one?
:::solution
One high threshold breaks real edges where they weaken briefly; one low threshold lets noise through. Hysteresis keeps weak pixels only when they connect to a strong one, so edges stay continuous while isolated noise is rejected.
:::end

## Quiz

:::quiz
- type: num
  q: Sobel x response at a vertical step of 50 levels?
  answer: 200
  tol: 0.001
  py: "50*4"
  explain: The kernel weights 1 + 2 + 1 on the bright side.
- type: num
  q: Multiplications per pixel for a separable 7 × 7 Gaussian?
  answer: 14
  tol: 0.001
  py: "2*7"
  explain: Two 1D passes of 7 taps.
- type: num
  q: Gradient magnitude with gx = 300 and gy = 400?
  answer: 500
  tol: 0.001
  py: "math.hypot(300,400)"
  explain: The square root of the sum of squares.
- type: num
  q: Sum of the weights of a normalised Gaussian kernel?
  answer: 1
  tol: 0.001
  py: "1"
  explain: Normalisation keeps the mean brightness.
- type: mc
  q: Non-maximum suppression compares a pixel's magnitude with its neighbours…
  options:
    - along the gradient direction
    - along the edge direction
    - in all 8 directions
    - in the previous frame
  answer: 0
  explain: Across the edge, so the ridge becomes one pixel wide.
- type: mc
  q: In hysteresis, a pixel between the low and high thresholds is an edge if…
  options:
    - it connects to a pixel above the high threshold
    - it is a local maximum
    - its neighbours are below the low threshold
    - always
  answer: 0
  explain: Weak pixels survive only through strong ones.
:::end
