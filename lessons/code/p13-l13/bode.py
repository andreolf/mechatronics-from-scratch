import numpy as np
from scipy import signal

# Bode form: gain, number of integrators, real zeros, real poles, complex pole pairs (wn, zeta)
F = dict(K=1.0, N=1, zeros=[1.0], poles=[10.0, 100.0], pairs=[])
num, den = 1000 * np.array([1, 1.0]), np.polymul([1, 0], np.polymul([1, 10], [1, 100]))

def factor_bode(F, w):
    """exact magnitude (dB) and phase (deg) as sums of factor contributions"""
    s = 1j * w
    mag = np.full_like(w, 20 * np.log10(abs(F["K"]))); ph = np.full_like(w, 0.0 if F["K"] > 0 else 180.0)
    mag -= 20 * F["N"] * np.log10(w); ph -= 90 * F["N"]
    for z in F["zeros"]: mag += 20 * np.log10(np.abs(s / z + 1)); ph += np.degrees(np.arctan(w / z))
    for p in F["poles"]: mag -= 20 * np.log10(np.abs(s / p + 1)); ph -= np.degrees(np.arctan(w / p))
    for wn, z in F["pairs"]:
        q = (s / wn) ** 2 + 2 * z * s / wn + 1
        mag -= 20 * np.log10(np.abs(q)); ph -= np.degrees(np.arctan2(2 * z * w / wn, 1 - (w / wn) ** 2))
    return mag, ph

def asymptote(F, w):
    mag = np.full_like(w, 20 * np.log10(abs(F["K"]))) - 20 * F["N"] * np.log10(w)
    for z in F["zeros"]: mag += np.where(w > z, 20 * np.log10(w / z), 0)
    for p in F["poles"]: mag -= np.where(w > p, 20 * np.log10(w / p), 0)
    for wn, _ in F["pairs"]: mag -= np.where(w > wn, 40 * np.log10(w / wn), 0)
    return mag

w = np.logspace(-2, 4, 2001)

def test_matches_scipy():
    mag, ph = factor_bode(F, w)
    _, m2, p2 = signal.bode(signal.lti(num, den), w=w)
    print(f"max differences from scipy.signal.bode: {np.max(np.abs(mag - m2)):.1e} dB, {np.max(np.abs(ph - p2)):.1e} deg")
    assert np.max(np.abs(mag - m2)) < 1e-9 and np.max(np.abs(ph - p2)) < 1e-6

def test_resonant_pair_matches_scipy():
    G2 = dict(K=5.0, N=0, zeros=[], poles=[2.0], pairs=[(30.0, 0.1)])
    mag, ph = factor_bode(G2, w)
    num2 = [5 * 2 * 900]; den2 = np.polymul([1, 2], [1, 6, 900])
    _, m2, p2 = signal.bode(signal.lti(num2, den2), w=w)
    assert np.max(np.abs(mag - m2)) < 1e-9 and np.max(np.abs(ph - p2)) < 1e-6
    err = factor_bode(dict(K=1, N=0, zeros=[], poles=[], pairs=[(30.0, 0.1)]), np.array([30.0]))[0][0]
    assert abs(err - (-20 * np.log10(0.2))) < 1e-9

def test_asymptote_error():
    single = dict(K=1, N=0, zeros=[], poles=[10.0], pairs=[])
    err = factor_bode(single, w)[0] - asymptote(single, w)
    print(f"worst asymptote error of one real pole: {np.max(np.abs(err)):.3f} dB at {w[np.argmax(np.abs(err))]:.2f} rad/s")
    assert abs(np.max(np.abs(err)) - 10 * np.log10(2)) < 1e-3
    mag = factor_bode(F, np.array([10.0]))[0][0]
    print(f"worked example at 10 rad/s: exact {mag:.2f} dB, asymptote 0 dB")
    assert abs(mag - (-3.01)) < 0.01

test_matches_scipy()
test_resonant_pair_matches_scipy()
test_asymptote_error()
print("PASS")
