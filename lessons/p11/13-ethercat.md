---
id: p11-l13
minutes: 40
summary: EtherCAT sends one Ethernet frame through every slave in a line and back, and each slave reads its outputs and writes its inputs into the frame as it streams past, so a whole machine is updated in one frame time plus a fraction of a microsecond per slave. You derive the cycle-time formula and how distributed clocks remove the propagation delay, simulate a chain of slaves exchanging process data and synchronising their clocks, and test the cycle time against the formula.
---

## Processing on the fly

Ordinary Ethernet with one frame per device would spend most of its time on headers and switch delays. EtherCAT turns the network into one big shift register:

- The master sends a standard Ethernet frame (EtherType 0x88A4) into the first slave.
- Each slave's EtherCAT controller (ESC) forwards the frame to the next slave **while it's still arriving** (cut-through), reading the bytes addressed to it and inserting its own data on the fly, with a fixed delay of well under a microsecond.
- The last slave loops the frame back; it returns through every slave (on the other wire pair of the same cable) to the master.

A **datagram** inside the frame addresses a region of a logical process image. With one LRW (logical read-write) datagram, every slave's outputs and inputs travel in one frame. Each slave that does its part increments a **working counter** (WKC), so the master knows how many slaves actually processed the data: 3 per slave for LRW (1 for reading, 2 for writing).

## The cycle time

At 100 Mbit/s, a byte takes 80 ns. A frame has 38 bytes of Ethernet overhead (preamble 8, header 14, FCS 4, interframe gap 12), a 2-byte EtherCAT header, and for each datagram a 10-byte header plus its data plus a 2-byte WKC, with the payload padded to at least 46 bytes. Because every slave cuts through, the delays add to the head of the frame only once:

$$T_{cycle} \ge T_{frame} + N p_f + (N - 1)\, p_r + 2\sum_k c_k,$$

where $p_f$ and $p_r$ are each slave's delays on the way out and back (the last slave only loops the frame round), and $c_k$ is the cable delay of hop $k$ at about 5 ns/m. The lesson uses $p_f = 0.6$ µs and $p_r = 0.1$ µs as illustrative values; real ones depend on the slave controller and come from its datasheet.

## Distributed clocks

Updating the process data in one frame isn't the same as acting at the same moment: the last slave sees the frame tens of microseconds after the first. For multi-axis motion all drives must sample and apply set-points on a common time base, so EtherCAT gives every slave a 64-bit clock with 1 ns units and synchronises them:

1. The master sends a frame that latches each slave's local clock at its ports, going out ($a_i$) and coming back ($e_i$). The loop time $e_i - a_i$ uses one clock, so its unknown offset cancels.
2. The difference of two neighbours' loop times is $2c + p_f + p_r$, which gives each hop's cable delay, and the delay from the first slave to slave $i$:

$$a_i - a_0 = \frac{(e_0 - a_0) - (e_i - a_i)}{2} + i\,\frac{p_f - p_r}{2}.$$

3. The master copies the reference (first slave) clock into every slave, and each adds its computed delay. Clocks then agree to tens of nanoseconds, and drift is trimmed continuously afterwards.

:::figure widget=ethercat caption="One EtherCAT frame passing through a chain of slaves and back, each inserting its inputs as it streams through. Change the number of slaves, bytes per slave and cable length to see the cycle time and its parts."
:::end

## Worked example

Ten I/O terminals with 2 bytes each, 1 m cables.

1. Payload: 2 + 10 + 20 + 2 = 34 bytes, padded to 46. Frame: 46 + 38 = 84 bytes = 6.72 µs.
2. Slave delays: 10 × 0.6 + 9 × 0.1 = 6.9 µs. Cable: 2 × 10 × 5 ns = 0.1 µs.
3. Minimum cycle: 13.72 µs.
4. Sixty servo drives with 8 bytes out and 8 in: payload 2 + 10 + 960 + 2 = 974 bytes, frame 1012 bytes = 81.0 µs, plus 41.9 µs of slave delay and 0.6 µs of cable: about 123.5 µs, so a 125 µs (8 kHz) cycle is just possible and 250 µs is comfortable.

