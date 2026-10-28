---
id: p21-l11
minutes: 50
summary: Put the track together into a desk-sized four-line robot you can build in a weekend and extend for months. You size it with the tools from Lessons 2 to 10, write a bill of materials as requirements rather than part numbers, plan the build in stages that each end with a test, and see where Stringman's open designs can help and how to credit them.
---

## Why start at desk scale

Everything in this track works the same at 0.8 m as at 7 m, and a desk frame is cheaper, safer and faster to iterate on. A 5 N line cannot hurt anyone, a 0.2 kg gripper does no damage when it falls, and you can rebuild a winch in an evening. The physics keeps you honest at any scale, so the habits you build here carry over to a room.

The target, which the simulator's desk preset uses:

| Requirement | Value | Where it comes from |
|---|---|---|
| Frame | 0.8 × 0.6 m footprint, anchors 0.5 m up | fits on a desk |
| Hanging mass | 0.2 kg (small servo gripper plus a light object) | |
| Line tension limit | 5 N | Lesson 8: low enough to be harmless |
| Speed | 0.2 m/s | half of Stringman's 0.4 m/s |
| Pole | 0.1 m | Lesson 7: period 0.634 s |

:::figure widget=cablebot args={"preset":"desk"} caption="The desk preset: 0.8 × 0.6 × 0.5 m, 10 cm pole, 0.1 kg, a 5 N limit and 0.2 m/s. Raise the payload to 0.2 kg and drag the gripper up and to the walls: the capacity map shows where it stops fitting."
:::end

## Size it with the track

**Workspace (Lesson 4).** With a 5 N limit the capacity at the centre is 1.27 kg with the pivot 0.1 m above the desk and 0.40 kg at 0.4 m. The worst point in each layer matters more: 0.52 kg up to a pivot height of 0.25 m, 0.25 kg at 0.4 m and 0.19 kg at 0.425 m. So 0.2 kg fits everywhere with the pivot at or below 0.40 m, which leaves the gripper 0.30 m of vertical travel above the desk. Put that limit in software from day one.

**Tension at rest (Lesson 3).** In the middle at 0.2 m each line carries 0.95 N. That is what your tension sensors should read when nothing is happening, and a reading of zero on one of them means a slack line.

**Winches (Lesson 5).** A 10 mm spool radius on a NEMA 17 stepper with 0.4 N·m of holding torque pulls 40 N, eight times the limit, which is the margin a stepper wants because its torque falls with speed and a lost step is a silent length error. 0.2 m/s is 191 rpm. At 1/16 microstepping, 3,200 steps per turn, one step is 0.020 mm of line. The longest line, from an anchor to the opposite bottom corner, is 1.12 m, so 1.5 m per spool is enough, and 1.5 m of 0.5 mm line fits in one layer on a 12 mm wide drum, so you never need the pile model.

**Tension sensing (Lessons 5 and 8).** Steppers do not report torque. The simplest honest option is a small load cell under each anchor pulley, read through a load-cell amplifier, which gives you the 5 N trip, the slack-line check and real data for the null-space problem of Lesson 3. The alternative is to use small direct-drive or geared BLDC motors with current sensing, Stringman's route, at more cost and complexity.

**Swing (Lessons 7 and 9).** On a 10 cm pole a stop from 0.2 m/s swings 2.0 cm. A ZV shaper adds 0.317 s to each move and needs no sensor at all, so start there. Add an IMU on the gripper and feedback damping later, and measure the loop delay first: on a desk the whole loop can live on one microcontroller, with no Wi-Fi in it.

## Bill of materials as requirements

Prices and part numbers go out of date; requirements do not. Write the list like this and choose parts that meet each line.

