import numpy as np

def qmul(a, b):
    x1, y1, z1, w1 = a; x2, y2, z2, w2 = b                  # quaternions as (x, y, z, w), the ROS order
    return np.array([w1*x2 + x1*w2 + y1*z2 - z1*y2, w1*y2 - x1*z2 + y1*w2 + z1*x2,
                     w1*z2 + x1*y2 - y1*x2 + z1*w2, w1*w2 - x1*x2 - y1*y2 - z1*z2])
def qconj(q): return np.array([-q[0], -q[1], -q[2], q[3]])
def qrot(q, v): return qmul(qmul(q, np.r_[v, 0.0]), qconj(q))[:3]
def qyaw(yaw): return np.array([0, 0, np.sin(yaw / 2), np.cos(yaw / 2)])
def qrpy(r, p, y):
    qx = np.array([np.sin(r / 2), 0, 0, np.cos(r / 2)]); qy = np.array([0, np.sin(p / 2), 0, np.cos(p / 2)])
    return qmul(qyaw(y), qmul(qy, qx))
def slerp(a, b, s):
    d = np.dot(a, b)
    if d < 0: b, d = -b, -d                                 # take the short way round
    if d > 0.9995: q = a + s * (b - a); return q / np.linalg.norm(q)
    th = np.arccos(d); return (np.sin((1 - s) * th) * a + np.sin(s * th) * b) / np.sin(th)

class TF:
    """a transform (t, q) maps points in the child frame to the parent frame: p_parent = q p_child q* + t"""
    def __init__(self, t, q): self.t, self.q = np.asarray(t, float), np.asarray(q, float)
    def __mul__(self, o): return TF(self.t + qrot(self.q, o.t), qmul(self.q, o.q))
    def inv(self): qi = qconj(self.q); return TF(-qrot(qi, self.t), qi)
    def apply(self, p): return qrot(self.q, p) + self.t

class ExtrapolationError(Exception): pass

class Buffer:
    """tf2's core: each child frame has one parent and a time-sorted history of transforms; static edges have no history"""
    def __init__(self, cache=10.0): self.parent, self.hist, self.static, self.cache = {}, {}, {}, cache
    def set_static(self, parent, child, tf): self.parent[child] = parent; self.static[child] = tf
    def set(self, parent, child, stamp, tf):
        self.parent[child] = parent; h = self.hist.setdefault(child, []); h.append((stamp, tf)); h.sort(key=lambda e: e[0])
        while h[-1][0] - h[0][0] > self.cache: h.pop(0)         # drop history older than the cache length
    def edge(self, child, t):
        if child in self.static: return self.static[child]
        h = self.hist[child]
        if t is None: return h[-1][1]                          # time 0 in tf2: the latest available
        if t < h[0][0] or t > h[-1][0]:
            raise ExtrapolationError(f"{child}: requested {t:.2f} s outside [{h[0][0]:.2f}, {h[-1][0]:.2f}]")
        for (t0, a), (t1, b) in zip(h, h[1:]):
            if t0 <= t <= t1:
                s = 0 if t1 == t0 else (t - t0) / (t1 - t0)
                return TF(a.t + s * (b.t - a.t), slerp(a.q, b.q, s))   # lerp the translation, slerp the rotation
        return h[-1][1]
    def chain(self, f):
        out = [f]
        while out[-1] in self.parent: out.append(self.parent[out[-1]])
        return out
    def lookup(self, target, source, t=None):
        """transform that maps points in `source` to `target`, at time t, through the common ancestor"""
        up_s, up_t = self.chain(source), self.chain(target)
        root = next(f for f in up_s if f in up_t)
        def to_root(path):
            T = TF([0, 0, 0], [0, 0, 0, 1])
            for f in path[:path.index(root)]: T = self.edge(f, t) * T
            return T
        return to_root(up_t).inv() * to_root(up_s)
    def tree(self, f="map", depth=0):
        lines = [("  " * depth) + f + (" (static)" if f in self.static else "")]
        for c in sorted(k for k, p in self.parent.items() if p == f): lines += self.tree(c, depth + 1)
        return lines

def build():
    b = Buffer()
    b.set_static("base_link", "laser", TF([0.20, 0, 0.15], qyaw(0)))
    b.set_static("base_link", "camera_link", TF([0.10, 0, 0.30], qrpy(0, 0.2, 0)))
    b.set_static("camera_link", "camera_optical", TF([0, 0, 0], qrpy(-np.pi / 2, 0, -np.pi / 2)))
    b.set("map", "odom", 0.0, TF([1.0, 0.5, 0], qyaw(0.1)))
    b.set("map", "odom", 2.0, TF([1.0, 0.5, 0], qyaw(0.1)))
    for k in range(21):                                        # the robot drives an arc: odometry at 10 Hz for 2 s
        t = 0.1 * k; b.set("odom", "base_link", t, TF([np.sin(t), 1 - np.cos(t), 0], qyaw(t)))
    return b

def test_tree_and_lookups():
    b = build()
    print("\n".join(b.tree()))
    p = b.lookup("map", "laser", 1.0).apply([2.0, 0, 0])      # a laser return 2 m ahead, at t = 1 s
    yaw = 0.1 + 1.0; base = np.array([1.0, 0.5, 0]) + qrot(qyaw(0.1), [np.sin(1), 1 - np.cos(1), 0])
    expect = base + np.array([np.cos(yaw), np.sin(yaw), 0]) * 2.2 + [0, 0, 0.15]
    print("laser point in map at t = 1.0 s:", np.round(p, 4), "expected", np.round(expect, 4))
    assert np.allclose(p, expect, atol=1e-9)
    T = b.lookup("laser", "camera_optical", 0.5) * b.lookup("camera_optical", "laser", 0.5)
    assert np.allclose(T.t, 0) and np.isclose(abs(T.q[3]), 1)                  # a round trip is the identity

def test_interpolation_and_extrapolation():
    b = build(); T = b.lookup("odom", "base_link", 1.05)
    yaw = 2 * np.arctan2(T.q[2], T.q[3])
    print(f"between samples at t = 1.05 s: x {T.t[0]:.5f} (true {np.sin(1.05):.5f}), yaw {yaw:.5f} (true 1.05000)")
    assert np.isclose(yaw, 1.05) and abs(T.t[0] - np.sin(1.05)) < 2e-3       # slerp exact for the yaw; lerp cuts the arc by about 1 mm
    try: b.lookup("map", "base_link", 2.5); assert False
    except ExtrapolationError as e: print("lookup at 2.5 s:", e)

test_tree_and_lookups()
test_interpolation_and_extrapolation()
print("PASS")
