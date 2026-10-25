---
id: p19-l16
minutes: 40
summary: Machine safety starts with a structured hunt for hazards. You follow the ISO 12100 process of limits, hazard identification, risk estimation, evaluation and reduction, encode a hazard log for a robot arm cell with an illustrative risk matrix, and test that every hazard has measures, design measures come before warnings, and no high risk remains.
---

## The ISO 12100 process

ISO 12100 sets out how to make a machine safe, iterating until the risk is acceptable:

1. **Determine the limits** of the machine: intended use, reasonably foreseeable misuse, who interacts with it, in which life phases (installation, operation, cleaning, maintenance).
2. **Identify hazards**: mechanical (crushing, impact, shearing), electrical, thermal, noise, ergonomic, and the situations in which people meet them.
3. **Estimate the risk** of each: the severity of the possible harm and the probability of that harm, which depends on exposure, the likelihood of the hazardous event and whether it can be avoided.
4. **Evaluate** whether the risk is acceptable.
5. **Reduce** it with the **three-step method**, in this order: inherently safe design, then safeguarding and complementary protective measures, then information for use.

A warning label is the last resort, never the main measure for a serious hazard.

## A risk matrix

Many teams score risk as severity times likelihood on agreed scales, $R = S \times L$, and colour the result. The standard does not prescribe a matrix: the 4 × 4 one in the code is illustrative, and its thresholds are a project decision. Medium residual risks are accepted here only when a safety function with a required performance level (PLr, Lesson 17) covers them.

:::figure widget=riskmatrix caption="The illustrative risk matrix with each hazard before and after its measures. Select a hazard and toggle measures to see it move."
:::end

## Worked example

Six hazards for a robot arm cell:

1. Impact by the moving arm, crushing while teaching, and unexpected start-up during maintenance start **high**; the electric shock, dropped part and hot surface hazards start medium.
2. After the measures, no high risk remains (3 before, 0 after). The dropped part and burn hazards reach low; the other four are medium and each relies on a safety function with a PLr (interlocked door, enabling switch, isolator interlock, restart interlock).
3. Every hazard has at least one measure, every measure lowers the score, and no medium or high hazard relies on information alone.

The hazards, scores and PLr values are a teaching example, not an assessment of a real cell.

## Code it from scratch

:::code file=hazard_log.py
```python
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
```
:::end

## In practice

Hazard logs usually live in spreadsheets or requirements tools, reviewed by a team that includes operators and maintenance staff, because the people who do the job know the situations. Robot cells add ISO 10218 (industrial robots) and, for collaborative robots, ISO/TS 15066. Encoding the log as data, as here, lets checks run on every change. This lesson is educational and not a substitute for the standards or a qualified safety assessment.

## Exercises

:::exercise
A cleaner might reach past a guard to wipe a sensor while the machine runs. Which ISO 12100 step catches this?
:::solution
Determining the limits, specifically reasonably foreseeable misuse and the cleaning life phase. Hazard identification must then cover the situation.
:::end

:::exercise
Why is "add a warning sign" not enough for an impact hazard from a robot arm?
:::solution
Information for use is the last of the three steps and relies on people always reading and obeying it. A hazard that can kill must first be reduced by design (lower speed, force limits) and safeguarding (fences, interlocks).
:::end

## Quiz

:::quiz
- type: num
  q: Risk score for severity 3 and likelihood 4 on the lesson's scales?
  answer: 12
  tol: 0.001
  py: "3*4"
  explain: S × L.
- type: num
  q: Cells in a 4 × 4 risk matrix?
  answer: 16
  tol: 0.001
  py: "4*4"
  explain: Every severity and likelihood pair.
- type: num
  q: Steps in the ISO 12100 three-step risk reduction method?
  answer: 3
  tol: 0.001
  py: "3"
  explain: Design, safeguarding, information.
- type: num
  q: Score reduction from 4 × 3 to 4 × 1 (%)?
  answer: 66.7
  tol: 0.003
  py: "100*(12-4)/12"
  explain: From 12 to 4.
- type: mc
  q: Which risk reduction measure comes first?
  options: ["Inherently safe design", "Warning labels", "Training", "Personal protective equipment"]
  answer: 0
  explain: Design out the hazard if possible.
- type: mc
  q: What does ISO 12100 define?
  options: ["The risk assessment and reduction process", "A mandatory 5 × 5 risk matrix", "Robot speed limits", "Battery charging rules"]
  answer: 0
  explain: Teams choose their own scales.
:::end
