---
id: p20-l11
minutes: 40
summary: The robot-arm capstone starts with sizing. You lay out a three-joint arm, find the worst static torque at each joint by summing moments and check it by virtual work, add the torque to accelerate, apply a safety factor, pick motors from a catalogue, and write a URDF whose effort limits and masses match the design.
---

## Torque from statics

Gravity loads the shoulder and elbow most when the arm is stretched horizontally. For point masses $m_i$ at horizontal distance $x_i$ from a joint, the static torque is

$$\tau = g \sum_i m_i x_i,$$

and the same result follows from virtual work, $\tau = J_z^\top m g$, where $J_z$ holds the derivatives of each mass's height with respect to the joint angles (Phase 15). Moving the arm also takes $\tau = I\alpha$, with the worst-case inertia about the joint, again when stretched. The motor must provide

$$\tau_{motor} \ge SF\,(\tau_{static} + I\alpha)$$

continuously, with a safety factor $SF$ for friction, cable drag and model error.

## A URDF that matches

The URDF (Unified Robot Description Format) describes links, their masses and inertias, and joints with axes and limits. Its effort limits should be the chosen motors' ratings, and its masses should include the motors themselves; an inertia tensor must be physical, which for a diagonal tensor means each principal moment is at most the sum of the other two.

:::figure widget=armsizing caption="Static torque at the shoulder and elbow as the arm moves. Change the link lengths, the payload and the acceleration; the bars compare the requirement with the chosen motor."
:::end

## Worked example

Shoulder 0.10 m above the base, upper arm 0.25 m (0.30 kg), forearm 0.20 m (0.20 kg), elbow motor 0.15 kg, payload with gripper 0.20 kg, 3 rad/s², safety factor 1.5, illustrative motor catalogue:

1. Worst static torque: shoulder 2.305 N·m, elbow 0.589 N·m, both with the arm horizontal; summing moments and virtual work agree everywhere in the workspace.
2. Required: shoulder 3.824 N·m, elbow 0.931 N·m.
3. Choice: G60 (6.0 N·m) at the shoulder, 64 % of its rating; S20 (2.0 N·m) at the elbow, 47 %, and it fits the 0.15 kg assumed for the elbow motor.
4. URDF: 6 links, 5 joints, effort limits 3.5, 6.0 and 2.0 N·m, moving mass 0.90 kg.

## Code it from scratch

