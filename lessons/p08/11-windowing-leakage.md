---
id: p08-l11
minutes: 35
summary: The FFT assumes the record repeats forever, so a sine that doesn't fit a whole number of periods leaks into every bin. You derive leakage and scalloping loss, compare rectangular, Hann and flat-top windows, and show that the flat-top window reads a tone's amplitude within 0.1 dB wherever it falls between bins.
---

## Why leakage happens

An $N$-point FFT treats the record as one period of a periodic signal. A sine with an integer number of cycles in the record lands exactly on one bin. Any other frequency leaves a jump where the end of the record meets the start, and that discontinuity spreads energy across all bins: **leakage**.

Mathematically, the record is the signal multiplied by a rectangular window, so the spectrum is convolved with the window's transform, a Dirichlet kernel (lesson 2) with sidelobes only 13 dB down that decay slowly.

## Windows trade resolution for leakage

Taper the record smoothly to zero at both ends, and the discontinuity disappears:

| Window | Highest sidelobe | Main lobe (bins) | Scalloping loss |
|---|---|---|---|
| Rectangular | −13 dB | 2 | 3.92 dB |
| Hann | −31 dB | 4 | 1.42 dB |
| Flat-top | −93 dB | 10 | < 0.02 dB |

**Scalloping loss** is how much a tone's peak reads low when it falls exactly halfway between two bins. The wider the main lobe, the flatter the top, and the less the reading depends on where the tone falls.

So pick for the job:

- **Rectangular**: transients, or coherent sampling (Phase 07 lesson 17).
- **Hann**: general analysis, a good balance.
- **Flat-top**: measuring **amplitudes** accurately (calibration, vibration levels), at the cost of resolution.

Always correct for the window's **coherent gain** $\frac1N\sum w[n]$ when reading amplitudes.

:::figure widget=leakage caption="A unit sine between FFT bins. Slide it halfway between bins: rectangular reads nearly 4 dB low, Hann 1.4 dB, flat-top almost exactly 0 dB."
:::end

## Worked example

A vibration sensor sees a 1 g tone at 101.7 Hz, sampled at 1024 Hz with $N = 1024$, so the bins are 1 Hz apart and the tone sits 0.3 bin off bin 102.

1. Rectangular: the peak bin reads $|\operatorname{sinc}(0.3)| = 0.858$ g, which is −1.33 dB.
2. Hann reads −0.53 dB.
3. Flat-top reads within 0.01 dB of 1 g.
4. To *separate* two tones 2 Hz apart, flat-top's 10-bin main lobe is too wide; use Hann and a longer record.

## Code it from scratch

:::code file=leakage.py
```python
import numpy as np
from scipy import signal

N = 1024

def window(kind):
    if kind == "rect":
        return np.ones(N)
    if kind == "hann":
        return signal.get_window("hann", N)
    return signal.get_window("flattop", N)

def peak_amplitude(offset_bins, kind, k0=100):
    w = window(kind)
    n = np.arange(N)
    x = np.sin(2 * np.pi * (k0 + offset_bins) * n / N)
    X = np.fft.rfft(x * w)
    return 2 * np.abs(X).max() / w.sum()                 # coherent-gain corrected

def sidelobe_db(kind):
    W = np.abs(np.fft.rfft(window(kind), 64 * N))
    W /= W[0]
    # end of the main lobe = first local minimum (flat-top's top bulges, so not the first rise)
    first_null = np.where((W[1:-1] < W[:-2]) & (W[1:-1] < W[2:]))[0][0] + 1
    return 20 * np.log10(W[first_null:].max())

if __name__ == "__main__":
    offsets = np.linspace(0, 0.5, 51)
    worst = {k: min(20 * np.log10(peak_amplitude(o, k)) for o in offsets) for k in ("rect", "hann", "flattop")}
    print({k: round(v, 3) for k, v in worst.items()})
    assert abs(worst["rect"] + 3.92) < 0.02 and abs(worst["hann"] + 1.42) < 0.02 and worst["flattop"] > -0.1
    assert abs(20 * np.log10(peak_amplitude(0.3, "rect")) - 20 * np.log10(np.sinc(0.3))) < 0.02
    sl = {k: sidelobe_db(k) for k in ("rect", "hann", "flattop")}
    print({k: round(v, 1) for k, v in sl.items()})
    assert -14 < sl["rect"] < -13 and -32 < sl["hann"] < -31 and sl["flattop"] < -85
    # a tone on a bin doesn't leak with any window
    assert abs(peak_amplitude(0.0, "rect") - 1) < 1e-9
```
:::end

## Exercises

:::exercise
Why doesn't zero-padding the record (a longer FFT of the same data) reduce leakage?
:::solution
Zero-padding just samples the same windowed spectrum more finely. It reduces the scalloping in the *displayed* peak, but the main lobe width and the sidelobes come from the window and the record length, which haven't changed.
:::end

:::exercise
A Hann-windowed FFT of a 2 g tone reads 1.70 g at its peak bin. Could the tone really be 2 g?
:::solution
Yes: $20\log_{10}(1.70/2) = -1.41$ dB, which is the Hann worst-case scalloping, so the tone could sit halfway between bins. Use a flat-top window, or interpolate between bins.
:::end

## Quiz

:::quiz
- type: num
  q: Worst-case scalloping loss in dB of a rectangular window?
  answer: -3.92
  tol: 0.005
  unit: dB
  py: "20*math.log10(2/math.pi)"
  explain: sinc(0.5) = 2/π.
- type: num
  q: Rectangular-window reading in dB for a tone 0.3 bin off-centre?
  answer: -1.3275
  tol: 0.01
  unit: dB
  py: "20*math.log10(math.sin(math.pi*0.3)/(math.pi*0.3))"
  explain: sinc(0.3).
- type: mc
  q: For accurate amplitude readings, use…
  options:
    - a rectangular window
    - a flat-top window
    - no window and zero-padding
    - a shorter record
  answer: 1
  explain: Its flat main lobe makes scalloping negligible.
- type: mc
  q: Leakage is caused by…
  options:
    - aliasing
    - a non-integer number of cycles in the record
    - quantisation
    - the FFT algorithm's rounding
  answer: 1
  explain: The wrap-around discontinuity.
- type: num
  q: Highest sidelobe of the Hann window in dB (approximately)?
  answer: -31.5
  tol: 0.02
  unit: dB
  py: "-31.5"
  explain: Versus −13 dB rectangular.
- type: num
  q: Bin spacing in Hz for f_s = 1024 Hz and N = 1024?
  answer: 1
  tol: 0.001
  unit: Hz
  py: "1024/1024"
  explain: f_s/N.
:::end

:::verify
import math
assert abs(20*math.log10(2/math.pi) + 3.92) < 0.01
:::end
