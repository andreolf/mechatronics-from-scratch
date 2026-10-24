import numpy as np

def grubler(n_links, joints, planar=True):
    """Grubler-Kutzbach mobility. n_links counts the ground; joints is a list of joint freedoms f_i."""
    m = 3 if planar else 6
    return m * (n_links - 1 - len(joints)) + sum(joints)

def rank(M, tol=1e-9):
    s = np.linalg.svd(M, compute_uv=False)
    return int(np.sum(s > tol * max(1.0, s[0]))) if len(s) else 0

def mobility_from_geometry(n_bodies, joints):
    """Planar check independent of Grubler: each moving body has (x, y, theta); body 0 is ground.
    joints: ('R', a, b, P) pin at world point P, or ('P', a, b, P, u) slider along unit direction u.
    Bodies sit in their reference pose, so the constraints hold; DOF = 3(n - 1) - rank(constraint Jacobian)."""
    nq = 3 * (n_bodies - 1); rows = []
    def blk(body, P):               # d(world position of body point P) / d(q_body)
        J = np.zeros((2, nq))
        if body > 0:
            k = 3 * (body - 1); J[:, k:k + 2] = np.eye(2); J[:, k + 2] = [-P[1], P[0]]
        return J
    for j in joints:
        kind, a, b, P = j[:4]
        D = blk(a, P) - blk(b, P)
        if kind == 'R':
            rows += [D[0], D[1]]
        else:
            u = np.array(j[4], float); n = np.array([-u[1], u[0]])
            rot = np.zeros(nq)
            if a > 0: rot[3 * (a - 1) + 2] += 1
            if b > 0: rot[3 * (b - 1) + 2] -= 1
            rows += [n @ D, rot]
    return nq - rank(np.array(rows))

# planar mechanisms: (bodies incl. ground, joints with geometry, Grubler joint list, known DOF)
MECH = {
    "four-bar": (4, [('R', 0, 1, (0, 0)), ('R', 1, 2, (0.3, 0.9)), ('R', 2, 3, (1.6, 1.1)), ('R', 3, 0, (2.0, 0))], 1),
    "slider-crank": (4, [('R', 0, 1, (0, 0)), ('R', 1, 2, (0.4, 0.5)), ('R', 2, 3, (1.8, 0)), ('P', 3, 0, (1.8, 0), (1, 0))], 1),
    "five-bar": (5, [('R', 0, 1, (0, 0)), ('R', 1, 2, (0.2, 1.0)), ('R', 2, 3, (1.1, 1.6)), ('R', 3, 4, (2.2, 1.0)), ('R', 4, 0, (2.4, 0))], 2),
    "triangle truss": (3, [('R', 0, 1, (0, 0)), ('R', 1, 2, (0.6, 1.0)), ('R', 2, 0, (1.2, 0))], 0),
    "3R serial arm": (4, [('R', 0, 1, (0, 0)), ('R', 1, 2, (1.0, 0.3)), ('R', 2, 3, (1.8, 0.6))], 3),
    "Watt six-bar": (6, [('R', 0, 1, (0, 0)), ('R', 1, 2, (0.3, 0.9)), ('R', 2, 3, (1.6, 1.1)), ('R', 3, 0, (2.0, 0)),
                               ('R', 2, 4, (0.9, 1.6)), ('R', 4, 5, (1.9, 2.1)), ('R', 5, 3, (2.3, 0.9))], 1),
}

def test_known_mechanisms():
    for name, (n, js, known) in MECH.items():
        g = grubler(n, [1] * len(js))
        r = mobility_from_geometry(n, js)
        print(f"{name:20s} Grubler {g:2d}  rank test {r:2d}  known {known}")
        assert g == known and r == known

def test_parallelogram_exception():
    # a parallelogram with a redundant middle bar: Grubler says 0, the special geometry still moves (1 DOF)
    js = [('R', 0, 1, (0, 0)), ('R', 1, 2, (0.5, 1.0)), ('R', 2, 3, (2.5, 1.0)), ('R', 3, 0, (2.0, 0)),
          ('R', 0, 4, (1.0, 0)), ('R', 4, 2, (1.5, 1.0))]
    g, r = grubler(5, [1] * 6), mobility_from_geometry(5, js)
    print(f"double parallelogram: Grubler {g}, rank test {r}")
    assert g == 0 and r == 1
    js[5] = ('R', 4, 2, (1.7, 1.0))            # break the parallel geometry: it locks
    assert mobility_from_geometry(5, js) == 0

def test_spatial():
    # Stewart platform: 14 bodies (ground, top, 6 x 2 leg parts), 6 U + 6 S + 6 P joints
    assert grubler(14, [2] * 6 + [3] * 6 + [1] * 6, planar=False) == 6
    # a 6R industrial arm
    assert grubler(7, [1] * 6, planar=False) == 6

test_known_mechanisms()
test_parallelogram_exception()
test_spatial()
print("PASS")
