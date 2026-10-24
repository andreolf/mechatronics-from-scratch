import numpy as np

dt, tau, theta = 0.01, 5.0, 2.0
Kp, Ti = 2.5, 5.0
a = np.exp(-dt / tau)                                   # exact ZOH discretisation of 1/(tau s + 1)

def run(mode, model_theta=theta, T=40.0):
    n = int(T / dt); nd = int(round(theta / dt)); md = int(round(model_theta / dt))
    x = xm = integ = 0.0
    u_hist, xm_hist, y_out = [], [], []
    for k in range(n):
        y = x                                            # measured process output
        xm_hist.append(xm)
        if mode == "smith":
            fb = y + xm - (xm_hist[k - md] if k >= md else 0.0)   # y + model - delayed model
        else:
            fb = y
        e = 1.0 - fb
        integ += e * dt
        u = Kp * (e + integ / Ti)
        u_hist.append(u)
        ud = u if mode == "nodelay" else (u_hist[k - nd] if k >= nd else 0.0)
        x = a * x + (1 - a) * ud                          # process (input delayed by theta)
        xm = a * xm + (1 - a) * u                         # delay-free model
        y_out.append(y)
    return np.array(y_out)

def test_smith_equals_delayed_delay_free():
    y0, ys = run("nodelay"), run("smith")
    k = int(round(theta / dt))
    err = np.max(np.abs(ys[k:] - y0[:-k]))
    print(f"Smith predictor vs delay-free response shifted by {theta} s: max difference {err:.1e}")
    assert err < 1e-9 and np.max(np.abs(ys[:k])) < 1e-12

def test_better_than_plain_pi():
    yp, ys = run("plain"), run("smith")
    os_p, os_s = yp.max() - 1, ys.max() - 1
    iae_p, iae_s = np.sum(np.abs(1 - yp)) * dt, np.sum(np.abs(1 - ys)) * dt
    print(f"plain PI: overshoot {os_p:.0%}, IAE {iae_p:.2f}; Smith: overshoot {max(os_s, 0):.0%}, IAE {iae_s:.2f}")
    assert os_p > 0.3 and os_s < 0.01 and iae_s < iae_p

def test_model_delay_error_degrades():
    ys = run("smith"); yw = run("smith", model_theta=1.0)          # model delay half the real one
    assert (yw.max() - 1) > (ys.max() - 1) + 0.05

def test_pade_phase():
    for wt in np.linspace(0.01, 0.5, 50):
        assert abs(np.degrees(2 * np.arctan(wt / 2) - wt)) < 1.0
    w = 1.3; s = 1j * w
    assert abs(abs((1 - s * theta / 2) / (1 + s * theta / 2)) - 1) < 1e-12

test_smith_equals_delayed_delay_free()
test_better_than_plain_pi()
test_model_delay_error_degrades()
test_pade_phase()
print("PASS")
