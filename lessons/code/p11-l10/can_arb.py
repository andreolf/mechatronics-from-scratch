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
