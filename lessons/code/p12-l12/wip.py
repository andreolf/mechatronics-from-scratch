import numpy as np

r, mw, mb, L, g = 0.04, 0.3, 1.0, 0.08, 9.81
Iw, Ib = 0.5 * mw * r ** 2, mb * 0.16 ** 2 / 12
M11, M22 = mw + mb + Iw / r ** 2, Ib + mb * L ** 2

def f(s, u):
    x, xd, th, thd = s; tau = u[0]
    Mm = np.array([[M11, mb * L * np.cos(th)], [mb * L * np.cos(th), M22]])
    rhs = np.array([tau / r + mb * L * np.sin(th) * thd ** 2, mb * g * L * np.sin(th) - tau])
    xdd, thdd = np.linalg.solve(Mm, rhs)
    return np.array([xd, xdd, thd, thdd])

def jacobians(f, x0, u0):
    def jac(g_, z):
        cols = []
        for j in range(len(z)):
            e = np.zeros(len(z)); e[j] = 1e-6
            cols.append((g_(z + e) - g_(z - e)) / 2e-6)
        return np.column_stack(cols)
    return jac(lambda x: f(x, u0), x0), jac(lambda u: f(x0, u), u0)

def rk4(s, u, dt, n):
    out = [s]
    for _ in range(n):
        k1 = f(s, u); k2 = f(s + dt / 2 * k1, u); k3 = f(s + dt / 2 * k2, u); k4 = f(s + dt * k3, u)
        s = s + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4); out.append(s)
    return np.array(out)

p_hand = np.sqrt(mb * g * L * M11 / (M11 * M22 - (mb * L) ** 2))

def test_linear_unstable_expected_pole():
    A, B = jacobians(f, np.zeros(4), np.zeros(1))
    ev = np.linalg.eigvals(A)
    print("eigenvalues:", np.round(np.sort_complex(ev), 4), f"; hand formula +-{p_hand:.4f}")
    assert np.max(ev.real) > 0                                  # unstable
    assert abs(np.max(ev.real) - p_hand) < 1e-5                 # exactly the predicted pole
    assert abs(np.min(ev.real) + p_hand) < 1e-5
    assert np.sum(np.abs(ev) < 1e-6) == 2                       # two integrators: position, and velocity drift
    delta = M11 * M22 - (mb * L) ** 2
    assert abs(A[3, 2] - p_hand ** 2) < 1e-4 and abs(B[3, 0] + (M11 + mb * L / r) / delta) < 1e-3
    print(f"A[3,2] = {A[3, 2]:.1f}, B[3] = {B[3, 0]:.0f}, wheels-held pole {np.sqrt(mb * g * L / M22):.2f}")

def test_nonlinear_falls_at_linear_rate():
    traj = rk4(np.array([0, 0, 1e-3, 0]), np.zeros(1), 1e-4, 6000)
    th = traj[:, 2]
    k = np.argmax(th > 0.05)
    t = k * 1e-4
    t_lin = np.arccosh(50) / p_hand
    print(f"tilt 1 mrad -> 0.05 rad in {t * 1000:.0f} ms (linear {t_lin * 1000:.0f} ms)")
    assert abs(t - t_lin) < 0.01

def test_torque_tips_body_backwards():
    traj = rk4(np.zeros(4), np.array([0.05]), 1e-4, 300)
    assert traj[-1, 1] > 0 and traj[-1, 2] < 0                 # wheels forward, body tilts back

def test_energy_with_no_torque():
    traj = rk4(np.array([0, 0, 0.2, 0]), np.zeros(1), 1e-4, 4000)
    E = [0.5 * M11 * s[1] ** 2 + mb * L * np.cos(s[2]) * s[1] * s[3] + 0.5 * M22 * s[3] ** 2 + mb * g * L * np.cos(s[2]) for s in traj]
    assert np.ptp(E) / E[0] < 1e-6

test_linear_unstable_expected_pole()
test_nonlinear_falls_at_linear_rate()
test_torque_tips_body_backwards()
test_energy_with_no_torque()
print("PASS")
