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
