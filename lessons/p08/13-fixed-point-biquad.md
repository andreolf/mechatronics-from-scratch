---
id: p08-l13
minutes: 45
summary: Most microcontrollers in motor drives have no floating-point unit, or one too slow for a 20 kHz loop. You implement a biquad in C with Q15 data, Q14 coefficients and a 64-bit accumulator, show why plain rounding drifts past 1 LSB through the feedback, fix it with error feedback, and catch the coefficient-quantisation trap of very low cutoffs.
---

## Q formats recap

A **Q15** number is a signed 16-bit integer read as $n/2^{15}$, covering $[-1, 1)$ with a resolution (1 LSB) of $2^{-15} \approx 3.05\times10^{-5}$ (Phase 06 lesson 2). Multiplying two Q15 values gives a Q30 product in 32 bits.

Biquad feedback coefficients don't fit in $[-1, 1)$: for a low-pass, $a_1 \approx -2$ when the cutoff is low. So store coefficients in **Q14** (range $[-2, 2)$, resolution $6.1\times10^{-5}$). A Q15 × Q14 product is Q29.

## The structure

Use **Direct Form I** (lesson 5): it keeps the input and output histories in Q15, and all five products go into one wide accumulator, so the only rounding happens **once per sample**, when the Q29 sum is shifted back to Q15.

```
acc  = b0·x[n] + b1·x[n−1] + b2·x[n−2] − a1·y[n−1] − a2·y[n−2]   (Q29, 64-bit)
y[n] = saturate( (acc + 2^13) >> 14 )                              (Q15)
```

Two things go wrong in practice.

1. **Rounding noise recirculates.** The rounding error $e[n]$ (up to ½ LSB) enters at the output, and the feedback filters it by $1/A(z)$. Its gain is larger than 1 when the poles are near the unit circle, so the output can wander more than 1 LSB away from the ideal filter.
2. **Coefficient quantisation.** At a very low cutoff the $b$ coefficients are tiny ($K^2 \approx (\pi f_c/f_s)^2$) and round to a few counts, wrecking the DC gain, and the poles move.

**Error feedback** fixes the first: keep the bits you threw away (the remainder of the shift) and add them into the next sample's accumulator. On average nothing is lost, and the error spectrum is pushed away from DC.

For the second, use more coefficient bits (Q30 coefficients in 32 bits with a 64-bit accumulator), split the gain out of the $b$s, or decimate first so $f_c/f_s$ is not so small (lesson 12).

**Saturate, don't wrap.** Overflowing int16 flips the sign: a full-scale positive output becomes full-scale negative, which in a current loop is a violent kick. Always clamp.

:::figure widget=fixedbiquad caption="Floating-point and fixed-point outputs of the same 2nd-order Butterworth. Lower the coefficient bits or the cutoff and watch the error (amplified ×100) grow."
:::end

## Worked example

A 100 Hz Butterworth low-pass at $f_s = 1$ kHz (lesson 6):

1. $K = \tan(\pi\cdot0.1) = 0.3249$. Then $b_0 = 0.06746$, $a_1 = -1.14298$, $a_2 = 0.41280$.
2. In Q14: $b = [1105, 2210, 1105]$ and $a = [16384, -18727, 6763]$. The DC gain is $\sum b/\sum a = 4420/4420 = 1$ exactly.
3. The same design at $f_c = 2$ Hz gives $b_0 = 3.9\times10^{-5}$, which is **0.64 counts**. The $b$s round to $[1, 1, 1]$, the $a$s sum to 2, and the DC gain becomes **1.5**: a 50 % error from a filter that looks fine in floating point.

## Code it from scratch

The program compares the Q15 filter with a double-precision filter using the *same* quantised coefficients, so only the arithmetic differs. It runs three test vectors, a step, a sine and noise, with and without error feedback.

