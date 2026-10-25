---
id: p19-l19
minutes: 40
summary: Safety-related software must notice when its inputs lie. You build range, rate and cross-check monitors for a redundant pair of joint angle sensors plus a freshness watchdog, inject six kinds of fault, and check that each is caught within a 50 ms budget while healthy runs raise no false alarms.
---

## Sensors fail in many ways

A sensor can fail obviously (an open wire pulls the input to a rail) or subtly: stuck at its last value, offset by a slipped magnet, drifting with temperature, spiking from interference, or simply no longer updating while the last value sits in memory. A controller that trusts such a value can drive a machine somewhere dangerous. **Diagnostics** turn these failures into detected faults that trip a safe state, which is what diagnostic coverage (Lesson 17) measures.

## Four cheap monitors

- **Range**: the value must lie in the physically possible range, here $-0.1 \le \theta \le 3.3$ rad. Catches open and shorted wires.
- **Rate**: consecutive samples cannot differ by more than the fastest possible motion allows, plus a noise margin: $|\theta_k - \theta_{k-1}| \le \dot\theta_{max}/f_s + \epsilon$. Catches spikes and sudden offsets.
- **Cross-check**: two independent sensors must agree within a tolerance for most samples; requiring the disagreement to persist for $N$ samples avoids nuisance trips. Catches stuck, drifting and frozen sensors.
- **Freshness watchdog**: each sample carries a sequence number; if it stops changing for too long, the data are stale.

The thresholds trade detection time against false alarms, so test both: inject every fault class, and run long healthy sequences with realistic noise and motion.

## Redundancy in practice

Redundant measurements are standard wherever a wrong reading could hurt someone: speed and position monitoring on cable cars and rack railways, such as those across the Swiss Alps, uses independent sensors cross-checked by the safety controller, and so do industrial robot joints with a motor encoder and a separate joint encoder. The numbers below are for an illustrative joint, not a specific installation.

:::figure widget=plausmon caption="Two sensor traces with the monitor thresholds. Choose a fault to inject and see which monitor catches it and how quickly."
:::end

## Worked example

1 kHz sampling, 2 mrad noise per sensor, joint moving at up to 2.5 rad/s, tolerance 0.02 rad for 10 samples, watchdog 20 ms:

1. Five healthy 3 s runs: no alarms.
2. Offset of 0.05 rad and a 0.5 rad spike: caught at once by the rate monitor.
3. Open wire (input at 3.6 V): caught at once by the range and rate monitors.
4. Stuck sensor: cross-check after 18.0 ms (9.0 ms after its error exceeded 0.02 rad). Frozen sensor: cross-check after 18.0 ms, just before the 20 ms watchdog would have fired.
5. Slow drift at 0.2 rad/s: cross-check after 126.0 ms, 36.0 ms after the error became significant. Every fault is caught within 50 ms of becoming dangerous.

## Code it from scratch

