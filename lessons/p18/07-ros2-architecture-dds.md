---
id: p18-l07
minutes: 35
summary: ROS 2 is a set of processes that find each other and exchange typed messages over DDS. You learn the node graph, discovery, topic name resolution and the quality-of-service rules that silently decide whether a publisher and a subscriber connect, then model a robot's graph and list its topics and its broken connections.
---

## Why ROS 2

A robot's software is many programs: drivers, estimators, planners, controllers, a user interface. **ROS 2** (Robot Operating System 2) is not an operating system but a middleware and a set of tools that let them run as separate **nodes** and talk through:

- **topics**: many-to-many streams of typed messages (sensor data, commands),
- **services**: request-response calls (lesson 08),
- **actions**: long-running goals with feedback and cancel (lesson 08),
- **parameters**: per-node configuration (lesson 13).

## DDS underneath

ROS 2 uses **DDS** (Data Distribution Service, an OMG standard) for transport. Each process is a DDS participant. Participants **discover** each other by multicast on the local network (no central master, unlike ROS 1), exchange the list of their endpoints, and each publisher-subscriber pair that agrees on topic name, message type and QoS is **matched** and sends data directly, peer to peer. Same-machine traffic can use shared memory. The **domain ID** (`ROS_DOMAIN_ID`) separates independent graphs on one network.

## Names

A node in namespace `/robot1` resolves topic names as follows: `scan` (relative) becomes `/robot1/scan`; `/tf` (absolute) stays `/tf`; `~/status` (private) becomes `/robot1/driver/status` for node `driver`. Namespaces let you run two identical robots on one network.

## Quality of service

Each endpoint has a **QoS** profile. The rule is **request versus offer**: the publisher must offer at least what the subscriber requests, or they do not connect, and nothing is printed by default.

- **Reliability**: `reliable` (retransmit lost samples) or `best_effort`. A best-effort publisher cannot serve a reliable subscriber; the reverse is fine.
- **Durability**: `transient_local` keeps the last samples for late-joining subscribers (a map, a robot description); `volatile` does not. A volatile publisher cannot serve a transient-local subscriber.
- **History and depth**: keep the last $N$ samples per subscription.
- **Deadline, lifespan, liveliness**: timing promises, also checked request versus offer.

Sensor drivers usually publish best effort (`qos_profile_sensor_data`): a lost scan should not be retransmitted after a newer one exists.

:::figure widget=rosgraph caption="A node graph. Change the QoS of each endpoint; edges turn red with the reason when publisher and subscriber cannot match."
:::end

## Worked example

Illustrative graph: an IMU driver and a lidar (in `/robot1`) publish best effort; an estimator subscribes to both and publishes odometry; a map server publishes a transient-local map; a planner, a logger and an RViz-like viewer subscribe.

1. `ros2 topic list -t` equivalent: `/imu/data`, `/map`, `/odom` and `/robot1/scan`. `/odom` shows two types, `geometry_msgs/msg/Pose` and `nav_msgs/msg/Odometry`: a bug.
2. Matched: IMU driver to estimator (best effort both sides) and map server to planner (transient local both sides).
3. Not matched: lidar to estimator (subscriber requests reliable, publisher offers best effort), estimator to planner (the planner requests a 50 ms deadline the publisher does not promise), estimator to logger (type mismatch), estimator to the viewer (it requests transient local, the publisher is volatile).

## Code it from scratch

:::code file=ros_graph.py
```python
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
```
:::end

## In practice

`ros2 node list`, `ros2 topic list -t`, `ros2 topic info -v /scan` (which prints each endpoint's QoS) and `rqt_graph` show the real graph. `ros2 doctor` flags common problems, and a QoS mismatch raises an "incompatible QoS" event you can log. The DDS vendor is chosen with `RMW_IMPLEMENTATION` (Fast DDS, Cyclone DDS, Connext), and Zenoh is an alternative middleware from Jazzy on.

## Exercises

:::exercise
RViz shows nothing on `/scan`, but `ros2 topic hz /scan` prints 10 Hz. What is the likely cause?
:::solution
A QoS mismatch: the driver publishes best effort and the RViz display requests reliable. `ros2 topic info -v /scan` shows both profiles; set the display's reliability to best effort.
:::end

:::exercise
Two identical robots on one Wi-Fi network see each other's `/cmd_vel`. Give two fixes.
:::solution
Put each robot's nodes in its own namespace (`/robot1`, `/robot2`) so names differ, or give each a different `ROS_DOMAIN_ID` so their DDS participants never discover each other.
:::end

## Quiz

:::quiz
- type: num
  q: Topics in the example's topic list?
  answer: 4
  tol: 0.001
  py: "4"
  explain: /imu/data, /map, /odom and /robot1/scan.
- type: num
  q: Connections that failed to match in the example?
  answer: 4
  tol: 0.001
  py: "4"
  explain: Reliability, deadline, type and durability.
- type: num
  q: Default ROS_DOMAIN_ID?
  answer: 0
  tol: 0.001
  py: "0"
  explain: Unset means domain 0.
- type: num
  q: Samples a keep-last subscription of depth 10 can buffer?
  answer: 10
  tol: 0.001
  py: "10"
  explain: The history depth.
- type: mc
  q: A best-effort subscriber and a reliable publisher…
  options:
    - match, and the link behaves as best effort
    - do not match
    - match only on the same machine
    - match after a timeout
  answer: 0
  explain: The publisher offers more than requested.
- type: mc
  q: In namespace /arm, node gripper resolves ~/state to…
  options:
    - /arm/gripper/state
    - /arm/state
    - /gripper/state
    - /state
  answer: 0
  explain: Private names include the node name.
:::end
