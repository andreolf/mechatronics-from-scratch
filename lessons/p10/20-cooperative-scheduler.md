---
id: p10-l20
minutes: 40
summary: A time-triggered cooperative scheduler runs every task from a fixed table on a periodic tick, never preempts, and so is predictable enough to analyse completely before it ships. You derive the static schedule over the hyperperiod and the check that makes it valid, implement a table-driven dispatcher with per-task budgets and overrun detection, and test that an injected slow task is detected, logged with its tick and task id, and handled without breaking the other tasks' periods.
---

## Time-triggered, cooperative

In a **time-triggered** (TT) design, nothing happens because an event arrived; everything happens because the clock says it's time. Inputs are polled at known instants, tasks run at known instants, outputs are written at known instants. **Cooperative** means tasks are never preempted: each runs to completion and returns, so there's no shared-data race between tasks (lesson 10), only with interrupts. The price is that every task must be short, and a task that runs too long delays everything after it. So the scheduler's most important job besides dispatching is **detecting overruns**.

This style, popularised for small embedded systems by Michael Pont's work on time-triggered patterns, is common in safety-related firmware because its timing can be verified offline.

## The static table

Each task has a period $T_i$ and an offset $\phi_i$ in ticks, and a worst-case execution time $C_i$. Over the hyperperiod $H = \text{lcm}(T_i)$ the scheduler's behaviour is a fixed table: in tick $k$ run tasks $\{i : (k - \phi_i) \bmod T_i = 0\}$, in table order. Before shipping, check every tick:

$$\sum_{i \text{ due in } k} C_i + C_{\text{dispatcher}} \le T_{\text{tick}} \quad \text{for } k = 0, \dots, H-1.$$

## Overrun detection

Two complementary checks:

1. **Tick overrun**: the tick ISR increments a counter; the dispatcher handles one tick at a time. If the ISR finds the previous tick's work still unfinished (the dispatcher hasn't caught up), the tick overran. Log it.
2. **Task budget**: the dispatcher timestamps each task (with a free-running timer, lesson 08) and compares its duration with its budget $C_i$. This names the culprit.

Then a **policy**: log and continue (skip the missed ticks so the schedule realigns with the clock), switch to a degraded mode, or stop and let the watchdog (lesson 15) reset. Never silently "catch up" by running the missed ticks back to back: that bunches the control law's samples.

:::figure widget=ttgantt caption="Gantt chart of a static schedule over 20 ticks. Make one task overrun at a chosen tick: the overrun is flagged red, the following tick is skipped, and the log lists the tick and task."
:::end

## Worked example

Tick 1 ms; tasks A (period 1, offset 0, 250 µs), B (5, 1, 400 µs), C (10, 2, 500 µs), D (20, 3, 300 µs), dispatcher 20 µs.

1. $H = \text{lcm}(1, 5, 10, 20) = 20$ ticks.
2. Worst tick: tick 2 or 12 (A + C) = 750 + 20 = 770 µs, or tick 11 (A + B) = 670 µs. All under 1000 µs.
3. $U = 0.25 + 0.08 + 0.05 + 0.015 = 0.395$, plus 2 % for the dispatcher.
4. If C takes 900 µs at tick 12, that tick needs up to 20 + 250 + 900 = 1170 µs. The budget check logs (tick 12, task C, 400 µs over), and when tick 13's interrupt arrives the dispatcher is still busy, so tick 13 is logged as a tick overrun and skipped. Tick 14 starts on time. (In the simulation A takes 240 µs, so the tick overrun is 160 µs.)

## Code it from scratch

