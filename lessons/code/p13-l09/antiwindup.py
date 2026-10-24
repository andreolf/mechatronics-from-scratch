import numpy as np

R, L, k, J, b = 1.2, 0.002, 0.05, 2e-4, 2e-5
Kp, Ki, Vmax, Tt = 0.12, 2.5, 12.0, 0.02

def run(mode, w_ref=200.0, T=1.5, dt=5e-5, limit=True):
    i = w = I = 0.0; ws = []
    for _ in range(int(T / dt)):
        e = w_ref - w
        v = Kp * e + I                                     # unsaturated controller output
        u = np.clip(v, -Vmax, Vmax) if limit else v
        if mode == "none":
            I += Ki * e * dt
        elif mode == "clamp":
            if not (u != v and np.sign(e) == np.sign(v)):
                I += Ki * e * dt
        elif mode == "back":
            I += (Ki * e + (u - v) / Tt) * dt
        f = lambda s: np.array([(u - R * s[0] - k * s[1]) / L, (k * s[0] - b * s[1]) / J])
        s = np.array([i, w])
        k1 = f(s); k2 = f(s + dt / 2 * k1); k3 = f(s + dt / 2 * k2); k4 = f(s + dt * k3)
        i, w = s + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4); ws.append(w)
    return np.array(ws)

def overshoot(w, ref):
    return max(0.0, (w.max() - ref) / ref)

def settle(w, ref, dt=5e-5, band=0.02):
    return (np.where(np.abs(w - ref) > band * ref)[0][-1] + 1) * dt

def test_windup_and_fixes():
    lin = overshoot(run("none", limit=False), 200)
    res = {m: run(m) for m in ("none", "clamp", "back")}
    print(f"no limit: overshoot {lin:.1%}")
    for m, w in res.items():
        print(f"12 V limit, {m:5s}: overshoot {overshoot(w, 200):5.1%}, settles in {settle(w, 200) * 1000:.0f} ms")
    os_none = overshoot(res["none"], 200)
    assert os_none > lin                                   # windup is worse than no limit at all
    for m in ("clamp", "back"):
        assert overshoot(res[m], 200) < os_none / 5
        assert settle(res[m], 200) < settle(res["none"], 200)

def test_small_steps_untouched():
    ws = [run(m, w_ref=40.0, T=0.6) for m in ("none", "clamp", "back")]
    assert np.max(np.abs(40.0 * 0.12)) < Vmax                # never saturates: Kp*e starts at 4.8 V
    assert np.allclose(ws[0], ws[1]) and np.allclose(ws[0], ws[2])

test_windup_and_fixes()
test_small_steps_untouched()
print("PASS")
