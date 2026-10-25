---
id: p18-l03
minutes: 40
summary: An RTOS is a small kernel that runs the highest-priority ready task on every tick. You build the core of one in C on the host, a tick-driven preemptive priority scheduler with sensing, control and logging tasks, check that every task meets its period, and see why vTaskDelayUntil, not vTaskDelay, keeps a control loop on time.
---

## What an RTOS gives you

A bare-metal super-loop (Phase 10) runs everything in one sequence, so a slow logging step delays the control step. A **real-time operating system** such as FreeRTOS, Zephyr or ThreadX splits the work into **tasks**, each with its own stack and a fixed priority, and a small kernel decides which one runs:

- A periodic **tick interrupt** (often 1 kHz) advances the kernel clock and unblocks tasks whose delay has expired.
- The scheduler always runs the **highest-priority ready task**, preempting a lower one mid-computation. Tasks of equal priority can share time by round robin.
- A task that has nothing to do **blocks** (on a delay, a queue or a semaphore) and uses no processor time. When nothing is ready, the idle task runs and can put the chip to sleep.

This is exactly the fixed-priority model of lesson 02, so its analysis applies.

## Task states

Each task is **running**, **ready** (could run, a higher-priority task is running), **blocked** (waiting for time or an event) or **suspended**. A periodic task is a loop: wait for the next release, do the job, repeat.

## Delay until, not delay

`vTaskDelay(10)` blocks for 10 ticks *from now*. If the task was preempted, the next release is pushed back by its response time, and the loop drifts. `vTaskDelayUntil(&last, 10)` blocks until `last + 10`, an absolute time, which keeps the period exact as long as each job finishes within it. It is the RTOS version of the absolute-time loop in lesson 01.

:::figure widget=rtostimeline caption="Tick-by-tick timeline of sensing (high priority), control and logging tasks. Change the execution times and periods, and switch control between delay-until and delay to see the drift."
:::end

## Worked example

Illustrative tasks, in ticks: sensing priority 3, $C = 1$, $T = 4$; control priority 2, $C = 2$, $T = 10$; logging priority 1, $C = 5$, $T = 50$.

1. The first 40 ticks run `SCCLSLLLSLCCS...S...SCC.S...S.CCS...S...`: logging is preempted by sensing at ticks 4 and 8 and by control at 10.
2. Over 1000 ticks, worst response times are 1, 3 and 10 ticks, matching response-time analysis (for logging $5 \to 9 \to 10$), and every task keeps its exact period. Utilisation is 0.550, so 450 ticks are idle.
3. Switching control to `vTaskDelay(10)` makes its mean period 12.01 ticks: each cycle adds its response time.

## Code it from scratch

