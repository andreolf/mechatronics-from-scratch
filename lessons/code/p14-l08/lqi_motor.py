import numpy as np
from scipy.linalg import solve_continuous_are

R_, L_, k_, J_, b_ = 1.2, 0.002, 0.05, 2e-4, 2e-5           # the lab motor
def motor(R=R_, J=J_):
    """x = [i, w], u = V, load torque enters the speed equation"""
    A = np.array([[-R / L_, -k_ / L_], [k_ / J, -b_ / J]]); B = np.array([[1 / L_], [0.0]])
    E = np.array([0.0, -1 / J]); C = np.array([[0.0, 1.0]])
    return A, B, C, E

def lqi(A, B, C, Q, R):
    """augment with z' = r - y and solve one LQR for [x, z]"""
    n = len(A)
    Aa = np.block([[A, np.zeros((n, 1))], [-C, np.zeros((1, 1))]]); Ba = np.vstack([B, [[0.0]]])
    P = solve_continuous_are(Aa, Ba, Q, R); K = np.linalg.solve(R, Ba.T @ P)[0]
    return K[:n], K[n]

def lqr_with_prefilter(A, B, C, Q, R):
    P = solve_continuous_are(A, B, Q, R); K = np.linalg.solve(R, B.T @ P)[0]
    Nbar = 1.0 / (C @ np.linalg.solve(-(A - B @ K[None, :]), B)).item()   # unit DC gain from r to y
    return K, Nbar

Q = np.diag([0.0, 1e-3, 50.0]); Rw = np.array([[1e-3]])

def simulate(ctrl, plant=None, r=200.0, load=0.05, t_load=0.3, T=0.8, dt=2e-5):
    A, B, C, E = plant or motor()
    x = np.zeros(2); z = 0.0; ys = []
    for n in range(int(T / dt)):
        t = n * dt; y = x[1]
        u = ctrl(x, z, r)
        tl = load if t >= t_load else 0.0
        f = lambda x: A @ x + B[:, 0] * u + E * tl
        k1 = f(x); k2 = f(x + dt / 2 * k1); k3 = f(x + dt / 2 * k2); k4 = f(x + dt * k3)
        x = x + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4); z += dt * (r - y); ys.append(x[1])
    return np.array(ys)

def test_lqi_zero_steady_error():
    A, B, C, _ = motor()
    Kx, kz = lqi(A, B, C, Q, Rw)
    Klq, Nbar = lqr_with_prefilter(A, B, C, Q[:2, :2], Rw)       # same state weights, no integral
    y_i = simulate(lambda x, z, r: -Kx @ x - kz * z)
    y_p = simulate(lambda x, z, r: -Klq @ x + Nbar * r)
    print(f"LQI gains Kx = {np.round(Kx, 4)}, integral gain -kz = {-kz:.2f} V per rad")
    print(f"before the load: LQI {y_i[14999]:.3f}, LQR + prefilter {y_p[14999]:.3f} rad/s")
    print(f"after a 0.05 N·m load: LQI {y_i[-1]:.4f} rad/s, LQR + prefilter {y_p[-1]:.2f} rad/s (target 200)")
    assert abs(y_i[-1] - 200) < 1e-3 and abs(y_p[-1] - 200) > 1.0

def test_robust_to_model_error():
    A, B, C, _ = motor(); Kx, kz = lqi(A, B, C, Q, Rw)
    for name, plant in (("R +30 %", motor(R=1.56)), ("J x2", motor(J=4e-4))):
        y = simulate(lambda x, z, r: -Kx @ x - kz * z, plant=plant, T=1.2)
        print(f"LQI on the wrong plant ({name}): final speed {y[-1]:.4f} rad/s")
        assert abs(y[-1] - 200) < 1e-2

def test_augmented_poles_stable():
    A, B, C, _ = motor(); Kx, kz = lqi(A, B, C, Q, Rw)
    Aa = np.block([[A - B @ Kx[None, :], -B * kz], [-C, np.zeros((1, 1))]])
    lam = np.linalg.eigvals(Aa)
    print("closed-loop poles:", np.round(np.sort_complex(lam), 1))
    assert np.all(lam.real < 0)

test_lqi_zero_steady_error()
test_robust_to_model_error()
test_augmented_poles_stable()
print("PASS")
