import numpy as np

M, m, l, g = 0.8, 0.25, 0.45, 9.81
Fmax, tauA = 30.0, 0.02
GAINS = dict(Kp=38.0, Ki=6.0, Kd=7.0, kx=1.6, kv=2.6)

def deriv(s, F):
    """the live lab's cart-pole (uniform rod, small joint and cart friction)"""
    x, xd, th, thd = s
    sn, cs, tot = np.sin(th), np.cos(th), M + m
    temp = (F + m * l * thd * thd * sn) / tot
    thdd = (g * sn - cs * temp) / (l * (4 / 3 - m * cs * cs / tot)) - 0.02 * thd
    xdd = temp - m * l * thdd * cs / tot - 0.3 * xd
    return np.array([xd, xdd, thd, thdd])

def run(P=True, I=True, D=True, T=30.0, th0=0.06, kick_at=None, **over):
    G = {**GAINS, **over}
    h, every = 1e-3, 5; dt = h * every                       # physics 1 kHz, control 200 Hz
    s = np.array([0.0, 0.0, th0, 0.0]); F = Fc = integ = dstate = 0.0; prev = th0
    a = np.exp(-dt / 0.012)                                  # derivative low-pass, 12 ms
    ths, xs = [], []
    for k in range(int(T / h)):
        if kick_at is not None and k == int(kick_at / h): s[3] += 0.9
        if k % every == 0:
            th = s[2]
            dstate = a * dstate + (1 - a) * (th - prev) / dt; prev = th      # derivative on measurement
            integ = np.clip(integ + th * dt, -0.5, 0.5) if I else 0.0
            u = (G["Kp"] * th if P else 0) + (G["Ki"] * integ if I else 0) + (G["Kd"] * dstate if D else 0) \
                + G["kx"] * s[0] + G["kv"] * s[1]
            Fc = np.clip(u, -Fmax, Fmax)
        F += h / tauA * (Fc - F)                              # actuator lag
        k1 = deriv(s, F); k2 = deriv(s + h / 2 * k1, F); k3 = deriv(s + h / 2 * k2, F); k4 = deriv(s + h * k3, F)
        s = s + h / 6 * (k1 + 2 * k2 + 2 * k3 + k4)
        ths.append(s[2]); xs.append(s[0])
        if abs(s[2]) > 1.0: break                            # fallen
    return np.array(ths), np.array(xs)

def test_balances_30_s():
    th, x = run(kick_at=10.0)
    print(f"tuned PID: {len(th) / 1000:.1f} s upright, max tilt {np.max(np.abs(th)):.3f} rad, cart within {np.max(np.abs(x)):.2f} m, final tilt {th[-1]:.1e}")
    assert len(th) == 30000 and np.max(np.abs(th)) < 0.25 and np.max(np.abs(x)) < 2.0 and abs(th[-1]) < 1e-3

def test_without_d_or_p_it_falls():
    for name, kw in (("no D", dict(D=False)), ("no P", dict(P=False))):
        th, _ = run(**kw)
        print(f"{name}: falls after {len(th) / 1000:.2f} s")
        assert len(th) < 5000

def test_linear_poles():
    tot = M + m; den = l * (4 / 3 - m / tot)
    p2, beta = g / den, 1 / (tot * den)
    assert abs(p2 - 19.904) < 1e-3 and abs(beta - 1.9324) < 1e-3
    G = GAINS
    # linearised closed loop, ideal derivative, actuator lag: states x, xd, th, thd, F, integral
    def f(z):
        x, xd, th, thd, F, I = z
        Fc = G["Kp"] * th + G["Ki"] * I + G["Kd"] * thd + G["kx"] * x + G["kv"] * xd
        return np.concatenate([deriv([x, xd, th, thd], F), [(Fc - F) / tauA, th]])
    A = np.column_stack([(f(e * 1e-7) - f(-e * 1e-7)) / 2e-7 for e in np.eye(6)])
    ev = np.linalg.eigvals(A)
    print("linearised closed-loop eigenvalues:", np.round(np.sort_complex(ev), 2))
    ev = ev[np.argsort(-ev.real)]
    assert abs(ev[0]) < 1e-9                                  # one zero mode: a family of resting cart positions
    assert np.all(ev[1:].real < -0.5)                         # every other mode decays
    assert np.max(np.linalg.eigvals(A - G["Kd"] * np.outer(np.eye(6)[4], np.eye(6)[3]) / tauA).real) > 0   # remove D: unstable

test_balances_30_s()
test_without_d_or_p_it_falls()
test_linear_poles()
print("PASS")
