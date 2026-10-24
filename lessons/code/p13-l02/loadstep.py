import numpy as np

R, k, J, b = 1.2, 0.05, 2e-4, 2e-5
beta = k * k / R + b
w_ref = 2000 * 2 * np.pi / 60
V0 = beta * w_ref * R / k                      # voltage for the reference speed unloaded

def simulate(Kp, tl=0.05, T=1.6, dt=2e-5, t_step=0.2):
    w, out = w_ref, []
    for i in range(int(T / dt)):
        t = i * dt
        V = V0 + Kp * (w_ref - w)
        load = tl if t >= t_step else 0.0
        f = lambda w: (k / R * (V - k * w) - b * w - load) / J
        k1 = f(w); k2 = f(w + dt / 2 * k1); k3 = f(w + dt / 2 * k2); k4 = f(w + dt * k3)
        w += dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4); out.append(w)
    return np.array(out)

def test_open_loop_drop():
    w = simulate(0.0)
    drop = w_ref - w[-1]
    print(f"V0 = {V0:.2f} V; open-loop drop {drop:.2f} rad/s ({drop * 60 / (2 * np.pi):.0f} rpm), predicted {0.05 / beta:.2f}")
    assert abs(drop - 0.05 / beta) < 0.01

def test_drop_reduced_by_loop_gain():
    ol = w_ref - simulate(0.0)[-1]
    for Kp in (0.1, 0.5, 2.0):
        L = k * Kp / (R * beta)
        cl = w_ref - simulate(Kp)[-1]
        print(f"Kp = {Kp}: loop gain {L:5.1f}, drop {cl:.3f} rad/s, ratio {ol / cl:.2f} (1 + L = {1 + L:.2f})")
        assert abs(ol / cl - (1 + L)) / (1 + L) < 1e-3

def test_faster_recovery():
    for Kp in (0.0, 0.5):
        w = simulate(Kp)
        drop = w_ref - w[-1]
        k63 = np.argmax(w_ref - w[10000:] > 0.632 * drop)
        tc = (k63 + 1) * 2e-5
        pred = J / (beta + k * Kp / R)
        assert abs(tc - pred) / pred < 0.01

test_open_loop_drop()
test_drop_reduced_by_loop_gain()
test_faster_recovery()
print("PASS")
