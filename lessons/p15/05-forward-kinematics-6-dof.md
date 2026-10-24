---
id: p15-l05
minutes: 40
summary: An industrial arm has six joints so that it can put its tool at any position with any orientation, and most designs end in a spherical wrist whose three axes meet at one point. You derive the wrist decomposition, model an illustrative 6-axis arm both as a URDF file and as a product of exponentials, and test that the two forward kinematics agree and that the wrist joints never move the wrist centre.
---

## Six joints for six numbers

A tool pose has 6 degrees of freedom (lesson 01): 3 for position, 3 for orientation. So a general-purpose arm needs at least 6 joints. The classic layout is a 3-joint arm (base yaw, shoulder, elbow) that carries a **spherical wrist**: three revolute joints whose axes all pass through one point, the **wrist centre**.

## The wrist decomposition

Because the wrist axes meet at one point, turning them rotates the tool about the wrist centre but never moves it. If the tool flange sits a distance $d$ beyond the centre along the tool's $x$ axis, then

$$p_w = p - d\,R\,\hat x.$$

$p_w$ depends only on $q_1, q_2, q_3$, and it is exactly the tip of the lesson 03 arm. Position is set by the arm and orientation by the wrist. This splits the 6-joint problem in two, and it is why lesson 06's closed-form inverse kinematics is possible for such arms.

## Two descriptions of one robot

A **URDF** (Unified Robot Description Format) file is the ROS-standard description: a tree of links joined by joints, each joint with a fixed origin transform from its parent, given as `xyz` and `rpy`, and an axis. Forward kinematics walks the tree: for each joint apply the origin, then the rotation about the axis. Libraries such as Pinocchio and the Robotics Toolbox load exactly these files.

The illustrative arm here: shoulder 0.4 m up, upper arm 0.5 m, forearm 0.4 m to the wrist centre, and the tool flange 0.1 m beyond it. At home it lies along $x$ at height 0.4 m. Its screw axes come straight off that home drawing: base $z$; shoulder, elbow and wrist pitch along $-y$; forearm roll and tool roll along $x$ through the wrist centre $(0.9, 0, 0.4)$. And $M$ is a pure translation to $(1.0, 0, 0.4)$.

:::figure widget=arm6 caption="The illustrative 6-axis arm with its tool frame. Move the first three joints and the wrist centre (white dot) moves; move the last three and the tool turns about the centre, which stays put."
:::end

## Worked example

At $q = (30°, 45°, -60°, 20°, 50°, -30°)$:

1. The first three joints put the wrist centre at $(0.6408, 0.3700, 0.6500)$ m, the lesson 03 answer.
2. The full chain puts the tool flange at $(0.7238, 0.3876, 0.7029)$ m, with the tool $x$ axis along $(0.830, 0.177, 0.529)$.
3. Check the decomposition: $p - 0.1\,\hat x = (0.7238 - 0.0830,\; 0.3876 - 0.0177,\; 0.7029 - 0.0529) = (0.6408, 0.3699, 0.6500)$ m, matching to rounding.

## Code it from scratch

