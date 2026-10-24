#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <math.h>

/* illustrative budget; replace with your part's datasheet and your measurements */
typedef struct { double i_wake_ma, t_wake_ms, i_meas_ma, t_meas_ms, i_tx_ma, t_tx_ms, i_sleep_ua; int tx_every; double period_s; } budget_t;

static double avg_current_ua(const budget_t *b) {                 /* the duty-weighted sum */
  double q_uc = b->i_wake_ma * b->t_wake_ms + b->i_meas_ma * b->t_meas_ms + b->i_tx_ma * b->t_tx_ms / b->tx_every;
  double t_awake_ms = b->t_wake_ms + b->t_meas_ms + b->t_tx_ms / b->tx_every;
  q_uc += b->i_sleep_ua * (b->period_s * 1e3 - t_awake_ms) / 1e3;
  return q_uc / b->period_s;
}

/* state machine driven by an RTC alarm, integrated in 1 ms steps */
enum { SLEEP, WAKE, MEASURE, TX };
static double simulate_ua(const budget_t *b, double seconds) {
  int state = SLEEP; double t_in = 0, charge_uc = 0; uint64_t wakes = 0;
  uint64_t steps = (uint64_t)(seconds * 1000), alarm = (uint64_t)(b->period_s * 1000), next_alarm = alarm;
  for (uint64_t ms = 0; ms < steps; ms++) {
    if (state == SLEEP && ms == next_alarm) { state = WAKE; t_in = 0; wakes++; next_alarm += alarm; }   /* RTC alarm IRQ */
    double i_ma = state == SLEEP ? b->i_sleep_ua / 1000 : state == WAKE ? b->i_wake_ma : state == MEASURE ? b->i_meas_ma : b->i_tx_ma;
    charge_uc += i_ma;                                          /* mA x 1 ms = 1 uC */
    t_in += 1;
    if (state == WAKE && t_in >= b->t_wake_ms) { state = MEASURE; t_in = 0; }
    else if (state == MEASURE && t_in >= b->t_meas_ms) { state = (wakes % b->tx_every == 0) ? TX : SLEEP; t_in = 0; }
    else if (state == TX && t_in >= b->t_tx_ms) { state = SLEEP; t_in = 0; }   /* WFI in Stop mode */
  }
  return charge_uc / seconds;
}
static double life_years(double capacity_mah, double derate, double i_ua) { return capacity_mah * derate / (i_ua / 1000) / 8766; }
#define CHECK(c) do { if (!(c)) { printf("FAIL line %d: %s\n", __LINE__, #c); exit(1); } } while (0)

int main(void) {
  budget_t b = {3, 2, 5, 20, 20, 30, 3, 10, 60};
  double formula = avg_current_ua(&b), sim = simulate_ua(&b, 86400);   /* one day */
  printf("formula %.3f uA, simulated day %.3f uA\n", formula, sim);
  CHECK(fabs(formula - 5.764) < 0.01);
  CHECK(fabs(sim - formula) / formula < 0.01);                 /* the state machine agrees with the sum */
  double years = life_years(2400, 0.75, formula);
  printf("2400 mAh x 0.75 -> %.1f years\n", years);
  CHECK(years >= 5);                                           /* target: 5 years */

  budget_t leaky = b; leaky.i_sleep_ua = 30;                   /* a floating pin or a regulator's quiescent current */
  double y2 = life_years(2400, 0.75, avg_current_ua(&leaky));
  printf("with 30 uA sleep: %.2f uA, %.1f years\n", avg_current_ua(&leaky), y2);
  CHECK(y2 >= 5 && y2 < 7);

  budget_t chatty = b; chatty.tx_every = 1; chatty.period_s = 5;   /* transmit every 5 s */
  double y3 = life_years(2400, 0.75, avg_current_ua(&chatty));
  printf("transmit every 5 s: %.1f uA, %.2f years -> misses the target\n", avg_current_ua(&chatty), y3);
  CHECK(y3 < 5);
  /* largest reporting rate that still meets 5 years with the base budget */
  double best = 0;
  for (double p = 1; p <= 600; p += 1) { budget_t t = b; t.period_s = p; t.tx_every = 1; if (life_years(2400, 0.75, avg_current_ua(&t)) >= 5) { best = p; break; } }
  printf("shortest interval with a transmission every wake-up that meets 5 years: %.0f s\nPASS\n", best);
  CHECK(best > 5 && best < 60);
  return 0;
}
