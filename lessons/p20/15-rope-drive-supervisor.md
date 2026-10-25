---
id: p20-l15
minutes: 45
summary: An educational safety supervisor for a ski-lift-style rope drive, the kind that runs Swiss mountain lifts. You define stop categories, speed and rope plausibility checks, escalation when the drive fails to brake, and a latched lockout, then prove by exhaustive simulation that every fault in every state ends with the line stopped, torque off and brakes on, and that it cannot restart while a fault is present.
---

## Stops and brakes

This is an educational model only. Real ropeways in Switzerland and the EU are designed to EN 12929 and related standards, approved by the authorities, and built with certified safety hardware; nothing here replaces them.

A rope drive has a drive (a motor on the bullwheel), a service brake and an emergency brake acting on the bullwheel. The supervisor uses the stop categories of Phase 19:

- **Category 0** (estop, derailment, overspeed, rollback, rope slip, brake fault): remove torque and apply the brakes at once.
- **Category 1** (high wind, lost safety line, drive fault): the drive decelerates the line, then the brakes hold it.
- **Escalation:** if a controlled stop does not decelerate at least $0.75\,a_{ctrl}$ after 1 s, the emergency brake takes over.

The stopping distance at speed $v$ with deceleration $a$ is $d = v^2/2a$. Too gentle and the line runs far; too hard and passengers on chairs swing, so emergency decelerations are limited too.

## Plausibility

Two speed signals, the bullwheel's and the rope's, catch a slipping rope when they differ by more than $0.05 v_{nom} + 0.1$ m/s. Speed above 115 % is overspeed; negative speed on a loaded uphill line is rollback, the most dangerous failure of all. Any fault latches, and the line can only restart after a reset with no fault present.

:::figure widget=ropedrive caption="The supervisor's states with the line speed. Inject a fault in a chosen state; the diagram highlights the path to the safe state and the readout gives its timeline and the peak deceleration."
:::end

## Worked example

Illustrative line at 5 m/s, normal ramp 0.3 m/s², controlled stop 0.8 m/s², emergency brake 1.6 m/s², 100 Hz supervisor:

1. Exhaustive test: 7 states × 9 faults = 63 pairs. Every one ends locked out, stopped, with torque off and brakes on, and refuses reset and restart while the fault is held. The largest deceleration is 1.60 m/s², the emergency brake.
2. Drive fault at 20 s while running: controlled stop at 20.00 s; the line only coasts, so the emergency brake takes over at 21.00 s, locked out at 23.87 s, no rollback; after the fault clears, a reset at 45 s returns it to stopped and it restarts.
3. Speed checks: 5.8 m/s overspeed, 0.6 m/s rope slip and −0.2 m/s rollback each trip; 5.6 m/s with a 0.2 m/s mismatch does not.
4. Stopping from 5 m/s: normal stop 16.67 s over 41.67 m, controlled 6.25 s over 15.62 m, emergency brake 3.12 s over 7.81 m.

## Code it from scratch

