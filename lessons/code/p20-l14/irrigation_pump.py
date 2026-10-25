import math
import numpy as np

# terrace header tank fed by a pump from a sump that the canal fills; all values illustrative
A_TANK, A_SUMP = 8.0, 5.0                    # tank and sump areas (m^2)
H_TANK, H_SUMP = 1.5, 1.2                    # usable depths (m)
LIFT = 6.0                                   # static head from the sump to the tank inlet (m)
H0, KP = 14.0, 1.8e5                         # pump curve H = H0 - KP Q^2 (m, Q in m^3/s)
R_PIPE = 0.9e5                               # pipe losses r Q^2
START, STOP = 0.60, 0.90                     # tank level hysteresis (fraction of full)
SUMP_MIN, SUMP_RESTART = 0.25, 0.80          # dry-run protection on the sump level (m)
MAX_STARTS_PER_HOUR = 6                      # motor limit
I_RUN, I_DRY = 4.0, 2.2                      # running current with water and when running dry (A)

def operating_point():
    """pump curve meets system curve: H0 - KP Q^2 = LIFT + R Q^2"""
    Q = np.sqrt((H0 - LIFT) / (KP + R_PIPE)); return Q, H0 - KP * Q**2

class PumpController:
    """runs every second, as the firmware would: level hysteresis, sump interlock, current check, start limit"""
    def __init__(s):
        s.on, s.locked, s.starts, s.lock_t, s.low = False, False, [], 0.0, []
    def update(s, t, tank, sump, current, sump_ok_switch):
        s.starts = [x for x in s.starts if t - x < 3600]
        dry = sump < SUMP_MIN or not sump_ok_switch                       # two independent sensors, either one stops it
        if s.on:
            s.low = (s.low + [current < 0.7 * I_RUN])[-30:]                 # last 30 s of current checks
            if sum(s.low) >= 3:                                            # 3 low seconds: running dry, or sucking air on and off
                s.on, s.locked, s.lock_t = False, True, t                  # latch, retry after 10 minutes
            elif dry: s.on = False                                         # sump low: stop, restart when it has refilled
            elif tank >= STOP: s.on = False
        else:
            if s.locked and sump >= SUMP_RESTART and sump_ok_switch and t - s.lock_t > 600: s.locked = False
            if not s.locked and not dry and sump >= SUMP_RESTART and tank <= START and len(s.starts) < MAX_STARTS_PER_HOUR:
                s.on = True; s.starts.append(t); s.low = []
        return s.on

def simulate(days=7, seed=0, inflow_scale=1.0, stuck_switch=False, failed_level=False):
    rng = np.random.default_rng(seed); Q, _ = operating_point(); c = PumpController()
    N = days * 86400; nz = rng.standard_normal((3, N))                   # demand, level and current noise, drawn up front
    tank, sump = 0.5 * H_TANK, 0.8 * H_SUMP; log = dict(dry_s=0, lockouts=0, empty_s=0, starts=0, max_starts_h=0, run_s=0, min_sump=9.0)
    for t in range(N):
        hour = (t / 3600) % 24
        demand = (0.003 if 6 <= hour < 9 or 15 <= hour < 18 else 0.0004) * (1 + 0.3 * nz[0, t])  # irrigation rounds
        inflow = inflow_scale * 0.003 * (1 + 0.15 * math.sin(2 * math.pi * t / 259200))                     # canal, dry season
        sump_meas = 9.0 if failed_level else sump + 0.005 * nz[1, t]
        sw_ok = True if stuck_switch else sump > 0.20
        current = (I_RUN if sump > 0.05 else I_DRY) + 0.05 * nz[2, t]
        was_on, was_locked = c.on, c.locked; on = c.update(t, tank / H_TANK, sump_meas, current, sw_ok)
        if on and not was_on: log["starts"] += 1
        if c.locked and not was_locked: log["lockouts"] += 1
        log["max_starts_h"] = max(log["max_starts_h"], len(c.starts))
        q = Q if on and sump > 0.05 else 0.0
        if on: log["run_s"] += 1
        if on and sump <= 0.05: log["dry_s"] += 1                          # pump running with no water at its intake
        sump = min(max(sump + (inflow - q) / A_SUMP, 0.0), H_SUMP)
        out = min(max(demand, 0), tank * A_TANK)
        tank = min(max(tank + (q - out) / A_TANK, 0.0), H_TANK)
        if tank <= 0.001: log["empty_s"] += 1
        log["min_sump"] = min(log["min_sump"], sump)
    return log

def test_operating_point():
    Q, H = operating_point(); print(f"operating point: {1000 * Q:.2f} L/s at {H:.2f} m; fills the tank from 60 % to 90 % "
                                     f"in {0.3 * H_TANK * A_TANK / Q / 60:.1f} min with no demand")
    assert abs(H0 - KP * Q**2 - (LIFT + R_PIPE * Q**2)) < 1e-9

def test_week():
    for name, kw in [("normal week", {}), ("low canal (50 % inflow)", dict(inflow_scale=0.5)),
                     ("level switch stuck OK", dict(stuck_switch=True, inflow_scale=0.5)),
                     ("level sensor failed high", dict(failed_level=True, inflow_scale=0.5)),
                     ("both level sensors failed", dict(failed_level=True, stuck_switch=True, inflow_scale=0.5)),
                     ("canal dry", dict(inflow_scale=0.0))]:
        L = simulate(**kw)
        print(f"{name}: pump ran {L['run_s'] / 3600:.1f} h, {L['starts']} starts (max {L['max_starts_h']} per hour), "
              f"dry running {L['dry_s']} s ({L['lockouts']} dry-run lockouts), tank empty {L['empty_s'] / 3600:.1f} h, lowest sump {L['min_sump']:.3f} m")
        assert L["dry_s"] <= 3 * max(1, L["starts"]) and L["max_starts_h"] <= MAX_STARTS_PER_HOUR   # never runs dry for long
        if name == "normal week": assert L["empty_s"] == 0 and L["dry_s"] == 0
        if not kw.get("failed_level") and not kw.get("stuck_switch"): assert L["dry_s"] == 0

test_operating_point(); test_week(); print("PASS")
