---
id: p20-l16
minutes: 35
summary: The last lesson packages the capstones. You write each one down as requirements, model, code, tests, results and demo, check mechanically that every requirement traces to a test with a recorded result and that a smoke test re-derives a headline number, generate the portfolio README, and confirm the checker catches the gaps you inject.
---

## What a portfolio must show

A reviewer, whether an employer, a professor or a future you, wants the same six things for each project: the **requirements**, the **model**, the **code**, the **tests**, the **results** and a **demo**. Most important is the trace from each requirement to the test that proves it, with the number it produced:

$$\text{requirement} \rightarrow \text{test} \rightarrow \text{result}.$$

A requirement without a test is a wish; a test without a requirement is noise. Write the trace as data, so a script can check it rather than a person.

## Results, not adjectives

"Robust" says nothing; "minimum phase margin 34.9° over 300 perturbed drones" says what was done and lets someone check it. Label simulated and illustrative values as such, keep the scripts that produced them, and make every number in the write-up regenerable from the repository.

:::figure widget=portfolio caption="The five capstones and their traceability. Toggle artifacts off to see which checks fail; the readout lists the gaps."
:::end

## Worked example

The five capstones of this phase:

1. Balancing robot: 6 lessons, 4 requirements (R1 to R4 of Lesson 01) each traced to a test, for example R2 runs at least 30 min, from the power budget at 84.2 min.
2. Quadcopter: 4 lessons, 4 requirements, including the 2° attitude specification met at 1.18° RMS.
3. Robot arm: 3 lessons, 3 requirements, including targets within 1 mm, met at 0.307 mm.
4. Irrigation pump: 2 requirements; rope drive supervisor: 2 requirements, 63 state–fault pairs.
5. Totals: 5 capstones, 15 requirements all traced, 12 code files, 16 lessons; the generated README has 49 lines. Removing a test, a demo and breaking one smoke test produces exactly those 3 problems.

## Code it from scratch