## Code it from scratch

:::code file=ethercat.py
```python
import random

BYTE_NS = 80.0                      # 100 Mbit/s
ETH_OVERHEAD = 8 + 14 + 4 + 12      # preamble, header, FCS, interframe gap
P_FWD, P_RET = 600.0, 100.0         # ns per slave, illustrative
CABLE_NS_PER_M = 5.0

def frame_bytes(data_per_slave):
    payload = 2 + 10 + sum(data_per_slave) + 2            # EtherCAT header, one LRW datagram, WKC
    return max(payload, 46) + ETH_OVERHEAD

def cycle_formula(data_per_slave, cables_m):
    n = len(data_per_slave)
    return frame_bytes(data_per_slave) * BYTE_NS + n * P_FWD + (n - 1) * P_RET + 2 * sum(cables_m) * CABLE_NS_PER_M

class Slave:
    def __init__(self, idx, nbytes, offset_ns):
        self.idx, self.nbytes = idx, nbytes
        self.offset = offset_ns                            # local clock = true time + offset
        self.inputs = bytes((idx * 7 + k) & 0xFF for k in range(nbytes))
        self.outputs = None
        self.a = self.e = None                             # latched port times (local clock)

    def local(self, t):
        return t + self.offset

def run_frame(slaves, cables_m, outputs, t_send=0.0, quantum=10.0):
    """simulate one LRW frame; cables_m[0] is master to slave 0. Returns (tail arrival time at master, image, wkc)."""
    image = bytearray(b"".join(outputs))                  # outputs for each slave, laid out in order
    offsets, pos = [], 0
    for s in slaves:
        offsets.append(pos); pos += s.nbytes
    wkc = 0
    t = t_send
    heads = []
    for s, c in zip(slaves, cables_m):                    # outbound: head arrives, slave cuts through
        t += c * CABLE_NS_PER_M
        heads.append(t)
        s.a = quantum * int(s.local(t) // quantum)        # 10 ns timestamp resolution
        o = offsets[slaves.index(s)]
        s.outputs = bytes(image[o:o + s.nbytes])          # read my outputs on the fly ...
        image[o:o + s.nbytes] = s.inputs                  # ... and write my inputs in their place
        wkc += 3
        t += P_FWD
    t_back = t                                           # the last slave loops the frame back
    slaves[-1].e = quantum * int(slaves[-1].local(t_back) // quantum)
    for i in range(len(slaves) - 1, 0, -1):              # return path: cable, then the previous slave
        t_back += cables_m[i] * CABLE_NS_PER_M + P_RET
        s = slaves[i - 1]
        s.e = quantum * int(s.local(t_back) // quantum)   # head leaves port 0 on the way back
    t_back += cables_m[0] * CABLE_NS_PER_M
    tail = t_back + frame_bytes([s.nbytes for s in slaves]) * BYTE_NS
    return tail - t_send, bytes(image), wkc, heads

def sync_clocks(slaves):
    """distributed clocks: compute each slave's delay from slave 0, then set its offset correction"""
    loop0 = slaves[0].e - slaves[0].a
    corr = []
    for i, s in enumerate(slaves):
        delay = (loop0 - (s.e - s.a)) / 2 + i * (P_FWD - P_RET) / 2
        # slave 0's clock read at a_0 is the reference; slave i should read ref + delay at a_i
        corr.append((slaves[0].a + delay) - s.a)
    return corr

def test_cycle_time():
    rng = random.Random(1)
    for n, per in ((10, 2), (60, 16), (25, 4), (1, 1)):
        cables = [rng.uniform(0.3, 30.0) for _ in range(n)]
        slaves = [Slave(i, per, 0.0) for i in range(n)]
        outs = [bytes([0xA0 + (i & 0x0F)] * per) for i in range(n)]
        t, image, wkc, _ = run_frame(slaves, cables, outs)
        f = cycle_formula([per] * n, cables)
        assert abs(t - f) < 1e-6, (n, t, f)
        assert wkc == 3 * n
        assert image == b"".join(s.inputs for s in slaves)                 # every slave's inputs came back
        assert all(s.outputs == outs[i] for i, s in enumerate(slaves))     # and each got its outputs
        print(f"{n:3d} slaves x {per:2d} bytes: frame {frame_bytes([per] * n)} B, cycle {t / 1e3:7.2f} us (formula {f / 1e3:7.2f})")
    ex = cycle_formula([2] * 10, [1.0] * 10)
    assert abs(ex - 13720) < 1e-6
    big = cycle_formula([16] * 60, [1.0] * 60)
    assert 123e3 < big < 124e3

def test_distributed_clocks():
    rng = random.Random(8)
    n = 50
    cables = [rng.uniform(0.5, 50.0) for _ in range(n)]
    slaves = [Slave(i, 4, rng.uniform(-1e9, 1e9)) for i in range(n)]
    run_frame(slaves, cables, [bytes(4)] * n)
    corr = sync_clocks(slaves)
    # after correction, every slave's clock should read the same value at the same true instant
    t_true = 5e6
    ref = slaves[0].local(t_true) + corr[0]
    errs = [abs(s.local(t_true) + corr[i] - ref) for i, s in enumerate(slaves)]
    naive = [abs(s.local(t_true) + ((slaves[0].a) - s.a) - ref) for s in slaves]   # copy time, ignore delay
    print(f"distributed clocks over {n} slaves: worst error {max(errs):.0f} ns with delay compensation, "
          f"{max(naive) / 1e3:.1f} us without")
    assert max(errs) <= 20 and max(naive) > 30e3

test_cycle_time()
test_distributed_clocks()
print("PASS")
```
:::end

