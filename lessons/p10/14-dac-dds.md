---
id: p10-l14
minutes: 35
summary: Direct digital synthesis makes any frequency from a fixed sample clock by adding a tuning word to a phase accumulator and looking the top bits up in a sine table. You derive f_out = M f_s / 2^32 and its resolution, implement a 32-bit DDS feeding a 12-bit DAC from a 256-entry table, and test that the output frequency, measured from interpolated zero crossings, lands within 0.1 % of the request across the band.
---

## The phase accumulator

To output a sine of frequency $f$ from a DAC updated at a fixed rate $f_s$, you need the phase at each sample, $\phi_k = 2\pi f k / f_s$. DDS keeps that phase as a **32-bit unsigned integer** $A$, where the full range $2^{32}$ is one cycle, and adds a constant **tuning word** $M$ every sample:

$$A_{k+1} = (A_k + M) \bmod 2^{32}, \qquad f_{\text{out}} = \frac{M\,f_s}{2^{32}}.$$

Overflow *is* the wrap of the phase, so unsigned integer arithmetic does it for free. The frequency resolution is $f_s/2^{32}$: at $f_s$ = 100 kHz, 23 µHz. To get $f$, use $M = \text{round}(f \cdot 2^{32}/f_s)$.

## The lookup table

Only the top bits of $A$ index the sine table: with 256 entries, `lut[A >> 24]`. The table is 12-bit values for the DAC, $\text{lut}[i] = \text{round}(2047.5 + 2047.5\sin(2\pi i/256))$. Throwing away the low 24 bits (**phase truncation**) adds a small periodic error, which shows up as spurs in the spectrum; interpolating between neighbouring entries, or a bigger table, reduces it. Nyquist still applies: keep $f_{\text{out}}$ well below $f_s/2$, in practice under about $0.4 f_s$, and follow the DAC with a reconstruction low-pass filter.

On an STM32 the sample clock is a timer that triggers the DAC, and DMA feeds it from a buffer that the DDS loop refills, like the ADC in reverse (lesson 13).

:::figure widget=dds caption="The phase accumulator as a sawtooth (top) and the DAC output from the table (bottom), sample by sample. Change the tuning word: the frequency is exactly M·f_s/2³²."
:::end

## Worked example

$f_s$ = 100 kHz, target 1 kHz.

1. $M = \text{round}(1000 \cdot 2^{32} / 10^5) = 42\,949\,673$.
2. $f_{\text{out}} = 42\,949\,673 \cdot 10^5 / 2^{32} = 1000.0000003$ Hz.
3. Resolution $10^5/2^{32} = 23.3$ µHz.
4. For 12.345 kHz, $M$ = 530 213 713 and the error is far below 0.1 %.
5. Each output cycle has $f_s/f = 100$ samples; at 40 kHz, only 2.5, so the stair-step needs a good filter.

## Code it from scratch

