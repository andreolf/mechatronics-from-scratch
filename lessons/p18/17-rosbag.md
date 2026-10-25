---
id: p18-l17
minutes: 35
summary: Recording a robot's topics and replaying them later lets you debug and test algorithms without the robot. You build a bag in the rosbag2 sqlite3 layout, record a live IMU and odometry stream, replay it at different rates and from a seek point, and show that a node using header stamps reproduces its live output exactly while one using wall-clock time does not.
---

## What a bag is

`ros2 bag record /imu /odom` subscribes to topics and stores every serialized message (the CDR bytes of lesson 10) with its receive timestamp, plus each topic's name, type and QoS. `ros2 bag play` publishes them again in recorded order, at the original pace or faster or slower, and can publish `/clock` so nodes follow the bag's time.

rosbag2 has pluggable storage. Early releases used **sqlite3**: a `topics` table and a `messages` table of (topic id, timestamp, data). From Iron on, the default is **MCAP**, a single-file append-only container that is faster to write and readable by tools such as Foxglove. The ideas are the same, and this lesson uses the sqlite3 layout because Python ships with sqlite.

## Deterministic replay

Replaying a bag through a node should reproduce what the node did live. That holds only if the node's output depends on the **data**, not on **when** it ran:

- use the messages' header stamps (lesson 09) for time differences, not the wall clock,
- or use ROS time with `use_sim_time:=true`, so the clock comes from `/clock` published by `ros2 bag play --clock`,
- process messages in a well-defined order; a bag replays in timestamp order, while a live system's callback order may differ,
- avoid hidden state such as random numbers without fixed seeds.

Then a bag becomes a **regression test**: replay it after every change and compare the outputs.

:::figure widget=bagscrub caption="A recorded bag on a timeline. Scrub through it, play at different rates, and compare a node that uses header stamps with one that uses the wall clock."
:::end

## Worked example

A simulated 5 s run: 100 Hz IMU (yaw rate) and 20 Hz odometry (speed), each delivered after a small random delay, feeding a dead-reckoning node.

1. The bag holds `/imu` (500 messages over 4.990 s) and `/odom` (100 messages over 4.951 s).
2. The node using header stamps ends live at $(2.038672, 1.28032)$ m, heading 0.82525 rad. Replay at rate 1 and at rate 2 reproduce every output exactly.
3. The node using the time its callback ran ends live at a slightly different pose (2.038292, 1.280356) because of the delivery jitter, and replayed at rate 2 it ends at $(1.215029, 0.34902)$ m: half the time has passed on its clock.
4. Seeking to 2.5 s replays 250 poses, starting at stamp 2.50 s.

## Code it from scratch

