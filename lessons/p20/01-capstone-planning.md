---
id: p20-l01
minutes: 35
summary: A capstone starts with requirements you can test. You turn wishes into measurable criteria with a quantity, a comparison and a limit, reject vague words automatically, map every requirement to a test, and run the tests against a model of a self-balancing robot so the traceability check fails the moment a requirement has no test.
---

## From wishes to requirements

"The robot should balance well and last a long time" cannot be passed or failed. A **requirement** you can test names a quantity, a comparison and a limit, and says how it is measured: "recover from a 5° tilt within 1.5 s", "run at least 30 min on one charge". Words such as *fast*, *robust*, *reliable* or *smooth* are signs that the measurable part is missing.

Writing each requirement as data,

$$\text{requirement} = (\text{id}, \text{metric}, \text{op}, \text{limit}), \qquad \text{pass} \iff \text{metric} \;\text{op}\; \text{limit},$$

lets code check that the set is complete and that the design meets it.

## Traceability

**Traceability** links each requirement to the tests that verify it, and each test back to a requirement. Two checks catch most gaps:

- a requirement with no test is unverified;
- a test with no requirement is either testing nothing that matters or hides a missing requirement.

The same links later show what to re-test when a requirement or design changes. The capstones in this phase (a self-balancing robot, a quadcopter, a robot arm, an irrigation pump and a rope-drive supervisor) each start from a short requirements file like this one.

:::figure widget=tracegraph caption="Requirements on the left, tests on the right, links between them. Toggle a test off or add an untested requirement and watch the traceability check fail."
:::end

## Worked example

Five requirements for the self-balancing robot, each tested against a model of the design (illustrative numbers):

1. R1, recovery from 5°: 0.345 s against 1.5 s, pass.
2. R2, runtime: 75.817 min against 30 min, pass (3S 2.5 Ah pack, 85 % usable, two motors averaging 8 W).
3. R3, loop jitter: 48.473 µs against 100 µs, pass. R4, torque cut-off after a fall: 24 ms against 50 ms. R5, mass: 1.090 kg against 1.5 kg.
4. "The robot shall be robust" is rejected as vague, and adding R6 without a test makes the traceability check report it.

## Code it from scratch

:::code file=requirements.py
```python
import math, re

# Requirements for the capstone self-balancing robot. Each one is measurable: a quantity, a comparison and a limit.
REQS = [
    {"id": "R1", "text": "Recover from a 5 degree tilt within 1.5 s", "metric": "recovery_time_s", "op": "<=", "limit": 1.5},
    {"id": "R2", "text": "Run at least 30 min on one charge", "metric": "runtime_min", "op": ">=", "limit": 30},
    {"id": "R3", "text": "Control loop period 2 ms with jitter under 100 us", "metric": "jitter_us", "op": "<", "limit": 100},
    {"id": "R4", "text": "Cut motor torque within 50 ms of a tilt beyond 30 degrees", "metric": "cutoff_ms", "op": "<=", "limit": 50},
    {"id": "R5", "text": "Mass under 1.5 kg", "metric": "mass_kg", "op": "<", "limit": 1.5},
]
VAGUE = re.compile(r"\b(fast|quick|robust|reliable|user-friendly|easy|smooth|appropriate|sufficient|as needed)\b", re.I)

# Tests: each measures one metric from a model of the design (illustrative numbers) and names the requirements it covers.
def t_recovery():
    """linearised tilt dynamics under a PD law: th'' = a th + b u, u = -kp th - kd th'. 2 % settling time from 5 deg."""
    a, b, kp, kd, dt = 60.0, 12.0, 25.0, 2.0, 1e-4
    th, w, t, last_out = math.radians(5), 0.0, 0.0, 0.0
    while t < 5:
        u = -kp * th - kd * w; w += (a * th + b * u) * dt; th += w * dt; t += dt
        if abs(th) > 0.02 * math.radians(5): last_out = t
    return {"recovery_time_s": last_out}

def t_runtime():
    cap_wh = 11.1 * 2.5 * 0.85                                     # 3S pack, 85 % usable
    load_w = 2 * 8.0 + 0.5 + 0.3                                    # two motors average, MCU board, IMU and radio
    return {"runtime_min": 60 * cap_wh / (load_w / 0.9)}           # 90 % efficient regulators

def t_jitter():
    import random
    random.seed(1); periods = [2000 + random.gauss(0, 12) for _ in range(20000)]
    return {"jitter_us": max(abs(p - 2000) for p in periods)}

def t_cutoff():
    return {"cutoff_ms": 2 + 2 + 20}                               # one period to detect, one to act, driver disable time

def t_mass():
    parts = {"chassis": 0.35, "motors": 0.30, "wheels": 0.12, "battery": 0.19, "electronics": 0.08, "fasteners": 0.05}
    return {"mass_kg": sum(parts.values())}

TESTS = {"t_recovery": (t_recovery, ["R1"]), "t_runtime": (t_runtime, ["R2"]), "t_jitter": (t_jitter, ["R3"]),
         "t_cutoff": (t_cutoff, ["R4"]), "t_mass": (t_mass, ["R5"])}
OPS = {"<=": lambda a, b: a <= b, ">=": lambda a, b: a >= b, "<": lambda a, b: a < b, ">": lambda a, b: a > b}

def trace(reqs, tests):
    covered = {r for _, ids in tests.values() for r in ids}; known = {r["id"] for r in reqs}
    return sorted(known - covered), sorted(covered - known)

def test_requirements_are_measurable():
    for r in REQS:
        assert not VAGUE.search(r["text"]), r["id"]
        assert r["op"] in OPS and isinstance(r["limit"], (int, float)), r["id"]
    print(f"{len(REQS)} requirements, none vague; 'The robot shall be robust' would be rejected: {bool(VAGUE.search('The robot shall be robust'))}")

def test_traceability_and_results():
    untested, orphans = trace(REQS, TESTS)
    assert not untested and not orphans
    results = {}
    for name, (fn, _) in TESTS.items(): results.update(fn())
    for r in REQS:
        v = results[r["metric"]]; ok = OPS[r["op"]](v, r["limit"])
        print(f"{r['id']} {r['metric']:16s} {v:9.3f} {r['op']} {r['limit']:<6} {'PASS' if ok else 'FAIL'}")
        assert ok, r["id"]
    gap, _ = trace(REQS + [{"id": "R6"}], TESTS)
    print(f"adding R6 without a test is caught: untested {gap}")
    assert gap == ["R6"]

test_requirements_are_measurable()
test_traceability_and_results()
print("PASS")
```
:::end

