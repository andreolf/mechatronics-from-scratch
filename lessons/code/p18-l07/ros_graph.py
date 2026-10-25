from dataclasses import dataclass, field

@dataclass(frozen=True)
class QoS:
    reliability: str = "reliable"          # or "best_effort"
    durability: str = "volatile"           # or "transient_local" (late joiners get the last samples)
    depth: int = 10                        # history keep-last depth
    deadline_ms: float = float("inf")      # maximum expected period between samples

def compatible(pub, sub):
    """DDS request-offered rule: what the publisher offers must be at least what the subscriber requests.
    Returns (ok, reason)."""
    if pub.reliability == "best_effort" and sub.reliability == "reliable":
        return False, "reliability: subscriber requests reliable, publisher offers best effort"
    if pub.durability == "volatile" and sub.durability == "transient_local":
        return False, "durability: subscriber requests transient local, publisher offers volatile"
    if pub.deadline_ms > sub.deadline_ms:
        return False, "deadline: publisher promises a longer period than the subscriber accepts"
    return True, ""

def resolve(name, ns="/", node=""):
    """ROS 2 name resolution: absolute '/x', relative 'x' (prefixed by the namespace), private '~/x' (namespace/node/x)"""
    ns = "/" + ns.strip("/") if ns.strip("/") else ""
    if name.startswith("/"): return name
    if name.startswith("~/"): return f"{ns}/{node}/{name[2:]}"
    return f"{ns}/{name}"

@dataclass
class Node:
    name: str
    ns: str = "/"
    pubs: list = field(default_factory=list)   # (topic, type, QoS)
    subs: list = field(default_factory=list)

class Graph:
    """what DDS discovery gives every participant: all endpoints, so each side can match by topic, type and QoS"""
    def __init__(self, nodes): self.nodes = nodes
    def endpoints(self, kind):
        for n in self.nodes:
            for t, ty, q in getattr(n, kind): yield n, resolve(t, n.ns, n.name), ty, q
    def topic_list(self):
        out = {}
        for kind in ("pubs", "subs"):
            for _, t, ty, _ in self.endpoints(kind): out.setdefault(t, set()).add(ty)
        return {t: sorted(v) for t, v in sorted(out.items())}           # one topic can carry several types: a bug to spot
    def matches(self):
        ok, bad = [], []
        for pn, pt, pty, pq in self.endpoints("pubs"):
            for sn, st, sty, sq in self.endpoints("subs"):
                if pt != st: continue
                if pty != sty: bad.append((pn.name, sn.name, pt, "type mismatch")); continue
                c, why = compatible(pq, sq)
                (ok if c else bad).append((pn.name, sn.name, pt) + (() if c else (why,)))
        return ok, bad

def test_names():
    r = [resolve("scan", "/robot1"), resolve("/tf", "/robot1"), resolve("~/status", "/robot1", "driver"), resolve("imu")]
    print("resolved names:", r)
    assert r == ["/robot1/scan", "/tf", "/robot1/driver/status", "/imu"]

def test_graph():
    sensor = QoS("best_effort", depth=5)                                     # like rclpy's qos_profile_sensor_data
    latched = QoS(durability="transient_local", depth=1)
    g = Graph([
        Node("imu_driver", pubs=[("imu/data", "sensor_msgs/msg/Imu", sensor)]),
        Node("lidar", "/robot1", pubs=[("scan", "sensor_msgs/msg/LaserScan", sensor)]),
        Node("estimator", subs=[("imu/data", "sensor_msgs/msg/Imu", QoS("best_effort")), ("/robot1/scan", "sensor_msgs/msg/LaserScan", QoS())],
             pubs=[("odom", "nav_msgs/msg/Odometry", QoS())]),
        Node("map_server", pubs=[("map", "nav_msgs/msg/OccupancyGrid", latched)]),
        Node("planner", subs=[("map", "nav_msgs/msg/OccupancyGrid", latched), ("odom", "nav_msgs/msg/Odometry", QoS(deadline_ms=50))]),
        Node("logger", subs=[("odom", "geometry_msgs/msg/Pose", QoS())]),
        Node("rviz", subs=[("odom", "nav_msgs/msg/Odometry", QoS(durability="transient_local"))]),
    ])
    topics = g.topic_list(); ok, bad = g.matches()
    print("ros2 topic list -t:"); [print(f"  {t} [{', '.join(ty)}]") for t, ty in topics.items()]
    print("matched:", [f"{p} -> {s} on {t}" for p, s, t in ok])
    print("not matched:"); [print(f"  {p} -> {s} on {t}: {why}") for p, s, t, why in bad]
    assert list(topics) == ["/imu/data", "/map", "/odom", "/robot1/scan"] and len(topics["/odom"]) == 2
    assert ("imu_driver", "estimator", "/imu/data") in ok and ("map_server", "planner", "/map") in ok
    assert {why.split(":")[0] for *_, why in bad} == {"reliability", "durability", "deadline", "type mismatch"}

test_names()
test_graph()
print("PASS")
