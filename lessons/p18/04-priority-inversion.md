---
id: p18-l04
minutes: 40
summary: Tasks share data through queues and mutexes, and a mutex can let a medium-priority task delay a high-priority one without limit. You write a message queue, simulate the priority inversion that reset Mars Pathfinder in 1997, and show that priority inheritance bounds the high-priority task's delay by one critical section.
---

## Queues

Tasks should pass data by **message queue** rather than shared variables. A queue is a fixed-size ring buffer protected by the kernel: `xQueueSend` copies an item in, `xQueueReceive` copies one out, and either can block (with a timeout) when the queue is full or empty. A sensing task sends readings and a control task blocks on the queue, so it wakes exactly when data arrives. The depth decides how much burstiness it absorbs; a full queue means the consumer cannot keep up.

## Mutexes and the inversion

When tasks must share a resource (a bus, a driver), a **mutex** gives exclusive access: take it, use the resource in a short **critical section**, give it back. Blocking on a mutex is expected; the danger is how long.

**Priority inversion**: a low-priority task L holds the mutex; high-priority H wants it and blocks; a medium-priority task M, which does not need the mutex at all, preempts L. Now H waits for M, for as long as M runs. With several medium tasks the delay has no bound.

This happened on Mars Pathfinder in 1997. A low-priority meteorological task held a mutex that the high-priority information bus task needed, a medium-priority communications task ran, and a watchdog saw the bus task miss its deadline and reset the computer, repeatedly. Engineers reproduced it on Earth and uploaded a change that enabled **priority inheritance** on that VxWorks mutex.

## Priority inheritance

While H is blocked on a mutex held by L, L runs at H's priority. M can no longer preempt it, L finishes its critical section quickly, gives the mutex back and drops to its own priority, and H continues. H's blocking is bounded by the longest lower-priority critical section on that mutex, a term $B_i$ added to the response-time analysis of lesson 02: $R_i = C_i + B_i + \sum_j \lceil R_i/T_j \rceil C_j$. The **priority ceiling protocol** goes further and prevents deadlock too.

:::figure widget=inversion caption="Timeline of low (W), medium (M) and high (H) priority tasks sharing a mutex. Lengthen the medium task and the critical section, and toggle priority inheritance."
:::end

## Worked example

1. A depth-4 queue passes 10 items in order. Six sends into a queue nobody reads: 4 are accepted and the rest are refused.
2. Illustrative scripts: W takes the mutex at tick 0 for 4 ticks; H arrives at tick 2, computes a tick and asks for the mutex; M arrives at tick 3 with 10 ticks of work.
3. Without inheritance: `WWHMMMMMMMMMMWWHW`. H finishes after 14 ticks, delayed by all of M's work.
4. With inheritance: `WWHWWHMMMMMMMMMMW`. W finishes its critical section at H's priority and H finishes after 4 ticks, within the bound of its own 2 ticks plus the 4-tick critical section.

## Code it from scratch

