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
