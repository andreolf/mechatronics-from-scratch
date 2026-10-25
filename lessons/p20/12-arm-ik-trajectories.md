---
id: p20-l12
minutes: 45
summary: The arm now has to move. You solve its inverse kinematics in closed form, plan a pick-and-place through six waypoints with quintic joint trajectories timed to the velocity and acceleration limits, and prove that every waypoint is reached within 1 mm including the encoders' resolution.
---

## Closed-form IK

For a yaw–shoulder–elbow arm, the yaw angle is $\psi = \operatorname{atan2}(y, x)$, and the rest is the planar two-link problem of Phase 15 in the $(r, z)$ plane with $r = \sqrt{x^2 + y^2}$:

$$\cos q_3 = \frac{r^2 + (z - h)^2 - \ell_2^2 - \ell_3^2}{2\ell_2\ell_3},\quad q_2 = \operatorname{atan2}(z - h, r) - \operatorname{atan2}(\ell_3\sin q_3, \ell_2 + \ell_3\cos q_3).$$

The sign of $q_3$ picks elbow up or down; $|\cos q_3| > 1$ means the target is out of reach and must be rejected, not clipped.

## Quintic timing

A rest-to-rest quintic $q(s) = q_0 + \Delta q\,(10s^3 - 15s^4 + 6s^5)$, $s = t/T$, starts and ends with zero velocity and acceleration, so the gripper does not jerk the part. Its peaks are $\dot q_{max} = \frac{15}{8}\frac{\Delta q}{T}$ and $\ddot q_{max} = \frac{10}{\sqrt3}\frac{\Delta q}{T^2}$, so the shortest segment time that respects both limits is the larger of $\frac{15\Delta q}{8 v_{max}}$ and $\sqrt{\frac{10\Delta q}{\sqrt3\, a_{max}}}$.

:::figure widget=pickplace caption="The arm moving through a pick-and-place, seen from the side. Move the pick and place points; the readout gives segment times, peak speed and acceleration, and the tip error."
:::end

## Worked example

Lesson 11 arm, 3 rad/s and 3 rad/s² limits, 12-bit encoders, pick at (0.30, −0.10, 0.02) m, place at (0.05, 0.32, 0.12) m, approach 6 cm above each:

1. IK round trip on random poses: 3356 solutions, all reproduce the target to $10^{-9}$ m.
2. Six waypoints, five segments: 0.63, 0.63, 1.83, 0.55 and 0.55 s, 4.19 s in total. The long transfer is limited by acceleration.
3. Peak joint speed 1.782 rad/s, peak acceleration 3.000 rad/s²: exactly at the limit that set the time.
4. Tip error at the waypoints with encoder quantisation: worst 0.307 mm, inside the 0.844 mm bound from half a count on each joint and well within the 1 mm specification.
5. Targets out of reach (0.6 m away, or on the base axis) are rejected.

## Code it from scratch

