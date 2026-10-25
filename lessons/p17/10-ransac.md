---
id: p17-l10
minutes: 35
summary: Feature matches always contain some wrong ones, and one bad match ruins a least-squares fit. You derive how many random samples RANSAC needs, implement it for homographies with an adaptive stopping rule, and recover an illustrative homography from matches that are 50 % (and up to 70 %) outliers, agreeing with OpenCV's RANSAC.
---

## Outliers break least squares

Least squares minimises the sum of squared errors, so one match off by 200 px weighs as much as 10 000 matches off by 2 px. Even after the ratio test (lesson 08), some matches are wrong, and repeated texture can make half of them wrong.

## Random sample consensus

**RANSAC** turns the problem around:

1. Pick a minimal random sample, here 4 matches.
2. Fit the model to it exactly (DLT).
3. Count the **inliers**: matches with reprojection error below a threshold (a few pixels).
4. Repeat, keeping the model with the most inliers.
5. Refit on all of its inliers by least squares.

A sample made only of inliers gives a good model, which gathers all the other inliers. Samples containing an outlier give models that gather few.

## How many samples

If a fraction $w$ of matches are inliers, a sample of $s$ is all-inlier with probability $w^s$. For confidence $p$ that at least one of $N$ samples is clean:

$$N = \frac{\log(1 - p)}{\log(1 - w^s)}.$$

For $s = 4$ and $p = 0.99$: $w = 0.9$ needs 5 samples, $w = 0.5$ needs 72, $w = 0.3$ needs 567. Since $w$ is unknown, start pessimistic and recompute $N$ from the best inlier count so far (adaptive RANSAC). Smaller models ($s$ = 2 for a line, 3 for an affine map) need far fewer samples.

:::figure widget=ransac caption="Illustrative point matches for a line fit with a chosen fraction of outliers. Step through the samples, watch each candidate's inliers, and compare the RANSAC line with the least-squares one."
:::end

## Worked example

200 illustrative matches between two views of a plane, 0.5 px noise, 99 of them replaced by random points (about 50 % outliers); inlier threshold 2 px.

1. Least squares on all matches is off by 138.4 px RMS.
2. RANSAC took 116 samples (the adaptive bound settles at 72, but the first clean sample arrived after some bad ones). It kept 100 inliers, 99 % of the true inliers and no outliers, and is off by 0.09 px.
3. `cv2.findHomography` with `RANSAC` and the same threshold finds the same 100 inliers and is off by 0.10 px.
4. 60 % outliers: 208 samples, 0.12 px. 70 % outliers: 1508 samples, 0.33 px.

## Code it from scratch

