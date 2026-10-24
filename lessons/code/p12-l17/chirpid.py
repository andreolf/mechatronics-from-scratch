import numpy as np
from scipy import signal

fn, zeta = 5.0, 0.15
wn = 2 * np.pi * fn
num, den = [wn ** 2], [1, 2 * zeta * wn, wn ** 2]
fs, T, NSEG = 1000.0, 60.0, 8192
t = np.arange(0, T, 1 / fs)
u = signal.chirp(t, 0.2, T, 30, method="logarithmic")
y_clean = signal.lsim((num, den), u, t)[1]

def etfe(u, y):
    f, Suu = signal.welch(u, fs, nperseg=NSEG)
    _, Suy = signal.csd(u, y, fs, nperseg=NSEG)
    _, Syy = signal.welch(y, fs, nperseg=NSEG)
    return f, Suy / Suu, np.abs(Suy) ** 2 / (Suu * Syy), Syy / np.conj(Suy)

def true_H(f):
    return signal.freqs(num, den, worN=2 * np.pi * f)[1]

def test_matches_true_plant_in_band():
    worst_db = worst_ph = 0
    for seed in range(5):
        y = y_clean + np.random.default_rng(seed).normal(0, 0.05, t.size)
        f, H, coh, _ = etfe(u, y)
        band = (f >= 0.5) & (f <= 10)
        Ht = true_H(f[band])
        worst_db = max(worst_db, np.max(np.abs(20 * np.log10(np.abs(H[band]) / np.abs(Ht)))))
        worst_ph = max(worst_ph, np.max(np.abs(np.degrees(np.angle(H[band] / Ht)))))
        assert coh[band].min() > 0.9
    print(f"0.5-10 Hz, 5 noisy runs: worst magnitude error {worst_db:.2f} dB, worst phase error {worst_ph:.1f} deg")
    assert worst_db < 1.0 and worst_ph < 5.0

def test_resonance_found():
    y = y_clean + np.random.default_rng(7).normal(0, 0.05, t.size)
    f, H, _, _ = etfe(u, y)
    band = (f > 1) & (f < 10)
    fpk = f[band][np.argmax(np.abs(H[band]))]
    gpk = 20 * np.log10(np.abs(H[band]).max())
    print(f"measured peak {gpk:.1f} dB at {fpk:.2f} Hz (theory 10.6 dB at 4.89 Hz)")
    assert abs(fpk - fn * np.sqrt(1 - 2 * zeta ** 2)) < 0.15 and abs(gpk - 10.56) < 1.0

def test_coherence_flags_noisy_band():
    y = y_clean + np.random.default_rng(1).normal(0, 0.05, t.size)
    f, _, coh, _ = etfe(u, y)
    assert coh[(f > 1) & (f < 8)].mean() > 0.97 and coh[(f > 22) & (f < 28)].mean() < 0.8

def test_input_noise_bias():
    rng = np.random.default_rng(3)
    um = u + rng.normal(0, 2.0, t.size)          # noisy input sensor
    y = y_clean + rng.normal(0, 0.01, t.size)
    f, H1, _, H2 = etfe(um, y)
    band = (f >= 1) & (f <= 8)
    r1 = np.median(np.abs(H1[band]) / np.abs(true_H(f[band])))
    r2 = np.median(np.abs(H2[band]) / np.abs(true_H(f[band])))
    print(f"with input noise: H1 reads {r1:.2f} of true, H2 reads {r2:.2f}")
    assert r1 < 0.85 and abs(r2 - 1) < 0.1

test_matches_true_plant_in_band()
test_resonance_found()
test_coherence_flags_noisy_band()
test_input_noise_bias()
print("PASS")
