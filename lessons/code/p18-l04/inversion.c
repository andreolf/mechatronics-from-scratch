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
