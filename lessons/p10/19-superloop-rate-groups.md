---
id: p10-l19
minutes: 35
summary: The first firmware everyone writes is a super-loop that calls every task in turn, and it works until one slow task stretches the loop and the control law no longer runs at its rate. You derive loop timing budgets and utilisation, see why the super-loop's period is the sum of all task times, refactor it into rate groups on a 1 ms tick with offsets that spread the slow tasks across ticks, and test that every task runs at exactly its period with every tick inside its budget.
---

## The super-loop

```c
for (;;) { control(); filter(); comms(); logging(); ui(); }
```

Every task runs once per pass, so the loop period is the **sum** of the task times, and it changes whenever any task's time changes. A 1 kHz control law needs a 1 ms period; with five tasks taking 2 ms in total it runs at 500 Hz at best, and with jitter whenever comms or logging take longer. Adding a `delay` at the end doesn't help: it sets a minimum period, not a fixed one.

## Rate groups

Give the firmware a **base tick** from a timer interrupt (lesson 08), say 1 ms, and count ticks. Each task runs in the tick where `tick % period == offset`:

- **1 kHz group**: the control law, every tick;
- **100 Hz group**: the filter, every 10th tick;
- **50 Hz** comms, every 20th; **10 Hz** logging and UI, every 100th.

Each task now runs at an exact multiple of the tick, independent of the others. The constraint moves to a per-tick **budget**: everything that runs in one tick must finish within the tick, or the next one starts late. That's where **offsets** matter: if all the slow tasks fire on tick 0, that one tick is overloaded even though the average load is low. Giving each group a different offset spreads them out.

## Utilisation and the per-tick budget

For tasks with worst-case execution time $C_i$ and period $T_i$, the CPU utilisation is

$$U = \sum_i \frac{C_i}{T_i}.$$

$U \le 1$ is necessary but not sufficient: you also need, for **every tick** $k$,

$$\sum_{i \,:\, k \bmod T_i = \phi_i} C_i \le T_{\text{tick}},$$

and checking every tick over one **hyperperiod** (the least common multiple of the periods) covers all cases, since the pattern repeats. Leave margin: a 70–80 % worst-tick load leaves room for interrupts and for WCET estimates that were optimistic.

:::figure widget=rategroups caption="Task bars per 1 ms tick over 20 ticks. Switch between the super-loop and rate groups, and toggle offsets: without them every slow task lands on tick 0 and overruns it."
:::end

## Worked example

| task | rate | WCET |
|---|---|---|
| control | 1 kHz | 200 µs |
| filter | 100 Hz | 300 µs |
| comms | 50 Hz | 500 µs |
| logging | 10 Hz | 600 µs |
| UI | 10 Hz | 400 µs |

1. Super-loop: $200 + 300 + 500 + 600 + 400 = 2000$ µs, so control runs at 500 Hz. Fail.
2. $U = 0.2 + 0.03 + 0.025 + 0.006 + 0.004 = 0.265$.
3. Rate groups with all offsets 0: tick 0 holds every task, 2000 µs in a 1000 µs tick. Overrun.
4. Offsets 0, 1, 2, 3, 4 for the five tasks: the worst tick is control + logging = 800 µs. Pass, with 20 % margin.
5. Hyperperiod: lcm(1, 10, 20, 100) = 100 ticks.

## Code it from scratch

