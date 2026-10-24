---
id: p10-l11
minutes: 40
summary: A timer in PWM mode compares its counter with a capture-compare register and drives a pin from the result, and for a half-bridge it drives two complementary pins with a dead time between them so both switches are never on at once. You derive edge- and centre-aligned duty, encode a dead time into the STM32 DTG field, and test a cycle-level model of complementary outputs for duty within one count and a gap on every edge.
---

## PWM from a counter

Lesson 08's counter runs from 0 to ARR. In **PWM mode 1**, output channel 1's reference signal OC1REF is high while $\text{CNT} < \text{CCR1}$ and low otherwise. Two counting modes:

- **edge-aligned** (up-counting): the period is $\text{ARR}+1$ counts and the duty is
$$D = \frac{\text{CCR}}{\text{ARR} + 1};$$
- **centre-aligned** (up-down): the counter goes $0 \to \text{ARR} \to 0$, the period is $2\,\text{ARR}$ counts, and the duty is
$$D = \frac{\text{CCR}}{\text{ARR}}.$$

Centre-aligned PWM puts the pulse symmetrically around the counter's valley, so the edges of the three phases of a motor drive don't all switch at once, and the middle of the off-time (the counter peak) is a quiet moment to trigger the ADC for current sampling. It also halves the switching frequency for a given ARR: $f_{\text{PWM}} = f_{clk}/(2\,\text{ARR})$.

## Complementary outputs and dead time

A half-bridge (lesson P09-06) has a high-side and a low-side switch. Advanced timers (TIM1, TIM8) generate CH1 and its complement CH1N from OC1REF. MOSFETs take tens to hundreds of nanoseconds to turn off, so if one switch turns on at the instant the other is told to turn off, both conduct briefly and short the supply (**shoot-through**). The dead-time generator delays every *rising* edge of CH1 and CH1N by $t_{DT}$, so each output turns on $t_{DT}$ after the other turned off. The cost is a small duty error, because during the dead time the load current flows through a diode and the bridge output depends on its direction.

:::figure widget=pwmdead caption="Centre-aligned counter (top), OC1REF, and the complementary outputs CH1 and CH1N with the dead-time gaps shaded. Change the duty and the dead time; the DTG code updates."
:::end

## Encoding the dead time

The STM32 BDTR register's 8-bit DTG field encodes the dead time in units of $t_{DTS}$ (the timer clock period when CKD = 0) with four ranges:

| DTG[7:5] | dead time |
|---|---|
| 0xx | $\text{DTG}[7{:}0] \cdot t_{DTS}$ (0–127) |
| 10x | $(64 + \text{DTG}[5{:}0]) \cdot 2\,t_{DTS}$ (128–254) |
| 110 | $(32 + \text{DTG}[4{:}0]) \cdot 8\,t_{DTS}$ (256–504) |
| 111 | $(32 + \text{DTG}[4{:}0]) \cdot 16\,t_{DTS}$ (512–1008) |

To encode a requested time, convert it to counts and pick the smallest representable value **not below** it: rounding down could cause shoot-through.

## Worked example

TIM1 at 168 MHz, 20 kHz centre-aligned PWM, 1 µs dead time, 30 % duty.

1. ARR = $168\,000\,000 / (2 \cdot 20\,000) = 4200$.
2. CCR = $0.30 \cdot 4200 = 1260$.
3. $t_{DTS}$ = 5.952 ns, so 1 µs = 168 counts. That's in range 2: $(64 + x)\cdot 2 = 168 \Rightarrow x = 20$, DTG = 0x80 | 20 = 0x94.
4. 3 µs = 504 counts, range 3: $(32 + 31) \cdot 8 = 504$, DTG = 0xDF.
5. CH1 is high for about $2\cdot1260 - 168 = 2352$ counts per 8400-count period, 28.0 %. (The cycle model gives 2351: the counter visits 0 once per period, so OC1REF is high for $2\,\text{CCR} - 1$ counts. That one count is within the duty tolerance.)

## Code it from scratch

