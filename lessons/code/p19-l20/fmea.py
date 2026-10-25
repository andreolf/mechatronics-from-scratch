# Illustrative FMEA for a self-balancing two-wheeled robot. Ratings are 1 (best) to 10 (worst) on the usual
# severity, occurrence and detection scales; the values are a teaching example, not field data.
ROWS = [
    # (item, failure mode, effect, S, O, D, action, (S, O, D) after action or None)
    ("IMU", "gyro bias drifts with temperature", "robot leans and drives away slowly", 6, 6, 5,
     "online bias estimate while stationary; temperature-compensation table", (6, 3, 3)),
    ("IMU", "I2C bus locks up", "no attitude data, robot falls over", 8, 4, 4,
     "bus timeout and recovery; watchdog on IMU data age; motor STO on stale data", (8, 3, 2)),
    ("motor driver", "high-side MOSFET fails short", "wheel driven uncontrolled, robot falls or runs off", 9, 2, 6,
     "driver with desaturation detection; current-sense plausibility; power relay cut", (9, 2, 2)),
    ("encoder", "connector intermittent", "wrong wheel speed, oscillation", 5, 5, 4,
     "locking connector; speed plausibility against motor current", (5, 2, 3)),
    ("battery", "cell over-discharge", "brown-out resets the MCU mid-balance", 7, 4, 3,
     "BMS undervoltage warning with controlled sit-down before cut-off", (7, 2, 2)),
    ("firmware", "control loop overruns its deadline", "jitter, growing oscillation", 7, 3, 7,
     "WCET measurement (Phase 18); deadline-miss counter triggers safe stop", (7, 2, 3)),
    ("chassis", "wheel set-screw loosens", "wheel slips on shaft", 6, 5, 6,
     "keyed shaft and thread-locker; slip check comparing wheel and motor speed", (6, 2, 3)),
    ("user", "lifted while motors run", "wheels spin at full speed, finger injury", 9, 3, 3,
     "detect loss of ground contact from current and attitude; cut torque", (9, 3, 1)),
    ("LED", "status LED fails", "status not visible", 2, 3, 8, None, None),
]

def rpn(s, o, d): return s * o * d

def test_rpn_ranking():
    ranked = sorted(ROWS, key=lambda r: -rpn(*r[3:6]))
    print(f"{'RPN':>4s} {'S':>2s} {'O':>2s} {'D':>2s}  item / failure mode -> RPN after action")
    for r in ranked:
        after = f"{rpn(*r[7]):4d}" if r[7] else "   -"
        print(f"{rpn(*r[3:6]):4d} {r[3]:2d} {r[4]:2d} {r[5]:2d}  {r[0]} / {r[1]} -> {after}")
    top = ranked[:3]; severe = [r for r in ROWS if r[3] >= 9]
    for r in top + severe:
        assert r[6] and r[7] and rpn(*r[7]) < rpn(*r[3:6]), r[1]             # highest risks have effective actions
    print(f"actions on the top 3 by RPN and on all {len(severe)} modes with severity 9 or 10")

def test_rpn_limits():
    ranked = sorted(ROWS, key=lambda r: -rpn(*r[3:6])); short = next(r for r in ROWS if "fails short" in r[1])
    screw = next(r for r in ROWS if r[0] == "chassis")
    print(f"the MOSFET short (S {short[3]}, RPN {rpn(*short[3:6])}) ranks {ranked.index(short) + 1}th by RPN, "
          f"below the loose set-screw (S {screw[3]}, RPN {rpn(*screw[3:6])})")
    assert ranked.index(short) > ranked.index(screw)
    combos = {rpn(s, o, d) for s in range(1, 11) for o in range(1, 11) for d in range(1, 11)}
    print(f"S x O x D can take only {len(combos)} distinct values out of 1000 combinations, unevenly spread from 1 to 1000")
    same = [(s, o, d) for s in range(1, 11) for o in range(1, 11) for d in range(1, 11) if s * o * d == 120]
    print(f"{len(same)} different (S, O, D) triples give RPN 120, from {min(same)} to {max(same)}")
    assert len(combos) < 200 and len(same) > 10

test_rpn_ranking()
test_rpn_limits()
print("PASS")
