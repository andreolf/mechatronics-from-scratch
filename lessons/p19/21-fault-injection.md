---
id: p19-l21
minutes: 45
summary: A safety mechanism you have never seen trigger is a hope, not a mechanism. You run a fault-injection campaign on a simulated robot joint, covering dead and runaway motors, stuck and spiking encoders, a lost setpoint stream and an overrunning control task, and check that the supervisor reacts every time, within budget, with no false trips.
---

## Test the safety, not just the function

Diagnostics (Lesson 19) and safe states (Lesson 18) only count if they work when the fault actually happens. **Fault injection** deliberately creates faults, in simulation, in hardware-in-the-loop rigs and on the real machine, and checks the reaction. Standards expect it: IEC 61508 and ISO 26262 list fault injection among the methods for verifying diagnostics.

A campaign is organised by **fault classes**, grouped by where they enter the system:

- actuators: a dead motor (open phase, blown fuse) or a runaway (driver stuck on);
- sensors: stuck, spiking, drifting or noisy;
- communication: lost, delayed or repeated messages;
- computation: overruns, crashes, corrupted memory.

**Coverage** is the share of classes, and of injections within each class, that end in the intended safe reaction within the time budget. Randomising the injection time and magnitude finds the corner cases, such as a stuck encoder at a moment when the joint is barely moving.

## The supervisor

The simulated joint follows a trajectory under PD control with gravity compensation. An independent supervisor checks current plausibility ($|i_{meas} - \tau_{cmd}/k_t| \le 3$ A), the encoder rate, a cross-check between joint and motor encoders, a watchdog on the planner's message counter, and a deadline monitor on the control task. Any trip enters the safe state: torque off and brake.

:::figure widget=faultcampaign caption="The joint's response with a fault injected and the moment the supervisor trips. Choose the fault class and the injection time; run a randomised campaign with the button."
:::end

## Worked example

Fifteen randomised injections per class, 30 ms budget (all values illustrative):

1. Ten healthy runs: no trips.
2. Motor dead: caught every time by current plausibility, at most 19.0 ms. Motor runaway: at once (0.0 ms).
3. Encoder stuck: caught by the encoder cross-check at most 3.0 ms after its error matters; encoder spike: at once by the rate check.
4. Setpoint stream lost: the watchdog trips within 9.0 ms. Control overrun: the deadline monitor within 5.0 ms.
5. All six classes covered within 30 ms: the safety reaction triggered for every injection.

## Code it from scratch

