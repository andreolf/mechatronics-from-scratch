import math
import numpy as np

def qmul(a, b):
    w1, x1, y1, z1 = a; w2, x2, y2, z2 = b
    return np.array([w1*w2 - x1*x2 - y1*y2 - z1*z2,
                     w1*x2 + x1*w2 + y1*z2 - z1*y2,
                     w1*y2 - x1*z2 + y1*w2 + z1*x2,
                     w1*z2 + x1*y2 - y1*x2 + z1*w2])

def qnormalise(q): return np.asarray(q, float) / np.linalg.norm(q)

def from_axis_angle(u, theta):
    u = np.asarray(u, float) / np.linalg.norm(u)
    return np.concatenate([[math.cos(theta / 2)], math.sin(theta / 2) * u])

def to_matrix(q):
    w, x, y, z = q
    return np.array([[1 - 2*(y*y + z*z), 2*(x*y - w*z), 2*(x*z + w*y)],
                     [2*(x*y + w*z), 1 - 2*(x*x + z*z), 2*(y*z - w*x)],
                     [2*(x*z - w*y), 2*(y*z + w*x), 1 - 2*(x*x + y*y)]])

def integrate_gyro(q, omega, h):
    n = np.linalg.norm(omega)
    if n < 1e-12: return q
    dq = np.concatenate([[math.cos(n * h / 2)], math.sin(n * h / 2) * np.asarray(omega) / n])
    return qnormalise(qmul(q, dq))

def slerp(q0, q1, t):
    d = float(np.dot(q0, q1))
    if d < 0: q1, d = -np.asarray(q1), -d
    if d > 0.9995: return qnormalise((1 - t) * np.asarray(q0) + t * np.asarray(q1))
    om = math.acos(d)
    return (math.sin((1 - t) * om) * np.asarray(q0) + math.sin(t * om) * np.asarray(q1)) / math.sin(om)

def rodrigues(u, th):
    u = np.asarray(u, float) / np.linalg.norm(u)
    K = np.array([[0, -u[2], u[1]], [u[2], 0, -u[0]], [-u[1], u[0], 0]])
    return np.eye(3) + math.sin(th) * K + (1 - math.cos(th)) * K @ K

if __name__ == "__main__":
    q = from_axis_angle([0, 0, 1], math.pi / 2)
    assert np.allclose(q, [2 ** -.5, 0, 0, 2 ** -.5]) and np.allclose(to_matrix(q) @ [1, 0, 0], [0, 1, 0])
    assert np.allclose(qmul(q, q), [0, 0, 0, 1])
    rng = np.random.default_rng(10)
    for _ in range(500):
        u, th = rng.standard_normal(3), rng.uniform(-math.pi, math.pi)
        assert np.allclose(to_matrix(from_axis_angle(u, th)), rodrigues(u, th), atol=1e-12)
    g = np.array([0.0, 0.0, 1.0]); qi = np.array([1.0, 0, 0, 0]); h = 1e-3
    for _ in range(round((math.pi / 2) / h)):
        qi = integrate_gyro(qi, g, h)
    assert np.allclose(qi, from_axis_angle(g, round((math.pi / 2) / h) * h), atol=1e-12)
    w_axis = np.array([0.3, -0.5, 0.8]); qi = np.array([1.0, 0, 0, 0])
    for _ in range(2000): qi = integrate_gyro(qi, w_axis, h)
    assert np.allclose(to_matrix(qi), rodrigues(w_axis, np.linalg.norm(w_axis) * 2.0), atol=1e-10)
    assert abs(slerp([1, 0, 0, 0], q, 0.5)[0] - math.cos(math.pi / 8)) < 1e-12
    print("quaternion matrix matches Rodrigues; gyro integration matches the analytic rotation")
