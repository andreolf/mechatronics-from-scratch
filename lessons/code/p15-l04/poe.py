import numpy as np
from scipy.linalg import expm
from dh_fk import fk_dh            # lesson 03's DH forward kinematics, saved next to this file

def skew(w):
    return np.array([[0, -w[2], w[1]], [w[2], 0, -w[0]], [-w[1], w[0], 0]])

def se3(S):
    """6-vector screw (omega, v) -> 4x4 matrix [S]"""
    M = np.zeros((4, 4)); M[:3, :3] = skew(S[:3]); M[:3, 3] = S[3:]; return M

def exp_screw(S, th):
    """closed form of e^([S] theta) for a unit rotation axis (Rodrigues) or a pure translation"""
    w, v = np.asarray(S[:3], float), np.asarray(S[3:], float)
    T = np.eye(4)
    if np.linalg.norm(w) < 1e-12:
        T[:3, 3] = v * th; return T
    W = skew(w)
    T[:3, :3] = np.eye(3) + np.sin(th) * W + (1 - np.cos(th)) * W @ W
    T[:3, 3] = (np.eye(3) * th + (1 - np.cos(th)) * W + (th - np.sin(th)) * W @ W) @ v
    return T

def screw_revolute(axis, point):
    w = np.asarray(axis, float); return np.concatenate([w, -np.cross(w, point)])

def adjoint(T):
    R, p = T[:3, :3], T[:3, 3]; A = np.zeros((6, 6))
    A[:3, :3] = R; A[3:, 3:] = R; A[3:, :3] = skew(p) @ R; return A

# the lesson 03 arm at q = 0: stretched along x at shoulder height 0.4 m
S_LIST = [screw_revolute([0, 0, 1], [0, 0, 0]),        # base yaw about the vertical axis
          screw_revolute([0, -1, 0], [0, 0, 0.4]),     # shoulder: axis -y (positive lifts the arm)
          screw_revolute([0, -1, 0], [0.5, 0, 0.4])]   # elbow
M = np.array([[1, 0, 0, 0.9], [0, 0, -1, 0], [0, 1, 0, 0.4], [0, 0, 0, 1.0]])   # tool frame at home

def fk_space(q, S=S_LIST, M=M):
    T = np.eye(4)
    for Si, qi in zip(S, q): T = T @ exp_screw(Si, qi)
    return T @ M

def fk_body(q, S=S_LIST, M=M):
    B = [np.linalg.inv(adjoint(M)) @ Si for Si in S]     # the same axes seen from the tool frame
    T = M.copy()
    for Bi, qi in zip(B, q): T = T @ exp_screw(Bi, qi)
    return T

def test_closed_form_exponential():
    rng = np.random.default_rng(4)
    for _ in range(50):
        w = rng.normal(size=3); w /= np.linalg.norm(w); S = np.concatenate([w, rng.normal(size=3)]); th = rng.uniform(-3, 3)
        assert np.allclose(exp_screw(S, th), expm(se3(S) * th), atol=1e-10)

def test_agrees_with_dh():
    rng = np.random.default_rng(5)
    for q in rng.uniform(-np.pi, np.pi, (300, 3)):
        Tdh, _ = fk_dh(q)
        assert np.allclose(fk_space(q), Tdh) and np.allclose(fk_body(q), Tdh)
    q = np.radians([30, 45, -60])
    print("PoE tool position:", np.round(fk_space(q)[:3, 3], 4))
    print("screw axes S_i (omega, v):"); [print("  ", np.round(s, 3)) for s in S_LIST]

test_closed_form_exponential()
test_agrees_with_dh()
print("PASS")