| Qty | Part | Requirement | Check |
|---|---|---|---|
| 1 | Frame | Rigid to under 1 mm at the anchors under 4 × 5 N; square to 2 mm | Lesson 6: in the room example a 5 cm anchor error lifted a straight path by 18.5 cm |
| 4 | Stepper motors | Holding torque ≥ 4 × 5 N × spool radius | 0.4 N·m on a 10 mm spool gives 8× |
| 4 | Stepper drivers | Microstepping ≥ 1/16, current limit set below the motor rating | 0.020 mm per step |
| 4 | Spools | 10 mm radius, ≥ 12 mm wide, flanged, line clamped not tied | One layer for 1.5 m |
| 4 | Pulleys or eyelets at the anchors | Smooth, low friction, line exit point known to 1 mm | Lesson 6 calibrates what is left |
| 4 | Load cells with amplifiers | Range ≥ 2 × 5 N, read at ≥ 50 Hz | Lesson 8: trip within 20 ms |
| 1 | Line | Low stretch braid, rated ≥ 3 × the 5 N limit | 20 N rating passes |
| 1 | Microcontroller | Four step outputs, four load-cell inputs, USB serial to a PC | Lesson 9: keep the fast loops local |
| 1 | Gripper | Hanging mass with payload ≤ 0.2 kg | Lesson 4 map |
| 1 | Power supply and a physical stop switch | Switch cuts motor power, not just the software | Lesson 8: independent layers |
| 1 | Camera (optional) | Fixed above the desk, sees the whole workspace | Lesson 6 calibration, Lesson 10 datasets |

## Build in stages, each ending with a test

1. **One winch on the bench.** Wind line onto the spool with a known weight hanging from it. Test: commanding 1 m of line moves the weight 1 m within 1 mm; the load cell reads the weight within 2 %.
2. **Four winches, open loop.** Mount the motors, hand-measure the anchors, run the IK from Lesson 2. Test: the gripper reaches the centre and four points 10 cm from it.
3. **Calibrate.** Mark a grid on the desk, record line lengths at 20 or more poses spread over the whole volume, and fit anchors and offsets as in Lesson 6. Test: straight lines at two heights stay within 2 mm.
4. **Tensions and the supervisor.** Read all four load cells at 50 Hz, log them, and implement the latching 5 N trip from Lesson 8. Test: pull a line by hand; it trips, stays tripped and lowers the gripper slowly.
5. **Swing.** Time ten swings, set the ZV shaper. Test: residual swing after a full-speed stop under 2 mm.
6. **Software.** A Python API on the PC with a small set of verbs (move, nudge, stop, grasp), all of them cancellable. Test: `stop` from any state brings every motor to rest.
7. **Learning (optional).** Teleoperate, record episodes with timestamps, and train a small policy, starting with one object and one motion, per Lesson 10.

## Code it from scratch

