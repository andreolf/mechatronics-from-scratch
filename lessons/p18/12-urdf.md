---
id: p18-l12
minutes: 40
summary: URDF describes a robot as links joined by joints, with visual, collision and inertial data for each link. You generate the URDF of a 3-DOF arm in code, write the checks that check_urdf makes, catch a broken file, and compute forward kinematics from the URDF that matches the geometry by hand.
---

## Links and joints

The **Unified Robot Description Format** is XML:

- A `<link>` is a rigid body with optional `<visual>` (what you see), `<collision>` (simpler shapes for collision checking) and `<inertial>` (mass, centre of mass and inertia tensor, needed for simulation and dynamics).
- A `<joint>` connects a parent link to a child link. Its `<origin xyz rpy>` places the child frame in the parent frame at zero joint angle, `<axis>` gives the motion axis in the child frame, and `<limit>` gives position, velocity and effort limits.
- Types: `revolute` (with limits), `continuous` (unlimited rotation), `prismatic`, `fixed`, and rarely `floating` and `planar`.

Links and joints must form a **tree** with one root (Phase 05 serial chains). Closed loops cannot be expressed directly.

## Inertia

Each link's inertia tensor is given about its centre of mass. For a solid cylinder of mass $m$, radius $r$ and length $h$ along $z$: $I_{xx} = I_{yy} = m(3r^2 + h^2)/12$ and $I_{zz} = mr^2/2$. A valid tensor is positive definite and obeys the triangle inequality (each principal moment at most the sum of the other two). Wrong inertias make a simulated robot explode or jitter (lesson 15).

## From URDF to kinematics

For each joint along the chain from the root, translate by the origin, then rotate by the joint angle about the axis: $T = \prod_k T_{origin,k}\, R(\text{axis}_k, q_k)$. **robot_state_publisher** does exactly this from `/joint_states` and publishes the result to tf2 (lesson 11).

:::figure widget=urdfview caption="The generated 3-DOF arm, seen from the side and from above. Move the joint sliders or drag the tool; the readout shows the tool position from the URDF chain."
:::end

## Worked example

Arm `arm3` with link lengths 0.30, 0.25 and 0.15 m, a base offset of 0.05 m, a yaw joint and two pitch joints (illustrative values):

1. The generated URDF is 87 lines. The checker reports root link `base_link`, the tree `base_link` → `link1` → `link2` → `link3` → `tool0`, and no errors.
2. `link1` (1.2 kg, radius 0.03 m, 0.30 m) has $I_{xx} = I_{yy} = 0.00927$ and $I_{zz} = 0.00054$ kg m².
3. A broken copy (joint 3's child changed to `link2`, joint 1's limit removed) gives: no limit on joint1, link2 has two parents, two root links, and a cycle.
4. At zero angles the tool is at $(0, 0, 0.75)$. At $q = (0.6, 0.7, -1.2)$ it is at $(0.0736, 0.0503, 0.6728)$, the same as the planar geometry $r = 0.25 \sin q_2 + 0.15 \sin(q_2 + q_3)$, rotated by $q_1$.

## Code it from scratch