:::code file=fk6.py
```python
import numpy as np
import xml.etree.ElementTree as ET

def skew(w): return np.array([[0, -w[2], w[1]], [w[2], 0, -w[0]], [-w[1], w[0], 0]])
def rot(axis, th):
    W = skew(np.asarray(axis, float) / np.linalg.norm(axis)); return np.eye(3) + np.sin(th) * W + (1 - np.cos(th)) * W @ W
def exp_screw(S, th):
    w, v = np.asarray(S[:3], float), np.asarray(S[3:], float); W = skew(w); T = np.eye(4)
    T[:3, :3] = rot(w, th); T[:3, 3] = (np.eye(3) * th + (1 - np.cos(th)) * W + (th - np.sin(th)) * W @ W) @ v; return T
def screw(axis, point): w = np.asarray(axis, float); return np.concatenate([w, -np.cross(w, point)])

# an illustrative 6-axis arm with a spherical wrist, described the way a URDF file does it
URDF = """<robot name="arm6">
  <link name="base"/><link name="l1"/><link name="l2"/><link name="l3"/><link name="l4"/><link name="l5"/><link name="l6"/><link name="tool"/>
  <joint name="j1" type="revolute"><parent link="base"/><child link="l1"/><origin xyz="0 0 0" rpy="0 0 0"/><axis xyz="0 0 1"/></joint>
  <joint name="j2" type="revolute"><parent link="l1"/><child link="l2"/><origin xyz="0 0 0.4" rpy="0 0 0"/><axis xyz="0 -1 0"/></joint>
  <joint name="j3" type="revolute"><parent link="l2"/><child link="l3"/><origin xyz="0.5 0 0" rpy="0 0 0"/><axis xyz="0 -1 0"/></joint>
  <joint name="j4" type="revolute"><parent link="l3"/><child link="l4"/><origin xyz="0 0 0" rpy="0 0 0"/><axis xyz="1 0 0"/></joint>
  <joint name="j5" type="revolute"><parent link="l4"/><child link="l5"/><origin xyz="0.4 0 0" rpy="0 0 0"/><axis xyz="0 -1 0"/></joint>
  <joint name="j6" type="revolute"><parent link="l5"/><child link="l6"/><origin xyz="0 0 0" rpy="0 0 0"/><axis xyz="1 0 0"/></joint>
  <joint name="flange" type="fixed"><parent link="l6"/><child link="tool"/><origin xyz="0.1 0 0" rpy="0 0 0"/></joint>
</robot>"""

def rpy_matrix(r, p, y):   # URDF convention: R = Rz(yaw) Ry(pitch) Rx(roll)
    return rot([0, 0, 1], y) @ rot([0, 1, 0], p) @ rot([1, 0, 0], r)

def fk_urdf(q, urdf=URDF):
    """walk the joint list: fixed origin transform, then rotation about the joint axis"""
    T = np.eye(4); i = 0
    for j in ET.fromstring(urdf).findall("joint"):
        o = j.find("origin"); xyz = [float(v) for v in o.get("xyz").split()]; rpy = [float(v) for v in o.get("rpy").split()]
        F = np.eye(4); F[:3, :3] = rpy_matrix(*rpy); F[:3, 3] = xyz; T = T @ F
        if j.get("type") == "revolute":
            R = np.eye(4); R[:3, :3] = rot([float(v) for v in j.find("axis").get("xyz").split()], q[i]); T = T @ R; i += 1
    return T

# product of exponentials, axes read off the home drawing (arm stretched along x at 0.4 m)
S_LIST = [screw([0, 0, 1], [0, 0, 0]), screw([0, -1, 0], [0, 0, 0.4]), screw([0, -1, 0], [0.5, 0, 0.4]),
          screw([1, 0, 0], [0.5, 0, 0.4]), screw([0, -1, 0], [0.9, 0, 0.4]), screw([1, 0, 0], [0.9, 0, 0.4])]
M = np.eye(4); M[:3, 3] = [1.0, 0, 0.4]
D_TOOL = 0.1

def fk_poe(q):
    T = np.eye(4)
    for S, qi in zip(S_LIST, q): T = T @ exp_screw(S, qi)
    return T @ M

def wrist_centre(T): return T[:3, 3] - D_TOOL * T[:3, 0]        # step back along the tool axis

def arm3_position(q1, q2, q3, d1=0.4, a2=0.5, a3=0.4):           # lesson 03's closed form
    r = a2 * np.cos(q2) + a3 * np.cos(q2 + q3)
    return np.array([r * np.cos(q1), r * np.sin(q1), d1 + a2 * np.sin(q2) + a3 * np.sin(q2 + q3)])

def test_poe_matches_urdf():
    rng = np.random.default_rng(6)
    for q in rng.uniform(-np.pi, np.pi, (300, 6)):
        assert np.allclose(fk_poe(q), fk_urdf(q), atol=1e-12)
    assert np.allclose(fk_urdf(np.zeros(6)), M)

def test_spherical_wrist_decouples():
    rng = np.random.default_rng(7)
    for _ in range(100):
        q = rng.uniform(-np.pi, np.pi, 6); q2 = q.copy(); q2[3:] = rng.uniform(-np.pi, np.pi, 3)
        pw = wrist_centre(fk_poe(q))
        assert np.allclose(pw, wrist_centre(fk_poe(q2)))           # the wrist joints don't move the centre
        assert np.allclose(pw, arm3_position(*q[:3]))               # it is the 3-joint arm's tip
    q = np.radians([30, 45, -60, 20, 50, -30])
    T = fk_poe(q)
    print("tool position:", np.round(T[:3, 3], 4), " tool x axis:", np.round(T[:3, 0], 4))
    print("wrist centre:", np.round(wrist_centre(T), 4))

test_poe_matches_urdf()
test_spherical_wrist_decouples()
print("PASS")
```
:::end

## Exercises

:::exercise
Why do real wrists usually need joint 5 to avoid $0°$?
:::solution
At $q_5 = 0$ the axes of joints 4 and 6 line up, so turning one is the same as turning the other: the wrist has lost a degree of freedom (a wrist singularity). Near it, small tool rotations demand huge, opposite speeds at joints 4 and 6.
:::end

:::exercise
A URDF joint has `rpy="1.5708 0 0"`. What does that do?
:::solution
It rotates the child frame by 90° about the parent's $x$ axis before the joint moves. A joint with `axis xyz="0 0 1"` after it then turns about what was the parent's $-y$ direction. This is the same job the DH twist $\alpha$ did in lesson 03.
:::end

## Quiz

:::quiz
- type: num
  q: Minimum number of joints for an arm to reach a general position and orientation?
  answer: 6
  tol: 0.001
  py: "3+3"
  explain: Three for position, three for orientation.
- type: num
  q: Height of the wrist centre at q1..q3 = (30°, 45°, −60°)?
  answer: 0.65
  tol: 0.002
  unit: m
  py: "0.4+0.5*math.sin(math.radians(45))+0.4*math.sin(math.radians(-15))"
  explain: Lesson 03's arm, unchanged.
- type: num
  q: Tool x position at home (all joints zero)?
  answer: 1.0
  tol: 0.001
  unit: m
  py: "0.5+0.4+0.1"
  explain: Upper arm, forearm and flange in a line.
- type: num
  q: Distance between the tool flange and the wrist centre in any pose?
  answer: 0.1
  tol: 0.001
  unit: m
  py: "0.1"
  explain: The wrist only rotates about the centre.
- type: mc
  q: In a spherical wrist the three axes…
  options:
    - intersect at one point
    - are all parallel
    - are all vertical
    - lie in one plane
  answer: 0
  explain: That is what makes the decomposition work.
- type: mc
  q: A URDF joint's origin element gives…
  options:
    - the fixed transform from the parent link to the joint frame
    - the joint's current angle
    - the link's mass
    - the joint limits
  answer: 0
  explain: Then the joint rotates about its axis.
:::end
