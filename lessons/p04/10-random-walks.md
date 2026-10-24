---
id: p04-l10
minutes: 30
summary: Noise isn't always white. You build a random walk and a first-order Gauss-Markov process from white noise, derive their variance and autocorrelation, and discretise a slowly drifting sensor bias so a filter can model it correctly.
---

## Three kinds of noise

- **White noise**: independent from sample to sample. Its autocorrelation is a spike at lag 0 and its spectrum is flat. Most sensor read-out noise is close to white.
- **Random walk**: the running sum of white noise, $x_{k+1} = x_k + w_k$ with $w_k \sim \mathcal N(0, q)$. Since the variances add, $\operatorname{Var}(x_k) = kq$: the spread grows with $\sqrt t$ without limit. Integrated gyro noise and the position of an unpowered drifting object both behave like this.
- **First-order Gauss-Markov (GM)**: a random walk with a leak back to zero,

$$x_{k+1} = \varphi x_k + w_k, \qquad \varphi = e^{-\Delta t/T}.$$

Here $T$ is the correlation time. Its autocorrelation is $\sigma^2e^{-|\tau|/T}$: samples close in time are similar, and samples far apart are unrelated. Real sensor biases (temperature drift, a slowly changing gyro offset) often fit this better than either extreme.

## The stationary variance

For the GM process to settle at a chosen variance $\sigma^2$, the variance mustn't change from step to step: $\sigma^2 = \varphi^2\sigma^2 + q$, so

$$q = \sigma^2(1 - \varphi^2).$$

That's how to put a "bias drifts by about σ over times of order T" assumption into a Kalman filter (Phase 14) as a state with its own process noise. With $T \to \infty$ the GM becomes a random walk; with $T \to 0$ it becomes white noise.

:::figure widget=noise caption="Grey is white noise, amber is a random walk (wanders off without limit) and lime is Gauss-Markov (wanders but returns). Change τ to slide between white noise and a random walk."
:::end

## Worked example

A pressure sensor's offset drifts with temperature. It wanders by about σ = 0.5 hPa with a correlation time of 10 minutes, and the filter runs at 1 Hz.

1. $\varphi = e^{-1/600} = 0.998335$.
2. $q = 0.5^2(1 - 0.998335^2) = 8.32\times10^{-4}$, so the per-step driving noise is $\sqrt q = 0.0288$ hPa.
3. Correlation after 10 minutes: $e^{-1} = 0.368$. After an hour: $e^{-6} = 0.0025$, effectively independent.
4. If you'd modelled it as a random walk with the same $q$, after a day its σ would be $\sqrt{86\,400\times8.32\times10^{-4}} = 8.5$ hPa, a wildly pessimistic model of a sensor that never drifts more than about 1 hPa.

## Code it from scratch

:::code file=gauss_markov.py
```python
import math
import numpy as np

def gauss_markov(n, T, sigma, dt, rng):
    phi = math.exp(-dt / T)
    q = sigma**2 * (1 - phi**2)
    x = np.empty(n)
    x[0] = sigma * rng.standard_normal()
    w = math.sqrt(q) * rng.standard_normal(n)
    for k in range(1, n):
        x[k] = phi * x[k - 1] + w[k]
    return x, phi, q

if __name__ == "__main__":
    rng = np.random.default_rng(8)
    x, phi, q = gauss_markov(400_000, 600.0, 0.5, 1.0, rng)
    assert abs(phi - 0.998335) < 1e-6 and abs(math.sqrt(q) - 0.028843) < 1e-6
    assert abs(x.std() - 0.5) < 0.05                       # stationary at sigma
    lag = 600
    rho = np.corrcoef(x[:-lag], x[lag:])[0, 1]
    print(f"autocorrelation at T: {rho:.3f} (theory {math.exp(-1):.3f})")
    assert abs(rho - math.exp(-1)) < 0.06
    # random walk: variance grows linearly with time
    walks = np.cumsum(rng.standard_normal((4000, 400)) * 0.1, axis=1)
    assert abs(walks[:, 99].var() / (100 * 0.01) - 1) < 0.08
    assert abs(walks[:, 399].var() / walks[:, 99].var() - 4) < 0.5
```
:::end

## Exercises

:::exercise
A random walk has per-step σ of 0.1. After how many steps does its σ reach 1?
:::solution
$\sigma_k = 0.1\sqrt k = 1$ gives $k = 100$.
:::end

:::exercise
A GM process has T = 50 s and you sample at 100 Hz. What is φ, and why does that make the process hard to tell from a random walk in a 5-second record?
:::solution
$\varphi = e^{-0.01/50} = 0.9998$. Over 5 s (a tenth of T) the leak back to zero is negligible, so it behaves like a random walk. You need records many times longer than T to see it level off.
:::end

## Quiz

:::quiz
- type: num
  q: What is φ for T = 600 s and Δt = 1 s?
  answer: 0.99833
  tol: 0.0001
  py: "math.exp(-1/600)"
  explain: $\varphi = e^{-\Delta t/T}$.
- type: num
  q: With σ = 0.5 hPa, what is the per-step driving noise √q?
  answer: 0.028843
  tol: 0.003
  unit: hPa
  py: "0.5*math.sqrt(1-math.exp(-2/600))"
  explain: $q = \sigma^2(1 - \varphi^2)$.
- type: mc
  q: The variance of a random walk…
  options:
    - stays constant
    - grows linearly with time
    - grows with t²
    - decays to zero
  answer: 1
  explain: Independent increments add their variances.
- type: num
  q: What is the GM autocorrelation coefficient at lag 2T?
  answer: 0.13534
  tol: 0.002
  py: "math.exp(-2)"
  explain: $e^{-|\tau|/T}$.
- type: mc
  q: As the correlation time T → 0, a Gauss-Markov process becomes…
  options:
    - a random walk
    - white noise
    - a constant
    - a sine wave
  answer: 1
  explain: Each sample forgets the last immediately.
- type: num
  q: How many steps until a random walk with per-step σ 0.1 reaches σ = 1?
  answer: 100
  tol: 0.001
  py: "(1/0.1)**2"
  explain: $\sigma\sqrt k$.
:::end

:::verify
import math
q = 0.25*(1-math.exp(-2/600))
assert abs(q-8.32e-4)<5e-6 and abs(math.sqrt(86400*q)-8.5)<0.05 and abs(math.exp(-6)-0.0025)<5e-5
assert abs(math.exp(-0.01/50)-0.9998)<5e-5
:::end
