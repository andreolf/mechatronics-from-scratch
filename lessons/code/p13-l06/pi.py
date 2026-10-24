import numpy as np

R, L, k, J, b = 1.2, 0.002, 0.05, 2e-4, 2e-5
Kp, Ki = 0.12, 2.5

def simulate(use_i, w_ref=200.0, load=0.05, t_load=1.0, T=2.0, dt=5e-5):
    i = w = integ = 0.0; out = []
    for n in range(int(T / dt)):
        t = n * dt
        e = w_ref - w
        if use_i: integ += e * dt
        V = Kp * e + (Ki * integ if use_i else 0.0)
        tl = load if t >= t_load else 0.0
        f = lambda s: np.array([(V - R * s[0] - k * s[1]) / L, (k * s[0] - b * s[1] - tl) / J])
        s = np.array([i, w])
        k1 = f(s); k2 = f(s + dt / 2 * k1); k3 = f(s + dt / 2 * k2); k4 = f(s + dt * k3)
        i, w = s + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4); out.append(w)
    return np.arange(len(out)) * dt, np.array(out)

def test_closed_loop_stable():
    a = np.array([L * J, L * b + R * J, R * b + k * k])
    cl = np.polyadd(np.polymul([1, 0], a), [0, 0, k * Kp, k * Ki])
    print("closed-loop poles:", np.round(np.roots(cl), 1))
    assert np.all(np.roots(cl).real < 0)
    assert cl[1] * cl[2] > cl[0] * cl[3]                    # Routh condition for a cubic

def test_zero_error_with_integral():
    t, w = simulate(True)
    e_ref = 200 - w[np.searchsorted(t, 0.99)]
    e_load = 200 - w[-1]
    print(f"PI: error before the load {e_ref:.2e} rad/s, after the load {e_load:.2e} rad/s")
    assert abs(e_ref) < 1e-3 and abs(e_load) < 1e-3

def test_p_only_leaves_offsets():
    t, w = simulate(False)
    G0 = k / (R * b + k * k); Lg = Kp * G0
    e_ref = 200 - w[np.searchsorted(t, 0.99)]
    pred_ref = 200 / (1 + Lg)
    pred_droop = 0.05 / (k * k / R + b + k * Kp / R)
    droop = w[np.searchsorted(t, 0.99)] - w[-1]
    print(f"P only: reference error {e_ref:.1f} rad/s (predicted {pred_ref:.1f}), load droop {droop:.2f} (predicted {pred_droop:.2f})")
    assert abs(e_ref - pred_ref) < 0.05 and abs(droop - pred_droop) < 0.05

test_closed_loop_stable()
test_zero_error_with_integral()
test_p_only_leaves_offsets()
print("PASS")
