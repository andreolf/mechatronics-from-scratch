---
id: p19-l20
minutes: 40
summary: Failure modes and effects analysis asks, for every part, how it can fail, what happens then, and how you would know. You build an FMEA for an illustrative self-balancing robot, rank failure modes by RPN, check that the highest risks and every severe mode have effective actions, and expose the weaknesses of multiplying ordinal scores.
---

## Bottom-up analysis

Hazard analysis (Lesson 16) works top-down from what could hurt someone. **FMEA** works bottom-up: list each item, each way it can fail, the effect on the system and the user, and the causes and existing controls. Three ratings, usually 1 to 10, describe each failure mode:

- **Severity** $S$ of the effect;
- **Occurrence** $O$, how likely the cause is;
- **Detection** $D$, how unlikely it is that the failure is detected before it causes harm (10 means it cannot be detected).

## The risk priority number and its limits

The classic ranking is the **risk priority number** $\mathrm{RPN} = S \times O \times D$, from 1 to 1000. It is easy to compute and widely used, but it multiplies ordinal scales as if they were measurements:

- many different combinations give the same RPN, from harmless to dangerous;
- a severe but rare failure can rank below a mild, frequent one;
- the 1000 combinations produce only 120 distinct values, unevenly spread.

That is why the 2019 AIAG and VDA FMEA handbook replaced the RPN with **action priority** tables that weight severity first, and why good practice adds a rule such as "every failure mode with severity 9 or 10 gets an action, whatever its RPN".

:::figure widget=fmeagrid caption="The FMEA rows ranked by RPN. Change S, O and D for the selected row and toggle the actions; severe rows stay flagged whatever their RPN."
:::end

## Worked example

Nine failure modes of an illustrative self-balancing robot (ratings are a teaching example, not field data):

1. By RPN the top three are gyro bias drift (180), the loosening wheel set-screw (180) and control-loop overruns (147).
2. The high-side MOSFET failing short (S 9, RPN 108) ranks only 5th, below the set-screw (S 6, RPN 180); being lifted while the motors run (S 9) ranks 8th.
3. The top three and both severity-9 modes have actions that reduce their RPN, for example 180 to 54 for gyro drift and 108 to 36 for the MOSFET short.
4. Only 120 distinct RPN values exist, and 24 different (S, O, D) triples give RPN 120, from (2, 6, 10) to (10, 6, 2).

## Code it from scratch

:::code file=fmea.py
```python
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
```
:::end

## In practice

FMEAs live in spreadsheets or dedicated FMEA tools and are reviewed by cross-functional teams; design FMEA and process FMEA (for manufacturing) follow the same pattern. The actions feed back into the design: diagnostics that improve detection (Lesson 19), redundancy and derating that reduce occurrence. Keeping the FMEA as data makes rules like "no severe mode without an action" checkable on every revision.

## Exercises

:::exercise
Compute the RPN of S 8, O 2, D 9 and compare it with S 4, O 6, D 6.
:::solution
$8 \times 2 \times 9 = 144$ and $4 \times 6 \times 6 = 144$: equal RPNs, but the first is a severe, hard-to-detect failure and deserves priority.
:::end

:::exercise
Which kind of action lowers the detection rating?
:::solution
Adding a diagnostic or test that reveals the failure before it causes harm, such as a plausibility check, a watchdog, or an end-of-line test. Design changes that make the cause less likely lower occurrence instead; only design changes to the effect lower severity.
:::end

## Quiz

:::quiz
- type: num
  q: RPN for S 7, O 4 and D 5?
  answer: 140
  tol: 0.001
  py: "7*4*5"
  explain: S × O × D.
- type: num
  q: Largest possible RPN on 1 to 10 scales?
  answer: 1000
  tol: 0.001
  py: "10*10*10"
  explain: 10³.
- type: num
  q: RPN reduction from 180 to 54 (%)?
  answer: 70
  tol: 0.002
  py: "100*(180-54)/180"
  explain: (180 − 54)/180.
- type: num
  q: New RPN if detection improves from 6 to 2 with S 9 and O 2?
  answer: 36
  tol: 0.001
  py: "9*2*2"
  explain: Only D changes.
- type: mc
  q: What is the main weakness of ranking by RPN?
  options: ["A severe failure can rank below a mild frequent one", "It is too hard to compute", "It ignores occurrence", "It only works for software"]
  answer: 0
  explain: Multiplying ordinal scores hides severity.
- type: mc
  q: What does a detection rating of 10 mean?
  options: ["The failure cannot be detected before it causes harm", "The failure is always detected", "The failure never occurs", "The effect is harmless"]
  answer: 0
  explain: Higher D is worse.
:::end
