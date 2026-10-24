---
id: p04-l11
minutes: 35
summary: Every threshold is a trade between two kinds of mistake. You set up a hypothesis test, compute false-alarm and missed-detection rates, decide whether an accelerometer offset is real, and gate outlier measurements with the chi-square test a Kalman filter uses.
---

## Two hypotheses, two errors

A test compares a **null hypothesis** $H_0$ (nothing is wrong: the part is good, the offset is zero, the measurement fits) with an alternative $H_1$. You compute a statistic from data and reject $H_0$ if it passes a threshold.

| | $H_0$ true | $H_1$ true |
|---|---|---|
| reject $H_0$ | **false alarm** (type I), rate α | correct detection, rate 1 − β (**power**) |
| keep $H_0$ | correct | **missed detection** (type II), rate β |

Moving the threshold trades α against β. The only way to shrink both is more information: more samples, or a less noisy sensor.

**The z-test.** With $n$ samples of known σ, the mean has standard error $\sigma/\sqrt n$. Under $H_0: \mu = 0$, the statistic $z = \bar x/(\sigma/\sqrt n)$ is standard normal. For a two-sided test at α = 5 %, reject if $|z| > 1.96$. The **p-value** is the probability, under $H_0$, of a statistic at least as extreme as the one observed. It isn't the probability that $H_0$ is true (lesson 6 explains why base rates matter).

:::figure widget=threshold caption="Good parts (lime) and a biased batch (amber). Raise the threshold and false rejects (red) fall while false accepts (amber) rise."
:::end

## Chi-square gating

A Kalman filter predicts each measurement with covariance $S$. The **normalised innovation squared**

$$d^2 = \boldsymbol\nu^TS^{-1}\boldsymbol\nu, \qquad \boldsymbol\nu = \mathbf z - \hat{\mathbf z},$$

follows a chi-square distribution with as many degrees of freedom as the measurement has dimensions, if the filter's model is right. Reject a 2-D measurement (such as a GPS fix) as an outlier if $d^2 > 5.99$ (95 %) or $9.21$ (99 %). It's the multi-dimensional version of "more than 2σ away", using the full covariance ellipse of lesson 4.

## Worked example

**Is the accelerometer offset real?** 100 samples at rest, sensor σ = 0.02 m/s², mean 0.005 m/s².

1. The standard error is $0.02/\sqrt{100} = 0.002$ m/s².
2. $z = 0.005/0.002 = 2.5$.
3. Two-sided p-value: $2(1 - \Phi(2.5)) = 0.0124$. Below 0.05, so reject $H_0$: the offset is probably real, and worth calibrating out.
4. Power against a true offset of 0.006 m/s²: $P(|z| > 1.96)$ when $z$ is centred on 3, which is 0.851. So 15 % of the time you'd miss an offset that large with only 100 samples.

**The threshold widget.** At a 1σ threshold, 15.9 % of good parts are rejected, and 30.9 % of parts biased by 1.5σ slip through.

## Code it from scratch

:::code file=tests_and_gates.py
```python
import math
import numpy as np
from scipy import stats

def z_test(xbar, sigma, n):
    z = xbar / (sigma / math.sqrt(n))
    return z, 2 * (1 - stats.norm.cdf(abs(z)))

def nis(nu, S):
    return float(nu @ np.linalg.solve(S, nu))

if __name__ == "__main__":
    z, p = z_test(0.005, 0.02, 100)
    assert abs(z - 2.5) < 1e-12 and abs(p - 0.012419) < 1e-6
    # simulate: under H0, a 5 % test rejects about 5 % of the time
    rng = np.random.default_rng(6)
    means = rng.standard_normal((20_000, 100)).mean(axis=1) * 0.02
    alpha = np.mean(np.abs(means / 0.002) > 1.96)
    power = np.mean(np.abs((means + 0.006) / 0.002) > 1.96)
    print(f"false alarm {alpha:.3f}, power {power:.3f}")
    assert abs(alpha - 0.05) < 0.006 and abs(power - 0.8508) < 0.01
    # chi-square gate on a consistent 2-D measurement model
    S = np.array([[4.0, 1.2], [1.2, 1.0]])
    L = np.linalg.cholesky(S)
    d2 = np.array([nis(L @ rng.standard_normal(2), S) for _ in range(20_000)])
    gate = stats.chi2.ppf(0.95, 2)
    assert abs(gate - 5.9915) < 1e-4 and abs(np.mean(d2 > gate) - 0.05) < 0.006
    assert nis(np.array([6.0, 0.0]), S) > gate           # a 6 m outlier east is rejected
```
:::end

## Exercises

:::exercise
You want a false-alarm rate of 1 % (two-sided) for the accelerometer test. What threshold on |z| do you use, and does the 0.005 m/s² offset still count as significant?
:::solution
$|z| > 2.576$. With $z = 2.5$ it no longer passes. A stricter α costs power: you'd need more samples to be sure.
:::end

:::exercise
In the code, why is a measurement at ν = (6, 0) rejected when its σ in that direction is 2 m (only 3σ)?
:::solution
$d^2 = \nu^TS^{-1}\nu$. With the correlation, $S^{-1}_{11} = 1/(4 - 1.44) = 0.39$, so $d^2 = 36\times0.39 = 14.1 > 5.99$. The correlation says a big east error should come with a north error, so a pure east error is more surprising than 3σ alone suggests.
:::end

## Quiz

:::quiz
- type: num
  q: n = 100, σ = 0.02, mean 0.005. What is z?
  answer: 2.5
  tol: 0.001
  py: "0.005/(0.02/math.sqrt(100))"
  explain: Mean over the standard error.
- type: num
  q: What is the two-sided p-value for z = 2.5?
  answer: 0.012419
  tol: 0.003
  py: "math.erfc(2.5/math.sqrt(2))"
  explain: $2(1 - \Phi(2.5))$.
- type: mc
  q: Lowering the threshold of a fault detector…
  options:
    - reduces both false alarms and missed detections
    - increases false alarms, reduces missed detections
    - reduces false alarms, increases missed detections
    - has no effect
  answer: 1
  explain: It's the α-β trade.
- type: num
  q: What is the 95 % chi-square gate for a 2-D measurement?
  answer: 5.9915
  tol: 0.001
  py: "-2*math.log(0.05)"
  explain: For 2 degrees of freedom the chi-square tail is $e^{-x/2}$.
- type: num
  q: Threshold at 1σ. What fraction of good parts are falsely rejected?
  answer: 0.15866
  tol: 0.003
  py: "0.5*math.erfc(1/math.sqrt(2))"
  explain: $1 - \Phi(1)$.
- type: mc
  q: A p-value of 0.01 means…
  options:
    - H0 has a 1 % chance of being true
    - if H0 were true, data this extreme would occur 1 % of the time
    - the effect is large
    - the test has 99 % power
  answer: 1
  explain: It's a statement about the data under H0, not about H0 itself.
:::end

:::verify
import math
from scipy import stats
assert abs(stats.norm.cdf(-0.5)-0.3085)<5e-4 and abs(stats.norm.ppf(0.995)-2.576)<5e-4
S11inv = 1/(4-1.44); assert abs(36*S11inv-14.06)<0.01 and abs(stats.chi2.ppf(0.99,2)-9.21)<0.005
:::end