## In practice

Plain Python and a test runner such as pytest are enough for a small project: requirements in a YAML or Python file, tests tagged with requirement ids, and a check in continuous integration that fails on untested requirements. Larger projects use requirements tools (Doorstop is an open-source one that keeps requirements in Git), and safety projects need the same links as evidence (Lesson 16 of Phase 19).

## Exercises

:::exercise
Rewrite "the arm should be accurate" as a testable requirement.
:::solution
For example: "The tool centre point reaches each of 20 test targets within 1 mm, measured in simulation with the nominal model and on the robot with a dial gauge." It names the quantity (position error), the limit (1 mm) and the measurement.
:::end

:::exercise
A test checks the LED blink rate but no requirement mentions the LED. What do you do?
:::solution
Decide whether the behaviour matters. If it does (the LED signals a fault state to the user), add the missing requirement and link the test; if not, delete the test so it does not cost maintenance.
:::end

## Quiz

:::quiz
- type: num
  q: Usable energy of a 3S pack (11.1 V, 2.5 Ah) at 85 % (Wh)?
  answer: 23.59
  tol: 0.002
  py: "11.1*2.5*0.85"
  explain: V × Ah × usable fraction.
- type: num
  q: Runtime of 23.6 Wh at a 16.8 W load with 90 % efficient regulators (min)?
  answer: 75.9
  tol: 0.003
  py: "60*23.6/(16.8/0.9)"
  explain: Energy over input power.
- type: num
  q: Requirements without tests if 7 requirements are covered by tests for 5 of them?
  answer: 2
  tol: 0.001
  py: "7-5"
  explain: Two are unverified.
- type: num
  q: Loop period for a 500 Hz control loop (ms)?
  answer: 2
  tol: 0.001
  py: "1000/500"
  explain: 1/f.
- type: mc
  q: Which requirement is testable?
  options: ["Recover from a 5° tilt within 1.5 s", "Balance well", "Be robust to pushes", "Respond quickly"]
  answer: 0
  explain: Quantity, comparison and limit.
- type: mc
  q: What does a test with no linked requirement suggest?
  options: ["A missing requirement or an unnecessary test", "The requirement set is complete", "The test must pass", "Nothing"]
  answer: 0
  explain: Traceability runs both ways.
:::end
