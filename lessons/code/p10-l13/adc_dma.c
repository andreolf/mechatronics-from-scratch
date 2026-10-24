#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <math.h>

#define PI 3.14159265358979323846
#define NCH 4
#define SCANS 64
#define NBUF (NCH * SCANS)

static uint16_t buf[NBUF];
static uint32_t dma_idx;                                   /* next slot the DMA will write */
static uint64_t ch0_times[4096]; static uint32_t n_ch0;
static int halves_done, half_violation;
static double avg[NCH];

static uint16_t sensor(int ch, double t) {                  /* four test signals, 12-bit */
  if (ch == 3) return (uint16_t)lround(0.25 * 4095);       /* channel 3: a constant reference */
  return (uint16_t)lround((0.5 + 0.4 * sin(2 * PI * 50.0 * (ch + 1) * t)) * 4095);
}
static void process_half(int which) {                       /* runs on HT (which = 0) or TC (which = 1) */
  uint32_t lo = which * NBUF / 2, hi = lo + NBUF / 2;
  if (dma_idx >= lo && dma_idx < hi) half_violation = 1;    /* DMA must be in the other half */
  double s[NCH] = {0};
  for (uint32_t i = lo; i < hi; i++) s[i % NCH] += buf[i];
  for (int c = 0; c < NCH; c++) avg[c] = s[c] / (SCANS / 2);
  halves_done++;
}

typedef struct { uint64_t triggers, overruns; } run_t;
static run_t run(double f_adc, double f_trig, int samp_cycles, double seconds) {
  run_t r = {0, 0}; dma_idx = 0; n_ch0 = 0; halves_done = 0; half_violation = 0;
  uint64_t period = (uint64_t)llround(f_adc / f_trig), conv = (uint64_t)samp_cycles + 12;
  uint64_t end = (uint64_t)(seconds * f_adc), busy_until = 0;
  for (uint64_t t = 0; t < end; t += period) {              /* each timer update event */
    r.triggers++;
    if (t < busy_until) { r.overruns++; continue; }          /* previous scan still running: OVR */
    for (int ch = 0; ch < NCH; ch++) {
      uint64_t done = t + (ch + 1) * conv;                   /* end of this channel's conversion */
      if (ch == 0 && n_ch0 < 4096) ch0_times[n_ch0++] = done;
      buf[dma_idx] = sensor(ch, (t + ch * conv) / f_adc);    /* sampled at the start of its window */
      dma_idx++;
      if (dma_idx == NBUF / 2) process_half(0);              /* half-transfer interrupt */
      if (dma_idx == NBUF) { dma_idx = 0; process_half(1); } /* transfer complete, circular wrap */
    }
    busy_until = t + NCH * conv;
  }
  return r;
}
#define CHECK(c) do { if (!(c)) { printf("FAIL line %d: %s\n", __LINE__, #c); exit(1); } } while (0)

int main(void) {
  const double f_adc = 84e6 / 4;                            /* 21 MHz */
  double t_conv = (15 + 12) / f_adc;
  printf("t_conv %.3f us, scan %.3f us, max trigger %.1f kHz\n", t_conv * 1e6, NCH * t_conv * 1e6, 1 / (NCH * t_conv) / 1e3);
  CHECK(fabs(t_conv * 1e6 - 1.2857) < 1e-3);

  run_t r = run(f_adc, 10e3, 15, 0.1);
  CHECK(r.triggers == 1000 && r.overruns == 0);
  for (uint32_t k = 1; k < n_ch0; k++) CHECK(ch0_times[k] - ch0_times[k - 1] == 2100);   /* exactly 10 kHz */
  double rate = (n_ch0 - 1) / ((ch0_times[n_ch0 - 1] - ch0_times[0]) / f_adc);
  CHECK(fabs(rate - 10e3) / 10e3 < 1e-9);
  CHECK(halves_done == 1000 * NCH / (NBUF / 2) && !half_violation);
  /* channel order in the buffer: slot i holds channel i % 4; channel 3 is a constant 0.25 */
  for (uint32_t i = 3; i < NBUF; i += NCH) CHECK(buf[i] == (uint16_t)lround(0.25 * 4095));
  CHECK(fabs(avg[3] - 0.25 * 4095) < 0.5);
  printf("10 kHz trigger: %llu scans, sample rate %.3f Hz, %d half-buffers processed, no overrun\n",
         (unsigned long long)r.triggers, rate, halves_done);

  run_t bad = run(f_adc, 250e3, 15, 0.01);                   /* trigger every 4 us < 5.14 us scan */
  printf("250 kHz trigger: %llu of %llu triggers overran\n", (unsigned long long)bad.overruns, (unsigned long long)bad.triggers);
  CHECK(bad.overruns > 0);
  run_t ok = run(f_adc, 150e3, 15, 0.01);
  CHECK(ok.overruns == 0);
  printf("PASS\n");
  return 0;
}