:::code file=rope_drive_supervisor.py
```python
import itertools

# EDUCATIONAL model of a rope-drive supervisor; real installations follow EN 12929, EN 13243 and the
# authorities' rules, with certified safety hardware. All values are illustrative.
V_NOM, A_RUN = 5.0, 0.3                      # line speed (m/s), normal acceleration and stop (m/s^2)
A_CTRL, A_EMRG = 0.8, 1.6                    # controlled stop by the drive; emergency (mechanical) brake (m/s^2)
A_ROLLBACK = 0.4                             # an uphill loaded line rolls back at this rate with no torque or brake
DT = 0.01                                    # 100 Hz supervisor

CAT0 = {"estop", "derailment", "overspeed", "rollback", "rope slip", "brake fault"}   # stop at once: torque off, brakes on
CAT1 = {"wind high", "safety line lost", "drive fault"}                              # controlled stop, then brakes
FAULTS = sorted(CAT0 | CAT1)
STATES = ["stopped", "starting", "running", "stopping", "controlled stop", "emergency stop", "locked out"]

class Supervisor:
    def __init__(s):
        s.state, s.latched, s.t_stop = "stopped", set(), 0.0
    def outputs(s):
        """drive torque enabled, brakes applied"""
        return s.state in ("starting", "running", "stopping", "controlled stop"), s.state in ("stopped", "emergency stop", "locked out")
    def step(s, faults, cmd, v, v_rope, a_meas):
        """faults: active fault inputs; cmd: 'start', 'stop', 'reset' or None; v bullwheel speed, v_rope rope speed"""
        if v > 1.15 * V_NOM: faults = faults | {"overspeed"}                  # plausibility checks inside the supervisor
        if v < -0.1: faults = faults | {"rollback"}
        if abs(v - v_rope) > 0.05 * V_NOM + 0.1: faults = faults | {"rope slip"}
        s.latched |= faults
        if s.state == "locked out":
            if cmd == "reset" and not faults: s.latched = set(); s.state = "stopped"
        elif s.state == "emergency stop" and abs(v) < 0.02: s.state = "locked out"          # standstill reached: lock out
        elif faults & CAT0 or (s.state == "controlled stop" and s.t_stop > 1.0 and a_meas > -0.75 * A_CTRL):
            s.state = "emergency stop"                                    # stop at once, or escalate if the drive does not brake
        elif faults & CAT1 and s.state in ("starting", "running", "stopping"):
            s.state, s.t_stop = "controlled stop", 0.0
        elif s.state == "stopped":
            if s.latched: s.state = "locked out"
            elif cmd == "start": s.state = "starting"
        elif s.state == "starting" and v >= V_NOM - 1e-6: s.state = "running"
        elif s.state in ("starting", "running") and cmd == "stop": s.state = "stopping"
        elif s.state in ("stopping", "controlled stop") and abs(v) < 0.02:
            s.state = "locked out" if s.latched else "stopped"
        s.t_stop += DT
        return s.state

def drive(sup, v, faults):
    """line dynamics: the drive follows its ramp when it has torque; brakes decelerate; with neither, it rolls back"""
    torque, brakes = sup.outputs()
    if brakes:
        cap = A_EMRG * (0.6 if "brake fault" in faults else 1.0)           # two brakes: one failed still stops the line
        if abs(v) <= cap * DT: return 0.0, 0.0
        a = -cap if v > 0 else cap
    elif torque and "drive fault" not in faults:
        a = {"starting": A_RUN, "running": 0.0, "stopping": -A_RUN, "controlled stop": -A_CTRL}[sup.state]
        if sup.state == "starting": a = min(a, (V_NOM - v) / DT)
    else: a = -A_ROLLBACK                                                 # no torque, no brake: the loaded line slows and reverses
    return v + a * DT, a

# how to reach each state: commands and a brief fault pulse, and when to inject the fault under test
REACH = {"stopped": ([], None, 0.5), "starting": ([("start", 0.0)], None, 2.0), "running": ([("start", 0.0)], None, 25.0),
         "stopping": ([("start", 0.0), ("stop", 20.0)], None, 22.0), "controlled stop": ([("start", 0.0)], ("wind high", 20.0), 21.0),
         "emergency stop": ([("start", 0.0)], ("estop", 20.0), 20.5), "locked out": ([("start", 0.0)], ("estop", 20.0), 30.0)}

def run_scenario(start_state, fault, hold=40.0):
    sup = Supervisor(); v = a = t = 0.0; plan, pulse, t_inj = REACH[start_state]; peak = 0.0
    while t < t_inj + hold:
        cmd = next((c for c, tc in plan if abs(t - tc) < DT / 2), None)
        faults = {pulse[0]} if pulse and pulse[1] <= t < pulse[1] + 0.1 else set()
        if abs(t - t_inj) < DT / 2: assert sup.state == start_state, (start_state, sup.state)
        if t >= t_inj: faults.add(fault)
        sup.step(faults, cmd, v, v, a); v, a = drive(sup, v, faults)
        if t >= t_inj: peak = max(peak, abs(a))
        t += DT
    for c in ("reset", "start", "reset", "start"):                         # try to restart with the fault still present
        sup.step({fault}, c, v, v, 0.0); v, a = drive(sup, v, {fault})
    torque, brakes = sup.outputs()
    return dict(state=sup.state, v=v, torque=torque, brakes=brakes, peak=peak, latched=fault in sup.latched)

def test_all_faults_all_states():
    worst = 0.0; n = 0
    for st, f in itertools.product(STATES, FAULTS):
        r = run_scenario(st, f); n += 1
        assert r["state"] == "locked out" and abs(r["v"]) < 0.02 and not r["torque"] and r["brakes"] and r["latched"], (st, f, r)
        worst = max(worst, r["peak"])
    print(f"{n} state-fault pairs: every one ends locked out, stopped, torque off, brakes on, and refuses restart with the fault present")
    print(f"largest deceleration seen: {worst:.2f} m/s^2 (emergency brake {A_EMRG})")
    assert worst <= A_EMRG + 1e-9

def test_escalation_and_reset():
    sup = Supervisor(); v = a = 0.0; t = 0.0; log = []
    while t < 70:
        cmd = "start" if t < DT else ("reset" if 45 < t < 45 + DT else ("start" if 46 < t < 46 + DT else None))
        faults = {"drive fault"} if 20 <= t < 30 else set()
        st = sup.step(faults, cmd, v, v, a); v, a = drive(sup, v, faults); log.append((round(t, 2), st, v)); t += DT
    first = {}
    for tt, st, vv in log: first.setdefault(st, (tt, vv))
    print("drive fault at 20 s:", {k: f"{v[0]:.2f} s" for k, v in first.items()})
    assert first["controlled stop"][0] >= 20 and first["emergency stop"][0] - first["controlled stop"][0] <= 1.1
    assert min(v for _, _, v in log) > -0.05                                 # no significant rollback
    assert log[-1][1] == "running"                                            # reset after the fault cleared, restarted
    rb = min(v for _, _, v in log); print(f"escalated to the emergency brake after {first['emergency stop'][0] - first['controlled stop'][0]:.2f} s; "
                                          f"lowest speed {rb:.3f} m/s; restarted after reset")

def test_plausibility():
    for name, v, vr in [("overspeed", 5.8, 5.8), ("rope slip", 5.0, 4.4), ("rollback", -0.2, -0.2)]:
        sup = Supervisor(); sup.state = "running"; sup.step(set(), None, v, vr, 0.0)
        assert sup.state == "emergency stop" and name in sup.latched
    sup = Supervisor(); sup.state = "running"; sup.step(set(), None, 5.6, 5.4, 0.0); assert sup.state == "running"
    print("speed checks: 5.8 m/s overspeed, 0.6 m/s rope slip and -0.2 m/s rollback each trip; 5.6 m/s with 0.2 m/s mismatch does not")

def test_stopping_distances():
    for name, a in [("normal stop", A_RUN), ("controlled stop", A_CTRL), ("emergency brake", A_EMRG)]:
        print(f"{name}: from {V_NOM} m/s in {V_NOM / a:.2f} s over {V_NOM**2 / (2 * a):.2f} m")

test_all_faults_all_states(); test_escalation_and_reset(); test_plausibility(); test_stopping_distances(); print("PASS")
```
:::end

