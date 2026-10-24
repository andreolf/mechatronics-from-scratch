---
id: p08-l12
minutes: 40
summary: Oversampling is cheap and analogue filters are not, so sample fast and reduce the rate digitally. You derive why decimation needs an anti-aliasing filter first, build a polyphase decimator that computes only the outputs you keep, check it against filter-then-downsample, and verify that out-of-band tones alias by less than the specified level.
---

## Downsampling folds again

Keeping every $M$-th sample, $y[m] = x[mM]$, lowers the rate to $f_s/M$, and everything between the new Nyquist $f_s/(2M)$ and the old one folds back into the band, exactly as analogue sampling did (Phase 07 lesson 16). So first **low-pass to below $f_s/(2M)$**, then downsample. That's **decimation**.

The usual pattern: a cheap RC in front of an ADC sampling at, say, 8× the needed rate, a steep digital FIR, then decimation by 8. The digital filter has exact, repeatable coefficients, and the oversampling also buys resolution (Phase 07 lesson 17).

**Interpolation** is the mirror image: insert $L - 1$ zeros between samples, then low-pass to remove the images.

## Polyphase: don't compute what you throw away

Filtering at the high rate and then discarding $M - 1$ of every $M$ outputs wastes $(M-1)/M$ of the work. Split the filter into $M$ **polyphase components** $h_p[k] = h[kM + p]$, and the input into $M$ phases $x_p[m] = x[mM - p]$. Then

$$y[m] = \sum_{p=0}^{M-1}\sum_k h_p[k]\,x_p[m-k].$$

Each branch runs at the *low* rate. The result is identical to filter-then-downsample, at $1/M$ of the cost.

:::figure widget=decimate caption="A 50 Hz and a 420 Hz tone sampled at 1 kHz, decimated by M. Without the filter, 420 Hz folds into the new band; with it, the alias is buried."
:::end

## Worked example

Decimate from 8 kHz to 1 kHz ($M = 8$) keeping 0–400 Hz with aliases below −60 dB.

1. New Nyquist: 500 Hz. Anything at or above $1000 - 400 = 600$ Hz would alias into the 0–400 Hz band.
2. Filter: pass to 400 Hz, stop from 600 Hz, 60 dB. Kaiser (lesson 4): $\Delta f = 200/8000 = 0.025$, so $N \approx 52/(2.285\cdot2\pi\cdot0.025) + 1 = 146$ taps.
3. Direct: 146 multiplies per *input* sample, $1.17$ M/s. Polyphase: 146 per *output*, 146 k/s, 8× less.
4. A 1 V tone at 1.7 kHz would alias to 300 Hz; after the filter it's below 1 mV.

## Code it from scratch

:::code file=decimate.py
```python
import numpy as np
from scipy import signal

def polyphase_decimate(x, h, M):
    h = np.concatenate([h, np.zeros((-len(h)) % M)])           # pad to a multiple of M
    K = len(h) // M
    n_out = len(x) // M
    y = np.zeros(n_out)
    xp = np.concatenate([np.zeros(len(h)), x])                   # history for the start
    for p in range(M):
        hp = h[p::M]                                             # p-th polyphase component
        # branch input: x[mM - p] for m = 0..n_out-1 (offset by the padding)
        xb = xp[len(h) - p: len(h) - p + n_out * M: M]
        hist = xp[len(h) - p - (K - 1) * M: len(h) - p: M][:K - 1] if K > 1 else np.array([])
        y += np.convolve(np.concatenate([hist, xb]), hp, mode="valid")[:n_out]
    return y

if __name__ == "__main__":
    fs, M = 8000.0, 8
    beta = 0.1102 * (60 - 8.7)
    n_taps = int(np.ceil(52 / (2.285 * 2 * np.pi * 0.025) + 1)) | 1
    h = signal.firwin(n_taps, 500, window=("kaiser", beta), fs=fs)
    print("taps:", n_taps)
    rng = np.random.default_rng(12)
    x = rng.standard_normal(8000)
    y_ref = signal.lfilter(h, 1, x)[::M]
    y = polyphase_decimate(x, h, M)
    assert np.allclose(y, y_ref, atol=1e-12)
    # alias check: tones that would fold into 0-400 Hz are attenuated by more than 60 dB
    t = np.arange(80_000) / fs
    worst = -np.inf
    for f in (600, 900, 1700, 2600, 3900):
        tone = np.sin(2 * np.pi * f * t)
        out = polyphase_decimate(tone, h, M)[2000:]
        worst = max(worst, 20 * np.log10(np.abs(out).max()))
    inband = polyphase_decimate(np.sin(2 * np.pi * 300 * t), h, M)[2000:]
    print(f"worst aliased level {worst:.1f} dB, 300 Hz passes at {20*np.log10(np.abs(inband).max()):.2f} dB")
    assert worst < -60 and abs(20 * np.log10(np.abs(inband).max())) < 0.1
    # without the filter, 1.7 kHz folds onto 300 Hz at full amplitude
    folded = np.sin(2 * np.pi * 1700 * t)[::M]
    spec = np.abs(np.fft.rfft(folded[:1000])) / 500
    assert abs(np.argmax(spec) - 300) <= 1 and spec.max() > 0.9
```
:::end

## Exercises

:::exercise
Decimating by 64 in one stage needs a very long filter. Why do two stages of 8 help?
:::solution
The filter length scales with $f_s/\Delta f$. The first stage can have a wide transition (only aliases into the *final* band matter, and stage 2 removes the rest), so it's short; the second runs at 1/8 of the rate, so its long filter costs 8× less per tap. The total work drops by roughly an order of magnitude.
:::end

:::exercise
Why must interpolation filter *after* inserting zeros?
:::solution
Inserting zeros keeps the original spectrum but adds images at multiples of the old sampling rate. The low-pass removes those images, leaving a smooth higher-rate signal, with the gain scaled by $L$.
:::end

## Quiz

:::quiz
- type: num
  q: New Nyquist frequency in Hz after decimating 8 kHz by 8?
  answer: 500
  tol: 0.001
  unit: Hz
  py: "8000/8/2"
  explain: f_s/(2M).
- type: num
  q: Lowest input frequency in Hz that aliases into 0–400 Hz after decimating to 1 kHz?
  answer: 600
  tol: 0.001
  unit: Hz
  py: "1000-400"
  explain: f_s,new − f_pass.
- type: num
  q: Where in Hz does 1.7 kHz land after downsampling to 1 kHz without filtering?
  answer: 300
  tol: 0.001
  unit: Hz
  py: "abs(1700-2*1000)"
  explain: It folds to |1700 − 2000|.
- type: num
  q: Work saved by polyphase decimation by M = 8 (factor)?
  answer: 8
  tol: 0.001
  py: "8"
  explain: Only kept outputs are computed.
- type: mc
  q: Decimation means…
  options:
    - downsample, then filter
    - low-pass filter, then downsample
    - insert zeros, then filter
    - only downsample
  answer: 1
  explain: Filter first, or aliases are permanent.
- type: num
  q: Kaiser length estimate for 60 dB with Δf = 0.025 (before rounding)?
  answer: 145.87
  tol: 0.002
  py: "52/(2.285*2*math.pi*0.025)+1"
  explain: From lesson 4.
:::end

:::verify
assert abs(1700 - 2*1000) == 300
:::end
