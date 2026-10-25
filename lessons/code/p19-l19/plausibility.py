import numpy as np

FS = 1000.0                                                     # samples per second
LO, HI = -0.1, 3.3                                              # valid range of the joint angle (rad)
MAX_RATE = 4.0                                                  # fastest physically possible motion (rad/s)
STEP_MAX = MAX_RATE / FS + 0.015                                # per-sample limit plus a margin for 2 mrad sensor noise
XTOL, XN = 0.02, 10                                             # cross-check: disagreement over 0.02 rad for 10 samples
STALE_N = 20                                                    # watchdog: no new sample for 20 ms
BUDGET_MS = 50

class Monitor:
    """range, rate and cross-check monitors for a redundant sensor pair, plus a freshness watchdog per sensor."""
    def __init__(self): self.prev = [None, None]; self.xcount = 0; self.age = [0, 0]; self.last_seq = [-1, -1]
    def step(self, a, b, seq_a, seq_b):
        faults = []
        for k, (v, s) in enumerate(((a, seq_a), (b, seq_b))):
            self.age[k] = 0 if s != self.last_seq[k] else self.age[k] + 1; self.last_seq[k] = s
            if self.age[k] >= STALE_N: faults.append(f"stale {k}")
            if not (LO <= v <= HI): faults.append(f"range {k}")
            if self.prev[k] is not None and abs(v - self.prev[k]) > STEP_MAX: faults.append(f"rate {k}")
            self.prev[k] = v
        self.xcount = self.xcount + 1 if abs(a - b) > XTOL else 0
        if self.xcount >= XN: faults.append("cross-check")
        return faults

def run(fault=None, t_fault=1.0, seconds=3.0, seed=0):
    rng = np.random.default_rng(seed); n = int(seconds * FS); t = np.arange(n) / FS
    truth = 1.5 + 1.0 * np.sin(2 * np.pi * 0.4 * t)                          # joint motion, peak rate 2.5 rad/s
    a = truth + rng.normal(0, 0.002, n); b = truth + rng.normal(0, 0.002, n)
    sa = np.arange(n); sb = np.arange(n); k0 = int(t_fault * FS)
    if fault == "stuck": a[k0:] = a[k0]
    if fault == "offset": a[k0:] += 0.05
    if fault == "drift": a[k0:] += 0.2 * (t[k0:] - t_fault)                # slow drift, 0.2 rad/s
    if fault == "spike": a[k0] += 0.5
    if fault == "open wire": a[k0:] = 3.6                                     # input pulled to the rail
    if fault == "frozen": a[k0:] = a[k0]; sa[k0:] = sa[k0]                  # sensor stopped updating
    bad = np.nonzero(np.abs(a[k0:] - truth[k0:]) > XTOL)[0]                # when the error becomes significant
    k_bad = k0 + (bad[0] if len(bad) else 0) if fault != "frozen" else k0      # a frozen sensor is a fault at once
    m = Monitor()
    for k in range(n):
        f = m.step(a[k], b[k], sa[k], sb[k])
        if f: return (k - k0) / FS * 1000, max(0, k - k_bad) / FS * 1000, f
    return None, None, []

def test_no_false_alarms():
    for seed in range(5): assert run(None, seed=seed)[0] is None
    print("healthy runs (5 seeds, 3 s each): no alarms")

def test_injected_faults():
    for fault in ("stuck", "offset", "drift", "spike", "open wire", "frozen"):
        ms, late, f = run(fault)
        print(f"{fault:10s} detected {ms:5.1f} ms after injection, {late:4.1f} ms after the error exceeded {XTOL} rad, by {', '.join(f)}")
        assert ms is not None and ms >= 0 and late <= BUDGET_MS, fault

test_no_false_alarms()
test_injected_faults()
print("PASS")
