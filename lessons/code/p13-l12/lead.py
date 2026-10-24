import numpy as np
from scipy import signal

w = np.logspace(-3, 3, 400001)

def margins(L):
    """gain crossover frequency and phase margin of a loop given as a function of s"""
    resp = L(1j * w)
    mag, ph = np.abs(resp), np.unwrap(np.angle(resp))
    i = np.where((mag[:-1] >= 1) & (mag[1:] < 1))[0][0]
    return w[i], 180 + np.degrees(ph[i])

G = lambda s: 1 / (s * (s + 1))
K = 10.0

def design_lead(G, K, pm_spec, extra=10.0):
    _, pm0 = margins(lambda s: K * G(s))
    phi = np.radians(pm_spec - pm0 + extra)
    alpha = (1 - np.sin(phi)) / (1 + np.sin(phi))
    mag = np.abs(K * G(1j * w))
    wm = w[np.argmin(np.abs(mag - np.sqrt(alpha)))]
    T = 1 / (wm * np.sqrt(alpha))
    return alpha, T, pm0

alpha, T, pm0 = design_lead(G, K, 50)
C = lambda s: (T * s + 1) / (alpha * T * s + 1)

def test_uncompensated():
    wc, pm = margins(lambda s: K * G(s))
    print(f"K G alone: crossover {wc:.2f} rad/s, PM {pm:.1f} deg")
    assert abs(pm - 17.96) < 0.05

def test_lead_meets_spec():
    wc, pm = margins(lambda s: K * C(s) * G(s))
    print(f"lead alpha = {alpha:.3f}, zero {1 / T:.2f}, pole {1 / (alpha * T):.2f} rad/s -> PM {pm:.1f} deg at {wc:.2f} rad/s")
    assert pm >= 50
    # cross-check the phase at crossover with scipy.signal.bode
    sys = signal.lti(K * np.array([T, 1]), np.polymul([alpha * T, 1], [1, 1, 0]))
    _, mag, ph = signal.bode(sys, w=[wc])
    assert abs(mag[0]) < 0.01 and abs(180 + ph[0] - pm) < 0.05
    # Kv unchanged: lim s * K C G = K
    s = 1e-7; assert abs(s * K * C(s) * G(s) - K) < 1e-5

def test_max_phase_formula():
    for a in (0.05, 0.2, 0.5):
        Tt = 1.0
        ph = np.degrees(np.angle((Tt * 1j * w + 1) / (a * Tt * 1j * w + 1)))
        i = np.argmax(ph)
        assert abs(w[i] - 1 / (Tt * np.sqrt(a))) / w[i] < 1e-3
        assert abs(np.sin(np.radians(ph[i])) - (1 - a) / (1 + a)) < 1e-6

def test_step_overshoot_reduced():
    t = np.linspace(0, 10, 20001)
    def overshoot(num, den):
        _, y = signal.step(signal.lti(num, np.polyadd(den, num)), T=t)
        return y.max() - 1
    os0 = overshoot([K], [1, 1, 0])
    os1 = overshoot(K * np.array([T, 1]), np.polymul([alpha * T, 1], [1, 1, 0]))
    print(f"step overshoot: {os0:.0%} without lead, {os1:.0%} with")
    assert os1 < os0 / 2

def test_lag_raises_kv_keeps_margin():
    _, pm1 = margins(G)                                      # K = 1
    beta, Tl = 10.0, 10.0
    Lag = lambda s: beta * (Tl * s + 1) / (beta * Tl * s + 1)
    _, pm2 = margins(lambda s: Lag(s) * G(s))
    print(f"lag: Kv 1 -> 10, PM {pm1:.1f} -> {pm2:.1f} deg")
    assert pm1 - pm2 < 8 and pm2 > 40

test_uncompensated()
test_lead_meets_spec()
test_max_phase_formula()
test_step_overshoot_reduced()
test_lag_raises_kv_keeps_margin()
print("PASS")
