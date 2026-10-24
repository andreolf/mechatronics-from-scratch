#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

/* IWDG model: time in microseconds, LSI frequency as a parameter */
typedef struct { uint32_t pr, rl; double f_lsi; double deadline_us; int resets; } iwdg_t;
static double iwdg_timeout_us(uint32_t pr, uint32_t rl, double f_lsi) { return 4.0 * (1u << pr) * (rl + 1) / f_lsi * 1e6; }
static void iwdg_kick(iwdg_t *w, double now) { w->deadline_us = now + iwdg_timeout_us(w->pr, w->rl, w->f_lsi); }
static int iwdg_expired(iwdg_t *w, double now) { return now >= w->deadline_us; }

/* WWDG model: 7-bit counter ticking down; reset below 0x40 or on refresh above the window */
typedef struct { int cnt, window; int reset; } wwdg_t;
static void wwdg_tick(wwdg_t *w) { if (--w->cnt < 0x40) w->reset = 1; }
static void wwdg_refresh(wwdg_t *w) { if (w->cnt > w->window) w->reset = 1; else w->cnt = 0x7F; }

/* a main loop of 4 tasks; each takes a few ms; at t_hang the third task gets stuck forever */
static double run_main_loop(iwdg_t *w, double t_hang_us, double t_end_us, double *loop_max_us) {
  double now = 0, last_kick = 0; *loop_max_us = 0; iwdg_kick(w, 0);
  uint32_t r = 12345;
  while (now < t_end_us) {
    for (int task = 0; task < 4; task++) {
      r = r * 1103515245u + 12345u;
      double dt = 3000 + (r >> 16) % 7000;                  /* 3..10 ms per task */
      if (task == 2 && now >= t_hang_us) {                  /* stuck: time passes, no kicks */
        while (!iwdg_expired(w, now)) now += 100;
        w->resets++; return now;                            /* time of the reset */
      }
      now += dt;
      if (iwdg_expired(w, now)) { w->resets++; return -now; }   /* false reset: timeout too short */
    }
    if (now - last_kick > *loop_max_us) *loop_max_us = now - last_kick;
    iwdg_kick(w, now); last_kick = now;                     /* kick once per complete loop */
  }
  return 0;
}
#define CHECK(c) do { if (!(c)) { printf("FAIL line %d: %s\n", __LINE__, #c); exit(1); } } while (0)

int main(void) {
  const uint32_t PR = 1, RL = 399;
  double nom = iwdg_timeout_us(PR, RL, 32000), fast = iwdg_timeout_us(PR, RL, 47000), slow = iwdg_timeout_us(PR, RL, 17000);
  printf("IWDG PR=%u RL=%u: timeout %.1f ms nominal, %.1f ms at 47 kHz, %.1f ms at 17 kHz\n", PR, RL, nom / 1e3, fast / 1e3, slow / 1e3);
  CHECK(nom == 100000.0 && fast > 68000 && fast < 68200 && slow > 188000 && slow < 188300);

  const double lsis[] = {17000, 32000, 47000};
  for (int i = 0; i < 3; i++) {
    iwdg_t w = {PR, RL, lsis[i], 0, 0}; double loop_max;
    double no_hang = run_main_loop(&w, 1e12, 10e6, &loop_max);     /* 10 s healthy */
    CHECK(no_hang == 0 && w.resets == 0);                         /* never a false reset */
    CHECK(loop_max <= 40000);                                     /* 4 tasks x 10 ms worst case */
    iwdg_t h = {PR, RL, lsis[i], 0, 0};
    double t_reset = run_main_loop(&h, 5e6, 20e6, &loop_max);     /* hang injected at t = 5 s */
    double timeout = iwdg_timeout_us(PR, RL, lsis[i]);
    printf("LSI %5.0f Hz: no false reset in 10 s (longest loop %.1f ms); hang at 5 s -> reset at %.3f s\n",
           lsis[i], loop_max / 1e3, t_reset / 1e6);
    CHECK(h.resets == 1 && t_reset > 5e6 && t_reset <= 5e6 + 40000 + timeout + 100);   /* within one loop + timeout */
  }

  /* WWDG: window 0x5F; refresh early -> reset, refresh in the window -> fine, no refresh -> reset */
  wwdg_t a = {0x7F, 0x5F, 0}; for (int k = 0; k < 20; k++) wwdg_tick(&a); wwdg_refresh(&a);
  CHECK(a.reset);                                                 /* counter 0x6B > 0x5F: too early */
  wwdg_t b = {0x7F, 0x5F, 0};
  for (int cycle = 0; cycle < 100; cycle++) { for (int k = 0; k < 40; k++) wwdg_tick(&b); wwdg_refresh(&b); }
  CHECK(!b.reset);                                                /* 40 ticks: counter 0x57, inside the window */
  wwdg_t c = {0x7F, 0x5F, 0}; for (int k = 0; k < 64; k++) wwdg_tick(&c);
  CHECK(c.reset);                                                 /* missed: passes 0x3F after 64 ticks */
  double tick_us = 4096.0 * 8 / 42e6 * 1e6;
  printf("WWDG tick %.1f us: window opens %.1f ms after a refresh, closes at %.1f ms\nPASS\n", tick_us, 32 * tick_us / 1e3, 64 * tick_us / 1e3);
  return 0;
}