## In practice

The logic would be written in Python first, as here, to test it exhaustively, then implemented on a safety PLC with redundant channels, certified speed monitors and hard-wired safety circuits along the line. Every state–fault pair from the table becomes an acceptance test on the real installation, witnessed and recorded.

## Exercises

:::exercise
How far does the line run in a controlled stop that escalates after 1 s of coasting at 0.4 m/s²?
:::solution
In 1 s it slows to 4.6 m/s and covers 4.8 m, then brakes from 4.6 m/s at 1.6 m/s²: $4.6^2 / 3.2 = 6.6$ m. Total 11.4 m, still less than the 15.62 m of a normal controlled stop.
:::end

:::exercise
Why is a brake fault a category 0 stop rather than category 1?
:::solution
A controlled stop relies on the brakes to hold the line at the end. If one brake is suspect, the line should stop while the other is known to work, using everything available, rather than run on and risk having neither.
:::end

## Quiz

:::quiz
- type: num
  q: Emergency stopping distance from 5 m/s at 1.6 m/s² (m)?
  answer: 7.81
  tol: 0.005
  py: "5**2/(2*1.6)"
  explain: v²/2a.
- type: num
  q: Overspeed threshold for 5 m/s at 115 % (m/s)?
  answer: 5.75
  tol: 0.001
  py: "1.15*5"
  explain: Ratio times nominal.
- type: num
  q: Rope slip threshold for 5 m/s (m/s)?
  answer: 0.35
  tol: 0.001
  py: "0.05*5+0.1"
  explain: 0.05 v_nom + 0.1.
- type: num
  q: State-fault pairs for 7 states and 9 faults?
  answer: 63
  tol: 0.001
  py: "7*9"
  explain: Exhaustive product.
- type: mc
  q: What must happen after any fault before the line restarts?
  options: ["A reset with no fault present", "Nothing, it restarts itself", "A power cycle", "A timeout"]
  answer: 0
  explain: Faults latch.
- type: mc
  q: What does escalation protect against?
  options: ["A drive that cannot brake during a controlled stop", "High wind", "A slow reset", "Sensor noise"]
  answer: 0
  explain: The emergency brake takes over.
:::end
