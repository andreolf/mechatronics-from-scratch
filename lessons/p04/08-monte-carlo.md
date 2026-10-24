---
id: p04-l08
minutes: 30
summary: When the algebra gets hard, simulate. You run a Monte Carlo tolerance analysis of a voltage divider, compare it with worst-case and RSS analysis, compute the yield against a spec exactly, and learn how many trials you need for a given accuracy.
---

## The method

Monte Carlo propagation is simple:

1. Draw random inputs from their distributions (resistor values, temperatures, mass).
2. Push each draw through the full nonlinear model.
3. Look at the distribution of outputs: mean, σ, percentiles, and the fraction outside the spec.

It needs no derivatives and no linearity assumptions, and it handles any distribution. Its cost is accuracy: an estimate from $M$ trials has standard error proportional to $1/\sqrt M$. To halve the error you need four times the trials, so estimating a 1 % failure rate to ±0.1 % absolute takes about $0.01\times0.99/0.001^2 \approx 10\,000$ trials.

## Three ways to analyse tolerance

- **Worst case**: put every part at the end of its tolerance in the most damaging direction. It's guaranteed, but very pessimistic with many parts.
- **RSS (root sum of squares)**: linearise and add variances (lesson 5). It's realistic for many independent parts but assumes the model is linear.
- **Monte Carlo**: realistic for any model, but it's statistical, never a guarantee.

:::figure widget=tolstack caption="10 000 voltage dividers built from ±5 % resistors. The red lines are worst case and the blue lines are a ±50 mV spec. Change the tolerance and watch the yield."
:::end

## Worked example

A 5 V supply feeds two nominal 10 kΩ resistors with ±5 % tolerance, uniformly distributed. $V = 5R_2/(R_1 + R_2)$, nominally 2.5 V. The spec is 2.5 V ± 50 mV.

1. **Worst case**: $R_1$ high and $R_2$ low gives $5\times9.5/(10.5 + 9.5) = 2.375$ V; the reverse gives 2.625 V. That's ±125 mV, so worst case fails the spec.
2. **Linearise**: $\partial V/\partial R_2 = 5R_1/(R_1 + R_2)^2 = 0.125$ V/kΩ, and $\partial V/\partial R_1 = -0.125$ V/kΩ. A uniform ±0.5 kΩ has $\sigma = 0.5/\sqrt3 = 0.2887$ kΩ.
3. **RSS**: $\sigma_V = 0.125\times0.2887\times\sqrt2 = 0.0510$ V.
4. **Yield exactly**: to first order $\Delta V = 0.0625(u_2 - u_1)$ with $u_i$ uniform on ±1. The difference of two uniforms is triangular on ±0.125 V, so $P(|\Delta V| > 0.05) = (1 - 0.05/0.125)^2 = 0.36$. **36 % of the boards fail.**
5. **Monte Carlo** with a million trials gives $\sigma_V = 0.0511$ V and 36.06 % failing, matching the analysis. Switch to ±1 % resistors and the worst case is ±25 mV: every board passes.

## Code it from scratch

:::code file=montecarlo_divider.py
```python
import numpy as np

def divider(r1, r2, vin=5.0):
    return vin * r2 / (r1 + r2)

def mc(tol, M, seed=0):
    rng = np.random.default_rng(seed)
    r1 = 10.0 * (1 + tol * (2 * rng.random(M) - 1))
    r2 = 10.0 * (1 + tol * (2 * rng.random(M) - 1))
    return divider(r1, r2)

if __name__ == "__main__":
    lo, hi = divider(10.5, 9.5), divider(9.5, 10.5)
    assert abs(lo - 2.375) < 1e-12 and abs(hi - 2.625) < 1e-12
    v = mc(0.05, 1_000_000)
    fail = np.mean(np.abs(v - 2.5) > 0.05)
    print(f"sigma {v.std():.4f} V, failing {100*fail:.2f} %")
    assert abs(v.std() - 0.125 * 0.5 / np.sqrt(3) * np.sqrt(2)) < 5e-4
    assert abs(fail - 0.36) < 3 * np.sqrt(0.36 * 0.64 / 1e6) + 0.002   # within MC error (+ linearisation)
    assert lo <= v.min() and v.max() <= hi                             # Monte Carlo never beats worst case
    assert np.all(np.abs(mc(0.01, 100_000) - 2.5) < 0.05)              # 1 % parts: 100 % yield
    # standard error shrinks like 1/sqrt(M)
    errs = [np.std([np.mean(np.abs(mc(0.05, M, s) - 2.5) > 0.05) for s in range(60)]) for M in (1_000, 16_000)]
    assert 2.8 < errs[0] / errs[1] < 5.5                               # about sqrt(16) = 4
```
:::end

## Exercises

:::exercise
How many Monte Carlo trials do you need to estimate a 36 % failure rate with a standard error of 0.5 percentage points?
:::solution
$\sqrt{p(1-p)/M} = 0.005$, so $M = 0.36\times0.64/0.005^2 = 9216$, about ten thousand.
:::end

:::exercise
With ±2 % resistors, what fraction of dividers fail the ±50 mV spec?
:::solution
Worst case is now $\pm0.125\times0.2\times2 = \pm0.05$ V, exactly at the spec, so (to first order) none fail. The triangle's half-width equals the spec limit.
:::end

## Quiz

:::quiz
- type: num
  q: What is the worst-case lowest output in volts of the 5 V divider with ±5 % 10 kΩ resistors?
  answer: 2.375
  tol: 0.0005
  unit: V
  py: "5*9.5/(10.5+9.5)"
  explain: $R_1$ high and $R_2$ low.
- type: num
  q: What is the RSS σ of the output in volts?
  answer: 0.051031
  tol: 0.003
  unit: V
  py: "0.125*0.5/math.sqrt(3)*math.sqrt(2)"
  explain: Sensitivity × σ of a uniform × √2 for two parts.
- type: num
  q: To first order, what fraction of dividers fail the ±50 mV spec?
  answer: 0.36
  tol: 0.003
  py: "(1-0.05/0.125)**2"
  explain: The two tails of a triangular distribution on ±0.125 V.
- type: mc
  q: The standard error of a Monte Carlo estimate scales as…
  options:
    - $1/M$
    - $1/\sqrt M$
    - $\ln M$
    - it doesn't depend on M
  answer: 1
  explain: Quadruple the trials to halve the error.
- type: num
  q: How many trials for a standard error of 0.005 on p = 0.36?
  answer: 9216
  tol: 0.002
  py: "0.36*0.64/0.005**2"
  explain: $M = p(1-p)/\text{SE}^2$.
- type: mc
  q: Compared with worst case, Monte Carlo tolerance analysis…
  options:
    - guarantees every unit passes
    - estimates the realistic distribution, but isn't a guarantee
    - is always more pessimistic
    - needs the model to be linear
  answer: 1
  explain: It's statistical, so rare corners can be missed.
:::end

:::verify
import math
assert abs(5*10/(20)**2 - 0.125) < 1e-12 and abs(0.5/math.sqrt(3)-0.2887) < 5e-5
assert abs(0.125*0.2*2 - 0.05) < 1e-12 and abs(5*10.5/20-2.625)<1e-12
:::end
