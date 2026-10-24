---
id: p08-l03
minutes: 30
summary: The one-pole IIR filter is the digital RC, the workhorse smoother of embedded code. You derive the coefficient from the time constant exactly and approximately, compare its response with the RC it imitates, and check that the measured time constant matches the design.
---

## The digital RC

An RC low-pass obeys $\tau\dot y = x - y$. Sampled every $T_s$, the standard digital version is

$$y[n] = a\,y[n-1] + (1-a)\,x[n],$$

an IIR filter with one pole at $z = a$. Set $a$ from the time constant:

- **Exact (step-invariant)**: $a = e^{-T_s/\tau}$. The discrete step response matches the RC's at every sample.
- **Backward Euler**: $a = \tau/(\tau + T_s)$. Close when $T_s \ll \tau$; it's the form used in the complementary filter (Phase 07 lesson 18).
- **Small-step shortcut**: $1 - a \approx T_s/\tau$.

At $T_s/\tau = 0.1$: exact $a = 0.9048$, backward Euler 0.9091, shortcut 0.9. All are similar, but they drift apart as $T_s$ approaches $\tau$.

## Properties

- **DC gain** 1, because the coefficients sum to 1.
- **Cutoff**: $f_c = 1/(2\pi\tau)$, provided $f_c \ll f_s$.
- **Noise**: white-noise variance falls by $(1-a)/(1+a) \approx T_s/(2\tau)$.
- **Cost**: one multiply-add and one state variable, so it fits on any microcontroller. In fixed point, keep extra fraction bits in the state, or small inputs get stuck (lesson 13).

Unlike the moving average, it has no nulls and an exponentially fading memory, and its phase isn't linear.

:::figure widget=iir1 caption="Step response of the continuous RC (dashed) and the discrete filter. The exact coefficient (lime) lands on the curve at every sample; the backward-Euler one (amber) lags slightly at coarse sampling."
:::end

## Worked example

Smooth a 1 kHz-sampled sensor with τ = 20 ms.

1. Exact: $a = e^{-1/20} = 0.95123$.
2. Cutoff: $1/(2\pi\times0.02) = 7.96$ Hz.
3. White-noise rms falls by $\sqrt{(1-a)/(1+a)} = \sqrt{0.04877/1.95123} = 0.158$, about 6.3×.
4. Settling to 1 %: $\tau\ln 100 = 92$ ms, which is 92 samples.

## Code it from scratch

:::code file=first_order_iir.py
```python
import numpy as np

class OnePole:
    def __init__(self, tau, ts, exact=True):
        self.a = np.exp(-ts / tau) if exact else tau / (tau + ts)
        self.y = 0.0
    def __call__(self, x):
        self.y = self.a * self.y + (1 - self.a) * x
        return self.y

def measured_tau(f, ts, n=2000):
    y = np.array([f(1.0) for _ in range(n)])
    k = np.argmax(y >= 1 - np.exp(-1))                  # first sample at or past 63.2 %
    # interpolate between samples k-1 and k
    y0, y1 = (y[k - 1] if k else 0.0), y[k]
    return ((k - 1) + (1 - np.exp(-1) - y0) / (y1 - y0) + 1) * ts   # sample k is at time (k+1) ts

if __name__ == "__main__":
    tau, ts = 0.020, 0.001
    f = OnePole(tau, ts)
    assert abs(f.a - 0.95123) < 1e-5
    t = np.arange(1, 200) * ts
    y = np.array([f(1.0) for _ in t])
    assert np.allclose(y, 1 - np.exp(-t / tau))              # step-invariant: exact at every sample
    for tau_design in (0.005, 0.02, 0.1):
        est = measured_tau(OnePole(tau_design, ts), ts)
        assert abs(est - tau_design) / tau_design < 0.01, (tau_design, est)
    rng = np.random.default_rng(3)
    f = OnePole(tau, ts)
    out = np.array([f(v) for v in rng.standard_normal(200_000)])
    ratio = out[1000:].std()
    assert abs(ratio - np.sqrt((1 - f.a) / (1 + f.a))) < 0.005
    be = OnePole(0.001, 0.001, exact=False).a
    assert abs(be - 0.5) < 1e-12 and abs(np.exp(-1) - 0.3679) < 1e-4    # they differ a lot at Ts = tau
    print(f"a = {OnePole(tau, ts).a:.5f}, noise rms ratio {ratio:.3f}, measured tau matches design within 1 %")
```
:::end

## Exercises

:::exercise
Your control loop runs at 100 Hz, and you want a 5 Hz filter cutoff. Find $a$ two ways.
:::solution
$\tau = 1/(2\pi\cdot5) = 31.8$ ms and $T_s = 10$ ms. Exact: $e^{-0.314} = 0.730$. Backward Euler: $31.8/41.8 = 0.761$. The difference is noticeable, so use the exact form.
:::end

:::exercise
Why must the filter's state carry extra bits in fixed point?
:::solution
When $(1-a)(x - y)$ is smaller than one LSB, the update rounds to zero, and the output stops short of the input: a dead band. Keeping, say, 8 extra fraction bits in $y$ makes the dead band 256 times smaller.
:::end

## Quiz

:::quiz
- type: num
  q: Exact coefficient a for τ = 20 ms and T_s = 1 ms?
  answer: 0.95123
  tol: 0.001
  py: "math.exp(-1/20)"
  explain: e^(−T_s/τ).
- type: num
  q: Backward-Euler coefficient for τ = 20 ms and T_s = 1 ms?
  answer: 0.95238
  tol: 0.001
  py: "20/21"
  explain: τ/(τ + T_s).
- type: num
  q: Cutoff frequency in Hz for τ = 20 ms?
  answer: 7.9577
  tol: 0.001
  unit: Hz
  py: "1/(2*math.pi*0.02)"
  explain: 1/(2πτ).
- type: num
  q: Noise rms reduction factor √((1−a)/(1+a)) for a = 0.95123?
  answer: 0.1581
  tol: 0.003
  py: "math.sqrt((1-0.95123)/(1+0.95123))"
  explain: About T_s/(2τ) in variance.
- type: mc
  q: The filter's DC gain is…
  options:
    - a
    - 1, because the coefficients sum to one
    - 1 − a
    - 1/(1 − a)
  answer: 1
  explain: a + (1 − a) = 1.
- type: num
  q: Settling time to 1 % in ms for τ = 20 ms?
  answer: 92.103
  tol: 0.002
  unit: ms
  py: "20*math.log(100)"
  explain: τ ln 100.
:::end

:::verify
import math
assert abs(math.exp(-0.1) - 0.9048) < 1e-4
:::end
