---
id: p11-l10
minutes: 35
summary: CAN lets every node transmit whenever the bus is idle and resolves collisions without losing a bit, because a dominant 0 overrides a recessive 1 on the wire and each node listens while it talks. You derive dominant and recessive levels, bitwise arbitration and why bit rate limits cable length, simulate arbitration among three nodes to show the lowest ID always wins intact, and measure what priority means for latency under load.
---

## Dominant and recessive

A CAN bus is a twisted pair, CANH and CANL, terminated with 120 Ω at each end. A transceiver either drives the pair apart (CANH ≈ 3.5 V, CANL ≈ 1.5 V: a 2 V difference, **dominant**, logic 0) or lets go, and the terminators pull the difference to 0 (**recessive**, logic 1).

Driving always beats letting go. So the bus is a wired AND: if any node sends 0, everyone reads 0. Like RS-485 it's differential and tolerant of ground shifts; unlike RS-485 two nodes driving different bits at once is *normal*, not a fault.

## Bitwise arbitration

There's no master. Any node may start a frame when the bus has been idle. After the start-of-frame bit, each sends its **identifier**, MSB first, and reads the bus back on every bit:

- If it sent 1 (recessive) and reads 0 (dominant), someone with a lower ID is also transmitting. It **stops immediately** and becomes a receiver, then retries when the bus is idle again.
- Otherwise it carries on.

The winner never sees a collision: its frame goes out bit for bit as if it were alone. That's **non-destructive** arbitration, and it means a lower ID is a higher priority, decided in hardware within the first 12 bits (11 ID bits plus RTR, where a data frame's dominant RTR beats a remote request with the same ID).

Priority also shapes latency. The highest-priority message waits at most one frame that had already started (*blocking*) plus its own frame; lower-priority messages also wait behind every higher-priority frame queued in the meantime. The simulation below puts six periodic messages on a 500 kbit/s bus at 82 % load: the worst wait seen grows from 443 µs for 0x100 to about 1.45 ms for 0x600.

## Why the bit rate limits cable length

Arbitration only works if every node sees every other node's bit before it samples, within one bit time. The signal must go from one end to the other and back (the far node's dominant bit has to reach you while you're still in the same bit):

$$2\,(t_{cable} + t_{transceiver}) < t_{sample\ point}.$$

At 1 Mbit/s with the sample point at 75 % (750 ns), 5 ns/m cable and 150 ns per transceiver pair, the cable must be under 45 m. At 125 kbit/s, 570 m. That trade-off is why CAN FD switches to a faster bit rate only *after* arbitration.

:::figure widget=canarb caption="Three nodes start a frame at once. Each bit shows what every node sends and what the bus carries; a node that sends recessive but reads dominant drops out. Change the identifiers to see who wins and at which bit."
:::end

## Worked example

Nodes A, B and C send 0x65A, 0x658 and 0x6F0.

1. In binary: A = 110 0101 1010, B = 110 0101 1000, C = 110 1111 0000.
2. Bits 10–8 are 110 for all three. Bit 7: A and B send 0, C sends 1 and reads 0: **C drops out** at bit 7.
3. Bits 6–2 match for A and B. Bit 1: A sends 1, B sends 0. **A drops out**.
4. B wins with 0x658, the lowest ID. A and C retry after B's frame; A then beats C at bit 7 again.

## Code it from scratch

