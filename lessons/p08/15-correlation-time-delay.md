---
id: p08-l15
minutes: 35
summary: Two microphones hear the same sound at slightly different times, and the delay tells you where it came from. You find the delay as the peak of the cross-correlation, compute it fast with the FFT, refine it to a fraction of a sample by fitting a parabola through the top three points, and test it to within 0.1 sample in noise.
---

## Cross-correlation

If $b[n] = a[n - D] + \text{noise}$, then the cross-correlation

$$r_{ab}[k] = \sum_n b[n]\,a[n-k]$$

is the autocorrelation of the source shifted by $D$, so it peaks at $k = D$. Independent noise in the two channels averages out of the sum.

Computing it directly costs $O(N^2)$. With the FFT it costs $O(N\log N)$:

$$r_{ab} = \mathcal{F}^{-1}\!\left\{B[k]\,A^*[k]\right\},$$

after zero-padding both signals to at least $2N$ so the circular correlation doesn't wrap around.

## Sub-sample accuracy

The true delay is rarely an integer number of samples. Near its peak a smooth correlation looks like a parabola, so fit one through the peak sample $y_1$ at lag $k_1$ and its neighbours $y_0$ and $y_2$. Setting the parabola's derivative to zero gives

$$\hat D = k_1 + \frac{1}{2}\,\frac{y_0 - y_2}{y_0 - 2y_1 + y_2}.$$

The correction lies between −½ and ½. It is slightly biased toward integers, less so the smoother (more low-pass) the source. Whitening the spectra first (**GCC-PHAT**, which divides by $|B A^*|$) sharpens the peak in reverberant rooms.

:::figure widget=tde caption="Normalised cross-correlation of two noisy channels. Slide the true delay: the integer peak jumps, but the parabola's vertex tracks it smoothly."
:::end

## Worked example

Two microphones 0.20 m apart sample at 48 kHz; sound travels at 343 m/s.

1. The largest possible delay is $0.20/343 = 583$ µs, or 28 samples, so search lags −28 to 28 only.
2. The correlation peaks at lag 10 with neighbours $y_0 = 0.80$, $y_1 = 1.00$, $y_2 = 0.92$. The correction is $\tfrac12(0.80-0.92)/(0.80-2+0.92) = 0.214$, so $\hat D = 10.21$ samples.
3. That's $10.21/48000 = 212.8$ µs, a path difference of $7.30$ cm, so $\sin\theta = 0.0730/0.20$ and $\theta = 21.4°$ off broadside.

## Code it from scratch

:::code file=time_delay.py
```python
import numpy as np

def fractional_delay(x, d):
    """Delay x by d samples (any real d) with an exact FFT phase shift."""
    n = len(x)
    f = np.fft.rfftfreq(n)
    return np.fft.irfft(np.fft.rfft(x) * np.exp(-2j * np.pi * f * d), n)

def xcorr_fft(a, b):
    n = len(a)
    m = 1 << (2 * n - 1).bit_length()                  # pad: no wrap-around
    r = np.fft.irfft(np.fft.rfft(b, m) * np.conj(np.fft.rfft(a, m)), m)
    lags = np.r_[np.arange(0, n), np.arange(-n + 1, 0)]
    r = np.r_[r[:n], r[m - n + 1:]]
    order = np.argsort(lags)
    return lags[order], r[order]

def estimate_delay(a, b, max_lag):
    lags, r = xcorr_fft(a, b)
    keep = np.abs(lags) <= max_lag
    lags, r = lags[keep], r[keep]
    i = int(np.argmax(r))
    y0, y1, y2 = r[i - 1], r[i], r[i + 1]
    return lags[i] + 0.5 * (y0 - y2) / (y0 - 2 * y1 + y2)

if __name__ == "__main__":
    rng = np.random.default_rng(15)
    n = 4096
    # band-limited source: white noise through a gentle low-pass
    src = np.convolve(rng.standard_normal(n + 64), np.hanning(9), mode="same")[:n]
    src /= src.std()
    noise = 10 ** (-10 / 20)                            # 10 dB SNR per channel
    # check FFT correlation against the direct sum
    a0, b0 = rng.standard_normal(50), rng.standard_normal(50)
    lags, r = xcorr_fft(a0, b0)
    direct = [sum(b0[k + j] * a0[j] for j in range(50) if 0 <= k + j < 50) for k in lags]
    assert np.allclose(r, direct)
    worst = 0
    for d in np.linspace(-6, 6, 49):
        a = src + noise * rng.standard_normal(n)
        b = fractional_delay(src, d) + noise * rng.standard_normal(n)
        worst = max(worst, abs(estimate_delay(a, b, 28) - d))
    print(f"worst delay error over 49 delays at 10 dB SNR: {worst:.3f} samples")
    assert worst < 0.1
    # worked example
    D = 10 + 0.5 * (0.80 - 0.92) / (0.80 - 2 + 0.92)
    theta = np.degrees(np.arcsin(D / 48000 * 343 / 0.20))
    assert abs(D - 10.214) < 1e-3 and abs(theta - 21.4) < 0.1
```
:::end

## Exercises

:::exercise
Why must the correlation be zero-padded before using the FFT?
:::solution
Multiplying DFTs gives the *circular* correlation: lags past the end wrap around and add to lags at the start. Padding each signal to at least $2N - 1$ samples leaves room for every linear lag, so nothing overlaps.
:::end

:::exercise
A pure 1 kHz tone gives a correlation with peaks every 48 samples. What goes wrong, and what source helps?
:::solution
A periodic signal correlates equally well at every whole period, so the delay is ambiguous modulo 1 ms. You need a broadband source (noise, speech, clicks), whose autocorrelation has a single sharp peak, or a microphone spacing shorter than half a wavelength.
:::end

## Quiz

:::quiz
- type: num
  q: Maximum delay in samples for mics 0.20 m apart at 48 kHz (c = 343 m/s)?
  answer: 27.99
  tol: 0.002
  unit: samples
  py: "0.20/343*48000"
  explain: d/c·f_s.
- type: num
  q: Parabolic correction for y0 = 0.80, y1 = 1.00, y2 = 0.92?
  answer: 0.2143
  tol: 0.002
  unit: samples
  py: "0.5*(0.80-0.92)/(0.80-2+0.92)"
  explain: ½(y0 − y2)/(y0 − 2y1 + y2).
- type: num
  q: Angle in degrees for a 10.21-sample delay (same setup)?
  answer: 21.4
  tol: 0.005
  unit: °
  py: "math.degrees(math.asin(10.214/48000*343/0.20))"
  explain: sin θ = c·τ/d.
- type: num
  q: Parabolic correction when y0 = y2 (symmetric neighbours)?
  answer: 0
  tol: 0.001
  unit: samples
  py: "0"
  explain: The peak is exactly on the sample.
- type: mc
  q: The FFT computes correlation in…
  options:
    - O(N²)
    - O(N log N)
    - O(N)
    - O(log N)
  answer: 1
  explain: Two forward FFTs and one inverse.
- type: mc
  q: GCC-PHAT improves delay estimates by…
  options:
    - adding more noise
    - whitening the cross-spectrum to sharpen the peak
    - removing the zero-padding
    - using a rectangular window
  answer: 1
  explain: It divides by the magnitude, keeping only phase.
:::end

:::verify
import math
assert abs(math.degrees(math.asin(10.214/48000*343/0.20)) - 21.4) < 0.1
:::end
