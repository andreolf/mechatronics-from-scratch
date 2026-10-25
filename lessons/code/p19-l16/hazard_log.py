# Illustrative hazard log for a small robot arm cell. The 4 x 4 matrix and scores are a teaching example, not taken
# from ISO 12100 (which defines the process, not a matrix); real projects agree their own scales.
SEV = {"minor": 1, "serious": 2, "major": 3, "fatal": 4}           # worst credible harm
LIK = {"remote": 1, "unlikely": 2, "possible": 3, "likely": 4}    # likelihood of that harm
def risk(s, l):
    r = SEV[s] * LIK[l]
    return "high" if r >= 9 else "medium" if r >= 4 else "low"

ORDER = {"design": 0, "guard": 1, "info": 2}                      # ISO 12100 three-step method: design first, info last

HAZARDS = [
    # (id, hazard, situation, severity, likelihood before, [(measure type, measure)], severity after, likelihood after)
    ("H1", "impact by moving arm", "operator enters cell during automatic run", "fatal", "possible",
     [("guard", "interlocked fence door stops the arm (safety function, PLr d, Lessons 17-18)"), ("guard", "light curtain at loading window")], "fatal", "remote"),
    ("H2", "crushing between arm and fixture", "teaching the robot with the pendant", "major", "possible",
     [("design", "reduced speed 250 mm/s in teach mode"), ("guard", "three-position enabling switch (safety function, PLr d)")], "serious", "unlikely"),
    ("H3", "dropped part", "gripper loses vacuum while moving", "serious", "possible",
     [("design", "gripper with spring-closed fingers that hold on power loss"), ("info", "hard-hat zone sign")], "serious", "remote"),
    ("H4", "electric shock", "opening the control cabinet", "fatal", "unlikely",
     [("design", "touch-safe terminals, IP2X inside the cabinet"), ("guard", "cabinet door interlocked with the isolator (safety function, PLr c)"), ("info", "lockout-tagout procedure")], "fatal", "remote"),
    ("H5", "unexpected start-up", "maintenance inside the cell", "fatal", "possible",
     [("guard", "lockable main isolator, one lock per technician"), ("design", "restart needs a deliberate reset outside the cell (safety function, PLr d)")], "fatal", "remote"),
    ("H6", "burn from motor housing", "touching the arm after a long run", "minor", "likely",
     [("info", "hot surface label"), ("design", "thermal derating keeps the housing below 60 C")], "minor", "unlikely"),
]

def test_hazard_log():
    print(f"{'id':3s} {'before':7s} {'after':7s} measures")
    for hid, hz, sit, s0, l0, meas, s1, l1 in HAZARDS:
        print(f"{hid:3s} {risk(s0, l0):7s} {risk(s1, l1):7s} {len(meas)}  {hz}")
        assert meas, hid                                                       # every hazard has a measure
        # residual risk acceptable: low, or medium only when a safety function with a required performance level covers it
        assert risk(s1, l1) == "low" or (risk(s1, l1) == "medium" and any("PLr" in m for _, m in meas)), hid
        assert SEV[s1] * LIK[l1] < SEV[s0] * LIK[l0], hid                       # measures actually reduce the risk
        if risk(s0, l0) in ("high", "medium"):
            assert min(ORDER[t] for t, _ in meas) < 2, hid                      # never only warnings for real risks
    before = sum(risk(h[3], h[4]) == "high" for h in HAZARDS); after = sum(risk(h[6], h[7]) == "high" for h in HAZARDS)
    print(f"high risks: {before} before, {after} after")
    assert after == 0

def test_matrix():
    print("risk matrix (rows: severity, columns: likelihood remote..likely)")
    for s in SEV: print(f"  {s:8s} " + " ".join(f"{risk(s, l):6s}" for l in LIK))

test_hazard_log()
test_matrix()
print("PASS")
