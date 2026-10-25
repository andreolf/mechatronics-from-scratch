import numpy as np

# nominal roll axis and the Lesson 09 cascaded controller
NOM = dict(Ixx=0.012, tau_m=0.02, delay=0.006, k_thrust=1.0)
KP_R, KI_R, KD_R, KP_A, TAU_MAX, T = 0.36, 1.0, 0.004, 6.0, 1.5, 0.002
W = np.logspace(-1, 3.5, 6000)

def loops(P):
    s = 1j * W
    C = KP_R + KI_R / s + KD_R * s / (1 + s / 200)
    G = P["k_thrust"] * np.exp(-P["delay"] * s) / (P["tau_m"] * s + 1) / (P["Ixx"] * s)
    Li = C * G; Lo = KP_A * Li / (1 + Li) / s
    return Li, Lo

def pm(L):
    mag, ph = np.abs(L), np.unwrap(np.angle(L)); i = np.where(np.diff(np.sign(mag - 1)))[0]
    return 180 + np.degrees(ph[i[0]]) if len(i) else 180.0

def step(P, gust=0.0, noise=0.0, t_end=2.0, dt=2e-4, seed=0):
    """20 deg roll step with sensor noise and a torque gust at 1 s; returns overshoot (%), worst error after the gust and
    mean error over the last 0.3 s (deg)"""
    rng = np.random.default_rng(seed); n_del = int(round(P["delay"] / dt)); buf = [0.0] * (n_del + 1)
    phi = p = tau = integ = d_f = prev_e = u = 0.0; sub = int(T / dt); out = []
    for k in range(int(t_end / dt)):
        t = k * dt
        if k % sub == 0:
            phm, pmeas = phi + rng.normal(0, noise * 0.01), p + rng.normal(0, noise * 0.05)   # 0.6 deg, 3 deg/s per unit
            e = KP_A * (np.radians(20) - phm) - pmeas; integ += e * T
            d_f += T * 200 * ((e - prev_e) / T - d_f); prev_e = e
            u_raw = KP_R * e + KI_R * integ + KD_R * d_f; u = np.clip(u_raw, -TAU_MAX, TAU_MAX)
            if u != u_raw: integ -= e * T
        buf.append(u); ud = buf.pop(0)
        tau += dt / P["tau_m"] * (P["k_thrust"] * ud - tau)
        p += dt * (tau + (gust if 1.0 <= t < 1.2 else 0.0)) / P["Ixx"]; phi += dt * p
        out.append(np.degrees(phi))
    out = np.array(out); i17 = int(1.7 / dt)
    return 100 * (out[:int(1.0 / dt)].max() - 20) / 20, np.abs(out[int(1.0 / dt):] - 20).max(), np.abs(out[i17:] - 20).mean()

def sample(rng):
    return dict(Ixx=NOM["Ixx"] * rng.uniform(0.7, 1.3),            # payload, battery position
                tau_m=rng.uniform(0.01, 0.04),                     # ESC and motor differences
                delay=rng.uniform(0.002, 0.012),                   # scheduling, filtering
                k_thrust=rng.uniform(0.8, 1.2))                    # battery voltage, propeller wear

def test_nominal():
    Li, Lo = loops(NOM); ov, gust_err, late = step(NOM, gust=0.2, noise=1.0)
    print(f"nominal: rate PM {pm(Li):.1f} deg, attitude PM {pm(Lo):.1f} deg, overshoot {ov:.1f} %, "
          f"0.2 N m gust for 0.2 s: worst error {gust_err:.2f} deg, mean error at the end {late:.2f} deg")
    assert pm(Li) > 45 and pm(Lo) > 45 and ov < 10 and gust_err < 5 and late < 0.8

def test_monte_carlo(n=300):
    rng = np.random.default_rng(42); worst = None; pms = []
    for k in range(n):
        P = sample(rng); Li, Lo = loops(P); m = min(pm(Li), pm(Lo)); pms.append(m)
        if worst is None or m < worst[0]: worst = (m, P)
    pms = np.array(pms)
    print(f"{n} perturbed drones: phase margin min {pms.min():.1f} deg, 5th percentile {np.percentile(pms, 5):.1f} deg, "
          f"median {np.median(pms):.1f} deg; {np.mean(pms < 30) * 100:.1f} % below 30 deg")
    m, P = worst; ov, ge, late = step(P, gust=0.2, noise=1.0)
    print("worst case:", {k: round(v, 4) for k, v in P.items()}, f"-> overshoot {ov:.1f} %, gust error {ge:.2f} deg, mean error at the end {late:.2f} deg")
    assert pms.min() > 30 and ov < 20 and late < 0.8

def test_beyond_envelope():
    P = dict(NOM, delay=0.035, tau_m=0.05)               # far outside the envelope: the test must notice
    Li, Lo = loops(P); ov, _, late = step(P)
    print(f"35 ms delay, 50 ms motors: rate PM {pm(Li):.1f} deg, overshoot {ov:.1f} %")
    assert pm(Li) < 20

test_nominal(); test_monte_carlo(); test_beyond_envelope(); print("PASS")
