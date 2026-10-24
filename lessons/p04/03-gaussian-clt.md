---
id: p04-l03
minutes: 30
summary: Add up enough independent errors and the total is Gaussian, whatever the individual distributions look like. You see why variances add, standardise sums, use the result for a tolerance stack-up, and test normality of sums of uniforms with a Kolmogorov-Smirnov test.
---

## Variances add

For independent $X$ and $Y$, the cross term in $\mathbb E[(X + Y - \mu_X - \mu_Y)^2]$ vanishes because $\mathbb E[(X - \mu_X)(Y - \mu_Y)] = 0$. So

$$\operatorname{Var}(X + Y) = \operatorname{Var}X + \operatorname{Var}Y.$$

Standard deviations don't add; their squares do. The sum of $n$ independent errors with equal $\sigma$ has standard deviation $\sigma\sqrt n$, and their average has $\sigma/\sqrt n$. That $\sqrt n$ is why averaging 100 readings only buys a factor of 10.

## The central limit theorem

Standardise a sum of $n$ independent, identically distributed variables with mean $\mu$ and variance $\sigma^2$:

$$Z_n = \frac{\sum_{i=1}^n X_i - n\mu}{\sigma\sqrt n}.$$

As $n$ grows, the distribution of $Z_n$ approaches $\mathcal N(0, 1)$, whatever the shape of the $X_i$ (as long as the variance is finite). One way to see it: the characteristic function $\mathbb E[e^{j\omega X}]$ of a sum is the product of the individual ones, and expanding each to second order gives $\left(1 - \frac{\omega^2}{2n}\right)^n \to e^{-\omega^2/2}$, the Gaussian's characteristic function.

This is why so much measurement noise is Gaussian: thermal noise is the sum of countless electron motions, and a manufactured dimension is the sum of many small process errors. It's also why the Kalman filter's Gaussian assumption works better than it has any right to.

**How fast?** Sums of uniforms converge quickly: the old trick "add 12 uniforms and subtract 6" gives a decent standard Gaussian, since 12 uniforms have variance $12 \times \frac1{12} = 1$. Skewed distributions like the exponential converge much more slowly.

:::figure widget=clt args={"n":2} caption="Histogram of standardised sums of N uniforms against the Gaussian. Two already look triangular; by six the difference is hard to see."
:::end

## Worked example

A gearbox stack has 10 parts, each within ±0.1 mm, with errors uniform over that band.

1. Worst case: all errors line up, ±1.0 mm.
2. Statistically: each part has $\sigma = 0.1/\sqrt3 = 0.0577$ mm, so the stack has $\sigma = 0.0577\sqrt{10} = 0.183$ mm.
3. By the CLT the stack is close to Gaussian, so ±3σ = ±0.548 mm covers 99.73 % of assemblies, about half the worst case.
4. Designing to ±0.55 mm instead of ±1.0 mm lets you loosen part tolerances (and cost) at the price of roughly 3 rejects per 1000 assemblies. This is statistical tolerancing.

## Code it from scratch

:::code file=clt.py
```python
import math
import numpy as np
from scipy import stats

def standardised_sums(n, m, rng):
    s = rng.random((m, n)).sum(axis=1)
    return (s - n / 2) / math.sqrt(n / 12)

def ks_statistic(z):
    """Largest gap between the empirical CDF and the standard normal CDF."""
    z = np.sort(z); m = len(z)
    F = 0.5 * (1 + np.vectorize(math.erf)(z / math.sqrt(2)))
    return max(np.max(np.arange(1, m + 1) / m - F), np.max(F - np.arange(m) / m))

if __name__ == "__main__":
    rng = np.random.default_rng(12)
    m = 5000
    crit = 1.358 / math.sqrt(m)                       # 5 % critical value for large m
    D = {n: ks_statistic(standardised_sums(n, m, rng)) for n in (1, 2, 12, 30)}
    print({n: round(d, 4) for n, d in D.items()}, "critical", round(crit, 4))
    assert D[1] > crit                                # a single uniform is clearly not Gaussian
    assert D[12] < crit and D[30] < crit              # 12 or more pass
    z = standardised_sums(12, m, rng)
    assert abs(ks_statistic(z) - stats.kstest(z, "norm").statistic) < 1e-9
    # tolerance stack: 10 parts, uniform +-0.1 mm
    stack = (rng.random((200_000, 10)) * 0.2 - 0.1).sum(axis=1)
    assert abs(stack.std() - 0.1 / math.sqrt(3) * math.sqrt(10)) < 0.002
    assert abs(np.mean(np.abs(stack) <= 0.548) - 0.9973) < 0.002
```
:::end

## Exercises

:::exercise
You average 16 readings of a sensor with 2 mV RMS noise. What noise remains? How many readings would you need for 0.1 mV?
:::solution
$2/\sqrt{16} = 0.5$ mV. For 0.1 mV you need $\sqrt n = 20$, so 400 readings, which only works if the noise is white and the signal doesn't change during the window.
:::end

:::exercise
Why does the "add 12 uniforms" trick never produce values beyond ±6?
:::solution
Each uniform is in [0, 1], so the sum lies in [0, 12] and the standardised value in [−6, 6]. A true Gaussian exceeds 6σ with probability about $2\times10^{-9}$, so the truncation is irrelevant for most simulations but matters if you're estimating very rare events.
:::end

## Quiz

:::quiz
- type: num
  q: Ten parts, each uniform within ±0.1 mm. What is the standard deviation of the stack in mm?
  answer: 0.18257
  tol: 0.002
  unit: mm
  py: "0.1/math.sqrt(3)*math.sqrt(10)"
  explain: $\sigma_\text{part} = 0.1/\sqrt3$, times $\sqrt{10}$.
- type: num
  q: What is the noise in mV after averaging 16 readings with 2 mV RMS white noise?
  answer: 0.5
  tol: 0.001
  unit: mV
  py: "2/math.sqrt(16)"
  explain: $\sigma/\sqrt n$.
- type: mc
  q: For independent errors, what adds?
  options:
    - Standard deviations
    - Variances
    - Ranges
    - Medians
  answer: 1
  explain: The cross term vanishes, so variances add.
- type: num
  q: How many readings are needed to reduce 2 mV RMS white noise to 0.1 mV?
  answer: 400
  tol: 0.001
  py: "(2/0.1)**2"
  explain: $n = (\sigma/\sigma_\text{target})^2$.
- type: mc
  q: The central limit theorem requires the summed variables to…
  options:
    - be Gaussian already
    - be independent with finite variance
    - be uniform
    - have zero mean
  answer: 1
  explain: Any shape works with independence and finite variance.
- type: num
  q: What is the variance of the sum of 12 independent uniforms on [0, 1]?
  answer: 1
  tol: 0.001
  py: "12/12"
  explain: Each has variance 1/12.
:::end

:::verify
import math
assert abs(0.1/math.sqrt(3)-0.0577)<5e-5 and abs(0.1/math.sqrt(3)*math.sqrt(10)-0.183)<5e-4 and abs(3*0.18257-0.548)<5e-4
:::end