:::code file=ransac.py
```python
import numpy as np
try:
    import cv2
except ImportError:
    cv2 = None

H_TRUE = np.array([[0.9, -0.15, 40], [0.05, 0.8, 30], [4e-4, -3e-4, 1]])

def apply(H, p):
    q = np.c_[p, np.ones(len(p))] @ H.T
    return q[:, :2] / q[:, 2:]

def dlt(src, dst):
    def nrm(p):
        m = p.mean(0); s = np.sqrt(2) / max(np.mean(np.linalg.norm(p - m, axis=1)), 1e-12)
        return np.array([[s, 0, -s * m[0]], [0, s, -s * m[1]], [0, 0, 1]])
    Ts, Td = nrm(src), nrm(dst); a, b = apply(Ts, src), apply(Td, dst); A = []
    for (x, y), (u, v) in zip(a, b):
        A += [[-x, -y, -1, 0, 0, 0, u * x, u * y, u], [0, 0, 0, -x, -y, -1, v * x, v * y, v]]
    H = np.linalg.inv(Td) @ np.linalg.svd(np.array(A))[2][-1].reshape(3, 3) @ Ts
    return H / H[2, 2]

def iterations(inlier_frac, s=4, p=0.99):
    """samples needed so that, with probability p, at least one sample of s points is all inliers"""
    return int(np.ceil(np.log(1 - p) / np.log(1 - inlier_frac ** s)))

def ransac(src, dst, thresh=2.0, p=0.99, max_iter=5000, seed=0):
    """fit H to random 4-point samples, keep the one with most inliers, adapt the iteration count, refit on its inliers"""
    rng = np.random.default_rng(seed); n = len(src); best = np.zeros(n, bool); N, k = max_iter, 0
    while k < N:
        idx = rng.choice(n, 4, replace=False); k += 1
        try:
            H = dlt(src[idx], dst[idx])
        except np.linalg.LinAlgError:
            continue
        with np.errstate(all="ignore"):
            err = np.linalg.norm(apply(H, src) - dst, axis=1)
        inl = err < thresh
        if inl.sum() > best.sum():
            best = inl; N = min(max_iter, iterations(max(inl.mean(), 1e-3)))
    H = dlt(src[best], dst[best])
    return H, np.linalg.norm(apply(H, src) - dst, axis=1) < thresh, k

def make_data(n=200, outlier_frac=0.5, noise=0.5, seed=1):
    rng = np.random.default_rng(seed); src = rng.uniform([0, 0], [400, 300], (n, 2))
    dst = apply(H_TRUE, src) + rng.normal(0, noise, (n, 2)); bad = rng.random(n) < outlier_frac
    dst[bad] = rng.uniform([0, 0], [400, 300], (bad.sum(), 2))
    return src, dst, ~bad

def test_iteration_count():
    for w in (0.9, 0.7, 0.5, 0.3):
        print(f"inlier fraction {w}: {iterations(w)} samples of 4 for 99 % confidence")
    assert iterations(0.5) == 72 and iterations(0.3) == 567

def test_least_squares_fails():
    src, dst, good = make_data()
    test = np.random.default_rng(5).uniform([0, 0], [400, 300], (500, 2))
    e_ls = np.sqrt(np.mean(np.sum((apply(dlt(src, dst), test) - apply(H_TRUE, test)) ** 2, 1)))
    H, inl, k = ransac(src, dst)
    e_r = np.sqrt(np.mean(np.sum((apply(H, test) - apply(H_TRUE, test)) ** 2, 1)))
    tp = (inl & good).sum() / good.sum(); fp = (inl & ~good).sum()
    print(f"{(~good).sum()} of {len(src)} matches are outliers: least squares on all of them is off by {e_ls:.1f} px RMS; "
          f"RANSAC took {k} samples, kept {inl.sum()} inliers ({100 * tp:.0f} % of the true inliers, {fp} outliers) and is off by {e_r:.2f} px")
    assert e_ls > 20 and e_r < 0.5 and tp > 0.95 and fp <= 2
    if cv2 is None: print("OpenCV not installed: skipping the comparison"); return
    Hc, mask = cv2.findHomography(src, dst, cv2.RANSAC, 2.0)
    e_c = np.sqrt(np.mean(np.sum((apply(Hc, test) - apply(H_TRUE, test)) ** 2, 1)))
    agree = (mask.ravel().astype(bool) == inl).mean()
    print(f"cv2.findHomography with RANSAC: {mask.sum()} inliers, off by {e_c:.2f} px; inlier sets agree on {100 * agree:.1f} % of matches")
    assert e_c < 0.5 and agree > 0.97

def test_robust_to_more_outliers():
    for frac in (0.6, 0.7):
        src, dst, good = make_data(outlier_frac=frac, seed=2)
        H, inl, k = ransac(src, dst)
        test = np.random.default_rng(5).uniform([0, 0], [400, 300], (500, 2))
        e = np.sqrt(np.mean(np.sum((apply(H, test) - apply(H_TRUE, test)) ** 2, 1)))
        print(f"{int(100 * frac)} % outliers: {k} samples, error {e:.2f} px")
        assert e < 1.0

test_iteration_count()
test_least_squares_fails()
test_robust_to_more_outliers()
print("PASS")
```
:::end

## Exercises

:::exercise
How many samples does a line fit ($s = 2$) need at 50 % inliers and 99 % confidence?
:::solution
$\log 0.01 / \log(1 - 0.25) = 16.0$, so 17 samples. The minimal sample size matters a lot: a homography needs 72 at the same inlier ratio.
:::end

:::exercise
What goes wrong if the inlier threshold is far too large, say 50 px?
:::solution
Outliers within 50 px of a bad model count as inliers, so wrong models score well and the final refit includes outliers. The threshold should be a few times the measurement noise.
:::end

## Quiz

:::quiz
- type: num
  q: RANSAC samples needed with s = 4, w = 0.6 and p = 0.99?
  answer: 34
  tol: 0.001
  py: "math.ceil(math.log(0.01)/math.log(1-0.6**4))"
  explain: log(1 - p) / log(1 - w^s), rounded up.
- type: num
  q: Probability that a random 4-sample is all inliers when w = 0.5?
  answer: 0.0625
  tol: 0.002
  py: "0.5**4"
  explain: w^s.
- type: num
  q: Samples needed for a line (s = 2), w = 0.5, p = 0.99?
  answer: 17
  tol: 0.001
  py: "math.ceil(math.log(0.01)/math.log(0.75))"
  explain: Smaller samples need fewer iterations.
- type: num
  q: Minimal sample size for a 2D affine transform?
  answer: 3
  tol: 0.001
  py: "6/2"
  explain: 6 parameters, 2 equations per point.
- type: mc
  q: Why fit to a minimal sample rather than to 20 random matches?
  options:
    - a small sample is much more likely to contain no outliers
    - a minimal fit is more accurate
    - the DLT needs exactly four points
    - it uses less memory
  answer: 0
  explain: The chance of a clean sample falls as w^s.
- type: mc
  q: After RANSAC selects the best model, you should…
  options:
    - refit on all its inliers by least squares
    - use the four-point model as it is
    - discard the inliers
    - rerun with a larger threshold
  answer: 0
  explain: The refit averages the noise over all the inliers.
:::end