:::code file=can_arb.py
```python
import heapq, random

def arbitrate(ids, rtr=None, verbose=False):
    """bitwise arbitration on the 11-bit identifier plus RTR; returns (winner index, bus bits, drop-out bit per node)"""
    rtr = rtr or [0] * len(ids)
    fields = [[(i >> b) & 1 for b in range(10, -1, -1)] + [r] for i, r in zip(ids, rtr)]
    active = set(range(len(ids)))
    bus_bits, dropped = [], {}
    for k in range(12):
        bus = min(fields[n][k] for n in active)          # wired AND: any dominant 0 wins
        bus_bits.append(bus)
        for n in sorted(active):
            if fields[n][k] == 1 and bus == 0:           # sent recessive, read dominant: lost
                dropped[n] = k
        active -= set(dropped)
        if verbose:
            print(f"  bit {k:2d}: " + " ".join(str(f[k]) for f in fields) + f"  bus {bus}  active {sorted(active)}")
    assert len(active) == 1 or len(set(ids[n] for n in active)) == 1, "two nodes sent the same ID"
    return min(active), bus_bits, dropped

def max_cable_m(bitrate, sample_point=0.75, ns_per_m=5.0, transceiver_ns=150.0):
    budget_ns = sample_point / bitrate * 1e9
    return (budget_ns / 2 - transceiver_ns) / ns_per_m

def test_worked_example():
    ids = [0x65A, 0x658, 0x6F0]
    w, bus, dropped = arbitrate(ids, verbose=True)
    assert w == 1 and dropped == {2: 3, 0: 9}            # field index 3 = ID bit 7, index 9 = ID bit 1
    value = int("".join(map(str, bus[:11])), 2)
    assert value == 0x658                                # the bus carried the winner's ID, intact
    w2, _, _ = arbitrate([0x65A, 0x6F0])
    assert w2 == 0
    print("worked example: 0x658 wins; 0x6F0 drops at ID bit 7, 0x65A at ID bit 1")

def test_lowest_id_always_wins():
    rng = random.Random(4)
    for _ in range(20000):
        ids = rng.sample(range(0x800), 3)
        w, bus, _ = arbitrate(ids)
        assert ids[w] == min(ids)
        assert int("".join(map(str, bus[:11])), 2) == min(ids)
    for a in range(0, 0x800, 3):                          # a data frame beats a remote frame with the same ID
        w, _, _ = arbitrate([a, a], rtr=[1, 0])
        assert w == 1
    print("20000 random 3-node contests: the lowest ID always wins, and the bus carries it unchanged")

def test_cable_length():
    l1m, l125k = max_cable_m(1e6), max_cable_m(125e3)
    print(f"max cable: {l1m:.0f} m at 1 Mbit/s, {l125k:.0f} m at 125 kbit/s")
    assert abs(l1m - 45) < 1e-9 and abs(l125k - 570) < 1e-9

def bus_latency(messages, bitrate=500e3, frame_bits=111, seconds=2.0, seed=0):
    """messages: (id, period_s). Each is queued with a random phase; the bus sends the lowest queued ID when idle."""
    rng = random.Random(seed)
    t_frame = frame_bits / bitrate
    events = []
    for mid, period in messages:
        t = rng.uniform(0, period)
        while t < seconds:
            heapq.heappush(events, (t, mid))
            t += period
    queue, lat, t_bus = [], {m: [] for m, _ in messages}, 0.0
    while events or queue:
        if not queue:
            t_bus = max(t_bus, events[0][0])
        while events and events[0][0] <= t_bus:          # everything queued before the bus goes idle joins arbitration
            t, mid = heapq.heappop(events)
            heapq.heappush(queue, (mid, t))
        mid, t_q = heapq.heappop(queue)
        t_bus += t_frame
        lat[mid].append(t_bus - t_q)
    load = sum(t_frame / p for _, p in messages)
    return lat, load, t_frame

def test_priority_latency():
    msgs = [(0x100, 0.001), (0x200, 0.002), (0x300, 0.002), (0x400, 0.005), (0x500, 0.002), (0x600, 0.001)]
    worst = {}
    for seed in range(40):                               # many random phasings, keep the worst seen
        lat, load, t_frame = bus_latency(msgs, seconds=0.1, seed=seed)
        for m, v in lat.items():
            worst[m] = max(worst.get(m, 0), max(v))
    print(f"bus load {load * 100:.0f} %, frame {t_frame * 1e6:.0f} us; worst latency per ID (us): " +
          ", ".join(f"{m:#x} {worst[m] * 1e6:.0f}" for m, _ in msgs))
    assert worst[0x100] <= 2 * t_frame + 1e-12           # at most one frame of blocking plus its own frame
    ordered = [worst[m] for m, _ in sorted(msgs)]
    assert ordered == sorted(ordered)                    # lower priority, longer worst-case wait
    assert worst[0x600] > 3 * worst[0x100]

test_worked_example()
test_lowest_id_always_wins()
test_cable_length()
test_priority_latency()
print("PASS")
```
:::end

## Exercises

:::exercise
Two nodes on your bus were both configured to send ID 0x123 with different data. What happens?
:::solution
Both win arbitration together, then their data fields differ. At the first differing bit, the node sending recessive reads dominant, which outside arbitration is a **bit error**: it sends an error frame, both retransmit and collide again. The bus fills with error frames until one node goes error-passive or bus-off. Unique IDs per message source are a hard rule in CAN.
:::end

:::exercise
Why does the highest-priority message still wait up to one frame?
:::solution
Arbitration only happens at the start of a frame. If a low-priority frame has just started, nobody can interrupt it, so the urgent message waits for it to finish (blocking), about 222 µs for an 8-byte frame at 500 kbit/s, and then wins the next arbitration.
:::end

## Quiz

:::quiz
- type: num
  q: Maximum cable length in m at 500 kbit/s (75 % sample point, 5 ns/m, 150 ns transceivers)?
  answer: 120
  tol: 0.001
  unit: m
  py: "(0.75/500e3*1e9/2 - 150)/5"
  explain: The round trip must fit before the sample point.
- type: num
  q: Duration in µs of a 111-bit frame at 500 kbit/s?
  answer: 222
  tol: 0.001
  unit: µs
  py: "111/500e3*1e6"
  explain: Two microseconds per bit.
- type: num
  q: Bus load in percent from one 111-bit frame every 1 ms at 500 kbit/s?
  answer: 22.2
  tol: 0.001
  unit: "%"
  py: "111/500e3/1e-3*100"
  explain: Frame time over period.
- type: num
  q: At which identifier bit (10 = MSB) does 0x6F0 lose to 0x658?
  answer: 7
  tol: 0
  py: "max(b for b in range(11) if ((0x6F0 ^ 0x658) >> b) & 1)"
  explain: The first bit where they differ, counting from the MSB.
- type: mc
  q: What is a dominant bit?
  options:
    - logic 0, driven, overrides recessive
    - logic 1, driven
    - the idle level
    - an error flag
  answer: 0
  explain: Recessive is the undriven 1.
- type: mc
  q: Why is CAN arbitration called non-destructive?
  options:
    - the winning frame continues unchanged; the losers just stop
    - all frames are retransmitted
    - nodes can't collide
    - the bus is never shared
  answer: 0
  explain: No bandwidth is lost to the collision.
:::end
