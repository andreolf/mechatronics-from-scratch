import numpy as np

WHEEL_BASE = 0.40                                                      # illustrative differential-drive robot, m
DT = 0.02

def step(pose, dl, dr, b=WHEEL_BASE):
    """dead reckoning from wheel travel: ds = (dl + dr)/2, dtheta = (dr - dl)/b. Constant wheel speeds within a step
    trace an arc, whose chord is ds sinc(dtheta/2) long and points along the mid-heading"""
    x, y, th = pose; ds = 0.5 * (dl + dr); dth = (dr - dl) / b
    c = ds * np.sinc(dth / (2 * np.pi))                                   # np.sinc(x) = sin(pi x)/(pi x)
    return np.array([x + c * np.cos(th + dth / 2), y + c * np.sin(th + dth / 2), th + dth])

def drive(dl, dr, pose=(0.0, 0.0, 0.0)):
    poses = [np.array(pose, float)]
    for a, c in zip(dl, dr): poses.append(step(poses[-1], a, c))
    return np.array(poses)

def straight_run(n=500, v=0.5):
    d = np.full(n, v * DT); return d, d.copy()                           # 5 m straight at 0.5 m/s

def jacobians(pose, ds, dth):
    x, y, th = pose; a = th + dth / 2
    F = np.array([[1, 0, -ds * np.sin(a)], [0, 1, ds * np.cos(a)], [0, 0, 1]])
    G = np.array([[np.cos(a), -ds * np.sin(a) / 2], [np.sin(a), ds * np.cos(a) / 2], [0, 1]])
    return F, G

def propagate_cov(dl, dr, k=0.01, b=WHEEL_BASE):
    """error model: each wheel's travel has variance k^2 |d| (errors grow with distance, independent per step).
    Map to (ds, dtheta) and push through the motion Jacobians: P <- F P F' + G Q G'"""
    pose = np.zeros(3); P = np.zeros((3, 3))
    for a, c in zip(dl, dr):
        Qw = np.diag([k ** 2 * abs(a), k ** 2 * abs(c)]); M = np.array([[0.5, 0.5], [-1 / b, 1 / b]])
        ds, dth = 0.5 * (a + c), (c - a) / b; F, G = jacobians(pose, ds, dth)
        P = F @ P @ F.T + G @ (M @ Qw @ M.T) @ G.T; pose = step(pose, a, c)
    return P

def monte_carlo(dl, dr, k=0.01, runs=2000, seed=0):
    rng = np.random.default_rng(seed); ends = np.empty((runs, 3))
    for r in range(runs):
        nl = rng.normal(0, k * np.sqrt(np.abs(dl))); nr = rng.normal(0, k * np.sqrt(np.abs(dr)))
        ends[r] = drive(dl + nl, dr + nr)[-1]
    return ends

def test_kinematics():
    dl, dr = np.full(500, 0.5 * DT), np.full(500, 0.5 * DT * 1.2)     # right wheel 20 % faster: a circle
    p = drive(dl, dr)
    R = WHEEL_BASE / 2 * (1 + 1.2) / (1.2 - 1)
    dist = np.hypot(*p[-1, :2]); chord = 2 * R * np.sin(p[-1, 2] / 2)
    print(f"right wheel 20 % faster: turning radius {R:.2f} m, heading after 5.5 m of travel {np.degrees(p[-1, 2]):.1f} deg, end point on the circle: {abs(dist - chord) < 1e-9}")
    assert abs(dist - chord) < 1e-9

def test_drift_matches_model():
    dl, dr = straight_run(); ends = monte_carlo(dl, dr); P = propagate_cov(dl, dr)
    sx, sy, st = ends.std(0); px, py_, pt = np.sqrt(np.diag(P))
    print(f"5 m straight, wheel noise 1 cm per sqrt(m): Monte Carlo sigma x {100 * sx:.2f} cm, y {100 * sy:.2f} cm, heading {np.degrees(st):.2f} deg")
    print(f"propagated covariance:               sigma x {100 * px:.2f} cm, y {100 * py_:.2f} cm, heading {np.degrees(pt):.2f} deg")
    assert abs(sy / py_ - 1) < 0.05 and abs(st / pt - 1) < 0.05
    short = ends[:, 0].mean() - 5.0                                     # cos(heading error) < 1 shortens the run:
    print(f"mean along-track shortfall {100 * short:.2f} cm, a second-order effect the linear model leaves out")
    assert short < 0 and sx > px                                        # the linearisation misses it
    assert sy > 3 * sx                                                  # heading error makes the sideways error dominate

def test_growth_rates():
    """along-track error grows like sqrt(s); heading error like sqrt(s); sideways error like s^1.5"""
    out = []
    for n in (250, 1000):
        P = propagate_cov(*straight_run(n)); out.append(np.sqrt(np.diag(P)))
    r = out[1] / out[0]
    print(f"4 x the distance: along-track sigma x {r[0]:.2f}, sideways x {r[1]:.2f}, heading x {r[2]:.2f}")
    assert abs(r[0] - 2) < 0.01 and abs(r[1] - 8) < 0.1 and abs(r[2] - 2) < 0.01

def test_systematic_bias():
    dl, dr = straight_run(); p = drive(dl * 1.0, dr * 1.005)          # right wheel 0.5 % larger in diameter
    print(f"a 0.5 % wheel-size mismatch: {100 * p[-1, 1]:.1f} cm sideways after 5 m, heading {np.degrees(p[-1, 2]):.2f} deg")
    kappa = 0.005 / WHEEL_BASE                                        # curvature: heading change per metre, about
    print(f"small-angle prediction kappa s^2 / 2 = {100 * kappa * 25 / 2:.1f} cm")
    assert abs(p[-1, 1] - kappa * 25 / 2) < 0.005

test_kinematics()
test_drift_matches_model()
test_growth_rates()
test_systematic_bias()
print("PASS")
