import numpy as np

L1, L2 = 1.0, 0.8                          # the arm lab's links (m)
Q1_LIM, Q2_LIM = (0.0, np.pi), (-np.radians(135), np.radians(135))

def fk2(q1, q2, l1=L1, l2=L2):
    return np.array([l1 * np.cos(q1) + l2 * np.cos(q1 + q2), l1 * np.sin(q1) + l2 * np.sin(q1 + q2)])

def ik2(x, y, l1=L1, l2=L2):
    """both closed-form solutions [(q1, q2) with q2 >= 0, (q1, q2) with q2 <= 0], or [] if out of reach"""
    c2 = (x * x + y * y - l1 * l1 - l2 * l2) / (2 * l1 * l2)       # law of cosines
    if abs(c2) > 1 + 1e-12: return []
    c2 = np.clip(c2, -1, 1); sols = []
    for s2 in (np.sqrt(1 - c2 * c2), -np.sqrt(1 - c2 * c2)):
        q2 = np.arctan2(s2, c2)
        q1 = np.arctan2(y, x) - np.arctan2(l2 * s2, l1 + l2 * c2)
        sols.append((np.arctan2(np.sin(q1), np.cos(q1)), q2))
    return sols

def in_limits(q): return Q1_LIM[0] <= q[0] <= Q1_LIM[1] and Q2_LIM[0] <= q[1] <= Q2_LIM[1]

def pick(sols, current):
    """what the lab does: keep the solutions inside the joint limits, then take the one nearest the current pose"""
    ok = [s for s in sols if in_limits(s)] or sols
    return min(ok, key=lambda s: np.hypot(s[0] - current[0], s[1] - current[1])) if ok else None

L3 = 0.3   # an illustrative third link for the orientation version
def fk3(q, l=(L1, L2, L3)):
    a = np.cumsum(q); return np.array([np.dot(l, np.cos(a)), np.dot(l, np.sin(a)), a[-1]])

def ik3(x, y, phi, l=(L1, L2, L3)):
    """3-link planar arm, tool at (x, y) pointing at angle phi: solve the wrist point with ik2, then q3"""
    wx, wy = x - l[2] * np.cos(phi), y - l[2] * np.sin(phi)
    return [(q1, q2, np.arctan2(np.sin(phi - q1 - q2), np.cos(phi - q1 - q2))) for q1, q2 in ik2(wx, wy, l[0], l[1])]

def test_round_trip_2link():
    rng = np.random.default_rng(8); n = 0
    for x, y in rng.uniform(-2, 2, (3000, 2)):
        sols, r = ik2(x, y), np.hypot(x, y)
        if L1 - L2 + 1e-9 < r < L1 + L2 - 1e-9:
            assert len(sols) == 2; n += 1
            for q in sols: assert np.allclose(fk2(*q), [x, y], atol=1e-9)
        elif r > L1 + L2 + 1e-9 or r < L1 - L2 - 1e-9:
            assert sols == []
    print(f"{n} reachable targets, both branches satisfy FK(IK(x)) = x")

def test_round_trip_3link():
    rng = np.random.default_rng(9)
    for q in rng.uniform(-np.pi, np.pi, (500, 3)):
        x, y, phi = fk3(q)
        for s in ik3(x, y, phi):
            p = fk3(np.array(s)); assert np.allclose(p[:2], [x, y], atol=1e-9) and abs(np.sin(p[2] - phi)) < 1e-9

def test_worked_example():
    sols = ik2(1.2, 0.6)
    for q1, q2 in sols: print(f"q1 = {np.degrees(q1):7.2f} deg, q2 = {np.degrees(q2):7.2f} deg, in limits: {in_limits((q1, q2))}")
    assert abs(np.degrees(sols[0][1]) - 84.26) < 0.01 and not in_limits(sols[0]) and in_limits(sols[1])
    assert pick(sols, (np.radians(60), np.radians(-70))) == sols[1]

test_round_trip_2link()
test_round_trip_3link()
test_worked_example()
print("PASS")
