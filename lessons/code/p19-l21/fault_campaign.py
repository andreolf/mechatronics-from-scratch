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
        if f and k_bad is None and f not in ("encoder stuck", "motor dead"): k_bad = k
        if f == "encoder stuck" and k_bad is None and abs(q_j - q) > 0.004: k_bad = k             # stuck value now wrong
        if f == "encoder spike" and k == k0: q_j += 0.3 * mag
        if f != "control overrun" or (k - k0) % 40 == 0:                       # an overrunning task updates rarely
            tau_cmd = float(np.clip(40 * (ref - q_j) + 3 * (0 - w) + MGL * np.sin(q_j), -T_MAX, T_MAX)); ctrl_age = 0
        else: ctrl_age += 1
        if f == "motor dead" and k_bad is None and abs(tau_cmd) > 0.1: k_bad = k                 # dead motor now matters
        tau = 0.0 if f == "motor dead" else T_MAX if f == "motor runaway" else tau_cmd
        i_meas = tau / KT + rng.normal(0, 0.05)
        trips = []                                                             # ---- supervisor ----
        if abs(i_meas - tau_cmd / KT) > 1.0: trips.append("current plausibility")
        if q_j_prev is not None and abs(q_j - q_j_prev) > 0.02: trips.append("rate")
        xcount = xcount + 1 if abs(q_j - q_m) > 0.004 else 0
        if xcount >= 3: trips.append("encoder cross-check")
        age = 0 if seq != last_seq else age + 1; last_seq = seq
        if age >= 10: trips.append("setpoint watchdog")
        if ctrl_age >= 5: trips.append("deadline monitor")
        if trips:
            if fault is None or k < k0: return 0.0, ["FALSE TRIP"] + trips, 0.0
            if k_bad is None: k_bad = k
            return (k - k_bad) * DT * 1000, trips, (k_bad - k0) * DT * 1000   # latency after activation, dormant time
        q_j_prev = q_j
        w += (tau - MGL * np.sin(q) - B * w) / J * DT; q += w * DT
    return None, [], None

def test_no_false_trips():
    for s in range(10): assert run(None, seed=s)[0] is None
    print("10 healthy runs: no trips")

def test_campaign(trials=15):
    rng = np.random.default_rng(42); covered = 0
    for fault in FAULTS:
        lat = []; mons = set()
        for n in range(trials):
            ms, trips, _ = run(fault, t_fault=rng.uniform(0.3, 0.9), mag=rng.choice([-1, 1]) * rng.uniform(0.5, 1.5), seed=100 + n)
            assert ms is not None and "FALSE TRIP" not in trips, (fault, n); lat.append(ms); mons.update(trips)
        covered += max(lat) <= BUDGET_MS
        print(f"{fault:22s} reacted {trials}/{trials}, latency max {max(lat):4.1f} ms, by {', '.join(sorted(mons))}")
    print(f"fault classes covered within {BUDGET_MS} ms: {covered}/{len(FAULTS)}")
    assert covered == len(FAULTS)

def test_dormant_motor_fault():
    """sweep the injection time: a dead motor commanded near zero torque produces no wrong output yet (dormant)."""
    res = [run("motor dead", t_fault=tf, seed=100) for tf in np.arange(0.30, 0.90, 0.005)]
    worst = max(r[0] for r in res); dorm = max(r[2] for r in res)
    print(f"dead motor over {len(res)} injection times: dormant for up to {dorm:.1f} ms, then caught within {worst:.1f} ms")
    assert worst <= BUDGET_MS

test_no_false_trips()
test_campaign()
test_dormant_motor_fault()
print("PASS")
