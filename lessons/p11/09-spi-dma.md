---
id: p11-l09
minutes: 40
summary: Reading an external ADC at hundreds of kilosamples per second over SPI is easy for the bus and hopeless for the CPU if it takes an interrupt per sample, so a timer starts each conversion and DMA moves each word while the CPU handles whole half-buffers. You derive the sample-rate limit from SCK, word length and conversion time, write the configuration and a timing model of timer, SPI and DMA, and test that it reaches 250 kS/s with no lost or torn samples.
---

## Throughput from first principles

An external SAR ADC typically works like this: a CONVST pulse (or CS falling) starts a conversion that takes $t_{conv}$, then the master clocks out $N$ bits over SPI. One sample takes

$$t_{sample} = t_{conv} + \frac{N}{f_{SCK}} + t_{gap}, \qquad f_{s,max} = \frac{1}{t_{sample}},$$

where $t_{gap}$ is the minimum CS-high time. The plain bus figure $f_{SCK}/N$ is an upper bound you never quite reach.

On an STM32 the SPI clock is the bus clock divided by a power of two: with an 84 MHz APB2, SCK can be 42, 21, 10.5, 5.25 MHz and so on. If the ADC allows up to 20 MHz, you get 10.5 MHz, not 20. With $N = 16$, $t_{conv} = 700$ ns and $t_{gap} = 100$ ns: $t_{sample} = 0.7 + 1.524 + 0.1 = 2.324$ µs, so at most 430 kS/s.

## Why not an interrupt per sample

An ISR costs entry, exit and the handler: say 1.2 µs of CPU at 168 MHz. At 250 kS/s that's 30 % of the CPU spent moving 16-bit words, and any higher-priority interrupt that runs longer than 4 µs makes you miss a sample.

With DMA:

1. A **timer** fires at exactly $f_s$ and starts the conversion (pin toggle or CONVST output), so sampling is jitter-free regardless of the CPU.
2. When the data is ready, the SPI clocks it out and the **DMA** writes each word into a circular buffer of $2B$ samples.
3. The DMA raises **half-transfer** and **transfer-complete** interrupts. The CPU processes one half while the DMA fills the other: one interrupt per $B$ samples.

The rule that keeps data intact: processing one half must finish before the DMA comes back to it, so $t_{process} < B / f_s$. With $B = 512$ at 250 kS/s that's 2.048 ms.

:::figure widget=spidma caption="Timer, conversion, SPI words and DMA half-buffers on one timeline, with the throughput gauge. Raise the target rate or lower SCK until the sample no longer fits its slot, and lengthen the processing until it overruns the half-buffer."
:::end

## Worked example

Target 250 kS/s from the ADC above with $B = 512$.

1. Timer period: 84 MHz / 250 kHz = 336 counts, exactly 4.000 µs.
2. The sample takes 2.324 µs of its 4 µs slot: 58 % bus utilisation, 1.676 µs of slack.
3. Interrupts: $250\,000/512 = 488$ per second instead of 250 000.
4. If each half-buffer ISR takes 40 µs plus 1.2 µs overhead, the CPU load is $488 \times 41.2\ \mu\text{s} = 2.0$ %, against 30 % per-sample.

## Code it from scratch

:::code file=spi_dma.c
```c
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
```
:::end

## Exercises

:::exercise
Your ADC allows 20 MHz SCK but the STM32 gives you 10.5 or 21 MHz. Is running at 21 MHz a reasonable risk?
:::solution
No: 21 MHz is 5 % over the datasheet limit, and the limit usually comes from the ADC's output delay, so you'd be eating into the round-trip margin of lesson 08 with no guarantee across temperature. Either accept 10.5 MHz, move the SPI to a bus clock that divides to 20 MHz or just under it, or pick a faster ADC.
:::end

:::exercise
Why trigger conversions from a timer instead of starting each one from the DMA-complete event?
:::solution
Back-to-back conversions would run at whatever rate the SPI and DMA latencies allow, which varies with bus contention, and the sample spacing would jitter. Filters, FFTs and control loops assume uniform sampling; a timer gives exactly 4.000 µs regardless of what the CPU or DMA is doing.
:::end

## Quiz

:::quiz
- type: num
  q: Sample time in µs with t_conv = 0.7 µs, 16 bits at 10.5 MHz and a 0.1 µs gap?
  answer: 2.324
  tol: 0.001
  unit: µs
  py: "0.7 + 16/10.5 + 0.1"
  explain: Conversion plus the word plus the gap.
- type: num
  q: Timer reload value (ARR) for 250 kS/s from 84 MHz?
  answer: 335
  tol: 0
  py: "84e6/250e3 - 1"
  explain: 336 counts per period.
- type: num
  q: Half-buffer interrupts per second at 250 kS/s with 512-sample halves?
  answer: 488.28
  tol: 0.001
  unit: per s
  py: "250e3/512"
  explain: One per half.
- type: num
  q: Time budget in ms to process a 512-sample half at 250 kS/s?
  answer: 2.048
  tol: 0.001
  unit: ms
  py: "512/250e3*1e3"
  explain: Until the DMA wraps back.
- type: mc
  q: What paces the samples in the DMA design?
  options:
    - a hardware timer
    - the CPU's main loop
    - the DMA's own speed
    - the half-transfer interrupt
  answer: 0
  explain: Jitter-free sampling.
- type: mc
  q: What happens if processing a half takes longer than the half-buffer time?
  options:
    - the DMA overwrites data still being read, so samples are torn or lost
    - the DMA waits
    - the SPI slows down
    - nothing
  answer: 0
  explain: A circular DMA never waits for the CPU.
:::end
