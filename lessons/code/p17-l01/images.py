import numpy as np
try:
    import cv2                                                # only used to check our results
except ImportError:
    cv2 = None

def make_image(h=120, w=160):
    """an illustrative synthetic RGB image (uint8, rows x columns x channels): a gradient sky, a red disc, a green square"""
    y, x = np.mgrid[0:h, 0:w]
    img = np.zeros((h, w, 3), np.uint8)
    img[..., 2] = (255 * (1 - y / (h - 1))).astype(np.uint8)          # blue fades down the image
    img[..., 1] = (120 * x / (w - 1)).astype(np.uint8)
    disc = (x - 50)**2 + (y - 60)**2 < 25**2
    img[disc] = [220, 40, 30]
    img[70:105, 100:140] = [40, 200, 60]
    return img

def to_gray(rgb):
    """ITU-R BT.601 luma, the weights OpenCV uses: Y = 0.299 R + 0.587 G + 0.114 B, rounded"""
    r, g, b = [rgb[..., k].astype(np.float64) for k in range(3)]
    return np.clip(np.round(0.299 * r + 0.587 * g + 0.114 * b), 0, 255).astype(np.uint8)

def to_hsv(rgb):
    """HSV with OpenCV's 8-bit conventions: H in 0..179 (degrees / 2), S and V in 0..255"""
    c = rgb.astype(np.float64) / 255; r, g, b = c[..., 0], c[..., 1], c[..., 2]
    v = c.max(-1); mn = c.min(-1); d = v - mn
    s = np.where(v > 0, d / np.where(v > 0, v, 1), 0)
    dd = np.where(d > 0, d, 1)
    h = np.select([d == 0, v == r, v == g], [0, 60 * (g - b) / dd, 120 + 60 * (b - r) / dd], 240 + 60 * (r - g) / dd)
    h = np.where(h < 0, h + 360, h)
    return np.stack([np.round(h / 2) % 180, np.round(s * 255), np.round(v * 255)], -1).astype(np.uint8)

def resize_nearest(img, h, w):
    """nearest-neighbour resize: each output pixel copies the source pixel its centre falls in (OpenCV: INTER_NEAREST_EXACT)"""
    rows = np.floor((np.arange(h) + 0.5) * img.shape[0] / h).astype(int)
    cols = np.floor((np.arange(w) + 0.5) * img.shape[1] / w).astype(int)
    return img[rows][:, cols]

def test_indexing():
    img = make_image()
    print(f"shape {img.shape} (rows, columns, channels), dtype {img.dtype}, {img.nbytes} bytes")
    print(f"pixel at row 60, column 50 (the disc): RGB {img[60, 50].tolist()}; at row 0, column 0: {img[0, 0].tolist()}")
    assert img[60, 50].tolist() == [220, 40, 30] and img.shape == (120, 160, 3)
    crop = img[70:105, 100:140]; assert (crop == [40, 200, 60]).all()          # slicing is a view: no copy
    assert np.shares_memory(crop, img) and np.array_equal(img[:, ::-1][:, 0], img[:, -1])   # a mirror is just negative strides

def test_arithmetic_overflow():
    a = np.full((2, 2), 200, np.uint8); b = np.full((2, 2), 100, np.uint8)         # two tiny images
    wrap = (a + b)[0, 0]; sat = np.clip(a.astype(int) + b, 0, 255).astype(np.uint8)[0, 0]
    print(f"uint8 200 + 100: NumPy wraps to {wrap}, saturating arithmetic gives {sat}" + (f", cv2.add gives {cv2.add(a, b)[0, 0]}" if cv2 else ""))
    assert wrap == 44 and sat == 255
    if cv2: assert cv2.add(a, b)[0, 0] == 255

def test_matches_opencv():
    img = make_image(); g = to_gray(img); hsv = to_hsv(img); small = resize_nearest(img, 60, 80)
    print(f"gray at the disc {g[60, 50]}, HSV at the disc {hsv[60, 50].tolist()}, at the square {hsv[80, 120].tolist()}")
    assert g[60, 50] == round(0.299 * 220 + 0.587 * 40 + 0.114 * 30)
    if cv2 is None:
        print("OpenCV not installed: skipping the comparison"); return
    dg = np.abs(g.astype(int) - cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)).max()
    ref = cv2.cvtColor(img, cv2.COLOR_RGB2HSV).astype(int); dh = np.abs(hsv.astype(int) - ref)
    dh[..., 0] = np.minimum(dh[..., 0], 180 - dh[..., 0])                    # hue wraps round
    dr = np.abs(small.astype(int) - cv2.resize(img, (80, 60), interpolation=cv2.INTER_NEAREST_EXACT)).max()
    print(f"largest difference from OpenCV: gray {dg}, HSV {dh.max()} (levels), nearest resize {dr}")
    assert dg <= 1 and dh.max() <= 1 and dr == 0

test_indexing()
test_arithmetic_overflow()
test_matches_opencv()
print("PASS")
