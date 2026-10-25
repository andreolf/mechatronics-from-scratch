---
id: p18-l09
minutes: 35
summary: A sensor publisher and a subscriber look trivial until the link loses packets or the callback is slow. You simulate a 200 Hz IMU publisher, a DDS link and a keep-last subscriber, check the received rate within 1 %, and see what best effort, retransmission and history depth do to rate and latency.
---

## The publisher side

An IMU driver publishes `sensor_msgs/msg/Imu` from a timer (or from the device's data-ready interrupt) at a fixed rate. Every message carries a `header` with a **stamp**, the time the measurement was taken, and a **frame_id**, the frame it is expressed in (lesson 11). Stamp with the sample time, not the publish time: consumers use the stamp to fuse data (Phase 14) and to measure latency.

## What QoS does to the stream

- **Best effort**: a lost packet is gone; the rate drops by the loss fraction but the latency stays low.
- **Reliable**: lost packets are resent, so nothing is lost, but a resent sample arrives late, and with a slow link the writer's history can fill and block.
- **History depth** on the subscriber: with keep-last $N$, when samples arrive faster than the callback runs, the oldest queued ones are overwritten. A deep queue means old data is processed late; depth 1 means the callback always sees the freshest sample.

A callback that takes longer than the period caps the processed rate at $1/c$ and silently drops the rest. The rate a subscriber *receives* is what to check, with `ros2 topic hz` or in a test.

:::figure widget=pubsub caption="Live plot of an illustrative IMU stream at the subscriber. Change loss, reliability, callback time and queue depth; the readout shows the received rate, drops and latency."
:::end

## Worked example

Simulated 10 s of a 200 Hz IMU with 0.2 ms timer jitter and about 1.3 ms of network latency. Latency is measured from the stamp to the end of the callback.

1. Reliable, 1 ms callback, depth 10: 200.0 Hz received in order, within 1 % of the publish rate; median latency 2.21 ms.
2. Best effort with 2 % loss: 195.3 Hz, same latency.
3. Reliable with 2 % loss: all 2000 samples arrive, but resent ones are up to 13.39 ms late.
4. An 8 ms callback with depth 10 processes about 125 Hz (126.0 Hz counted, including the backlog finished after 10 s); 740 samples are overwritten and the median latency grows to 56.93 ms. With depth 1, the same rate but a median latency of 11.95 ms.

## Code it from scratch

:::code file=imu_link.py
```python
import heapq
import numpy as np

def run(rate=200.0, seconds=10.0, reliability="reliable", loss=0.0, cb_ms=1.0, depth=10, seed=0):
    """event simulation of an IMU publisher, a DDS link and a subscriber with keep-last history.
    Returns received messages (seq, stamp, processed time) and drop counts."""
    rng = np.random.default_rng(seed); T = 1.0 / rate
    ev = []                                                    # (time, kind, seq, stamp)
    for k in range(int(seconds * rate)):
        stamp = k * T + rng.normal(0, 0.2e-3)                  # publisher timer with a little jitter
        t, tries = stamp, 0
        while True:                                            # the network: latency, loss, retransmission if reliable
            if rng.random() >= loss: heapq.heappush(ev, (t + 1e-3 + rng.exponential(0.3e-3), "arrive", k, stamp)); break
            if reliability == "best_effort": break
            t += 10e-3; tries += 1                             # reliable: resend after a 10 ms retransmission timeout
    queue, busy_until, got, dropped_queue = [], 0.0, [], 0
    def start_next(now):
        nonlocal busy_until
        seq, stamp = queue.pop(0); busy_until = now + cb_ms * 1e-3
        got.append((seq, stamp, busy_until))                   # latency is measured from stamp to end of callback
        heapq.heappush(ev, (busy_until, "done", -1, 0))
    while ev:
        t, kind, seq, stamp = heapq.heappop(ev)
        if kind == "arrive":
            queue.append((seq, stamp))
            if len(queue) > depth: queue.pop(0); dropped_queue += 1     # keep last N: the oldest is overwritten
        if queue and t >= busy_until - 1e-12: start_next(t)
    return got, dropped_queue

def stats(got, seconds=10.0):
    seqs = [g[0] for g in got]; lat = np.array([g[2] - g[1] for g in got]) * 1e3
    return {"rate": len(got) / seconds, "received": len(got), "in_order": seqs == sorted(seqs),
            "lat_median_ms": float(np.median(lat)), "lat_max_ms": float(lat.max())}

def test_scenarios():
    rows = [("reliable, 1 ms callback, depth 10", dict()),
            ("best effort, 2 % loss", dict(reliability="best_effort", loss=0.02)),
            ("reliable, 2 % loss (retransmitted)", dict(loss=0.02)),
            ("reliable, slow 8 ms callback, depth 10", dict(cb_ms=8.0)),
            ("reliable, slow 8 ms callback, depth 1", dict(cb_ms=8.0, depth=1))]
    out = {}
    for name, kw in rows:
        got, dq = run(**kw); s = stats(got); out[name] = (s, dq)
        print(f"{name:40s} {s['rate']:6.1f} Hz received, {dq:4d} dropped by history, latency median {s['lat_median_ms']:5.2f} ms, max {s['lat_max_ms']:6.2f} ms")
    a = out[rows[0][0]][0]; assert abs(a["rate"] - 200) / 200 < 0.01 and a["in_order"]       # the lesson's check: within 1 %
    b = out[rows[1][0]][0]; assert 190 < b["rate"] < 200
    c = out[rows[2][0]][0]; assert c["received"] == 2000 and c["lat_max_ms"] > 10              # nothing lost, but late
    d, e = out[rows[3][0]][0], out[rows[4][0]][0]
    assert abs(d["rate"] - 125) < 2 and e["lat_median_ms"] < d["lat_median_ms"] / 4            # depth 1 = freshest data

test_scenarios()
print("PASS")
```
:::end

The real nodes in rclpy, for reference (not run by this site's checks; needs a ROS 2 install):

:::code file=imu_nodes_ref.py lang=python
```text
# Reference only, not run by this site's checks; needs a ROS 2 install (for example Jazzy).
import rclpy
from rclpy.node import Node
from rclpy.qos import qos_profile_sensor_data
from sensor_msgs.msg import Imu

class ImuPublisher(Node):
    def __init__(self):
        super().__init__('imu_publisher')
        self.pub = self.create_publisher(Imu, 'imu/data', qos_profile_sensor_data)   # best effort, keep last 5
        self.create_timer(1.0 / 200.0, self.tick)

    def tick(self):
        msg = Imu()
        msg.header.stamp = self.get_clock().now().to_msg()
        msg.header.frame_id = 'imu_link'
        msg.linear_acceleration.z = 9.81
        self.pub.publish(msg)

class ImuSubscriber(Node):
    def __init__(self):
        super().__init__('imu_subscriber')
        self.create_subscription(Imu, 'imu/data', self.cb, qos_profile_sensor_data)

    def cb(self, msg):
        age = self.get_clock().now() - rclpy.time.Time.from_msg(msg.header.stamp)
        self.get_logger().debug(f'az {msg.linear_acceleration.z:.2f}, age {age.nanoseconds / 1e6:.2f} ms')
```
:::end

## In practice

`ros2 topic hz /imu/data` and `ros2 topic bw` measure rate and bandwidth, and `ros2 topic delay` uses header stamps for latency. In C++, avoid allocation in the publishing loop with `rclcpp::LoanedMessage` or preallocated messages, and prefer intra-process communication or shared memory for large data such as images and point clouds.

## Exercises

:::exercise
Your 100 Hz control node subscribes to a 1 kHz IMU with depth 100 and reliable QoS, and only uses the latest sample. What is wrong?
:::solution
If the callback falls behind, it works through up to 100 old samples (0.1 s of stale data). Use depth 1 or a small depth with best effort, or process all queued samples cheaply and keep only the last one.
:::end

:::exercise
Why does a reliable link not guarantee a reliable control loop?
:::solution
Reliability guarantees delivery, not timeliness: a resent sample may arrive after its deadline, and a slow reader can make a reliable writer block. A control loop needs fresh data on time, so it usually prefers best effort with a deadline QoS and handles missing samples.
:::end

## Quiz

:::quiz
- type: num
  q: Maximum processed rate with a 4 ms callback?
  answer: 250
  tol: 0.001
  unit: Hz
  py: "1/4e-3"
  explain: One callback at a time.
- type: num
  q: Expected rate received from 500 Hz with 3 % best-effort loss?
  answer: 485
  tol: 0.002
  unit: Hz
  py: "500*0.97"
  explain: The loss fraction is gone.
- type: num
  q: Age of the oldest sample in a full depth-50 queue of a 200 Hz stream?
  answer: 250
  tol: 0.002
  unit: ms
  py: "50/200*1000"
  explain: Depth times period.
- type: num
  q: Allowed received-rate band for 200 Hz within 1 % (lower edge)?
  answer: 198
  tol: 0.001
  unit: Hz
  py: "200*0.99"
  explain: 1 % of 200 Hz is 2 Hz.
- type: mc
  q: A message's header stamp should be…
  options:
    - the time the measurement was taken
    - the time the message was published
    - the time it was received
    - zero for sensor data
  answer: 0
  explain: Consumers fuse and measure latency against it.
- type: mc
  q: A subscriber that only needs the freshest sample should use…
  options:
    - keep-last with depth 1
    - keep-all history
    - depth 1000
    - transient local durability
  answer: 0
  explain: Old samples are overwritten.
:::end