:::code file=mini_rosbag.py
```python
import sqlite3, struct, json
import numpy as np

def cdr(fmt, *v): return b"\x00\x01\x00\x00" + struct.pack("<" + fmt, *v)
def uncdr(fmt, b): return struct.unpack("<" + fmt, b[4:])

class Bag:
    """the rosbag2 sqlite3 layout: a topics table and a messages table of (topic_id, timestamp in ns, serialized data)"""
    def __init__(self, path=":memory:"):
        self.db = sqlite3.connect(path)
        self.db.executescript("""CREATE TABLE topics(id INTEGER PRIMARY KEY, name TEXT, type TEXT, serialization_format TEXT, offered_qos_profiles TEXT);
                                 CREATE TABLE messages(id INTEGER PRIMARY KEY, topic_id INTEGER, timestamp INTEGER, data BLOB);
                                 CREATE INDEX timestamp_idx ON messages(timestamp);""")
        self.ids = {}
    def write(self, topic, type_, t_ns, data):
        if topic not in self.ids:
            cur = self.db.execute("INSERT INTO topics(name, type, serialization_format, offered_qos_profiles) VALUES (?,?,?,?)",
                                  (topic, type_, "cdr", json.dumps({"reliability": "reliable", "depth": 10})))
            self.ids[topic] = cur.lastrowid
        self.db.execute("INSERT INTO messages(topic_id, timestamp, data) VALUES (?,?,?)", (self.ids[topic], t_ns, data))
    def read(self, start_ns=0, end_ns=2**62):
        q = """SELECT t.name, m.timestamp, m.data FROM messages m JOIN topics t ON m.topic_id = t.id
               WHERE m.timestamp BETWEEN ? AND ? ORDER BY m.timestamp, m.id"""
        return self.db.execute(q, (start_ns, end_ns)).fetchall()
    def info(self):
        rows = self.db.execute("SELECT t.name, t.type, COUNT(*), MIN(m.timestamp), MAX(m.timestamp) FROM messages m JOIN topics t ON m.topic_id = t.id GROUP BY t.id ORDER BY t.name").fetchall()
        return rows

class DeadReckoning:
    """a node: integrate gyro yaw rate and wheel speed into a 2D pose. `use_stamps` uses message header stamps
    (deterministic); otherwise it uses the time the callback ran (depends on how messages were delivered)"""
    def __init__(self, use_stamps=True): self.use, self.x = use_stamps, np.zeros(3); self.v, self.tl, self.out = 0.0, None, []
    def on_odom(self, stamp, recv, v): self.v = v
    def on_imu(self, stamp, recv, wz):
        t = stamp if self.use else recv
        if self.tl is not None:
            dt = t - self.tl; th = self.x[2]
            self.x += [self.v * np.cos(th) * dt, self.v * np.sin(th) * dt, wz * dt]
        self.tl = t; self.out.append((stamp, *self.x))

def live_system(bag, seconds=5.0, seed=1):
    """the robot running: 100 Hz IMU and 20 Hz odometry with header stamps; callbacks run after a random delivery delay"""
    rng = np.random.default_rng(seed); events = []
    for k in range(int(seconds * 100)):
        t = k / 100; wz = 0.4 * np.sin(0.8 * t) + rng.normal(0, 0.01)
        events.append((t + rng.exponential(2e-3), "/imu", t, cdr("dd", t, wz)))
    for k in range(int(seconds * 20)):
        t = k / 20; events.append((t + rng.exponential(2e-3), "/odom", t, cdr("dd", t, 0.5 + 0.1 * np.sin(t))))
    events.sort(key=lambda e: e[0])
    node_s, node_r = DeadReckoning(True), DeadReckoning(False)
    for recv, topic, stamp, data in events:
        bag.write(topic, "sensor_msgs/msg/Imu" if topic == "/imu" else "nav_msgs/msg/Odometry", int(round(recv * 1e9)), data)   # recorded at receive time
        for n in (node_s, node_r): dispatch(n, topic, recv, data)
    return node_s, node_r

def dispatch(node, topic, recv, data):
    stamp, val = uncdr("dd", data)
    (node.on_imu if topic == "/imu" else node.on_odom)(stamp, recv, val)

def replay(bag, use_stamps, rate=1.0, start_ns=0):
    """ros2 bag play: publish messages in recorded order; the clock advances with the bag time divided by the rate"""
    node = DeadReckoning(use_stamps); msgs = bag.read(start_ns); t0 = msgs[0][1]
    for topic, t_ns, data in msgs: dispatch(node, topic, t0 * 1e-9 + (t_ns - t0) * 1e-9 / rate, data)
    return node

def test_record_and_info():
    bag = Bag(); live_s, live_r = live_system(bag)
    for name, ty, n, a, b in bag.info(): print(f"  {name:6s} {ty:22s} {n:4d} messages, {1e-9 * (b - a):.3f} s")
    assert [r[2] for r in bag.info()] == [500, 100]
    return bag, live_s, live_r

def test_replay(bag, live_s, live_r):
    a = replay(bag, True); b = replay(bag, True, rate=2.0); c = replay(bag, False, rate=2.0)
    fin = lambda n: np.array(n.out[-1][1:])
    print("final pose live (stamps)       ", np.round(fin(live_s), 6))
    print("replay x1 (stamps)             ", np.round(fin(a), 6))
    print("replay x2 (stamps)             ", np.round(fin(b), 6))
    print("replay x2 (receive time)       ", np.round(fin(c), 6))
    assert np.array_equal(np.array(a.out), np.array(live_s.out)) and np.array_equal(np.array(b.out), np.array(live_s.out))
    assert np.abs(fin(c) - fin(live_r)).max() > 0.1                       # wall-clock time makes the result depend on playback
    mid = replay(bag, True, start_ns=int(2.5e9))                          # seek: start part-way through the bag
    print(f"seek to 2.5 s: {len(mid.out)} poses, first stamp {mid.out[0][0]:.2f} s")
    assert abs(mid.out[0][0] - 2.5) < 0.011

bag, s, r = test_record_and_info()
test_replay(bag, s, r)
print("PASS")
```
:::end

## In practice

`ros2 bag record -a` records everything (use with care), `ros2 bag info` prints the summary shown here, `ros2 bag play --rate 0.5 --clock --start-offset 2.5` slows down, publishes `/clock` and seeks, and `--storage sqlite3` or `--storage mcap` chooses the format. Foxglove and PlotJuggler open bags for visual inspection, and the `rosbag2_py` API reads them in scripts and tests.

## Exercises

:::exercise
Your localisation replays differently every time. Name three likely causes.
:::solution
It uses the wall clock instead of message stamps or sim time; it depends on callback order across topics, which a multi-threaded executor makes nondeterministic; or it uses randomness (a particle filter) without a fixed seed.
:::end

:::exercise
Why record at the receive time and still keep the header stamps?
:::solution
The receive time orders the replay as the robot saw it, including delays; the header stamp says when the measurement was taken. Algorithms need the stamp, and comparing the two reveals transport latency.
:::end

## Quiz

:::quiz
- type: num
  q: Messages in the example bag?
  answer: 600
  tol: 0.001
  py: "500+100"
  explain: 500 IMU plus 100 odometry.
- type: num
  q: Wall time to replay a 60 s bag at rate 2 (seconds)?
  answer: 30
  tol: 0.001
  py: "60/2"
  explain: Twice as fast.
- type: num
  q: Messages in 10 s of a 100 Hz IMU and a 20 Hz odometry topic?
  answer: 1200
  tol: 0.001
  py: "10*(100+20)"
  explain: Rate times duration per topic.
- type: num
  q: IMU poses after seeking to 2.5 s in the 5 s bag?
  answer: 250
  tol: 0.001
  py: "250"
  explain: The second half of the IMU samples.
- type: mc
  q: The default rosbag2 storage format from ROS 2 Iron on is…
  options:
    - MCAP
    - sqlite3
    - ROS 1 .bag
    - CSV
  answer: 0
  explain: sqlite3 is still available as a plugin.
- type: mc
  q: To make a node replay deterministically, it should take time differences from…
  options:
    - message header stamps or sim time
    - the wall clock
    - the number of callbacks
    - the CPU cycle counter
  answer: 0
  explain: Then the output depends only on the data.
:::end
