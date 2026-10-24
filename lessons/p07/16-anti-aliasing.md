---
id: p07-l16
minutes: 35
summary: Once sampled, an alias can't be told apart from a real signal, so it must be removed before the ADC. You derive the attenuation needed for a 12-bit, 1 kHz system, pick a Butterworth order and corner, and verify that an out-of-band tone aliases to less than 1 LSB.
---

## Aliases can't be undone

Sampling at $f_s$ folds every frequency onto the band $[0, f_s/2]$ (Phase 03): a tone at $f$ appears at $|f - k f_s|$ for the nearest integer $k$. Sampling at 1 kHz, a 900 Hz vibration lands at 100 Hz, right in the band you care about, and no digital filter can remove it afterwards, because it *is* a 100 Hz signal now.

So filter in the analogue domain, before the ADC: an **anti-aliasing filter**.

## How much attenuation?

Say the signal band is 0 to $f_p$ and anything up to full scale may appear above it. The frequencies that alias *into* the band start at $f_s - f_p$. To keep an alias below **1 LSB** of an $N$-bit converter, a full-scale tone at $f_s - f_p$ must be attenuated by

$$A \ge 20\log_{10}\frac{\text{full-scale amplitude}}{1\text{ LSB}} = 20\log_{10}2^{N-1} \approx 6.02(N-1)\text{ dB}.$$

That's 66.2 dB for 12 bits.

A Butterworth low-pass of order $n$ and corner $f_c$ attenuates by $10\log_{10}\left(1 + (f/f_c)^{2n}\right)$, roughly $20n$ dB per decade. The design trade-off:

- **Raise the order**: steeper, but more parts and more phase lag in a control loop (Phase 08).
- **Oversample**: sample faster, so $f_s - f_p$ moves far from $f_p$, then filter and decimate digitally (Phase 08 lesson 12). This is the usual modern answer: a simple RC plus a fast ADC.

:::figure widget=aaf caption="A Butterworth anti-aliasing filter for 1 kHz sampling. The amber line is f_s/2; the readout checks the attenuation at f_s − f_c, which folds onto the passband edge."
:::end

## Worked example

Sample at 1 kHz with 12 bits; the passband is 0–100 Hz.

1. Required attenuation at $1000 - 100 = 900$ Hz: 66.2 dB.
2. With $f_c = 100$ Hz, $(f/f_c) = 9$: order $n$ gives $20n\log_{10}9 = 19.1n$ dB. So $n \ge 66.2/19.1 = 3.47$: a 4th-order filter (76.3 dB).
3. Oversampling at 10 kHz instead, the first alias into the band starts at 9.9 kHz. A 2nd-order filter at 100 Hz gives $40\log_{10}99 = 79.9$ dB there.
4. The 4th-order filter is −3 dB at 100 Hz. If the passband must be flatter, raise $f_c$ and the order together.

## Code it from scratch

:::code file=anti_alias.py
```python
import numpy as np
from scipy import signal

FS, BITS, FP = 1000.0, 12, 100.0

def attenuation_db(order, fc, f):
    b, a = signal.butter(order, 2 * np.pi * fc, analog=True)
    _, h = signal.freqs(b, a, worN=[2 * np.pi * f])
    return -20 * np.log10(abs(h[0]))

def aliased_amplitude_lsb(order, fc, f_tone, amp=1.0):
    """Sample a filtered full-scale tone (steady state) at FS, quantise, and measure what lands in-band."""
    b, a = signal.butter(order, 2 * np.pi * fc, analog=True)
    _, h = signal.freqs(b, a, worN=[2 * np.pi * f_tone])
    n = np.arange(4000)
    x = amp * abs(h[0]) * np.sin(2 * np.pi * f_tone * n / FS + np.angle(h[0]))
    lsb = 2 * amp / 2**BITS
    q = np.round(x / lsb) * lsb
    spec = np.abs(np.fft.rfft(q * np.hanning(len(q)))) / (len(q) / 4)   # amplitude, Hann-corrected
    f_alias = abs(f_tone - FS * round(f_tone / FS))
    k = int(round(f_alias / FS * len(q)))
    return spec[k - 2:k + 3].max() / lsb, f_alias

if __name__ == "__main__":
    need = 20 * np.log10(2 ** (BITS - 1))
    assert abs(need - 66.23) < 0.01
    orders = {n: attenuation_db(n, FP, FS - FP) for n in range(1, 7)}
    best = min(n for n, att in orders.items() if att >= need)
    print({n: round(v, 1) for n, v in orders.items()}, "-> minimum order", best)
    assert best == 4 and abs(orders[4] - 76.3) < 0.1
    amp4, fa = aliased_amplitude_lsb(4, FP, 900.0)
    amp2, _ = aliased_amplitude_lsb(2, FP, 900.0)
    print(f"900 Hz full-scale tone aliases to {fa:.0f} Hz: {amp4:.2f} LSB with 4th order, {amp2:.1f} LSB with 2nd order")
    assert fa == 100 and amp4 < 1 and amp2 > 1
    assert attenuation_db(2, FP, 9900) > 79
```
:::end

## Exercises

:::exercise
Why does the required attenuation apply at $f_s - f_p$ rather than at $f_s/2$?
:::solution
Frequencies between $f_s/2$ and $f_s - f_p$ alias to between $f_p$ and $f_s/2$, outside the band you use, so a digital filter can still remove them later. Only frequencies from $f_s - f_p$ upwards land inside the passband.
:::end

:::exercise
A first-order RC must give 66 dB at the first in-band alias, with the corner at 100 Hz. How fast must you sample?
:::solution
First order gives about 20 dB per decade, so you need about 3.3 decades: alias frequency ≈ $100\times10^{3.3} \approx 200$ kHz. Sample at about 200 kHz and decimate digitally.
:::end

## Quiz

:::quiz
- type: num
  q: Attenuation in dB needed to keep a full-scale alias below 1 LSB at 12 bits?
  answer: 66.227
  tol: 0.001
  unit: dB
  py: "20*math.log10(2**11)"
  explain: 20 log₁₀ 2^(N−1).
- type: num
  q: Frequency in Hz where 900 Hz appears when sampled at 1 kHz?
  answer: 100
  tol: 0.001
  unit: Hz
  py: "1000-900"
  explain: It folds about f_s/2.
- type: num
  q: Attenuation in dB of a 4th-order Butterworth (f_c = 100 Hz) at 900 Hz?
  answer: 76.335
  tol: 0.002
  unit: dB
  py: "10*math.log10(1+9**8)"
  explain: 10 log₁₀(1 + (f/f_c)^(2n)).
- type: mc
  q: An alias already in the sampled data can be removed by…
  options:
    - a digital low-pass filter
    - nothing: it's indistinguishable from a real signal
    - a higher ADC resolution
    - averaging
  answer: 1
  explain: Filter before sampling.
- type: num
  q: Minimum Butterworth order for 66.2 dB at 9× the corner?
  answer: 4
  tol: 0.001
  py: "math.ceil(66.23/(20*math.log10(9)))"
  explain: About 19.1 dB per order.
- type: mc
  q: The usual modern alternative to a steep analogue filter is…
  options:
    - a slower ADC
    - oversampling, then digital filtering and decimation
    - removing the filter
    - a higher reference voltage
  answer: 1
  explain: Moves the aliases far away.
:::end

:::verify
import math
assert abs(40*math.log10(99) - 79.83) < 0.01
:::end
