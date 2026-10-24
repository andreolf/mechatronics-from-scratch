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
