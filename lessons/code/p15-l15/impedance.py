import numpy as np

L1, L2, M1, M2, G, B = 1.0, 0.8, 1.5, 1.0, 9.81, 0.6        # the arm lab's arm and joint damping
lc1, lc2, I1, I2 = L1 / 2, L2 / 2, M1 * L1 ** 2 / 12, M2 * L2 ** 2 / 12

def fk(q): return np.array([L1 * np.cos(q[0]) + L2 * np.cos(q[0] + q[1]), L1 * np.sin(q[0]) + L2 * np.sin(q[0] + q[1])])
def jac(q):
    s1, c1, s12, c12 = np.sin(q[0]), np.cos(q[0]), np.sin(q[0] + q[1]), np.cos(q[0] + q[1])
    return np.array([[-L1 * s1 - L2 * s12, -L2 * s12], [L1 * c1 + L2 * c12, L2 * c12]])
def dyn(q, qd):
    c2, s2 = np.cos(q[1]), np.sin(q[1])
    M = np.array([[M1 * lc1 ** 2 + I1 + M2 * (L1 ** 2 + lc2 ** 2 + 2 * L1 * lc2 * c2) + I2, M2 * (lc2 ** 2 + L1 * lc2 * c2) + I2],
                  [M2 * (lc2 ** 2 + L1 * lc2 * c2) + I2, M2 * lc2 ** 2 + I2]])
    h = M2 * L1 * lc2 * s2
    c = np.array([-h * (2 * qd[0] * qd[1] + qd[1] ** 2), h * qd[0] ** 2]) + B * qd
    g = np.array([(M1 * lc1 + M2 * L1) * G * np.cos(q[0]) + M2 * lc2 * G * np.cos(q[0] + q[1]), M2 * lc2 * G * np.cos(q[0] + q[1])])
    return M, c, g

def impedance(q, qd, x_d, K, D):
    """Cartesian spring and damper at the tool, plus gravity compensation: tau = J^T (K (x_d - x) - D x_dot) + g"""
    J = jac(q); x, xd = fk(q), J @ qd
    return J.T @ (K @ (x_d - x) - D @ xd) + dyn(q, qd)[2]

def simulate(K, D, push, T=4.0, dt=5e-4, q0=np.radians([60, -70])):
    """push(t) is an external force on the tool; it enters the dynamics as J^T F"""
    q, qd = q0.copy(), np.zeros(2); x_d = fk(q0); xs = []
    def f(q, qd, t):
        tau = impedance(q, qd, x_d, K, D) + jac(q).T @ push(t)
        M, c, g = dyn(q, qd); return qd, np.linalg.solve(M, tau - c - g)
    for i in range(int(T / dt)):
        t = i * dt
        a1, b1 = f(q, qd, t); a2, b2 = f(q + dt / 2 * a1, qd + dt / 2 * b1, t + dt / 2)
        a3, b3 = f(q + dt / 2 * a2, qd + dt / 2 * b2, t + dt / 2); a4, b4 = f(q + dt * a3, qd + dt * b3, t + dt)
        q = q + dt / 6 * (a1 + 2 * a2 + 2 * a3 + a4); qd = qd + dt / 6 * (b1 + 2 * b2 + 2 * b3 + b4)
        xs.append(fk(q) - x_d)
    return np.array(xs), dt

K = np.diag([300.0, 800.0])          # N/m: soft sideways, stiff vertically
D = np.diag([40.0, 60.0])            # N s/m

def test_stiffness_matches_design():
    for F in (np.array([10.0, 0.0]), np.array([0.0, -10.0]), np.array([6.0, 8.0])):
        xs, dt = simulate(K, D, lambda t, F=F: F if 0.5 <= t < 2.5 else np.zeros(2))
        held = xs[int(2.4 / dt)]
        expect = np.linalg.solve(K, F)
        k_eff = F @ F / (F @ held)
        print(f"push {F} N: deflection {np.round(held * 1000, 2)} mm (design {np.round(expect * 1000, 2)}), effective stiffness along the push {k_eff:.1f} N/m")
        assert np.allclose(held, expect, atol=2e-4)
        assert np.abs(xs[-1]).max() < 1e-3          # springs back after release

def test_settles_like_a_damped_spring():
    xs, dt = simulate(K, D, lambda t: np.array([10.0, 0.0]) if 0.5 <= t < 2.5 else np.zeros(2))
    over = max(0.0, -xs[int(2.5 / dt):, 0].min() / xs[int(2.4 / dt), 0])
    print(f"after release the tool overshoots by {over * 100:.1f} % in x")
    assert over < 0.2

test_stiffness_matches_design()
test_settles_like_a_damped_spring()
print("PASS")
