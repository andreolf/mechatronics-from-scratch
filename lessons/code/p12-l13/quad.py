import numpy as np

m, l, g, kq = 1.0, 0.22, 9.81, 0.016
I = np.diag([0.012, 0.012, 0.022]); Iinv = np.linalg.inv(I)
arms = np.array([[l, 0, 0], [0, l, 0], [-l, 0, 0], [0, -l, 0]])
spin = np.array([1, -1, 1, -1])

def mixer_from_geometry():
    Mx = np.zeros((4, 4))
    for i in range(4):
        tau = np.cross(arms[i], [0, 0, 1.0]) + spin[i] * kq * np.array([0, 0, 1.0])
        Mx[:, i] = [1.0, *tau]
    return Mx

MIX = mixer_from_geometry()

def qmul(a, b):
    w1, x1, y1, z1 = a; w2, x2, y2, z2 = b
    return np.array([w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2, w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2,
                     w1 * y2 - x1 * z2 + y1 * w2 + z1 * x2, w1 * z2 + x1 * y2 - y1 * x2 + z1 * w2])

def rot(q):
    w, x, y, z = q
    return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - w * z), 2 * (x * z + w * y)],
                     [2 * (x * y + w * z), 1 - 2 * (x * x + z * z), 2 * (y * z - w * x)],
                     [2 * (x * z - w * y), 2 * (y * z + w * x), 1 - 2 * (x * x + y * y)]])

def f(s, thrusts, grav=True):
    p, v, q, w = s[:3], s[3:6], s[6:10], s[10:]
    wrench = MIX @ thrusts
    acc = rot(q) @ np.array([0, 0, wrench[0]]) / m - (np.array([0, 0, g]) if grav else 0)
    wd = Iinv @ (wrench[1:] - np.cross(w, I @ w))
    qd = 0.5 * qmul(q, np.array([0, *w]))
    return np.concatenate([v, acc, qd, wd])

def sim(s, thrusts, dt, n, grav=True):
    out = [s]
    for _ in range(n):
        k1 = f(s, thrusts, grav); k2 = f(s + dt / 2 * k1, thrusts, grav)
        k3 = f(s + dt / 2 * k2, thrusts, grav); k4 = f(s + dt * k3, thrusts, grav)
        s = s + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4); s[6:10] /= np.linalg.norm(s[6:10]); out.append(s)
    return np.array(out)

s0 = np.concatenate([np.zeros(3), np.zeros(3), [1, 0, 0, 0], np.zeros(3)])

def test_mixer():
    hand = np.array([[1, 1, 1, 1], [0, l, 0, -l], [-l, 0, l, 0], [kq, -kq, kq, -kq]])
    assert np.allclose(MIX, hand)
    want = np.array([9.81, 0.01, -0.02, 0.003])
    assert np.allclose(MIX @ np.linalg.solve(MIX, want), want)

def test_hover_thrust_is_mg():
    Th = np.linalg.solve(MIX, [m * g, 0, 0, 0])
    assert np.allclose(Th, m * g / 4) and abs(Th.sum() - m * g) < 1e-12
    traj = sim(s0.copy(), Th, 2e-3, 2500)
    print(f"hover thrust {Th.sum():.4f} N = mg; 5 s later the drone has moved {np.linalg.norm(traj[-1, :3]):.1e} m")
    assert np.linalg.norm(traj[-1, :3]) < 1e-9
    traj = sim(s0.copy(), Th * 1.01, 2e-3, 500)       # 1 % more thrust climbs at 0.01 g
    assert abs(traj[-1, 2] - 0.5 * 0.01 * g * 1.0 ** 2) < 1e-6

def test_imbalance_drift():
    Th = np.full(4, m * g / 4); Th[2] += 0.01
    traj = sim(s0.copy(), Th, 1e-3, 2000)
    alpha = l * 0.01 / I[1, 1]
    for t in (1.0, 2.0):
        k = int(t / 1e-3)
        x_pred = g * alpha * t ** 4 / 24
        print(f"t = {t:.0f} s: drift {traj[k, 0] * 100:6.2f} cm (small-angle prediction {x_pred * 100:6.2f} cm)")
        assert abs(traj[k, 0] - x_pred) / x_pred < 0.03

def test_torque_free_rotation():
    s = s0.copy(); s[10:] = [3.0, 0.2, 1.0]                 # tumbling, no gravity, thrusts zero
    traj = sim(s, np.zeros(4), 1e-3, 5000, grav=False)
    Lw = np.array([rot(x[6:10]) @ (I @ x[10:]) for x in traj])
    E = np.array([0.5 * x[10:] @ I @ x[10:] for x in traj])
    print(f"torque-free tumble: angular momentum drift {np.max(np.linalg.norm(Lw - Lw[0], axis=1)):.1e}, energy drift {np.ptp(E):.1e}")
    assert np.max(np.linalg.norm(Lw - Lw[0], axis=1)) < 1e-8 and np.ptp(E) < 1e-8

test_mixer()
test_hover_thrust_is_mg()
test_imbalance_drift()
test_torque_free_rotation()
print("PASS")
