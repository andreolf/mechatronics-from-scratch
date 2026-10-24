import numpy as np

def winding(F, path, t0=0.0, t1=1.0, depth=0):
    """total change of arg F(path(t)) over [t0, t1], subdividing until each step is small"""
    a, b = F(path(t0)), F(path(t1))
    d = np.angle(b / a)
    if (abs(d) < 0.2 or depth > 50) and depth > 6:
        return d
    tm = (t0 + t1) / 2
    return winding(F, path, t0, tm, depth + 1) + winding(F, path, tm, t1, depth + 1)

def axis_pt(a, b, t):
    """frequency between a and b, spaced like asinh so that low frequencies get fine steps"""
    return np.sinh(np.arcsinh(a) + (np.arcsinh(b) - np.arcsinh(a)) * t)

def nyquist_N(num, den, R=1e4, eps=1e-4):
    """clockwise encirclements of -1 by L = num/den along the indented Nyquist contour"""
    L = lambda s: np.polyval(num, s) / np.polyval(den, s)
    F = lambda s: 1 + L(s)
    axis = sorted({round(r.imag, 9) for r in np.roots(den) if abs(r.real) < 1e-9})
    pieces, w0 = [], -R
    for wp in axis:                                       # straight up the axis, small right detours at each pole
        pieces.append(lambda t, a=w0, b=wp - eps: 1j * axis_pt(a, b, t))
        pieces.append(lambda t, c=wp: 1j * c + eps * np.exp(1j * (-np.pi / 2 + np.pi * t)))
        w0 = wp + eps
    pieces.append(lambda t, a=w0: 1j * axis_pt(a, R, t))
    pieces.append(lambda t: R * np.exp(1j * (np.pi / 2 - np.pi * t)))     # big arc, clockwise
    total = sum(winding(F, p) for p in pieces)
    return -int(round(total / (2 * np.pi)))               # counter-clockwise arg change -> clockwise count

CASES = [   # (description, numerator, denominator)
    ("4/(s+1)^3", [4], np.poly([-1, -1, -1])),
    ("10/(s+1)^3", [10], np.poly([-1, -1, -1])),
    ("3/(s(s+1)(s+2))", [3], np.poly([0, -1, -2])),
    ("8/(s(s+1)(s+2))", [8], np.poly([0, -1, -2])),
    ("3/((s-1)(s+2))", [3], np.poly([1, -2])),
    ("1/((s-1)(s+2))", [1], np.poly([1, -2])),
    ("10(s+1)/(s^2(s+5))", [10, 10], np.poly([0, 0, -5])),
    ("1/(s^2(s+1))", [1], np.poly([0, 0, -1])),
    ("4(s+2)/((s-1)(s+5))", [4, 8], np.poly([1, -5])),
    ("2(s+2)/((s-1)(s+5))", [2, 4], np.poly([1, -5])),
    ("1/((s^2+4)(s+1))", [1], np.real(np.poly([2j, -2j, -1]))),
]

def test_predicts_stability():
    for name, num, den in CASES:
        num, den = np.array(num, float), np.array(den, float)
        N = nyquist_N(num, den)
        P = int(np.sum(np.roots(den).real > 1e-9))
        Z = N + P
        cl = np.roots(np.polyadd(den, num))
        Z_true = int(np.sum(cl.real > 1e-9))
        print(f"{name:22s}: P = {P}, N = {N:+d} -> Z = {Z} ({'stable' if Z == 0 else 'unstable'}); closed-loop roots give {Z_true}")
        assert Z == Z_true
    print(f"{len(CASES)} cases predicted correctly")

test_predicts_stability()
print("PASS")
