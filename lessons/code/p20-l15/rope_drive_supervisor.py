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
