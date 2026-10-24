---
id: p12-l17
minutes: 40
summary: A frequency response can be measured rather than derived, by exciting a plant with a chirp that sweeps through the band and dividing the cross-spectrum of input and output by the input's own spectrum. You derive the empirical transfer function estimate H = Syu/Suu and why it rejects output noise, use coherence to see where the measurement can be trusted, and test that a measured Bode plot of a resonant plant matches the true one within 1 dB across the band.
---

## The estimate

If $y = G * u + n$ with noise $n$ uncorrelated with $u$, then the cross power spectral density is

$$S_{uy}(f) = G(f)\,S_{uu}(f) + \underbrace{S_{un}(f)}_{\to 0}, \qquad \hat G_1(f) = \frac{S_{uy}(f)}{S_{uu}(f)}.$$

Output noise averages out of $S_{uy}$, so $\hat G_1$ is unbiased with noise on the output. Spectra are estimated by Welch's method: split the record into overlapping windowed segments, FFT each, and average $U^*Y$ and $U^*U$ across segments.

**Coherence** says how much of the output is explained linearly by the input:

$$\gamma^2(f) = \frac{|S_{uy}|^2}{S_{uu}S_{yy}} \in [0, 1].$$

Where $\gamma^2$ drops, noise dominates, and the estimate there isn't trustworthy.

If the **input** measurement is noisy too, $S_{uu}$ is inflated and $\hat G_1$ is biased low. Then $\hat G_2 = S_{yy}/S_{yu}$, biased high under output noise, gives a bracket.

## Designing the experiment

- A logarithmic **chirp** spends equal time per decade, matching a Bode plot's axis.
- Segment length sets frequency resolution, $\Delta f = f_s/N_{seg}$. It must resolve the resonance width, about $2\zeta f_n$.
- Excite enough to beat the noise but stay in the linear range (lesson 10).

:::figure widget=chirpbode caption="A measured Bode plot from chirp data, as dots over the true plant's curve, with coherence below. Add sensor noise and watch the high-frequency points scatter where coherence drops."
:::end

## Worked example

The plant is $G(s) = \omega_n^2/(s^2 + 2\zeta\omega_n s + \omega_n^2)$ with $f_n = 5$ Hz and $\zeta = 0.15$. The excitation is a 60 s log chirp from 0.2 to 30 Hz at $f_s = 1$ kHz, with output noise $\sigma = 0.05$ and 8192-sample segments.

1. Resolution: $1000/8192 = 0.12$ Hz, against a resonance width of $2 \times 0.15 \times 5 = 1.5$ Hz. Fine.
2. Peak gain: $1/(2\zeta\sqrt{1 - \zeta^2}) = 3.37$, or 10.6 dB, at $f_n\sqrt{1 - 2\zeta^2} = 4.89$ Hz.
3. At 20 Hz the plant gain is about 0.066, close to the noise level. Coherence falls there, so the trusted band is 0.5 to 10 Hz.

## Code it from scratch

:::code file=chirpid.py
```python
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
```
:::end

## Exercises

:::exercise
Why does averaging more segments reduce the variance of $\hat G_1$ but not remove the bias from input noise?
:::solution
Averaging shrinks the random cross terms $S_{un}$ towards zero, which reduces variance. Input noise adds its own power to $S_{uu}$ in every segment, so the denominator is consistently too large, $S_{uu} + S_{nn}$, and no amount of averaging fixes that. It's a bias, not a variance.
:::end

:::exercise
Your segments are 1024 samples at 1 kHz. Can you measure a resonance with $\zeta = 0.02$ at 5 Hz?
:::solution
The resonance is $2 \times 0.02 \times 5 = 0.2$ Hz wide, but the resolution is $1000/1024 = 0.98$ Hz. The peak would be smeared and under-read by many dB. You'd need segments of at least 8 to 10 s, with a record several times longer.
:::end

## Quiz

:::quiz
- type: num
  q: Frequency resolution in Hz with 8192-sample segments at 1 kHz?
  answer: 0.122
  tol: 0.005
  unit: Hz
  py: "1000/8192"
  explain: f_s/N_seg.
- type: num
  q: Peak gain in dB of a second-order plant with ζ = 0.15?
  answer: 10.56
  tol: 0.005
  unit: dB
  py: "20*__import__('math').log10(1/(2*0.15*(1-0.15**2)**0.5))"
  explain: 1/(2ζ√(1−ζ²)).
- type: num
  q: Approximate resonance width in Hz for f_n = 5 Hz, ζ = 0.15?
  answer: 1.5
  tol: 0.01
  unit: Hz
  py: "2*0.15*5"
  explain: 2ζf_n.
- type: num
  q: Coherence when the output is pure noise unrelated to the input?
  answer: 0
  tol: 0.01
  py: "0"
  explain: S_uy → 0.
- type: mc
  q: H1 = S_uy/S_uu is biased low when…
  options:
    - the input measurement is noisy
    - the output measurement is noisy
    - the plant is linear
    - the chirp is logarithmic
  answer: 0
  explain: Input noise inflates S_uu.
- type: mc
  q: What does low coherence at a frequency tell you?
  options:
    - noise or nonlinearity dominates, so don't trust the estimate there
    - the plant gain is exactly zero
    - the plant is unstable
    - the sample rate is too high
  answer: 0
  explain: Little of the output is linearly explained by the input.
:::end
