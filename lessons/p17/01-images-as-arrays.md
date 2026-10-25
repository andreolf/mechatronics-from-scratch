---
id: p17-l01
minutes: 30
summary: To a computer an image is a grid of numbers, usually three bytes per pixel. You learn how images are stored as arrays of rows, columns and channels, convert colour to grey and to HSV by hand, see how 8-bit arithmetic silently wraps round, and test your NumPy conversions against OpenCV's.
---

## Rows, columns, channels

A colour image of height $H$ and width $W$ is an array of shape $(H, W, 3)$: row first, then column, then channel. Pixel $(r, c)$ is `img[r, c]`, three numbers from 0 to 255 in an 8-bit (`uint8`) image. The row index grows **downwards**, so image coordinates have $y$ pointing down. A 640 × 480 colour image is $640 \times 480 \times 3 = 921\,600$ bytes.

Channel order is a convention. Most libraries use RGB; OpenCV's image loading returns **BGR**, a historical choice that causes many swapped-colour bugs. Slicing an array (a crop, a flip, one channel) gives a **view** that shares memory with the original rather than a copy.

## Grey and colour spaces

A grey (luma) image weights the channels by how bright they look. OpenCV uses the ITU-R BT.601 weights:

$$Y = 0.299R + 0.587G + 0.114B.$$

**HSV** separates colour from brightness: value $V = \max(R, G, B)$, saturation $S = (V - \min)/V$, and hue $H$ is an angle around the colour wheel (red 0°, green 120°, blue 240°). Thresholding on hue finds "the red ball" far more reliably under changing light than thresholding RGB. In 8-bit OpenCV images, $H$ is stored as degrees divided by 2 so it fits in 0 to 179.

## 8-bit arithmetic

`uint8` arithmetic in NumPy is modulo 256: $200 + 100 = 44$. Image libraries **saturate** instead, clipping at 255. Convert to a wider type (`int` or `float`) before arithmetic, then clip and convert back.

:::figure widget=pixelinspect caption="An illustrative synthetic image. Move the inspector to read any pixel's RGB, grey and HSV values, and switch the view between the colour image, its grey version and its separate channels."
:::end

## Worked example

An illustrative 160 × 120 synthetic image: a fading blue sky, a red disc and a green square.

1. Shape $(120, 160, 3)$, `uint8`, 57 600 bytes.
2. The disc pixel at row 60, column 50 is RGB $(220, 40, 30)$. Its grey value is $0.299 \times 220 + 0.587 \times 40 + 0.114 \times 30 = 92.6 \to 93$. Its HSV is $(2, 220, 220)$: hue 4°, a slightly orange red.
3. The green square has hue $64$, i.e. 128°.
4. 200 + 100 in `uint8`: NumPy gives 44, saturating arithmetic and `cv2.add` give 255.
5. Against OpenCV: grey and HSV differ by at most 1 level (OpenCV rounds in fixed point), and the nearest-neighbour resize is identical to `cv2.INTER_NEAREST_EXACT`.

## Code it from scratch

:::code file=images.py
```python
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
```
:::end

## Exercises

:::exercise
Why does OpenCV's plain `INTER_NEAREST` differ from the code's nearest-neighbour resize when halving an image?
:::solution
The code samples the source pixel under each output pixel's **centre**, $\lfloor (i + 0.5)\,s \rfloor$, which for $s = 2$ is pixel $2i + 1$. Plain `INTER_NEAREST` uses $\lfloor i\,s \rfloor = 2i$, shifting the image by half an output pixel. `INTER_NEAREST_EXACT` uses the centre convention.
:::end

:::exercise
A red ball under a lamp has RGB $(200, 60, 50)$; in shadow $(100, 30, 25)$. Compare their hue and value.
:::solution
Both have hue $60 \times (60 - 50)/(200 - 50) = 4°$ (and $4°$ for the shadow) and saturation 0.75. Only the value changes, 200 against 100. A hue threshold catches both; an RGB threshold on red would miss the shadow.
:::end

## Quiz

:::quiz
- type: num
  q: Bytes in a 640 × 480 RGB image at 8 bits per channel?
  answer: 921600
  tol: 0.001
  py: "640*480*3"
  explain: Width × height × channels.
- type: num
  q: Grey value of RGB (100, 200, 50) with the BT.601 weights?
  answer: 153.0
  tol: 0.002
  py: "0.299*100+0.587*200+0.114*50"
  explain: 29.9 + 117.4 + 5.7.
- type: num
  q: uint8 result of 250 + 10 in NumPy?
  answer: 4
  tol: 0.001
  py: "(250+10)%256"
  explain: It wraps modulo 256.
- type: num
  q: OpenCV 8-bit hue value of pure green (120°)?
  answer: 60
  tol: 0.001
  py: "120/2"
  explain: Degrees divided by 2.
- type: mc
  q: img[10, 20] in a NumPy image is…
  options:
    - row 10, column 20
    - x = 10, y = 20
    - channel 10 of pixel 20
    - column 10, row 20
  answer: 0
  explain: Rows come first, and rows grow downwards.
- type: mc
  q: Why threshold on hue rather than on RGB to find a coloured object?
  options:
    - hue barely changes with brightness
    - hue is faster to compute
    - RGB has no red channel in OpenCV
    - hue has more levels
  answer: 0
  explain: Shadows change V, not H.
:::end
