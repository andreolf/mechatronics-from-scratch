---
id: p10-l16
minutes: 35
summary: A battery-powered sensor node spends almost all its life asleep, so its battery life is set by the sleep current and by how short and rare the wake-ups are. You derive the average current as a duty-weighted sum, account for wake-up overheads and battery derating, implement an RTC-alarm sleep and wake state machine, and test that a simulated year of operation matches the formula and meets a five-year target.
---

## Average current is a weighted sum

A node that measures, transmits and sleeps draws a current profile with a few short, high spikes and a long, low floor. Over one period $T$, each state $i$ lasts $t_i$ at current $I_i$, so

$$\bar I = \frac{1}{T}\sum_i I_i\,t_i = \sum_i D_i I_i, \qquad D_i = \frac{t_i}{T}.$$

Battery life is capacity over average current, $L = C_{\text{usable}}/\bar I$. Two consequences surprise people:

- the **sleep current dominates** once wake-ups are rare. A 3 µA floor is 26 mAh per year, whatever the active current;
- **wake-up overheads** count: oscillator start-up, regulator settling, sensor warm-up and radio calibration can cost more charge than the useful work.

## Low-power modes on a Cortex-M MCU

Executing `WFI` (wait for interrupt) stops the core clock until an interrupt: that's **Sleep**, saving maybe half the run current. Deeper modes stop more. On an STM32, **Stop** halts all high-speed clocks and keeps RAM and registers, drawing microamps to tens of microamps depending on the part, and **Standby** turns off almost everything, losing RAM, so waking is a reset. The real-time clock (RTC), running from a 32.768 kHz crystal, keeps time in all of them and its **alarm** is the wake-up source. On wake from Stop the system clock is the internal oscillator again, so the firmware must restore the PLL (lesson 07) before using timing-critical peripherals.

The exact currents depend on the part and are in its datasheet. The numbers below are an illustrative budget, not a specific chip's.

:::figure widget=powerprofile caption="Current over one wake-up cycle on a log scale, with the charge of each phase. Change the reporting interval and the sleep current: the battery-life estimate follows the duty-weighted sum."
:::end

## Usable capacity

The label capacity isn't all usable. Derate for the cutoff voltage your regulator needs, for temperature (cold batteries deliver less), for self-discharge (a few percent per year for alkaline and lithium primary cells), and for high pulse currents if the radio's peaks are large compared with what the cell likes. Treat 70–80 % of the nominal capacity as a planning number, then measure.

## Worked example

A node wakes every 60 s on an RTC alarm. Budget (illustrative):

| phase | current | time |
|---|---|---|
| wake-up (clock and regulator start) | 3 mA | 2 ms |
| measure | 5 mA | 20 ms |
| radio transmit (every 10th wake-up) | 20 mA | 30 ms |
| sleep (Stop + RTC) | 3 µA | rest |

1. Charge per wake-up without radio: $3 \cdot 2 + 5 \cdot 20 = 106$ µC (mA·ms).
2. Radio averaged: $20 \cdot 30 / 10 = 60$ µC per wake-up.
3. Sleep: $3\ \mu\text{A} \times 59.978\ \text{s} \approx 180$ µC.
4. $\bar I = (106 + 60 + 180)/60\ \text{s} = 5.76$ µA.
5. A 2400 mAh pack derated to 75 % (1800 mAh) lasts $1800/0.00576 = 312\,000$ h, 35.6 years: the battery's shelf life, not the electronics, becomes the limit. With a 30 µA sleep current instead, $\bar I$ = 32.8 µA and the life is 6.3 years.

## Code it from scratch

:::code file=low_power.c
```c
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
```
:::end

## Exercises

:::exercise
Measurements show 400 µA in "sleep" instead of 3 µA. Name three likely causes.
:::solution
A GPIO left floating (an input with no pull, toggling with noise, makes its input buffer draw current), a peripheral or its clock left on (an ADC, a debug interface, a timer), and external parts: a sensor not put into power-down, an LED, a pull-up holding a line low, or a linear regulator's quiescent current. Measure with everything but the MCU disconnected, then add parts back.
:::end

:::exercise
Why does the wake-up phase deserve its own line in the budget?
:::solution
Waking from Stop means restarting the high-speed oscillator and possibly the PLL, waiting for the regulator, and re-initialising peripherals, all at run current but with no useful work. With frequent wake-ups this overhead can rival the measurement. Batch work into fewer wake-ups when you can.
:::end

## Quiz

:::quiz
- type: num
  q: Average current in µA for 5 mA for 20 ms every 60 s, with 3 µA otherwise?
  answer: 4.666
  tol: 0.001
  unit: µA
  py: "(5e3*0.020 + 3*(60-0.020))/60"
  explain: Duty-weighted sum.
- type: num
  q: Charge per year in mAh drawn by a 3 µA sleep current?
  answer: 26.3
  tol: 0.002
  unit: mAh
  py: "3e-3*8766"
  explain: 3 µA × 8766 h.
- type: num
  q: Life in years of 1800 mAh at 32.8 µA?
  answer: 6.26
  tol: 0.002
  unit: years
  py: "1800/0.0328/8766"
  explain: Capacity over current.
- type: num
  q: Duty cycle in percent of a 22 ms wake-up every 60 s?
  answer: 0.0367
  tol: 0.002
  unit: "%"
  py: "22e-3/60*100"
  explain: Awake for a tiny fraction of the time.
- type: mc
  q: When wake-ups are rare, battery life is set mainly by…
  options:
    - the run current
    - the sleep current
    - the CPU frequency
    - the flash size
  answer: 1
  explain: The floor is on for almost all of the time.
- type: mc
  q: After waking from Stop mode on an STM32, what must the firmware usually redo first?
  options:
    - reload the vector table
    - restore the system clock (HSE and PLL)
    - copy .data again
    - erase flash
  answer: 1
  explain: Stop mode returns on the internal oscillator.
:::end

:::verify
q = 3 * 2 + 5 * 20 + 20 * 30 / 10 + 3 * (60e3 - 22 - 3) / 1e3
assert abs(q / 60 - 5.764) < 0.01
assert abs(1800 / (q / 60 / 1000) / 8766 - 35.6) < 0.1
:::end
