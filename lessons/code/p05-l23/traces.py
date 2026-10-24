RHO = 1.72e-8
MIL = 25.4e-6

def width_mm(I, dT, oz=1.0, inner=False):
    k = 0.024 if inner else 0.048
    area_mil2 = (I / (k * dT**0.44)) ** (1 / 0.725)
    return area_mil2 / (1.378 * oz) * 0.0254

def current_for(width_mm_, dT, oz=1.0, inner=False):
    k = 0.024 if inner else 0.048
    area = (width_mm_ / 0.0254) * 1.378 * oz
    return k * dT**0.44 * area**0.725

def resistance(length_m, width_m, oz=1.0):
    return RHO * length_m / (width_m * 35e-6 * oz)

if __name__ == "__main__":
    w = width_mm(2, 10)
    print(f"2 A, 10 C rise, 1 oz outer: {w:.3f} mm; inner {width_mm(2, 10, inner=True):.3f} mm")
    assert abs(w - 0.7814) < 1e-3 and abs(width_mm(2, 10, inner=True) - 2.0328) < 1e-3
    assert abs(current_for(w, 10) - 2.0) < 1e-9                  # the formula inverts cleanly
    assert abs(width_mm(2, 10, inner=True) / w - 2 ** (1 / 0.725)) < 1e-9   # about 2.6x
    r = resistance(0.1, w / 1000)
    assert abs(r - 0.06289) < 1e-4 and abs(2 * r - 0.1258) < 2e-4
    assert abs(width_mm(5, 10) - 2.7654) < 1e-3 and abs(width_mm(5, 20, oz=2) - 0.9079) < 1e-3
    assert abs(1.378 * MIL - 35e-6) < 0.1e-6                     # 1 oz is about 35 um
