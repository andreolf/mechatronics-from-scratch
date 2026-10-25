---
id: p18-l05
minutes: 35
summary: Linux can run real-time loops if you control what delays them. You learn where wake-up latency comes from, what PREEMPT_RT changes, how cyclictest measures it, and measure a miniature cyclictest on this course's shared build machine, comparing plain sleep with sleep-then-spin and handling a refused SCHED_FIFO request.
---

## Where latency comes from

A periodic thread asks to wake at time $t$ and actually runs at $t + L$. The **wake-up latency** $L$ adds up from:

- timer hardware and interrupt handling,
- the kernel finishing a **non-preemptible section** (a spinlock held, interrupts disabled) before it can switch,
- other threads of equal or higher priority, and the scheduler's own decision,
- power management: a deep CPU sleep state takes time to leave, and frequency scaling slows the first cycles,
- cache and TLB misses once the thread runs, and **SMIs** (firmware interrupts invisible to the kernel).

The mean is usually small. Real-time cares about the **maximum**, which comes from rare events.

## What PREEMPT_RT changes

A stock kernel (`PREEMPT_DYNAMIC` on most distributions) can preempt most kernel code but keeps many long non-preemptible sections. The **PREEMPT_RT** patch set, merged into mainline Linux in 6.12, turns most spinlocks into sleeping locks with priority inheritance and runs interrupt handlers as threads with their own priorities. A high-priority `SCHED_FIFO` thread can then preempt almost anything, and worst-case latency on a tuned PC typically falls from milliseconds to tens of microseconds.

The kernel is only part of the job. A real-time setup also uses `SCHED_FIFO` priorities (which need root or `CAP_SYS_NICE`), locks memory with `mlockall` so no page faults happen, isolates cores (`isolcpus`, `nohz_full`) and pins the thread there, and disables deep C-states.

## cyclictest

`cyclictest -m -p80 -i1000 -n` runs a thread that sleeps until absolute times 1 ms apart and records how late each wake-up was. Run it for hours under a stress load (`stress-ng`, heavy I/O, network): the maximum, not the average, says whether your control loop can run on that machine.

:::figure widget=jitterhist caption="Illustrative latency model, not a measurement: a histogram of wake-up latency on a stock kernel versus PREEMPT_RT, with and without load and core isolation. The tail is what moves."
:::end

## Worked example

One run of the code on our shared build machine, which is not a real-time system (numbers change from run to run):

1. Kernel 6.12.94+, `PREEMPT_DYNAMIC`, 8 cores. The request for `SCHED_FIFO` priority 80 is refused with `PermissionError`, as it is for any unprivileged process; the code carries on at normal priority.
2. Plain `time.sleep` to absolute deadlines: median latency about 55 µs, but a 99th percentile around 2 ms and a maximum of several ms, from other work on the shared machine.
3. Sleeping until 200 µs before the deadline and spinning for the rest makes the median latency 0 µs (spinning avoids the timer wake-up cost), but the tail stays in the milliseconds: spinning cannot help when the thread is not scheduled at all. Only priorities, isolation and an RT kernel fix the tail.

## Code it from scratch

