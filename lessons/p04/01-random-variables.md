---
id: p04-l01
minutes: 30
summary: A sensor reading is a draw from a distribution, not a number. You define PDFs, CDFs and expectation, derive inverse-CDF sampling and the Box-Muller transform, and build uniform, Gaussian and exponential generators from a single uniform source, checking their moments against theory.
---

## Distributions

A continuous random variable $X$ is described by its **probability density** $p(x)$: the probability of landing in $[a, b]$ is $\int_a^b p(x)\,dx$, and the total area is 1. The **cumulative distribution** $F(x) = P(X \le x) = \int_{-\infty}^x p$ rises from 0 to 1. The **expectation** of any function is a weighted average:

$$\mathbb E[g(X)] = \int g(x)\,p(x)\,dx, \qquad \mu = \mathbb E[X], \qquad \sigma^2 = \mathbb E[(X - \mu)^2].$$

Three distributions cover most of mechatronics:

| distribution | density | mean | variance | where it shows up |
|---|---|---|---|---|
| Uniform on $[a, b]$ | $\frac{1}{b-a}$ | $\frac{a+b}2$ | $\frac{(b-a)^2}{12}$ | ADC quantisation error, unknown phase |
| Gaussian $\mathcal N(\mu, \sigma^2)$ | $\frac{1}{\sigma\sqrt{2\pi}}e^{-(x-\mu)^2/2\sigma^2}$ | $\mu$ | $\sigma^2$ | thermal noise, sums of many errors |
| Exponential, rate $\lambda$ | $\lambda e^{-\lambda x}$, $x \ge 0$ | $1/\lambda$ | $1/\lambda^2$ | time between random events |

The uniform variance comes from $\int_{-h}^{h}x^2\frac{dx}{2h} = h^2/3$ with half-width $h = (b - a)/2$. An ADC's rounding error is uniform over ±½ LSB, so its RMS is $1/\sqrt{12} = 0.289$ LSB.

## Making any distribution from a uniform one

**Inverse CDF.** If $U$ is uniform on $[0, 1]$, then $X = F^{-1}(U)$ has CDF $F$, because $P(X \le x) = P(U \le F(x)) = F(x)$. For the exponential, $F(x) = 1 - e^{-\lambda x}$, so

$$X = -\frac{\ln(1 - U)}{\lambda}.$$

**Box-Muller.** The Gaussian CDF has no closed-form inverse, but two independent Gaussians in polar coordinates have a uniform angle and a radius with $R^2 \sim$ exponential with mean 2. So with two uniforms,

$$Z_1 = \sqrt{-2\ln U_1}\cos(2\pi U_2), \qquad Z_2 = \sqrt{-2\ln U_1}\sin(2\pi U_2)$$

are independent standard Gaussians. The lesson widgets on this site generate their noise exactly this way.

:::figure widget=clt args={"n":1} caption="With one variable per sum this is a standardised uniform histogram. Raise N to see how sums of uniforms turn Gaussian (lesson 3)."
:::end

## Worked example

1. **ADC.** A 12-bit ADC over 3.3 V has an LSB of $3.3/4096 = 0.806$ mV. Quantisation noise is uniform over ±0.403 mV, with RMS $0.806/\sqrt{12} = 0.233$ mV.
2. **Packet drops.** A radio link drops packets at random, on average every 2 s ($\lambda = 0.5$ s⁻¹). The chance of 5 s without a drop is $P(T > 5) = e^{-0.5\times5} = e^{-2.5} = 0.082$.
3. **Gaussian rule of thumb.** A Gaussian lands within ±1σ with probability 68.27 %, ±2σ with 95.45 % and ±3σ with 99.73 %. A gyro with 0.1 °/s RMS noise will exceed 0.3 °/s in about 1 sample in 370.

## Code it from scratch

