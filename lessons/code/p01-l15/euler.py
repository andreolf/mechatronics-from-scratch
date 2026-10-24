import math
import numpy as np

def rotx(t): c, s = math.cos(t), math.sin(t); return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])
def roty(t): c, s = math.cos(t), math.sin(t); return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])
def rotz(t): c, s = math.cos(t), math.sin(t); return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])

def euler_zyx_to_R(yaw, pitch, roll):
    return rotz(yaw) @ roty(pitch) @ rotx(roll)

def R_to_euler_zyx(R, eps=1e-9):
    """Returns (yaw, pitch, roll, singular). At the singularity yaw is set to 0."""
    r31 = max(-1.0, min(1.0, R[2, 0]))
    pitch = -math.asin(r31)
    if abs(abs(r31) - 1) > eps:
        return math.atan2(R[1, 0], R[0, 0]), pitch, math.atan2(R[2, 1], R[2, 2]), False
    if r31 < 0:   # pitch = +90°
        return 0.0, math.pi / 2, math.atan2(R[0, 1], R[1, 1]), True
    return 0.0, -math.pi / 2, math.atan2(-R[0, 1], R[1, 1]), True

if __name__ == "__main__":
    d = math.radians
    y, p, r, sing = R_to_euler_zyx(euler_zyx_to_R(d(30), d(20), d(10)))
    assert not sing and np.allclose([y, p, r], [d(30), d(20), d(10)])
    rng = np.random.default_rng(9)
    for _ in range(10000):
        a = rng.uniform([-math.pi, -1.5, -math.pi], [math.pi, 1.5, math.pi])
        R = euler_zyx_to_R(*a)
        b = R_to_euler_zyx(R)
        assert not b[3] and np.allclose(b[:3], a, atol=1e-9)
    for pitch in (math.pi / 2, -math.pi / 2):
        R = euler_zyx_to_R(d(40), pitch, d(-25))
        y, p, r, sing = R_to_euler_zyx(R)
        assert sing and np.allclose(euler_zyx_to_R(y, p, r), R, atol=1e-12)
    print("round trip < 1e-9 away from the singularity; ±90° pitch detected and handled")
