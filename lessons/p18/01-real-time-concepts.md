---
id: p18-l01
minutes: 30
summary: A control loop that is right but late is wrong. You define deadlines, jitter and worst-case execution time, tell hard, firm and soft deadlines apart, write the statistics that characterise a periodic loop, test them on synthetic data, and measure a 1 kHz Python loop on a real Linux machine.
---

## Deadlines

A **real-time** system is one whose correctness depends on *when* results arrive, not only on their values. Each job of a periodic task is released at time $r$, must finish by its deadline $d$ (usually the next release), and needs at most its **worst-case execution time** (WCET) $C$ of processor time.

What a missed deadline costs decides the class:

- **Hard**: a miss is a failure (an airbag, a motor current loop that would trip the drive).
- **Firm**: a late result is worthless and discarded, but the system carries on (a dropped video frame).
- **Soft**: a late result loses value gradually (a slower user interface).

"Real-time" does not mean fast. A 1 Hz loop that never misses is real-time; a 10 kHz loop that occasionally stalls for 50 ms is not.

## Jitter and its statistics

For a loop with nominal period $T$, the measured periods $\Delta t_k$ give the **jitter** $\Delta t_k - T$. Mean and standard deviation describe typical behaviour, but real-time cares about the **tail**: the 99th percentile, the maximum, and the count of deadline misses. A control design (Phase 13) assumes a fixed sample time, and jitter acts like noise on it.

Two habits keep the average rate right: schedule each wake-up at an **absolute** time $t_{k+1} = t_k + T$ (not "sleep $T$ after finishing", which drifts by the work time every cycle), and measure with a monotonic clock (`time.perf_counter`, `CLOCK_MONOTONIC`).

## WCET is not measured, it is bounded

The longest execution time you observed is a lower bound on the WCET, not the WCET. Caches, branch prediction, interrupts and rare code paths can make an unobserved run longer. Safety-critical work uses static analysis or adds a margin to the measured maximum.

:::figure widget=timinghist caption="Histogram of the periods of an illustrative 1 kHz loop. Change the jitter and the chance of a long stall, and see the mean barely move while the tail and the deadline misses change."
:::end

## Worked example

1. A synthetic 1 kHz loop with 20 µs of Gaussian jitter and two injected overruns (3.5 ms and 2.4 ms) over 10 000 periods: mean 1.0005 ms, standard deviation 34.9 µs, 99th percentile 1.0463 ms, maximum 3.50 ms, worst jitter 2500 µs and 2 deadline misses. The two outliers barely move the mean but dominate the maximum.
2. Half a deadline late: a hard task has failed ($-\infty$), a firm task delivers nothing (0), a soft task delivers half its value (0.5).
3. One run of the code on our shared build machine, 500 iterations at 1 kHz with `time.sleep`: mean 1.0003 ms, standard deviation 370 µs, worst 4.879 ms and 9 misses. The absolute release times keep the mean exact while the tail is poor. Your numbers will differ from run to run.

## Code it from scratch

