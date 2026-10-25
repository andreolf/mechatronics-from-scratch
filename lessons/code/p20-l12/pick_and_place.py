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