## Exercises

:::exercise
Your EtherCAT master reports WKC 147 instead of the expected 150 for 50 slaves on an LRW. What does it tell you?
:::solution
Three working-counter increments are missing: one slave didn't process the datagram at all (for example it's in the wrong state, not yet in OPERATIONAL, or its mapping is wrong). The frame still came back, so the cabling is fine. The master should treat that cycle's data as invalid for that slave.
:::end

:::exercise
Why does the distributed-clock calculation need the slaves' forward and return delays to be known, when it can measure the cable delay?
:::solution
The loop-time difference between neighbours contains $2c + p_f + p_r$: it can't tell cable from processing. The delay the slaves actually need is on the outbound path, $c + p_f$. Knowing $p_f$ and $p_r$ (fixed by the ESC hardware) splits the measurement correctly; assuming they're equal would leave an error of $(p_f - p_r)/2$ per hop.
:::end

## Quiz

:::quiz
- type: num
  q: Time in µs to send a 1012-byte frame at 100 Mbit/s?
  answer: 80.96
  tol: 0.001
  unit: µs
  py: "1012*80/1e3"
  explain: 80 ns per byte.
- type: num
  q: Minimum cycle in µs for 10 slaves × 2 bytes, 1 m cables, with the lesson's delays?
  answer: 13.72
  tol: 0.001
  unit: µs
  py: "(84*80 + 10*600 + 9*100 + 2*10*5)/1e3"
  explain: Frame + slave delays + cable both ways.
- type: num
  q: Expected working counter for an LRW to 20 slaves that all respond?
  answer: 60
  tol: 0
  py: "3*20"
  explain: 1 for read + 2 for write per slave.
- type: num
  q: Round-trip cable delay in ns over 100 m of total cable?
  answer: 1000
  tol: 0
  unit: ns
  py: "2*100*5"
  explain: Out and back at 5 ns/m.
- type: mc
  q: What does "processing on the fly" mean in EtherCAT?
  options:
    - each slave reads and writes its data while the frame streams through, without storing the whole frame
    - the master processes all frames
    - slaves send their own frames
    - frames are compressed
  answer: 0
  explain: Cut-through with a fixed delay.
- type: mc
  q: Why can the loop time e_i − a_i be measured even though slave clocks have unknown offsets?
  options:
    - both timestamps come from the same slave's clock, so the offset cancels
    - the offsets are zero
    - the master measures it
    - it can't
  answer: 0
  explain: Only differences within one clock are used.
:::end
