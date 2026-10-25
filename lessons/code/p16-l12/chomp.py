import numpy as np

START, GOAL, N = np.array([0.0, 0.0]), np.array([10.0, 0.0]), 50          # 50 free waypoints between fixed ends
OBST = [(np.array([4.0, 0.3]), 1.0), (np.array([7.0, -0.6]), 0.8)]         # illustrative circular obstacles
EPS, LAM = 0.6, 20.0                                                       # clearance band (m) and obstacle weight

# smoothness, as in CHOMP: half the sum of squared first differences of [START, x_1..x_N, GOAL].
# It equals 1/2 x^T A x + b^T x + c with A = K^T K, K the first-difference operator on the free waypoints.
K = np.zeros((N + 1, N))
for i in range(N + 1):
    if i < N: K[i, i] = 1.0
    if i > 0: K[i, i - 1] = -1.0
A = K.T @ K

def diffs(X): return np.diff(np.vstack([START, X, GOAL]), axis=0)
def smooth_cost(X): return 0.5 * np.sum(diffs(X)**2)
def smooth_grad(X): return K.T @ diffs(X)

def dist(p):
    """signed distance to the nearest obstacle surface, and its gradient"""
    best, grad = np.inf, None
    for c, r in OBST:
        d = np.linalg.norm(p - c)
        if d - r < best: best, grad = d - r, (p - c) / d
    return best, grad

def obst_cost_point(d):
    if d < 0: return -d + EPS / 2
    if d < EPS: return (EPS - d)**2 / (2 * EPS)
    return 0.0

def obst_cost_grad(d):
    if d < 0: return -1.0
    if d < EPS: return -(EPS - d) / EPS
    return 0.0

def obst_cost(X): return sum(obst_cost_point(dist(p)[0]) for p in X)

def obst_grad(X):
    """workspace gradient, with the component along the path removed (CHOMP's projection), so obstacles bend the path sideways"""
    full = np.vstack([START, X, GOAL]); G = np.zeros_like(X)
    for i, p in enumerate(X):
        d, n = dist(p); g = obst_cost_grad(d) * n
        t = full[i + 2] - full[i]; t = t / np.linalg.norm(t)
        G[i] = g - (g @ t) * t
    return G

def total(X): return smooth_cost(X) + LAM * obst_cost(X)

def optimise(X, iters=300, step=0.2, covariant=True, trust=0.1):
    Ainv = np.linalg.inv(A); hist = [total(X)]
    for _ in range(iters):
        g = smooth_grad(X) + LAM * obst_grad(X)
        d = Ainv @ g if covariant else g
        s = min(step, trust / np.abs(d).max())                              # no waypoint moves more than 10 cm per step
        while total(X - s * d) > hist[-1] and s > 1e-10: s /= 2               # backtrack so the cost never rises
        X = X - s * d; hist.append(total(X))
    return X, np.array(hist)

def test_gradient_is_right():
    X = np.linspace(START, GOAL, N + 2)[1:-1] + np.random.default_rng(0).normal(0, 0.1, (N, 2)); h = 1e-6
    num = np.array([[(smooth_cost(X + h * E) - smooth_cost(X - h * E)) / (2 * h) for E in (np.eye(1, 2 * N, 2 * i + k).reshape(N, 2) for k in range(2))] for i in range(N)])
    b1, b2 = smooth_grad(X) - A @ X, smooth_grad(2 * X) - A @ (2 * X)        # gradient = A x + b: the same b anywhere
    print(f"smoothness gradient vs finite differences: largest difference {np.abs(num - smooth_grad(X)).max():.1e}; gradient - A x is constant to {np.abs(b1 - b2).max():.1e}")
    assert np.abs(num - smooth_grad(X)).max() < 1e-6 and np.abs(b1 - b2).max() < 1e-9

def test_bends_away_and_cost_falls():
    X0 = np.linspace(START, GOAL, N + 2)[1:-1]
    c0 = min(dist(p)[0] for p in X0)
    X, hist = optimise(X0.copy())
    seg = np.vstack([START, X, GOAL]); fine = np.concatenate([np.linspace(a, b, 10) for a, b in zip(seg[:-1], seg[1:])])
    print(f"straight line: deepest penetration {-c0:.2f} m, cost {hist[0]:.2f}")
    print(f"after {len(hist) - 1} covariant steps: cost {hist[-1]:.4f}, smallest clearance {min(dist(p)[0] for p in X):.3f} m at the waypoints, "
          f"{min(dist(p)[0] for p in fine):.3f} m densely checked; length {np.sum(np.linalg.norm(np.diff(seg, axis=0), axis=1)):.2f} m, y from {X[:, 1].min():.2f} to {X[:, 1].max():.2f} m")
    assert c0 < 0 and np.all(np.diff(hist) <= 1e-12) and min(dist(p)[0] for p in fine) > 0

def test_covariant_beats_plain_gradient():
    X0 = np.linspace(START, GOAL, N + 2)[1:-1]
    _, hc = optimise(X0.copy()); _, hp = optimise(X0.copy(), covariant=False)
    print("cost after 30, 100 and 300 steps: covariant " + ", ".join(f"{hc[k]:.4f}" for k in (30, 100, 300)) + "; plain gradient " + ", ".join(f"{hp[k]:.4f}" for k in (30, 100, 300)))
    assert all(hc[k] < hp[k] for k in (30, 100, 300))

test_gradient_is_right()
test_bends_away_and_cost_falls()
test_covariant_beats_plain_gradient()
print("PASS")
