---
id: p17-l06
minutes: 35
summary: Many industrial vision tasks come down to separating bright parts from a dark background and counting them. You implement Otsu's automatic threshold, morphological opening to remove noise and connected-component labelling for area and centroid, and count illustrative parts on a noisy conveyor exactly, matching OpenCV.
---

## Choosing a threshold

A binary mask $f > t$ splits pixels into background and foreground. **Otsu's method** picks $t$ from the histogram alone: it maximises the between-class variance

$$\sigma_b^2(t) = w_0(t)\,w_1(t)\,\big(\mu_0(t) - \mu_1(t)\big)^2,$$

where $w_0, w_1$ are the fractions of pixels below and above $t$ and $\mu_0, \mu_1$ their means. With cumulative sums it costs one pass over 256 levels. It works well when the histogram has two clear peaks; with uneven lighting, threshold small tiles separately (adaptive thresholding).

## Cleaning the mask

Noise leaves isolated specks in the mask. **Morphology** fixes this with min and max filters on the binary image:

- **Erosion** keeps a pixel only if its whole neighbourhood is foreground (shrinks blobs, deletes specks).
- **Dilation** sets a pixel if any neighbour is foreground (grows blobs, fills pinholes).
- **Opening** is erosion then dilation: specks vanish, large blobs return to roughly their shape.

## Connected components

A **connected component** is a maximal set of foreground pixels linked through neighbours (4-connected: edges only; 8-connected: corners too). Label them with a flood fill from each unlabelled foreground pixel, or with OpenCV's faster two-pass union-find. Each component gives its area, bounding box and centroid, the mean of its pixel coordinates, accurate to a fraction of a pixel. Filtering by area removes what survives the opening.

:::figure widget=blobs caption="Illustrative parts on a noisy conveyor. Move the threshold or press Otsu, toggle the opening, and add noise, and watch the component count against the true count."
:::end

## Worked example

An illustrative 160 × 120 image of 9 bright discs (levels 160 to 210) on a background of 60, with noise of standard deviation 30.

1. Otsu chooses threshold 115, the same as `cv2.threshold` with `THRESH_OTSU`.
2. The raw mask has 435 components, almost all specks of noise. `cv2.connectedComponentsWithStats` agrees on the count and the label image.
3. After a 3 × 3 opening and a 20-pixel minimum area: 9 components, the true count.
4. The largest centroid error is 0.29 px.

## Code it from scratch