:::code file=pwm_deadtime.c
```c
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <math.h>

/* DTG field <-> dead time in t_DTS counts */
static uint32_t dtg_decode(uint8_t d) {
  if ((d & 0x80) == 0)    return d;
  if ((d & 0xC0) == 0x80) return (64u + (d & 0x3F)) * 2u;
  if ((d & 0xE0) == 0xC0) return (32u + (d & 0x1F)) * 8u;
  return (32u + (d & 0x1F)) * 16u;
}
static int dtg_encode(uint32_t counts, uint8_t *out) {        /* smallest code with decode >= counts */
  int best = -1; uint32_t bv = 0xFFFFFFFFu;
  for (int d = 0; d < 256; d++) { uint32_t v = dtg_decode((uint8_t)d); if (v >= counts && v < bv) { bv = v; best = d; } }
  if (best < 0) return 0;
  *out = (uint8_t)best; return 1;
}

/* cycle-level model of one centre-aligned period: counter 0..ARR..0, PWM mode 1, dead-time insertion */
typedef struct { uint32_t high, low_side_high, both, gaps_min, ref_high; } pwm_stats;
static pwm_stats simulate(uint32_t arr, uint32_t ccr, uint32_t dt, int periods) {
  pwm_stats s = {0, 0, 0, 0xFFFFFFFFu, 0};
  int prev_ref = 0; uint32_t since_edge = 1u << 30, gap = 0; int ch = 0, chn = 0;
  uint32_t n = 2 * arr;
  for (int p = 0; p < periods; p++)
    for (uint32_t t = 0; t < n; t++) {
      uint32_t cnt = t <= arr ? t : n - t;                    /* up then down */
      int ref = cnt < ccr;
      if (ref != prev_ref) { since_edge = 0; prev_ref = ref; } else since_edge++;
      ch  = ref  && since_edge >= dt;                         /* rising edges delayed by the dead time */
      chn = !ref && since_edge >= dt;
      if (p == periods - 1) {                                 /* measure the last, settled period */
        s.ref_high += ref; s.high += ch; s.low_side_high += chn; s.both += ch && chn;
        if (!ch && !chn) gap++; else if (gap) { if (gap < s.gaps_min) s.gaps_min = gap; gap = 0; }
      }
    }
  return s;
}
#define CHECK(c) do { if (!(c)) { printf("FAIL line %d: %s\n", __LINE__, #c); exit(1); } } while (0)

int main(void) {
  /* the DTG encoding: every code decodes to a value that encodes back to itself */
  for (int d = 0; d < 256; d++) { uint8_t e; CHECK(dtg_encode(dtg_decode((uint8_t)d), &e)); CHECK(dtg_decode(e) == dtg_decode((uint8_t)d)); }
  uint8_t code;
  CHECK(dtg_encode(168, &code) && code == 0x94);              /* 1 us at 168 MHz */
  CHECK(dtg_encode(504, &code) && code == 0xDF);              /* 3 us */
  CHECK(dtg_encode(129, &code) && dtg_decode(code) == 130);   /* rounds up, never down */
  CHECK(!dtg_encode(1009, &code));                            /* beyond 1008 counts: needs CKD > 0 */

  const double fclk = 168e6, fpwm = 20e3;
  uint32_t arr = (uint32_t)(fclk / (2 * fpwm));
  CHECK(arr == 4200);
  uint32_t dt = dtg_decode(0x94);
  for (int k = 0; k <= 100; k++) {
    double duty = k / 100.0;
    uint32_t ccr = (uint32_t)lround(duty * arr);
    pwm_stats s = simulate(arr, ccr, dt, 2);
    double measured = (double)s.ref_high / (2.0 * arr);
    CHECK(fabs(measured * arr - duty * arr) <= 1.0);          /* duty within 1 count of the command */
    CHECK(s.both == 0);                                       /* never shoot-through */
    if (ccr > dt && ccr < arr - dt) CHECK(s.gaps_min >= dt);  /* a gap of at least DT on every edge */
    if (k == 30) {
      printf("30 %%: CCR %u, OC1REF high %u, CH1 high %u (%.1f %%), CH1N high %u, min gap %u counts\n",
             ccr, s.ref_high, s.high, 100.0 * s.high / (2 * arr), s.low_side_high, s.gaps_min);
      CHECK(abs((int)s.ref_high - 2 * 1260) <= 1 && s.high == s.ref_high - 168 && s.gaps_min == 168);
    }
  }
  printf("101 duty commands: duty within 1 count, no overlap, gaps >= %u counts (%.0f ns)\nPASS\n", dt, dt / fclk * 1e9);
  return 0;
}
```
:::end

## Exercises

:::exercise
At 95 % duty with 1 µs dead time at 20 kHz, how long is CH1N on per period, and why does that matter for a bootstrap gate driver?
:::solution
OC1REF is low for 5 % of 50 µs = 2.5 µs, and CH1N turns on 1 µs after that starts, so 1.5 µs per period. A bootstrap high-side supply recharges only while the low side is on; at high duty it may not get enough time, so drivers cap the maximum duty (for example 95–98 %).
:::end

:::exercise
Why do you round the dead time *up* when encoding?
:::solution
Too little dead time lets both switches conduct during the transition, which can destroy them; too much only costs a slightly larger duty error and diode conduction losses. The safe direction is always longer.
:::end

## Quiz

:::quiz
- type: num
  q: Centre-aligned PWM at 168 MHz with ARR = 4200. PWM frequency in kHz?
  answer: 20
  tol: 0.001
  unit: kHz
  py: "168e6/(2*4200)/1000"
  explain: f_clk / (2 ARR).
- type: num
  q: Edge-aligned with ARR = 999, CCR = 250. Duty in percent?
  answer: 25
  tol: 0.001
  unit: "%"
  py: "250/(999+1)*100"
  explain: CCR/(ARR+1).
- type: num
  q: Dead time in ns for DTG = 0x94 at 168 MHz?
  answer: 1000
  tol: 0.001
  unit: ns
  py: "(64+20)*2/168e6*1e9"
  explain: Range 2, (64+20)·2 counts.
- type: num
  q: Largest dead time in µs with CKD = 0 at 168 MHz?
  answer: 6
  tol: 0.001
  unit: µs
  py: "(32+31)*16/168e6*1e6"
  explain: 1008 counts.
- type: mc
  q: What does dead-time insertion delay?
  options:
    - every falling edge
    - every rising edge of CH1 and CH1N
    - the update event
    - the ADC trigger
  answer: 1
  explain: Each output turns on late, after the other turned off.
- type: mc
  q: Why is the counter peak in centre-aligned mode a good ADC trigger for current sensing?
  options:
    - the counter is fastest there
    - it is the middle of a switching interval, away from the switching edges and their ringing
    - the ADC needs it
    - it doubles the sample rate
  answer: 1
  explain: Sample in the quiet middle.
:::end

:::verify
assert 168e6 / (2 * 20e3) == 4200
assert (64 + 20) * 2 == 168 and (32 + 31) * 8 == 504
assert 2 * 1260 - 168 == 2352 and abs(2352 / 8400 - 0.28) < 1e-9
:::end