:::code file=tt_scheduler.c
```c
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

#define TICK_US 1000
#define DISPATCH_US 20
typedef struct { char name; uint32_t period, offset, budget_us; uint32_t runs; int64_t last_start; } task_t;
static task_t tasks[] = { {'A', 1, 0, 250, 0, -1}, {'B', 5, 1, 400, 0, -1}, {'C', 10, 2, 500, 0, -1}, {'D', 20, 3, 300, 0, -1} };
#define NT (int)(sizeof tasks / sizeof tasks[0])

typedef struct { uint32_t tick; char task; int32_t over_us; } log_t;
static log_t logbuf[32]; static int n_log;
static void log_overrun(uint32_t tick, char task, int32_t over) { if (n_log < 32) logbuf[n_log++] = (log_t){tick, task, over}; }

/* simulated execution time of a task; one fault injected for the test */
static uint32_t inject_tick = 0xFFFFFFFFu; static char inject_task; static uint32_t inject_us;
static uint32_t exec_time(const task_t *t, uint32_t tick) { return (tick == inject_tick && t->name == inject_task) ? inject_us : t->budget_us - 10; }

static uint32_t gcd(uint32_t a, uint32_t b) { while (b) { uint32_t r = a % b; a = b; b = r; } return a; }
static int due(const task_t *t, uint32_t k) { return k >= t->offset && (k - t->offset) % t->period == 0; }

/* offline check of the static table: every tick of the hyperperiod fits its budget */
static uint32_t check_table(uint32_t *hyper) {
  uint32_t H = 1, worst = 0;
  for (int i = 0; i < NT; i++) H = H / gcd(H, tasks[i].period) * tasks[i].period;
  for (uint32_t k = H; k < 2 * H; k++) {          /* a full hyperperiod after every offset has started */
    uint32_t load = DISPATCH_US;
    for (int i = 0; i < NT; i++) if (due(&tasks[i], k)) load += tasks[i].budget_us;
    if (load > worst) worst = load;
  }
  *hyper = H; return worst;
}

/* the dispatcher, driven by a simulated tick; returns the number of skipped ticks */
static uint32_t run(uint32_t ticks) {
  int64_t now = 0; uint32_t skipped = 0;
  for (uint32_t k = 0; k < ticks; k++) {
    int64_t tick_start = (int64_t)k * TICK_US;
    if (now > tick_start) {                           /* tick ISR fired while the dispatcher was still busy */
      log_overrun(k, '-', (int32_t)(now - tick_start));
      skipped++; continue;                            /* policy: skip this tick, realign with the clock */
    }
    now = tick_start + DISPATCH_US;
    for (int i = 0; i < NT; i++) {
      if (!due(&tasks[i], k)) continue;
      task_t *t = &tasks[i]; uint32_t dt = exec_time(t, k);
      t->last_start = now; t->runs++; now += dt;
      if (dt > t->budget_us) log_overrun(k, t->name, (int32_t)(dt - t->budget_us));   /* task budget check */
    }
  }
  return skipped;
}
#define CHECK(c) do { if (!(c)) { printf("FAIL line %d: %s\n", __LINE__, #c); exit(1); } } while (0)

int main(void) {
  uint32_t H, worst = check_table(&H);
  printf("hyperperiod %u ticks, worst tick load %u us of %u\n", H, worst, TICK_US);
  CHECK(H == 20 && worst == 770 && worst <= TICK_US);

  uint32_t skipped = run(10 * H);                     /* clean run */
  CHECK(skipped == 0 && n_log == 0);
  for (int i = 0; i < NT; i++) CHECK(tasks[i].runs == (10 * H - tasks[i].offset + tasks[i].period - 1) / tasks[i].period);

  for (int i = 0; i < NT; i++) tasks[i].runs = 0;
  inject_tick = 12; inject_task = 'C'; inject_us = 900;   /* C runs 400 us over budget at tick 12 */
  skipped = run(10 * H);
  for (int i = 0; i < n_log; i++) printf("log: tick %u task %c over by %d us\n", logbuf[i].tick, logbuf[i].task, logbuf[i].over_us);
  CHECK(n_log == 2);
  CHECK(logbuf[0].tick == 12 && logbuf[0].task == 'C' && logbuf[0].over_us == 400);   /* culprit named */
  CHECK(logbuf[1].tick == 13 && logbuf[1].task == '-' && logbuf[1].over_us == 160);   /* the tick overrun (A ran 240 us) */
  CHECK(skipped == 1);
  CHECK(tasks[0].runs == 10 * H - 1);                 /* A missed exactly one tick, then realigned */
  printf("PASS\n");
  return 0;
}
```
:::end

## Exercises

:::exercise
A new task E needs to run every 3 ms. What does that do to the hyperperiod, and why might you change its period instead?
:::solution
$\text{lcm}(1, 5, 10, 20, 3) = 60$ ticks, three times the table to check, and E's activations drift relative to the others so more combinations of tasks share ticks. If 2.5 ms or 4 ms is acceptable, pick a period that divides the existing hyperperiod (for example 2, 4 or 5 ms) to keep the schedule compact.
:::end

:::exercise
Why does the scheduler skip a late tick instead of running it immediately to catch up?
:::solution
Running the missed tick late, back to back with the next, makes the control task sample twice in quick succession and then not again for a while, which looks like a sample-time jump to the controller and can upset its dynamics. Skipping keeps the remaining samples on the clock grid, and the log records the miss.
:::end

## Quiz

:::quiz
- type: num
  q: Hyperperiod in ticks of tasks with periods 1, 5, 10 and 20 ticks?
  answer: 20
  tol: 0.001
  unit: ticks
  py: "math.lcm(1, 5, 10, 20)"
  explain: Least common multiple.
- type: num
  q: Worst tick load in µs (A 250 + C 500 + dispatcher 20)?
  answer: 770
  tol: 0.001
  unit: µs
  py: "250 + 500 + 20"
  explain: Ticks where A and C coincide.
- type: num
  q: Utilisation of A, B, C and D (without the dispatcher)?
  answer: 0.395
  tol: 0.001
  unit: ""
  py: "0.25 + 400/5000 + 500/10000 + 300/20000"
  explain: Σ C/T.
- type: num
  q: If C takes 900 µs in tick 12, by how many µs is tick 13 late?
  answer: 170
  tol: 0.001
  unit: µs
  py: "20 + 250 + 900 - 1000"
  explain: Dispatcher + A + C minus the tick.
- type: mc
  q: What does 'cooperative' mean in this scheduler?
  options:
    - tasks share a stack
    - tasks are never preempted; each runs to completion
    - tasks cooperate through queues
    - interrupts are disabled
  answer: 1
  explain: Run to completion, so no task-to-task races.
- type: mc
  q: Which check names the task that caused an overrun?
  options:
    - the tick overrun check
    - the per-task budget check with a timestamp
    - the hyperperiod check
    - the watchdog
  answer: 1
  explain: The tick check only says that something was late.
:::end

:::verify
import math
assert math.lcm(1, 5, 10, 20) == 20
assert 20 + 250 + 900 - 1000 == 170
:::end
