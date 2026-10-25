import numpy as np

Ixx, TAU_M, DELAY, T = 0.012, 0.02, 0.006, 0.002     # roll inertia, motor lag (s), sensing + compute delay (s), 500 Hz loop
TAU_MAX = 1.5                                          # largest roll torque at hover (Lesson 07)
KP_R, KI_R, KD_R = 0.36, 1.0, 0.004                    # rate loop PID, torque per rad/s of rate error
KP_A = 6.0                                             # attitude loop P, rad/s of rate per rad of angle error

def rate_controller(s): return KP_R + KI_R / s + KD_R * s / (1 + s / 200)       # derivative filtered at 200 rad/s
def actuator(s): return np.exp(-DELAY * s) / (TAU_M * s + 1)
def body(s): return 1 / (Ixx * s)                     # torque -> roll rate

def L_inner(s): return rate_controller(s) * actuator(s) * body(s)
def T_inner(s): L = L_inner(s); return L / (1 + L)
def L_outer(s): return KP_A * T_inner(s) / s           # attitude error -> rate setpoint -> roll rate -> angle

def margins(L, w=np.logspace(-1, 3.5, 40000)):
    Lw = L(1j * w); mag, ph = np.abs(Lw), np.unwrap(np.angle(Lw))
    i = np.where(np.diff(np.sign(mag - 1)))[0][0]; wc = w[i]; pm = 180 + np.degrees(ph[i])
    j = np.where(np.diff(np.sign(ph + np.pi)))[0]; gm = -20 * np.log10(mag[j[0]]) if len(j) else np.inf
    return wc, pm, gm, np.radians(pm) / wc

def step(target_deg=20, t_end=1.5, dt=1e-4):
    """time simulation with saturation and the delay as a buffer: roll step through both loops"""
    n_del = int(round(DELAY / dt)); buf = [0.0] * (n_del + 1); phi = p = tau = integ = d_f = 0.0; prev_e = 0.0
    u = 0.0; log = []; sub = int(T / dt)
    for k in range(int(t_end / dt)):
        if k % sub == 0:
            p_ref = KP_A * (np.radians(target_deg) - phi)
            e = p_ref - p; integ += e * T
            d_f += T * 200 * ((e - prev_e) / T - d_f); prev_e = e
            u_raw = KP_R * e + KI_R * integ + KD_R * d_f; u = np.clip(u_raw, -TAU_MAX, TAU_MAX)
            if u != u_raw: integ -= e * T                # anti-windup: stop integrating while saturated
        buf.append(u); u_del = buf.pop(0)
        tau += dt / TAU_M * (u_del - tau); p += dt * tau / Ixx; phi += dt * p
        log.append((k * dt, np.degrees(phi), tau))
    return np.array(log)

def test_loops():
    wi, pmi, gmi, dmi = margins(L_inner); wo, pmo, gmo, dmo = margins(L_outer)
    print(f"rate loop: crossover {wi:.1f} rad/s, phase margin {pmi:.1f} deg, gain margin {gmi:.1f} dB, delay margin {1000 * dmi:.1f} ms")
    print(f"attitude loop: crossover {wo:.2f} rad/s, phase margin {pmo:.1f} deg, gain margin {gmo:.1f} dB, delay margin {1000 * dmo:.1f} ms")
    print(f"bandwidth separation: {wi / wo:.1f}x")
    assert pmi > 45 and gmi > 6 and pmo > 45 and gmo > 6 and wi / wo > 4
    log = step(); t, phi, tau = log.T; final = phi[-1]
    over = 100 * (phi.max() - 20) / 20; t90 = t[np.argmax(phi >= 18)]
    settle = t[np.where(np.abs(phi - 20) > 0.4)[0][-1]]
    print(f"20 deg step: rise to 90 % in {1000 * t90:.0f} ms, overshoot {over:.1f} %, within 2 % after {1000 * settle:.0f} ms, "
          f"final {final:.2f} deg, peak torque {np.abs(tau).max():.3f} N m")
    assert over < 10 and abs(final - 20) < 0.2 and np.abs(tau).max() <= TAU_MAX + 1e-9

def test_bad_tuning():
    global KP_A
    keep = KP_A; KP_A = 25.0                            # outer loop too close to the inner loop
    wo, pmo, gmo, _ = margins(L_outer); log = step(); over = 100 * (log[:, 1].max() - 20) / 20
    print(f"attitude P 25: crossover {wo:.1f} rad/s, phase margin {pmo:.1f} deg, overshoot {over:.1f} %")
    assert pmo < 45 and over > 10
    KP_A = keep

test_loops(); test_bad_tuning(); print("PASS")
