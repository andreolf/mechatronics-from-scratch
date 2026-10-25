import numpy as np

g, L2, L3 = 9.81, 0.25, 0.20
M2, M3, M_ELBOW = 0.30, 0.20, 0.15          # the Lesson 11 arm, shoulder and elbow in the vertical plane
TAU_MAX = np.array([6.0, 2.0])               # G60 and S20 ratings
B_FRIC = 0.02                                # viscous friction at each joint (N m s/rad), illustrative
CPR = 4096

def params(load):
    m2 = M2 + M_ELBOW; lc2 = (M2 * L2 / 2 + M_ELBOW * L2) / m2
    I2 = M2 * L2**2 / 12 + M2 * (L2 / 2 - lc2)**2 + M_ELBOW * (L2 - lc2)**2
    m3 = M3 + load; lc3 = (M3 * L3 / 2 + load * L3) / m3
    I3 = M3 * L3**2 / 12 + M3 * (L3 / 2 - lc3)**2 + load * (L3 - lc3)**2
    return m2, lc2, I2, m3, lc3, I3

def dynamics(q, qd, P):
    """M(q) qdd + c(q, qd) + G(q) = tau, two-link arm, angles from the horizontal"""
    m2, lc2, I2, m3, lc3, I3 = P; c3, s3 = np.cos(q[1]), np.sin(q[1])
    M = np.array([[m2 * lc2**2 + I2 + m3 * (L2**2 + lc3**2 + 2 * L2 * lc3 * c3) + I3, m3 * (lc3**2 + L2 * lc3 * c3) + I3],
                  [m3 * (lc3**2 + L2 * lc3 * c3) + I3, m3 * lc3**2 + I3]])
    h = -m3 * L2 * lc3 * s3
    c = np.array([h * (2 * qd[0] * qd[1] + qd[1]**2), -h * qd[0]**2])
    G = g * np.array([(m2 * lc2 + m3 * L2) * np.cos(q[0]) + m3 * lc3 * np.cos(q[0] + q[1]), m3 * lc3 * np.cos(q[0] + q[1])])
    return M, c, G

def tip(q): return np.array([L2 * np.cos(q[0]) + L3 * np.cos(q[0] + q[1]), L2 * np.sin(q[0]) + L3 * np.sin(q[0] + q[1])])

class ArmHardware:
    """stands in for a ros2_control hardware interface: read() gives encoder positions, write() sends torque"""
    def __init__(s, q0, load=0.20):
        s.q, s.qd, s.P, s.tau = np.array(q0, float), np.zeros(2), params(load), np.zeros(2)
    def read(s): return np.round(s.q / (2 * np.pi / CPR)) * (2 * np.pi / CPR)
    def write(s, tau): s.tau = np.clip(tau, -TAU_MAX, TAU_MAX)
    def step(s, dt):
        def f(x):
            M, c, G = dynamics(x[:2], x[2:], s.P); return np.r_[x[2:], np.linalg.solve(M, s.tau - c - G - B_FRIC * x[2:])]
        x = np.r_[s.q, s.qd]; k1 = f(x); k2 = f(x + dt / 2 * k1); k3 = f(x + dt / 2 * k2); k4 = f(x + dt * k3)
        x = x + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4); s.q, s.qd = x[:2], x[2:]

class ComputedTorqueController:
    """the update() of a ros2_control controller: tau = M(q)(qdd_ref + Kd e_dot + Kp e + Ki int e) + c + G + friction"""
    def __init__(s, load_model=0.15, w=25.0, T=1e-3, model=True):
        # error dynamics e''' + kd e'' + kp e' + ki e = 0 with a triple pole at -w
        s.P, s.kp, s.kd, s.ki, s.T, s.model = params(load_model), 3 * w**2, 3 * w, w**3, T, model
        s.q_prev, s.integ, s.qd_f = None, np.zeros(2), np.zeros(2)
    def update(s, q, ref):
        qr, qdr, qddr = ref
        if s.q_prev is None: s.q_prev = q.copy()
        s.qd_f += 0.3 * ((q - s.q_prev) / s.T - s.qd_f); s.q_prev = q.copy()      # filtered velocity from encoder counts
        e, ed = qr - q, qdr - s.qd_f; s.integ += e * s.T
        v = qddr + s.kd * ed + s.kp * e + s.ki * s.integ
        if not s.model: return 0.05 * v + 0.0                                    # PD/PID with a constant inertia, no model
        M, c, G = dynamics(q, s.qd_f, s.P); return M @ v + c + G + B_FRIC * s.qd_f

