---
id: p08-l01
minutes: 30
summary: Every filter in this phase is a discrete-time system, and the useful ones are linear and time-invariant. You define linearity, time invariance, causality and BIBO stability, then write numerical tests that catch a non-linear system, a time-varying one and a non-causal one.
---

## Systems on sequences

A discrete-time system maps an input sequence $x[n]$ to an output $y[n]$. Four properties decide which tools apply:

- **Linear**: superposition holds. If $x_1 \to y_1$ and $x_2 \to y_2$, then $a x_1 + b x_2 \to a y_1 + b y_2$. Note that $y = x + 1$ is *not* linear: doubling the input doesn't double the output.
- **Time-invariant**: delaying the input delays the output and changes nothing else. $y[n] = n\,x[n]$ is time-varying.
- **Causal**: $y[n]$ depends only on $x[n], x[n-1], \dots$, never on future inputs. Real-time filters must be causal; offline processing (lesson 14) needn't be.
- **BIBO stable**: every bounded input gives a bounded output. For an LTI system, that holds exactly when the impulse response is absolutely summable: $\sum_n |h[n]| < \infty$.

## Why LTI matters

An LTI system is completely described by its **impulse response** $h[n]$. The output is the convolution (Phase 03)

$$y[n] = \sum_k h[k]\,x[n-k],$$

and in the frequency domain it multiplies each sinusoid by a complex gain $H(e^{j\omega})$. All of this phase's design methods rest on that. Most filters are written as a **difference equation**

$$y[n] = \sum_{k=0}^{M} b_k\,x[n-k] - \sum_{k=1}^{N} a_k\,y[n-k],$$

which is LTI and causal by construction. It's **FIR** if every $a_k = 0$, and **IIR** otherwise.

:::figure widget=ltitest caption="Pick a system. The readout runs the superposition, shift and causality tests; the plot overlays the response to a shifted input on the shifted response."
:::end

## Worked example

Test $y[n] = n\,x[n]$.

1. Linear? $n(a x_1 + b x_2) = a\,n x_1 + b\,n x_2$. Yes.
2. Time-invariant? Delay the input by $d$: $n\,x[n-d]$. Delay the output instead: $(n-d)\,x[n-d]$. They differ, so it's time-varying.
3. Stable? $x[n] = 1$ gives $y[n] = n$, which is unbounded, so it's unstable.
4. And $y[n] = 0.9\,y[n-1] + x[n]$: $h[n] = 0.9^n$ sums to 10, so it's stable.

## Code it from scratch

:::code file=lti_tests.py
```python
import numpy as np

rng = np.random.default_rng(0)
N = 64

def is_linear(system, trials=5):
    for _ in range(trials):
        x1, x2 = rng.standard_normal(N), rng.standard_normal(N)
        a, b = rng.standard_normal(2)
        if not np.allclose(system(a * x1 + b * x2), a * system(x1) + b * system(x2)):
            return False
    return True

def is_time_invariant(system, shift=7, trials=5):
    for _ in range(trials):
        x = np.concatenate([rng.standard_normal(N - 20), np.zeros(20)])
        xs = np.concatenate([np.zeros(shift), x[:-shift]])
        if not np.allclose(system(xs)[shift:], system(x)[:-shift]):
            return False
    return True

def is_causal(system):
    """Changing future inputs must not change past outputs."""
    x = rng.standard_normal(N)
    x2 = x.copy(); x2[40:] = rng.standard_normal(N - 40)
    return np.allclose(system(x)[:40], system(x2)[:40])

def iir(b, a):
    def run(x):
        y = np.zeros(len(x))
        for n in range(len(x)):
            y[n] = sum(b[k] * x[n - k] for k in range(len(b)) if n - k >= 0) \
                 - sum(a[k] * y[n - k] for k in range(1, len(a)) if n - k >= 0)
        return y
    return run

def bibo_stable(h, tol=1e6):
    return np.sum(np.abs(h)) < tol

if __name__ == "__main__":
    systems = {
        "moving average": lambda x: np.convolve(x, np.ones(4) / 4)[:len(x)],
        "square": lambda x: x ** 2,
        "offset": lambda x: x + 1,
        "n * x": lambda x: np.arange(len(x)) * x,
        "advance": lambda x: np.append(x[1:], 0),
        "iir": iir([1.0], [1.0, -0.9]),
    }
    expected = {"moving average": (1, 1, 1), "square": (0, 1, 1), "offset": (0, 1, 1),
                "n * x": (1, 0, 1), "advance": (1, 1, 0), "iir": (1, 1, 1)}
    for name, f in systems.items():
        got = (is_linear(f), is_time_invariant(f), is_causal(f))
        print(f"{name:15s} linear {got[0]!s:5}  time-invariant {got[1]!s:5}  causal {got[2]}")
        assert tuple(map(int, got)) == expected[name], name
    imp = np.zeros(2000); imp[0] = 1
    assert bibo_stable(iir([1.0], [1.0, -0.9])(imp)) and abs(iir([1.0], [1.0, -0.9])(imp).sum() - 10) < 1e-6
    assert not bibo_stable(iir([1.0], [1.0, -1.01])(imp))
```
:::end

## Exercises

:::exercise
Is $y[n] = \text{median}(x[n-1], x[n], x[n+1])$ linear? Time-invariant? Causal?
:::solution
Not linear (the median of a sum isn't the sum of medians), time-invariant, and not causal, because it uses $x[n+1]$. Delay the output by one sample to make it causal (lesson 9).
:::end

:::exercise
For which $a$ is $y[n] = a\,y[n-1] + x[n]$ BIBO stable?
:::solution
$h[n] = a^n$ is absolutely summable exactly when $|a| < 1$: the pole is inside the unit circle (Phase 03).
:::end

## Quiz

:::quiz
- type: mc
  q: The system y[n] = x[n] + 1 is…
  options:
    - linear and time-invariant
    - not linear, but time-invariant
    - linear but time-varying
    - non-causal
  answer: 1
  explain: An offset breaks superposition.
- type: mc
  q: An LTI system is completely described by…
  options:
    - its step size
    - its impulse response
    - its DC gain
    - its order
  answer: 1
  explain: Output = convolution with h.
- type: num
  q: Sum of the impulse response of y[n] = 0.9 y[n−1] + x[n]?
  answer: 10
  tol: 0.001
  py: "1/(1-0.9)"
  explain: A geometric series.
- type: mc
  q: A filter is FIR when…
  options:
    - all feedback coefficients a_k (k ≥ 1) are zero
    - it is unstable
    - it uses future samples
    - it has poles outside the unit circle
  answer: 0
  explain: No feedback.
- type: mc
  q: y[n] = n x[n] is…
  options:
    - time-invariant
    - time-varying
    - non-linear
    - non-causal
  answer: 1
  explain: The gain depends on n.
- type: num
  q: Output y[3] of y[n] = 0.9 y[n−1] + x[n] for a unit impulse at n = 0?
  answer: 0.729
  tol: 0.001
  py: "0.9**3"
  explain: h[n] = 0.9ⁿ.
:::end

:::verify
assert abs(sum(0.9**n for n in range(500)) - 10) < 1e-6
:::end
