---
id: p21-l08
minutes: 40
summary: Stringman's answer to "what if someone walks into a line?" is a 28 N tension limit at which every motor lets go. You work out what that limit does and does not protect, why a sudden push trips it sooner than a steady one, why letting go needs to be a controlled descent, and how to build a supervisor that latches.
---

## Lines in a room with people

An arm can only hit what is inside its reach. A room-scale cable robot strings lines across the space that people live in, at whatever height the gripper happens to be. Most of the time the lines are overhead, but not always: lower the gripper to the floor by a bed and the lines run diagonally across the room at head and chest height.

Neufangled's FAQ gives Stringman's answer in one sentence: when a line reaches a tension limit of 28 N, "about the weight of a backpack", all motors relax and the lines can be pulled loose. The firmware adds a second, independent layer. Any motor that reads more than 40 N switches off its own torque, even with no connection to the controller, and the log message says why: to protect the line. And the power line to the gripper, the one that also carries load, is rated at 50 N tensile strength. Three numbers, each a step above the last:

| Layer | Where it runs | Threshold |
|---|---|---|
| Relax all motors | Motion controller | 28 N on any line |
| Torque off on that motor | Anchor firmware | 40 N |
| Line breaks | Physics | 50 N (power line rating) |

The margin from the relax limit to the line rating is $50/28 = 1.79$. That margin is what protects you from the controller's own delays and from the dynamic peaks below.

## What a tension limit protects

A tension limit is a limit on force, and it acts everywhere along the line. Wherever a line is bent around something, a wrist, a shoulder or a chair back, it presses on it with

$$ F = 2T\sin\varphi , $$

where $\varphi$ is how far the line is deflected on each side. A line at 28 N grazing a body at 5° presses with 4.9 N. Wrapped around it at 90° each side, the most it can ever press with is 56 N, which is why entanglement, not contact, is the case to design for. The limit also caps how hard the gripper can push on anything: the lines cannot deliver more than their tensions allow.

What it does not protect against is worth listing as honestly as what it does:

- **Pinch points at the spools.** A finger caught where the line enters a spool sees the motor's torque, not the line's tension.
- **A falling gripper.** Relaxing motors removes the force holding the gripper up. That is the next section.
- **Anchors pulling out.** The anchors carry the sum of everything. Neufangled's install guide asks for studs or columns, not drywall.
- **Speed.** At 0.4 m/s the gripper of 1.25 kg carries 0.1 J; the limit does nothing about where it is going.

## Sudden loads trip early

Someone who walks into a line or grabs the gripper does not apply a force slowly. A step load on a pendulum overshoots, and the peak is what the lines see. In the code below, a steady 15 N push on a 1.25 kg gripper leans the pole by 51° and loads it with 19.4 N. Apply the same push suddenly to a hanging gripper and the first swing goes to 101°, twice the lean, with 33.6 N on the pole, 1.73 times the steady value.

The simulator below shows the same effect with all four lines and the swing damping on. At its safety pose the lines carry at most 11.7 N at rest; a steady 15 N lean raises the peak to 15.4 N, but the transient when the push is applied reaches 21 N, and any push from about 20 N up trips the 28 N limit in its first swing.

:::figure widget=cablebot args={"preset":"safety"} caption="Relax at the limit. Raise Push on the gripper until a line crosses 28 N: every line goes slack and the gripper is lowered to the floor. Re-arm with the push still applied and it trips again. Turn Relax at the limit off to see the tension the lines would otherwise reach."
:::end

## Letting go gently

"All motors relax" is the right idea and needs one more decision: what happens to the gripper? A fully limp, back-drivable motor lets the weight pull line off its spool, and the gripper falls. From 2.5 m that is 7.0 m/s and 30.7 J at the floor for 1.25 kg. A motor that keeps a few newtons of holding force and pays out at a capped speed lowers it instead: at 0.3 m/s the gripper arrives with 56 mJ, five hundred times less.

The simulator uses that second behaviour. When it trips, it holds 2 N on each line, pays out at no more than 0.3 m/s until the gripper rests on the floor, and stays there. **This is our model, not a description of Stringman.** Neufangled documents that the motors relax and the lines can be pulled loose; we have not found a statement of how fast its gripper descends, so treat this part as a design choice for your own build, and test your version with a payload over something soft before you trust it.

## A supervisor that latches

A safety stop that resets itself when the tension drops will oscillate: trip, sag, recover, pull, trip. The supervisor has to **latch**. Once tripped it stays tripped until someone deliberately re-arms it, and re-arming into the same fault trips it again immediately. Three more rules are worth building in from the start:

