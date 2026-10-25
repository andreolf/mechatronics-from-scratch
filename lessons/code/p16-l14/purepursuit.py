import numpy as np

def stadium(straight=4.0, R=1.5, n=4000):
    """an illustrative closed track: two straights joined by semicircles, as a dense polyline (counter-clockwise)"""
    u = np.linspace(0, 1, n, endpoint=False) * (2 * straight + 2 * np.pi * R); pts = []
    for d in u:
        if d < straight: pts.append((d - straight / 2, -R))
        elif d < straight + np.pi * R: a = -np.pi / 2 + (d - straight) / R; pts.append((straight / 2 + R * np.cos(a), R * np.sin(a)))
        elif d < 2 * straight + np.pi * R: pts.append((straight / 2 - (d - straight - np.pi * R), R))
        else: a = np.pi / 2 + (d - 2 * straight - np.pi * R) / R; pts.append((-straight / 2 + R * np.cos(a), R * np.sin(a)))
    return np.array(pts)

def circle(R=2.0, n=4000):
    a = np.linspace(0, 2 * np.pi, n, endpoint=False); return np.stack([R * np.cos(a), R * np.sin(a)], 1)

def curvature_to(goal, pose):
    """pure pursuit: the arc through the robot and the goal point, tangent to the heading, has curvature 2 y / L^2"""
    x, y, th = pose; dx, dy = goal[0] - x, goal[1] - y
    yl = -np.sin(th) * dx + np.cos(th) * dy                  # lateral offset of the goal point in the robot frame
    return 2 * yl / (dx * dx + dy * dy)

def lookahead_point(track, pos, L, i0):
    """first track point at least L ahead of the robot, searching forward from the closest point near the last index"""
    n = len(track); idx = (i0 + np.arange(-50, 400)) % n
    i = idx[np.argmin(np.linalg.norm(track[idx] - pos, axis=1))]
    j = i
    while np.linalg.norm(track[(j + 1) % n] - pos) < L: j += 1
    a, b = track[j % n], track[(j + 1) % n]                  # the exact point at distance L on segment a-b
    d, f = b - a, a - pos; A_, B_, C_ = d @ d, 2 * f @ d, f @ f - L * L
    t = (-B_ + np.sqrt(max(B_ * B_ - 4 * A_ * C_, 0.0))) / (2 * A_)
    return a + np.clip(t, 0, 1) * d, i

def cross_track(track, pos):
    """distance to the nearest segment of the polyline"""
    a, b = track, np.roll(track, -1, axis=0); d = b - a
    t = np.clip(np.sum((pos - a) * d, 1) / np.sum(d * d, 1), 0, 1)
    return np.min(np.linalg.norm(a + t[:, None] * d - pos, axis=1))

def run(track, L, v=0.5, T=40.0, dt=0.01, pose=None, lag=0.0, wmax=3.0):
    """unicycle at speed v; the turn rate follows the commanded v * kappa through a first-order lag and a limit"""
    p = np.array(pose if pose is not None else [track[0, 0], track[0, 1], np.arctan2(*(track[1] - track[0])[::-1])], float)
    w = 0.0; i = 0; cte = []
    for k in range(int(T / dt)):
        g, i = lookahead_point(track, p[:2], L, i)
        wc = np.clip(v * curvature_to(g, p), -wmax, wmax)
        w = wc if lag == 0 else w + dt / lag * (wc - w)
        if abs(w) < 1e-9: p += [v * dt * np.cos(p[2]), v * dt * np.sin(p[2]), 0.0]          # exact arc for constant v, w over dt
        else: p += [v / w * (np.sin(p[2] + w * dt) - np.sin(p[2])), -v / w * (np.cos(p[2] + w * dt) - np.cos(p[2])), w * dt]
        cte.append(cross_track(track, p[:2]))
    return np.array(cte)

def test_circle_tracked_exactly():
    c = run(circle(2.0), L=0.6, pose=[2.0, 0.0, np.pi / 2], T=20)
    print(f"circle of radius 2 m: largest cross-track error {c.max():.1e} m (any chord of a circle subtends an arc of that circle)")
    assert c.max() < 1e-5                                    # what is left is the polyline sagging between its points

def test_converges_from_offset():
    c = run(circle(2.0), L=0.6, pose=[2.5, 0.0, np.pi / 2], T=30)
    print(f"start 0.5 m outside the circle: error {c[0]:.3f} m, after 10 s {c[1000] * 1000:.2f} mm, after 30 s {c[-1]:.1e} m")
    assert c[-1] < 1e-5

def test_stadium_within_spec():
    tr = stadium(); spec = 0.05                                # illustrative spec: 5 cm
    res = {L: run(tr, L, T=45) for L in (0.3, 0.6, 1.2)}
    for L, c in res.items(): print(f"stadium, lookahead {L} m: largest cross-track error after the first 5 s {c[500:].max() * 100:.1f} cm")
    assert res[0.3][500:].max() < spec and res[1.2][500:].max() > res[0.3][500:].max()   # longer lookahead cuts corners more

def test_lag_needs_longer_lookahead():
    tr = stadium()
    short, long_ = run(tr, 0.15, T=45, lag=0.5), run(tr, 0.6, T=45, lag=0.5)
    print(f"with a 0.5 s steering lag: lookahead 0.15 m error up to {short[500:].max() * 100:.1f} cm, 0.6 m up to {long_[500:].max() * 100:.1f} cm")
    assert short[500:].max() > long_[500:].max()

test_circle_tracked_exactly()
test_converges_from_offset()
test_stadium_within_spec()
test_lag_needs_longer_lookahead()
print("PASS")