:::code file=arm_design.py
```python
import numpy as np, xml.etree.ElementTree as ET

g = 9.81
H, L2, L3 = 0.10, 0.25, 0.20                 # base height to shoulder, upper arm, forearm (m)
M2, M3 = 0.30, 0.20                          # link masses (kg), centre of mass at mid-link
M_ELBOW, M_LOAD = 0.15, 0.20                 # elbow motor at the elbow, payload incl. gripper at the tip
ALPHA = 3.0                                  # required joint acceleration (rad/s^2) when fully stretched
SF = 1.5                                     # safety factor on torque
# illustrative motor catalogue: name, continuous torque at the output (N m), mass (kg)
CATALOGUE = [("S20", 2.0, 0.06), ("S35", 3.5, 0.08), ("G60", 6.0, 0.17), ("G120", 12.0, 0.35)]

def box_inertia(m, l, w=0.04):              # slender box along its own x axis
    return np.diag([m * 2 * w**2 / 12, m * (l**2 + w**2) / 12, m * (l**2 + w**2) / 12])

def urdf(eff_sh=6.0, eff_el=2.0):
    def link(name, m, l):
        I = box_inertia(m, l); return f'''  <link name="{name}">
    <inertial><origin xyz="{l / 2} 0 0"/><mass value="{m}"/>
      <inertia ixx="{I[0, 0]:.6g}" iyy="{I[1, 1]:.6g}" izz="{I[2, 2]:.6g}" ixy="0" ixz="0" iyz="0"/></inertial>
    <visual><origin xyz="{l / 2} 0 0"/><geometry><box size="{max(l, 0.04)} 0.04 0.04"/></geometry></visual>
  </link>'''
    def joint(name, parent, child, xyz, axis, lim, eff):
        return f'''  <joint name="{name}" type="revolute"><parent link="{parent}"/><child link="{child}"/>
    <origin xyz="{xyz}"/><axis xyz="{axis}"/><limit lower="{-lim}" upper="{lim}" effort="{eff}" velocity="3.0"/></joint>'''
    return "\n".join(['<robot name="arm3">', '  <link name="base"/>', link("turret", 0.05, 0.01),
                      link("upper_arm", M2, L2), link("forearm", M3, L3), link("tool", M_LOAD, 0.0), link("elbow_motor", M_ELBOW, 0.0),
                      joint("yaw", "base", "turret", f"0 0 {H}", "0 0 1", 3.14, 3.5),
                      joint("shoulder", "turret", "upper_arm", "0 0 0", "0 -1 0", 1.57, eff_sh),
                      joint("elbow", "upper_arm", "forearm", f"{L2} 0 0", "0 -1 0", 2.6, eff_el),
                      f'  <joint name="tool_mount" type="fixed"><parent link="forearm"/><child link="tool"/><origin xyz="{L3} 0 0"/></joint>',
                      f'  <joint name="motor_mount" type="fixed"><parent link="upper_arm"/><child link="elbow_motor"/><origin xyz="{L2} 0 0"/></joint>', "</robot>"])

def static_torques(q2, q3):
    """gravity torques at shoulder and elbow (planar, q2 from horizontal, q3 relative), by summing moments"""
    x_c2 = L2 / 2 * np.cos(q2); x_e = L2 * np.cos(q2)
    x_c3 = x_e + L3 / 2 * np.cos(q2 + q3); x_t = x_e + L3 * np.cos(q2 + q3)
    t_sh = g * (M2 * x_c2 + M_ELBOW * x_e + M3 * x_c3 + M_LOAD * x_t)
    t_el = g * (M3 * (x_c3 - x_e) + M_LOAD * (x_t - x_e))
    return t_sh, t_el

def static_torques_jacobian(q2, q3):
    """same thing by virtual work: tau = sum J_i^T m_i g for each point mass (z component only)"""
    pts = [(M2, L2 / 2, 0), (M_ELBOW, L2, 0), (M3, L2, L3 / 2), (M_LOAD, L2, L3)]
    tau = np.zeros(2)
    for m, a, b in pts:
        Jz = np.array([a * np.cos(q2) + b * np.cos(q2 + q3), b * np.cos(q2 + q3)])   # d(height)/dq
        tau += Jz * m * g
    return tau

def inertia_about(joint):
    """worst-case (stretched) inertia about the shoulder or elbow, point masses plus slender rods"""
    if joint == "shoulder":
        return (M2 * L2**2 / 3 + M_ELBOW * L2**2 + M3 * (L2**2 + L2 * L3 + L3**2 / 3) + M_LOAD * (L2 + L3)**2)
    return M3 * L3**2 / 3 + M_LOAD * L3**2

def test_urdf():
    root = ET.fromstring(urdf()); links = {l.get("name") for l in root.iter("link")}
    joints = root.findall("joint"); print(f"URDF: {len(links)} links, {len(joints)} joints")
    for j in joints:
        assert j.find("parent").get("link") in links and j.find("child").get("link") in links
        if j.get("type") == "revolute": assert float(j.find("limit").get("effort")) > 0
    for l in root.iter("link"):
        i = l.find("inertial/inertia")
        if i is not None:
            ix, iy, iz = (float(i.get(k)) for k in ("ixx", "iyy", "izz"))
            if l.get("name") in ("tool", "elbow_motor"): continue      # point masses
            assert ix > 0 and iy > 0 and iz > 0 and ix + iy >= iz and iy + iz >= ix and ix + iz >= iy   # physical inertia
    children = [j.find("child").get("link") for j in joints]; assert len(set(children)) == len(children)  # a tree

def test_torques():
    qs = np.radians(np.linspace(-90, 90, 181)); worst = np.zeros(2)
    for q2 in qs:
        for q3 in np.radians(np.linspace(-150, 150, 61)):
            a = np.array(static_torques(q2, q3)); assert np.allclose(a, static_torques_jacobian(q2, q3))
            worst = np.maximum(worst, np.abs(a))
    print(f"worst static torque: shoulder {worst[0]:.3f} N m, elbow {worst[1]:.3f} N m (arm stretched horizontally)")
    need = SF * (worst + ALPHA * np.array([inertia_about("shoulder"), inertia_about("elbow")]))
    print(f"required with {ALPHA} rad/s^2 and safety factor {SF}: shoulder {need[0]:.3f} N m, elbow {need[1]:.3f} N m")
    pick = [next(c for c in CATALOGUE if c[1] >= n) for n in need]
    for jn, n, c in zip(("shoulder", "elbow"), need, pick):
        print(f"{jn}: {c[0]} ({c[1]} N m continuous) -> {100 * n / c[1]:.0f} % of its rating")
        assert c[1] >= n
    assert pick[1][2] <= M_ELBOW                      # the elbow motor fits the mass assumed for it
    root = ET.fromstring(urdf(pick[0][1], pick[1][1]))
    eff = {j.get("name"): float(j.find("limit").get("effort")) for j in root.findall("joint") if j.get("type") == "revolute"}
    mass = sum(float(m.get("value")) for m in root.iter("mass"))
    print("URDF effort limits:", eff, f"moving mass {mass:.2f} kg"); assert eff["shoulder"] >= need[0] and eff["elbow"] >= need[1]
    return pick

test_urdf(); test_torques(); print("PASS")
```
:::end

