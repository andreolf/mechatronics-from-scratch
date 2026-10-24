import numpy as np
from scipy.optimize import brentq

K0 = 2.0
L = lambda s, K=K0: K / (s * (s + 1) * (s + 2))
A = np.array([[0, 1, 0], [0, 0, 1], [0, -2, -3.0]]); B = np.array([0, 0, 1.0]); C = np.array([1.0, 0, 0])   # 1/(s(s+1)(s+2))

def margins(L):
    w180 = brentq(lambda w: np.unwrap([np.angle(L(1j * x)) for x in np.linspace(1e-3, w, 200)])[-1] + np.pi, 0.1, 10)
    wc = brentq(lambda w: abs(L(1j * w)) - 1, 1e-3, 10)
    return 1 / abs(L(1j * w180)), w180, 180 + np.degrees(np.angle(L(1j * wc))), wc

def growth(K, delay=0.0, T=80.0, dt=1e-3):
    """simulate u = -K y with a dead time; ratio of late to early oscillation size"""
    x = np.array([0.1, 0, 0]); nd = int(round(delay / dt)); buf = [0.0] * (nd + 1); ys = []
    f = lambda x, u: A @ x + B * u
    for _ in range(int(T / dt)):
        buf.append(-K * (C @ x)); u = buf.pop(0)
        k1 = f(x, u); k2 = f(x + dt / 2 * k1, u); k3 = f(x + dt / 2 * k2, u); k4 = f(x + dt * k3, u)
        x = x + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4); ys.append(C @ x)
    ys = np.abs(np.array(ys)); n = len(ys)
    return ys[3 * n // 4:].max() / ys[n // 4:n // 2].max()

GM, w180, PM, wc = margins(L)
tau_max = np.radians(PM) / wc

def test_margins():
    print(f"GM = {GM:.4f} ({20 * np.log10(GM):.2f} dB) at {w180:.4f} rad/s; PM = {PM:.2f} deg at {wc:.4f} rad/s; delay margin {tau_max:.3f} s")
    assert abs(GM - 3) < 1e-6 and abs(w180 - np.sqrt(2)) < 1e-6 and abs(PM - 32.61) < 0.01

def test_unstable_at_predicted_gain():
    g_lo, g_hi = growth(0.97 * GM * K0), growth(1.03 * GM * K0)
    print(f"gain x{0.97 * GM:.2f}: oscillation ratio {g_lo:.2f}; gain x{1.03 * GM:.2f}: {g_hi:.2f}")
    assert g_lo < 1 < g_hi

def test_unstable_at_predicted_delay():
    g_lo, g_hi = growth(K0, delay=0.95 * tau_max), growth(K0, delay=1.05 * tau_max)
    print(f"delay {0.95 * tau_max:.3f} s: ratio {g_lo:.2f}; delay {1.05 * tau_max:.3f} s: ratio {g_hi:.2f}")
    assert g_lo < 1 < g_hi

test_margins()
test_unstable_at_predicted_gain()
test_unstable_at_predicted_delay()
print("PASS")
