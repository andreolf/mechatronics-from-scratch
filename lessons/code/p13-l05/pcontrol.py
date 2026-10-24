import numpy as np
from scipy import signal

R, L, k, J, b = 1.2, 0.002, 0.05, 2e-4, 2e-5
a = np.array([L * J, L * b + R * J, R * b + k * k])       # G = k / a(s)
G0 = k / a[2]

def closed_loop(Kp):
    return signal.lti([Kp * a[2]], a + np.array([0, 0, Kp * a[2]]))

def step_metrics(Kp):
    t = np.linspace(0, 2.0, 100001)
    _, y = signal.step(closed_loop(Kp), T=t)
    final = Kp / (1 + Kp)
    return 1 - y[-1], max(0.0, (y.max() - final) / final)

def test_steady_error_type0():
    for Kp in (0.5, 2, 10, 27.5, 100):
        e, _ = step_metrics(Kp)
        print(f"Kp = {Kp:6.1f}: steady error {e:.5f}, 1/(1 + Kp) = {1 / (1 + Kp):.5f}")
        assert abs(e - 1 / (1 + Kp)) < 1e-6

def test_pole_movement():
    s = -a[1] / a[0]
    for Kp in (0, 5, 20, 80):
        p = np.roots(a + np.array([0, 0, Kp * a[2]]))
        assert abs(p.sum().real - s) < 1e-6                     # sum fixed
    Kb = a[1] ** 2 / (4 * a[0] * a[2]) - 1
    print(f"open-loop poles {np.round(np.roots(a), 2)}, they meet at Kp = {Kb:.2f}")
    assert np.all(np.abs(np.roots(a + [0, 0, (Kb + 1e-6) * a[2]]).imag) < 1)
    assert np.all(np.abs(np.roots(a + [0, 0, (Kb + 0.5) * a[2]]).imag) > 10)

def test_overshoot_grows_with_gain():
    os_prev = -1
    for Kp in (15, 27.5, 50, 100, 200):
        _, os = step_metrics(Kp)
        assert os > os_prev; os_prev = os
    wn = a[1] / a[0] / (2 * 0.7071)
    Kp = wn ** 2 * a[0] / a[2] - 1
    _, os = step_metrics(Kp)
    print(f"Kp for zeta 0.707: {Kp:.1f}, overshoot {os * 100:.2f} % (theory 4.32 %)")
    assert abs(Kp - 27.5) < 0.1 and abs(os - 0.0432) < 0.001

test_steady_error_type0()
test_pole_movement()
test_overshoot_grows_with_gain()
print("PASS")