:::code file=urdf_arm.py
```python
import xml.etree.ElementTree as ET
import numpy as np

def cylinder_inertia(m, r, h):
    """solid cylinder along its z axis, about its centre of mass"""
    ixx = m * (3 * r**2 + h**2) / 12; return ixx, ixx, m * r**2 / 2

def make_arm(lengths=(0.30, 0.25, 0.15), masses=(1.2, 0.8, 0.3), r=0.03):
    """a 3-DOF arm: a yaw joint at the base, then two pitch joints; each link a cylinder along its own z"""
    robot = ET.Element("robot", name="arm3")
    def link(name, m=None, L=None):
        l = ET.SubElement(robot, "link", name=name)
        if m is None: return
        vis = ET.SubElement(l, "visual"); ET.SubElement(vis, "origin", xyz=f"0 0 {L / 2}", rpy="0 0 0")
        ET.SubElement(ET.SubElement(vis, "geometry"), "cylinder", radius=str(r), length=str(L))
        col = ET.SubElement(l, "collision"); ET.SubElement(col, "origin", xyz=f"0 0 {L / 2}", rpy="0 0 0")
        ET.SubElement(ET.SubElement(col, "geometry"), "cylinder", radius=str(r), length=str(L))
        ine = ET.SubElement(l, "inertial"); ET.SubElement(ine, "origin", xyz=f"0 0 {L / 2}", rpy="0 0 0")
        ET.SubElement(ine, "mass", value=str(m)); ixx, iyy, izz = cylinder_inertia(m, r, L)
        ET.SubElement(ine, "inertia", ixx=f"{ixx:.6g}", iyy=f"{iyy:.6g}", izz=f"{izz:.6g}", ixy="0", ixz="0", iyz="0")
    def joint(name, parent, child, xyz, axis):
        j = ET.SubElement(robot, "joint", name=name, type="revolute")
        ET.SubElement(j, "parent", link=parent); ET.SubElement(j, "child", link=child)
        ET.SubElement(j, "origin", xyz=xyz, rpy="0 0 0"); ET.SubElement(j, "axis", xyz=axis)
        ET.SubElement(j, "limit", lower="-2.6", upper="2.6", effort="20", velocity="2.0")
    link("base_link"); link("link1", masses[0], lengths[0]); link("link2", masses[1], lengths[1]); link("link3", masses[2], lengths[2]); link("tool0")
    joint("joint1", "base_link", "link1", "0 0 0.05", "0 0 1")
    joint("joint2", "link1", "link2", f"0 0 {lengths[0]}", "0 1 0")
    joint("joint3", "link2", "link3", f"0 0 {lengths[1]}", "0 1 0")
    j = ET.SubElement(robot, "joint", name="tool_joint", type="fixed")
    ET.SubElement(j, "parent", link="link3"); ET.SubElement(j, "child", link="tool0"); ET.SubElement(j, "origin", xyz=f"0 0 {lengths[2]}", rpy="0 0 0")
    ET.indent(robot); return ET.tostring(robot, encoding="unicode")

def vec(s): return np.array([float(x) for x in s.split()])

def check_urdf(text):
    """the checks check_urdf and the URDF parser make: one root, joint links exist, every link has at most one parent,
    no cycles, moving joints have limits and an axis, inertia matrices physically valid"""
    root = ET.fromstring(text); errors = []
    links = [l.get("name") for l in root.findall("link")]
    if len(set(links)) != len(links): errors.append("duplicate link names")
    parent = {}
    for j in root.findall("joint"):
        p, c = j.find("parent").get("link"), j.find("child").get("link")
        for x in (p, c):
            if x not in links: errors.append(f"joint {j.get('name')}: link {x} not found")
        if c in parent: errors.append(f"link {c} has two parents")
        parent[c] = p
        if j.get("type") in ("revolute", "prismatic") and j.find("limit") is None: errors.append(f"joint {j.get('name')}: no limit")
        if j.get("type") in ("revolute", "prismatic", "continuous") and j.find("axis") is not None and np.linalg.norm(vec(j.find("axis").get("xyz"))) == 0:
            errors.append(f"joint {j.get('name')}: zero axis")
    roots = [l for l in links if l not in parent]
    if len(roots) != 1: errors.append(f"expected one root link, found {roots}")
    for l in links:                                            # walk up from every link: a cycle never reaches the root
        seen, x = set(), l
        while x in parent:
            if x in seen: errors.append(f"cycle through {x}"); break
            seen.add(x); x = parent[x]
    for l in root.findall("link"):
        i = l.find("inertial/inertia")
        if i is None: continue
        I = np.array([[float(i.get(a)) for a in r] for r in (("ixx", "ixy", "ixz"), ("ixy", "iyy", "iyz"), ("ixz", "iyz", "izz"))])
        ev = np.linalg.eigvalsh(I)
        if ev.min() <= 0 or ev.max() > ev.sum() - ev.max() + 1e-12: errors.append(f"link {l.get('name')}: inertia not physical")
    return roots[0] if len(roots) == 1 else None, parent, errors

def rot(axis, q):
    a = axis / np.linalg.norm(axis); K = np.array([[0, -a[2], a[1]], [a[2], 0, -a[0]], [-a[1], a[0], 0]])
    return np.eye(3) + np.sin(q) * K + (1 - np.cos(q)) * K @ K           # Rodrigues

def fk(text, q, tip="tool0"):
    """forward kinematics from the URDF: for each joint, translate by its origin, then rotate about its axis"""
    root = ET.fromstring(text); joints = {j.find("child").get("link"): j for j in root.findall("joint")}
    chain = []; x = tip
    while x in joints: chain.append(joints[x]); x = joints[x].find("parent").get("link")
    R, p = np.eye(3), np.zeros(3)
    for j in reversed(chain):
        p = p + R @ vec(j.find("origin").get("xyz"))
        if j.get("type") != "fixed": R = R @ rot(vec(j.find("axis").get("xyz")), q[j.get("name")])
    return p

def test_generate_and_check():
    text = make_arm(); root, parent, errors = check_urdf(text)
    def show(l, d=0):
        print("  " * d + l); [show(c, d + 1) for c in parent if parent[c] == l]
    print(f"robot name is: arm3, root Link: {root}, {len(text.splitlines())} lines of URDF"); show(root)
    print("errors:", errors or "none")
    assert root == "base_link" and errors == []
    I = cylinder_inertia(1.2, 0.03, 0.30); print("link1 inertia (ixx, iyy, izz):", [round(v, 6) for v in I])
    bad = text.replace('<child link="link3" />', '<child link="link2" />')            # joint3 now points back at link2
    bad = bad.replace('<limit lower="-2.6" upper="2.6" effort="20" velocity="2.0" />', "", 1)   # and joint1 loses its limit
    print("broken URDF:", check_urdf(bad)[2])
    assert any("two parents" in e for e in check_urdf(bad)[2])

def test_fk_matches_geometry():
    text = make_arm()
    for q in ({"joint1": 0.0, "joint2": 0.0, "joint3": 0.0}, {"joint1": 0.6, "joint2": 0.7, "joint3": -1.2}):
        p = fk(text, q); a, b, c = q["joint2"], q["joint2"] + q["joint3"], q["joint1"]
        r = 0.25 * np.sin(a) + 0.15 * np.sin(b); z = 0.05 + 0.30 + 0.25 * np.cos(a) + 0.15 * np.cos(b)
        expect = np.array([r * np.cos(c), r * np.sin(c), z])
        print("q", list(q.values()), "tool0 at", np.round(p, 4), "geometry", np.round(expect, 4))
        assert np.allclose(p, expect, atol=1e-12)

test_generate_and_check()
test_fk_matches_geometry()
print("PASS")
```
:::end