def quintic(q0, q1, Tm, t):
    s = np.clip(t / Tm, 0, 1); d = q1 - q0
    return (q0 + d * (10 * s**3 - 15 * s**4 + 6 * s**5), d * (30 * s**2 - 60 * s**3 + 30 * s**4) / Tm * (t < Tm),
            d * (60 * s - 180 * s**2 + 120 * s**3) / Tm**2 * (t < Tm))

def run(ctrl, q0=(-0.3, 1.2), q1=(0.6, -0.4), Tm=1.2, t_end=1.6, load=0.20, dt=1e-4):
    q0, q1 = np.array(q0), np.array(q1); hw = ArmHardware(q0, load); err = []; tau_pk = np.zeros(2)
    sub = int(ctrl.T / dt)
    for k in range(int(t_end / dt)):
        t = k * dt
        if k % sub == 0:
            ref = quintic(q0, q1, Tm, t); hw.write(ctrl.update(hw.read(), ref)); tau_pk = np.maximum(tau_pk, np.abs(hw.tau))
            err.append((t, np.linalg.norm(tip(hw.q) - tip(ref[0]))))
        hw.step(dt)
    err = np.array(err); moving = err[err[:, 0] <= Tm, 1].max(); final = err[err[:, 0] >= Tm + 0.2, 1].max()
    return moving, final, tau_pk

def test_model():
    P = params(0.20); _, _, G = dynamics(np.zeros(2), np.zeros(2), P)
    print(f"gravity torque, arm horizontal: shoulder {G[0]:.3f} N m, elbow {G[1]:.3f} N m (Lesson 11: 2.305, 0.589)")
    assert np.allclose(G, [2.305, 0.589], atol=1e-3)
    q = np.array([0.3, 0.7]); M, _, _ = dynamics(q, np.zeros(2), P)
    assert np.allclose(M, M.T) and np.all(np.linalg.eigvalsh(M) > 0)
    # energy check: with no torque, friction or gravity the kinetic energy is conserved
    hw = ArmHardware([0.3, 0.7]); hw.qd = np.array([2.0, -1.0]); E0 = None
    global g, B_FRIC; gs, bs = g, B_FRIC; g, B_FRIC = 0.0, 0.0
    for k in range(5000):
        M, _, _ = dynamics(hw.q, hw.qd, hw.P); E = 0.5 * hw.qd @ M @ hw.qd; E0 = E if E0 is None else E0; hw.step(1e-4)
    g, B_FRIC = gs, bs; print(f"free swing 0.5 s: kinetic energy change {100 * abs(E - E0) / E0:.4f} %"); assert abs(E - E0) < 1e-5 * E0

def test_tracking():
    mv, fin, tpk = run(ComputedTorqueController())
    print(f"computed torque (payload modelled 25 % light): worst tip error moving {1000 * mv:.3f} mm, "
          f"settled {1000 * fin:.3f} mm, peak torque {np.round(tpk, 3)} N m")
    mv2, fin2, _ = run(ComputedTorqueController(model=False))
    print(f"same gains without the model: moving {1000 * mv2:.1f} mm, settled {1000 * fin2:.3f} mm")
    assert mv < 2e-3 and fin < 1e-3 and np.all(tpk <= TAU_MAX) and mv2 > 5 * mv     # spec: 2 mm moving, 1 mm settled

test_model(); test_tracking(); print("PASS")
