---
id: p10-l12
minutes: 40
summary: Timers can measure as well as generate, and the two big uses are input capture, which latches the counter at an edge, and encoder mode, which counts quadrature edges in hardware. You derive speed from counts per sample and from captured periods, handle 16-bit wraparound with one signed subtraction, and test both methods against a simulated motor from 2 rpm to 6000 rpm.
---

## Encoder mode

A quadrature encoder (Phase 08) outputs two square waves A and B, 90° apart. A 1000-line encoder gives 1000 cycles per revolution; counting **every edge of both channels** (x4 mode) gives

$$\text{CPR} = 4 \times 1000 = 4000\ \text{counts per revolution},$$

and the order of the edges gives the direction. In **encoder mode** an STM32 timer does this in hardware: the inputs clock the counter up or down, with digital input filters to reject glitches. The CPU only reads CNT.

## Speed from counts: the M method

Read CNT every $T_s$ (say 1 ms) and take the difference:

$$\omega = \frac{2\pi\,\Delta N}{\text{CPR}\;T_s}.$$

The 16-bit counter wraps. If you compute $\Delta N$ as a **signed 16-bit difference**, `(int16_t)(cnt_now - cnt_prev)`, the wrap cancels out automatically, as long as the true change between samples is less than 32 768 counts. At 4000 CPR and 1 ms that's 8.2 revolutions per millisecond, about 490 000 rpm, so it's safe.

The weakness is resolution at low speed: one count per sample is $2\pi/(4000 \cdot 0.001) = 1.57$ rad/s = 15 rpm. Below a few counts per sample the estimate jumps between integers.

## Speed from time: the T method

**Input capture** latches the free-running counter into CCR at each edge. With a 1 MHz capture clock, the time between consecutive edges of one channel is measured to 1 µs. For one encoder cycle (4 counts) taking $\Delta t$:

$$\omega = \frac{2\pi \cdot 4}{\text{CPR}\;\Delta t}.$$

At 2 rpm an encoder cycle takes 30 ms, so the 1 µs resolution is 0.003 %. At high speed $\Delta t$ gets short and the resolution drops, the mirror image of the M method. Practical drives switch between the two (or combine them, the M/T method), using counts when there are many per sample and periods when there are few.

:::figure widget=encodermode caption="Quadrature pulses filling a 16-bit counter that wraps. Slide the speed: the M estimate (counts per 1 ms) gets coarse at low speed while the T estimate (captured period) stays smooth."
:::end

## Worked example

1000-line encoder, x4, 1 ms sampling, 1 MHz capture clock.

1. At 3000 rpm = 50 rev/s, $\Delta N$ = 50 × 4000 × 0.001 = 200 counts per sample, so the M method's resolution is 1/200 = 0.5 %.
2. The counter goes from 65 500 to 164 (wrapped): `(int16_t)(164 - 65500)` = 200. Correct.
3. At 2 rpm: 0.133 counts per sample, useless; an encoder cycle takes $60/(2 \cdot 1000)$ = 30 ms = 30 000 capture ticks.
4. A capture of 30 000 ± 1 ticks gives the speed to ±0.0033 %.

## Code it from scratch

The program simulates a motor's angle, generates the A/B edges the encoder would produce, runs a 16-bit x4 counter and a 1 MHz capture timer, and computes both estimates.

