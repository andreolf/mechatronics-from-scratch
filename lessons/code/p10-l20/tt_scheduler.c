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
