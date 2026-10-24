---
id: p04-l12
minutes: 40
summary: Sample where it matters, then correct with weights. You estimate a one-in-thirty-thousand failure probability with a few thousand samples, measure weight degeneracy with the effective sample size, implement systematic resampling, and build a particle filter that matches a Kalman filter on a linear problem.
---

## Importance sampling

Plain Monte Carlo (lesson 8) wastes effort on rare events. To estimate $P(X > 4)$ for a standard normal, which is $3.17\times10^{-5}$, you'd need millions of samples to see a few hundred hits.

Instead, draw from a **proposal** $q(x)$ that puts samples where the event happens, and correct each sample with a weight:

$$\mathbb E_p[f(X)] = \int f(x)\frac{p(x)}{q(x)}q(x)\,dx \approx \frac1M\sum_i f(x_i)w_i, \qquad w_i = \frac{p(x_i)}{q(x_i)}, \quad x_i \sim q.$$

For $p = \mathcal N(0, 1)$ and $q = \mathcal N(4, 1)$, the weight simplifies to $w = e^{-4x + 8}$. Half the samples now land in the region of interest.

**Effective sample size.** With normalised weights $\tilde w_i$, $\text{ESS} = 1/\sum\tilde w_i^2$. Equal weights give $M$; one dominant weight gives 1. A poor proposal looks fine until you check the ESS.

## From weights to a particle filter

A particle filter is importance sampling repeated over time. Each particle is a guess of the state.

