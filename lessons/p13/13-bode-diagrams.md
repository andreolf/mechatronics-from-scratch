---
id: p13-l13
minutes: 35
summary: A Bode diagram plots a transfer function's gain in decibels and its phase against log frequency, and because logs turn products into sums, any rational transfer function's plot is the sum of the plots of its simple factors. You derive the straight-line asymptotes of each factor and where they are most wrong, build exact and asymptotic Bode plots factor by factor, and test them against SciPy's independent frequency response computation.
---

## Products become sums

Factor a transfer function into a gain, integrators, real poles and zeros, and complex pairs:

$$G(s) = K\frac{\prod(s/z_i + 1)}{s^N\prod(s/p_j + 1)\prod\left(s^2/\omega_k^2 + 2\zeta_ks/\omega_k + 1\right)}.$$

Then $20\log_{10}|G| = \sum$ (dB of each factor) and $\angle G = \sum$ (phase of each factor). Draw each one and add.

## The asymptotes

| factor | magnitude asymptote | phase |
|---|---|---|
| $K$ | flat at $20\log_{10}K$ | 0° (or 180° if $K < 0$) |
| $1/s$ | −20 dB/decade through 0 dB at 1 rad/s | −90° |
| $1/(s/p + 1)$ | 0 dB, then −20 dB/dec after $p$ | 0° to −90°, −45° at $p$ |
| zero $(s/z + 1)$ | 0 dB, then +20 dB/dec after $z$ | 0° to +90° |
| complex pair | 0 dB, then −40 dB/dec after $\omega_k$ | 0° to −180°, −90° at $\omega_k$ |

The real-factor asymptote is worst at the corner, off by $10\log_{10}2 = 3.01$ dB. The complex pair's error at $\omega_k$ is $-20\log_{10}(2\zeta)$: +14 dB for $\zeta = 0.1$, so resonant pairs must be drawn with their peak.

:::figure widget=bodeasym caption="Exact Bode magnitude and phase of 1000(s + 1)/(s(s + 10)(s + 100)) with the straight-line asymptotes. Move a corner frequency and watch the asymptote's error stay at 3 dB at each real corner."
:::end

## Worked example

$G(s) = \dfrac{1000(s + 1)}{s(s + 10)(s + 100)} = \dfrac{1\cdot(s + 1)}{s(s/10 + 1)(s/100 + 1)}$, so $K = 1$ in Bode form.

1. Below 1 rad/s: integrator only, −20 dB/dec, 0 dB at 1 rad/s.
2. 1 to 10 rad/s: the zero cancels the slope: flat at 0 dB.
3. 10 to 100: −20 dB/dec, reaching −20 dB at 100 rad/s.
4. Above 100: −40 dB/dec.
5. Exact at 10 rad/s: $|G| = 1000\sqrt{101}/(10 \times \sqrt{200} \times \sqrt{10100}) = 0.707$, so −3.01 dB, against the asymptote's 0 dB: the zero at 1 and the pole at 100 almost cancel each other's small contributions there.

## Code it from scratch

:::code file=bode.py
```python
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
```
:::end

## Exercises

:::exercise
Sketch the asymptotic magnitude of $\dfrac{10}{(s + 1)(s/50 + 1)}$. What is it at 10 rad/s, and what is the exact value?
:::solution
Flat at 20 dB to 1 rad/s, then −20 dB/dec, so at 10 rad/s the asymptote reads 0 dB. Exactly: $10/(\sqrt{101}\sqrt{1.04}) = 0.976$, which is −0.21 dB. The error is small because 10 rad/s is a decade from the first corner and well below the second.
:::end

:::exercise
Why is the phase of a non-minimum-phase zero $(1 - s/z)$ different from $(1 + s/z)$ although the magnitudes match?
:::solution
$|1 - j\omega/z| = |1 + j\omega/z|$, but the angle is $-\arctan(\omega/z)$ instead of $+\arctan$. A right-half-plane zero adds lag like a pole while raising gain like a zero, which is what limits how fast such a loop can be (lesson p12-l12's robot).
:::end

## Quiz

:::quiz
- type: num
  q: Error in dB of a real-pole asymptote at its corner?
  answer: 3.01
  tol: 0.002
  unit: dB
  py: "10*__import__('math').log10(2)"
  explain: The exact gain there is 1/√2.
- type: num
  q: Resonant peak above the asymptote in dB for ζ = 0.1?
  answer: 13.98
  tol: 0.002
  unit: dB
  py: "-20*__import__('math').log10(0.2)"
  explain: −20 log₁₀(2ζ).
- type: num
  q: Exact gain in dB of the worked example at 10 rad/s?
  answer: -3.01
  tol: 0.01
  unit: dB
  py: "20*__import__('math').log10(1000*101**0.5/(10*200**0.5*10100**0.5))"
  explain: The corner's 3 dB; the other factors nearly cancel.
- type: num
  q: High-frequency slope in dB/decade of the worked example?
  answer: -40
  tol: 0
  unit: dB/dec
  py: "-20*(3-1)"
  explain: Three poles, one zero.
- type: mc
  q: Why do Bode plots add factor by factor?
  options:
    - the logarithm of a product is a sum of logarithms
    - frequencies add
    - the poles are real
    - scipy does it that way
  answer: 0
  explain: Phase adds directly too.
- type: mc
  q: A complex pair's phase at its natural frequency is…
  options:
    - −90°
    - −45°
    - −180°
    - 0°
  answer: 0
  explain: Half of its total −180°.
:::end