:::code file=inversion.c
```c
/* inversion.c: a queue between two tasks, and priority inversion on a mutex with and without priority inheritance,
   simulated tick by tick on a preemptive priority scheduler. */
#include <stdio.h>
#include <string.h>

/* ---- a fixed-size message queue (the shape of xQueueSend / xQueueReceive, without blocking) ---- */
#define QN 4
typedef struct { int buf[QN]; int head, tail, count; } Queue;
static int q_send(Queue *q, int v) { if (q->count == QN) return 0; q->buf[q->tail] = v; q->tail = (q->tail + 1) % QN; q->count++; return 1; }
static int q_recv(Queue *q, int *v) { if (q->count == 0) return 0; *v = q->buf[q->head]; q->head = (q->head + 1) % QN; q->count--; return 1; }

/* ---- tasks run scripts: 'c' = one tick of computation, 'L' = take the mutex, 'U' = give it back ---- */
#define NT 3
#define HORIZON 40
typedef struct { const char *name; char tag; int base, prio, release; const char *script; int pc, done_at; } Task;

static int simulate(Task *t, int inherit, char *timeline) {
    int owner = -1;
    for (int i = 0; i < NT; i++) { t[i].pc = 0; t[i].prio = t[i].base; t[i].done_at = -1; }
    for (int tick = 0; tick < HORIZON; tick++) {
        int blocked[NT] = {0}, run = -1;
        for (;;) {
            run = -1;
            for (int i = 0; i < NT; i++)                       /* highest effective priority among released, unfinished, unblocked tasks */
                if (tick >= t[i].release && t[i].script[t[i].pc] && !blocked[i] && (run < 0 || t[i].prio > t[run].prio)) run = i;
            if (run < 0) break;
            char op = t[run].script[t[run].pc];
            if (op == 'L') {
                if (owner < 0 || owner == run) { owner = run; t[run].pc++; continue; }
                blocked[run] = 1;                              /* mutex held: block on it */
                if (inherit && t[owner].prio < t[run].prio) t[owner].prio = t[run].prio;   /* owner inherits waiter's priority */
                continue;
            }
            if (op == 'U') { owner = -1; t[run].prio = t[run].base; t[run].pc++; memset(blocked, 0, sizeof blocked); continue; }
            break;                                             /* 'c': spend this tick computing */
        }
        timeline[tick] = run < 0 ? '.' : t[run].tag;
        if (run >= 0) { t[run].pc++; while (t[run].script[t[run].pc] == 'U') { owner = -1; t[run].prio = t[run].base; t[run].pc++; }
                        if (!t[run].script[t[run].pc]) t[run].done_at = tick + 1; }
    }
    timeline[HORIZON] = 0;
    return t[0].done_at - t[0].release;                        /* response time of the high-priority task */
}

int main(void) {
    int ok = 1;
    Queue q = {0}; int sent = 0, got = 0, v, last = -1;
    for (int k = 0; k < 10; k++) { sent += q_send(&q, k); if (k % 2) while (q_recv(&q, &v)) { if (v != last + 1) ok = 0; last = v; got++; } }
    while (q_recv(&q, &v)) { if (v != last + 1) ok = 0; last = v; got++; }
    printf("queue of depth %d: %d sent, %d received in order\n", QN, sent, got);
    if (sent != 10 || got != 10) ok = 0;
    Queue f = {0}; int accepted = 0; for (int k = 0; k < 6; k++) accepted += q_send(&f, k);
    printf("6 sends into an empty queue nobody reads: %d accepted, the rest refused (a full queue blocks or fails)\n", accepted);
    if (accepted != QN) ok = 0;

    Task t[NT] = {
        {"high (bus manager)", 'H', 3, 3, 2, "cLcU"},          /* needs the shared bus mutex briefly */
        {"medium (comms)",     'M', 2, 2, 3, "cccccccccc"},    /* long CPU-bound work, no mutex */
        {"low (weather data)", 'W', 1, 1, 0, "LccccUc"},       /* holds the mutex for 4 ticks */
    };
    char tl[HORIZON + 1];
    int r0 = simulate(t, 0, tl); printf("no inheritance:       %s  high-priority response %d ticks\n", tl, r0);
    int r1 = simulate(t, 1, tl); printf("priority inheritance: %s  high-priority response %d ticks\n", tl, r1);
    int bound = 2 + 4;                                         /* its own 2 ticks + the longest critical section of a lower task */
    printf("bound with inheritance: own work 2 + low task critical section 4 = %d ticks\n", bound);
    if (!(r0 > 10 && r1 <= bound)) ok = 0;
    puts(ok ? "PASS" : "FAIL");
    return ok ? 0 : 1;
}
```
:::end

## In practice

In FreeRTOS, `xSemaphoreCreateMutex` gives a mutex with priority inheritance, while a binary semaphore has none, so never use a binary semaphore as a lock. Keep critical sections short, never block while holding a mutex, and take several mutexes in one global order to avoid deadlock. On Linux, use `pthread_mutexattr_setprotocol(&a, PTHREAD_PRIO_INHERIT)` for mutexes shared with real-time threads.

## Exercises

:::exercise
In the example, what is H's response time without inheritance if M has 20 ticks of work?
:::solution
24 ticks: H waits for all 20 ticks of M, then for W's last 2 ticks of critical section, plus its own 2 ticks. The delay grows with M, which is what makes it unbounded.
:::end

:::exercise
A sensing task produces at 1 kHz and the logging task drains its queue once every 20 ms. What queue depth avoids losing readings?
:::solution
At least 20 items, plus a margin for jitter in the logger (for example 32). Alternatively send batches, or let the logger block on the queue so it drains continuously.
:::end

## Quiz

:::quiz
- type: num
  q: High-priority response time in the example without inheritance (ticks)?
  answer: 14
  tol: 0.001
  py: "14"
  explain: From the simulated timeline.
- type: num
  q: High-priority response time in the example with inheritance (ticks)?
  answer: 4
  tol: 0.001
  py: "4"
  explain: W's remaining critical section, then H.
- type: num
  q: Response-time bound with C = 2, blocking B = 3, and one higher task (1, 10)?
  answer: 6
  tol: 0.001
  py: "2+3+1"
  explain: R = C + B + ceil(R/T) C_j = 2 + 3 + 1.
- type: num
  q: Items a depth-8 queue accepts when nobody reads it?
  answer: 8
  tol: 0.001
  py: "8"
  explain: Then it is full.
- type: mc
  q: In priority inheritance, the task that temporarily gets a higher priority is…
  options:
    - the low-priority task holding the mutex
    - the high-priority task waiting
    - the medium-priority task
    - the idle task
  answer: 0
  explain: The holder inherits the waiter's priority.
- type: mc
  q: In FreeRTOS, which object provides priority inheritance?
  options:
    - a mutex
    - a binary semaphore
    - a queue
    - a counting semaphore
  answer: 0
  explain: Only mutexes inherit priority.
:::end
