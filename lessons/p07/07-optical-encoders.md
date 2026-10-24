---
id: p07-l07
minutes: 35
summary: An encoder gives position directly, but speed must be estimated, and the two classic estimators fail in opposite places. You derive the resolution of the frequency (count edges per window) and period (time one edge) methods, simulate both on encoder edges, and find the crossover speed.
---

## From counts to speed

Lesson 9 of Phase 06 turned A/B channels into a position count with 4× decoding. A 500-line encoder gives $N = 2000$ counts per revolution. Speed is the derivative of position, and you have two ways to measure it:

**Frequency method (M method).** Count the edges $\Delta c$ in a fixed window $T_s$ (the control period):

$$\hat\omega = \frac{\Delta c}{N T_s}\ \text{rev/s},\qquad \text{resolution} = \frac{1}{N T_s}.$$

The resolution is a fixed step of speed: at 1 ms and 2000 counts/rev, 0.5 rev/s (30 rpm). That's fine at 50 rev/s (1 %) but useless at 1 rev/s (50 %).

**Period method (T method).** Time the interval between consecutive edges with a fast timer at $f_t$, measuring $n$ ticks:

$$\hat\omega = \frac{f_t}{N n},\qquad \text{relative resolution} = \frac1n = \frac{\omega N}{f_t}.$$

It's excellent at low speed (many ticks per edge) and poor at high speed. Its update rate also falls with speed, and at standstill it never updates, so it needs a timeout.

The relative resolutions are equal when $\omega^2 = f_t/(N^2 T_s)$. Above that speed count edges; below it time them. The **M/T method** combines both: count edges in the window *and* time the window exactly from the first to the last edge.

:::figure widget=encspeed caption="Resolution of each method in percent of the measured speed, log-log. The frequency method (blue) improves with speed, the period method (amber) worsens; the dashed line is the crossover."
:::end

## Worked example

$N = 2000$, $T_s = 1$ ms, $f_t = 10$ MHz.

1. Frequency method: resolution 0.5 rev/s. At 2 rev/s that's 25 %; at 80 rev/s, 0.6 %.
2. Period method at 2 rev/s: edges arrive every $1/(2\times2000) = 250$ µs, which is 2500 ticks, so the resolution is 0.04 %. At 80 rev/s it's 62.5 ticks, so 1.6 %.
3. Crossover: $\sqrt{10^7/(2000^2\times10^{-3})} = 50$ rev/s, with both at 1 %.

## Code it from scratch

:::code file=encoder_speed.py
```python
import numpy as np

N, TS, FT = 2000, 1e-3, 10e6
rng = np.random.default_rng(2)

def edge_times(speed, duration, jitter=0.0):
    """Times of encoder counts for a constant speed in rev/s, with optional edge jitter (seconds)."""
    dt = 1 / (speed * N)
    t = np.arange(dt * rng.uniform(0, 1), duration, dt)
    return np.sort(t + jitter * rng.standard_normal(t.size))

def frequency_method(edges, duration):
    windows = np.arange(0, duration, TS)
    counts = np.histogram(edges, bins=np.append(windows, duration))[0]
    return counts / (N * TS)

def period_method(edges):
    ticks = np.diff(np.floor(edges * FT))                     # captured timer values at each edge
    return FT / (N * ticks)

def rel_err(est, speed):
    return np.sqrt(np.mean((est - speed) ** 2)) / speed

if __name__ == "__main__":
    for speed in (0.73, 3.3, 83.7):            # speeds that are not whole counts per window
        e = edge_times(speed, 2.0)
        f = rel_err(frequency_method(e, 2.0)[1:-1], speed)
        p = rel_err(period_method(e), speed)
        print(f"{speed:5.2f} rev/s: frequency method {100*f:6.2f} % rms, period method {100*p:6.3f} % rms")
        if speed < 50:
            assert p < f
        else:
            assert f < p
    crossover = np.sqrt(FT / (N**2 * TS))
    assert abs(crossover - 50) < 1e-9
    assert abs(1 / (N * TS) - 0.5) < 1e-12 and abs(FT / (2 * N) - 2500) < 1e-9
```
:::end

## Exercises

:::exercise
At what speed does the period method's update interval exceed the 1 ms control period?
:::solution
When the time per count $1/(\omega N)$ is more than 1 ms: below $\omega = 1/(2000\times0.001) = 0.5$ rev/s. Below that, the controller sees stale speeds.
:::end

:::exercise
How does the frequency method's resolution change if you double the window to 2 ms, and what does the controller pay for it?
:::solution
The resolution halves to 0.25 rev/s, but the estimate is now an average over 2 ms, adding about 1 ms of delay, which costs phase margin (Phase 13).
:::end

## Quiz

:::quiz
- type: num
  q: Frequency-method resolution in rev/s for 2000 counts/rev and a 1 ms window?
  answer: 0.5
  tol: 0.001
  unit: rev/s
  py: "1/(2000*1e-3)"
  explain: One count per window.
- type: num
  q: Timer ticks per count at 2 rev/s with a 10 MHz timer?
  answer: 2500
  tol: 0.001
  py: "10e6/(2*2000)"
  explain: f_t over the count rate.
- type: num
  q: Crossover speed in rev/s?
  answer: 50
  tol: 0.001
  unit: rev/s
  py: "math.sqrt(10e6/(2000**2*1e-3))"
  explain: Where both resolutions are equal.
- type: mc
  q: At very low speed, prefer…
  options:
    - the frequency method
    - the period method
    - neither: speed can't be measured
    - a bigger window only
  answer: 1
  explain: Many timer ticks per edge.
- type: num
  q: Period-method resolution in % at 80 rev/s?
  answer: 1.6
  tol: 0.001
  unit: '%'
  py: "80*2000/10e6*100"
  explain: ωN/f_t.
- type: mc
  q: The M/T method…
  options:
    - counts edges and times the window from the first to the last edge
    - uses two encoders
    - averages the two estimates
    - only works at standstill
  answer: 0
  explain: It gets the best of both.
:::end

:::verify
assert abs(2000*80/10e6 - 0.016) < 1e-12
:::end
