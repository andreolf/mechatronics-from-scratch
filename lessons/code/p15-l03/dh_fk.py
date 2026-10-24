import numpy as np

def dh(theta, d, a, alpha):
    """standard DH link transform: Rot_z(theta) Trans_z(d) Trans_x(a) Rot_x(alpha)"""
    ct, st, ca, sa = np.cos(theta), np.sin(theta), np.cos(alpha), np.sin(alpha)
    return np.array([[ct, -st * ca,  st * sa, a * ct],
                     [st,  ct * ca, -ct * sa, a * st],
                     [0,        sa,       ca,      d],
                     [0,         0,        0,      1]])

# illustrative desktop arm: base yaw, shoulder, elbow
D1, A2, A3 = 0.4, 0.5, 0.4
DH_TABLE = [  # (theta offset, d, a, alpha); theta_i = q_i + offset
    (0.0, D1, 0.0, np.pi / 2),
    (0.0, 0.0, A2, 0.0),
    (0.0, 0.0, A3, 0.0),
]

def fk_dh(q, table=DH_TABLE):
    T = np.eye(4); frames = [T]
    for qi, (off, d, a, al) in zip(q, table):
        T = T @ dh(qi + off, d, a, al); frames.append(T)
    return T, frames

# an independent chain of elementary motions in the base frame
def Rz(t): c, s = np.cos(t), np.sin(t); return np.array([[c, -s, 0, 0], [s, c, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]])
def Ry(t): c, s = np.cos(t), np.sin(t); return np.array([[c, 0, s, 0], [0, 1, 0, 0], [-s, 0, c, 0], [0, 0, 0, 1]])
def Tr(x, y, z): T = np.eye(4); T[:3, 3] = [x, y, z]; return T

def fk_chain(q):
    q1, q2, q3 = q   # yaw about z, then pitch up by q2 and q3 (a rotation of -q about y lifts the x axis)
    return Rz(q1) @ Tr(0, 0, D1) @ Ry(-q2) @ Tr(A2, 0, 0) @ Ry(-q3) @ Tr(A3, 0, 0)

def fk_closed(q):
    q1, q2, q3 = q
    r = A2 * np.cos(q2) + A3 * np.cos(q2 + q3)
    return np.array([r * np.cos(q1), r * np.sin(q1), D1 + A2 * np.sin(q2) + A3 * np.sin(q2 + q3)])

def test_matches_chain():
    rng = np.random.default_rng(2)
    for q in rng.uniform(-np.pi, np.pi, (300, 3)):
        T, _ = fk_dh(q); Tc = fk_chain(q)
        assert np.allclose(T[:3, 3], Tc[:3, 3]) and np.allclose(T[:3, 3], fk_closed(q))
        assert np.allclose(T[:3, 0], Tc[:3, 0])                    # both x axes point along the last link
        assert np.allclose(T[:3, :3] @ T[:3, :3].T, np.eye(3))     # a proper rotation
        assert abs(np.linalg.det(T[:3, :3]) - 1) < 1e-12

def test_worked_example():
    q = np.radians([30, 45, -60])
    T, frames = fk_dh(q)
    print("tool position at (30, 45, -60) deg:", np.round(T[:3, 3], 4))
    print("joint 2 axis z1 in the base frame:", np.round(frames[1][:3, 2], 4))
    assert np.allclose(T[:3, 3], [0.64079, 0.36996, 0.65003], atol=1e-5)
    T0, _ = fk_dh([0, 0, 0])
    assert np.allclose(T0[:3, 3], [A2 + A3, 0, D1])

test_matches_chain()
test_worked_example()
print("PASS")
