import numpy as np

C = 299_792_458.0
rng = np.random.default_rng(13)

def phase_of(d, f):
    return (4 * np.pi * f * d / C) % (2 * np.pi)

def unwrap_two(phi1, f1, phi2, f2, d_max):
    """Pick the distance consistent with both phases (search over wraps of f1)."""
    amb1 = C / (2 * f1)
    cands = phi1 * C / (4 * np.pi * f1) + amb1 * np.arange(int(d_max / amb1) + 1)
    err = np.angle(np.exp(1j * (phase_of(cands, f2) - phi2)))
    return cands[np.argmin(np.abs(err))]

def scan_to_points(angles, ranges, r_min=0.05, r_max=12.0):
    ok = (ranges > r_min) & (ranges < r_max)
    return np.column_stack([ranges[ok] * np.cos(angles[ok]), ranges[ok] * np.sin(angles[ok])])

if __name__ == "__main__":
    assert abs(C / (2 * 20e6) - 7.4948) < 1e-3
    d = C * 1.2 / (4 * np.pi * 20e6)
    assert abs(d - 1.4313) < 1e-3
    for true_d in (1.4, 9.7, 17.3, 28.2):
        est = unwrap_two(phase_of(true_d, 20e6), 20e6, phase_of(true_d, 25e6), 25e6, d_max=29.9)
        assert abs(est - true_d) < 1e-6, (true_d, est)
    # simulate a 2D scan of a wall at y = 2 m (x from -3 to 3), 1 mm noise, plus dropouts
    angles = np.radians(np.arange(0, 360, 0.5))
    ranges = np.full(angles.size, 0.0)                          # 0 = no return
    sin = np.sin(angles)
    hit = sin > 2 / np.hypot(3, 2)                              # rays that reach the wall segment
    ranges[hit] = 2 / sin[hit] + 0.001 * rng.standard_normal(hit.sum())
    ranges[rng.choice(np.flatnonzero(hit), 10, replace=False)] = 0.0   # dropouts
    pts = scan_to_points(angles, ranges)
    assert len(pts) == hit.sum() - 10
    a, b = np.polyfit(pts[:, 0], pts[:, 1], 1)                   # fit y = a x + b
    print(f"{len(pts)} points, wall fit y = {a:.4f} x + {b:.4f}, rms residual {np.std(pts[:,1]-(a*pts[:,0]+b))*1000:.2f} mm")
    assert abs(a) < 0.002 and abs(b - 2) < 0.002 and np.abs(pts[:, 1] - 2).max() < 0.01
    assert np.allclose(scan_to_points(np.radians([30]), np.array([2.31])), [[2.0005, 1.155]], atol=1e-3)