- Check every line on every loop. At a 50 Hz loop the worst case is 20 ms to notice, during which the gripper at 0.4 m/s moves 8 mm.
- Keep the layers independent. The controller's limit, the firmware's cut-off and the mechanical strength of the line should not share a failure mode. Stringman's 40 N firmware limit works with the network down.
- Log the reason. "Line 2 at 29.5 N" tells you whether it was a person, a snag or a bad calibration.

ISO/TS 15066, the technical specification for collaborative industrial robots, whose requirements the 2025 edition of ISO 10218 has now integrated, frames safety around limiting the force and pressure a robot can apply to a person's body. A home cable robot is not certified against it, and nothing in this lesson is a compliance claim, but the frame fits: decide which force you are limiting, make sure every failure path ends below it, and measure it.

## Code it from scratch

:::code file=safety.py
```python
import math
import numpy as np

G, M, POLE, LIMIT = 9.81, 1.25, 0.5, 28.0

# 1. the limits stack up: relax at 28 N, firmware cut-off at 40 N, power line rated 50 N
assert 28 < 40 < 50
print(f"28 N is the weight of {28 / G:.2f} kg; the 50 N line has a margin of {50 / 28:.2f} over the relax limit")

# 2. tensions at rest at the lab's safety pose: pivot (0.8, 0.4, 1.4) in the 7 x 7 x 3 m room, 1.25 kg
A = np.array([[-3.5, -3.5, 3], [3.5, -3.5, 3], [3.5, 3.5, 3], [-3.5, 3.5, 3]])
v = A - [0.8, 0.4, 1.4]; U = (v / np.linalg.norm(v, axis=1)[:, None]).T
t = U.T @ np.linalg.solve(U @ U.T, [0, 0, M * G])
print("tensions at rest (N):", t.round(2))
assert np.allclose(t, [8.11, 10.25, 11.74, 8.91], atol=0.006) and t.max() < LIMIT

# 3. a sudden sideways push: the pendulum overshoots, so the pole (and the lines) see more than the static force
def step_push(F, dt=1e-5, t_end=3.0):
    a = w = 0.0; peak = 0.0; amax = 0.0
    for _ in range(int(t_end / dt)):
        w += (-G * math.sin(a) + F / M * math.cos(a)) / POLE * dt
        a += w * dt
        peak = max(peak, M * G * math.cos(a) + F * math.sin(a) + M * POLE * w * w)
        amax = max(amax, a)
    return peak, math.degrees(amax)
peak, amax = step_push(15.0)
static = math.hypot(15.0, M * G)
print(f"15 N push: {static:.1f} N on the pole when steady, {peak:.1f} N at the first swing, {amax:.0f} degrees of swing")
assert abs(static - 19.37) < 0.01 and abs(peak - 33.6) < 0.1 and abs(amax - 101.5) < 0.2

# 4. a line bent around a body by angle phi on each side presses on it with 2 T sin(phi)
for phi in (5, 30, 90):
    print(f"  line at the limit bent {phi} degrees each side presses with {2 * LIMIT * math.sin(math.radians(phi)):.1f} N")
assert abs(2 * LIMIT * math.sin(math.radians(5)) - 4.88) < 0.01

# 5. letting go: free fall from 2.5 m against a controlled 0.3 m/s descent
v_fall = math.sqrt(2 * G * 2.5)
print(f"dropped from 2.5 m: {v_fall:.1f} m/s, {0.5 * M * v_fall**2:.1f} J; lowered at 0.3 m/s: {0.5 * M * 0.09 * 1000:.0f} mJ")
assert abs(v_fall - 7.0) < 0.01 and abs(0.5 * M * v_fall**2 - 30.7) < 0.05

# 6. a latching supervisor: trips on any line over the limit, stays tripped until re-armed,
#    and re-arming into a fault that is still there trips again at once
class Supervisor:
    def __init__(self, limit):
        self.limit, self.relaxed, self.reason = limit, False, ""
    def update(self, tensions):
        if not self.relaxed and max(tensions) > self.limit:
            self.relaxed, self.reason = True, f"line {int(np.argmax(tensions)) + 1} at {max(tensions):.1f} N"
        return self.relaxed
    def rearm(self):
        self.relaxed, self.reason = False, ""

s = Supervisor(LIMIT)
assert not s.update(t)
assert s.update([12, 29.5, 10, 9]) and s.reason == "line 2 at 29.5 N"
assert s.update(t)                       # still relaxed after the overload has gone: latched
s.rearm(); assert not s.update(t)
s.rearm(); assert s.update([30, 10, 10, 10])
# at a 50 Hz loop an overload is seen within 20 ms, during which 0.4 m/s covers 8 mm
assert abs(0.4 * 0.02 - 0.008) < 1e-12
print("PASS")
```
:::end

