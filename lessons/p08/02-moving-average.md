---
id: p08-l02
minutes: 30
summary: The moving average is the simplest low-pass filter and often the right one. You derive its Dirichlet-kernel frequency response, its nulls and its (N−1)/2 sample delay, and implement it in O(1) per sample with a running sum, checked against convolution with a box.
---

## Average the last N samples

$$y[n] = \frac1N\sum_{k=0}^{N-1} x[n-k].$$

It's an FIR filter with $h[k] = 1/N$. For white noise of variance $\sigma^2$, the output variance is $\sigma^2/N$ (Phase 04). For a step it's the fastest filter with that noise reduction, which is why it's the best smoother in the time domain.

## Frequency response

Summing the geometric series $\frac1N\sum_k e^{-j\omega k}$ gives

$$|H(e^{j\omega})| = \left|\frac{\sin(N\omega/2)}{N\sin(\omega/2)}\right|,$$

the **Dirichlet kernel**. Its features:

- **Nulls** at $f = k f_s/N$: averaging over exactly one period of a sinusoid cancels it. Choose $N$ to null mains hum or a known PWM frequency.
- **Cutoff**: −3 dB near $0.443\,f_s/N$.
- **Poor stopband**: the first sidelobe is only −13 dB. It's an excellent smoother but a poor frequency-selective filter (lesson 4 does better).
- **Linear phase**, with a constant delay of $(N-1)/2$ samples.

## O(1) per sample

Don't sum $N$ values every sample. Keep a running sum, add the newest and subtract the one leaving:

$$S[n] = S[n-1] + x[n] - x[n-N],\qquad y[n] = S[n]/N.$$

That needs a circular buffer of $N$ samples. With integers it's exact. In floating point the sum can slowly accumulate rounding error, so recompute it occasionally, or use integer or fixed-point samples.

:::figure widget=movavg caption="Magnitude response of an N-point moving average. The nulls fall at multiples of f_s/N; the sidelobes stay high."
:::end

## Worked example

Sample at 1 kHz and remove 50 Hz hum.

1. Nulls at $k f_s/N$: $N = 20$ puts the first null at exactly 50 Hz (and at 100, 150 Hz, …).
2. Delay: $(20 - 1)/2 = 9.5$ samples, 9.5 ms.
3. −3 dB at $0.443\times1000/20 = 22$ Hz, so it also removes signal above about 20 Hz.
4. White noise shrinks by $\sqrt{20} = 4.5\times$ in rms.

## Code it from scratch

:::code file=moving_average.py
```python
import numpy as np
from collections import deque

class MovingAverage:
    def __init__(self, n):
        self.n, self.buf, self.sum = n, deque([0.0] * n, maxlen=n), 0.0
    def __call__(self, x):
        self.sum += x - self.buf[0]
        self.buf.append(x)
        return self.sum / self.n

def dirichlet(f, n):                                   # f in cycles per sample
    w = 2 * np.pi * f
    return np.abs(np.sin(n * w / 2) / (n * np.sin(w / 2))) if f else 1.0

if __name__ == "__main__":
    rng = np.random.default_rng(2)
    x = rng.standard_normal(5000)
    n = 20
    ma = MovingAverage(n)
    y = np.array([ma(v) for v in x])
    ref = np.convolve(x, np.ones(n) / n)[:len(x)]
    assert np.allclose(y, ref)
    # frequency response from the impulse response matches the closed form
    H = np.fft.rfft(np.ones(n) / n, 4096)
    f = np.arange(len(H)) / 4096
    assert np.allclose(np.abs(H[1:]), [dirichlet(v, n) for v in f[1:]], atol=1e-9)
    # 50 Hz at fs = 1 kHz is nulled, and the delay is (N-1)/2 samples
    t = np.arange(4000) / 1000
    hum = np.sin(2 * np.pi * 50 * t)
    ma = MovingAverage(n)
    out = np.array([ma(v) for v in hum])
    assert np.abs(out[n:]).max() < 1e-9
    slow = np.sin(2 * np.pi * 1 * t)
    ma = MovingAverage(n)
    out = np.array([ma(v) for v in slow])
    lag = np.argmax(np.correlate(out[1000:3000], slow[1000:3000], "full")) - 1999
    assert abs(lag - 9.5) <= 0.5
    assert abs(np.var(y[n:]) - 1 / n) < 0.01
    f3 = next(v for v in np.linspace(0.0001, 0.5, 200000) if dirichlet(v, n) < 2**-0.5)
    print(f"N = {n}: output variance {np.var(y[n:]):.4f} (1/N = {1/n}), -3 dB at {f3*n:.3f} fs/N, 50 Hz nulled")
    assert abs(f3 * n - 0.443) < 0.003
```
:::end

## Exercises

:::exercise
Why does a running-sum moving average in 32-bit floats drift after hours, and in integers not at all?
:::solution
Each add and subtract rounds, so the sum accumulates error that never cancels. Integer arithmetic is exact, so what's added is subtracted exactly. With floats, recompute the sum from the buffer every few thousand samples.
:::end

:::exercise
A PWM ripple at 20 kHz is sampled at 200 kHz. Which N cancels it with the shortest delay?
:::solution
$N = f_s/f = 10$ puts the first null exactly at 20 kHz, with a delay of 4.5 samples (22.5 µs).
:::end

## Quiz

:::quiz
- type: num
  q: Delay in samples of a 20-point moving average?
  answer: 9.5
  tol: 0.001
  unit: samples
  py: "(20-1)/2"
  explain: (N − 1)/2.
- type: num
  q: N for a first null at 50 Hz with f_s = 1 kHz?
  answer: 20
  tol: 0.001
  py: "1000/50"
  explain: Nulls at k f_s/N.
- type: num
  q: Approximate −3 dB frequency in Hz for N = 20 at 1 kHz?
  answer: 22.15
  tol: 0.01
  unit: Hz
  py: "0.443*1000/20"
  explain: 0.443 f_s/N.
- type: num
  q: Noise variance reduction factor for N = 20 on white noise?
  answer: 20
  tol: 0.001
  py: "20"
  explain: σ²/N.
- type: mc
  q: The moving average's first sidelobe is about…
  options:
    - −13 dB
    - −40 dB
    - −60 dB
    - −100 dB
  answer: 0
  explain: A poor stopband.
- type: mc
  q: A running-sum implementation costs per sample…
  options:
    - O(N) operations
    - O(1) operations
    - O(N²)
    - O(log N)
  answer: 1
  explain: Add one, subtract one.
:::end

:::verify
import math
assert abs(math.sin(20*math.pi*0.05)) < 1e-12
:::end
