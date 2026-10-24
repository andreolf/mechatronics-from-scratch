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