:::code file=portfolio_check.py
```python
import math, hashlib, json

# small, fast smoke tests, one per capstone, re-deriving a headline result of its lessons
def t_balancer():   # Lesson 05: delay margin of the LQR loop
    return abs(math.radians(93.1) / 20.4 - 0.0797) < 1e-3
def t_quad():       # Lesson 07: X-frame mixer round trip (thrust, roll, pitch, yaw)
    d, c = 0.22 / math.sqrt(2), 0.016
    M = [[1, 1, 1, 1], [-d, d, d, -d], [-d, d, -d, d], [-c, -c, c, c]]
    f = [2.5, 2.0, 2.2, 2.4]; w = [sum(M[i][j] * f[j] for j in range(4)) for i in range(4)]
    # inverse of this M in closed form: f = T/4 + ... ; check by solving with Gaussian elimination
    A = [row[:] + [w[i]] for i, row in enumerate(M)]
    for i in range(4):
        p = max(range(i, 4), key=lambda r: abs(A[r][i])); A[i], A[p] = A[p], A[i]
        for r in range(4):
            if r != i: k = A[r][i] / A[i][i]; A[r] = [a - k * b for a, b in zip(A[r], A[i])]
    return all(abs(A[i][4] / A[i][i] - f[i]) < 1e-12 for i in range(4))
def t_arm():        # Lesson 12: quintic peak speed 15/8 dq/T
    T, dq = 1.0, 1.0; vmax = max(dq * (30 * s**2 - 60 * s**3 + 30 * s**4) / T for s in [k / 1000 for k in range(1001)])
    return abs(vmax - 15 / 8) < 1e-6
def t_pump():       # Lesson 14: operating point satisfies pump curve = system curve
    Q = math.sqrt((14 - 6) / (1.8e5 + 0.9e5)); return abs((14 - 1.8e5 * Q * Q) - (6 + 0.9e5 * Q * Q)) < 1e-9
def t_lift():       # Lesson 15: emergency stopping distance v^2 / 2a
    return abs(5.0**2 / (2 * 1.6) - 7.8125) < 1e-9

REQUIRED = ["requirements", "model", "code", "tests", "results", "demo"]
CAPSTONES = {
    "balancing robot": dict(lessons=["p20-l01", "p20-l02", "p20-l03", "p20-l04", "p20-l05", "p20-l06"],
        requirements={"R1": "recovers from 5 deg within 1.5 s", "R2": "runs at least 30 min", "R3": "loop jitter under 100 us",
                      "R4": "cuts torque within 50 ms beyond 30 deg"},
        model="nonlinear wheel-pendulum, linearised (l02)", code=["balance_fw.c", "pid_vs_lqr.py", "break_it.py"],
        tests={"R1": "recovery and kick tests", "R2": "power budget", "R3": "loop timing budget", "R4": "fault injection"}, smoke=t_balancer,
        results=["LQR recovers from a kick in 1.03 s", "84.2 min from the power budget", "48.5 us jitter, 533.9 us of the 2 ms period used",
                 "motor loss trips the tilt monitor"],
        demo="video of the push test and the fault campaign"),
    "quadcopter": dict(lessons=["p20-l07", "p20-l08", "p20-l09", "p20-l10"],
        requirements={"Q1": "mixer is invertible", "Q2": "attitude RMS error below 2 deg", "Q3": "phase margin above 45 deg",
                      "Q4": "robust over the parameter envelope"},
        model="rigid body with motor lag and delay", code=["quad_mixer.py", "attitude_estimation.py", "cascaded_control.py", "robustness.py"],
        tests={"Q1": "round trip", "Q2": "simulated flight", "Q3": "loop margins", "Q4": "300-sample Monte Carlo"}, smoke=t_quad,
        results=["round trip exact", "EKF 1.18 deg RMS", "62.4 and 78.6 deg", "minimum 34.9 deg"], demo="SITL flight log plots"),
    "robot arm": dict(lessons=["p20-l11", "p20-l12", "p20-l13"],
        requirements={"A1": "motors meet torque with SF 1.5", "A2": "reaches targets within 1 mm", "A3": "tracks within 2 mm"},
        model="URDF and two-link dynamics", code=["arm_design.py", "pick_and_place.py", "computed_torque.py"],
        tests={"A1": "torque sweep", "A2": "waypoint error with encoders", "A3": "tracking run with payload error"}, smoke=t_arm,
        results=["64 % and 47 % of rating", "0.307 mm", "0.814 mm moving"], demo="pick-and-place animation"),
    "irrigation pump": dict(lessons=["p20-l14"],
        requirements={"P1": "never runs dry for more than 3 s per start", "P2": "at most 6 starts per hour"},
        model="pump and system curves, two tanks", code=["irrigation_pump.py"],
        tests={"P1": "week simulations with sensor failures", "P2": "start counter"}, smoke=t_pump,
        results=["2 s per lockout with both level sensors failed", "max 6 per hour"], demo="tank level plots"),
    "rope drive supervisor": dict(lessons=["p20-l15"],
        requirements={"S1": "every fault in every state ends safe", "S2": "no restart while a fault is present"},
        model="state machine with line dynamics (educational)", code=["rope_drive_supervisor.py"],
        tests={"S1": "63 state-fault pairs", "S2": "restart attempts with the fault held"}, smoke=t_lift,
        results=["all 63 end locked out with brakes on", "all refused"], demo="state diagram"),
}

def check(capstones):
    problems = []
    for name, c in capstones.items():
        for k in REQUIRED:
            if not c.get(k): problems.append(f"{name}: no {k}")
        for r in c.get("requirements", {}):
            if r not in c.get("tests", {}): problems.append(f"{name}: requirement {r} has no test")
        for r in c.get("tests", {}):
            if r not in c.get("requirements", {}): problems.append(f"{name}: test for unknown requirement {r}")
        if len(c.get("results", [])) < len(c.get("tests", {})): problems.append(f"{name}: a test has no recorded result")
        if "smoke" not in c or not c["smoke"](): problems.append(f"{name}: smoke test missing or failing")
    return problems

def readme(capstones):
    lines = ["# Mechatronics capstones", "", "| Capstone | Lessons | Requirements | Tests | Demo |", "|---|---|---|---|---|"]
    for n, c in capstones.items():
        lines.append(f"| {n} | {len(c['lessons'])} | {len(c['requirements'])} | {len(c['tests'])} | {c['demo']} |")
    for n, c in capstones.items():
        lines += ["", f"## {n}", "", f"Model: {c['model']}.", ""]
        lines += [f"- **{r}** {txt}: {c['tests'][r]}, {res}" for (r, txt), res in zip(c["requirements"].items(), c["results"])]
    return "\n".join(lines) + "\n"

def test_portfolio():
    p = check(CAPSTONES); print("problems:", p or "none"); assert not p
    n_req = sum(len(c["requirements"]) for c in CAPSTONES.values()); n_files = sum(len(c["code"]) for c in CAPSTONES.values())
    print(f"{len(CAPSTONES)} capstones, {n_req} requirements all traced to tests, {n_files} code files, "
          f"{sum(len(c['lessons']) for c in CAPSTONES.values()) + 1} lessons with this one")
    text = readme(CAPSTONES); print(f"README: {len(text.splitlines())} lines, sha256 {hashlib.sha256(text.encode()).hexdigest()[:12]}")
    assert text.count("## ") == len(CAPSTONES)

def test_checker_catches_gaps():
    broken = json.loads(json.dumps({k: {kk: vv for kk, vv in v.items() if kk != "smoke"} for k, v in CAPSTONES.items()}))
    for k in broken: broken[k]["smoke"] = CAPSTONES[k]["smoke"]
    broken["robot arm"]["tests"].pop("A2"); broken["quadcopter"]["demo"] = ""; broken["irrigation pump"]["smoke"] = lambda: False
    p = check(broken); print("injected gaps found:", p); assert len(p) == 3

test_portfolio(); test_checker_catches_gaps(); print("PASS")
```
:::end

