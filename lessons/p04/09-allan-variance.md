---
id: p04-l09
minutes: 40
summary: A gyro's datasheet noise figures come from one plot. You derive the Allan variance, see why white rate noise gives a −½ slope and rate random walk a +½ slope, simulate a MEMS gyro, and recover its angle random walk to within 10 % from raw samples.
---

## Why a plain standard deviation isn't enough

Record a stationary gyro for an hour and compute the standard deviation of its rate. The number depends on how long you recorded: the bias wanders, so longer records look noisier. Different noise processes dominate at different time scales, and a single σ mixes them together.

The **Allan variance** separates them. Split the record into bins of length $\tau$, average the rate in each bin to get $\bar y_k$, and take half the mean squared difference between neighbouring bins:

$$\sigma^2(\tau) = \tfrac12\left\langle(\bar y_{k+1} - \bar y_k)^2\right\rangle.$$

Differencing neighbours cancels a constant bias and is barely affected by slow drift. Plot $\sigma(\tau)$ against $\tau$ on log-log axes and each noise type appears as a straight line with its own slope.

## Reading the slopes

**White rate noise (angle random walk, ARW).** If samples have independent noise with density $N$, a bin of length $\tau$ averages it down to variance $N^2/\tau$. Neighbouring bins are independent, so the difference has variance $2N^2/\tau$, and halving gives

$$\sigma(\tau) = \frac{N}{\sqrt\tau} \qquad (\text{slope } -\tfrac12).$$

Read $N$ where the line crosses $\tau = 1$ s. Integrated, this noise makes the heading wander as $\sigma_\theta(t) = N\sqrt t$, hence "angle random walk".

**Rate random walk (RRW).** If the bias itself does a random walk with strength $K$, the Allan deviation grows as $\sigma(\tau) = K\sqrt{\tau/3}$ (slope $+\tfrac12$). Between the two, the curve bottoms out; the minimum is roughly the **bias instability** quoted on datasheets.

**Units.** Datasheets quote ARW in °/√h. Since $1\ \text{h} = 3600$ s, 1 °/√h $= \frac{1}{60}$ °/√s, which is $\frac{1}{60}$ (°/s)/√Hz. RRW in °/h/√h converts with a factor $1/216\,000$.

:::figure widget=allan caption="Allan deviation of a simulated gyro (lime) with the ARW and RRW asymptotes (dashed). Increase the rate random walk and the right-hand rise moves left."
:::end

## Worked example

A MEMS gyro is sampled at 100 Hz with ARW 0.2 °/√h.

1. In SI-friendly units, $N = 0.2/60 = 3.33\times10^{-3}$ (°/s)/√Hz.
2. Per-sample σ at 100 Hz: $N\sqrt{f_s} = 3.33\times10^{-3}\times10 = 0.0333$ °/s. That's the number a plain σ of the raw data would show.
3. On the Allan plot, $\sigma(1\ \text{s}) = N = 3.33\times10^{-3}$ °/s (12 °/h).
4. Integrated heading error after 100 s from ARW alone: $0.2\sqrt{100/3600} = 0.033°$. After an hour it's 0.2°.
5. Simulate an hour of data, compute $\sigma(\tau)$, and read it at τ = 1 s: the code recovers $N$ to within 10 %.

## Code it from scratch

:::code file=allan.py
```python
import numpy as np

def allan(rate, fs, taus):
    """Non-overlapping Allan deviation of a rate signal."""
    out = []
    for tau in taus:
        m = int(round(tau * fs))
        k = len(rate) // m
        ybar = rate[: k * m].reshape(k, m).mean(axis=1)
        out.append(np.sqrt(0.5 * np.mean(np.diff(ybar) ** 2)))
    return np.array(out)

if __name__ == "__main__":
    fs, T = 100.0, 3600.0
    arw = 0.2                                   # deg/sqrt(h)
    N = arw / 60                                 # (deg/s)/sqrt(Hz)
    rng = np.random.default_rng(4)
    n = int(fs * T)
    rate = N * np.sqrt(fs) * rng.standard_normal(n) + 0.7    # constant bias 0.7 deg/s
    assert abs(rate.std() - 0.0333) < 1e-3
    taus = np.array([0.1, 1.0, 10.0])
    ad = allan(rate, fs, taus)
    print("sigma(1 s) =", ad[1], "expected", N)
    assert abs(ad[1] / N - 1) < 0.10                          # ARW recovered within 10 %
    slope = np.polyfit(np.log(taus), np.log(ad), 1)[0]
    assert abs(slope + 0.5) < 0.05                            # -1/2 slope; the bias cancels
    # add rate random walk: the long-tau end rises with slope +1/2
    K = 40 / 216000                                           # 40 deg/h/sqrt(h)
    bias = np.cumsum(K * np.sqrt(1 / fs) * rng.standard_normal(n))
    ad2 = allan(rate + bias, fs, [1.0, 100.0, 300.0])
    assert ad2[2] > ad2[1] and abs(ad2[2] / (K * np.sqrt(300 / 3)) - 1) < 0.5
```
:::end

## Exercises

:::exercise
A fibre-optic gyro has ARW 0.005 °/√h. What heading error does ARW alone cause after 4 hours?
:::solution
$0.005\sqrt4 = 0.01°$. Compare a 0.2 °/√h MEMS gyro: 0.4°. That forty-fold gap is part of why navigation-grade gyros cost thousands.
:::end

:::exercise
Why does the Allan variance use differences of neighbouring bin averages instead of the variance of the bin averages?
:::solution
The variance of the bin averages includes the bias and every slow drift, so it grows with record length and doesn't converge. Differencing neighbours removes a constant offset and suppresses slow trends, so each τ isolates noise at that time scale.
:::end

## Quiz

:::quiz
- type: num
  q: Convert ARW 0.2 °/√h to (°/s)/√Hz.
  answer: 0.0033333
  tol: 0.002
  py: "0.2/60"
  explain: Divide by √3600 = 60.
- type: num
  q: What is the per-sample σ in °/s of that gyro at 100 Hz?
  answer: 0.033333
  tol: 0.002
  unit: °/s
  py: "0.2/60*math.sqrt(100)"
  explain: $N\sqrt{f_s}$.
- type: mc
  q: White rate noise appears on an Allan deviation plot as a slope of…
  options:
    - +1
    - +½
    - −½
    - 0
  answer: 2
  explain: Averaging over τ shrinks white noise as $1/\sqrt\tau$.
- type: num
  q: Heading error in degrees after 4 h from ARW 0.005 °/√h?
  answer: 0.01
  tol: 0.002
  unit: °
  py: "0.005*math.sqrt(4)"
  explain: $\sigma_\theta = N\sqrt t$.
- type: mc
  q: The minimum of the Allan deviation curve is usually reported as…
  options:
    - angle random walk
    - bias instability
    - scale factor
    - full-scale range
  answer: 1
  explain: It's the flat floor between the white-noise and random-walk regions.
- type: mc
  q: A constant gyro bias affects the Allan variance by…
  options:
    - adding to it at every τ
    - nothing: neighbouring differences cancel it
    - doubling it
    - adding a +1 slope
  answer: 1
  explain: The constant appears in both bins and subtracts out.
- type: num
  q: What is the heading error in degrees after 100 s from ARW 0.2 °/√h?
  answer: 0.033333
  tol: 0.002
  unit: °
  py: "0.2*math.sqrt(100/3600)"
  explain: Convert seconds to hours first.
:::end

:::verify
assert abs(0.2/60*3600 - 12) < 1e-9 and abs(3600**0.5*3600 - 216000) < 1e-9
:::end
