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
