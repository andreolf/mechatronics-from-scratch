#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
  double pclk_hz, adc_max_sck_hz, t_conv_s, t_gap_s; int bits;
} hw_t;
typedef struct { int br; double sck_hz; long timer_arr; double t_sample_s; double fs_hz; } spi_cfg_t;

/* pick the fastest SCK the ADC allows (pclk / 2^(br+1)) and a timer reload for the target rate */
static int configure(const hw_t *hw, double target_fs, spi_cfg_t *c) {
  for (int br = 0; br < 8; br++) {
    double sck = hw->pclk_hz / (double)(2 << br);
    if (sck > hw->adc_max_sck_hz) continue;
    c->br = br; c->sck_hz = sck;
    c->t_sample_s = hw->t_conv_s + hw->bits / sck + hw->t_gap_s;
    double ticks = hw->pclk_hz / target_fs;
    c->timer_arr = (long)(ticks + 0.5) - 1;
    c->fs_hz = hw->pclk_hz / (double)(c->timer_arr + 1);
    if (c->t_sample_s > 1.0 / c->fs_hz) return -1;          /* doesn't fit in one period */
    return 0;
  }
  return -2;
}

/* ---------- timing model: timer -> conversion -> SPI word -> DMA into a circular buffer ---------- */
#define HALF 512
static uint16_t buf[2 * HALF];
typedef struct { long samples, overruns, torn_halves, halves_ok, isrs; double cpu_busy_s; } result_t;

/* the ADC returns a code that encodes the sample index, so lost or reordered samples are detectable */
static uint16_t adc_code(long k) { return (uint16_t)(k * 40503u); }

static result_t run(const hw_t *hw, const spi_cfg_t *c, double seconds, double t_process_s, double isr_overhead_s) {
  result_t r; memset(&r, 0, sizeof r);
  double T = 1.0 / c->fs_hz, dma_latency = 50e-9;
  long n = (long)(seconds * c->fs_hz);
  double busy_until = -1;                                     /* the SPI/ADC chain */
  double cpu_free_at = 0;
  double proc_end[2] = {-1, -1};                              /* when the CPU finishes reading each half */
  long proc_first[2] = {-1, -1};
  for (long k = 0; k < n; k++) {
    double t = k * T;                                         /* timer update event: CONVST */
    if (t < busy_until) { r.overruns++; continue; }
    double done = t + hw->t_conv_s + hw->bits / c->sck_hz + dma_latency;
    busy_until = t + c->t_sample_s;
    long slot = k % (2 * HALF); int h = (int)(slot / HALF);
    if (slot % HALF == 0 && proc_first[h] >= 0) {             /* the DMA re-enters a half the CPU was given */
      if (done < proc_end[h]) r.torn_halves++;                /* still being read: torn */
      else {                                                  /* the CPU read it in time: check its contents */
        int ok = 1;
        for (long i = 0; i < HALF; i++) ok &= buf[h * HALF + i] == adc_code(proc_first[h] + i);
        r.halves_ok += ok;
      }
      proc_first[h] = -1;
    }
    buf[slot] = adc_code(k);
    r.samples++;
    if (slot % HALF == HALF - 1) {                            /* half-transfer or transfer-complete IRQ */
      r.isrs++;
      double start = done > cpu_free_at ? done : cpu_free_at;
      proc_end[h] = start + isr_overhead_s + t_process_s;
      cpu_free_at = proc_end[h];
      r.cpu_busy_s += isr_overhead_s + t_process_s;
      proc_first[h] = k - (HALF - 1);
    }
  }
  return r;
}
#define CHECK(c) do { if (!(c)) { printf("FAIL line %d: %s\n", __LINE__, #c); exit(1); } } while (0)

int main(void) {
  const hw_t hw = {84e6, 20e6, 700e-9, 100e-9, 16};
  spi_cfg_t c;
  CHECK(configure(&hw, 250e3, &c) == 0);
  printf("SCK %.2f MHz (BR=%d), sample takes %.3f us, timer ARR=%ld -> %.1f kS/s\n", c.sck_hz / 1e6, c.br, c.t_sample_s * 1e6, c.timer_arr, c.fs_hz / 1e3);
  CHECK(c.sck_hz == 10.5e6 && c.timer_arr == 335 && c.fs_hz == 250e3);
  CHECK(c.t_sample_s > 2.3238e-6 && c.t_sample_s < 2.3239e-6);
  double fmax = 1 / c.t_sample_s;
  printf("bus limit at this SCK: %.0f kS/s\n", fmax / 1e3);
  CHECK(fmax > 430e3 && fmax < 431e3);
  spi_cfg_t c2;
  CHECK(configure(&hw, 500e3, &c2) == -1);                    /* 2 us slot < 2.324 us sample */

  /* one second at 250 kS/s with DMA and 40 us of processing per half */
  result_t r = run(&hw, &c, 1.0, 40e-6, 1.2e-6);
  double load = r.cpu_busy_s / 1.0;
  printf("DMA: %ld samples, %ld overruns, %ld interrupts, %ld/%ld halves intact, CPU load %.2f %%\n",
         r.samples, r.overruns, r.isrs, r.halves_ok, r.isrs - 1, load * 100);
  CHECK(r.samples == 250000 && r.overruns == 0 && r.torn_halves == 0);
  CHECK(r.isrs == 250000 / HALF && r.halves_ok == r.isrs - 1);   /* every handed-over half checked except the last */
  CHECK(load > 0.019 && load < 0.021);
  /* interrupt per sample for comparison */
  double per_sample_load = 250e3 * 1.2e-6;
  printf("interrupt per sample would cost %.0f %% of the CPU\n", per_sample_load * 100);
  CHECK(per_sample_load > 0.29);
  /* processing slower than a half-buffer (2.048 ms) corrupts data */
  result_t slow = run(&hw, &c, 0.2, 2.5e-3, 1.2e-6);
  printf("2.5 ms processing per half: %ld torn halves\n", slow.torn_halves);
  CHECK(slow.torn_halves > 0);
  /* a slow SCK makes the sample no longer fit */
  hw_t slow_adc = hw; slow_adc.adc_max_sck_hz = 5e6;
  spi_cfg_t c3;
  CHECK(configure(&slow_adc, 250e3, &c3) == -1 && c3.sck_hz == 2.625e6);   /* 2.625 MHz: too slow for 4 us */
  printf("ADC limited to 5 MHz SCK: %.3f MHz, sample %.2f us, max %.0f kS/s\n", c3.sck_hz / 1e6, c3.t_sample_s * 1e6, 1 / c3.t_sample_s / 1e3);
  CHECK(c3.t_sample_s > 6.8e-6);                              /* 16 bits at 2.625 MHz alone is 6.1 us */
  printf("PASS\n");
  return 0;
}
