---
id: p03-l08
minutes: 30
summary: A linear time-invariant system's output is a weighted sum of past inputs, with the impulse response as the weights. You derive the convolution integral from linearity and time invariance, compute it with loops and with the FFT, and see why convolution in time is multiplication in the s- and frequency domains.
---

## Deriving convolution

Two properties are enough:

- **Linearity**: scaling and adding inputs scales and adds outputs.
- **Time invariance**: delaying the input delays the output and changes nothing else.

Slice the input into narrow pulses of width $\Delta\tau$. The pulse at time $\tau$ has area $u(\tau)\Delta\tau$, so it acts like a scaled impulse. If the impulse response is $h(t)$, time invariance says that pulse produces $u(\tau)\Delta\tau\,h(t - \tau)$, and linearity says the total output is the sum over all slices. Shrink the slices:

$$y(t) = \int_0^t u(\tau)\,h(t - \tau)\,d\tau = (h * u)(t).$$

Read it as: to get the output now, flip $h$, slide it to $t$, multiply by the input and integrate. Recent inputs are weighted by $h$ near zero and old inputs by $h$'s tail. A system with a short impulse response has a short memory.

## Why transforms love it

Take the Laplace transform of the convolution and swap the order of integration:

$$\mathcal L\{h * u\} = H(s)\,U(s).$$

This is why $Y = GU$ works and why $G(s)$ is the transform of the impulse response. The same holds for Fourier transforms, which is how fast convolution works: transform, multiply, transform back. For two sequences of length $N$, direct convolution costs $O(N^2)$ and the FFT route $O(N\log N)$ (lesson 11).

**Discrete version.** With samples every $\Delta t$:

$$y[n] = \sum_k h[k]\,u[n - k]\,\Delta t.$$

A digital FIR filter is exactly this sum with $h$ chosen by the designer.

:::figure widget=convolve caption="Flip and slide. The blue curve is h(t − τ), the white pulse is the input, and the shaded overlap is y(t). Move t and watch the output build."
:::end

## Worked example

An RC filter with $\tau = 0.5$ s has $h(t) = \frac{1}{\tau}e^{-t/\tau}$ (unit area, so DC gain 1). Feed it a 1 s pulse of height 1.

1. For $0 \le t < 1$: $y = \int_0^t \frac1\tau e^{-(t-\tau')/\tau}d\tau' = 1 - e^{-t/\tau}$. At $t = 1$: $1 - e^{-2} = 0.8647$.
2. For $t \ge 1$ the input is off and the stored value decays: $y = (1 - e^{-2})\,e^{-(t-1)/\tau}$. At $t = 1.5$: $0.3181$; at $t = 2$: $0.1170$.
3. In the s-domain: $H = \frac{1}{\tau s + 1}$ and $U = \frac{1 - e^{-s}}{s}$. The product gives the same answer through lesson 6's partial fractions plus a delay.

## Code it from scratch

:::code file=convolution.py
```python
import numpy as np

def conv_loop(h, u):
    """Direct convolution, O(N*M): y[n] = sum_k h[k] u[n-k]."""
    y = np.zeros(len(h) + len(u) - 1)
    for n in range(len(y)):
        for k in range(max(0, n - len(u) + 1), min(n, len(h) - 1) + 1):
            y[n] += h[k] * u[n - k]
    return y

def conv_fft(h, u):
    """Zero-pad to avoid circular wrap-around, multiply spectra, invert."""
    n = len(h) + len(u) - 1
    N = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(h, N) * np.fft.rfft(u, N), N)[:n]

if __name__ == "__main__":
    rng = np.random.default_rng(1)
    a, b = rng.standard_normal(300), rng.standard_normal(200)
    assert np.max(np.abs(conv_loop(a, b) - conv_fft(a, b))) < 1e-10
    assert np.allclose(conv_loop(a, b), np.convolve(a, b), atol=1e-12)
    # RC filter driven by a 1 s pulse, dt = 1 ms
    dt, tau = 1e-3, 0.5
    t = np.arange(0, 4, dt)
    h = np.exp(-t / tau) / tau
    u = (t < 1).astype(float)
    y = conv_fft(h, u)[: len(t)] * dt
    exact = np.where(t < 1, 1 - np.exp(-t / tau), (1 - np.exp(-2)) * np.exp(-(t - 1) / tau))
    err = np.max(np.abs(y - exact))
    print(f"y(1) = {y[999]:.4f}, y(2) = {y[1999]:.4f}, max error vs exact {err:.2e}")
    assert err < 2.1e-3                      # rectangle-rule error is O(dt)
    assert abs(exact[1500] - 0.3181) < 1e-4 and abs(exact[2000] - 0.1170) < 1e-4
```
:::end

## Exercises

:::exercise
A 5-sample moving average has $h = [0.2, 0.2, 0.2, 0.2, 0.2]$. What does it output for the input $u = [0, 0, 5, 5, 5, 5, 5, 5]$?
:::solution
$y = [0, 0, 1, 2, 3, 4, 5, 5, \dots]$: a 5-sample ramp to the new value, then 5. The moving average turns a step into a linear ramp lasting one window: the price of smoothing is delay.
:::end

:::exercise
Why does `conv_fft` zero-pad to at least $N + M - 1$ samples?
:::solution
The DFT treats sequences as periodic, so multiplying DFTs computes a circular convolution. Without padding, the tail of the output wraps around and adds onto its start. Padding to the full linear-convolution length leaves room for the whole result.
:::end

## Quiz

:::quiz
- type: num
  q: RC filter with τ = 0.5 s driven by a unit 1 s pulse. What is $y(1)$?
  answer: 0.8647
  tol: 0.001
  py: "1-math.exp(-2)"
  explain: $1 - e^{-1/0.5}$.
- type: num
  q: Same filter and pulse. What is $y(2)$?
  answer: 0.11702
  tol: 0.002
  py: "(1-math.exp(-2))*math.exp(-2)"
  explain: The value at 1 s decays for one more second, or two time constants.
- type: mc
  q: Convolution in time corresponds in the Laplace domain to…
  options:
    - addition
    - multiplication
    - differentiation
    - division
  answer: 1
  explain: $\mathcal L\{h * u\} = H(s)U(s)$.
- type: mc
  q: Which two properties justify the convolution integral?
  options:
    - Stability and causality
    - Linearity and time invariance
    - Continuity and smoothness
    - Periodicity and symmetry
  answer: 1
  explain: The input is a sum of shifted, scaled impulses; linearity and time invariance give the output.
- type: num
  q: How many output samples does convolving a 300-sample signal with a 200-sample filter produce?
  answer: 499
  tol: 0.001
  py: "300+200-1"
  explain: Full linear convolution has length $N + M - 1$.
- type: num
  q: What is the 4th output sample $y[3]$ of the 5-point moving average for $u = [0, 0, 5, 5, \dots]$?
  answer: 2
  tol: 0.001
  py: "0.2*(5+5)"
  explain: The window covers $u[0..3] = 0, 0, 5, 5$, so $0.2 \times 10 = 2$.
:::end

:::verify
import numpy as np
y = np.convolve([0.2]*5, [0,0,5,5,5,5,5,5])[:8]; assert np.allclose(y, [0,0,1,2,3,4,5,5])
:::end
