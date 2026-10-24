import numpy as np
from itertools import combinations
from scipy.linalg import expm, null_space

def obsv(A, C):
    n = len(A); rows = [C]
    for _ in range(n - 1): rows.append(rows[-1] @ A)
    return np.vstack(rows)

def ctrb(A, B):
    n = len(A); cols = [B]
    for _ in range(n - 1): cols.append(A @ cols[-1])
    return np.hstack(cols)

def rank(M, tol=1e-9):
    s = np.linalg.svd(M, compute_uv=False)
    return int(np.sum(s > tol * max(1.0, s[0])))

M, m, l, g = 0.8, 0.25, 0.45, 9.81
def cartpole_AB():
    tot = M + m; den = l * (4 / 3 - m / tot)
    p2, beta = g / den, 1 / (tot * den)
    A = np.array([[0, 1, 0, 0], [0, 0, -m * l * p2 / tot, 0], [0, 0, 0, 1], [0, 0, p2, 0]], float)
    B = np.array([[0], [1 / tot + m * l * beta / tot], [0], [-beta]], float)
    return A, B

A, B = cartpole_AB()
SENSORS = ["x", "xd", "th", "thd"]                      # each sensor measures one state
THEORY = {("x",): 4, ("xd",): 3, ("th",): 2, ("thd",): 2, ("x", "th"): 4, ("xd", "th"): 3, ("th", "thd"): 2}

def C_of(names):
    return np.array([[1.0 if s == n else 0.0 for s in SENSORS] for n in names])

def test_sensor_sets():
    for names, r_expect in THEORY.items():
        C = C_of(names); r = rank(obsv(A, C))
        print(f"sensors {', '.join(names):10s}: rank {r} of 4 {'observable' if r == 4 else ''}")
        assert r == r_expect
        assert rank(ctrb(A.T, C.T)) == r                  # duality: (A, C) observable <=> (A^T, C^T) controllable

def test_unobservable_states_look_identical():
    # with only the angle sensor, shifting the cart (and its speed) changes nothing the sensor sees
    C = C_of(("th",)); N = null_space(obsv(A, C))
    x0 = np.array([0.0, 0.0, 0.05, 0.0]); x1 = x0 + 0.7 * N[:, 0] + 0.3 * N[:, 1]
    y0 = [C @ expm(A * t) @ x0 for t in np.linspace(0, 1, 21)]
    y1 = [C @ expm(A * t) @ x1 for t in np.linspace(0, 1, 21)]
    print(f"unobservable subspace for the angle sensor spans x and xd: {np.round(np.abs(N).sum(axis=1), 3)}")
    assert np.abs(np.array(y0) - np.array(y1)).max() < 1e-9 and np.linalg.norm(x1 - x0) > 0.5

def test_all_single_and_pairs():
    count = sum(rank(obsv(A, C_of(c))) == 4 for k in (1, 2) for c in combinations(SENSORS, k))
    print(f"{count} of 10 single sensors and pairs make the cart-pole observable")
    assert count == 4                                      # every set that contains x: x, (x,xd), (x,th), (x,thd)

test_sensor_sets()
test_unobservable_states_look_identical()
test_all_single_and_pairs()
print("PASS")
