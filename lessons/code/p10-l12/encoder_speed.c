#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <math.h>

#define PI 3.14159265358979323846
#define LINES 1000
#define CPR (4 * LINES)

typedef struct { uint16_t cnt; int32_t pos; uint32_t last_a_rise_us, period_us; int have_period, a, b; } encoder_hw;

/* feed the true shaft angle at 1 us resolution; edges update the x4 counter and the capture on A rising */
static void encoder_step(encoder_hw *e, double angle_rad, uint32_t t_us) {
  int32_t pos = (int32_t)floor(angle_rad / (2 * PI) * CPR);     /* quadrature state index */
  while (e->pos != pos) {
    int dir = pos > e->pos ? 1 : -1; e->pos += dir;
    int phase = ((e->pos % 4) + 4) % 4;                         /* 0:A0B0 1:A1B0 2:A1B1 3:A0B1 */
    int a = phase == 1 || phase == 2, b = phase >= 2;
    if (a && !e->a && dir > 0) {                                /* input capture on A rising */
      if (e->last_a_rise_us) { e->period_us = t_us - e->last_a_rise_us; e->have_period = 1; }
      e->last_a_rise_us = t_us;
    }
    e->a = a; e->b = b; e->cnt = (uint16_t)(e->cnt + dir);      /* 16-bit hardware counter wraps */
  }
}
static double m_method(uint16_t now, uint16_t prev, double ts) {
  int16_t dn = (int16_t)(uint16_t)(now - prev);                 /* signed difference absorbs the wrap */
  return 2 * PI * dn / (CPR * ts);
}
static double t_method(uint32_t period_us) { return 2 * PI * 4 / (CPR * period_us * 1e-6); }
#define CHECK(c) do { if (!(c)) { printf("FAIL line %d: %s\n", __LINE__, #c); exit(1); } } while (0)

int main(void) {
  const double rpms[] = {2, 15, 300, 3000, 6000};
  for (int i = 0; i < 5; i++) {
    double w = rpms[i] * 2 * PI / 60;                            /* constant speed, rad/s */
    encoder_hw e = {0}; e.cnt = 65000;                           /* start near the wrap */
    double sim_s = rpms[i] < 10 ? 0.5 : 0.2;
    uint16_t prev = e.cnt; double m_sum = 0; int m_n = 0, wrapped = 0;
    for (uint32_t t = 1; t <= (uint32_t)(sim_s * 1e6); t++) {
      uint16_t before = e.cnt;
      encoder_step(&e, w * t * 1e-6 + 0.0001, t);
      if (e.cnt < before) wrapped = 1;
      if (t % 1000 == 0) { m_sum += m_method(e.cnt, prev, 1e-3); m_n++; prev = e.cnt; }   /* 1 kHz sampling */
    }
    double m_avg = m_sum / m_n, t_est = e.have_period ? t_method(e.period_us) : 0;
    double m_err = fabs(m_avg - w) / w, t_err = fabs(t_est - w) / w;
    printf("%6.0f rpm: M %8.3f rad/s (%.3f %%), T %8.3f rad/s (%.4f %%)%s\n", rpms[i], m_avg, 100 * m_err, t_est, 100 * t_err, wrapped ? ", counter wrapped" : "");
    CHECK(e.have_period && t_err < 0.005);                       /* T method good everywhere here (0.5 %) */
    if (rpms[i] >= 300) CHECK(m_err < 0.005);                    /* M method good at speed */
    if (rpms[i] >= 3000) CHECK(wrapped);                         /* and the wrap was handled */
  }
  /* the wrap example: 65500 -> 164 is +200 counts */
  CHECK((int16_t)(uint16_t)(164 - 65500) == 200);
  CHECK(fabs(m_method(164, 65500, 1e-3) - 2 * PI * 50) < 1e-9);  /* 3000 rpm */
  /* low speed: one 1 ms sample of the M method is 0 or 1 count, i.e. 0 or 15 rpm */
  CHECK(fabs(m_method(1, 0, 1e-3) * 60 / (2 * PI) - 15) < 1e-9);
  printf("PASS\n");
  return 0;
}
