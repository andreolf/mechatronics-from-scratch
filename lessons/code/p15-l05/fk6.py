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
