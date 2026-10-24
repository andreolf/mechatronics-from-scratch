import numpy as np
from scipy.optimize import least_squares
from scipy import signal

t = np.arange(0, 1.0, 1e-3)

def first_order(t, K, tau, U=1.0):
    return K * U * (1 - np.exp(-t / tau))

def second_order(t, K, zeta, wn):
    return signal.step(signal.lti([K * wn ** 2], [1, 2 * zeta * wn, wn ** 2]), T=t)[1]

def smooth(y, n=15):
    return np.convolve(y, np.ones(n) / n, mode="same")

def hand_first(t, y, U=1.0):
    yinf = y[-200:].mean()
    ys = smooth(y); k = np.argmax(ys > 0.632 * yinf)
    tc = t[k - 1] + (0.632 * yinf - ys[k - 1]) / (ys[k] - ys[k - 1]) * (t[k] - t[k - 1])
    return yinf / U, tc

def hand_second(t, y):
    yinf = y[-200:].mean()
    ys = smooth(y, 9); k = np.argmax(ys)
    a, b, _ = np.polyfit(t[k - 8:k + 9], ys[k - 8:k + 9], 2)   # parabola through the peak
    tp = -b / (2 * a); Mp = (np.polyval([a, b, _], tp) - yinf) / yinf
    zeta = -np.log(Mp) / np.sqrt(np.pi ** 2 + np.log(Mp) ** 2)
    return yinf, zeta, np.pi / (tp * np.sqrt(1 - zeta ** 2))

def fit(model, t, y, p0):
    return least_squares(lambda p: model(t, *p) - y, p0).x

def test_first_order():
    K, tau = 20.0, 0.12
    worst_hand = worst_fit = 0
    for seed in range(20):
        y = first_order(t, K, tau) + np.random.default_rng(seed).normal(0, 0.2, t.size)
        Kh, th = hand_first(t, y)
        Kf, tf = fit(first_order, t, y, [Kh, th])
        worst_hand = max(worst_hand, abs(Kh / K - 1), abs(th / tau - 1))
        worst_fit = max(worst_fit, abs(Kf / K - 1), abs(tf / tau - 1))
    print(f"first order, 20 noisy logs: worst hand error {worst_hand * 100:.2f} %, worst fit error {worst_fit * 100:.2f} %")
    assert worst_hand < 0.05 and worst_fit < 0.01

def test_second_order():
    K, zeta, wn = 1.0, 0.3, 25.0
    y0 = second_order(t, K, zeta, wn)
    Mp = (y0.max() - 1); tp = t[np.argmax(y0)]
    assert abs(Mp - np.exp(-np.pi * zeta / np.sqrt(1 - zeta ** 2))) < 2e-3
    worst_hand = worst_fit = 0
    for seed in range(20):
        y = y0 + np.random.default_rng(100 + seed).normal(0, 0.01, t.size)
        h = hand_second(t, y)
        f = fit(second_order, t, y, h)
        worst_hand = max(worst_hand, *(abs(a / b - 1) for a, b in zip(h, (K, zeta, wn))))
        worst_fit = max(worst_fit, *(abs(a / b - 1) for a, b in zip(f, (K, zeta, wn))))
    print(f"second order, 20 noisy logs: worst hand error {worst_hand * 100:.2f} %, worst fit error {worst_fit * 100:.2f} %")
    assert worst_hand < 0.05 and worst_fit < 0.01

def test_wrong_model_shows_in_residuals():
    # a first-order fit to second-order data leaves structured residuals, the cue to add an order
    y = second_order(t, 1.0, 0.3, 25.0) + np.random.default_rng(9).normal(0, 0.01, t.size)
    p = fit(first_order, t, y, [1.0, 0.05])
    r = y - first_order(t, *p)
    assert np.std(r) > 5 * 0.01

test_first_order()
test_second_order()
test_wrong_model_shows_in_residuals()
print("PASS")
