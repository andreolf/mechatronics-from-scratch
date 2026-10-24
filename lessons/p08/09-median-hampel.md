---
id: p08-l09
minutes: 30
summary: A single wild sample (a dropped bit, an EMI spike, an encoder glitch) wrecks a linear filter's output for N samples. Order statistics don't care. You implement the running median and the Hampel identifier, and show both remove injected spikes while keeping steps sharp, where a moving average smears the step and only dilutes the spikes.
---

## Linear filters spread outliers

A moving average of length $N$ turns one spike of height $A$ into a plateau of height $A/N$ lasting $N$ samples. The spike isn't removed, only diluted. The filter also turns a clean step into a ramp $N$ samples long. Linear filters can't tell an outlier from a signal.

## The running median

Output the **median** of the last $K$ samples ($K$ odd):

$$y[n] = \operatorname{median}\{x[n-K+1], \dots, x[n]\}.$$

- An isolated spike is never the middle value, so it disappears completely, as long as fewer than half the window are outliers.
- A step stays a step: once more than half the window is on the new level, the output jumps. The edge is delayed by $(K-1)/2$ samples (with a centred window offline, not at all) but not smeared.
- It's non-linear (lesson 1), so there's no frequency response. Its noise reduction on Gaussian noise is a little worse than a mean's, about $\sqrt{\pi/2}$ times the standard error.

## The Hampel identifier

Sometimes you want to keep good samples untouched and replace only the bad ones. In each window, compute the median $m$ and the **median absolute deviation** $\text{MAD} = \operatorname{median}|x_i - m|$. For Gaussian data, $1.4826\,\text{MAD}$ estimates σ robustly. Flag a sample as an outlier if

$$|x[n] - m| > t\cdot1.4826\cdot\text{MAD},$$

typically with $t = 3$, and replace it with $m$. Everything else passes through unchanged.

:::figure widget=median caption="A step with noise and spikes: raw (blue), moving average (red) and running median (lime). Widen the window and compare the errors."
:::end

## Worked example

Samples: 1.0, 1.1, 0.9, 9.0, 1.0, 1.1, 0.9 (one spike).

1. A 5-point moving average around the spike gives $(0.9 + 9.0 + 1.0 + 1.1 + 0.9)/5 = 2.58$.
2. The 5-point median of the same window: sorted 0.9, 0.9, 1.0, 1.1, 9.0, so the median is 1.0.
3. Hampel with 7 points: $m = 1.0$; the deviations are 0, 0.1, 0.1, 8.0, 0, 0.1, 0.1, so MAD = 0.1 and the threshold is $3\times1.4826\times0.1 = 0.445$. Only 9.0 is flagged; it becomes 1.0.

## Code it from scratch

:::code file=median_hampel.py
```python
import numpy as np

def running_median(x, k):
    h = (k - 1) // 2
    xp = np.pad(x, h, mode="edge")
    return np.array([np.median(xp[i:i + k]) for i in range(len(x))])     # centred window (offline)

def hampel(x, k=7, t=3.0):
    h = (k - 1) // 2
    xp = np.pad(x, h, mode="edge")
    y, flagged = x.copy(), np.zeros(len(x), bool)
    for i in range(len(x)):
        w = xp[i:i + k]
        m = np.median(w)
        mad = np.median(np.abs(w - m))
        if np.abs(x[i] - m) > t * 1.4826 * mad:
            y[i], flagged[i] = m, True
    return y, flagged

def moving_average(x, k):
    h = (k - 1) // 2
    return np.convolve(np.pad(x, h, mode="edge"), np.ones(k) / k, mode="valid")

if __name__ == "__main__":
    rng = np.random.default_rng(9)
    n = 400
    truth = np.where(np.arange(n) >= 200, 2.0, 0.0)
    x = truth + 0.05 * rng.standard_normal(n)
    spikes = rng.choice(np.r_[10:190, 210:390], 12, replace=False)
    x[spikes] += rng.choice([-3, 4], 12)
    med = running_median(x, 7)
    ham, flagged = hampel(x, 7)
    ma = moving_average(x, 7)
    err = lambda y: np.abs(y - truth)[np.r_[5:195, 205:395]].max()
    print(f"worst error away from the step: moving average {err(ma):.2f}, median {err(med):.2f}, Hampel {err(ham):.2f}")
    assert err(med) < 0.25 and err(ham) < 0.25 and err(ma) > 0.4
    assert set(spikes) <= set(np.flatnonzero(flagged))
    assert flagged.sum() < 30                                        # good samples mostly untouched
    # the step stays sharp: within one sample, the median output switches level
    assert med[198] < 0.5 and med[201] > 1.5
    assert ma[198] > 0.5 or ma[201] < 1.5                            # the average smears it
    w = np.array([1.0, 1.1, 0.9, 9.0, 1.0, 1.1, 0.9])
    assert abs(np.mean(w[2:7]) - 2.58) < 1e-9 and np.median(w[2:7]) == 1.0
    y, f = hampel(w, 7)
    assert f[3] and y[3] == 1.0                                     # the spike is flagged and replaced by the median
```
:::end

## Exercises

:::exercise
Your encoder occasionally reports bursts of three bad samples in a row. What median window do you need?
:::solution
The outliers must be fewer than half the window, so $K \ge 7$. Three bad samples in a window of 7 still leave four good ones, and the median is a good one.
:::end

:::exercise
Why does the Hampel filter use the MAD instead of the standard deviation?
:::solution
The standard deviation is itself blown up by the outliers it should detect, so a big spike raises the threshold and hides itself. The MAD ignores up to half the samples being wild.
:::end

## Quiz

:::quiz
- type: num
  q: 5-point moving average of 1.1, 0.9, 9.0, 1.0, 1.1?
  answer: 2.62
  tol: 0.001
  py: "(1.1+0.9+9.0+1.0+1.1)/5"
  explain: The spike is diluted, not removed.
- type: num
  q: Median of the same five samples?
  answer: 1.1
  tol: 0.001
  py: "sorted([1.1,0.9,9.0,1.0,1.1])[2]"
  explain: Sorted 0.9, 1.0, 1.1, 1.1, 9.0; the spike can't be the middle value.
- type: num
  q: Hampel threshold for MAD = 0.1 and t = 3?
  answer: 0.44478
  tol: 0.002
  py: "3*1.4826*0.1"
  explain: t · 1.4826 · MAD.
- type: mc
  q: A running median applied to a clean step…
  options:
    - turns it into a ramp
    - keeps it sharp (possibly delayed)
    - removes it
    - adds overshoot
  answer: 1
  explain: Order statistics preserve edges.
- type: num
  q: Minimum odd window to reject bursts of 3 consecutive outliers?
  answer: 7
  tol: 0.001
  py: "7"
  explain: Outliers must be fewer than half.
- type: mc
  q: The median filter is…
  options:
    - linear and time-invariant
    - non-linear, so it has no frequency response
    - an IIR filter
    - unstable
  answer: 1
  explain: Superposition fails.
:::end

:::verify
assert sorted([0.9,9.0,1.0,1.1,0.9])[2] == 1.0
:::end