:::code file=desk_build_check.py
```python
import math
import numpy as np

G = 9.81
W, D, H, POLE, LIMIT, MASS = 0.8, 0.6, 0.5, 0.1, 5.0, 0.2       # desk frame, metres, newtons, kg hanging
A = np.array([[-W/2, -D/2, H], [W/2, -D/2, H], [W/2, D/2, H], [-W/2, D/2, H]])

def capacity(p, t_max=LIMIT):
    v = A - p
    U = (v / np.linalg.norm(v, axis=1)[:, None]).T
    tau = U.T @ np.linalg.solve(U @ U.T, [0, 0, G])
    n = np.linalg.svd(U)[2][-1]
    lo = max([-tau[i] / n[i] for i in range(4) if n[i] > 1e-12], default=-np.inf)
    hi = min([-tau[i] / n[i] for i in range(4) if n[i] < -1e-12], default=np.inf)
    if lo > hi:
        return 0.0
    cands = [lo, hi] + [(tau[j] - tau[i]) / (n[i] - n[j]) for i in range(4) for j in range(i + 1, 4) if abs(n[i] - n[j]) > 1e-12]
    return t_max / min(np.max(tau + c * n) for c in cands if lo - 1e-9 <= c <= hi + 1e-9)

def worst_in_layer(z, n=40):
    xs = -W/2 + W * (np.arange(n) + 0.5) / n
    ys = -D/2 + D * (np.arange(n) + 0.5) / n
    return min(capacity(np.array([x, y, z])) for x in xs for y in ys)

# 1. the workspace: where does 0.2 kg fit under a 5 N limit?
print(f"centre capacity: {capacity(np.array([0, 0, 0.1])):.2f} kg with the pivot at 0.1 m, {capacity(np.array([0, 0, 0.4])):.2f} kg at 0.4 m")
for z in (0.25, 0.4, 0.425):
    print(f"  worst point at pivot height {z} m: {worst_in_layer(z):.3f} kg")
assert abs(capacity(np.array([0, 0, 0.1])) - 1.274) < 0.002
assert worst_in_layer(0.4) > MASS > worst_in_layer(0.425)       # keep the pivot at or below 0.40 m

# 2. winch requirements from lessons 5 and 7, checked against a candidate spec
spool_r, holding_torque, microsteps, line_rating = 0.010, 0.40, 200 * 16, 20.0
v_max, line_needed = 0.2, math.dist((-W/2, -D/2, H), (W/2, D/2, 0))
checks = {
    "torque margin over the limit >= 4": holding_torque / spool_r / LIMIT >= 4,
    "speed for 0.2 m/s under 300 rpm": v_max / spool_r * 60 / (2 * math.pi) < 300,
    "resolution under 0.1 mm per microstep": 2 * math.pi * spool_r / microsteps < 1e-4,
    "line rated at least 3x the limit": line_rating >= 3 * LIMIT,
    "1.5 m of line covers the longest diagonal": 1.5 > line_needed,
    "one layer: 1.5 m on a 12 mm drum of 0.5 mm line": 1.5 / (2 * math.pi * spool_r) * 0.5e-3 < 0.012,
}
for k, ok in checks.items():
    print(f"  {'ok ' if ok else 'NO '} {k}")
assert all(checks.values())
assert abs(line_needed - 1.118) < 0.001

# 3. swing on a 10 cm pole
T = 2 * math.pi * math.sqrt(POLE / G)
print(f"swing period {T:.3f} s; a stop from 0.2 m/s swings {0.2 / math.sqrt(G / POLE) * 100:.1f} cm; ZV shaping adds {T / 2:.3f} s")
assert abs(T - 0.634) < 0.001 and abs(0.2 / math.sqrt(G / POLE) - 0.0202) < 0.0001

# 4. tension at rest in the middle: what the load cells should read
v = A - [0, 0, 0.2]; s = 0.3 / np.linalg.norm(v[0])
print(f"each line at rest in the middle: {MASS * G / (4 * s):.2f} N")
assert abs(MASS * G / (4 * s) - 0.953) < 0.002
print("PASS")
```
:::end

## Standing on Stringman

This track uses Neufangled's Stringman as its running example because its makers have published unusually much of it, with real numbers in the code comments. If you build from their work, use it on their terms:

