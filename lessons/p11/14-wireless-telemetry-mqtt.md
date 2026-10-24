---
id: p11-l14
minutes: 40
summary: Wireless telemetry trades wires for latency that varies, packets that get lost and bandwidth shared with everyone nearby, and MQTT is the small publish and subscribe protocol most robots and sensors use to push readings to a broker. You derive throughput, latency and the cost of retransmission, write MQTT packet encoding, a tiny broker with topic wildcards and a QoS 1 publisher, and test on a simulated lossy link, with no network needed, that 95th-percentile latency stays under target.
---

## Wireless links in numbers

- **BLE** sends data in connection events every *connection interval* (7.5 ms to 4 s, negotiated). Latency is up to one interval plus retries; throughput is a few hundred kbit/s at best. Good for a battery-powered sensor at tens of Hz.
- **Wi-Fi** gives Mbit/s and a few ms of typical latency on a quiet network, but the medium is shared: contention, retries and power-save can produce tails of 100 ms or more.
- Neither is a control-loop bus. Telemetry tolerates late or missing samples; a position loop doesn't.

For a sample to arrive, the one-way latency is serialisation + propagation + queuing + any retransmissions. If a packet is lost with probability $p$ and resent after a timeout $T_{RTO}$, the number of resends is geometric, and the chance a message needs more than $k$ tries is $p^k$. With $p = 2\%$, 2 % of messages arrive at least $T_{RTO}$ late: the **tail** of the latency distribution is set by loss and timeout, not by the median.

## MQTT

MQTT runs over TCP to a **broker**. Clients **publish** messages to a *topic* string such as `robot/1/telemetry`, and **subscribe** to topic filters with wildcards: `+` matches one level (`robot/+/telemetry`), `#` matches everything below (`robot/#`, which also matches `robot`). Publishers and subscribers never know about each other.

Each packet starts with a fixed header: one byte of type and flags, then the *remaining length* as a variable-length integer, 7 bits per byte with the top bit meaning "more bytes follow" (0–127 in one byte, up to 268 435 455 in four). A PUBLISH carries a 2-byte topic length, the topic, a 2-byte packet id for QoS 1, and the payload.

Quality of service:

- **QoS 0**, at most once: fire and forget. Lost packets stay lost.
- **QoS 1**, at least once: the receiver answers PUBACK with the packet id; the sender resends with the DUP flag set until it gets one. Duplicates are possible when the PUBACK is lost, so include a sequence number and drop repeats.
- **QoS 2**, exactly once, costs a four-way handshake; rarely worth it for telemetry.

(Over real TCP, the transport itself retransmits; the simulation below models the combined effect as loss plus a resend timeout.)

:::figure widget=telemetry caption="A live telemetry dashboard fed through a simulated lossy link: the signal, the latency of each sample and the 95th percentile against the target. Raise the packet loss and the resend timeout to watch the tail grow; switch between QoS 0 and QoS 1."
:::end

## Worked example

A robot publishes 16-byte binary samples at 50 Hz to `robot/1/telemetry` at QoS 1.

1. PUBLISH size: 1 + 1 (remaining length 37) + 2 + 17 + 2 + 16 = 39 bytes; with about 54 bytes of TCP/IP/Ethernet headers, 93 bytes per sample, 4.65 kB/s. Negligible on Wi-Fi.
2. The link has 8 ms base latency, exponential jitter with a 4 ms mean, and 2 % loss in each direction; the resend timeout is 100 ms.
3. 95th percentile without loss: $8 + 4\ln 20 = 20.0$ ms. With 2 % loss, about 2 % of samples take more than 108 ms, which sits above the 95th percentile but sets the 99th.
4. Target: 95 % of samples within 30 ms. Met, at both QoS 0 and QoS 1; QoS 1 also delivers every sample.

## Code it from scratch