:::code file=plausibility.py
```python
import numpy as np

FS = 1000.0                                                     # samples per second
LO, HI = -0.1, 3.3                                              # valid range of the joint angle (rad)
MAX_RATE = 4.0                                                  # fastest physically possible motion (rad/s)
STEP_MAX = MAX_RATE / FS + 0.015                                # per-sample limit plus a margin for 2 mrad sensor noise
XTOL, XN = 0.02, 10                                             # cross-check: disagreement over 0.02 rad for 10 samples
STALE_N = 20                                                    # watchdog: no new sample for 20 ms
BUDGET_MS = 50

class Monitor:
    """range, rate and cross-check monitors for a redundant sensor pair, plus a freshness watchdog per sensor."""
    def __init__(self): self.prev = [None, None]; self.xcount = 0; self.age = [0, 0]; self.last_seq = [-1, -1]
    def step(self, a, b, seq_a, seq_b):
        faults = []
        for k, (v, s) in enumerate(((a, seq_a), (b, seq_b))):
            self.age[k] = 0 if s != self.last_seq[k] else self.age[k] + 1; self.last_seq[k] = s
            if self.age[k] >= STALE_N: faults.append(f"stale {k}")
            if not (LO <= v <= HI): faults.append(f"range {k}")
            if self.prev[k] is not None and abs(v - self.prev[k]) > STEP_MAX: faults.append(f"rate {k}")
            self.prev[k] = v
        self.xcount = self.xcount + 1 if abs(a - b) > XTOL else 0
        if self.xcount >= XN: faults.append("cross-check")
        return faults

def run(fault=None, t_fault=1.0, seconds=3.0, seed=0):
    rng = np.random.default_rng(seed); n = int(seconds * FS); t = np.arange(n) / FS
    truth = 1.5 + 1.0 * np.sin(2 * np.pi * 0.4 * t)                          # joint motion, peak rate 2.5 rad/s
    a = truth + rng.normal(0, 0.002, n); b = truth + rng.normal(0, 0.002, n)
    sa = np.arange(n); sb = np.arange(n); k0 = int(t_fault * FS)
    if fault == "stuck": a[k0:] = a[k0]
    if fault == "offset": a[k0:] += 0.05
    if fault == "drift": a[k0:] += 0.2 * (t[k0:] - t_fault)                # slow drift, 0.2 rad/s
    if fault == "spike": a[k0] += 0.5
    if fault == "open wire": a[k0:] = 3.6                                     # input pulled to the rail
    if fault == "frozen": a[k0:] = a[k0]; sa[k0:] = sa[k0]                  # sensor stopped updating
    bad = np.nonzero(np.abs(a[k0:] - truth[k0:]) > XTOL)[0]                # when the error becomes significant
    k_bad = k0 + (bad[0] if len(bad) else 0) if fault != "frozen" else k0      # a frozen sensor is a fault at once
    m = Monitor()
    for k in range(n):
        f = m.step(a[k], b[k], sa[k], sb[k])
        if f: return (k - k0) / FS * 1000, max(0, k - k_bad) / FS * 1000, f
    return None, None, []

def test_no_false_alarms():
    for seed in range(5): assert run(None, seed=seed)[0] is None
    print("healthy runs (5 seeds, 3 s each): no alarms")

def test_injected_faults():
    for fault in ("stuck", "offset", "drift", "spike", "open wire", "frozen"):
        ms, late, f = run(fault)
        print(f"{fault:10s} detected {ms:5.1f} ms after injection, {late:4.1f} ms after the error exceeded {XTOL} rad, by {', '.join(f)}")
        assert ms is not None and ms >= 0 and late <= BUDGET_MS, fault

test_no_false_alarms()
test_injected_faults()
print("PASS")
```
:::end

## In practice

The same monitors run in safety PLCs and in dual-core lockstep microcontrollers made for functional safety (from Infineon, Texas Instruments, NXP and others), alongside hardware watchdogs that reset or shut down the system if the software stops kicking them. NumPy is enough to tune thresholds against recorded data; fault injection (Lesson 21) then verifies them on the real system.

## Exercises

:::exercise
A joint moves at most 3 rad/s, sampled at 500 Hz, with 1 mrad noise. Suggest a rate-check step limit.
:::solution
Motion allows $3/500 = 6$ mrad per sample; add a margin of about $5\sqrt2 \times 1 \approx 7$ mrad for the noise of two samples, so about 13 mrad.
:::end

:::exercise
Why can a cross-check not tell which of two sensors is wrong, and what helps?
:::solution
With two sensors, a disagreement only shows that one is wrong. The safe reaction is to stop. A third sensor (two-out-of-three voting) or a model-based estimate can identify the faulty one and allow continued operation.
:::end

## Quiz

:::quiz
- type: num
  q: Largest true change per sample at 2 rad/s and 1 kHz (mrad)?
  answer: 2
  tol: 0.001
  py: "1000*2/1000"
  explain: Rate divided by sampling rate.
- type: num
  q: Cross-check delay for 10 samples at 1 kHz (ms)?
  answer: 10
  tol: 0.001
  py: "10/1000*1000"
  explain: Persistence count over the rate.
- type: num
  q: Time for a 0.2 rad/s drift to exceed 0.02 rad (ms)?
  answer: 100
  tol: 0.001
  py: "0.02/0.2*1000"
  explain: Tolerance over drift rate.
- type: num
  q: Watchdog timeout for 25 missed samples at 1 kHz (ms)?
  answer: 25
  tol: 0.001
  py: "25"
  explain: One millisecond per sample.
- type: mc
  q: Which monitor catches a sensor stuck at a valid value?
  options: ["The cross-check against a second sensor", "The range check", "The rate check", "None of them"]
  answer: 0
  explain: A stuck value stays in range and does not jump.
- type: mc
  q: Why require a disagreement to persist for several samples?
  options: ["To avoid nuisance trips from noise", "To make detection faster", "To save memory", "Because sensors are always wrong"]
  answer: 0
  explain: Persistence trades latency for false alarms.
:::end
