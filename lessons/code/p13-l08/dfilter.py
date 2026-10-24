import numpy as np

M, m, l, g = 0.8, 0.25, 0.45, 9.81
Fmax, tauA, Kp, Ki, Kd, kx, kv = 30.0, 0.02, 38.0, 6.0, 7.0, 1.6, 2.6
SIGMA = np.radians(0.5)

def deriv(s, F):
    x, xd, th, thd = s
    sn, cs, tot = np.sin(th), np.cos(th), M + m
    temp = (F + m * l * thd * thd * sn) / tot
    thdd = (g * sn - cs * temp) / (l * (4 / 3 - m * cs * cs / tot)) - 0.02 * thd
    return np.array([xd, temp - m * l * thdd * cs / tot - 0.3 * xd, thd, thdd])

def run(Tf, sigma=SIGMA, T=20.0, seed=0):
    h, every = 1e-3, 5; dt = h * every
    a = np.exp(-dt / Tf) if Tf > 0 else 0.0
    rng = np.random.default_rng(seed)
    s = np.array([0.0, 0.0, 0.06, 0.0]); F = Fc = integ = d = 0.0; prev = 0.06
    cmds, ths = [], []
    for k in range(int(T / h)):
        if k % every == 0:
            y = s[2] + sigma * rng.normal()
            d = a * d + (1 - a) * (y - prev) / dt; prev = y
            integ = np.clip(integ + y * dt, -0.5, 0.5)
            Fc = np.clip(Kp * y + Ki * integ + Kd * d + kx * s[0] + kv * s[1], -Fmax, Fmax)
        F += h / tauA * (Fc - F)
        k1 = deriv(s, F); k2 = deriv(s + h / 2 * k1, F); k3 = deriv(s + h / 2 * k2, F); k4 = deriv(s + h * k3, F)
        s = s + h / 6 * (k1 + 2 * k2 + 2 * k3 + k4)
        cmds.append(Fc); ths.append(s[2])
        if abs(s[2]) > 1.0: break
    return np.array(cmds), np.array(ths)

def noise_rms(Tf, dt=0.005):
    if Tf == 0: return np.sqrt(2) / dt
    a = np.exp(-dt / Tf)
    return (1 - a) / dt * np.sqrt(2 / (1 + a))

def test_formula_matches_filter():
    rng = np.random.default_rng(1); n = rng.normal(size=400000); dt = 0.005
    for Tf in (0.0, 0.012, 0.05):
        a = np.exp(-dt / Tf) if Tf else 0.0
        raw = np.diff(n) / dt; d = np.zeros_like(raw)
        for k in range(1, len(raw)): d[k] = a * d[k - 1] + (1 - a) * raw[k]
        assert abs(np.std(d[100:]) / noise_rms(Tf) - 1) < 0.01

def test_actuator_rms_drops():
    raw, th_r = run(0.0); filt, th_f = run(0.012)
    r_raw, r_f = np.std(raw[2000:]), np.std(filt[2000:])
    print(f"actuator command RMS: raw derivative {r_raw:.1f} N (noise model {Kd * SIGMA * noise_rms(0):.1f}), filtered {r_f:.1f} N (model {Kd * SIGMA * noise_rms(0.012):.1f})")
    assert len(th_r) == len(th_f) == 20000                  # both still balance
    assert r_f < r_raw / 2.5
    assert abs(r_raw / r_f - noise_rms(0) / noise_rms(0.012)) / (noise_rms(0) / noise_rms(0.012)) < 0.25

def test_too_much_filter_destabilises():
    results = {}
    for Tf in (0.012, 0.03, 0.06, 0.1, 0.15):
        _, th = run(Tf)
        results[Tf] = (len(th) / 1000, np.max(np.abs(th[2000:])) if len(th) > 2000 else 1.0)
        print(f"Tf = {Tf * 1000:5.0f} ms: upright {results[Tf][0]:4.1f} s, max tilt after 2 s {results[Tf][1]:.3f} rad")
    assert results[0.012][1] < 0.05 and results[0.06][1] < 0.05
    assert results[0.1][1] > 0.2 and results[0.15][0] < 20

test_formula_matches_filter()
test_actuator_rms_drops()
test_too_much_filter_destabilises()
print("PASS")