:::code file=biquad_q15.c
```c
#include <stdint.h>
#include <stdio.h>
#include <math.h>
#include <stdlib.h>

#define PI 3.14159265358979323846

/* Q15 biquad, Direct Form I, coefficients in Q14 (so |a1| < 2 fits), 64-bit accumulator,
   first-order error feedback: the rounding remainder is added back next sample. */
typedef struct {
    int16_t b0, b1, b2, a1, a2;      /* Q14 */
    int16_t x1, x2, y1, y2;          /* Q15 state */
    int32_t err;                     /* rounding remainder, Q29 */
    int error_feedback;
} biquad_q15;

static int16_t to_q14(double c) {
    double r = round(c * 16384.0);
    if (r > 32767 || r < -32768) { printf("FAIL coefficient %f out of Q14 range\n", c); exit(1); }
    return (int16_t)r;
}

static int16_t sat16(int64_t v) {
    if (v > 32767) return 32767;
    if (v < -32768) return -32768;
    return (int16_t)v;
}

static int16_t biquad_step(biquad_q15 *f, int16_t x) {
    int64_t acc = (int64_t)f->b0 * x + (int64_t)f->b1 * f->x1 + (int64_t)f->b2 * f->x2
                - (int64_t)f->a1 * f->y1 - (int64_t)f->a2 * f->y2;      /* Q29 */
    if (f->error_feedback) acc += f->err;
    int64_t rounded = (acc + (1 << 13)) >> 14;                            /* Q29 -> Q15 */
    if (f->error_feedback) f->err = (int32_t)(acc - (rounded << 14));
    int16_t y = sat16(rounded);
    f->x2 = f->x1; f->x1 = x; f->y2 = f->y1; f->y1 = y;
    return y;
}

typedef struct { double b0, b1, b2, a1, a2, x1, x2, y1, y2; } biquad_f;

static double biquad_f_step(biquad_f *f, double x) {
    double y = f->b0 * x + f->b1 * f->x1 + f->b2 * f->x2 - f->a1 * f->y1 - f->a2 * f->y2;
    f->x2 = f->x1; f->x1 = x; f->y2 = f->y1; f->y1 = y;
    return y;
}

/* 2nd-order Butterworth low-pass via the bilinear transform (lesson 6) */
static void butter2(double fc, double fs, double c[5]) {
    double K = tan(PI * fc / fs), n = 1.0 / (1.0 + sqrt(2.0) * K + K * K);
    c[0] = K * K * n; c[1] = 2 * c[0]; c[2] = c[0];
    c[3] = 2 * (K * K - 1) * n; c[4] = (1 - sqrt(2.0) * K + K * K) * n;
}

static uint32_t rng = 12345;
static double urand(void) { rng = rng * 1664525u + 1013904223u; return (rng >> 8) / 16777216.0; }

static double run(int vec, int ef, int verbose) {
    double c[5]; butter2(100.0, 1000.0, c);
    biquad_q15 q = { to_q14(c[0]), to_q14(c[1]), to_q14(c[2]), to_q14(c[3]), to_q14(c[4]), 0, 0, 0, 0, 0, ef };
    /* reference: double precision with the SAME quantised coefficients, so only arithmetic differs */
    biquad_f r = { q.b0 / 16384.0, q.b1 / 16384.0, q.b2 / 16384.0, q.a1 / 16384.0, q.a2 / 16384.0, 0, 0, 0, 0 };
    double worst = 0, sq = 0; int n = 4000;
    for (int i = 0; i < n; i++) {
        int16_t x;
        if (vec == 0) x = 16384;                                            /* half-scale step */
        else if (vec == 1) x = (int16_t)lround(20000 * sin(2 * PI * 37.0 * i / 1000.0));
        else x = (int16_t)lround((urand() - 0.5) * 20000);                 /* noise */
        double yr = biquad_f_step(&r, x / 32768.0) * 32768.0;
        double e = biquad_step(&q, x) - yr;
        if (fabs(e) > worst) worst = fabs(e);
        sq += e * e;
    }
    if (verbose) printf("vector %d error_feedback %d: max %.3f LSB, rms %.3f LSB\n", vec, ef, worst, sqrt(sq / n));
    return worst;
}

static double dc_gain_q14(double fc) {
    double c[5]; butter2(fc, 1000.0, c);
    double num = to_q14(c[0]) + to_q14(c[1]) + to_q14(c[2]);
    double den = 16384.0 + to_q14(c[3]) + to_q14(c[4]);
    return num / den;
}

int main(void) {
    double worst_plain = 0, worst_ef = 0;
    for (int v = 0; v < 3; v++) {
        double a = run(v, 0, 1), b = run(v, 1, 1);
        if (a > worst_plain) worst_plain = a;
        if (b > worst_ef) worst_ef = b;
    }
    /* plain rounding drifts past 1 LSB through the feedback; error feedback keeps it under */
    if (!(worst_plain > 1.0 && worst_ef < 1.0)) { printf("FAIL error bounds\n"); return 1; }
    /* coefficient quantisation: fine at fc = 100 Hz, ruinous at fc = 2 Hz */
    double g100 = dc_gain_q14(100.0), g2 = dc_gain_q14(2.0);
    printf("Q14 DC gain: fc=100 Hz %.4f, fc=2 Hz %.4f\n", g100, g2);
    if (fabs(g100 - 1.0) > 1e-3 || fabs(g2 - 1.5) > 1e-9) { printf("FAIL dc gain\n"); return 1; }
    printf("PASS\n");
    return 0;
}
```
:::end