:::code file=sampling.py
```python
import math
import numpy as np

class LCG:
    """Tiny 64-bit linear congruential generator (Knuth's MMIX constants): the only randomness used."""
    def __init__(self, seed=1):
        self.s = seed
    def uniform(self, n):
        out = np.empty(n)
        for i in range(n):
            self.s = (6364136223846793005 * self.s + 1442695040888963407) % 2**64
            out[i] = ((self.s >> 11) + 0.5) / 2**53          # in (0, 1), never exactly 0
        return out

def exponential(g, n, lam):
    return -np.log(1 - g.uniform(n)) / lam

def gaussian(g, n):
    u1, u2 = g.uniform(n), g.uniform(n)
    return np.sqrt(-2 * np.log(u1)) * np.cos(2 * np.pi * u2)

def check(x, mean, var, name):
    n = len(x)
    se_mean = math.sqrt(var / n)
    m4 = np.mean((x - x.mean())**4)
    se_var = math.sqrt((m4 - var**2) / n)                    # standard error of the sample variance
    assert abs(x.mean() - mean) < 3 * se_mean, (name, x.mean())
    assert abs(x.var() - var) < 3 * se_var, (name, x.var())
    print(f"{name:12s} mean {x.mean():+.4f} (theory {mean}), var {x.var():.4f} (theory {var})")

if __name__ == "__main__":
    g, n = LCG(2026), 100_000
    check(g.uniform(n) * 2 - 1, 0.0, 4 / 12, "uniform")
    check(exponential(g, n, 0.5), 2.0, 4.0, "exponential")
    z = gaussian(g, n)
    check(z, 0.0, 1.0, "gaussian")
    for k, p in ((1, 0.6827), (2, 0.9545), (3, 0.9973)):
        frac = np.mean(np.abs(z) < k)
        assert abs(frac - p) < 3 * math.sqrt(p * (1 - p) / n)
    t = exponential(g, n, 0.5)
    assert abs(np.mean(t > 5) - math.exp(-2.5)) < 3 * math.sqrt(0.082 * 0.918 / n)
```
:::end

## Exercises

:::exercise
A potentiometer's wiper angle is equally likely anywhere in 0–270°. What are the mean and standard deviation?
:::solution
Uniform on [0, 270]: mean 135°, variance $270^2/12 = 6075$, so $\sigma = 77.9°$.
:::end

:::exercise
Derive an inverse-CDF sampler for the Rayleigh distribution $p(r) = \frac{r}{\sigma^2}e^{-r^2/2\sigma^2}$, the magnitude of 2D Gaussian noise.
:::solution
$F(r) = 1 - e^{-r^2/2\sigma^2}$. Setting $F = u$ and solving: $r = \sigma\sqrt{-2\ln(1 - u)}$. That is the radius part of Box-Muller.
:::end

## Quiz

:::quiz
- type: num
  q: What is the RMS quantisation error of an ideal ADC, in LSB?
  answer: 0.28868
  tol: 0.001
  unit: LSB
  py: "1/math.sqrt(12)"
  explain: Uniform over ±½ LSB has variance 1/12.
- type: num
  q: Packet drops average one every 2 s. What is the probability of 5 s with no drop?
  answer: 0.082085
  tol: 0.002
  py: "math.exp(-2.5)"
  explain: $P(T > t) = e^{-\lambda t}$ with $\lambda = 0.5$.
- type: num
  q: What fraction of Gaussian samples lie within ±2σ?
  answer: 0.9545
  tol: 0.001
  py: "math.erf(2/math.sqrt(2))"
  explain: $\operatorname{erf}(2/\sqrt2) = 0.9545$.
- type: mc
  q: To sample an exponential with rate λ from a uniform $U$, use…
  options:
    - $\lambda U$
    - $-\ln(1 - U)/\lambda$
    - $e^{-\lambda U}$
    - $\sqrt{-2\ln U}$
  answer: 1
  explain: Invert $F(x) = 1 - e^{-\lambda x}$.
- type: num
  q: What is the standard deviation in degrees of a uniform angle on 0 to 270°?
  answer: 77.94
  tol: 0.001
  unit: °
  py: "270/math.sqrt(12)"
  explain: $(b - a)/\sqrt{12}$.
- type: mc
  q: Box-Muller needs…
  options:
    - one uniform per Gaussian, using the inverse Gaussian CDF
    - two uniforms to produce two independent Gaussians
    - a lookup table
    - a sum of twelve uniforms
  answer: 1
  explain: A uniform angle and an exponential squared radius give two Gaussians.
:::end

:::verify
import math
assert abs(3.3/4096*1000-0.806)<5e-4 and abs(0.806/math.sqrt(12)-0.233)<5e-4
assert abs(1/(1-0.9973)-370)<1
:::end
