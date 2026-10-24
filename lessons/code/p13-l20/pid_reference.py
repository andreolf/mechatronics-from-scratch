import subprocess, numpy as np

def pid_ref(kp, ki, kd, tf, ts, umin, umax):
    s = dict(integ=0.0, d=0.0, yprev=None)
    a = tf / (tf + ts)
    def step(r, y):
        e = r - y
        if s["yprev"] is None: s["yprev"] = y
        s["d"] = a * s["d"] - (1 - a) * kd * (y - s["yprev"]) / ts
        s["yprev"] = y
        u = kp * e + s["integ"] + s["d"]
        us = min(max(u, umin), umax)
        if not ((u > umax and e > 0) or (u < umin and e < 0)):
            s["integ"] += ki * ts * e
        return us
    return step

def closed_loop():
    step = pid_ref(2.0, 10.0, 0.1, 0.01, 0.001, -1.5, 1.5)
    y, ad, out = 0.0, np.exp(-0.001 / 0.2), []
    for k in range(3000):
        r = 1.0 if k < 1500 else -0.5
        u = step(r, y); out.append((u, y))
        y = ad * y + (1 - ad) * u
    return np.array(out)

def run_c(real):
    subprocess.run(["gcc", "-std=c99", "-Wall", "-Werror", "-O1", "-DDUMP", f"-DREAL={real}", "-o", "pid_dump", "pid.c", "-lm"], check=True)
    txt = subprocess.run(["./pid_dump"], capture_output=True, text=True, check=True).stdout
    return np.loadtxt(txt.splitlines())

def test_c_matches_python():
    ref = closed_loop()
    for real, tol in (("double", 1e-8), ("float", 1e-4)):
        c = run_c(real)
        err = np.abs(c - ref).max()
        print(f"C ({real}) vs Python reference over 3000 steps: max difference {err:.2e}")
        assert c.shape == ref.shape and err < tol

def test_loop_behaviour():
    ref = closed_loop(); u, y = ref[:, 0], ref[:, 1]
    print(f"saturated samples: {np.sum(np.abs(u) >= 1.5)}, y at 1.5 s: {y[1499]:.4f}, at 3 s: {y[-1]:.4f}")
    assert np.abs(u).max() <= 1.5
    assert abs(y[1499] - 1) < 0.01 and abs(y[-1] + 0.5) < 0.01

test_c_matches_python()
test_loop_behaviour()
print("PASS")
