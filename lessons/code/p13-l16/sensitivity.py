import numpy as np
from scipy.integrate import quad
from scipy.optimize import brentq

LOOPS = {
    "2/(s(s+1)(s+2))": lambda s: 2 / (s * (s + 1) * (s + 2)),
    "1/(s(s+1)(s+2))": lambda s: 1 / (s * (s + 1) * (s + 2)),
    "5/((s+1)^2)": lambda s: 5 / (s + 1) ** 2,
    "20/((s+1)(s+3))": lambda s: 20 / ((s + 1) * (s + 3)),
    "10/((s-1)(s+5))": lambda s: 10 / ((s - 1) * (s + 5)),
}
RHP = {"10/((s-1)(s+5))": [1.0]}

def S(L, w): return 1 / (1 + L(1j * w))
def T(L, w): return L(1j * w) / (1 + L(1j * w))

def bode_integral(L):
    f = lambda w: np.log(abs(S(L, w)))
    return sum(quad(f, a, b, limit=500)[0] for a, b in [(0, 1), (1, 10), (10, 100), (100, 1e4)]) + quad(f, 1e4, np.inf)[0]

def margins(L):
    w = np.logspace(-3, 3, 200001); r = L(1j * w)
    ph = np.unwrap(np.angle(r)); mag = np.abs(r)
    i = np.where((mag[:-1] >= 1) & (mag[1:] < 1))[0]
    pm = 180 + np.degrees(ph[i[0]]) if len(i) else np.inf
    j = np.where((ph[:-1] > -np.pi) & (ph[1:] <= -np.pi))[0]
    gm = 1 / mag[j[0]] if len(j) else np.inf
    return gm, pm

def test_s_plus_t():
    w = np.logspace(-2, 2, 1000)
    for L in LOOPS.values():
        assert np.max(np.abs(S(L, w) + T(L, w) - 1)) < 1e-12

def test_bode_integral():
    for name, L in LOOPS.items():
        val = bode_integral(L)
        expect = np.pi * sum(RHP.get(name, []))
        print(f"{name:18s}: integral of ln|S| = {val:+.4f} (theory {expect:+.4f})")
        assert abs(val - expect) < 2e-3

def test_peak_sensitivity_bounds_margins():
    w = np.logspace(-3, 3, 200001)
    for name, L in LOOPS.items():
        if name in RHP: continue                      # margins assume an open-loop stable plant
        Ms = np.max(np.abs(S(L, w)))
        gm, pm = margins(L)
        gm_b, pm_b = Ms / (Ms - 1), np.degrees(2 * np.arcsin(1 / (2 * Ms)))
        print(f"{name:18s}: Ms = {Ms:.3f}; GM {gm:.2f} >= {gm_b:.2f}, PM {pm:.1f} >= {pm_b:.1f}")
        assert gm >= gm_b - 1e-9 and pm >= pm_b - 1e-6

def test_waterbed():
    lo = lambda L: np.mean(np.log(np.abs(S(L, np.linspace(0.01, 0.2, 50)))))
    pk = lambda L: np.max(np.abs(S(L, np.logspace(-2, 2, 20000))))
    L1, L2 = LOOPS["1/(s(s+1)(s+2))"], LOOPS["2/(s(s+1)(s+2))"]
    assert lo(L2) < lo(L1) and pk(L2) > pk(L1)        # better at low frequency, worse peak

test_s_plus_t()
test_bode_integral()
test_peak_sensitivity_bounds_margins()
test_waterbed()
print("PASS")
