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