:::code file=loop_timing.py
```python
import time
import numpy as np

def timing_stats(stamps, period, deadline=None):
    """statistics of a periodic loop from its wake-up timestamps (seconds):
    periods, jitter (deviation from the nominal period), and deadline misses"""
    stamps = np.asarray(stamps, float); dt = np.diff(stamps)
    jit = dt - period; deadline = period if deadline is None else deadline
    return {"n": len(dt), "mean": dt.mean(), "std": dt.std(), "min": dt.min(), "max": dt.max(),
            "p99": np.percentile(dt, 99), "max_abs_jitter": np.abs(jit).max(),
            "misses": int((dt > period + deadline).sum())}                # an iteration started more than a deadline late

def utility(kind, lateness, deadline=1.0):
    """value of a result delivered `lateness` after its deadline: hard (failure), firm (worthless), soft (degrades)"""
    if lateness <= 0: return 1.0
    if kind == "hard": return -np.inf                                  # missing it is a system failure
    if kind == "firm": return 0.0                                      # a late result is simply discarded
    return max(0.0, 1.0 - lateness / deadline)                         # soft: value decays

def run_loop(period=1e-3, n=500, busy=2e-4):
    """a periodic loop on this machine: do 'work', then sleep until the next absolute release time"""
    stamps = []; t_next = time.perf_counter()
    for _ in range(n):
        stamps.append(time.perf_counter())
        t0 = time.perf_counter()
        while time.perf_counter() - t0 < busy: pass                     # stand-in for the control computation
        t_next += period
        delay = t_next - time.perf_counter()
        if delay > 0: time.sleep(delay)
    return np.array(stamps)

def test_stats_on_known_data():
    rng = np.random.default_rng(0); period = 1e-3
    dt = period + rng.normal(0, 20e-6, 10000); dt[[100, 5000]] = [3.5e-3, 2.4e-3]   # two injected overruns
    st = timing_stats(np.r_[0, np.cumsum(dt)], period)
    print(f"synthetic 1 kHz loop: mean {1e3 * st['mean']:.4f} ms, std {1e6 * st['std']:.1f} us, max {1e3 * st['max']:.2f} ms, "
          f"p99 {1e3 * st['p99']:.4f} ms, max |jitter| {1e6 * st['max_abs_jitter']:.0f} us, deadline misses {st['misses']}")
    assert np.isclose(st["mean"], dt.mean()) and np.isclose(st["std"], dt.std()) and st["misses"] == 2
    assert np.isclose(st["max_abs_jitter"], 2.5e-3)

def test_utility():
    vals = [(k, utility(k, 0.5)) for k in ("hard", "firm", "soft")]
    print("half a deadline late: " + ", ".join(f"{k} {v}" for k, v in vals))
    assert vals[0][1] == -np.inf and vals[1][1] == 0 and vals[2][1] == 0.5

def test_measure_this_machine():
    st = timing_stats(run_loop(), 1e-3)
    print(f"this machine, 500 iterations at 1 kHz with time.sleep: mean {1e3 * st['mean']:.4f} ms, std {1e6 * st['std']:.0f} us, "
          f"worst {1e3 * st['max']:.3f} ms, misses {st['misses']} (numbers vary from run to run and machine to machine)")
    assert abs(st["mean"] - 1e-3) < 2e-4                                 # absolute release times keep the average rate

test_stats_on_known_data()
test_utility()
test_measure_this_machine()
print("PASS")
```
:::end

## In practice

In ROS 2, `ros2 topic hz` and `ros2 topic delay` report these statistics for a topic, and ros2_control's controller manager runs the read-update-write loop at a fixed rate and can report overruns. For hard deadlines the loop runs on a real-time kernel (lesson 05) or on a microcontroller (lessons 03 and 16), not in Python.

## Exercises

:::exercise
A loop does 0.3 ms of work and then sleeps 1 ms. What is its actual rate, and how do you fix it?
:::solution
The period is 1.3 ms, about 769 Hz, and it drifts further with every slow iteration. Sleep until an absolute next release time $t_{k+1} = t_k + 1$ ms instead.
:::end

:::exercise
Your motor current loop must run every 50 µs. In 10 hours of testing the longest iteration took 41 µs. Is the loop proven safe?
:::solution
No. 41 µs is the longest observed time, a lower bound on the WCET. Rare paths (an interrupt storm, a cache flush) could exceed 50 µs. Bound it by analysis, keep a margin, and add an overrun detector that puts the drive in a safe state.
:::end

## Quiz

:::quiz
- type: num
  q: Actual rate of a loop that works 0.25 ms and then sleeps 1 ms?
  answer: 800
  tol: 0.001
  unit: Hz
  py: "1/1.25e-3"
  explain: The period is 1.25 ms.
- type: num
  q: Jitter of a measured period of 1.07 ms in a 1 kHz loop?
  answer: 70
  tol: 0.002
  unit: µs
  py: "(1.07e-3-1e-3)*1e6"
  explain: Measured minus nominal period.
- type: num
  q: Deadline misses expected per hour in a 1 kHz loop that misses once in a million iterations?
  answer: 3.6
  tol: 0.002
  py: "3600*1000/1e6"
  explain: 3.6 million iterations per hour.
- type: num
  q: Processor share of a task with WCET 0.2 ms and period 1 ms?
  answer: 0.2
  tol: 0.002
  py: "0.2/1"
  explain: Utilisation C/T.
- type: mc
  q: A dropped video frame in a teleoperation display is an example of a…
  options:
    - firm deadline
    - hard deadline
    - soft deadline with no value loss
    - non-real-time task
  answer: 0
  explain: The late frame is useless but the system carries on.
- type: mc
  q: The longest execution time observed in testing is…
  options:
    - a lower bound on the WCET
    - the WCET
    - an upper bound on the WCET
    - the average execution time
  answer: 0
  explain: Unobserved runs may be longer.
:::end
