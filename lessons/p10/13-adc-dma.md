---
id: p10-l13
minutes: 40
summary: A timer can trigger the ADC and the DMA controller can move every result into RAM, so sensors are sampled at an exact rate with no CPU time spent. You derive conversion time and the maximum scan rate, set up a circular DMA buffer with half- and full-transfer interrupts so the CPU always processes the half that isn't being written, and test a cycle-level model for the sample rate, channel order and overrun detection.
---

## Conversion time

The STM32F4's 12-bit successive-approximation ADC (Phase 06) runs from its own clock, APB2 divided by 2, 4, 6 or 8, at most 36 MHz. Each conversion costs a programmable **sampling time** (3, 15, 28, 56, 84, 112, 144 or 480 ADC clocks), during which the sample-and-hold capacitor charges through the source impedance, plus 12 clocks for the 12-bit approximation:

$$t_{\text{conv}} = \frac{t_{\text{samp}} + 12}{f_{\text{ADC}}}.$$

A high source impedance needs a longer sampling time, or the capacitor doesn't settle and the reading is low. In **scan mode** the ADC converts a list of channels back to back, so $n$ channels take $n\,t_{\text{conv}}$, and the fastest trigger rate is $1/(n\,t_{\text{conv}})$.

## Triggers and DMA

Software-started conversions jitter with the code that starts them. Instead, let a **timer's update event** (lesson 08) start each scan: the sample instants are then as regular as the crystal. Each finished conversion raises a DMA request, and the DMA controller copies the data register into the next slot of a buffer in RAM. Nothing runs on the CPU.

In **circular mode** the DMA wraps back to the start of the buffer by itself, forever. It raises a **half-transfer** (HT) interrupt when it fills the first half and a **transfer-complete** (TC) interrupt at the end. That's double buffering for free: on HT, process the first half while the DMA fills the second, and vice versa. Processing one half must finish before the DMA comes back to it, so the time budget is half the buffer's duration.

If a new trigger arrives before the scan finishes, the ADC flags an **overrun** (OVR) and data is lost. Always check for it.

:::figure widget=adcring caption="A circular DMA buffer of 4 channels × 8 scans as a ring. The write pointer advances with each conversion; the half being processed by the CPU is highlighted at each HT and TC interrupt."
:::end

## Worked example

APB2 = 84 MHz, ADC prescaler /4, 15-cycle sampling, 4 channels, TIM2 trigger at 10 kHz, buffer of 64 scans.

1. $f_{\text{ADC}}$ = 21 MHz; $t_{\text{conv}} = 27/21\ \text{MHz} = 1.286$ µs.
2. A scan takes $4 \times 1.286 = 5.14$ µs, so the fastest trigger is 194 kHz. At 10 kHz the ADC is busy 5.1 % of the time.
3. The buffer holds $64 \times 4 = 256$ samples, 6.4 ms of data; an HT or TC interrupt comes every 3.2 ms.
4. Triggering at 250 kHz (every 4 µs) is shorter than a scan: overrun.

## Code it from scratch

The model counts ADC clock cycles. A timer issues a trigger every $f_{\text{ADC}}/f_{\text{trig}}$ cycles; the ADC converts each channel in turn and the DMA writes each result into a circular buffer, firing HT and TC. The "CPU" handler averages the half it was given and checks the DMA isn't writing into it.

:::code file=adc_dma.c
```c
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
```
:::end

## Exercises

:::exercise
A thermistor divider has a 47 kΩ source impedance and readings are a few percent low with 3-cycle sampling. What do you change and why?
:::solution
Increase the sampling time (for example to 144 or 480 cycles). The ADC's sample capacitor (a few pF) charges through the source resistance with time constant $RC$; 12-bit accuracy needs about $\ln(2^{13}) \approx 9$ time constants. Alternatively, add a capacitor of around 100 nF at the pin so the charge comes from it, not through the 47 kΩ.
:::end

:::exercise
Your HT handler takes 4 ms and the half-buffer lasts 3.2 ms. What happens?
:::solution
The DMA wraps into the half you're still reading and overwrites it, so you process a mix of old and new samples, silently. Make the buffer bigger, make the processing faster, or move it out of the interrupt into a task with a deadline. The model's `half_violation` check catches this.
:::end

## Quiz

:::quiz
- type: num
  q: Conversion time in µs with 15-cycle sampling at 21 MHz?
  answer: 1.2857
  tol: 0.001
  unit: µs
  py: "(15+12)/21e6*1e6"
  explain: (t_samp + 12)/f_ADC.
- type: num
  q: Fastest trigger rate for a 4-channel scan with that timing, in kHz?
  answer: 194.44
  tol: 0.001
  unit: kHz
  py: "1/(4*27/21e6)/1e3"
  explain: One scan per trigger.
- type: num
  q: A 256-sample circular buffer at 4 channels and 10 kHz. Time between HT and TC interrupts, in ms?
  answer: 3.2
  tol: 0.001
  unit: ms
  py: "256/4/2/10e3*1e3"
  explain: Half the buffer is 32 scans.
- type: num
  q: Conversion time in µs with 480-cycle sampling at 21 MHz?
  answer: 23.43
  tol: 0.001
  unit: µs
  py: "(480+12)/21e6*1e6"
  explain: For high-impedance sources.
- type: mc
  q: Why trigger the ADC from a timer instead of starting conversions in software?
  options:
    - it uses fewer pins
    - the sample instants are as regular as the timer clock, with no software jitter
    - it increases resolution
    - DMA requires it
  answer: 1
  explain: DSP assumes uniform sampling.
- type: mc
  q: On a half-transfer interrupt, which part of the buffer should the CPU process?
  options:
    - the second half
    - the first half, while the DMA fills the second
    - the whole buffer
    - nothing until TC
  answer: 1
  explain: Double buffering.
:::end

:::verify
assert abs((15 + 12) / 21e6 * 1e6 - 1.2857) < 1e-4
assert 21e6 / 10e3 == 2100
assert 4 * 27 / 21e6 > 1 / 250e3
:::end