:::code file=pick_and_place.py
```python
import numpy as np

H, L2, L3 = 0.10, 0.25, 0.20                       # the Lesson 11 arm
LIM = np.radians([180, 90, 149])                   # joint limits (yaw, shoulder, elbow)
VMAX, AMAX = 3.0, 3.0                              # rad/s from the URDF, rad/s^2 from the motor sizing
CPR = 4096                                         # 12-bit absolute encoders on each joint

def fk(q):
    r = L2 * np.cos(q[1]) + L3 * np.cos(q[1] + q[2]); z = H + L2 * np.sin(q[1]) + L3 * np.sin(q[1] + q[2])
    return np.array([r * np.cos(q[0]), r * np.sin(q[0]), z])

def ik(p, elbow_up=True):
    """closed form: yaw from atan2, then the planar two-link problem in the (r, z) plane"""
    yaw = np.arctan2(p[1], p[0]); r = np.hypot(p[0], p[1]); z = p[2] - H
    c3 = (r * r + z * z - L2**2 - L3**2) / (2 * L2 * L3)
    if abs(c3) > 1: raise ValueError("out of reach")
    q3 = -np.arccos(c3) if elbow_up else np.arccos(c3)
    q2 = np.arctan2(z, r) - np.arctan2(L3 * np.sin(q3), L2 + L3 * np.cos(q3))
    q = np.array([yaw, q2, q3])
    if np.any(np.abs(q) > LIM): raise ValueError("joint limit")
    return q

def quintic(q0, q1, T, t):
    """rest-to-rest: zero velocity and acceleration at both ends"""
    s = np.clip(t / T, 0, 1); return q0 + (q1 - q0) * (10 * s**3 - 15 * s**4 + 6 * s**5)

def segment_time(q0, q1):
    """shortest T meeting both limits: peak velocity 15/8 dq/T, peak acceleration 10/sqrt(3) dq/T^2"""
    dq = np.abs(q1 - q0).max(); return max(15 / 8 * dq / VMAX, np.sqrt(10 / np.sqrt(3) * dq / AMAX), 0.2)

def pick_and_place(pick, place, lift=0.06):
    way = [pick + [0, 0, lift], pick, pick + [0, 0, lift], place + [0, 0, lift], place, place + [0, 0, lift]]
    qs = [ik(np.array(w)) for w in way]; segs = []
    for a, b in zip(qs[:-1], qs[1:]): segs.append((a, b, segment_time(a, b)))
    return way, qs, segs

def quantise(q): return np.round(q / (2 * np.pi / CPR)) * (2 * np.pi / CPR)

def test_ik_round_trip():
    rng = np.random.default_rng(3); n = 0
    for _ in range(2000):
        q = rng.uniform(-1, 1, 3) * np.array([3, 1.4, 2.4])
        p = fk(q)
        for up in (True, False):
            try: assert np.allclose(fk(ik(p, up)), p, atol=1e-9); n += 1
            except ValueError: pass
    print(f"IK round trip: {n} solutions, all reproduce the target to 1e-9 m")

def test_pick_and_place():
    pick, place = np.array([0.30, -0.10, 0.02]), np.array([0.05, 0.32, 0.12])
    way, qs, segs = pick_and_place(pick, place); total = sum(s[2] for s in segs)
    print(f"6 waypoints, 5 segments, total {total:.2f} s; segment times", [round(float(s[2]), 2) for s in segs])
    worst_v = worst_a = 0; dt = 1e-3; worst_tip = 0
    for (a, b, T), target in zip(segs, way[1:]):
        t = np.arange(0, T + dt, dt); q = np.array([quintic(a, b, T, tk) for tk in t])
        v = np.gradient(q, dt, axis=0); acc = np.gradient(v, dt, axis=0)
        worst_v = max(worst_v, np.abs(v).max()); worst_a = max(worst_a, np.abs(acc[2:-2]).max())
        tip = np.linalg.norm(fk(quantise(q[-1])) - target); worst_tip = max(worst_tip, tip)
    print(f"peak joint speed {worst_v:.3f} rad/s (limit {VMAX}), peak acceleration {worst_a:.3f} rad/s^2 (limit {AMAX})")
    print(f"tip error at every waypoint with {CPR}-count encoders: worst {1000 * worst_tip:.3f} mm")
    bound = 2 * np.pi / CPR / 2 * (2 * (L2 + L3) + L3)   # half a count on each joint, times its lever arm
    print(f"encoder bound: {1000 * bound:.3f} mm")
    assert worst_v <= VMAX * 1.001 and worst_a <= AMAX * 1.01 and worst_tip < 1e-3 and worst_tip <= bound

def test_unreachable():
    for p in ([0.6, 0, 0.1], [0.0, 0.0, 0.1]):
        try: ik(np.array(p)); ok = False
        except ValueError as e: ok = True; print(f"target {p}: rejected ({e})")
        assert ok

test_ik_round_trip(); test_pick_and_place(); test_unreachable(); print("PASS")
```
:::end

## In practice

MoveIt 2 plans collision-free paths with sampling planners, solves IK with KDL or TRAC-IK (or IKFast for closed forms like this one), and times trajectories with TOTG or Ruckig against the URDF's limits. The site's [arm lab](#lab-arm) lets you drag a target and watch the IK follow. On the real arm, the 1 mm also depends on link stiffness and calibration, so measure it with a dial gauge or camera.

## Exercises

:::exercise
A joint moves 1.2 rad. What is the shortest quintic segment with 3 rad/s and 3 rad/s²?
:::solution
Velocity: $15 \times 1.2 / (8 \times 3) = 0.75$ s. Acceleration: $\sqrt{10 \times 1.2 / (1.732 \times 3)} = 1.52$ s. The acceleration limit sets $T = 1.52$ s.
:::end

:::exercise
Why reject an unreachable target instead of moving to the nearest point?
:::solution
A silent clip leaves the gripper somewhere the planner did not expect, perhaps above or inside something. Rejecting it makes the higher-level task handle the error explicitly.
:::end

## Quiz

:::quiz
- type: num
  q: Peak speed of a quintic with Δq 1 rad over 1 s (rad/s)?
  answer: 1.875
  tol: 0.005
  py: "15/8"
  explain: 15Δq/(8T).
- type: num
  q: Peak acceleration of a quintic with Δq 1 rad over 1 s (rad/s²)?
  answer: 5.774
  tol: 0.005
  py: "10/math.sqrt(3)"
  explain: 10Δq/(√3 T²).
- type: num
  q: Half a count of a 4096-count encoder (mrad)?
  answer: 0.767
  tol: 0.005
  py: "1000*math.pi/4096"
  explain: π/4096 rad.
- type: num
  q: Elbow cosine for r 0.3, z − h 0.2, links 0.25 and 0.20?
  answer: 0.275
  tol: 0.005
  py: "(0.3**2+0.2**2-0.25**2-0.2**2)/(2*0.25*0.2)"
  explain: Law of cosines.
- type: mc
  q: Why use quintic rather than cubic segments?
  options: ["Zero acceleration at both ends, so no jerk at start and stop", "They are faster", "They need no IK", "They avoid joint limits automatically"]
  answer: 0
  explain: Cubics jump in acceleration at the ends.
- type: mc
  q: What does |cos q₃| > 1 mean?
  options: ["The target is out of reach", "Elbow up is required", "A joint limit is hit", "The Jacobian is singular"]
  answer: 0
  explain: No triangle exists with those sides.
:::end