:::code file=blobs.py
```python
import numpy as np
from collections import deque
try:
    import cv2
except ImportError:
    cv2 = None

def make_image(n=9, noise=30.0, seed=3):
    """illustrative 120 x 160 image of n non-overlapping bright parts (discs) on a dark conveyor, with noise"""
    rng = np.random.default_rng(seed); y, x = np.mgrid[0:120, 0:160]
    img = np.full((120, 160), 60.0); truth = []
    while len(truth) < n:
        c = rng.uniform([14, 14], [106, 146]); r = rng.uniform(6, 11)
        if all(np.hypot(*(c - d)) > r + s + 4 for d, s in truth):
            truth.append((c, r)); img[(y - c[0]) ** 2 + (x - c[1]) ** 2 <= r * r] = rng.uniform(160, 210)
    img = np.clip(img + rng.normal(0, noise, img.shape), 0, 255).astype(np.uint8)
    return img, truth

def otsu(img):
    """the threshold t that maximises the between-class variance w0 w1 (mu0 - mu1)^2 of the histogram"""
    p = np.bincount(img.ravel(), minlength=256) / img.size; levels = np.arange(256)
    w0 = np.cumsum(p); mu = np.cumsum(p * levels); mu_t = mu[-1]
    with np.errstate(divide="ignore", invalid="ignore"):
        sb = (mu_t * w0 - mu) ** 2 / (w0 * (1 - w0))
    sb[~np.isfinite(sb)] = 0
    return int(np.argmax(sb))                                        # pixels > t are foreground

def components(mask, min_area=1):
    """8-connected components by breadth-first flood fill: label image and (area, centroid row, centroid col) per blob"""
    H, W = mask.shape; lab = np.zeros((H, W), int); stats = []
    for i0 in range(H):
        for j0 in range(W):
            if mask[i0, j0] and not lab[i0, j0]:
                k = len(stats) + 1; lab[i0, j0] = k; q = deque([(i0, j0)]); pix = []
                while q:
                    i, j = q.popleft(); pix.append((i, j))
                    for di in (-1, 0, 1):
                        for dj in (-1, 0, 1):
                            a, b = i + di, j + dj
                            if 0 <= a < H and 0 <= b < W and mask[a, b] and not lab[a, b]:
                                lab[a, b] = k; q.append((a, b))
                pix = np.array(pix); stats.append((len(pix), *pix.mean(0)))
    keep = [s for s in stats if s[0] >= min_area]
    return lab, keep

def open3(mask):
    """morphological opening with a 3 x 3 square: erode then dilate, which removes isolated noise pixels"""
    def shift_all(m, op):
        p = np.pad(m, 1, constant_values=op is np.logical_and)       # erosion pads with True, dilation with False
        out = p[1:-1, 1:-1].copy()
        for di in (0, 1, 2):
            for dj in (0, 1, 2):
                out = op(out, p[di:di + m.shape[0], dj:dj + m.shape[1]])
        return out
    return shift_all(shift_all(mask, np.logical_and), np.logical_or)

def test_otsu_bimodal():
    img = np.r_[np.full(500, 50), np.full(500, 200)].astype(np.uint8).reshape(10, 100)
    t = otsu(img); print(f"two levels 50 and 200, equal counts: Otsu threshold {t}")
    assert 50 <= t < 200

def test_counts_match_truth():
    img, truth = make_image()
    t = otsu(img); mask = img > t
    _, raw = components(mask); _, blobs = components(open3(mask), min_area=20)
    print(f"Otsu threshold {t}; raw mask {len(raw)} components, after a 3 x 3 opening and a 20-pixel minimum {len(blobs)} (truth {len(truth)})")
    assert len(blobs) == len(truth)
    err = max(min(np.hypot(b[1] - c[0], b[2] - c[1]) for b in blobs) for c, _ in truth)
    print(f"largest centroid error {err:.2f} px")
    assert err < 1.0
    if cv2 is None: print("OpenCV not installed: skipping the comparison"); return
    t_cv, _ = cv2.threshold(img, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    n_cv, lab_cv, st, cen = cv2.connectedComponentsWithStats(mask.astype(np.uint8), connectivity=8)
    lab, _ = components(mask)
    print(f"cv2 Otsu threshold {t_cv:.0f}; cv2.connectedComponentsWithStats finds {n_cv - 1} components in the raw mask; label images agree: {bool(((lab > 0) == (lab_cv > 0)).all())}")
    assert t == int(t_cv) and n_cv - 1 == len(raw)

test_otsu_bimodal()
test_counts_match_truth()
print("PASS")
```
:::end

## Exercises

:::exercise
Two parts touch each other. What happens to the count, and how could you separate them?
:::solution
They form one component, so the count is one short and the area is about double. Separate them with erosion until they split, a distance transform plus watershed, or reject components whose area is far above the expected part area and flag them.
:::end

:::exercise
Why does a 4-connected labelling of a thin diagonal line give many components?
:::solution
Pixels on a diagonal touch only at their corners, which 4-connectivity does not count, so each pixel is its own component. 8-connectivity links them.
:::end

## Quiz

:::quiz
- type: num
  q: Between-class variance with w0 = w1 = 0.5 and class means 50 and 200?
  answer: 5625
  tol: 0.001
  py: "0.25*150**2"
  explain: w0 w1 (mu0 - mu1)^2.
- type: num
  q: Centroid column of a blob covering columns 10, 11 and 14 (one pixel each)?
  answer: 11.667
  tol: 0.002
  py: "(10+11+14)/3"
  explain: The mean column.
- type: num
  q: Neighbours of a pixel in 8-connectivity?
  answer: 8
  tol: 0.001
  py: "8"
  explain: The 4 edge and 4 corner neighbours.
- type: num
  q: Area in pixels of a disc of radius 10 px (approximately)?
  answer: 314.16
  tol: 0.01
  unit: px
  py: "math.pi*100"
  explain: pi r^2.
- type: mc
  q: Morphological opening is…
  options:
    - erosion followed by dilation
    - dilation followed by erosion
    - a Gaussian blur followed by a threshold
    - the difference of two blurs
  answer: 0
  explain: It removes specks smaller than the structuring element.
- type: mc
  q: Otsu's threshold works best when the histogram…
  options:
    - has two well-separated peaks
    - is flat
    - has one peak
    - is the same across lighting conditions
  answer: 0
  explain: It splits the histogram into two classes.
:::end