## In practice

Real descriptions are written in **xacro** (XML macros) and expanded with `xacro arm.urdf.xacro > arm.urdf`. `check_urdf arm.urdf` (from `liburdfdom-tools`) runs these checks and prints the tree, `urdf_to_graphviz` draws it, and `ros2 launch urdf_tutorial display.launch.py model:=arm.urdf` shows it in RViz with joint sliders. CAD exporters (for example for Onshape or SolidWorks) can generate the inertias.

## Exercises

:::exercise
A link's inertia is given as $I_{xx} = 0.01$, $I_{yy} = 0.01$, $I_{zz} = 0.03$. Is it physical?
:::solution
No: $I_{zz} = 0.03 > I_{xx} + I_{yy} = 0.02$ breaks the triangle inequality. No rigid body has these moments; a simulator would behave strangely.
:::end

:::exercise
Why give collision shapes that differ from the visual meshes?
:::solution
Collision checking runs many times per planning step or simulation step. Simple primitives (boxes, cylinders, capsules) or convex hulls are much faster and more robust than detailed meshes, while the visual mesh only needs to look right.
:::end

## Quiz

:::quiz
- type: num
  q: Izz of a solid cylinder of 2 kg and radius 0.05 m about its axis?
  answer: 0.0025
  tol: 0.002
  unit: kg m²
  py: "2*0.05**2/2"
  explain: m r² / 2.
- type: num
  q: Tool height of the example arm at zero joint angles?
  answer: 0.75
  tol: 0.001
  unit: m
  py: "0.05+0.30+0.25+0.15"
  explain: All links point straight up.
- type: num
  q: Joints in a tree of 5 links?
  answer: 4
  tol: 0.001
  py: "5-1"
  explain: Each link but the root has one parent joint.
- type: num
  q: Ixx of a 1 kg cylinder of radius 0.02 m and length 0.2 m about its centre?
  answer: 0.003433
  tol: 0.002
  unit: kg m²
  py: "1*(3*0.02**2+0.2**2)/12"
  explain: m(3r² + h²)/12.
- type: mc
  q: A joint's axis in URDF is expressed in…
  options:
    - the joint (child) frame
    - the world frame
    - the parent link's visual frame
    - the root link frame
  answer: 0
  explain: The frame defined by the joint origin.
- type: mc
  q: The node that turns /joint_states into tf2 transforms using the URDF is…
  options:
    - robot_state_publisher
    - joint_state_broadcaster
    - controller_manager
    - static_transform_publisher
  answer: 0
  explain: It computes forward kinematics from the URDF.
:::end
