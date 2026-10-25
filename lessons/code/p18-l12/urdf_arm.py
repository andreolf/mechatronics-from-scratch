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
