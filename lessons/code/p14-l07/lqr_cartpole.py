import numpy as np
from scipy.linalg import solve_continuous_are

M, m, l, g = 0.8, 0.25, 0.45, 9.81
Fmax, tauA = 30.0, 0.02

def deriv(s, F):
    """the live lab's cart-pole (uniform rod, small joint and cart friction)"""
    x, xd, th, thd = s
    sn, cs, tot = np.sin(th), np.cos(th), M + m
    temp = (F + m * l * thd * thd * sn) / tot
    thdd = (g * sn - cs * temp) / (l * (4 / 3 - m * cs * cs / tot)) - 0.02 * thd
    return np.array([xd, temp - m * l * thdd * cs / tot - 0.3 * xd, thd, thdd])

def linearise():
    f = lambda s, F: deriv(s, F)
    A = np.column_stack([(f(e * 1e-6, 0) - f(-e * 1e-6, 0)) / 2e-6 for e in np.eye(4)])
    B = ((f(np.zeros(4), 1e-6) - f(np.zeros(4), -1e-6)) / 2e-6)[:, None]
    return A, B

def lqr_gain(Q, R):
    A, B = linearise(); P = solve_continuous_are(A, B, Q, R)
    return np.linalg.solve(R, B.T @ P)[0]

Q0, R0 = np.diag([5.0, 1.0, 50.0, 1.0]), np.array([[0.05]])

def run(policy, th0_deg, T=10.0):
    h, every = 1e-3, 5; dt = h * every                        # physics 1 kHz, control 200 Hz like the lab
    s = np.array([0.0, 0.0, np.radians(th0_deg), 0.0]); F = Fc = 0.0; mem = {}
    ths, xs, Fs = [], [], []
    for k in range(int(T / h)):
        if k % every == 0: Fc = float(np.clip(policy(s, dt, mem), -Fmax, Fmax))
        F += h / tauA * (Fc - F)                               # actuator lag, not in the LQR model
        k1 = deriv(s, F); k2 = deriv(s + h / 2 * k1, F); k3 = deriv(s + h / 2 * k2, F); k4 = deriv(s + h * k3, F)
        s = s + h / 6 * (k1 + 2 * k2 + 2 * k3 + k4)
        ths.append(s[2]); xs.append(s[0]); Fs.append(Fc)
        if abs(s[2]) > 1.0: break
    return np.array(ths), np.array(xs), np.array(Fs)

def lqr_policy(K):
    return lambda s, dt, mem: -K @ s

def pid_policy(s, dt, mem, Kp=38.0, Ki=6.0, Kd=7.0, kx=1.6, kv=2.6):
    """lesson p13-l07's PID on the angle with cart-position terms"""
    th = s[2]; a = np.exp(-dt / 0.012)
    mem["d"] = a * mem.get("d", 0.0) + (1 - a) * (th - mem.get("prev", th)) / dt; mem["prev"] = th
    mem["i"] = np.clip(mem.get("i", 0.0) + th * dt, -0.5, 0.5)
    return Kp * th + Ki * mem["i"] + Kd * mem["d"] + kx * s[0] + kv * s[1]

def settle_time(th, tol=np.radians(0.5)):
    out = np.where(np.abs(th) > tol)[0]
    return (out[-1] + 1) / 1000 if len(out) else 0.0

def test_lqr_stabilises_from_15_deg():
    K = lqr_gain(Q0, R0)
    th, x, F = run(lqr_policy(K), 15.0)
    print(f"LQR K = {np.round(K, 2)}")
    print(f"LQR from 15 deg: upright {len(th) / 1000:.1f} s, settles within 0.5 deg at {settle_time(th):.2f} s, cart travel {np.abs(x).max():.2f} m, peak force {np.abs(F).max():.1f} N")
    assert len(th) == 10000 and np.abs(th[-1]) < 1e-3 and abs(x[-1]) < 0.01

def cart_settle(x, tol=0.01):
    out = np.where(np.abs(x) > tol)[0]
    return (out[-1] + 1) / 1000 if len(out) else 0.0

def test_compare_with_pid():
    K = lqr_gain(Q0, R0)
    for deg in (5.0, 15.0):
        tl, xl, _ = run(lqr_policy(K), deg, T=20.0); tp, xp, _ = run(pid_policy, deg, T=20.0)
        print(f"from {deg:4.1f} deg | LQR: angle settles {settle_time(tl):.2f} s, cart back within 1 cm at {cart_settle(xl):.2f} s"
              f" | PID: angle {settle_time(tp):.2f} s, cart {cart_settle(xp):.2f} s")
        assert len(tl) == len(tp) == 20000
        assert cart_settle(xl) < cart_settle(xp)          # one design handles angle and cart together

def test_largest_recoverable_angle():
    K = lqr_gain(Q0, R0); lo, hi = 15.0, 60.0
    for _ in range(12):
        mid = (lo + hi) / 2; th, _, _ = run(lqr_policy(K), mid, T=6.0)
        lo, hi = (mid, hi) if len(th) == 6000 and abs(th[-1]) < 0.02 else (lo, mid)
    print(f"with the 30 N force limit, this LQR recovers from up to about {lo:.0f} deg")
    assert lo > 15

test_lqr_stabilises_from_15_deg()
test_compare_with_pid()
test_largest_recoverable_angle()
print("PASS")
