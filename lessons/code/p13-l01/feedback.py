import numpy as np

tau, G0 = 0.5, 2.0
K = 10.0
L0 = K * G0
pre = (1 + L0) / L0                       # prefilter: nominal closed loop has unit DC gain

def simulate(Gtrue, closed, T=3.0, dt=1e-4, r=1.0):
    y, out = 0.0, []
    for _ in range(int(T / dt)):
        u = K * (pre * r - y) if closed else r / G0
        y += dt * (Gtrue * u - y) / tau    # first-order plant, exact enough at this step
        out.append(y)
    return np.array(out)

def test_closed_loop_error_ten_times_smaller():
    for change in (+0.3, -0.3):
        Gt = G0 * (1 + change)
        e_open = abs(simulate(Gt, False)[-1] - 1)
        e_closed = abs(simulate(Gt, True)[-1] - 1)
        Lt = K * Gt
        predicted = abs(Lt / (1 + Lt) * pre - 1)
        print(f"plant gain {change:+.0%}: open-loop error {e_open:.1%}, closed-loop {e_closed:.2%} (predicted {predicted:.2%}), {e_open / e_closed:.0f}x smaller")
        assert abs(e_closed - predicted) < 1e-4
        assert e_open / e_closed > 10

def test_sensitivity_formula():
    for L in (1.0, 5.0, 20.0, 100.0):
        T = lambda g: g * L / (1 + g * L)
        d = 1e-6
        rel = (T(1 + d) - T(1 - d)) / (2 * d) / T(1)
        assert abs(rel - 1 / (1 + L)) < 1e-8

def test_faster():
    y = simulate(G0, True, T=0.5)
    t63 = np.argmax(y > 0.632 * y[-1]) * 1e-4
    print(f"closed-loop time constant {t63 * 1000:.1f} ms (predicted {tau / (1 + L0) * 1000:.1f} ms)")
    assert abs(t63 - tau / (1 + L0)) < 5e-4

test_closed_loop_error_ten_times_smaller()
test_sensitivity_formula()
test_faster()
print("PASS")
