import numpy as np

rng = np.random.default_rng(12)
B_WORLD = np.array([20.0, 0.0, -40.0])                       # µT: north and down (x north, z up)
S = np.array([[1.25, 0.10, 0.02], [0.10, 0.90, -0.05], [0.02, -0.05, 1.05]])   # symmetric soft iron
H = np.array([15.0, -8.0, 22.0])                              # hard iron

def rot(yaw, pitch, roll):
    cy, sy, cp, sp, cr, sr = np.cos(yaw), np.sin(yaw), np.cos(pitch), np.sin(pitch), np.cos(roll), np.sin(roll)
    Rz = np.array([[cy, -sy, 0], [sy, cy, 0], [0, 0, 1]])
    Ry = np.array([[cp, 0, sp], [0, 1, 0], [-sp, 0, cp]])
    Rx = np.array([[1, 0, 0], [0, cr, -sr], [0, sr, cr]])
    return Rz @ Ry @ Rx                                          # body -> world

def read(R):
    return S @ (R.T @ B_WORLD) + H + 0.3 * rng.standard_normal(3)

def fit_ellipsoid(P):
    x, y, z = P.T
    D = np.column_stack([x*x, y*y, z*z, 2*x*y, 2*x*z, 2*y*z, 2*x, 2*y, 2*z])
    p = np.linalg.lstsq(D, np.ones(len(P)), rcond=None)[0]
    A = np.array([[p[0], p[3], p[4]], [p[3], p[1], p[5]], [p[4], p[5], p[2]]])
    g = p[6:]
    h = -np.linalg.solve(A, g)
    M = A / (1 + h @ A @ h)
    w, V = np.linalg.eigh(M)
    return h, V @ np.diag(np.sqrt(w)) @ V.T                     # centre and M^(1/2)

def heading(m):
    return np.degrees(np.arctan2(-m[1], m[0]))

if __name__ == "__main__":
    samples = np.array([read(rot(*rng.uniform([-np.pi, -1.2, -np.pi], [np.pi, 1.2, np.pi]))) for _ in range(400)])
    h, Mh = fit_ellipsoid(samples)
    Bmag = np.linalg.norm(B_WORLD)
    print("hard iron estimate:", h.round(2))
    assert np.allclose(h, H, atol=0.5)
    radii = np.linalg.norm((samples - h) @ Mh.T, axis=1)
    assert np.abs(radii - 1).max() < 0.03                       # back on the unit sphere
    worst_raw = worst_cal = 0.0
    for yaw in np.radians(np.arange(0, 360, 5)):                 # level headings
        raw = read(rot(yaw, 0, 0))
        cal = Bmag * Mh @ (raw - h)
        true = np.degrees(yaw)
        wrap = lambda a: (a + 180) % 360 - 180
        worst_raw = max(worst_raw, abs(wrap(heading(raw) - true)))
        worst_cal = max(worst_cal, abs(wrap(heading(cal) - true)))
    print(f"worst level heading error: raw {worst_raw:.1f} deg, calibrated {worst_cal:.2f} deg")
    assert worst_cal < 2 and worst_raw > 20