:::code file=rate_groups.c
```c
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

typedef struct { const char *name; uint32_t period_ticks, offset, wcet_us; uint32_t runs; int64_t last_us; int64_t min_gap, max_gap; } task_t;
#define NT 5
#define TICK_US 1000
static task_t tasks[NT] = {
  {"control", 1, 0, 200, 0, 0, 0, 0}, {"filter", 10, 1, 300, 0, 0, 0, 0}, {"comms", 20, 2, 500, 0, 0, 0, 0},
  {"logging", 100, 3, 600, 0, 0, 0, 0}, {"ui", 100, 4, 400, 0, 0, 0, 0},
};
static void reset_stats(void) { for (int i = 0; i < NT; i++) { tasks[i].runs = 0; tasks[i].last_us = -1; tasks[i].min_gap = 1 << 30; tasks[i].max_gap = 0; } }
static void record(task_t *t, int64_t start_us) {
  if (t->last_us >= 0) { int64_t g = start_us - t->last_us; if (g < t->min_gap) t->min_gap = g; if (g > t->max_gap) t->max_gap = g; }
  t->last_us = start_us; t->runs++;
}

/* the super-loop: run everything, back to back, for `us` microseconds */
static void superloop(int64_t us) {
  int64_t now = 0; reset_stats();
  while (now < us) for (int i = 0; i < NT; i++) { record(&tasks[i], now); now += tasks[i].wcet_us; }
}
/* rate groups on a 1 ms tick; returns the number of overrun ticks and the worst tick load */
static int rate_groups(uint32_t ticks, int use_offsets, uint32_t *worst_us) {
  int overruns = 0; int64_t busy_until = 0; *worst_us = 0; reset_stats();
  for (uint32_t k = 0; k < ticks; k++) {
    int64_t tick_start = (int64_t)k * TICK_US, now = tick_start > busy_until ? tick_start : busy_until;
    uint32_t load = 0;
    for (int i = 0; i < NT; i++) {
      uint32_t off = use_offsets ? tasks[i].offset : 0;
      if (k % tasks[i].period_ticks == off % tasks[i].period_ticks) { record(&tasks[i], now); now += tasks[i].wcet_us; load += tasks[i].wcet_us; }
    }
    if (load > *worst_us) *worst_us = load;
    if (now > tick_start + TICK_US) overruns++;
    busy_until = now;
  }
  return overruns;
}
static uint32_t gcd(uint32_t a, uint32_t b) { while (b) { uint32_t t = a % b; a = b; b = t; } return a; }
#define CHECK(c) do { if (!(c)) { printf("FAIL line %d: %s\n", __LINE__, #c); exit(1); } } while (0)

int main(void) {
  double U = 0; uint32_t H = 1;
  for (int i = 0; i < NT; i++) { U += (double)tasks[i].wcet_us / (tasks[i].period_ticks * TICK_US); H = H / gcd(H, tasks[i].period_ticks) * tasks[i].period_ticks; }
  printf("utilisation %.3f, hyperperiod %u ticks\n", U, H);
  CHECK(U > 0.2649 && U < 0.2651 && H == 100);

  superloop(1000000);
  printf("super-loop: control ran %u times in 1 s (gap %lld us)\n", tasks[0].runs, (long long)tasks[0].max_gap);
  CHECK(tasks[0].max_gap == 2000 && tasks[0].runs == 500);     /* 500 Hz, not 1 kHz */

  uint32_t worst;
  int bad = rate_groups(10 * H, 0, &worst);
  printf("rate groups, no offsets: worst tick %u us, %d overrun ticks\n", worst, bad);
  CHECK(worst == 2000 && bad > 0);

  bad = rate_groups(10 * H, 1, &worst);
  printf("rate groups with offsets: worst tick %u us, %d overrun ticks\n", worst, bad);
  CHECK(worst == 800 && bad == 0);
  for (int i = 0; i < NT; i++) {
    int64_t want = (int64_t)tasks[i].period_ticks * TICK_US;
    printf("  %-8s runs %4u, period %lld..%lld us (want %lld)\n", tasks[i].name, tasks[i].runs, (long long)tasks[i].min_gap, (long long)tasks[i].max_gap, (long long)want);
    CHECK(tasks[i].min_gap == want && tasks[i].max_gap == want);   /* every task meets its period exactly */
    CHECK(tasks[i].runs == 10 * H / tasks[i].period_ticks);
  }
  printf("PASS\n");
  return 0;
}
```
:::end

## Exercises

:::exercise
Logging sometimes takes 3 ms when it flushes to an SD card. What happens in the rate-group design, and how do you fix it?
:::solution
That tick overruns by about 2.2 ms, so the next two control ticks start late: jitter on the control law. Split the flush into chunks of at most a few hundred microseconds spread over several ticks, or move logging into the background (the idle time after each tick's work) with a lower priority than the tick, so the control ISR can preempt it.
:::end

:::exercise
Why does checking one hyperperiod of ticks prove the schedule for all time?
:::solution
Every task's activation pattern repeats with its period, and the hyperperiod is a multiple of all of them, so the set of tasks due on tick $k$ is the same as on tick $k + H$. If no tick in $0 \dots H-1$ overruns, none ever does (given the WCETs hold).
:::end

## Quiz

:::quiz
- type: num
  q: Super-loop period in ms for tasks of 200, 300, 500, 600 and 400 µs?
  answer: 2
  tol: 0.001
  unit: ms
  py: "(200+300+500+600+400)/1000"
  explain: The sum of all task times.
- type: num
  q: Utilisation of those tasks at 1 kHz, 100, 50, 10 and 10 Hz?
  answer: 0.265
  tol: 0.001
  unit: ""
  py: "0.2+300/1e4+500/2e4+600/1e5+400/1e5"
  explain: Σ C/T.
- type: num
  q: Hyperperiod in ticks for periods of 1, 10, 20 and 100 ticks?
  answer: 100
  tol: 0.001
  unit: ticks
  py: "math.lcm(1, 10, 20, 100)"
  explain: Least common multiple.
- type: num
  q: Worst tick load in µs with offsets 0..4 (control 200 µs plus the largest single slow task)?
  answer: 800
  tol: 0.001
  unit: µs
  py: "200 + 600"
  explain: Control plus logging.
- type: mc
  q: Utilisation is 0.27, yet one tick overruns. How?
  options:
    - utilisation was computed wrong
    - several slow tasks are due in the same tick; the per-tick budget is violated even though the average is low
    - the timer is too slow
    - it cannot happen
  answer: 1
  explain: Offsets spread the load.
- type: mc
  q: In a super-loop, what sets the control law's period?
  options:
    - the timer
    - the sum of all task execution times, which varies
    - the slowest task alone
    - the compiler
  answer: 1
  explain: That's its main weakness.
:::end

:::verify
import math
assert math.lcm(1, 10, 20, 100) == 100
assert abs(0.2 + 0.03 + 0.025 + 0.006 + 0.004 - 0.265) < 1e-12
:::end