## In practice

Test the stop the way it will be triggered. Pull a line sideways by hand at mid-span, grab the gripper and yank it, and drive the gripper into a cushion, and check each time that it trips, that it latches, and what the gripper does next. Then put the robot in a state you did not plan for, such as the controller crashed or the network down, and check that the firmware layer still cuts torque. A stop that has only been tested in the simulator has not been tested.

## Exercises

:::exercise
A line at the 28 N limit is wrapped around a forearm and bends by 20° on each side. How hard does it press on the arm, and how much more would a line at the 50 N breaking load press?
:::solution
$2 \times 28 \times \sin 20° = 19.2$ N at the limit, and $2 \times 50 \times \sin 20° = 34.2$ N at the breaking load. The relax limit buys 15 N of margin at this angle, and more importantly it releases the line instead of holding it there.
:::end

:::exercise
Why should a tripped supervisor not re-arm itself once the tension has fallen back below the limit?
:::solution
Because relaxing is what made the tension fall. An automatic re-arm would pull the lines tight again into the same person or snag, trip, relax and repeat, a cycle that can tighten a loop around a limb. A human decision to re-arm, with the fault re-checked at once, breaks that cycle.
:::end

## Quiz

:::quiz
- type: num
  q: What mass has a weight of 28 N (kg)?
  answer: 2.85
  tol: 0.005
  py: "28/9.81"
  explain: m = F / g.
- type: num
  q: Most force a line at 28 N can press on a body it wraps around, bent 90° on each side (N)?
  answer: 56
  tol: 0.001
  py: "2*28*math.sin(math.pi/2)"
  explain: F = 2 T sin φ with φ = 90°.
- type: mc
  q: A 15 N push is applied suddenly to a hanging 1.25 kg gripper. How does the peak pole force compare with the steady value?
  options: ["About 1.7 times higher, because the swing overshoots", "The same", "Half", "Ten times higher"]
  answer: 0
  explain: 33.6 N against 19.4 N in the undamped model.
- type: num
  q: Kinetic energy of a 1.25 kg gripper dropped from 2.5 m when it reaches the floor (J)?
  answer: 30.7
  tol: 0.005
  py: "1.25*9.81*2.5"
  explain: m g h.
- type: mc
  q: Which of these does a 28 N line-tension limit NOT protect against?
  options: ["A finger pinched at a spool", "A line bent around a wrist", "The gripper pushing hard on a person", "A line snapping from overload"]
  answer: 0
  explain: At the spool the force comes from the motor torque directly.
- type: mc
  q: Why must the safety supervisor latch?
  options: ["Otherwise it re-tightens into the same fault as soon as relaxing lowers the tension", "To save power", "Because sensors are noisy", "To keep the calibration"]
  answer: 0
  explain: An unlatched stop oscillates between trip and recovery.
:::end

:::verify
import math
assert abs(28/9.81-2.85) < 0.005 and abs(50/28-1.79) < 0.005 and abs(2*28*math.sin(math.radians(5))-4.9) < 0.05
assert abs(0.5*1.25*0.4**2-0.1) < 1e-9 and abs(math.sqrt(2*9.81*2.5)-7.0) < 0.01 and abs(0.5*1.25*0.09-0.056) < 0.0005
assert abs(1.25*9.81*2.5/(0.5*1.25*0.09)-545) < 1 and abs(33.6/19.37-1.73) < 0.005 and abs(math.degrees(math.atan(15/12.2625))-51) < 0.5
assert abs(2*28*math.sin(math.radians(20))-19.2) < 0.05 and abs(2*50*math.sin(math.radians(20))-34.2) < 0.05 and abs(34.2-19.2-15) < 1e-9
assert abs(0.4*0.02*1000-8) < 1e-9
:::end

## Sources

- Neufangled, [Stringman home page and FAQ](https://neufangled.com/) (28 N limit at which all motors relax and lines can be pulled loose, 50 N power line, anchors on studs or columns, 0.4 m/s).
- Stringman firmware, Apache-2.0: [`spool_dm.py`](https://github.com/nhnifong/cranebot3-firmware/blob/e1ee31d8c5c227c46082e58719cd7fc3a7026cdf/src/nf_robot/robot/spool_dm.py) at commit e1ee31d (40 N limit that disables motor torque even without a controller connection).
- ISO, [ISO/TS 15066:2016 Robots and robotic devices — Collaborative robots](https://www.iso.org/standard/62996.html).
- ["Evolution of Safety Requirements in Industrial Robotics: Comparative Analysis of ISO 10218-1/2 (2011 vs. 2025) and Integration of ISO/TS 15066"](https://arxiv.org/abs/2602.17822), arXiv:2602.17822.
