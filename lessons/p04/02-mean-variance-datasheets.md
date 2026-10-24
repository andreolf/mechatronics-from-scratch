---
id: p04-l02
minutes: 30
summary: Datasheets quote noise as a density in units per root hertz. You derive Var = E[x²] − E[x]², turn a noise density into RMS noise through the bandwidth, including the π/2 factor for a first-order filter, and confirm it on simulated accelerometer noise within 5 %.
---

## Variance, the useful way round

Expanding the square gives a formula that needs only running sums:

$$\sigma^2 = \mathbb E[(X - \mu)^2] = \mathbb E[X^2] - 2\mu\mathbb E[X] + \mu^2 = \mathbb E[X^2] - \mu^2.$$

The square root of the mean square, the **RMS**, satisfies $\text{RMS}^2 = \mu^2 + \sigma^2$: the DC part and the fluctuating part add in power. On a microcontroller, summing $x$ and $x^2$ over a window gives both the mean and the noise. In floating point, subtracting two large nearly equal numbers loses precision, which is why Welford's update (in the code) is preferred for long runs.

The **sample variance** divides by $n - 1$, not $n$, because the sample mean is itself fitted to the data and makes the deviations look slightly too small.

## From noise density to RMS

White noise has the same power in every frequency band. A datasheet gives its **noise density** $\rho$, for example 150 µg/√Hz for an accelerometer. Power is density squared times bandwidth, so the RMS in a band of width $B$ is

$$\sigma = \rho\sqrt{B}.$$

Real filters aren't brick walls. A first-order low-pass with corner $f_c$ passes as much white noise power as a brick wall of width

$$B_\text{eq} = \frac{\pi}{2}f_c,$$

because $\int_0^\infty \frac{df}{1 + (f/f_c)^2} = f_c\frac{\pi}{2}$. A second-order Butterworth gives $1.11f_c$. Forgetting this underestimates noise by 25 % for the first-order case.

**Simulating it.** Sampled at $f_s$, white noise of one-sided density $\rho$ has per-sample standard deviation $\rho\sqrt{f_s/2}$, because the samples carry all frequencies up to Nyquist.

:::figure widget=noise caption="White noise (grey) next to slower processes. Averaging white noise over longer windows shrinks it by √N; the random walk doesn't average away."
:::end

## Worked example

An accelerometer with 150 µg/√Hz noise density:

1. Through a 100 Hz brick-wall filter: $150\sqrt{100} = 1500$ µg = 1.5 mg RMS.
2. Through its internal first-order filter at 100 Hz: $150\sqrt{157.1} = 1880$ µg = 1.88 mg RMS.
3. Halving the bandwidth to 50 Hz reduces the noise by $\sqrt2$: 1.33 mg RMS. Every factor of 4 in bandwidth halves the noise.
4. Converting to tilt: 1.88 mg on gravity is $\arcsin(0.00188) = 0.108°$ of tilt noise RMS.

## Code it from scratch

:::code file=noise_density.py
```python
import math
import numpy as np

def welford(xs):
    """Numerically stable running mean and sample variance."""
    n, mean, m2 = 0, 0.0, 0.0
    for x in xs:
        n += 1
        d = x - mean
        mean += d / n
        m2 += d * (x - mean)
    return mean, m2 / (n - 1)

def first_order_lowpass(x, fc, fs):
    """Exact discretisation (ZOH pole) of a first-order low-pass."""
    a = math.exp(-2 * math.pi * fc / fs)
    y = np.empty_like(x); acc = 0.0
    for i, v in enumerate(x):
        acc = a * acc + (1 - a) * v
        y[i] = acc
    return y

if __name__ == "__main__":
    rho, fs, fc = 150e-6, 20_000, 100.0          # g/sqrt(Hz), sample rate, filter corner
    rng = np.random.default_rng(7)
    white = rng.standard_normal(400_000) * rho * math.sqrt(fs / 2)
    y = first_order_lowpass(white, fc, fs)[2000:]          # drop the start-up transient
    rms = math.sqrt(np.mean(y**2))
    pred = rho * math.sqrt(math.pi / 2 * fc)
    print(f"simulated {rms*1e6:.0f} ug RMS, predicted {pred*1e6:.0f} ug RMS")
    assert abs(rms - pred) / pred < 0.05
    assert abs(rho * math.sqrt(100) - 1.5e-3) < 1e-12
    m, v = welford(1e9 + rng.standard_normal(20_000))     # big offset, unit noise
    assert abs(v - 1) < 0.05 and abs(m - 1e9) < 0.05
```
:::end

## Exercises

:::exercise
A gyro datasheet gives 0.005 °/s/√Hz. What RMS noise do you get with a 40 Hz first-order filter?
:::solution
$B_\text{eq} = \frac\pi2\cdot40 = 62.8$ Hz, so $\sigma = 0.005\sqrt{62.8} = 0.0396$ °/s.
:::end

:::exercise
A signal has mean 2.0 V and RMS 2.05 V. What is its noise standard deviation?
:::solution
$\sigma = \sqrt{2.05^2 - 2.0^2} = \sqrt{0.2025} = 0.45$ V. A small change in RMS can hide a lot of noise.
:::end

## Quiz

:::quiz
- type: num
  q: Noise density 150 µg/√Hz through a 100 Hz brick-wall filter. What is the RMS in µg?
  answer: 1500
  tol: 0.001
  unit: µg
  py: "150*math.sqrt(100)"
  explain: $\rho\sqrt{B}$.
- type: num
  q: The same density through a first-order 100 Hz filter. What is the RMS in µg?
  answer: 1880
  tol: 0.002
  unit: µg
  py: "150*math.sqrt(math.pi/2*100)"
  explain: Equivalent noise bandwidth $\frac\pi2 f_c = 157$ Hz.
- type: num
  q: Gyro density 0.005 °/s/√Hz with a 40 Hz first-order filter. What is the RMS in °/s?
  answer: 0.03963
  tol: 0.002
  unit: °/s
  py: "0.005*math.sqrt(math.pi/2*40)"
  explain: $0.005\sqrt{62.8}$.
- type: mc
  q: Quartering the bandwidth of white noise changes its RMS by a factor of…
  options:
    - 1/4
    - 1/2
    - 1/16
    - it doesn't change
  answer: 1
  explain: RMS scales with $\sqrt B$.
- type: num
  q: Mean 2.0 V and RMS 2.05 V. What is σ in volts?
  answer: 0.45
  tol: 0.001
  unit: V
  py: "math.sqrt(2.05**2-2.0**2)"
  explain: $\sigma^2 = \text{RMS}^2 - \mu^2$.
- type: mc
  q: The equivalent noise bandwidth of a first-order low-pass is…
  options:
    - $f_c$
    - $\frac{\pi}{2}f_c$
    - $2f_c$
    - $f_c/\sqrt2$
  answer: 1
  explain: $\int_0^\infty df/(1 + (f/f_c)^2) = \frac\pi2f_c$.
:::end

:::verify
import math
assert abs(150*math.sqrt(math.pi/2*100)-1880)<0.5 and abs(150*math.sqrt(50)-1061)<1 and abs(150*math.sqrt(math.pi/2*50)-1329)<1
assert abs(math.degrees(math.asin(0.00188))-0.108)<5e-4 and abs(math.pi/2*40-62.8)<0.05
:::end
