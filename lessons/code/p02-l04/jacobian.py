import math
import numpy as np

L1, L2 = 0.3, 0.2

def fk(q, cos=np.cos, sin=np.sin):
    return np.array([L1 * cos(q[0]) + L2 * cos(q[0] + q[1]),
                     L1 * sin(q[0]) + L2 * sin(q[0] + q[1])])

def jac_analytic(q):
    s1, c1 = math.sin(q[0]), math.cos(q[0]); s12, c12 = math.sin(q[0] + q[1]), math.cos(q[0] + q[1])
    return np.array([[-L1 * s1 - L2 * s12, -L2 * s12], [L1 * c1 + L2 * c12, L2 * c12]])

def jac_central(f, x, h=1e-6):
    x = np.asarray(x, float); cols = []
    for j in range(len(x)):
        e = np.zeros_like(x); e[j] = h
        cols.append((f(x + e) - f(x - e)) / (2 * h))
    return np.column_stack(cols)

def jac_complex(f, x, h=1e-20):
    x = np.asarray(x, complex); cols = []
    for j in range(len(x)):
        e = np.zeros_like(x); e[j] = 1j * h
        cols.append(np.imag(f(x + e)) / h)
    return np.column_stack(cols)

if __name__ == "__main__":
    q = np.radians([30, 45])
    J = jac_analytic(q)
    assert np.allclose(J, [[-0.3432, -0.1932], [0.3116, 0.0518]], atol=1e-4)
    assert abs(np.linalg.det(J) - L1 * L2 * math.sin(q[1])) < 1e-15
    rng = np.random.default_rng(13)
    worst_c, worst_z = 0, 0
    for _ in range(500):
        q = rng.uniform(-math.pi, math.pi, 2)
        Ja = jac_analytic(q)
        worst_c = max(worst_c, abs(jac_central(fk, q) - Ja).max())
        worst_z = max(worst_z, abs(jac_complex(fk, q) - Ja).max())
    print(f"max error: central {worst_c:.1e}, complex step {worst_z:.1e}")
    assert worst_c < 1e-8 and worst_z < 1e-15