## In practice

ROS 2 loads the URDF (often generated from xacro) for visualisation in RViz, for MoveIt planning and for ros2_control limits; `check_urdf` catches structural errors. Export it from CAD where possible so the masses and inertias are measured, not guessed, and weigh the real parts. Check the motor's continuous rating at its thermal limit, not the peak torque on the front of the datasheet.

## Exercises

:::exercise
The payload doubles to 0.4 kg. What happens to the shoulder's static torque?
:::solution
It rises by $9.81 \times 0.2 \times 0.45 = 0.883$ N·m to 3.188 N·m. With the extra inertia and the safety factor, the requirement grows to about 5.33 N·m, still within the G60.
:::end

:::exercise
Why size motors with the arm stretched, not at a typical pose?
:::solution
Because the arm will be stretched at some point (homing, a far target, an operator command) and a motor that cannot hold it there drops the load. Sizing for the worst case is sizing for safety.
:::end

## Quiz

:::quiz
- type: num
  q: Static shoulder torque from a 0.2 kg payload at 0.45 m (N·m)?
  answer: 0.883
  tol: 0.005
  py: "9.81*0.2*0.45"
  explain: m g x.
- type: num
  q: Inertia of a 0.3 kg, 0.25 m rod about its end (kg·m²)?
  answer: 0.00625
  tol: 0.005
  py: "0.3*0.25**2/3"
  explain: m ℓ²/3.
- type: num
  q: Requirement for 2.305 N·m static, inertia 0.0813 kg·m², 3 rad/s², SF 1.5 (N·m)?
  answer: 3.824
  tol: 0.005
  py: "1.5*(2.305+0.0813*3)"
  explain: SF (τ + Iα).
- type: num
  q: Share of a 6 N·m rating used by 3.824 N·m (%)?
  answer: 63.7
  tol: 0.005
  py: "100*3.824/6"
  explain: Ratio.
- type: mc
  q: Which inertia tensor is physical?
  options: ["diag(1, 2, 2.5)", "diag(1, 1, 3)", "diag(0, 2, 1)", "diag(1, -1, 1)"]
  answer: 0
  explain: Each moment must be at most the sum of the other two and positive.
- type: mc
  q: Where should a motor's effort limit in the URDF come from?
  options: ["The chosen motor's continuous rating", "The peak torque", "The static torque", "Any large number"]
  answer: 0
  explain: The limits protect the hardware.
:::end
