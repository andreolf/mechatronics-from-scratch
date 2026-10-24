---
id: p06-l12
minutes: 30
summary: Mechanical contacts bounce for milliseconds, so one press becomes a burst of edges. You measure the bounce, compare an RC filter, a counter debouncer and an integrator, and verify on simulated presses that each press produces exactly one clean event with a known latency.
---

## Bounce

When a switch closes, the contacts hit, rebound and chatter for anywhere from 100 µs to 20 ms before settling. A microcontroller sampling at MHz rates sees dozens of presses. The fixes, roughly in order of robustness:

- **RC filter plus Schmitt trigger.** Smooth the edges with a time constant longer than the bounce, then square them up with hysteresis. It needs parts, but no software.
- **Counter debouncer.** Sample at a fixed rate, for example 1 kHz from a timer. Accept a new level only after $N$ consecutive samples agree. The latency is $N$ sample periods. Any disagreement resets the count.
- **Integrator.** Count up while the input is high and down while it's low, clamped to $[0, N]$. The output goes high at $N$ and low at 0. Its hysteresis tolerates occasional noise spikes better than a reset counter.

Choose $N/f_s$ longer than the worst bounce and shorter than a press anyone would notice (more than about 30 ms feels sluggish). Do it in a timer tick, not in the edge interrupt: an interrupt per bounce edge can swamp the CPU, and the raw signal also needs synchronising first (lesson 11).

:::figure widget=debounce caption="A raw contact signal with bounce on press and release, sampled every millisecond. Raise the required samples until one press gives one event."
:::end

## Worked example

A tactile switch bounces for up to 5 ms. We sample at 1 kHz.

1. $N = 8$ gives 8 ms of required agreement: longer than the bounce, with margin.
2. The latency is 8 ms after the contact settles. That's imperceptible.
3. With $N = 2$, a bounce gap of 2 ms or more in the raw signal could already register as an extra press.
4. An RC alternative: 10 kΩ and 1 µF give τ = 10 ms. A Schmitt input switching at about 1/3 and 2/3 of the supply delays the edge by about $\tau\ln 1.5$ to $\tau\ln 3$, which is 4–11 ms.

## Code it from scratch

:::code file=debounce.py
```python
import numpy as np

rng = np.random.default_rng(3)

def press_sequence(n_presses, bounce_ms=5, hold_ms=120, gap_ms=150):
    """1 kHz samples of a switch with random chatter at each transition."""
    x = []
    for _ in range(n_presses):
        x += [0] * gap_ms
        x += [int(rng.random() < k / bounce_ms) for k in range(bounce_ms)]       # chatter while closing
        x += [1] * hold_ms
        x += [int(rng.random() > k / bounce_ms) for k in range(bounce_ms)]       # chatter while opening
    return np.array(x + [0] * gap_ms)

def counter_debounce(x, N):
    out, state, cnt = [], x[0], 0
    for v in x:
        if v != state:
            cnt += 1
            if cnt >= N:
                state, cnt = v, 0
        else:
            cnt = 0
        out.append(state)
    return np.array(out)

def integrator_debounce(x, N):
    out, acc, state = [], 0, 0
    for v in x:
        acc = min(N, acc + 1) if v else max(0, acc - 1)
        if acc == N:
            state = 1
        elif acc == 0:
            state = 0
        out.append(state)
    return np.array(out)

def rising(y):
    return int(np.count_nonzero((y[1:] == 1) & (y[:-1] == 0)))

if __name__ == "__main__":
    x = press_sequence(50)
    print("raw rising edges:", rising(x))
    assert rising(x) > 50
    for f in (counter_debounce, integrator_debounce):
        y = f(x, 8)
        assert rising(y) == 50, f.__name__
    # latency of the counter debouncer: output rises N samples after the input last rose
    y = counter_debounce(x, 8)
    last_raw_rise = 150 + max(k for k in range(5) if x[150 + k] == 1 and x[149 + k] == 0)
    first_clean = int(np.argmax(y))
    assert first_clean - last_raw_rise <= 8
    # too small a count lets bounce through
    assert rising(counter_debounce(x, 1)) > 50
    print("N = 8 at 1 kHz: exactly 50 presses from 50, latency <= 8 ms")
```
:::end

## Exercises

:::exercise
A user complains that fast double-taps are missed. Which parameter do you change, and in which direction?
:::solution
Reduce $N$, or the sample period, so the debounced high and low phases fit inside the user's tap. Keep $N/f_s$ above the measured bounce.
:::end

:::exercise
Why sample in a periodic timer tick rather than on each edge interrupt?
:::solution
Bounce can produce hundreds of edges per press. The timer gives a fixed, known CPU load and a fixed time base for counting.
:::end

## Quiz

:::quiz
- type: num
  q: Debounce latency in ms for N = 8 at 1 kHz sampling?
  answer: 8
  tol: 0.001
  unit: ms
  py: "8/1000*1000"
  explain: N sample periods.
- type: mc
  q: The integrator debouncer differs from the reset counter because…
  options:
    - it needs no sampling
    - it counts up and down, giving hysteresis against isolated spikes
    - it has no latency
    - it uses interrupts
  answer: 1
  explain: One spike only moves it one step.
- type: num
  q: RC time constant in ms for 10 kΩ and 1 µF?
  answer: 10
  tol: 0.001
  unit: ms
  py: "10e3*1e-6*1000"
  explain: R × C.
- type: mc
  q: A required agreement time of 30 ms or more is generally…
  options:
    - needed for every switch
    - noticeable to the user as sluggish
    - too short
    - required by USB
  answer: 1
  explain: Keep it just above the bounce.
- type: num
  q: Rising edges seen after perfect debouncing of 50 presses?
  answer: 50
  tol: 0.001
  py: "50"
  explain: One per press.
- type: num
  q: Time in ms for an RC with τ = 10 ms to reach 2/3 of the supply from 0?
  answer: 10.986
  tol: 0.005
  unit: ms
  py: "10*math.log(3)"
  explain: $\tau\ln 3$.
:::end

:::verify
import math
assert abs(10*math.log(1.5) - 4.05) < 0.01
:::end