:::code file=mqtt_telemetry.py
```python
import heapq, math, random, struct

# ---------- MQTT 3.1.1 encoding ----------
def enc_varint(n):
    out = bytearray()
    while True:
        b, n = n % 128, n // 128
        out.append(b | (0x80 if n else 0))
        if not n:
            return bytes(out)

def dec_varint(buf, i=0):
    mult, val = 1, 0
    for k in range(4):
        b = buf[i + k]
        val += (b & 0x7F) * mult
        if not b & 0x80:
            return val, i + k + 1
        mult *= 128
    raise ValueError("malformed remaining length")

def publish(topic, payload, qos=0, pid=0, dup=False):
    t = topic.encode()
    var = struct.pack(">H", len(t)) + t + (struct.pack(">H", pid) if qos else b"")
    body = var + payload
    return bytes([0x30 | (dup << 3) | (qos << 1)]) + enc_varint(len(body)) + body

def parse(pkt):
    ptype, flags = pkt[0] >> 4, pkt[0] & 0x0F
    length, i = dec_varint(pkt, 1)
    body = pkt[i:i + length]
    assert len(body) == length
    if ptype == 3:
        qos = (flags >> 1) & 3
        tl = struct.unpack(">H", body[:2])[0]
        topic = body[2:2 + tl].decode()
        j = 2 + tl
        pid = struct.unpack(">H", body[j:j + 2])[0] if qos else 0
        return {"type": "PUBLISH", "topic": topic, "qos": qos, "pid": pid, "dup": bool(flags & 8), "payload": body[j + (2 if qos else 0):]}
    if ptype == 4:
        return {"type": "PUBACK", "pid": struct.unpack(">H", body)[0]}
    raise ValueError(ptype)

def puback(pid):
    return bytes([0x40, 2]) + struct.pack(">H", pid)

def topic_matches(filt, topic):
    f, t = filt.split("/"), topic.split("/")
    for i, part in enumerate(f):
        if part == "#":
            return True
        if i >= len(t) or (part != "+" and part != t[i]):
            return False
    return len(f) == len(t)

# ---------- a simulated link, broker and clients ----------
class Sim:
    def __init__(self):
        self.t, self.q, self.n = 0.0, [], 0
    def at(self, t, fn, *args):
        self.n += 1
        heapq.heappush(self.q, (t, self.n, fn, args))
    def run(self, until):
        while self.q and self.q[0][0] <= until:
            self.t, _, fn, args = heapq.heappop(self.q)
            fn(*args)

class Link:
    """one direction: base latency + exponential jitter, independent loss"""
    def __init__(self, sim, rng, base=0.008, jitter=0.004, loss=0.02):
        self.sim, self.rng, self.base, self.jitter, self.loss = sim, rng, base, jitter, loss
    def send(self, pkt, deliver):
        if self.rng.random() < self.loss:
            return
        self.sim.at(self.sim.t + self.base + self.rng.expovariate(1 / self.jitter) if self.jitter else self.sim.t + self.base, deliver, pkt)

class Broker:
    def __init__(self, sim):
        self.sim, self.subs = sim, []
        self.to_client = None
    def subscribe(self, filt, deliver):
        self.subs.append((filt, deliver))
    def on_packet(self, pkt):
        p = parse(pkt)
        if p["type"] == "PUBLISH":
            if p["qos"] == 1:
                self.to_client.send(puback(p["pid"]), self.publisher_rx)
            for filt, deliver in self.subs:
                if topic_matches(filt, p["topic"]):
                    deliver(p)                            # dashboard on the broker's LAN: no extra loss

class Publisher:
    def __init__(self, sim, link, qos, rto=0.1):
        self.sim, self.link, self.qos, self.rto = sim, link, qos, rto
        self.pid, self.inflight, self.sent, self.resends = 0, {}, 0, 0
    def publish_sample(self, seq, value):
        payload = struct.pack(">Idf4x", seq, self.sim.t, value)      # 16 bytes: sequence, timestamp, value
        self.sent += 1
        if self.qos == 0:
            self.link.send(publish("robot/1/telemetry", payload), self.broker.on_packet)
            return
        self.pid = self.pid % 65535 + 1
        pid = self.pid
        self.inflight[pid] = payload
        self._send(pid, dup=False)
    def _send(self, pid, dup):
        if pid not in self.inflight:
            return
        self.link.send(publish("robot/1/telemetry", self.inflight[pid], 1, pid, dup), self.broker.on_packet)
        self.sim.at(self.sim.t + self.rto, self._timeout, pid)
    def _timeout(self, pid):
        if pid in self.inflight:
            self.resends += 1
            self._send(pid, dup=True)
    def on_ack(self, pkt):
        self.inflight.pop(parse(pkt)["pid"], None)

class Dashboard:
    def __init__(self, sim):
        self.sim, self.lat, self.seen, self.dups, self.values = sim, {}, set(), 0, {}
    def on_publish(self, p):
        seq, t_sent, value = struct.unpack(">Idf4x", p["payload"])
        if seq in self.seen:
            self.dups += 1                                 # at-least-once: drop repeats by sequence number
            return
        self.seen.add(seq)
        self.lat[seq] = self.sim.t - t_sent
        self.values[seq] = value

def run(qos, seconds=60.0, rate=50.0, loss=0.02, seed=3):
    rng = random.Random(seed)
    sim = Sim()
    up, down = Link(sim, rng, loss=loss), Link(sim, rng, loss=loss)
    broker, pub, dash = Broker(sim), Publisher(sim, up, qos), Dashboard(sim)
    broker.to_client, pub.broker = down, broker
    broker.publisher_rx = pub.on_ack
    broker.subscribe("robot/+/telemetry", dash.on_publish)
    n = int(seconds * rate)
    for k in range(n):
        value = 40 + 5 * math.sin(2 * math.pi * 0.05 * k / rate)               # a slowly varying temperature
        sim.at(k / rate, pub.publish_sample, k, value)
    sim.run(seconds + 5)
    return pub, dash, n

def pct(xs, p):
    s = sorted(xs)
    return s[min(len(s) - 1, int(p / 100 * len(s)))]

def ascii_plot(values, width=60, height=6):
    xs = [values[k] for k in sorted(values)][::max(1, len(values) // width)][:width]
    lo, hi = min(xs), max(xs)
    rows = []
    for r in range(height - 1, -1, -1):
        rows.append("".join("*" if int((x - lo) / (hi - lo + 1e-9) * (height - 1) + 0.5) == r else " " for x in xs))
    return "\n".join(rows)

def test_encoding():
    for n, hexs in ((0, "00"), (127, "7f"), (128, "8001"), (16383, "ff7f"), (16384, "808001"), (268435455, "ffffff7f")):
        assert enc_varint(n).hex() == hexs and dec_varint(enc_varint(n))[0] == n
    pkt = publish("robot/1/telemetry", bytes(16), qos=1, pid=7)
    assert len(pkt) == 39 and pkt[0] == 0x32 and pkt[1] == 37
    p = parse(pkt)
    assert (p["topic"], p["qos"], p["pid"], len(p["payload"])) == ("robot/1/telemetry", 1, 7, 16)
    assert parse(publish("a/b", b"x", 1, 9, dup=True))["dup"] is True
    assert parse(puback(7)) == {"type": "PUBACK", "pid": 7}
    for filt, topic, want in (("robot/+/telemetry", "robot/1/telemetry", True), ("robot/+/telemetry", "robot/1/2/telemetry", False),
                              ("robot/#", "robot", True), ("robot/#", "robot/1/telemetry", True), ("robot/1", "robot/1/x", False),
                              ("+/+", "a/b", True), ("#", "anything/at/all", True)):
        assert topic_matches(filt, topic) == want, (filt, topic)
    print("MQTT: remaining-length vectors, PUBLISH/PUBACK round trip, 39-byte telemetry packet, wildcards ok")

def test_latency():
    target = 0.030
    for qos in (0, 1):
        pub, dash, n = run(qos)
        lat = list(dash.lat.values())
        delivered = len(dash.seen) / n
        p50, p95, p99 = pct(lat, 50), pct(lat, 95), pct(lat, 99)
        print(f"QoS {qos}: delivered {delivered * 100:.2f} %, p50 {p50 * 1e3:.1f} ms, p95 {p95 * 1e3:.1f} ms, "
              f"p99 {p99 * 1e3:.1f} ms, resends {pub.resends}, duplicates dropped {dash.dups}")
        assert p95 < target
        if qos == 0:
            assert 0.97 < delivered < 0.99                 # about 2 % lost for good
        else:
            assert delivered == 1.0 and pub.resends > 0 and p99 > 0.1   # all arrive; the tail is the resend timeout
    print("temperature as received (QoS 1):")
    print(ascii_plot(dash.values))
    clean = 0.008 + 0.004 * math.log(20)
    assert abs(clean - 0.0200) < 1e-4

test_encoding()
test_latency()
print("PASS")
```
:::end

