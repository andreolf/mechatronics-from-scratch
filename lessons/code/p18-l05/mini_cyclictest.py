import os, time, platform
import numpy as np

def kernel_info():
    """what kind of preemption this kernel was built with"""
    v = platform.uname().version
    rt = os.path.exists("/sys/kernel/realtime") and open("/sys/kernel/realtime").read().strip() == "1"
    model = "PREEMPT_RT" if rt or "PREEMPT_RT" in v else "PREEMPT_DYNAMIC" if "PREEMPT_DYNAMIC" in v else "PREEMPT" if "PREEMPT" in v else "none or voluntary"
    return platform.release(), model

def try_fifo(prio=80):
    """ask for SCHED_FIFO like cyclictest -p80; needs root or CAP_SYS_NICE, so fail gracefully"""
    try:
        os.sched_setscheduler(0, os.SCHED_FIFO, os.sched_param(prio)); return "granted"
    except (PermissionError, OSError, AttributeError) as e:
        return f"not permitted here ({type(e).__name__})"

def wake_latency(n=2000, interval=1e-3, spin=0.0):
    """cyclictest in miniature: sleep until an absolute time, record how late we woke (seconds).
    spin > 0: sleep until `spin` before the target, then busy-wait the rest (hybrid)."""
    lat = np.empty(n); t = time.perf_counter()
    for k in range(n):
        t += interval
        d = t - spin - time.perf_counter()
        if d > 0: time.sleep(d)
        if spin > 0:
            while time.perf_counter() < t: pass
        lat[k] = time.perf_counter() - t
    return lat

def summary(lat):
    us = lat * 1e6
    return {"min": us.min(), "median": np.median(us), "p99": np.percentile(us, 99), "max": us.max()}

def test_kernel_and_priority():
    rel, model = kernel_info()
    print(f"kernel {rel}, preemption model {model}, {os.cpu_count()} cores; SCHED_FIFO: {try_fifo()}")
    assert model in ("PREEMPT_RT", "PREEMPT_DYNAMIC", "PREEMPT", "none or voluntary")

def test_sleep_vs_hybrid():
    s = summary(wake_latency()); h = summary(wake_latency(spin=200e-6))
    fmt = lambda d: ", ".join(f"{k} {v:.0f} us" for k, v in d.items())
    print("plain sleep wake-up latency: " + fmt(s))
    print("sleep then spin for the last 200 us: " + fmt(h))
    print("(machine-dependent: these numbers change from run to run)")
    assert h["median"] < s["median"]                                    # spinning removes the timer-wake cost in the typical case

def test_histogram():
    lat = wake_latency(n=1000) * 1e6
    edges = [0, 25, 50, 100, 200, 500, 1000, np.inf]; counts, _ = np.histogram(lat, edges)
    print("plain sleep histogram (us): " + ", ".join(f"<{e:g}: {c}" for e, c in zip(edges[1:], counts)))
    assert counts.sum() == 1000

test_kernel_and_priority()
test_sleep_vs_hybrid()
test_histogram()
print("PASS")