:::code file=mini_cyclictest.py
```python
import os, time, platform
import numpy as np

def kernel_info():
    """what kind of preemption this kernel was built with"""
    v = platform.uname().version
    rt = os.path.exists("/sys/kernel/realtime") and open("/sys/kernel/realtime").read().strip() == "1"
    model = "PREEMPT_RT" if rt or "PREEMPT_RT" in v else "PREEMPT_DYNAMIC" if "PREEMPT_DYNAMIC" in v else "PREEMPT" if "PREEMPT" in v else "none or voluntary"
    return platform.release(), model

def try_fifo(prio=80):
    """ask for SCHED_FIFO like cyclictest -p80; needs root or CAP_SYS_NICE, so fail gracefully"""
    try:
        os.sched_setscheduler(0, os.SCHED_FIFO, os.sched_param(prio)); return "granted"
    except (PermissionError, OSError, AttributeError) as e:
        return f"not permitted here ({type(e).__name__})"

def wake_latency(n=2000, interval=1e-3, spin=0.0):
    """cyclictest in miniature: sleep until an absolute time, record how late we woke (seconds).
    spin > 0: sleep until `spin` before the target, then busy-wait the rest (hybrid)."""
    lat = np.empty(n); t = time.perf_counter()
    for k in range(n):
        t += interval
        d = t - spin - time.perf_counter()
        if d > 0: time.sleep(d)
        if spin > 0:
            while time.perf_counter() < t: pass
        lat[k] = time.perf_counter() - t
    return lat

def summary(lat):
    us = lat * 1e6
    return {"min": us.min(), "median": np.median(us), "p99": np.percentile(us, 99), "max": us.max()}

def test_kernel_and_priority():
    rel, model = kernel_info()
    print(f"kernel {rel}, preemption model {model}, {os.cpu_count()} cores; SCHED_FIFO: {try_fifo()}")
    assert model in ("PREEMPT_RT", "PREEMPT_DYNAMIC", "PREEMPT", "none or voluntary")

def test_sleep_vs_hybrid():
    s = summary(wake_latency()); h = summary(wake_latency(spin=200e-6))
    fmt = lambda d: ", ".join(f"{k} {v:.0f} us" for k, v in d.items())
    print("plain sleep wake-up latency: " + fmt(s))
    print("sleep then spin for the last 200 us: " + fmt(h))
    print("(machine-dependent: these numbers change from run to run)")
    assert h["median"] < s["median"]                                    # spinning removes the timer-wake cost in the typical case

def test_histogram():
    lat = wake_latency(n=1000) * 1e6
    edges = [0, 25, 50, 100, 200, 500, 1000, np.inf]; counts, _ = np.histogram(lat, edges)
    print("plain sleep histogram (us): " + ", ".join(f"<{e:g}: {c}" for e, c in zip(edges[1:], counts)))
    assert counts.sum() == 1000

test_kernel_and_priority()
test_sleep_vs_hybrid()
test_histogram()
print("PASS")
```
:::end

## In practice

On a robot PC, install a PREEMPT_RT kernel (Ubuntu Pro ships `linux-realtime`), run `cyclictest` under load, and set real-time limits in `/etc/security/limits.conf`. ros2_control's controller manager requests `SCHED_FIFO` for its loop when the kernel and limits allow it, and the ROS 2 real-time working group documents the rest (memory locking, preallocated messages, real-time safe executors).

## Exercises

:::exercise
Your cyclictest maximum is 40 µs idle and 3 ms while copying files over USB. What do you investigate?
:::solution
The load triggers long non-preemptible sections or interrupt storms. Check the kernel is PREEMPT_RT, give the USB interrupt thread a lower priority than the control thread, isolate the control core, and use ftrace or `rtla timerlat` to find the code path causing the delay.
:::end

:::exercise
Why does `mlockall(MCL_CURRENT | MCL_FUTURE)` matter for a real-time thread?
:::solution
Without it, touching a page that was swapped out or not yet mapped causes a page fault that can take milliseconds. Locking all memory (and preallocating and touching buffers at start-up) removes those faults from the loop.
:::end

## Quiz

:::quiz
- type: num
  q: Loop budget left for computation in a 1 kHz loop with a worst-case wake-up latency of 120 µs?
  answer: 880
  tol: 0.002
  unit: µs
  py: "1000-120"
  explain: The period minus the latency.
- type: num
  q: Wake-ups recorded by cyclictest at 1 ms intervals in one hour?
  answer: 3600000
  tol: 0.001
  py: "3600*1000"
  explain: 1000 per second.
- type: num
  q: Highest SCHED_FIFO priority on Linux?
  answer: 99
  tol: 0.001
  py: "99"
  explain: sched_get_priority_max(SCHED_FIFO).
- type: num
  q: Factor by which worst-case latency improves going from 2 ms to 50 µs?
  answer: 40
  tol: 0.002
  py: "2000/50"
  explain: The ratio of the maxima.
- type: mc
  q: The figure that decides if a machine can run your control loop is…
  options:
    - the maximum latency under load
    - the mean latency when idle
    - the median latency
    - the CPU clock frequency
  answer: 0
  explain: Rare long delays cause deadline misses.
- type: mc
  q: PREEMPT_RT makes most kernel spinlocks…
  options:
    - sleeping locks with priority inheritance
    - disappear entirely
    - disable interrupts for longer
    - run only on core 0
  answer: 0
  explain: So high-priority threads can preempt them.
:::end
