import numpy as np, itertools

def anchors(w=7.0, d=7.0, h=3.0):
    return np.array([[-w/2, -d/2, h], [w/2, -d/2, h], [w/2, d/2, h], [-w/2, d/2, h]])

def trilaterate(P, r):
    """the two points at distances r from three centres P (rows); None if the spheres do not meet"""
    ex = (P[1] - P[0]) / np.linalg.norm(P[1] - P[0])
    i = ex @ (P[2] - P[0]); ey = P[2] - P[0] - i * ex
    if np.linalg.norm(ey) < 1e-12: return None
    ey /= np.linalg.norm(ey); ez = np.cross(ex, ey)
    d = np.linalg.norm(P[1] - P[0]); j = ey @ (P[2] - P[0])
    x = (r[0]**2 - r[1]**2 + d**2) / (2 * d)
    y = (r[0]**2 - r[2]**2 + i**2 + j**2) / (2 * j) - i / j * x
    z2 = r[0]**2 - x**2 - y**2
    if z2 < 0: return None
    base = P[0] + x * ex + y * ey
    return base + np.sqrt(z2) * ez, base - np.sqrt(z2) * ez

def hang(A, L):
    """Where a point mass on four lines of fixed length comes to rest: the lowest point with every
    anchor distance <= its line length. Some lines end up taut, the rest slack."""
    best, tight = None, None
    ok = lambda p: np.all(np.linalg.norm(A - p, axis=1) <= L + 1e-9)
    for i in range(4):                                       # one line, hanging straight down
        p = A[i] - [0, 0, L[i]]
        if ok(p) and (best is None or p[2] < best[2]): best, tight = p, (i,)
    for i, j in itertools.combinations(range(4), 2):          # two lines: lowest point of their circle
        c = A[j] - A[i]; dd = np.linalg.norm(c); e = c / dd
        a = (L[i]**2 - L[j]**2 + dd**2) / (2 * dd); rho2 = L[i]**2 - a**2
        if rho2 < 0: continue
        ctr = A[i] + a * e
        down = np.array([0, 0, -1.0]) - e * (-e[2])           # downward direction in the circle's plane
        if np.linalg.norm(down) < 1e-12: continue
        p = ctr + np.sqrt(rho2) * down / np.linalg.norm(down)
        if ok(p) and (best is None or p[2] < best[2]): best, tight = p, (i, j)
    for tri in itertools.combinations(range(4), 3):           # three lines: a vertex of the intersection
        sol = trilaterate(A[list(tri)], L[list(tri)])
        if sol is None: continue
        p = min(sol, key=lambda q: q[2])
        if ok(p) and (best is None or p[2] < best[2]): best, tight = p, tri
    return best, tight


# 1. What a calibration mistake does to a commanded straight line at 1 m, x from -2.5 to 2.5 m
def path_error(A_true, A_model, z=1.0):
    errs, slack = [], set()
    for x in np.linspace(-2.5, 2.5, 51):
        cmd = np.array([x, 0.0, z])
        p, tight = hang(A_true, np.linalg.norm(A_model - cmd, axis=1))
        errs.append(p - cmd); slack |= set(range(4)) - set(tight)
    return np.array(errs), sorted(i + 1 for i in slack)

e, _ = path_error(anchors(7.1, 7.1, 3.0), anchors())
print(f"anchors 5 cm further out: gripper {e[25, 2]*100:.1f} cm high in the middle, {e[0, 2]*100:.1f} cm at the ends")
assert abs(e[25, 2] - 0.185) < 0.001 and abs(e[0, 2] - 0.137) < 0.001
e, _ = path_error(anchors(7.0, 7.0, 3.05), anchors())
assert np.allclose(e[:, 2], 0.05) and np.allclose(e[:, :2], 0)    # a ceiling error is a pure shift
A_bad = anchors(); A_bad[2, 2] -= 0.05
e, slack = path_error(A_bad, anchors())
print(f"anchor 3 5 cm low: up to {abs(e[:, 2]).max()*100:.1f} cm down, {abs(e[:, 0]).max()*100:.1f} cm sideways, slack lines {slack}")
assert abs(abs(e[:, 2]).max() - 0.0176) < 0.0005 and slack == [1, 3]

# 2. Self-calibration: 12 anchor coordinates and 4 counter offsets from encoder readings at known poses
def calibrate(P, M, A0, iters=30):
    x = np.concatenate([A0.ravel(), np.zeros(4)])
    for _ in range(iters):
        A, c = x[:12].reshape(4, 3), x[12:]
        V = P[:, None] - A[None]
        L = np.linalg.norm(V, axis=2)
        r = (L + c - M).ravel()
        J = np.zeros((r.size, 16))
        for k in range(len(P)):
            for i in range(4):
                J[4*k + i, 3*i:3*i + 3] = -V[k, i] / L[k, i]
                J[4*k + i, 12 + i] = 1.0
        dx = np.linalg.lstsq(J, -r, rcond=None)[0]
        x += dx
        if np.linalg.norm(dx) < 1e-12:
            break
    return x[:12].reshape(4, 3), x[12:], np.sqrt(np.mean(r**2))

g3, g5 = np.linspace(-2, 2, 3), np.linspace(-3, 3, 5)
pose_sets = {"9 poses at 1.0 m": np.array([[x, y, 1.0] for x in g3 for y in g3]),
             "18 poses at 0.6 and 2.0 m": np.array([[x, y, z] for x in g3 for y in g3 for z in (0.6, 2.0)]),
             "75 poses at 0.5, 1.5 and 2.5 m": np.array([[x, y, z] for x in g5 for y in g5 for z in (0.5, 1.5, 2.5)])}
mean_err = {}
for name, P in pose_sets.items():
    errs = []
    for seed in range(40):
        rng = np.random.default_rng(100 + seed)
        A_true = anchors() + rng.normal(0, 0.05, (4, 3))         # the real room is a few cm off the plan
        c_true = rng.uniform(-0.5, 0.5, 4)                       # where each line counter happens to read zero
        M = np.linalg.norm(A_true[None] - P[:, None], axis=2) + c_true + rng.normal(0, 0.001, (len(P), 4))
        A, c, rms = calibrate(P, M, anchors())
        assert rms < 0.0015                                      # the fit explains the data to the noise level
        errs.append(np.sqrt(np.mean(np.sum((A - A_true)**2, axis=1))))
    mean_err[name] = np.mean(errs)
    print(f"{name}: anchors recovered to {mean_err[name]*1000:.1f} mm rms from 1 mm of length noise")
v = list(mean_err.values())
assert v[0] > v[1] > v[2] and v[2] < 0.003 and v[0] > 0.006
print("PASS")
