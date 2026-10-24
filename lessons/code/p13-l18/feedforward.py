import numpy as np

J, mgl, b = 0.05, 0.5 * 9.81 * 0.3, 0.01
Kp, Kd = 20.0, 2.0
ref = lambda t: (1 + 0.6 * np.sin(t), 0.6 * np.cos(t), -0.6 * np.sin(t))

def run(mode, model_scale=1.0, T=20.0, dt=1e-3):
    th, om = 1.0, 0.6; errs = []
    for k in range(int(T / dt)):
        t = k * dt
        r, rd, rdd = ref(t)
        tau = Kp * (r - th) + Kd * (rd - om)
        if mode in ("gravity", "full"): tau += model_scale * mgl * np.sin(r)
        if mode == "full": tau += model_scale * J * rdd + b * rd
        f = lambda s: np.array([s[1], (tau - mgl * np.sin(s[0]) - b * s[1]) / J])
        s = np.array([th, om])
        k1 = f(s); k2 = f(s + dt / 2 * k1); k3 = f(s + dt / 2 * k2); k4 = f(s + dt * k3)
        th, om = s + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4)
        errs.append(ref(t + dt)[0] - th)
    e = np.array(errs)
    return np.sqrt(np.mean(e[len(e) // 4:] ** 2))      # RMS after the start-up transient

def test_error_reduced_by_feedforward():
    e_pd, e_g, e_full = run("pd"), run("gravity"), run("full")
    print(f"RMS tracking error: PD {np.degrees(e_pd):.2f} deg, + gravity {np.degrees(e_g):.2f} deg, + inverse dynamics {np.degrees(e_full):.4f} deg")
    assert e_g < 0.5 * e_pd                              # more than 50 % reduction
    assert e_full < 0.01 * e_pd

def test_model_error_still_helps():
    e_pd, e_bad = run("pd"), run("full", model_scale=0.8)
    print(f"inverse dynamics with a 20 % low model: {np.degrees(e_bad):.2f} deg ({e_bad / e_pd:.0%} of PD alone)")
    assert e_bad < 0.5 * e_pd

def test_static_offset():
    assert abs(mgl * np.sin(1.0) / Kp - 0.0619) < 1e-3

test_error_reduced_by_feedforward()
test_model_error_still_helps()
test_static_offset()
print("PASS")