:::code file=fault_campaign.py
```python
import numpy as np

DT = 1e-3; J, MGL, B = 0.05, 2.0, 0.02             # illustrative joint: inertia, gravity torque scale, viscous friction
KT, T_MAX = 0.1, 3.0                                 # torque per amp, torque limit
BUDGET_MS = 30

FAULTS = ["motor dead", "motor runaway", "encoder stuck", "encoder spike", "setpoint stream lost", "control overrun"]

def run(fault=None, t_fault=0.6, mag=1.0, seconds=1.2, seed=0):
    """a gravity-loaded joint follows a trajectory under PD + gravity compensation. A supervisor runs independent
    monitors and on any trip enters the safe state (torque off and brake). Returns detection latency in ms or None."""
    rng = np.random.default_rng(seed); q = w = 0.0; i_meas = 0.0; tau_cmd = 0.0; seq = 0; last_seq = -1
    q_stuck = q_j_prev = None; age = xcount = 0; ctrl_age = 0; k0 = int(t_fault / DT); k_bad = None
    for k in range(int(seconds / DT)):
        t = k * DT; f = fault if (fault and k >= k0) else None
        ref = 0.6 * np.sin(2 * np.pi * 0.8 * t)
        if f != "setpoint stream lost": seq += 1                               # the planner's message counter
        q_j = q + rng.normal(0, 5e-4)                                          # joint encoder
        q_m = q + rng.normal(0, 5e-4)                                          # motor encoder through the gearbox
        if f == "encoder stuck":
            if q_stuck is None: q_stuck = q_j
            q_j = q_stuck
        if f and k_bad is None and (f not in ("encoder stuck",) or abs(q_j - q) > 0.004): k_bad = k   # fault now matters
        if f == "encoder spike" and k == k0: q_j += 0.3 * mag
        if f != "control overrun" or (k - k0) % 40 == 0:                       # an overrunning task updates rarely
            tau_cmd = float(np.clip(40 * (ref - q_j) + 3 * (0 - w) + MGL * np.sin(q_j), -T_MAX, T_MAX)); ctrl_age = 0
        else: ctrl_age += 1
        tau = 0.0 if f == "motor dead" else T_MAX if f == "motor runaway" else tau_cmd
        i_meas = tau / KT + rng.normal(0, 0.05)
        trips = []                                                             # ---- supervisor ----
        if abs(i_meas - tau_cmd / KT) > 3.0: trips.append("current plausibility")
        if q_j_prev is not None and abs(q_j - q_j_prev) > 0.02: trips.append("rate")
        xcount = xcount + 1 if abs(q_j - q_m) > 0.004 else 0
        if xcount >= 3: trips.append("encoder cross-check")
        age = 0 if seq != last_seq else age + 1; last_seq = seq
        if age >= 10: trips.append("setpoint watchdog")
        if ctrl_age >= 5: trips.append("deadline monitor")
        if trips:
            if fault is None or k < k0: return 0.0, ["FALSE TRIP"] + trips
            return (k - k_bad) * DT * 1000, trips          # latency from when the fault starts to matter
        q_j_prev = q_j
        w += (tau - MGL * np.sin(q) - B * w) / J * DT; q += w * DT
    return None, []

def test_no_false_trips():
    for s in range(10): assert run(None, seed=s)[0] is None
    print("10 healthy runs: no trips")

def test_campaign(trials=15):
    rng = np.random.default_rng(42); covered = 0
    for fault in FAULTS:
        lat = []; mons = set()
        for n in range(trials):
            ms, trips = run(fault, t_fault=rng.uniform(0.3, 0.9), mag=rng.choice([-1, 1]) * rng.uniform(0.5, 1.5), seed=100 + n)
            assert ms is not None and "FALSE TRIP" not in trips, (fault, n); lat.append(ms); mons.update(trips)
        covered += max(lat) <= BUDGET_MS
        print(f"{fault:22s} reacted {trials}/{trials}, latency max {max(lat):4.1f} ms, by {', '.join(sorted(mons))}")
    print(f"fault classes covered within {BUDGET_MS} ms: {covered}/{len(FAULTS)}")
    assert covered == len(FAULTS)

test_no_false_trips()
test_campaign()
print("PASS")
```
:::end

## In practice

Teams inject faults in simulation first, then on hardware-in-the-loop rigs that can open motor phases, short sensor lines or drop bus messages on command, and finally on the machine. Flight-controller projects test motor failures the same way. Try it in the [live quadrotor lab](#lab-quad): kill a motor in flight and watch what happens to a vehicle with no safety reaction for that fault. Logging every injection and its reaction gives the evidence a safety case needs.

## Exercises

:::exercise
Why randomise the time at which a fault is injected?
:::solution
The effect and detectability of a fault depend on the system state. A stuck encoder is harmless while the joint stands still and dangerous while it moves; a fixed injection time may always hit an easy moment and hide slow detection.
:::end

:::exercise
A campaign shows 99 of 100 injections of one class detected in time. What do you do?
:::solution
Treat the one miss as a real finding: reproduce it from its logged seed and conditions, understand why the monitor missed or was late, fix the monitor or the threshold, and rerun the whole campaign, including the healthy runs to check that no false trips were introduced.
:::end

## Quiz

:::quiz
- type: num
  q: Coverage if 5 of 6 fault classes always react in time (%)?
  answer: 83.3
  tol: 0.003
  py: "100*5/6"
  explain: Classes covered over classes tested.
- type: num
  q: Total injections for 6 classes × 15 trials?
  answer: 90
  tol: 0.001
  py: "6*15"
  explain: Classes times trials.
- type: num
  q: Current mismatch for a dead motor commanded 0.6 N·m with kt 0.1 N·m/A (A)?
  answer: 6
  tol: 0.001
  py: "0.6/0.1"
  explain: τ/kt with zero measured current.
- type: num
  q: Watchdog delay for 10 missed messages at 1 kHz (ms)?
  answer: 10
  tol: 0.001
  py: "10"
  explain: One millisecond per message.
- type: mc
  q: What must a campaign check besides detection?
  options: ["That healthy runs raise no false trips", "That the code is short", "That faults never happen", "That the motor is large"]
  answer: 0
  explain: Nuisance trips erode trust and availability.
- type: mc
  q: Which monitor catches a lost setpoint stream?
  options: ["A watchdog on the message counter", "The encoder rate check", "Current plausibility", "The range check"]
  answer: 0
  explain: Stale data are detected by freshness.
:::end