## Exercises

:::exercise
The dashboard shows 95th-percentile latency of 18 ms but the 99.9th is 2 s. Is anything wrong?
:::solution
Probably not a bug: with loss, a few messages need several resends, and TCP's retransmission timeout backs off exponentially, so the far tail is long. If samples older than, say, 200 ms are useless, prefer QoS 0 with a sequence number and accept the gaps, or bound the queue so stale samples are dropped instead of delivered late.
:::end

:::exercise
Why include a sequence number in the payload when MQTT already has packet ids?
:::solution
The packet id belongs to one hop (client to broker) and is reused after acknowledgement; subscribers see the broker's ids, not the publisher's. A sequence number from the source lets the dashboard detect gaps (lost QoS 0 samples), drop duplicates from QoS 1 resends and reorder late arrivals.
:::end

## Quiz

:::quiz
- type: num
  q: Remaining-length bytes for a 200-byte MQTT packet body?
  answer: 2
  tol: 0
  unit: bytes
  py: "len([200 % 128, 200 // 128])"
  explain: Values above 127 need a second byte.
- type: num
  q: 95th percentile in ms of 8 ms + exponential jitter with mean 4 ms?
  answer: 19.98
  tol: 0.001
  unit: ms
  py: "8 + 4*__import__('math').log(20)"
  explain: The exponential's 95th percentile is mean × ln 20.
- type: num
  q: Percentage of messages that need at least two resends with 2 % loss?
  answer: 0.04
  tol: 0.001
  unit: "%"
  py: "0.02**2*100"
  explain: p^k.
- type: num
  q: Size in bytes of a QoS 1 PUBLISH with topic robot/1/telemetry and a 16-byte payload?
  answer: 39
  tol: 0
  unit: bytes
  py: "1 + 1 + 2 + 17 + 2 + 16"
  explain: Fixed header, topic length, topic, packet id, payload.
- type: mc
  q: Which topics does the filter robot/+/telemetry match?
  options:
    - robot/1/telemetry and robot/arm/telemetry
    - robot/telemetry
    - robot/1/2/telemetry
    - every topic under robot
  answer: 0
  explain: + matches exactly one level.
- type: mc
  q: What does QoS 1 guarantee?
  options:
    - at least once delivery, so duplicates are possible
    - exactly once
    - at most once
    - delivery within a deadline
  answer: 0
  explain: Resends after a lost PUBACK create duplicates.
:::end
