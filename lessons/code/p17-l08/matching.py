import numpy as np
try:
    import cv2
except ImportError:
    cv2 = None

def texture(H=200, W=260, seed=0):
    """illustrative textured scene: smoothed random noise, contrast-stretched, as a float image"""
    rng = np.random.default_rng(seed); f = rng.normal(0, 1, (H, W))
    F = np.fft.fft2(f); ky, kx = np.meshgrid(np.fft.fftfreq(H), np.fft.fftfreq(W), indexing="ij")
    f = np.real(np.fft.ifft2(F * np.exp(-(kx ** 2 + ky ** 2) / (2 * 0.06 ** 2))))
    return 128 + 50 * f / f.std()

def bilinear(img, x, y):
    x0, y0 = np.floor(x).astype(int), np.floor(y).astype(int); ax, ay = x - x0, y - y0
    x0 = np.clip(x0, 0, img.shape[1] - 2); y0 = np.clip(y0, 0, img.shape[0] - 2)
    return ((1 - ay) * ((1 - ax) * img[y0, x0] + ax * img[y0, x0 + 1]) + ay * ((1 - ax) * img[y0 + 1, x0] + ax * img[y0 + 1, x0 + 1]))

def second_view(img, shift=(17.3, -9.6), angle_deg=8.0, gain=1.15, bias=-12, noise=3.0, seed=1):
    """the same scene moved, slightly rotated, brighter and noisier; returns the image and the map from view 1 to view 2"""
    a = np.radians(angle_deg); R = np.array([[np.cos(a), -np.sin(a)], [np.sin(a), np.cos(a)]]); c = np.array([130, 100]); t = np.array(shift)
    to2 = lambda p: (p - c) @ R.T + c + t
    H, W = img.shape; ys, xs = np.mgrid[0:H, 0:W].astype(float)
    q = (np.c_[xs.ravel(), ys.ravel()] - c - t) @ R + c                   # inverse map: where each view-2 pixel came from
    out = gain * bilinear(img, q[:, 0], q[:, 1]).reshape(H, W) + bias
    return out + np.random.default_rng(seed).normal(0, noise, out.shape), to2

PAIRS = np.random.default_rng(42).integers(-12, 13, (256, 4))           # 256 random point pairs in a 25 x 25 patch

def describe(img, pts):
    """BRIEF-like binary descriptor: bit i is 1 when the pixel at pair i's first point is darker than at its second"""
    x, y = np.round(pts[:, 0]).astype(int), np.round(pts[:, 1]).astype(int)
    a = img[y[:, None] + PAIRS[:, 1], x[:, None] + PAIRS[:, 0]]; b = img[y[:, None] + PAIRS[:, 3], x[:, None] + PAIRS[:, 2]]
    return np.packbits(a < b, axis=1)                                     # 32 bytes per keypoint

def hamming(D1, D2):
    """all pairwise Hamming distances: count the differing bits"""
    return np.unpackbits(D1[:, None, :] ^ D2[None, :, :], axis=2).sum(2)

def match(D1, D2, ratio=0.8):
    """nearest neighbour in descriptor space, kept only if clearly better than the second nearest (Lowe's ratio test)"""
    d = hamming(D1, D2); idx = np.argsort(d, axis=1)
    best, second = d[np.arange(len(d)), idx[:, 0]], d[np.arange(len(d)), idx[:, 1]]
    keep = best < ratio * second
    return np.c_[np.nonzero(keep)[0], idx[keep, 0]], best

def keypoints(img, n=150, border=20, seed=2):
    """for this lesson, keypoints at random positions; in practice from a corner detector (lesson 07)"""
    rng = np.random.default_rng(seed); H, W = img.shape
    return rng.uniform([border + 20, border + 20], [W - border - 20, H - border - 20], (n, 2))

def evaluate(ratio=0.8, noise=6.0):
    img1 = texture(); img2, to2 = second_view(img1, noise=noise)
    p1 = keypoints(img1); p2 = to2(p1)
    keep2 = (p2[:, 0] > 20) & (p2[:, 0] < 240) & (p2[:, 1] > 20) & (p2[:, 1] < 180)
    p1, p2 = p1[keep2], p2[keep2]
    rng = np.random.default_rng(3); seen = rng.random(len(p2)) < 0.7      # 30 % of the points are occluded in view 2,
    p2 = np.r_[p2[seen], rng.uniform([30, 30], [230, 170], (60, 2))]      # and view 2 has 60 keypoints of its own
    p2 = p2[rng.permutation(len(p2))]                                     # shuffle so the index tells nothing
    D1, D2 = describe(img1, p1), describe(img2, p2)
    m, _ = match(D1, D2, ratio)
    good = np.linalg.norm(to2(p1[m[:, 0]]) - p2[m[:, 1]], axis=1) < 2
    return len(p1), len(m), good.mean(), D1, D2

def test_descriptor_basics():
    img = texture(); p = keypoints(img)[:5]; D = describe(img, p)
    print(f"descriptor: {D.shape[1]} bytes = {8 * D.shape[1]} bits; distance of a keypoint to itself {hamming(D[:1], D[:1])[0, 0]}, to a different one {hamming(D[:1], D[1:2])[0, 0]}")
    assert D.shape[1] == 32 and hamming(D[:1], D[:1])[0, 0] == 0
    brighter = describe(1.3 * img + 20, p)
    assert (hamming(D, brighter).diagonal() == 0).all()                  # comparisons ignore gain and offset

def test_ratio_test():
    res = []
    for ratio in (1.0, 0.8, 0.7):
        n, m, inl, *_ = evaluate(ratio)
        print(f"ratio {ratio}: {m} of {n} keypoints matched, inlier ratio {100 * inl:.1f} %")
        res.append(inl)
    n, m, inl, D1, D2 = evaluate(0.8)
    assert inl > 0.9 and res[1] > res[0] + 0.2
    if cv2 is None: print("OpenCV not installed: skipping the comparison"); return
    knn = cv2.BFMatcher(cv2.NORM_HAMMING).knnMatch(D1, D2, k=2)
    ref = sorted((a.queryIdx, a.trainIdx) for a, b in knn if a.distance < 0.8 * b.distance)
    ours = sorted(map(tuple, match(D1, D2, 0.8)[0].tolist()))
    print(f"cv2.BFMatcher (NORM_HAMMING, k = 2) with the same ratio test gives the same {len(ref)} matches: {ref == ours}")
    assert ref == ours

test_descriptor_basics()
test_ratio_test()
print("PASS")