:::code file=dds.c
```c
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <math.h>

#define PI 3.14159265358979323846
static uint16_t lut[256];
static void lut_init(void) { for (int i = 0; i < 256; i++) lut[i] = (uint16_t)lround(2047.5 + 2047.5 * sin(2 * PI * i / 256)); }

typedef struct { uint32_t acc, tuning; } dds_t;
static uint32_t dds_tuning(double f, double fs) { return (uint32_t)llround(f * 4294967296.0 / fs); }
static uint16_t dds_next(dds_t *d) { uint16_t v = lut[d->acc >> 24]; d->acc += d->tuning; return v; }   /* wraps mod 2^32 */

/* frequency from rising zero crossings of the DAC samples, with linear interpolation */
static double measure(const uint16_t *x, int n, double fs) {
  double first = -1, last = -1; int crossings = 0; const double mid = 2047.5;
  for (int i = 1; i < n; i++)
    if (x[i - 1] < mid && x[i] >= mid) {
      double t = (i - 1) + (mid - x[i - 1]) / (double)(x[i] - x[i - 1]);
      if (first < 0) first = t;
      last = t; crossings++;
    }
  return (crossings - 1) / ((last - first) / fs);
}
#define CHECK(c) do { if (!(c)) { printf("FAIL line %d: %s\n", __LINE__, #c); exit(1); } } while (0)

int main(void) {
  lut_init();
  const double fs = 100e3; const int n = 100000;            /* 1 s of samples */
  static uint16_t out[100000];
  CHECK(dds_tuning(1000, fs) == 42949673u);
  const double targets[] = {5.0, 50.0, 1000.0, 2500.5, 12345.0, 30000.0};
  for (int k = 0; k < 6; k++) {
    dds_t d = {0, dds_tuning(targets[k], fs)};
    for (int i = 0; i < n; i++) out[i] = dds_next(&d);
    double exact = d.tuning * fs / 4294967296.0, meas = measure(out, n, fs);
    double err = fabs(meas - targets[k]) / targets[k];
    printf("target %9.3f Hz  M=%10u  exact %.6f Hz  measured %.4f Hz  (%.5f %%)\n", targets[k], d.tuning, exact, meas, 100 * err);
    CHECK(err < 0.001);                                      /* within 0.1 % */
    CHECK(fabs(exact - targets[k]) <= fs / 4294967296.0);    /* within one resolution step */
  }
  /* amplitude and shape: the output tracks an ideal sine to within the table's phase step */
  dds_t d = {0, dds_tuning(1000, fs)}; double worst = 0;
  for (int i = 0; i < 1000; i++) {
    uint32_t a = d.acc; double ideal = 2047.5 + 2047.5 * sin(2 * PI * (a / 4294967296.0));
    double e = fabs(dds_next(&d) - ideal); if (e > worst) worst = e;
  }
  printf("worst deviation from the ideal sine: %.1f LSB (bound 2047.5*2*pi/256 = %.1f)\n", worst, 2047.5 * 2 * PI / 256);
  CHECK(worst <= 2047.5 * 2 * PI / 256 + 0.5);
  CHECK(lut[0] == 2048 && lut[64] == 4095 && lut[192] == 0);
  printf("PASS\n");
  return 0;
}
```
:::end

## Exercises

:::exercise
You need to sweep from 100 Hz to 10 kHz smoothly over 1 second. How does DDS make that easy, and why is there no click when the frequency changes?
:::solution
Change the tuning word each sample (a linear ramp of $M$ gives a linear chirp). The accumulator's phase is continuous, because only its *rate* changes, so the waveform never jumps. Switching between two fixed tables would create a phase discontinuity, which you'd hear as a click.
:::end

:::exercise
Why does the worst-case error check use $2047.5 \cdot 2\pi/256$?
:::solution
Truncating the phase to 8 bits can be off by up to one table step, $2\pi/256$ rad. The sine's steepest slope is its amplitude, 2047.5 LSB per radian, so the worst error is about $2047.5 \cdot 2\pi/256 \approx 50$ LSB, plus half an LSB of rounding. Linear interpolation between entries would cut it to below 1 LSB.
:::end

## Quiz

:::quiz
- type: num
  q: Tuning word for 1 kHz at f_s = 100 kHz with a 32-bit accumulator?
  answer: 42949673
  tol: 0.0000001
  unit: ""
  py: "round(1000*2**32/100e3)"
  explain: f·2³²/f_s.
- type: num
  q: Frequency resolution in µHz at f_s = 100 kHz?
  answer: 23.28
  tol: 0.001
  unit: µHz
  py: "100e3/2**32*1e6"
  explain: f_s/2³².
- type: num
  q: Output frequency in Hz for M = 2^24 at f_s = 100 kHz?
  answer: 390.625
  tol: 0.001
  unit: Hz
  py: "2**24*100e3/2**32"
  explain: One table entry per sample.
- type: num
  q: Samples per cycle at 12.345 kHz with f_s = 100 kHz?
  answer: 8.1
  tol: 0.001
  unit: ""
  py: "100e3/12345"
  explain: f_s/f.
- type: mc
  q: What happens when the accumulator overflows?
  options:
    - the output glitches
    - nothing special, it is the phase wrapping through 2π
    - the frequency doubles
    - the DAC resets
  answer: 1
  explain: Unsigned overflow is modulo 2³².
- type: mc
  q: Which bits of the accumulator index a 256-entry table?
  options:
    - the low 8 bits
    - the top 8 bits
    - bits 8 to 15
    - all 32
  answer: 1
  explain: The most significant bits are the coarse phase.
:::end

:::verify
assert round(1000 * 2**32 / 100e3) == 42949673
assert abs(42949673 * 100e3 / 2**32 - 1000) < 1e-6
assert round(12345 * 2**32 / 100e3) == 530213713
:::end
