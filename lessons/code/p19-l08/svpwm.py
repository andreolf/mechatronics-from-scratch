import numpy as np

def svpwm(valpha, vbeta, vdc):
    """space vector modulation: find the sector, the dwell times of its two active vectors, split the zero time
    equally between 000 and 111, and return the duty cycle of each leg (high-side on-time fraction)"""
    mag, ang = np.hypot(valpha, vbeta), np.arctan2(vbeta, valpha) % (2 * np.pi)
    sector = min(int(ang // (np.pi / 3)), 5); th = ang - sector * np.pi / 3
    m = np.sqrt(3) * mag / vdc                                              # 1 at the edge of the linear range
    t1, t2 = m * np.sin(np.pi / 3 - th), m * np.sin(th)                    # fractions of the period
    if t1 + t2 > 1: t1, t2 = t1 / (t1 + t2), t2 / (t1 + t2)                # overmodulation: clamp to the hexagon
    t0 = 1 - t1 - t2
    V = [(1, 0, 0), (1, 1, 0), (0, 1, 0), (0, 1, 1), (0, 0, 1), (1, 0, 1)]   # the six active switch states
    a, b = np.array(V[sector]), np.array(V[(sector + 1) % 6])
    return t0 / 2 + t1 * a + t2 * b, sector, (t1, t2, t0)                  # each leg is on during its active vectors + 111

def leg_to_phase(d, vdc):
    """average leg voltages d vdc, minus their common mode, give the phase voltages of a star-connected motor"""
    v = d * vdc; return v - v.mean()

def clarke(va, vb, vc): return (2 / 3) * (va - 0.5 * vb - 0.5 * vc), (vb - vc) / np.sqrt(3)

def test_matches_reference():
    vdc = 48.0; worst = 0.0
    for ang in np.linspace(0, 2 * np.pi, 361):
        mag = 0.9 * vdc / np.sqrt(3); va, vb = mag * np.cos(ang), mag * np.sin(ang)
        d, sec, _ = svpwm(va, vb, vdc); ph = leg_to_phase(d, vdc); a, b = clarke(*ph)
        worst = max(worst, np.hypot(a - va, b - vb)); assert np.all((d >= -1e-12) & (d <= 1 + 1e-12))
    print(f"90 % of the linear range, 361 angles: largest error between averaged output and reference {worst:.2e} V")
    assert worst < 1e-9

def test_example_and_range():
    vdc = 48.0; va, vb = 20 * np.cos(np.radians(40)), 20 * np.sin(np.radians(40))
    d, sec, (t1, t2, t0) = svpwm(va, vb, vdc)
    print(f"20 V at 40 deg: sector {sec + 1}, T1 {t1:.4f}, T2 {t2:.4f}, T0 {t0:.4f}; leg duties {np.round(d, 4)}; "
          f"phase voltages {np.round(leg_to_phase(d, vdc), 3)}")
    sv, sine = vdc / np.sqrt(3), vdc / 2
    print(f"largest phase amplitude: SVPWM {sv:.2f} V, sine PWM {sine:.2f} V (+{100 * (sv / sine - 1):.1f} %)")
    assert sec == 0 and abs(sv / sine - 2 / np.sqrt(3)) < 1e-12

def test_minmax_equivalence():
    vdc = 48.0; t = np.linspace(0, 2 * np.pi, 100); mag = 25.0; worst = 0
    for th in t:
        ref = mag * np.cos(th - np.array([0, 2 * np.pi / 3, 4 * np.pi / 3]))
        dz = 0.5 + (ref - 0.5 * (ref.max() + ref.min())) / vdc            # sine plus min-max common-mode injection
        d, _, _ = svpwm(*clarke(*ref), vdc); worst = max(worst, abs(d - dz).max())
    print(f"SVPWM equals sine PWM with min-max injection: largest duty difference {worst:.2e}")
    assert worst < 1e-12

test_matches_reference()
test_example_and_range()
test_minmax_equivalence()
print("PASS")
