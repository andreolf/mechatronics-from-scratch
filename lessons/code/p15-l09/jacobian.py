import numpy as np
from dh_fk import fk_dh                    # lesson 03's arm, saved next to this file

def geometric_jacobian(q):
    """6 x n: linear rows z_{i-1} x (p - p_{i-1}), angular rows z_{i-1} (all joints revolute)"""
    T, frames = fk_dh(q); p = T[:3, 3]; J = np.zeros((6, len(q)))
    for i in range(len(q)):
        z, pi = frames[i][:3, 2], frames[i][:3, 3]
        J[:3, i] = np.cross(z, p - pi); J[3:, i] = z
    return J

def numeric_jacobian(q, h=1e-6):
    """central differences of position, and of orientation via R(q+h) R(q-h)^T"""
    J = np.zeros((6, len(q)))
    for i in range(len(q)):
        dq = np.zeros(len(q)); dq[i] = h
        Tp, _ = fk_dh(q + dq); Tm, _ = fk_dh(q - dq)
        J[:3, i] = (Tp[:3, 3] - Tm[:3, 3]) / (2 * h)
        A = Tp[:3, :3] @ Tm[:3, :3].T; W = (A - A.T) / (4 * h)         # skew part ~ skew(omega)
        J[3:, i] = [W[2, 1], W[0, 2], W[1, 0]]
    return J

def manipulability(Jv):
    return np.sqrt(max(np.linalg.det(Jv @ Jv.T), 0.0))

def test_matches_numeric():
    rng = np.random.default_rng(12)
    for q in rng.uniform(-np.pi, np.pi, (200, 3)):
        assert np.allclose(geometric_jacobian(q), numeric_jacobian(q), atol=1e-7)

def test_worked_example():
    q = np.radians([30, 45, -60]); J = geometric_jacobian(q); Jv = J[:3]
    np.set_printoptions(precision=4, suppress=True)
    print("linear Jacobian at (30, 45, -60) deg:\n", Jv)
    s = np.linalg.svd(Jv, compute_uv=False)
    print("singular values (m/s per rad/s):", s, " manipulability", round(manipulability(Jv), 4))
    v = Jv @ np.array([0.0, 0.5, 0.0])
    print("shoulder at 0.5 rad/s moves the tool at", v, "m/s")
    assert np.allclose(Jv[:, 0], np.cross([0, 0, 1], fk_dh(q)[0][:3, 3]))       # base yaw: z x p
    assert abs(manipulability(Jv) - np.prod(s)) < 1e-12

def test_singular_poses():
    # elbow straight (q3 = 0) or tool over the base axis (r = 0) both lose rank
    assert np.linalg.matrix_rank(geometric_jacobian(np.radians([10, 30, 0]))[:3], tol=1e-9) == 2
    q = np.array([0.3, np.radians(90), 0.0])          # arm straight up: tool on the base axis, and elbow straight
    assert manipulability(geometric_jacobian(q)[:3]) < 1e-9
    assert manipulability(geometric_jacobian(np.radians([30, 45, -60]))[:3]) > 0.05

test_matches_numeric()
test_worked_example()
test_singular_poses()
print("PASS")
