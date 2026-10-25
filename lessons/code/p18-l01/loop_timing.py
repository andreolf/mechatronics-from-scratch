import time
import numpy as np

def timing_stats(stamps, period, deadline=None):
    """statistics of a periodic loop from its wake-up timestamps (seconds):
    periods, jitter (deviation from the nominal period), and deadline misses"""
    stamps = np.asarray(stamps, float); dt = np.diff(stamps)
    jit = dt - period; deadline = period if deadline is None else deadline
    return {"n": len(dt), "mean": dt.mean(), "std": dt.std(), "min": dt.min(), "max": dt.max(),
            "p99": np.percentile(dt, 99), "max_abs_jitter": np.abs(jit).max(),
            "misses": int((dt > period + deadline).sum())}                # an iteration started more than a deadline late

def utility(kind, lateness, deadline=1.0):
    """value of a result delivered `lateness` after its deadline: hard (failure), firm (worthless), soft (degrades)"""
    if lateness <= 0: return 1.0
    if kind == "hard": return -np.inf                                  # missing it is a system failure
    if kind == "firm": return 0.0                                      # a late result is simply discarded
    return max(0.0, 1.0 - lateness / deadline)                         # soft: value decays

def run_loop(period=1e-3, n=500, busy=2e-4):
    """a periodic loop on this machine: do 'work', then sleep until the next absolute release time"""
    stamps = []; t_next = time.perf_counter()
    for _ in range(n):
        stamps.append(time.perf_counter())
        t0 = time.perf_counter()
        while time.perf_counter() - t0 < busy: pass                     # stand-in for the control computation
        t_next += period
        delay = t_next - time.perf_counter()
        if delay > 0: time.sleep(delay)
    return np.array(stamps)

def test_stats_on_known_data():
    rng = np.random.default_rng(0); period = 1e-3
    dt = period + rng.normal(0, 20e-6, 10000); dt[[100, 5000]] = [3.5e-3, 2.4e-3]   # two injected overruns
    st = timing_stats(np.r_[0, np.cumsum(dt)], period)
    print(f"synthetic 1 kHz loop: mean {1e3 * st['mean']:.4f} ms, std {1e6 * st['std']:.1f} us, max {1e3 * st['max']:.2f} ms, "
          f"p99 {1e3 * st['p99']:.4f} ms, max |jitter| {1e6 * st['max_abs_jitter']:.0f} us, deadline misses {st['misses']}")
    assert np.isclose(st["mean"], dt.mean()) and np.isclose(st["std"], dt.std()) and st["misses"] == 2
    assert np.isclose(st["max_abs_jitter"], 2.5e-3)

def test_utility():
    vals = [(k, utility(k, 0.5)) for k in ("hard", "firm", "soft")]
    print("half a deadline late: " + ", ".join(f"{k} {v}" for k, v in vals))
    assert vals[0][1] == -np.inf and vals[1][1] == 0 and vals[2][1] == 0.5

def test_measure_this_machine():
    st = timing_stats(run_loop(), 1e-3)
    print(f"this machine, 500 iterations at 1 kHz with time.sleep: mean {1e3 * st['mean']:.4f} ms, std {1e6 * st['std']:.0f} us, "
          f"worst {1e3 * st['max']:.3f} ms, misses {st['misses']} (numbers vary from run to run and machine to machine)")
    assert abs(st["mean"] - 1e-3) < 2e-4                                 # absolute release times keep the average rate

test_stats_on_known_data()
test_utility()
test_measure_this_machine()
print("PASS")
