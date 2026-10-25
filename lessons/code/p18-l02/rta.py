import math
from functools import reduce

def ll_bound(n):
    """Liu and Layland: n periodic tasks with deadline = period are schedulable under rate-monotonic priorities if U <= n(2^(1/n) - 1)"""
    return n * (2 ** (1 / n) - 1)

def rta(tasks):
    """response-time analysis. tasks = [(C, T)], sorted by priority (shortest period first).
    R_i = C_i + sum over higher-priority j of ceil(R_i / T_j) C_j, iterated to a fixed point"""
    out = []
    for i, (C, T) in enumerate(tasks):
        R = C
        while True:
            Rn = C + sum(math.ceil(R / Tj) * Cj for Cj, Tj in tasks[:i])
            if Rn == R or Rn > T: break
            R = Rn
        out.append(Rn if Rn <= T else None)                               # None: deadline missed
    return out

def simulate(tasks, horizon=None):
    """preemptive fixed-priority scheduling in unit time steps, all tasks released together at t = 0 (the critical instant).
    Returns the worst response time seen per task and the schedule (task index or -1 per time step)."""
    hyper = reduce(lambda a, b: a * b // math.gcd(a, b), [T for _, T in tasks]); horizon = horizon or hyper
    left = [0] * len(tasks); release = [0] * len(tasks); worst = [0] * len(tasks); missed = [False] * len(tasks); sched = []
    for t in range(horizon):
        for i, (C, T) in enumerate(tasks):
            if t % T == 0:
                if left[i] > 0: missed[i] = True
                left[i] = C; release[i] = t
        run = next((i for i in range(len(tasks)) if left[i] > 0), -1)        # highest priority ready task
        sched.append(run)
        if run >= 0:
            left[run] -= 1
            if left[run] == 0: worst[run] = max(worst[run], t + 1 - release[run])
    return [None if m else w for w, m in zip(worst, missed)], sched

def test_bound():
    vals = [round(ll_bound(n), 4) for n in (1, 2, 3, 10)]
    print(f"Liu-Layland bound for n = 1, 2, 3, 10: {vals}; limit ln 2 = {math.log(2):.4f}")
    assert abs(ll_bound(3) - 0.7798) < 1e-4

def test_rta_matches_simulation():
    tasks = [(1, 4), (2, 6), (3, 13)]                                     # illustrative (C, T) in ms, rate-monotonic order
    U = sum(C / T for C, T in tasks); R = rta(tasks); W, sched = simulate(tasks)
    print(f"tasks {tasks}: U = {U:.3f} > bound {ll_bound(3):.3f}, so the bound says nothing")
    print(f"response-time analysis {R}, simulation over the hyperperiod {W}")
    print("first 26 ms:", "".join("ABC"[i] if i >= 0 else "." for i in sched[:26]))
    assert R == W and all(r is not None for r in R)

def test_overload_detected():
    tasks = [(2, 5), (2, 7), (3, 10)]
    U = sum(C / T for C, T in tasks); R = rta(tasks); W, _ = simulate(tasks)
    print(f"tasks {tasks}: U = {U:.3f}; analysis {R}, simulation {W}")
    assert R[-1] is None and W[-1] is None

test_bound()
test_rta_matches_simulation()
test_overload_detected()
print("PASS")