Typical output: plain rounding reaches about 1.56 LSB on the sine; with error feedback the worst case is about 0.9 LSB and the RMS error drops from 0.58 to 0.33 LSB.

## Exercises

:::exercise
Why does Direct Form I suit fixed point better than Direct Form II, which needs only two state variables?
:::solution
DF-II keeps an internal state $w[n] = x[n] - a_1w[n-1] - a_2w[n-2]$ whose gain can be much larger than the input's (it's the input filtered by $1/A(z)$), so it overflows Q15 or needs headroom scaling. DF-I stores only real inputs and outputs, which are already in range, and accumulates everything in one wide sum.
:::end

:::exercise
Your 2 Hz low-pass at 1 kHz must run in Q15. Give two fixes.
:::solution
(1) Decimate first: at 100 Hz sampling, $f_c/f_s = 0.02$ and $b_0 \approx 0.0036$, which is 59 counts in Q14. (2) Keep the filter rate but use 32-bit Q30 coefficients with a 64-bit accumulator, or apply the gain separately and normalise the $b$s to $[1, 2, 1]$.
:::end

## Quiz

:::quiz
- type: num
  q: One Q15 LSB as a fraction of full scale?
  answer: 3.0518e-5
  tol: 0.001
  py: "2**-15"
  explain: 1/32768.
- type: num
  q: Q14 value of a1 = −1.14298?
  answer: -18727
  tol: 0.0001
  py: "round(-1.1429805025399011*16384)"
  explain: Multiply by 2^14 and round.
- type: num
  q: Q-format of a Q15 sample times a Q14 coefficient?
  answer: 29
  tol: 0.001
  unit: fraction bits
  py: "15+14"
  explain: Fraction bits add.
- type: num
  q: DC gain of the 2 Hz design after Q14 quantisation (b = 1, 1, 1 and a sums to 2)?
  answer: 1.5
  tol: 0.001
  py: "3/(16384-32477+16095)"
  explain: Should be 1.
- type: mc
  q: Error feedback…
  options:
    - doubles the coefficient precision
    - adds the discarded rounding remainder into the next sample
    - prevents overflow
    - removes the need for saturation
  answer: 1
  explain: Nothing is lost on average.
- type: mc
  q: On overflow, a fixed-point filter output should…
  options:
    - wrap around
    - saturate at the limit
    - reset the filter state to zero
    - be left to the compiler
  answer: 1
  explain: Wrapping flips the sign.
:::end

:::verify
import math
K = math.tan(math.pi*0.1); n = 1/(1+math.sqrt(2)*K+K*K)
assert round(K*K*n*16384) == 1105 and round(2*(K*K-1)*n*16384) == -18727
K = math.tan(math.pi*0.002); n = 1/(1+math.sqrt(2)*K+K*K)
assert abs(K*K*n*16384 - 0.641) < 0.001
:::end
