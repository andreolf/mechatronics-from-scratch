import numpy as np

# the arm lab's model (lesson 13), with an optional unknown payload at the tool and the lab's joint damping
L1, L2, M1, M2, G, B = 1.0, 0.8, 1.5, 1.0, 9.81, 0.6
def model(q, qd, payload=0.0):
    """M, C q_dot + damping, g for the 2-link arm with a point payload at the tool"""
    lc1, lc2, I1, I2 = L1 / 2, L2 / 2, M1 * L1 ** 2 / 12, M2 * L2 ** 2 / 12
    m2, I2c = M2 + payload, I2 + M2 * lc2 ** 2 + payload * L2 ** 2      # forearm + payload about the elbow
    mc2 = M2 * lc2 + payload * L2                                       # first moment of the forearm about the elbow
    c2, s2 = np.cos(q[1]), np.sin(q[1])
    M11 = M1 * lc1 ** 2 + I1 + m2 * L1 ** 2 + I2c + 2 * L1 * mc2 * c2
    M12 = I2c + L1 * mc2 * c2
    Mm = np.array([[M11, M12], [M12, I2c]])
    h = L1 * mc2 * s2
    c = np.array([-h * (2 * qd[0] * qd[1] + qd[1] ** 2), h * qd[0] ** 2]) + B * qd
    g = np.array([(M1 * lc1 + m2 * L1) * G * np.cos(q[0]) + mc2 * G * np.cos(q[0] + q[1]), mc2 * G * np.cos(q[0] + q[1])])
    return Mm, c, g

def ref(t):
    """a smooth joint trajectory: swing round the lab's start pose"""
    q0, A, w = np.radians([60, -70]), np.radians([30, 40]), np.array([1.5, 2.0])
    return q0 + A * np.sin(w * t), A * w * np.cos(w * t), -A * w * w * np.sin(w * t)

def computed_torque(q, qd, t, wn=10.0, payload_model=0.0):
    qr, vr, ar = ref(t); e, ed = qr - q, vr - qd
    M, c, g = model(q, qd, payload_model)
    return M @ (ar + 2 * wn * ed + wn * wn * e) + c + g             # Kd = 2 wn, Kp = wn^2: critically damped error

def pd_gravity(q, qd, t, Kp=(140, 90), Kd=(30, 16)):
    qr, vr, _ = ref(t); _, _, g = model(q, qd)
    return np.array(Kp) * (qr - q) + np.array(Kd) * (vr - qd) + g    # the lab's servo

def run(ctrl, T=4.0, dt=1e-3, payload=0.0, e0=np.radians([5, -5])):
    q = ref(0)[0] - e0; qd = ref(0)[1].copy(); ts, es, taus = [], [], []
    def f(s, t):    # the controller is evaluated continuously (inside every RK4 stage)
        tau = ctrl(s[:2], s[2:], t); M, c, g = model(s[:2], s[2:], payload)
        return np.concatenate([s[2:], np.linalg.solve(M, tau - c - g)]), tau
    s = np.concatenate([q, qd])
    for i in range(int(T / dt)):
        t = i * dt
        k1, tau = f(s, t); k2, _ = f(s + dt / 2 * k1, t + dt / 2); k3, _ = f(s + dt / 2 * k2, t + dt / 2); k4, _ = f(s + dt * k3, t + dt)
        s = s + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4)
        ts.append(t + dt); es.append(ref(t + dt)[0] - s[:2]); taus.append(tau)
    return np.array(ts), np.array(es), np.array(taus)

def test_error_decays_exponentially():
    wn = 10.0
    t, e, tau = run(lambda q, qd, t: computed_torque(q, qd, t, wn))
    e0 = np.radians(5)
    # theory for a critically damped error starting at e0 with zero rate: e(t) = e0 (1 + wn t) exp(-wn t)
    theory = e0 * (1 + wn * t) * np.exp(-wn * t)
    dev = np.abs(np.abs(e[:, 0]) - theory).max()
    print(f"computed torque, wn = {wn}: |e1| at 0.5 s {np.degrees(abs(e[499, 0])):.4f} deg (theory {np.degrees(theory[499]):.4f}), deviation from theory {np.degrees(dev):.1e} deg")
    print(f"  peak torques ({np.abs(tau[:, 0]).max():.1f}, {np.abs(tau[:, 1]).max():.1f}) N m")
    assert dev < np.radians(1e-3)
    assert np.abs(e[2000:]).max() < np.radians(1e-6)          # gone after 2 s

def test_compare_pd():
    t, e, _ = run(pd_gravity)
    print(f"lab PD + gravity: tracking error after 2 s up to {np.degrees(np.abs(e[2000:]).max()):.3f} deg (it never vanishes)")
    assert np.abs(e[2000:]).max() > np.radians(0.5)

def test_model_mismatch():
    t, e, _ = run(lambda q, qd, t: computed_torque(q, qd, t), payload=0.5)
    print(f"with an unmodelled 0.5 kg payload: residual error up to {np.degrees(np.abs(e[2000:]).max()):.3f} deg")
    t2, e2, _ = run(lambda q, qd, t: computed_torque(q, qd, t, payload_model=0.5), payload=0.5)
    assert np.abs(e[2000:]).max() > 0.05 * np.pi / 180 and np.abs(e2[2000:]).max() < 1e-6

test_error_decays_exponentially()
test_compare_pd()
test_model_mismatch()
print("PASS")
