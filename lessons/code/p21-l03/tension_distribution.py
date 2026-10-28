import numpy as np

G = 9.81
A = np.array([[-3.5, -3.5, 3.0], [3.5, -3.5, 3.0], [3.5, 3.5, 3.0], [-3.5, 3.5, 3.0]])

def structure(p):
    v = A - p
    return (v / np.linalg.norm(v, axis=1)[:, None]).T          # 3 x 4, columns u_i

def null_vector(U):
    """generalised cross product: n_i = (-1)^i det(U without column i)"""
    n = np.array([(-1) ** i * np.linalg.det(np.delete(U, i, axis=1)) for i in range(4)])
    n /= np.linalg.norm(n)
    return n if n[0] >= 0 else -n

def feasible_range(tp, n, t_min=0.0):
    lo, hi = -np.inf, np.inf
    for t, k in zip(tp, n):
        if k > 0: lo = max(lo, (t_min - t) / k)
        elif k < 0: hi = min(hi, (t_min - t) / k)
        elif t < t_min: return None
    return (lo, hi) if lo <= hi else None

def minimax(tp, n, lo, hi):
    """lambda in [lo, hi] that minimises max_i (tp_i + lambda n_i): a convex piecewise-linear function,
    so its minimum is at an end or where two lines cross"""
    cands = [lo, hi] + [(tp[j] - tp[i]) / (n[i] - n[j]) for i in range(4) for j in range(i + 1, 4) if n[i] != n[j]]
    cands = [c for c in cands if lo - 1e-12 <= c <= hi + 1e-12]
    return min(cands, key=lambda c: np.max(tp + c * n))

def distribute(p, mass, t_min=0.0):
    U = structure(p)
    f = np.array([0, 0, mass * G])
    tp = U.T @ np.linalg.solve(U @ U.T, f)
    n = null_vector(U)
    assert np.allclose(U @ n, 0, atol=1e-12)
    r = feasible_range(tp, n, t_min)
    return U, tp, n, r

# centre of the room: equal tensions, m g / (4 sin theta)
U, tp, n, r = distribute(np.array([0, 0, 1.5]), 1.25)
s = 1.5 / np.hypot(np.hypot(3.5, 3.5), 1.5)
assert np.allclose(tp, 1.25 * G / (4 * s)) and abs(tp[0] - 10.57) < 0.005
assert np.allclose(n, [0.5, -0.5, 0.5, -0.5])                 # one diagonal pair against the other
assert abs(r[1] - 21.14) < 0.01 and abs(r[0] + r[1]) < 1e-9
print(f"centre: {tp[0]:.2f} N on each line; lambda can range over ±{r[1]:.2f} N")

# off centre
p = np.array([1.0, -0.5, 0.9])
U, tp, n, (lo, hi) = distribute(p, 1.25)
lam = minimax(tp, n, lo, hi)
t = tp + lam * n
print("min-norm:", tp.round(2), " minimax:", t.round(2), " range:", round(lo, 2), round(hi, 2))
assert np.allclose(tp, [6.70, 9.68, 8.11, 5.94], atol=0.006)
assert np.allclose(t, [7.64, 8.96, 8.96, 4.90], atol=0.006)
for tt in (tp, t):
    assert np.all(tt >= -1e-9)
    assert np.allclose(U @ tt, [0, 0, 1.25 * G])               # vertical sums to the weight, horizontal cancels

# brute force agrees with the minimax choice
grid = np.linspace(lo, hi, 200001)
assert abs(np.min(np.max(tp[None] + grid[:, None] * n[None], axis=1)) - t.max()) < 1e-3

# no direction tightens every line: the null vector always has mixed signs when all anchors are above
rng = np.random.default_rng(0)
for _ in range(1000):
    q = np.array([rng.uniform(-3.4, 3.4), rng.uniform(-3.4, 3.4), rng.uniform(0.2, 2.9)])
    nq = null_vector(structure(q))
    assert nq.min() < 0 < nq.max()
print("1000 random poses: the null vector always mixes signs, so a suspended robot cannot pretension")
print("PASS")