1. **Predict**: move each particle through the motion model with random noise.
2. **Weight**: multiply each weight by the measurement likelihood (Bayes' rule, lesson 6).
3. **Resample** when the ESS drops: draw a new set in proportion to the weights, so good particles are duplicated and bad ones die out.

**Systematic resampling** uses one random offset $u_0 \in [0, 1/M)$ and the evenly spaced points $u_0 + i/M$ against the cumulative weights. Each particle is copied either $\lfloor M\tilde w_i\rfloor$ or $\lceil M\tilde w_i\rceil$ times, which adds less noise than drawing independently.

:::figure widget=particles caption="60 particles weighted by a two-peaked likelihood (dashed). Each press of Resample duplicates heavy particles and drops light ones; the effective sample size jumps back up."
:::end

## Worked example

1. **The tail probability.** 4000 samples from $\mathcal N(4, 1)$ weighted by $e^{-4x+8}$ estimate $P(X > 4)$ to within about 5 % of $3.167\times10^{-5}$. Plain Monte Carlo with the same 4000 samples would most likely see zero hits.
2. **Resampling counts.** Weights (0.5, 0.3, 0.15, 0.05) with $M = 4$ give expected copies (2, 1.2, 0.6, 0.2). Systematic resampling copies the first particle exactly twice, and the others 1 or 2, 0 or 1, and 0 or 1 times.
3. **Tracking.** A cart does a random walk with per-step σ 0.1 m and a sensor with σ 0.5 m. A Kalman filter is the exact optimum for this linear Gaussian problem; a 500-particle filter tracks with an RMS error within a few per cent of it.

## Code it from scratch

:::code file=particles.py
```python
import math
import numpy as np

def systematic_resample(w, rng):
    M = len(w)
    c = np.cumsum(w / np.sum(w))
    c[-1] = 1.0
    u = (rng.random() + np.arange(M)) / M
    return np.searchsorted(c, u)

def ess(w):
    w = w / np.sum(w)
    return 1.0 / np.sum(w**2)

if __name__ == "__main__":
    rng = np.random.default_rng(12)
    x = rng.normal(4.0, 1.0, 4000)
    w = np.exp(-4 * x + 8)
    est = np.mean((x > 4) * w)
    print(f"P(X>4) ~ {est:.3e} (exact 3.167e-05)")
    assert abs(est / 3.167124e-05 - 1) < 0.08

    assert abs(ess(np.ones(10)) - 10) < 1e-12 and abs(ess(np.array([1, 0, 0, 0.0])) - 1) < 1e-12
    wq = np.array([0.5, 0.3, 0.15, 0.05])
    for _ in range(200):
        cnt = np.bincount(systematic_resample(wq, rng), minlength=4)
        assert cnt[0] == 2 and np.all(np.abs(cnt - 4 * wq) < 1)

    # particle filter vs Kalman filter on a 1-D random walk
    T, q, r, M = 300, 0.1, 0.5, 500
    truth = np.cumsum(q * rng.standard_normal(T))
    z = truth + r * rng.standard_normal(T)
    p = rng.normal(0, 1, M)
    m, P = 0.0, 1.0
    epf, ekf = [], []
    for k in range(T):
        p = p + q * rng.standard_normal(M)
        wk = np.exp(-0.5 * ((z[k] - p) / r) ** 2)
        epf.append(np.sum(wk * p) / np.sum(wk) - truth[k])
        p = p[systematic_resample(wk, rng)]
        P += q * q
        K = P / (P + r * r)
        m += K * (z[k] - m)
        P *= 1 - K
        ekf.append(m - truth[k])
    rpf, rkf = math.sqrt(np.mean(np.square(epf[50:]))), math.sqrt(np.mean(np.square(ekf[50:])))
    print(f"RMS error: particle {rpf:.3f}, Kalman {rkf:.3f}, raw sensor {r}")
    assert rkf < 0.3 and abs(rpf / rkf - 1) < 0.1
```
:::end

## Exercises

:::exercise
Why not use the proposal $q = \mathcal N(10, 1)$ to estimate $P(X > 4)$?
:::solution
Almost every sample lands far beyond 4, where $p(x)$ is tiny, while the region just above 4 that contributes most of the probability is barely sampled. The weights there would be enormous and rare, so the ESS would collapse and the estimate would be erratic. A good proposal covers where $f(x)p(x)$ is large.
:::end

:::exercise
A filter's normalised weights are (0.97, 0.01, 0.01, 0.01). Compute the ESS and say whether to resample.
:::solution
$\text{ESS} = 1/(0.9409 + 3\times0.0001) = 1.06$. Out of 4 particles only about one is effectively in use, far below the usual $M/2$ rule, so resample.
:::end

## Quiz

:::quiz
- type: num
  q: What is P(X > 4) for a standard normal?
  answer: 3.1671e-5
  tol: 0.003
  py: "0.5*math.erfc(4/math.sqrt(2))"
  explain: It's about 1 in 31 600.
- type: num
  q: What is the importance weight $p(x)/q(x)$ for p = N(0,1), q = N(4,1) at x = 4.5?
  answer: 4.5400e-5
  tol: 0.003
  py: "math.exp(-4*4.5+8)"
  explain: $e^{-4x+8}$.
- type: num
  q: Weights (0.97, 0.01, 0.01, 0.01). What is the ESS?
  answer: 1.0624
  tol: 0.003
  py: "1/(0.97**2+3*0.01**2)"
  explain: $1/\sum\tilde w_i^2$.
- type: mc
  q: Systematic resampling copies a particle with normalised weight $\tilde w$ in a set of M…
  options:
    - exactly $M\tilde w$ times
    - $\lfloor M\tilde w\rfloor$ or $\lceil M\tilde w\rceil$ times
    - a Poisson number of times
    - once
  answer: 1
  explain: Evenly spaced pointers can't skip or bunch up by more than one.
- type: mc
  q: For a linear system with Gaussian noise, a particle filter…
  options:
    - beats the Kalman filter
    - approaches the Kalman filter's accuracy with enough particles
    - is always much worse
    - needs no measurement model
  answer: 1
  explain: The Kalman filter is exact in that case; particles approximate the same posterior.
- type: mc
  q: The weighting step of a particle filter applies…
  options:
    - the motion model
    - the measurement likelihood (Bayes' rule)
    - resampling
    - a low-pass filter
  answer: 1
  explain: Weights ∝ prior weight × likelihood.
:::end

:::verify
import math
assert abs(math.exp(-0.5*4.5**2)/math.exp(-0.5*0.5**2) - math.exp(-4*4.5+8)) < 1e-15
assert abs(1/(0.9409+0.0003)-1.06)<0.005
:::end