:::code file=rtos_sim.c
```c
/* rtos_sim.c: a tick-driven preemptive priority scheduler, the core of an RTOS like FreeRTOS, simulated on the host.
   Three tasks (sensing, control, logging) block until their next wake-up tick; the highest-priority ready task runs. */
#include <stdio.h>
#include <string.h>

enum { DELAY_UNTIL, DELAY };              /* vTaskDelayUntil (absolute) vs vTaskDelay (relative to finish) */
#define NT 3
#define HORIZON 1000
#define MAXJ 400

typedef struct {
    const char *name; char tag; int prio, wcet, period, mode;
    int ready, left, wake, last_release;
    int releases[MAXJ], finishes[MAXJ], nj;
} Task;

static void run(Task *t, char *timeline) {
    for (int i = 0; i < NT; i++) { t[i].ready = 0; t[i].left = 0; t[i].wake = 0; t[i].nj = 0; }
    for (int tick = 0; tick < HORIZON; tick++) {
        for (int i = 0; i < NT; i++)                            /* the tick interrupt unblocks tasks whose delay expired */
            if (!t[i].ready && tick >= t[i].wake) {
                t[i].ready = 1; t[i].left = t[i].wcet; t[i].last_release = tick;
                if (t[i].nj < MAXJ) t[i].releases[t[i].nj] = tick;
            }
        int run = -1;                                          /* pick the highest-priority ready task */
        for (int i = 0; i < NT; i++)
            if (t[i].ready && (run < 0 || t[i].prio > t[run].prio)) run = i;
        timeline[tick] = run < 0 ? '.' : t[run].tag;
        if (run < 0) continue;                                 /* idle task */
        Task *k = &t[run];
        if (--k->left == 0) {                                  /* job done at the end of this tick: block */
            if (k->nj < MAXJ) k->finishes[k->nj++] = tick + 1;
            k->ready = 0;
            k->wake = k->mode == DELAY_UNTIL ? k->last_release + k->period : tick + 1 + k->period;
        }
    }
    timeline[HORIZON] = 0;
}

static void report(const Task *k, int *max_resp, double *mean_period) {
    int worst = 0;
    for (int j = 0; j < k->nj; j++) { int r = k->finishes[j] - k->releases[j]; if (r > worst) worst = r; }
    *max_resp = worst;
    *mean_period = k->nj > 1 ? (double)(k->releases[k->nj - 1] - k->releases[0]) / (k->nj - 1) : 0;
}

int main(void) {
    static char tl[HORIZON + 1];
    Task t[NT] = {
        {"sensing", 'S', 3, 1, 4, DELAY_UNTIL},                /* name, tag, priority, WCET, period (ticks), delay mode */
        {"control", 'C', 2, 2, 10, DELAY_UNTIL},
        {"logging", 'L', 1, 5, 50, DELAY_UNTIL},
    };
    int ok = 1, resp; double per;

    run(t, tl);
    printf("first 40 ticks: %.40s\n", tl);
    for (int i = 0; i < NT; i++) {
        report(&t[i], &resp, &per);
        printf("  %-8s prio %d  C=%d T=%-3d jobs %3d  worst response %d  mean period %.2f\n",
               t[i].name, t[i].prio, t[i].wcet, t[i].period, t[i].nj, resp, per);
        if (resp > t[i].period || per != t[i].period) ok = 0;   /* every task meets its period, no drift */
    }
    int idle = 0; for (int i = 0; i < HORIZON; i++) idle += tl[i] == '.';
    printf("idle %d of %d ticks (utilisation %.3f)\n", idle, HORIZON, 1.0 - (double)idle / HORIZON);

    t[1].mode = DELAY;                                         /* control switches to a relative delay */
    run(t, tl);
    report(&t[1], &resp, &per);
    printf("control with vTaskDelay(10): mean period %.2f ticks instead of 10 (drifts by its response time)\n", per);
    if (per <= 10.5) ok = 0;

    puts(ok ? "PASS" : "FAIL");
    return ok ? 0 : 1;
}
```
:::end

## In practice

In FreeRTOS each of these tasks is a function created with `xTaskCreate(fn, "control", stack_words, NULL, priority, &handle)` and looping on `vTaskDelayUntil`. The real kernel also switches stacks and registers (on a Cortex-M in the PendSV interrupt), which this host simulation leaves out. Size each stack with `uxTaskGetStackHighWaterMark`, and use a tracing tool such as Percepio Tracealyzer or SEGGER SystemView to see the real timeline.

## Exercises

:::exercise
Give logging a higher priority than control in the example. What happens to control's worst response time?
:::solution
Control can now be delayed by a whole 5-tick logging job as well as by sensing. Response-time analysis gives $2 \to 8 \to 9 \to 10$, and the simulation agrees: a worst response of 10 ticks, exactly its period. It still just meets its deadline, but with no margin; long low-value work belongs at low priority.
:::end

:::exercise
Why does the idle task matter on a battery-powered board?
:::solution
It runs whenever no task is ready. Putting the processor to sleep there (or using FreeRTOS tickless idle) saves power without changing any task's timing.
:::end

## Quiz

:::quiz
- type: num
  q: Utilisation of the three example tasks (1/4, 2/10, 5/50)?
  answer: 0.55
  tol: 0.002
  py: "1/4+2/10+5/50"
  explain: Sum of C/T.
- type: num
  q: Mean period of a task that uses vTaskDelay(10) and always takes 3 ticks to finish after release?
  answer: 13
  tol: 0.001
  py: "13"
  explain: Response time plus the relative delay.
- type: num
  q: Jobs of a 4-tick-period task in 1000 ticks?
  answer: 250
  tol: 0.001
  py: "1000/4"
  explain: One per period.
- type: num
  q: Tick period in milliseconds for a 1 kHz tick?
  answer: 1
  tol: 0.001
  py: "1000/1000"
  explain: configTICK_RATE_HZ of 1000.
- type: mc
  q: A ready task does not run because…
  options:
    - a higher-priority task is running
    - it is waiting for a semaphore
    - its delay has not expired
    - it has been suspended
  answer: 0
  explain: The other three describe blocked or suspended tasks.
- type: mc
  q: To keep a control loop's period exact under preemption, use…
  options:
    - vTaskDelayUntil
    - vTaskDelay
    - a busy-wait loop
    - a lower priority
  answer: 0
  explain: It blocks until an absolute time.
:::end
