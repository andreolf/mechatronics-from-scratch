import numpy as np
from scipy.linalg import solve_continuous_are

M, m, r, l, Ib, Iw, g, kt, ke, R = 0.9, 0.12, 0.04, 0.07, 0.004, 9.6e-5, 9.81, 0.25, 0.25, 4.0   # Lesson 02 robot
VMAX, DT = 11.1, 1e-3

def model():
    """linear model about upright, input = motor voltage. Mm q'' = G q + [1/r, -1] tau, tau = 2 kt (v - ke (x'/r - th')) / R."""
    Mi = np.linalg.inv(np.array([[M + m + Iw / r**2, M * l], [M * l, Ib + M * l**2]])); e = np.array([1 / r, -1.0]); c = 2 * kt / R
    A = np.zeros((4, 4)); A[0, 1] = A[2, 3] = 1
    A[[1, 3], 2] = Mi @ [0, M * g * l]; A[[1, 3], 1] = Mi @ e * (-c * ke / r); A[[1, 3], 3] = Mi @ e * (c * ke)
    B = np.zeros(4); B[[1, 3]] = Mi @ e * c
    return A, B

A, B = model()
K_LQR = -(B @ solve_continuous_are(A, B[:, None], np.diag([10, 1, 100, 1]), np.array([[1.0]])))  # LQR u = -K s, written as v = K_LQR s

class PID:
    """tilt PID (fast) plus a slow position loop that leans the tilt setpoint, the usual hand-tuned structure."""
    def __init__(s, kp=60.0, ki=150.0, kd=4.0, kx=0.06, kv=0.12): s.k = (kp, ki, kd, kx, kv); s.i = 0.0
    def __call__(s, st):
        kp, ki, kd, kx, kv = s.k; x, xd, th, thd = st
        th_ref = -(kx * x + kv * xd); e = th - th_ref; s.i += e * DT
        return kp * e + ki * s.i + kd * thd

def kick(ctrl, w0=1.0, t_end=6.0):
    """impulse: the body is struck so its tilt rate jumps to w0 rad/s. Returns recovery time, effort and peak voltage."""
    s = np.array([0, 0, 0, w0]); t = 0; last = 0; effort = 0; vpk = 0; ths = []
    while t < t_end:
        v = float(np.clip(ctrl(s), -VMAX, VMAX)); effort += v * v * DT; vpk = max(vpk, abs(v))
        s = s + DT * (A @ s + B * v); t += DT; ths.append(s[2])
        if abs(s[2]) > np.radians(0.2): last = t
        if abs(s[2]) > np.radians(45): return None, effort, vpk, max(np.abs(ths))
    return last, effort, vpk, max(np.abs(ths))

def margins(Lf):
    """gain and phase margin of a loop transfer function given as f(s), from a log frequency sweep."""
    w = np.logspace(-2, 4, 20000); L = Lf(1j * w); mag = np.abs(L)
    i = np.nonzero(np.diff(np.sign(mag - 1)))[0]                       # every gain crossover
    pm = min(180 + np.degrees(np.angle(L[k])) for k in i)               # angle() is in (-180, 180]
    return pm, w[i]

def loop_lqr(s): return np.array([K_LQR @ np.linalg.solve(si * np.eye(4) - A, B) for si in s])

def loop_pid(s, c=PID()):
    kp, ki, kd, kx, kv = c.k
    out = []
    for si in s:
        G = np.linalg.solve(si * np.eye(4) - A, B)                     # plant from v to the state
        Ks = np.array([(kp + ki / si) * kx, (kp + ki / si) * kv, kp + ki / si, kd])   # v as a function of the state
        out.append(Ks @ G)
    return np.array(out)

def test_both_recover():
    rl = kick(lambda s: float(K_LQR @ s)); rp = kick(PID())
    for name, (t, e, vpk, thmax) in (("PID", rp), ("LQR", rl)):
        print(f"{name}: recovers in {t:.2f} s, peak tilt {np.degrees(thmax):.2f} deg, peak voltage {vpk:.2f} V, effort {e:.3f} V^2 s")
    assert rp[0] is not None and rl[0] is not None and rl[1] < rp[1]
    print(f"LQR uses {100 * (1 - rl[1] / rp[1]):.0f} % less effort")

def test_margins():
    for name, Lf in (("LQR", loop_lqr), ("PID", loop_pid)):
        pm, wc = margins(lambda s: -Lf(s))                               # negative feedback convention: L = -K G
        print(f"{name} loop broken at the motor input: phase margin {pm:.1f} deg at {wc[0]:.1f} rad/s, delay margin {1000 * np.radians(pm) / wc[0]:.1f} ms")
    (pl, wl), (pp, wp) = margins(lambda s: -loop_lqr(s)), margins(lambda s: -loop_pid(s))
    assert pl >= 60 - 1e-6                                              # LQR's guaranteed phase margin
    assert np.radians(pl) / wl[0] > np.radians(pp) / wp[0]              # LQR tolerates far more loop delay

test_both_recover()
test_margins()
print("PASS")
