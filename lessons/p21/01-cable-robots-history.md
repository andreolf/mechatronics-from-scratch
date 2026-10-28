---
id: p21-l01
minutes: 35
summary: What a cable-driven parallel robot is, told through the machines that made the idea real, from Garrett Brown's Skycam patent and NIST's RoboCrane to Spidercam, the FAST radio telescope and Neufangled's $795 Stringman. You count what four cables can and cannot hold, and check a vendor's workspace-per-dollar claim with your own arithmetic.
---

## A robot made of string

A serial arm is a chain: motor, link, motor, link. Each motor carries the ones after it, so the arm gets heavy and short. A cable-driven parallel robot (CDPR) turns that around. The motors sit still on the walls or a frame, each winds a cable on a spool, and all the cables pull on the same platform at once. Cables weigh almost nothing per metre, so the platform can be large and the reach can be a whole room, a stadium or a valley.

The price is that a cable can only pull. Push on a cable and it goes slack. Everything in this track comes back to that one fact: where you can go, how much you can lift, how you share the load between motors, and how a machine made of string can be safe around people.

This phase is a build-along. By the end you will have derived and simulated a four-cable robot of the kind Neufangled Robotics sells as [Stringman](https://neufangled.com/), and planned a desk-sized one you can build. Stringman is the inspiration because it is open: its control software is on GitHub under Apache-2.0 and its CAD, STLs, PCBs and BOM are published under CERN-OHL-W-2.0. We use it as a reference point and link to it; the derivations, code and design here are our own.

## Where cable robots came from

**Skycam (1980s).** Garrett W. Brown filed US patent 4,625,938 in October 1983; it was granted in December 1986. The preferred embodiment is the layout every flying sports camera still uses: four computer-controlled cable drums, cables run through pulleys on four high, wide-apart points, all meeting at a camera assembly that can move along any horizontal or vertical path inside them. The camera hangs from a gimbal so that the cables move it without twisting the picture.

**NIST RoboCrane (from the mid-1980s).** At the US National Institute of Standards and Technology, James Albus proposed using cables as the legs of a Stewart platform and winches as its actuators. Six cables hold a platform by three points, which fixes its full six-degree-of-freedom pose instead of letting it swing like a crane hook. The 1989 final report describes a full-size model whose six wire ropes held about 19,000 lb from about 29 ft. NIST later built a fold-up prototype called the Spider, and the technology was licensed to PaR Systems, whose cable robots NIST says have worked at the Chernobyl and Fukushima cleanup sites.

**Spidercam (2000s).** Jens C. Peters started the Austrian company behind Spidercam in 2000; the first successful test was in an event hall in Carinthia in 2003 and the first TV production in 2004. At the 2010 US Open in New York, the system was anchored at four points on the stadium roof, each with a motorised winch feeding Kevlar cable through a pulley, and was flown by a three-person crew.

**FAST.** China's 500 m radio telescope hangs its 30-tonne feed cabin from six steel cables, a cable robot spanning up to 600 m. The cable robot moves the cabin over a focal surface about 140 m above the ground; the operators describe it as the largest cable-driven parallel robot in the world.

**Research and industry.** Fraunhofer IPA's IPAnema 3 demonstrator has a 16 × 11 × 6 m workspace, speeds up to 10 m/s depending on configuration and payloads above 250 kg, and has been used for additive and subtractive manufacturing. Andreas Pott's book *Cable-Driven Parallel Robots: Theory and Application* (Springer, 2018) collects the theory this track leans on.

**Stringman (2020s).** Four lines from anchors near the ceiling corners of a room meet at a small gantry; the gripper hangs on a pole 50 cm below that pivot so it can reach the floor beside beds and tables. Neufangled lists a payload of up to 2 kg near the floor and 1.25 kg on average in a 7 × 7 × 3 m room at rated motor torque, a traverse speed of about 0.4 m/s, and a 28 N tension limit at which all motors relax so a person caught in a line can pull it loose. The software has a Python API, an MCP server for AI agents, LeRobot integration and a MuJoCo simulator.

## What four cables can hold

A point in space has three degrees of freedom. A cable gives one equation, a tension along its own direction, and the tension can only be positive. To hold a point against a force from **any** direction you need the cable directions to surround it, which takes at least four cables: with three, there is always a direction in which no positive combination can push back.

A suspended robot gets help from gravity, which always pulls down. Gravity acts like a fifth cable that never goes slack, so three cables above the load can already hold a point. Stringman has four, one more than the minimum. That spare cable is a choice, not a waste: it means there is a whole family of tensions that hold the gripper still, and the controller can pick the one it likes best. That is Lesson 3.

What four cables to one point cannot do is fix the platform's orientation. All four lines meet at a single pivot, so the gantry is free to rotate about it, and the pole and gripper hang below it as a pendulum. RoboCrane used six cables to three points precisely to stop that. Stringman accepts the pendulum, adds a wrist motor for rotation, and cancels the swing in software (Lesson 7).

:::figure widget=cablebot args={"preset":"room"} caption="Lab 05, the cable robot. Four lines from the top corners hold the pivot; the gripper hangs 0.5 m below it. Line colours follow tension: dim when light, lime under load, amber near the limit and coral when a line is slack or over the limit. Try Auto tour, then drag the target into a top corner."
:::end

## Worked example: check the brochure

Neufangled compares Stringman's work volume per dollar with a research arm. Redo it:

1. Room: $7 \times 7 \times 3 = 147\ \text{m}^3$.
2. Arm: a 0.75 m hemisphere, $\tfrac{2}{3}\pi (0.75)^3 = 0.884\ \text{m}^3$.
3. Per \$1,000: $147 / 0.795 = 184.9\ \text{m}^3$ for Stringman at \$795, and $0.884 / 2.5 = 0.353\ \text{m}^3$ for a \$2,500 arm.
4. Ratio: $184.9 / 0.353 = 523$. Neufangled says "roughly 500×", which holds up.

The other number worth a feel is the safety limit. 28 N is the weight of $28 / 9.81 = 2.85$ kg, about a school backpack, which is how Neufangled describes it.

And a first piece of geometry: with the pivot at the centre of that room at 1.5 m, each line runs $\sqrt{3.5^2 + 3.5^2 + 1.5^2} = 5.172$ m to its corner.

## Code it from scratch

:::code file=cdpr_model.py
```python
import numpy as np

# A room-scale CDPR: anchors at the top corners of a W x D x H room, one pivot, a gripper on a pole below it.
W, D, H = 7.0, 7.0, 3.0          # metres (Neufangled's example room)
POLE = 0.5                       # gripper hangs 0.5 m below the pivot
anchors = np.array([[-W/2, -D/2, H], [W/2, -D/2, H], [W/2, D/2, H], [-W/2, D/2, H]])

def lengths(pivot):
    return np.linalg.norm(anchors - pivot, axis=1)

gripper = np.array([0.0, 0.0, 1.0])
pivot = gripper + [0, 0, POLE]
L = lengths(pivot)
print("line lengths at the centre:", np.round(L, 3))
assert np.allclose(L, np.sqrt(3.5**2 + 3.5**2 + 1.5**2))

# degrees of freedom and redundancy
dof, cables = 3, len(anchors)
print(f"{cables} cables for {dof} DOF: redundancy {cables - dof}")
assert cables - dof == 1

# can positive tensions hold the weight? only if 'straight up' lies inside the cone of the cable directions
u = (anchors - pivot) / L[:, None]
t, *_ = np.linalg.lstsq(u.T, np.array([0, 0, 9.81]), rcond=None)   # minimum-norm solution of U t = m g z
assert np.all(t > 0) and np.allclose(u.T @ t, [0, 0, 9.81])
print("tensions holding 1 kg at the centre (N):", np.round(t, 3))

# the brochure check
room = W * D * H
arm = 2 / 3 * np.pi * 0.75**3
per_k_room, per_k_arm = room / 0.795, arm / 2.5
print(f"volume per $1000: room {per_k_room:.1f} m^3, arm {per_k_arm:.3f} m^3, ratio {per_k_room / per_k_arm:.0f}")
assert round(per_k_room) == 185 and abs(per_k_arm - 0.35) < 0.01 and 480 < per_k_room / per_k_arm < 560
print(f"28 N is the weight of {28 / 9.81:.2f} kg")
print("PASS")
```
:::end

## In practice

When you read a cable-robot spec, ask three questions. Which way can the platform be pushed before a cable goes slack? How does the payload change across the workspace? What happens when a person walks into a line? The rest of this phase answers them for a four-cable suspended robot, with a simulator you can break and code you can run.

## Exercises

:::exercise
Spidercam and Skycam fly over a pitch where nothing may ever be under a slack cable. Why do they use four winches rather than three, given that gravity already helps?
:::solution
Three cables plus gravity can hold the camera, but there is no spare: the tensions are fixed by the position, and near the edges one of them becomes tiny, so a gust or a fast stop can slacken it. A fourth cable adds a redundant direction, so the controller can keep every cable tight with margin, and the footprint becomes a rectangle that matches the pitch.
:::end

:::exercise
Redo the brochure check for a 4 × 3.5 × 2.5 m bedroom. How many times more volume per dollar than the arm does Stringman give now?
:::solution
The room is $35\ \text{m}^3$, or $35/0.795 = 44.0\ \text{m}^3$ per \$1,000. Against the arm's 0.353, that is about 125 times. The advantage shrinks with the room, but it is still two orders of magnitude.
:::end

## Quiz

:::quiz
- type: mc
  q: What is the one thing a cable cannot do?
  options: ["Push", "Pull", "Change length", "Carry a signal"]
  answer: 0
  explain: A cable in compression goes slack. Every design choice in a CDPR follows from that.
- type: mc
  q: How many cables must surround a point to hold it against a force from any direction, with no gravity to help?
  options: ["4", "3", "2", "6"]
  answer: 0
  explain: n + 1 for n degrees of freedom. With three, some direction cannot be resisted with positive tensions.
- type: mc
  q: Why can Stringman hold its gripper with four cables even though they all meet at one point?
  options: ["Gravity always pulls down, acting like an extra cable that never goes slack", "The pole is stiff", "The motors push as well as pull", "The anchors are at different heights"]
  answer: 0
  explain: A suspended robot uses its own weight as the restoring force.
- type: num
  q: Stringman's work volume per $1,000 for a 7 × 7 × 3 m room at $795 (m³)?
  answer: 184.9
  tol: 0.002
  py: "7*7*3/0.795"
  explain: 147 m³ divided by 0.795.
- type: num
  q: Volume of a 0.75 m hemisphere (m³)?
  answer: 0.8836
  tol: 0.002
  py: "2/3*math.pi*0.75**3"
  explain: Half of (4/3)πr³.
- type: num
  q: What mass weighs 28 N (kg)?
  answer: 2.854
  tol: 0.002
  py: "28/9.81"
  explain: m = F/g.
- type: mc
  q: What did NIST's RoboCrane gain by using six cables to three points instead of one hook?
  options: ["Control of the platform's full pose, so it no longer swings or twists freely", "A higher top speed", "Cheaper winches", "Fewer cables to inspect"]
  answer: 0
  explain: A single-point crane resists swing and twist poorly; six cables fix all six degrees of freedom.
:::end

:::verify
import math
assert 7*7*3 == 147
assert abs(2/3*math.pi*0.75**3 - 0.884) < 5e-4
assert abs(147/0.795 - 184.9) < 0.05 and abs(0.8836/2.5 - 0.353) < 5e-4
assert round((147/0.795)/(2/3*math.pi*0.75**3/2.5)) == 523
assert abs(28/9.81 - 2.85) < 0.005
assert abs(math.sqrt(3.5**2+3.5**2+1.5**2) - 5.172) < 5e-4
assert abs(4*3.5*2.5 - 35) < 1e-12 and abs(35/0.795 - 44.0) < 0.05 and round((35/0.795)/(2/3*math.pi*0.75**3/2.5)) == 125
:::end

## Sources

- Neufangled Robotics, [Stringman product page and tech specs](https://neufangled.com/) (price, payload, speed, 28 N relax, pole, compute, volume-per-dollar table) and [store listing](https://neufangled.com/stringman).
- Stringman control software, [nhnifong/cranebot3-firmware](https://github.com/nhnifong/cranebot3-firmware) (Apache-2.0), including the [MuJoCo simulator](https://github.com/nhnifong/cranebot3-firmware/tree/main/simulator) and the [MCP bridge guide](https://github.com/nhnifong/cranebot3-firmware/blob/main/src/nf_robot/host/mcp_bridge/GUIDE.md); hardware files and the CERN-OHL-W-2.0 licence on [Neufangled's downloads page](https://neufangled.com/docs/downloads/).
- G. W. Brown, [US patent 4,625,938](https://patents.google.com/patent/US4625938A/en), *Suspension system for supporting and conveying equipment, such as a camera*, filed 1983, granted 1986.
- NIST, [RoboCrane programme](https://www.nist.gov/programs-projects/robocrane); N. Dagalakis, [*Creating and commercializing the NIST RoboCrane*](https://www.nist.gov/blogs/taking-measure/creating-and-commercializing-nist-robocrane); Dagalakis, Albus et al., [*Robot Crane Technology (Final Report)*](https://www.nist.gov/publications/robot-crane-technology-final-report), NIST TN 1267, 1989.
- [Spidercam history](https://en.wikipedia.org/wiki/Spidercam); Sports Video Group, [*Aerial camera systems drive spectator eyes skyward at US Open*](https://www.sportsvideo.org/2010/09/01/aerial-camera-systems-drive-spectator-eyes-skyward-at-us-open/), 2010.
- Chinese Academy of Sciences, [FAST cable robot](https://lssf.cas.cn/en/facilities/sa/fast/equipment/202505/t20250528_5070731.html).
- Fraunhofer IPA, [Cable-driven parallel robots and IPAnema 3](https://www.ipa.fraunhofer.de/en/current-research/robot-and-assistive-systems/intralogistics-and-material-flow/cable-driven-parallel-robot.html).
- A. Pott, [*Cable-Driven Parallel Robots: Theory and Application*](https://doi.org/10.1007/978-3-319-76138-1), Springer, 2018.
