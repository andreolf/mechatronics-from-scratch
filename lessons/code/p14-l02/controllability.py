import numpy as np

def ctrb(A, B):
    n = len(A); cols = [B]
    for _ in range(n - 1): cols.append(A @ cols[-1])
    return np.hstack(cols)

def rank(M, tol=1e-9):
    s = np.linalg.svd(M, compute_uv=False)
    return int(np.sum(s > tol * max(1.0, s[0])))

def pbh_controllable(A, B):
    """Popov-Belevitch-Hautus: rank [lambda I - A, B] = n at every eigenvalue"""
    n = len(A)
    return all(rank(np.hstack([lam * np.eye(n) - A, B])) == n for lam in np.linalg.eigvals(A))

M, m, l, g = 0.8, 0.25, 0.45, 9.81
def cartpole_AB():
    """the live lab's cart-pole linearised at upright, frictionless: x = [x, xd, th, thd], u = F"""
    tot = M + m; den = l * (4 / 3 - m / tot)
    p2, beta = g / den, 1 / (tot * den)
    A = np.array([[0, 1, 0, 0], [0, 0, -m * l * p2 / tot, 0], [0, 0, 0, 1], [0, 0, p2, 0]], float)
    B = np.array([[0], [1 / tot + m * l * beta / tot], [0], [-beta]], float)
    return A, B

def two_masses(k1, k2, m1=1.0, m2=1.0):
    """two separate mass-spring systems pushed by the same force: x = [x1, v1, x2, v2]"""
    A = np.array([[0, 1, 0, 0], [-k1 / m1, 0, 0, 0], [0, 0, 0, 1], [0, 0, -k2 / m2, 0]], float)
    B = np.array([[0], [1 / m1], [0], [1 / m2]], float)
    return A, B

CASES = {   # name: (A, B, controllable in theory)
    "cart-pole, force on the cart": (*cartpole_AB(), True),
    "two identical mass-springs, one force": (*two_masses(4.0, 4.0), False),
    "two different mass-springs, one force": (*two_masses(4.0, 9.0), True),
    "decoupled lags 1/(s+1), 1/(s+1)": (-np.eye(2), np.ones((2, 1)), False),
    "decoupled lags 1/(s+1), 1/(s+2)": (np.diag([-1.0, -2.0]), np.ones((2, 1)), True),
    "input on one of two decoupled states": (np.diag([-1.0, -2.0]), np.array([[1.0], [0.0]]), False),
}

def test_rank_matches_theory():
    for name, (A, B, expect) in CASES.items():
        r = rank(ctrb(A, B))
        print(f"{name:40s} rank {r} of {len(A)}  {'controllable' if r == len(A) else 'NOT controllable'}")
        assert (r == len(A)) == expect
        assert pbh_controllable(A, B) == expect             # two independent tests agree

def test_identical_masses_move_together():
    # whatever the input, x1 - x2 obeys an unforced equation: from rest it stays zero
    A, B, _ = CASES["two identical mass-springs, one force"]
    dt, x = 1e-3, np.zeros(4); rng = np.random.default_rng(3)
    for k in range(5000):
        u = rng.normal() * 5
        x = x + dt * (A @ x + B[:, 0] * u)
    print(f"after 5 s of random force: x1 = {x[0]:.4f}, x2 = {x[2]:.4f}")
    assert abs(x[0] - x[2]) < 1e-12 and abs(x[0]) > 1e-3

def test_cartpole_ctrb_values():
    A, B = cartpole_AB()
    C = ctrb(A, B)
    assert abs(C[3, 0] + 1.93237) < 1e-4 and abs(np.linalg.det(C)) > 1.0

test_rank_matches_theory()
test_identical_masses_move_together()
test_cartpole_ctrb_values()
print("PASS")