- The [Stringman firmware and controller](https://github.com/nhnifong/cranebot3-firmware) are Apache-2.0. You can study and reuse the code with attribution and the licence notice.
- The hardware designs (CAD, STL files, print guide and BOM) are released under CERN-OHL-W 2.0 with an addendum that the user assumes full responsibility for injury, damage or loss, per Neufangled's [downloads page](https://neufangled.com/docs/downloads/). The CAD is in Onshape. This course does not reproduce any of it.
- The [Stringman PCBs](https://github.com/nhnifong/stringman-pcbs) are published as KiCad projects. GitHub did not detect a licence file in that repository when this lesson was written, so ask the authors before reusing those designs.
- Neufangled states that Stringman is OSHWA certified. If you want a robot that works on the first day, [buy one](https://neufangled.com/) and support the people who did the hard part.

## Exercises

:::exercise
You want 0.3 kg hanging on the desk robot. What changes?
:::solution
At 5 N the worst point in the 0.25 m layer is 0.52 kg, but at 0.4 m it is 0.25 kg, so either lower the top of the workspace until the worst point in the layer is above 0.3 kg (about 0.375 m in the simulator's map) or raise the limit to about 6 N, since capacity scales linearly with the limit. Raising the limit also means re-checking the torque margin and the line rating.
:::end

:::exercise
Why does the BOM ask for a physical stop switch that cuts motor power when the software already has a supervisor?
:::solution
The supervisor runs in the same software that might have failed. A switch that removes motor power works when the microcontroller has crashed, the PC is frozen or a bug has disabled the trip. Lesson 8's rule: keep the safety layers independent.
:::end

## Quiz

:::quiz
- type: num
  q: Capacity at the centre of the desk frame with the pivot at 0.1 m and a 5 N limit (kg)?
  answer: 1.27
  tol: 0.005
  py: "4*5*(0.4/math.sqrt(0.4**2+0.3**2+0.4**2))/9.81"
  explain: 4 T sin θ / g with the lines rising 0.4 m over 0.5 m.
- type: num
  q: Tension in each line at rest in the middle, 0.2 kg hanging, pivot at 0.2 m (N)?
  answer: 0.953
  tol: 0.005
  py: "0.2*9.81/(4*0.3/math.sqrt(0.4**2+0.3**2+0.3**2))"
  explain: m g / (4 sin θ) with sin θ = 0.3/0.583.
- type: num
  q: Longest line needed in the desk frame, anchor to the opposite bottom corner (m)?
  answer: 1.118
  tol: 0.001
  py: "math.sqrt(0.8**2+0.6**2+0.5**2)"
  explain: The space diagonal.
- type: mc
  q: Why write the BOM as requirements instead of part numbers?
  options: ["Requirements stay valid when parts and prices change, and each line can be checked against a lesson", "It is shorter", "Suppliers prefer it", "It avoids licences"]
  answer: 0
  explain: A requirement says why a part was chosen.
- type: mc
  q: Under which licence are Stringman's hardware designs released?
  options: ["CERN-OHL-W 2.0 with a responsibility addendum", "Apache-2.0", "MIT", "They are proprietary"]
  answer: 0
  explain: Per Neufangled's downloads page; the software is Apache-2.0.
- type: mc
  q: What should be the first test of the build?
  options: ["One winch on the bench: commanded length against a measured weight", "Train a policy", "Swing damping with an IMU", "Calibrate all four anchors"]
  answer: 0
  explain: Every later stage depends on the winch.
:::end

:::verify
import math
s = 0.4/math.sqrt(0.4**2+0.3**2+0.4**2)
assert abs(4*5*s/9.81-1.274) < 0.002 and abs(0.4/0.01-40) < 1e-9 and 40/5 == 8
assert abs(0.2/0.01*60/(2*math.pi)-191) < 0.5 and abs(2*math.pi*10/3200-0.020) < 0.001 and abs(math.sqrt(0.8**2+0.6**2+0.5**2)-1.12) < 0.005
assert abs(2*math.pi*math.sqrt(0.1/9.81)-0.634) < 0.0005 and abs(math.pi*math.sqrt(0.1/9.81)-0.317) < 0.0005 and abs(0.2/math.sqrt(9.81/0.1)*100-2.0) < 0.05
assert abs(0.4-0.1-0.3) < 1e-12 and 20 >= 15 and abs(5*0.3/0.25-6) < 1e-9
:::end

## Sources

- Neufangled, [Stringman home page](https://neufangled.com/) (OSHWA certification, published CAD, PCBs and software, 0.4 m/s, 28 N), [downloads and licence](https://neufangled.com/docs/downloads/) (CERN-OHL-W 2.0 with addendum, Onshape CAD, KiCad PCBs).
- Stringman firmware, [nhnifong/cranebot3-firmware](https://github.com/nhnifong/cranebot3-firmware), Apache-2.0; PCBs, [nhnifong/stringman-pcbs](https://github.com/nhnifong/stringman-pcbs) (no licence detected by GitHub on 28 October 2026).
- Lessons 2 to 10 of this track for every number in the sizing.
