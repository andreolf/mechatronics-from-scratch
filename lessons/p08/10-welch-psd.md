---
id: p08-l10
minutes: 35
summary: A single periodogram of noise is as noisy as the noise itself, however long the record. Welch's method trades frequency resolution for statistical stability by averaging windowed, overlapping segments. You implement it with correct density scaling and match scipy.signal.welch.
---

## The periodogram's problem

The power spectral density (PSD) says how a signal's power is spread over frequency, in units²/Hz. The obvious estimate, $|X[k]|^2$ of the FFT of the whole record, scaled, is the **periodogram**. For noise, each bin's estimate has a standard deviation about *equal to its mean*, and a longer record only gives more bins, each just as noisy. It never converges.

## Welch's method

1. Split the record into segments of length $L$, overlapping by typically 50 %.
2. Remove each segment's mean, multiply by a window $w$ (Hann), and FFT it.
3. Scale each to a density: $P_k = |X_k|^2/(f_s\sum w^2)$, doubled for the one-sided spectrum except at DC and Nyquist.
4. Average over the $K$ segments.

The variance falls roughly as $1/K$ (a bit less with overlap, because segments are correlated), and the frequency resolution becomes $f_s/L$: you trade resolution for stability. The integral of the PSD over frequency equals the signal's variance (Parseval), which is the check that the scaling is right.

**Uses**: reading sensor noise floors in units/√Hz (a datasheet's noise density, Phase 07), finding vibration lines, checking a filter's effect, identifying a plant's frequency response (Phase 12).

:::figure widget=welch caption="PSD of white noise plus a 120 Hz tone. With one segment the noise floor scatters by about 100 %; average more segments and it settles onto the true level (amber)."
:::end

## Worked example

$f_s = 1$ kHz, white noise of σ = 0.1, a 10 s record.

1. The true one-sided PSD: $\sigma^2/(f_s/2) = 0.01/500 = 2\times10^{-5}$ units²/Hz, so the noise density is $\sqrt{2\times10^{-5}} = 4.5$ mUnits/√Hz.
2. With $L = 256$ at 50 % overlap: $K = \lfloor(10\,000 - 256)/128\rfloor + 1 = 77$ segments.
3. Resolution $1000/256 = 3.9$ Hz; scatter about $1/\sqrt{77/2} \approx 16$ %, allowing for overlap.
4. Integrating the PSD from 0 to 500 Hz returns 0.01, the variance.

## Code it from scratch

:::code file=welch.py
```python
import numpy as np
from scipy import signal

def welch_psd(x, fs, nperseg=256, overlap=0.5):
    step = int(nperseg * (1 - overlap))
    w = 0.5 - 0.5 * np.cos(2 * np.pi * np.arange(nperseg) / nperseg)       # periodic Hann, as scipy uses
    scale = 1.0 / (fs * np.sum(w ** 2))
    starts = range(0, len(x) - nperseg + 1, step)
    P = np.zeros(nperseg // 2 + 1)
    for s in starts:
        seg = x[s:s + nperseg]
        X = np.fft.rfft((seg - seg.mean()) * w)
        P += np.abs(X) ** 2 * scale
    P /= len(starts)
    P[1:-1] *= 2                                                           # one-sided: fold negative frequencies
    return np.fft.rfftfreq(nperseg, 1 / fs), P, len(starts)

if __name__ == "__main__":
    rng = np.random.default_rng(10)
    fs = 1000.0
    t = np.arange(10_000) / fs
    x = 0.1 * rng.standard_normal(t.size) + 0.05 * np.sin(2 * np.pi * 120 * t)
    f, P, K = welch_psd(x, fs)
    fs_ref, P_ref = signal.welch(x, fs, nperseg=256)
    assert K == 77 and np.allclose(f, fs_ref) and np.allclose(P, P_ref, rtol=1e-10)
    floor = np.median(P[(f > 20) & (np.abs(f - 120) > 20)])
    print(f"{K} segments, noise floor {floor:.2e} (theory 2.0e-05), tone peak at {f[np.argmax(P)]:.1f} Hz")
    assert abs(floor - 2e-5) / 2e-5 < 0.1 and abs(f[np.argmax(P)] - 120) < 4
    # Parseval: integrating the PSD of pure noise returns the variance
    n = 0.1 * rng.standard_normal(100_000)
    f2, P2, _ = welch_psd(n, fs)
    assert abs(np.trapezoid(P2, f2) - n.var()) / n.var() < 0.03
    # averaging tames the scatter: one segment vs many
    one = welch_psd(n[:256], fs)[1][5:-5]
    many = P2[5:-5]
    assert one.std() / one.mean() > 0.6 and many.std() / many.mean() < 0.1
```
:::end

## Exercises

:::exercise
You need to resolve two vibration lines 2 Hz apart at $f_s = 1$ kHz. What segment length is the minimum, and what does that cost?
:::solution
The resolution must be finer than 2 Hz, and a Hann window's main lobe is about 2 bins wide, so $L \ge 2\times1000/2 = 1000$, about 1024. For the same record length you get 4× fewer segments than with 256, so the floor is twice as noisy.
:::end

:::exercise
Why remove each segment's mean before windowing?
:::solution
A DC offset leaks through the window's main lobe into the lowest bins and can swamp the real low-frequency content. Detrending removes it.
:::end

## Quiz

:::quiz
- type: num
  q: One-sided PSD of white noise with σ = 0.1 at f_s = 1 kHz?
  answer: 0.00002
  tol: 0.001
  unit: units²/Hz
  py: "0.01/500"
  explain: σ²/(f_s/2).
- type: num
  q: Segments of 256 with 50 % overlap in 10 000 samples?
  answer: 77
  tol: 0.001
  py: "(10000-256)//128+1"
  explain: ⌊(N − L)/step⌋ + 1.
- type: num
  q: Frequency resolution in Hz for L = 256 at f_s = 1 kHz?
  answer: 3.9063
  tol: 0.001
  unit: Hz
  py: "1000/256"
  explain: f_s/L.
- type: mc
  q: A single periodogram of noise…
  options:
    - converges as the record gets longer
    - has scatter about equal to its mean, whatever the length
    - has zero variance
    - needs no window
  answer: 1
  explain: That's why we average.
- type: mc
  q: Integrating the PSD over all frequencies gives…
  options:
    - the variance (mean power)
    - the peak amplitude
    - zero
    - the sampling rate
  answer: 0
  explain: Parseval.
- type: num
  q: Noise density in units/√Hz for a PSD of 2e-5 units²/Hz?
  answer: 0.0044721
  tol: 0.002
  unit: units/√Hz
  py: "math.sqrt(2e-5)"
  explain: Square root of the PSD.
:::end

:::verify
assert (10000-256)//128 + 1 == 77
:::end
