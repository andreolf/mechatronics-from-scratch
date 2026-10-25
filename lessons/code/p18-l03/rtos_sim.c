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
