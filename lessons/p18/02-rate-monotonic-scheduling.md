---
id: p18-l02
minutes: 40
summary: Before deploying periodic tasks you can prove they will meet their deadlines. You derive the Liu-Layland utilisation bound for rate-monotonic scheduling, implement exact response-time analysis, check it against a preemptive scheduler simulation over the hyperperiod, and catch a task set that looks fine on average but misses.
---

## Fixed priorities by rate

Give each periodic task a fixed priority, and let the highest-priority ready task run, preempting lower ones. **Rate-monotonic** (RM) assignment gives the shortest period the highest priority. For independent tasks with deadlines equal to their periods, it is optimal among fixed-priority assignments: if any fixed assignment works, RM does.

## The utilisation bound

The processor utilisation is $U = \sum_i C_i/T_i$. $U > 1$ is impossible. Liu and Layland (1973) proved that $n$ tasks are always schedulable under RM if

$$U \le n\left(2^{1/n} - 1\right),$$

which is 1 for one task, 0.828 for two, 0.780 for three and tends to $\ln 2 = 0.693$. The test is **sufficient, not necessary**: a set above the bound may still be schedulable, and you need an exact test to find out.

## Response-time analysis

The worst response time of task $i$ happens when it is released together with all higher-priority tasks (the **critical instant**). It then has to wait for its own work plus every higher-priority job released before it finishes:

$$R_i = C_i + \sum_{j < i} \left\lceil \frac{R_i}{T_j} \right\rceil C_j.$$

$R_i$ appears on both sides; iterate from $R_i = C_i$ until it stops changing (schedulable if $R_i \le T_i$) or exceeds $T_i$ (deadline missed). This is exact for this task model and extends to blocking (lesson 04) and release jitter.

:::figure widget=rmsgantt caption="A rate-monotonic schedule of three illustrative tasks, all released at t = 0. Change execution times and periods; the readout compares utilisation with the Liu-Layland bound and the response-time analysis with each task's deadline."
:::end

## Worked example

Illustrative tasks A $(C, T) = (1, 4)$, B $(2, 6)$, C $(3, 13)$ in milliseconds.

1. Utilisation $1/4 + 2/6 + 3/13 = 0.814$, above the bound 0.780 for three tasks, so the bound alone proves nothing.
2. Response-time analysis: $R_A = 1$; $R_B = 2 + \lceil 3/4 \rceil = 3$; for C, $3 \to 6 \to 7 \to 9 \to 10 \to 10$. So $R = (1, 3, 10)$, all within their periods: schedulable.
3. A simulation of the hyperperiod (156 ms) finds the same worst response times, $(1, 3, 10)$. The first 26 ms run `ABBCACBBAC..ABBCACBBAC..AB` (dots are idle).
4. Tasks $(2, 5)$, $(2, 7)$, $(3, 10)$ have $U = 0.986 < 1$, yet the third task misses its deadline: both the analysis and the simulation show it.

## Code it from scratch

:::code file=rta.py
```python
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
```
:::end

## In practice

This analysis needs WCETs and assumes nothing else steals the processor: interrupts, blocking on shared resources (lesson 04) and the operating system all have to be added as extra terms. Tools such as MAST and Cheddar automate it; on a Linux robot, critical loops get high `SCHED_FIFO` priorities in rate-monotonic order (lesson 05).

## Exercises

:::exercise
Two tasks, $(C, T) = (2, 5)$ and $(4, 7)$. Check them with the bound and with response-time analysis.
:::solution
$U = 0.4 + 0.571 = 0.971 > 0.828$, inconclusive. $R_2$: $4 \to 4 + 2\lceil 4/5\rceil = 6 \to 4 + 2\lceil 6/5 \rceil = 8 > 7$. The second task misses.
:::end

:::exercise
Why release all tasks at the same time in the simulation?
:::solution
For fixed-priority tasks, simultaneous release is the critical instant: it gives every task its worst response time. Simulating from it over one hyperperiod therefore covers the worst case.
:::end

## Quiz

:::quiz
- type: num
  q: Liu-Layland bound for 2 tasks?
  answer: 0.8284
  tol: 0.002
  py: "2*(2**0.5-1)"
  explain: n(2^(1/n) - 1).
- type: num
  q: Utilisation of tasks (1, 5), (2, 10) and (3, 20)?
  answer: 0.55
  tol: 0.002
  py: "1/5+2/10+3/20"
  explain: Sum of C/T.
- type: num
  q: Response time of the lowest-priority task in (1, 4), (2, 5), (1, 10)?
  answer: 4
  tol: 0.001
  py: "4"
  explain: 1 → 4 → 1 + 1 + 2 = 4.
- type: num
  q: Hyperperiod of tasks with periods 4, 6 and 10?
  answer: 60
  tol: 0.001
  py: "math.lcm(4,6,10)"
  explain: The least common multiple.
- type: mc
  q: A task set with U = 0.9 and three tasks under rate-monotonic scheduling…
  options:
    - may or may not be schedulable; run the exact test
    - is never schedulable
    - is always schedulable
    - needs earliest-deadline-first
  answer: 0
  explain: The bound is sufficient, not necessary.
- type: mc
  q: Rate-monotonic scheduling gives the highest priority to…
  options:
    - the task with the shortest period
    - the task with the longest execution time
    - the task released first
    - the most important task
  answer: 0
  explain: Priority by rate.
:::end