:::code file=encoder_speed.c
```c
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <math.h>

#define PI 3.14159265358979323846
#define LINES 1000
#define CPR (4 * LINES)

typedef struct { uint16_t cnt; int32_t pos; uint32_t last_a_rise_us, period_us; int have_period, a, b; } encoder_hw;

/* feed the true shaft angle at 1 us resolution; edges update the x4 counter and the capture on A rising */
static void encoder_step(encoder_hw *e, double angle_rad, uint32_t t_us) {
  int32_t pos = (int32_t)floor(angle_rad / (2 * PI) * CPR);     /* quadrature state index */
  while (e->pos != pos) {
    int dir = pos > e->pos ? 1 : -1; e->pos += dir;
    int phase = ((e->pos % 4) + 4) % 4;                         /* 0:A0B0 1:A1B0 2:A1B1 3:A0B1 */
    int a = phase == 1 || phase == 2, b = phase >= 2;
    if (a && !e->a && dir > 0) {                                /* input capture on A rising */
      if (e->last_a_rise_us) { e->period_us = t_us - e->last_a_rise_us; e->have_period = 1; }
      e->last_a_rise_us = t_us;
    }
    e->a = a; e->b = b; e->cnt = (uint16_t)(e->cnt + dir);      /* 16-bit hardware counter wraps */
  }
}
static double m_method(uint16_t now, uint16_t prev, double ts) {
  int16_t dn = (int16_t)(uint16_t)(now - prev);                 /* signed difference absorbs the wrap */
  return 2 * PI * dn / (CPR * ts);
}
static double t_method(uint32_t period_us) { return 2 * PI * 4 / (CPR * period_us * 1e-6); }
#define CHECK(c) do { if (!(c)) { printf("FAIL line %d: %s\n", __LINE__, #c); exit(1); } } while (0)

int main(void) {
  const double rpms[] = {2, 15, 300, 3000, 6000};
  for (int i = 0; i < 5; i++) {
    double w = rpms[i] * 2 * PI / 60;                            /* constant speed, rad/s */
    encoder_hw e = {0}; e.cnt = 65000;                           /* start near the wrap */
    double sim_s = rpms[i] < 10 ? 0.5 : 0.2;
    uint16_t prev = e.cnt; double m_sum = 0; int m_n = 0, wrapped = 0;
    for (uint32_t t = 1; t <= (uint32_t)(sim_s * 1e6); t++) {
      uint16_t before = e.cnt;
      encoder_step(&e, w * t * 1e-6 + 0.0001, t);
      if (e.cnt < before) wrapped = 1;
      if (t % 1000 == 0) { m_sum += m_method(e.cnt, prev, 1e-3); m_n++; prev = e.cnt; }   /* 1 kHz sampling */
    }
    double m_avg = m_sum / m_n, t_est = e.have_period ? t_method(e.period_us) : 0;
    double m_err = fabs(m_avg - w) / w, t_err = fabs(t_est - w) / w;
    printf("%6.0f rpm: M %8.3f rad/s (%.3f %%), T %8.3f rad/s (%.4f %%)%s\n", rpms[i], m_avg, 100 * m_err, t_est, 100 * t_err, wrapped ? ", counter wrapped" : "");
    CHECK(e.have_period && t_err < 0.005);                       /* T method good everywhere here (0.5 %) */
    if (rpms[i] >= 300) CHECK(m_err < 0.005);                    /* M method good at speed */
    if (rpms[i] >= 3000) CHECK(wrapped);                         /* and the wrap was handled */
  }
  /* the wrap example: 65500 -> 164 is +200 counts */
  CHECK((int16_t)(uint16_t)(164 - 65500) == 200);
  CHECK(fabs(m_method(164, 65500, 1e-3) - 2 * PI * 50) < 1e-9);  /* 3000 rpm */
  /* low speed: one 1 ms sample of the M method is 0 or 1 count, i.e. 0 or 15 rpm */
  CHECK(fabs(m_method(1, 0, 1e-3) * 60 / (2 * PI) - 15) < 1e-9);
  printf("PASS\n");
  return 0;
}
```
:::end

## Exercises

:::exercise
At 15 rpm, how many counts per 1 ms sample, and what do the individual M-method readings look like?
:::solution
$15/60 \times 4000 \times 0.001 = 1$ count per sample on average, so readings alternate between values like 0, 15 and 30 rpm. Averaging over 100 ms helps but adds lag; the T method gives one clean reading per encoder cycle (every 4 ms).
:::end

:::exercise
Why must the signed difference be done in 16 bits, not 32, when the counter is 16-bit?
:::solution
`(int32_t)164 - 65500` is −65 336, a huge negative speed. Subtracting in `uint16_t` and casting to `int16_t` computes the difference modulo 65 536 and then interprets it as signed, which recovers +200.
:::end

## Quiz

:::quiz
- type: num
  q: Counts per revolution of a 2500-line encoder in x4 mode?
  answer: 10000
  tol: 0.001
  unit: ""
  py: "4*2500"
  explain: Four edges per line.
- type: num
  q: 1000 lines x4, 1 ms sampling, ΔN = 200. Speed in rpm?
  answer: 3000
  tol: 0.001
  unit: rpm
  py: "200/4000/0.001*60"
  explain: 50 rev/s.
- type: num
  q: Signed 16-bit difference from 65500 to 164?
  answer: 200
  tol: 0.001
  unit: counts
  py: "(164 - 65500) % 65536"
  explain: Modulo 65 536.
- type: num
  q: Capture ticks (1 MHz) for one encoder cycle at 2 rpm with 1000 lines?
  answer: 30000
  tol: 0.001
  unit: ticks
  py: "60/2/1000*1e6"
  explain: 30 ms per line.
- type: mc
  q: Which method is better at very low speed?
  options:
    - counting edges per fixed sample (M)
    - measuring the time between edges (T)
    - both are equal
    - neither works
  answer: 1
  explain: Few counts per sample but long, well-resolved periods.
- type: mc
  q: The M method's resolution is…
  options:
    - one count per sample period
    - one capture tick
    - one revolution
    - set by the PWM frequency
  answer: 0
  explain: 2π/(CPR·Ts) per count.
:::end

:::verify
import math
assert abs(2 * math.pi / (4000 * 0.001) - 1.5708) < 1e-4
assert 50 * 4000 * 0.001 == 200
:::end
