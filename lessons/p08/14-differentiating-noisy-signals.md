---
id: p08-l14
minutes: 35
summary: Velocity from a position sensor, current slope for fault detection, the D term of a PID controller all need a derivative, and differentiation amplifies noise in proportion to frequency. You quantify how badly the finite difference does, then compare a filtered derivative and a Savitzky-Golay fit, which cut the error by more than five times.
---

## Differentiation is a high-pass filter

The ideal differentiator has $H(j\omega) = j\omega$: gain grows linearly with frequency. Sensor noise is broadband, so the derivative of a signal plus noise is dominated by the *highest* frequencies, exactly where there is no signal.

The **backward difference** $d[n] = (x[n] - x[n-1])/T$ turns white noise of RMS $\sigma$ into noise of RMS

$$\sigma_d = \frac{\sqrt2\,\sigma}{T}.$$

At $f_s = 200$ Hz, $\sigma = 0.01$ becomes $\sigma_d = 2.83$ per second. For a unit 1 Hz sine, whose true derivative has amplitude $2\pi = 6.28$, that's a 45 % RMS error. Faster sampling makes it *worse*.

## Two fixes

**Filtered derivative.** Low-pass the difference, $D(s) = \dfrac{s}{\tau s + 1}$: a differentiator below $1/(2\pi\tau)$ and flat above. This is exactly the "derivative filter" in a practical PID (Phase 13). It's causal, so it can run in a control loop, at the cost of a delay of about $\tau$.

**Savitzky-Golay (SG).** Fit a low-order polynomial by least squares to the $2M+1$ samples around $n$ and take its slope (Phase 01 lesson 8). For a linear or quadratic fit, the slope is

$$d[n] = \frac{\sum_{k=-M}^{M} k\,x[n+k]}{T\sum_{k=-M}^{M} k^2},$$

an FIR filter with antisymmetric taps. The noise RMS becomes $\sigma/(T\sqrt{\sum k^2})$. With $M = 7$, $\sum k^2 = 280$, so noise is 0.12 instead of 2.83. It's centred, so it has zero phase but needs $M$ future samples: use it offline, or accept a delay of $M$ samples.

:::figure widget=deriv caption="Derivative of a noisy 1 Hz sine. The finite difference is buried in noise; the filtered derivative is clean but late; Savitzky-Golay is clean and centred."
:::end

## Worked example

An encoder position at 200 Hz with 0.01 rad RMS noise, a 1 Hz sinusoidal motion of 1 rad.

1. Finite difference: noise $\sqrt2\cdot0.01\cdot200 = 2.83$ rad/s RMS, against a 6.28 rad/s peak.
2. Filtered, $\tau = 20$ ms: about 0.48 rad/s RMS error (measured, after removing the 22.5 ms delay), **6×** better.
3. SG with 15 points: $0.01\cdot200/\sqrt{280} = 0.12$ rad/s, **22×** better, with a small bias from the curvature of the sine over the ±35 ms window.

## Code it from scratch

:::code file=derivative.py
```python
import numpy as np
from scipy import signal

def finite_difference(x, T):
    return np.diff(x, prepend=x[0]) / T

def filtered_derivative(x, T, tau):
    a = np.exp(-T / tau)                       # matched first-order low-pass
    return signal.lfilter([1 - a], [1, -a], finite_difference(x, T))

def savgol_slope(x, T, M):
    k = np.arange(-M, M + 1)
    taps = k / (T * np.sum(k * k))
    return np.convolve(x, taps[::-1], mode="same")   # correlation with k: centred, zero phase

if __name__ == "__main__":
    fs, sigma = 200.0, 0.01
    T = 1 / fs
    t = np.arange(4000) * T
    rng = np.random.default_rng(3)
    x = np.sin(2 * np.pi * t) + sigma * rng.standard_normal(len(t))

    def rms_error(d, delay):
        s = slice(50, -50)
        return np.sqrt(np.mean((d[s] - 2 * np.pi * np.cos(2 * np.pi * (t[s] - delay))) ** 2))

    e_fd = rms_error(finite_difference(x, T), T / 2)
    e_f = rms_error(filtered_derivative(x, T, 0.02), 0.02 + T / 2)
    e_sg = rms_error(savgol_slope(x, T, 7), 0)
    print(f"rms error: finite difference {e_fd:.2f}, filtered {e_f:.2f}, Savitzky-Golay {e_sg:.3f}")
    assert abs(e_fd - np.sqrt(2) * sigma / T) / (np.sqrt(2) * sigma / T) < 0.05
    assert e_fd / e_f > 5 and e_fd / e_sg > 5
    assert abs(e_sg - sigma / (T * np.sqrt(280))) < 0.02
    # our SG slope equals scipy's quadratic Savitzky-Golay derivative away from the edges
    ref = signal.savgol_filter(x, 15, 2, deriv=1, delta=T)
    assert np.allclose(savgol_slope(x, T, 7)[10:-10], ref[10:-10], atol=1e-9)
```
:::end

## Exercises

:::exercise
Doubling the sample rate with the same sensor noise: what happens to the finite-difference noise, and to the SG noise if the window keeps the same *duration*?
:::solution
Finite difference: $\sigma_d \propto 1/T$, so it doubles. SG: $M$ doubles, $\sum k^2 \approx 2M^3/3$ grows 8×, so the noise $\sigma/(T\sqrt{\sum k^2})$ changes by $2/\sqrt8 = 0.71$: it improves, because more samples are averaged.
:::end

:::exercise
Why does a PID's D term usually act on the measurement, filtered, rather than on the error?
:::solution
A step in the setpoint makes the error derivative an impulse ("derivative kick"). Differentiating only the measurement avoids it, and the filter (time constant τ) limits the high-frequency gain so sensor noise doesn't reach the actuator.
:::end

## Quiz

:::quiz
- type: num
  q: Finite-difference noise RMS for σ = 0.01 at 200 Hz?
  answer: 2.828
  tol: 0.002
  py: "math.sqrt(2)*0.01*200"
  explain: √2·σ/T.
- type: num
  q: Sum of k² for k from −7 to 7?
  answer: 280
  tol: 0.001
  py: "sum(k*k for k in range(-7,8))"
  explain: 2·(7·8·15/6).
- type: num
  q: Savitzky-Golay (15-point) noise RMS for σ = 0.01 at 200 Hz?
  answer: 0.1195
  tol: 0.002
  py: "0.01*200/math.sqrt(280)"
  explain: σ/(T√Σk²).
- type: num
  q: Amplitude of the derivative of a unit 1 Hz sine?
  answer: 6.283
  tol: 0.001
  py: "2*math.pi"
  explain: ω.
- type: mc
  q: The gain of an ideal differentiator…
  options:
    - falls with frequency
    - is flat
    - grows in proportion to frequency
    - is zero at high frequency
  answer: 2
  explain: H = jω.
- type: mc
  q: Savitzky-Golay is centred, so in real time it…
  options:
    - has no delay
    - needs M future samples, a delay of M samples
    - is unstable
    - needs floating point
  answer: 1
  explain: Zero phase offline means M samples of latency online.
:::end

:::verify
import math
assert sum(k*k for k in range(-7,8)) == 280
:::end
