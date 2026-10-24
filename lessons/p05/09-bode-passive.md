---
id: p05-l09
minutes: 35
summary: A Bode plot shows what a filter does to every frequency at once. You derive the RC low-pass and high-pass responses, sketch them with asymptotes, design an anti-alias filter, and see why two cascaded RC stages don't give a clean −40 dB/decade unless you buffer them.
---

## The RC low-pass

Take the output across C in a series RC driven by $V_{in}$. It's a divider of impedances (lesson 8):

$$H(j\omega) = \frac{1/(j\omega C)}{R + 1/(j\omega C)} = \frac{1}{1 + j\omega RC} = \frac{1}{1 + jf/f_c}, \qquad f_c = \frac{1}{2\pi RC}.$$

- Well below $f_c$: $|H| \approx 1$ (0 dB) and the phase is about 0°.
- At $f_c$: $|H| = 1/\sqrt2$ (−3.01 dB) and the phase is −45°.
- Well above $f_c$: $|H| \approx f_c/f$, falling at **−20 dB per decade**, and the phase approaches −90°.

A **Bode plot** draws $20\log_{10}|H|$ and the phase against log frequency. On those axes the asymptotes are straight lines meeting at $f_c$, so you can sketch it by hand (Phase 03 lesson 5 explains why poles give corners).

**The high-pass** takes the output across R instead: $H = \frac{jf/f_c}{1 + jf/f_c}$. It's the mirror image, rising at +20 dB/decade up to $f_c$ and flat above, with phase going from +90° to 0°.

**Cascading.** Two identical RC stages in a row don't give $1/(1 + jf/f_c)^2$, because the second stage loads the first. You get poles at $0.38f_c$ and $2.62f_c$ instead. Buffer between them with an op-amp follower, or use an active filter (lesson 17).

:::figure widget=bode caption="Bode plot of an RC low-pass. The asymptotes (dashed) meet at f_c, where the true curve is 3 dB down and the phase is −45°."
:::end

## Worked example

You sample a sensor at 10 kHz and need to suppress noise near 5 kHz before the ADC. Try $R = 3.3$ kΩ and $C = 100$ nF.

1. $f_c = 1/(2\pi\times3300\times10^{-7}) = 482.3$ Hz.
2. At 5 kHz: $|H| = 1/\sqrt{1 + (5000/482.3)^2} = 0.0960$, which is −20.4 dB, about what the asymptote predicts (one decade above $f_c$, −20 dB).
3. Phase at 4.823 kHz (10 $f_c$): $-\arctan10 = -84.3°$.
4. Is −20 dB enough? For a 12-bit ADC (Phase 08) you'd want tens of dB more, which is why anti-alias filters are often second or fourth order.

## Code it from scratch

:::code file=bode_rc.py
```python
import math
import numpy as np
from scipy import signal

def lowpass(f, R, C):
    return 1 / (1 + 1j * 2 * math.pi * f * R * C)

if __name__ == "__main__":
    R, C = 3.3e3, 100e-9
    fc = 1 / (2 * math.pi * R * C)
    assert abs(fc - 482.29) < 0.01
    assert abs(20 * math.log10(abs(lowpass(fc, R, C))) + 3.0103) < 1e-4
    assert abs(math.degrees(np.angle(lowpass(fc, R, C))) + 45) < 1e-9
    H5k = abs(lowpass(5000, R, C))
    print(f"fc = {fc:.1f} Hz, |H(5 kHz)| = {H5k:.4f} ({20*math.log10(H5k):.2f} dB)")
    assert abs(H5k - 0.09601) < 1e-5
    # slope far above fc is -20 dB/decade
    d = 20 * math.log10(abs(lowpass(1e6, R, C))) - 20 * math.log10(abs(lowpass(1e5, R, C)))
    assert abs(d + 20) < 0.01
    # agrees with scipy
    w = 2 * math.pi * np.logspace(1, 5, 50)
    _, Hs = signal.freqresp(signal.TransferFunction([1], [R * C, 1]), w)
    assert np.allclose(Hs, lowpass(w / (2 * math.pi), R, C))
    # unbuffered cascade of two identical stages: poles at 0.382 fc and 2.618 fc
    tau = R * C
    poles = np.roots([tau**2, 3 * tau, 1])
    assert np.allclose(sorted(-poles * tau), [0.381966, 2.618034], atol=1e-6)
```
:::end

## Exercises

:::exercise
Design an RC high-pass that removes a sensor's DC offset but passes 1 Hz motion with less than 1 dB loss. Choose $f_c$ and C for R = 1 MΩ.
:::solution
A high-pass has $|H| = \frac{f/f_c}{\sqrt{1 + (f/f_c)^2}}$. For −1 dB ($|H| = 0.891$) at 1 Hz: $f/f_c = 1.965$, so $f_c \le 0.509$ Hz. $C = 1/(2\pi\times10^6\times0.509) = 0.313$ µF; use 330 nF ($f_c = 0.48$ Hz).
:::end

:::exercise
Derive the cascade's denominator. Two stages R–C–R–C, with the output across the second C.
:::solution
Nodal analysis at the two capacitor nodes gives $H = \frac{1}{(sRC)^2 + 3sRC + 1}$. The 3 (rather than 2 for buffered stages) comes from the second R loading the first C. Its roots are at $s\tau = -0.382$ and $-2.618$.
:::end

## Quiz

:::quiz
- type: num
  q: What is fc in Hz for 3.3 kΩ and 100 nF?
  answer: 482.288
  tol: 0.001
  unit: Hz
  py: "1/(2*math.pi*3.3e3*100e-9)"
  explain: $1/(2\pi RC)$.
- type: num
  q: What is the gain in dB of that low-pass at 5 kHz?
  answer: -20.3535
  tol: 0.002
  unit: dB
  py: "-10*math.log10(1+(5000/482.2877)**2)"
  explain: $-10\log_{10}(1 + (f/f_c)^2)$.
- type: mc
  q: Far above f_c, an RC low-pass falls at…
  options:
    - −6 dB/decade
    - −20 dB/decade
    - −40 dB/decade
    - 0 dB/decade
  answer: 1
  explain: One pole means −20 dB/decade (−6 dB/octave).
- type: num
  q: What is the phase in degrees at f = 10 fc?
  answer: -84.2894
  tol: 0.001
  unit: °
  py: "-math.degrees(math.atan(10))"
  explain: $-\arctan(f/f_c)$.
- type: mc
  q: Two identical unbuffered RC low-pass stages in cascade…
  options:
    - have a double pole at f_c
    - have poles at about 0.38 f_c and 2.62 f_c
    - have no poles
    - act as a high-pass
  answer: 1
  explain: The second stage loads the first.
- type: num
  q: For a −1 dB high-pass at 1 Hz with R = 1 MΩ, what is the maximum C in µF?
  answer: 0.31275
  tol: 0.01
  unit: µF
  py: "1.9652/(2*math.pi*1e6)*1e6"
  explain: $f_c = 1/1.965$ Hz, then $C = 1/(2\pi Rf_c)$.
:::end

:::verify
import math
x = math.sqrt(1/(10**(-0.1))-1); r = 1/x
assert abs(r-1.9652)<1e-3 and abs(0.8913-10**(-0.05))<1e-4 and abs(1/(2*math.pi*1e6*330e-9)-0.48)<0.005
:::end
