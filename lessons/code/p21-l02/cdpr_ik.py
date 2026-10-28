import numpy as np

W, D, H, POLE = 7.0, 7.0, 3.0, 0.5
A = np.array([[-W/2, -D/2, H], [W/2, -D/2, H], [W/2, D/2, H], [-W/2, D/2, H]])

def ik(p):
    """cable lengths and unit vectors from the pivot towards each anchor"""
    v = A - p
    L = np.linalg.norm(v, axis=1)
    return L, v / L[:, None]

def jacobian(p):
    """dl/dp, 4 x 3: row i is -u_i"""
    _, u = ik(p)
    return -u

def fk_closed_form(L):
    """anchors at one height: three linear equations in x, y, then z from one sphere"""
    M = 2 * (A[0, :2] - A[1:, :2])
    b = L[1:]**2 - L[0]**2 - (A[1:]**2).sum(1) + (A[0]**2).sum()
    xy, *_ = np.linalg.lstsq(M, b, rcond=None)
    z = A[0, 2] - np.sqrt(L[0]**2 - ((xy - A[0, :2])**2).sum())
    return np.array([xy[0], xy[1], z])

def fk_gauss_newton(L, p0=(0.0, 0.0, 1.0), iters=20):
    p = np.array(p0, float)
    for _ in range(iters):
        Lp, _ = ik(p)
        r = Lp - L
        step, *_ = np.linalg.lstsq(jacobian(p), -r, rcond=None)
        p += step
        if np.linalg.norm(step) < 1e-12:
            break
    return p, np.linalg.norm(ik(p)[0] - L)

gripper = np.array([1.0, -0.5, 0.4])
p = gripper + [0, 0, POLE]
L, u = ik(p)
print("lengths (m):", np.round(L, 3))
assert np.allclose(L, [5.802, 4.434, 5.163, 6.377], atol=5e-4)

# Jacobian against central finite differences
J, eps = jacobian(p), 1e-6
Jfd = np.column_stack([(ik(p + eps * e)[0] - ik(p - eps * e)[0]) / (2 * eps) for e in np.eye(3)])
assert np.allclose(J, Jfd, atol=1e-8)
print("winch speeds for 0.4 m/s in +x:", np.round(J @ [0.4, 0, 0], 3))
print("winch speeds for 0.4 m/s up:   ", np.round(J @ [0, 0, 0.4], 3))
assert np.all(np.abs(J @ [0.4, 0, 0]) <= 0.4 + 1e-12)      # |u_i . v| <= |v|

# forward kinematics both ways, at many random poses
rng = np.random.default_rng(1)
for _ in range(500):
    q = np.array([rng.uniform(-3.3, 3.3), rng.uniform(-3.3, 3.3), rng.uniform(0.3, 2.8)])
    Lq, _ = ik(q)
    assert np.linalg.norm(fk_closed_form(Lq) - q) < 1e-9
    pg, res = fk_gauss_newton(Lq)
    assert np.linalg.norm(pg - q) < 1e-9 and res < 1e-9
print("FK(IK(p)) = p at 500 random poses, closed form and Gauss-Newton")

# a line that has slipped by 3 cm no longer agrees with the other three
bad = L.copy(); bad[2] += 0.03
_, res = fk_gauss_newton(bad, p0=p)
print(f"residual with one line 3 cm long: {res * 1000:.1f} mm")
assert res > 0.005
print("PASS")