## In practice

Put each capstone in a Git repository with `README.md` (the trace table), `docs/` (derivations, figures), `src/`, `tests/` and `results/`, run the tests in continuous integration, and tag the version that produced the numbers. A short video of each demo and the generated README make a portfolio someone can review in ten minutes. That is also the last step of this course: well done for getting here.

## Exercises

:::exercise
A reviewer asks how you know the arm meets its torque specification. What do you point to?
:::solution
Requirement A1 in the README, the torque sweep in `arm_design.py` that checks every pose, its result (64 % and 47 % of the motor ratings) and the URDF limits generated from the chosen motors.
:::end

:::exercise
Why check the portfolio with a script instead of by reading it?
:::solution
A script runs on every change and does not get tired; it catches the requirement whose test was deleted last month. Reading is still needed for clarity, but not for completeness.
:::end

## Quiz

:::quiz
- type: num
  q: Requirements across capstones with 4, 4, 3, 2 and 2?
  answer: 15
  tol: 0.001
  py: "4+4+3+2+2"
  explain: Sum.
- type: num
  q: Lessons in the arm capstone as a share of Phase 20's 16 (%)?
  answer: 18.75
  tol: 0.005
  py: "100*3/16"
  explain: 3/16.
- type: num
  q: Margin of 84.2 min over the 30 min requirement (×)?
  answer: 2.807
  tol: 0.005
  py: "84.2/30"
  explain: Result over limit.
- type: num
  q: Margin of the arm's 0.307 mm against 1 mm (×)?
  answer: 3.257
  tol: 0.005
  py: "1/0.307"
  explain: Limit over result.
- type: mc
  q: Which is a requirement without a test?
  options: ["A wish", "A result", "A demo", "A model"]
  answer: 0
  explain: Nothing proves it.
- type: mc
  q: What makes a reported number trustworthy?
  options: ["It is regenerated by a script in the repository", "It is round", "It appears in a slide", "It matches expectations"]
  answer: 0
  explain: Anyone can rerun it.
:::end
