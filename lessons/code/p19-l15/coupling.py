import numpy as np

MU0 = 4e-7 * np.pi

def bz_segment(x0, y0, x1, y1, px, py, n=400):
    """z field at points (px, py) from 1 A along a straight segment in the same plane (Biot-Savart, midpoint rule)."""
    s = (np.arange(n) + 0.5) / n; xs = x0 + (x1 - x0) * s; ys = y0 + (y1 - y0) * s
    dlx, dly = (x1 - x0) / n, (y1 - y0) / n
    rx = px[..., None] - xs; ry = py[..., None] - ys; r3 = (rx**2 + ry**2) ** 1.5
    return MU0 / (4 * np.pi) * np.sum((dlx * ry - dly * rx) / r3, axis=-1)

def bz_from_loop(corners, px, py):
    pts = list(corners) + [corners[0]]
    return sum(bz_segment(*p, *q, px, py) for p, q in zip(pts[:-1], pts[1:]))

def mutual(hot, victim, n=60):
    """mutual inductance: flux through the victim rectangle (x0, y0, x1, y1) from 1 A in the hot loop."""
    x0, y0, x1, y1 = victim; xs = np.linspace(x0, x1, n + 1); ys = np.linspace(y0, y1, n + 1)
    xc, yc = (xs[:-1] + xs[1:]) / 2, (ys[:-1] + ys[1:]) / 2; X, Y = np.meshgrid(xc, yc)
    return np.sum(bz_from_loop(hot, X, Y)) * (xs[1] - xs[0]) * (ys[1] - ys[0])

def rect(x0, y0, w, h): return [(x0, y0), (x0 + w, y0), (x0 + w, y0 + h), (x0, y0 + h)]

def test_biot_savart():
    b = bz_segment(-10.0, 0, 10.0, 0, np.array([0.0]), np.array([0.01]), n=200000)
    print(f"field 10 mm from a long wire: {abs(b[0]) * 1e6:.3f} uT per A (infinite wire {MU0 / (2 * np.pi * 0.01) * 1e6:.3f})")
    assert abs(abs(b[0]) - MU0 / (2 * np.pi * 0.01)) / (MU0 / (2 * np.pi * 0.01)) < 0.01

def test_layout_change():
    mm = 1e-3; victim = (25 * mm, -5 * mm, 45 * mm, 5 * mm)                     # a 20 x 10 mm sensor trace loop nearby
    before = rect(0, -10 * mm, 20 * mm, 20 * mm)                                 # input capacitor far from the switches
    after = rect(5 * mm, -2 * mm, 6 * mm, 4 * mm)                               # capacitor right next to the switches
    di_dt = 2.0 / 10e-9                                                          # 2 A switched in 10 ns
    m0, m1 = mutual(before, victim), mutual(after, victim)
    print(f"hot loop area {400:.0f} -> {24:.0f} mm^2")
    print(f"mutual inductance {abs(m0) * 1e9:.3f} -> {abs(m1) * 1e9:.4f} nH; induced spike {abs(m0) * di_dt * 1000:.1f} -> {abs(m1) * di_dt * 1000:.2f} mV")
    print(f"coupling reduced {abs(m0 / m1):.0f} times")
    assert abs(m1) < abs(m0) / 10

def test_edge_rate():
    vin, c = 12.0, 0.5e-12                                                       # 0.5 pF stray capacitance to the victim
    for tr in (2e-9, 10e-9):
        print(f"rise time {tr * 1e9:.0f} ns: dV/dt {vin / tr / 1e9:.1f} V/ns, injected current {c * vin / tr * 1000:.2f} mA, spectrum corner {1 / (np.pi * tr) / 1e6:.0f} MHz")
    fs, n = 10e9, 2**16; t = np.arange(n) / fs; f0 = 1e6
    def spec(tr):
        """1 MHz, 50 % duty trapezoid with equal rise and fall times, and its spectrum."""
        ph = (t * f0) % 1 / f0
        v = vin * np.clip(np.minimum(ph / tr, (0.5 / f0 - ph) / tr + 1), 0, 1)
        a = np.abs(np.fft.rfft(v * np.hanning(n))) / n; f = np.fft.rfftfreq(n, 1 / fs); return f, a
    f, a2 = spec(2e-9); _, a10 = spec(10e-9); band = (f > 200e6) & (f < 1e9)
    gain = 10 * np.log10(np.sum(a2[band]**2) / np.sum(a10[band]**2))
    print(f"200 MHz-1 GHz power: the 10 ns edge is {gain:.1f} dB lower than the 2 ns edge (envelope ratio {20 * np.log10(5):.1f} dB)")
    assert gain > 10

test_biot_savart()
test_layout_change()
test_edge_rate()
print("PASS")
