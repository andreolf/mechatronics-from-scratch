import numpy as np

p, psi, R, L = 4, 0.01, 0.5, 0.5e-3
Ts = 50e-6; wc = 2 * np.pi * 800; Kp, Ki = L * wc, R * wc
K = 2 * np.pi / 3

def clarke(a, b, c): return (2 / 3) * (a - b / 2 - c / 2), (b - c) / np.sqrt(3)
def park(al, be, th): return al * np.cos(th) + be * np.sin(th), -al * np.sin(th) + be * np.cos(th)
def inv_park(d, q, th): return d * np.cos(th) - q * np.sin(th), d * np.sin(th) + q * np.cos(th)
def inv_clarke(al, be): return np.array([al, -al / 2 + np.sqrt(3) / 2 * be, -al / 2 - np.sqrt(3) / 2 * be])

def emf(th_e, w_e):            # phase back-EMFs from the magnet flux psi*cos(th - kK)
    return -w_e * psi * np.sin(th_e - np.arange(3) * K)

def run_foc(iq_ref=5.0, w_m=100.0, T=0.05, sub=20):
    """Three real phases simulated at Ts/sub; the controller runs every Ts."""
    w_e = p * w_m; dt = Ts / sub
    i = np.zeros(3); Id = Iq = 0.0; v = np.zeros(3); th = 0.0; torque = []
    for n in range(int(T / Ts)):
        idm, iqm = park(*clarke(*i), th)                       # measure
        ed, eq = 0.0 - idm, iq_ref - iqm
        Id += Ki * Ts * ed; Iq += Ki * Ts * eq
        vd = Kp * ed + Id - w_e * L * iqm                       # PI + decoupling feed-forward
        vq = Kp * eq + Iq + w_e * (L * idm + psi)
        v = inv_clarke(*inv_park(vd, vq, th + w_e * Ts / 2))    # angle at mid-period
        for _ in range(sub):                                    # plant: L di/dt = v - R i - e
            e = emf(th, w_e)
            i = i + dt * (v - R * i - e) / L
            th += w_e * dt
            torque.append((e @ i) / w_m)                       # T = power into the EMFs / w_m
    return np.array(torque)

def six_step_torque(I=5.0, w_m=100.0, N=3600):
    w_e = p * w_m; T = []
    for th in np.linspace(0, 2 * np.pi, N, endpoint=False):
        e = emf(th, w_e); i = np.zeros(3)
        i[np.argmax(e)] = I; i[np.argmin(e)] = -I                # ideal Hall commutation, 120-degree blocks
        T.append((e @ i) / w_m)
    return np.array(T)

if __name__ == "__main__":
    t_foc = run_foc()[-int(0.02 / Ts * 20):]                    # last 20 ms, after the step settles
    t6 = six_step_torque()
    rip = lambda t: np.ptp(t) / np.mean(t)
    print(f"FOC: mean {t_foc.mean():.4f} N*m (law {1.5*p*psi*5:.4f}), ripple {100*rip(t_foc):.2f} %")
    print(f"six-step: mean {t6.mean():.4f} N*m, ripple {100*rip(t6):.1f} %")
    assert abs(t_foc.mean() - 1.5 * p * psi * 5) < 0.01 * 1.5 * p * psi * 5
    assert rip(t6) > 0.10 and rip(t_foc) < rip(t6) / 5
    assert abs(rip(t6) - (1 - np.cos(np.pi / 6)) / (3 / np.pi)) < 0.005     # (1 - cos 30) / mean of cos over +-30 deg
