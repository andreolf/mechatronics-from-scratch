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
