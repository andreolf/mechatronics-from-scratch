/* Balancing-robot firmware structure on a simulated plant: a 500 Hz loop that reads the IMU and encoders, runs a
   complementary filter and state feedback, and writes the motor voltage. The plant is the nonlinear model of
   Lesson 02 integrated at 10 kHz. Timing numbers are an illustrative budget for an 84 MHz Cortex-M4. */
#include <math.h>
#include <stdio.h>

#define PI 3.14159265358979
static const double M = 0.9, m = 0.12, r = 0.04, l = 0.07, Ib = 0.004, Iw = 9.6e-5, g = 9.81, kt = 0.25, ke = 0.25, Rm = 4.0;
static const double K[4] = {3.162, 13.965, 19.922, 2.097};   /* LQR gains from Lesson 05 (voltage per unit state) */
static const double H_IMU = 0.11, VBAT = 11.1, DT_CTRL = 0.002, DT_SIM = 1e-4;

typedef struct { double x, xd, th, thd, xdd, thdd; } Plant;

static unsigned long long rs = 12345;
static double urand(void) { rs = rs * 6364136223846793005ULL + 1442695040888963407ULL; return ((rs >> 11) + 0.5) / 9007199254740992.0; }
static double gauss(void) { return sqrt(-2 * log(urand())) * cos(2 * PI * urand()); }

static void accel(const double s[4], double v, double push, double out[2]) {
  double th = s[2], c = cos(th), sn = sin(th), w_rel = s[1] / r - s[3], tau = 2 * kt * (v - ke * w_rel) / Rm;
  double a = M + m + Iw / (r * r), b = M * l * c, d = Ib + M * l * l;
  double f1 = tau / r + M * l * sn * s[3] * s[3] + push, f2 = M * g * l * sn - tau + push * l;
  double det = a * d - b * b;
  out[0] = (d * f1 - b * f2) / det; out[1] = (a * f2 - b * f1) / det;
}

static void step(Plant *p, double v, double push, double dt) {   /* RK4 */
  double s[4] = {p->x, p->xd, p->th, p->thd}, k[4][4], t[4], a[2];
  for (int j = 0; j < 4; j++) {
    for (int i = 0; i < 4; i++) t[i] = s[i] + (j == 0 ? 0 : (j == 3 ? dt : dt / 2)) * (j == 0 ? 0 : k[j - 1][i]);
    accel(t, v, push, a); k[j][0] = t[1]; k[j][1] = a[0]; k[j][2] = t[3]; k[j][3] = a[1];
  }
  for (int i = 0; i < 4; i++) s[i] += dt / 6 * (k[0][i] + 2 * k[1][i] + 2 * k[2][i] + k[3][i]);
  accel(s, v, push, a);
  p->x = s[0]; p->xd = s[1]; p->th = s[2]; p->thd = s[3]; p->xdd = a[0]; p->thdd = a[1];
}

/* ---- firmware ---- */
typedef struct { double th_est, x_prev; int first; } Ctl;

static double read_gyro(const Plant *p) { return p->thd + 0.01 + 0.002 * gauss(); }          /* 0.01 rad/s bias */
static double read_acc_tilt(const Plant *p) {
  double ax = g * sin(p->th) + p->xdd * cos(p->th) + H_IMU * p->thdd, az = g * cos(p->th) - p->xdd * sin(p->th);
  return atan2(ax + 0.05 * gauss(), az + 0.05 * gauss());
}
static double read_encoder_x(const Plant *p) { double cpr = 1440, ang = p->x / r; return floor(ang / (2 * PI) * cpr) * 2 * PI / cpr * r; }

static double control(Ctl *c, const Plant *p) {
  double gy = read_gyro(p), at = read_acc_tilt(p), x = read_encoder_x(p);
  if (c->first) { c->th_est = at; c->x_prev = x; c->first = 0; }
  c->th_est = 0.995 * (c->th_est + gy * DT_CTRL) + 0.005 * at;                  /* complementary filter */
  double xd = (x - c->x_prev) / DT_CTRL; c->x_prev = x;
  double v = K[0] * x + K[1] * xd + K[2] * c->th_est + K[3] * gy;
  return v > VBAT ? VBAT : (v < -VBAT ? -VBAT : v);
}

int main(void) {
  /* timing budget for one 2 ms period */
  double f_cpu = 84e6, i2c_bits = 2 + 17 * 9;                                   /* start/stop + 17 bytes with ACK */
  double t_i2c = i2c_bits / 400e3 * 1e6, t_cyc[5] = {500, 2000, 1500, 300, 8000};
  const char *names[5] = {"encoder read", "filter", "control", "PWM update", "telemetry"};
  double total = t_i2c; printf("IMU read over I2C at 400 kHz: %.1f us\n", t_i2c);
  for (int i = 0; i < 5; i++) { double us = t_cyc[i] / f_cpu * 1e6; total += us; printf("%-13s %6.0f cycles %6.1f us\n", names[i], t_cyc[i], us); }
  printf("total %.1f us of %.0f us: %.1f %% used\n", total, DT_CTRL * 1e6, 100 * total / (DT_CTRL * 1e6));
  int ok_budget = total < 0.5 * DT_CTRL * 1e6;

  Plant p = {0, 0, 5 * PI / 180, 0, 0, 0}; Ctl c = {0, 0, 1}; double v = 0, maxth = 0, maxv = 0; int steps = (int)(DT_CTRL / DT_SIM + 0.5);
  for (int k = 0; k < 2500; k++) {                                              /* 5 s of 500 Hz loop iterations */
    v = control(&c, &p);
    for (int j = 0; j < steps; j++) { double push = (k >= 1000 && k < 1025) ? 1.5 : 0.0; step(&p, v, push, DT_SIM); }   /* 1.5 N for 50 ms at 2 s */
    if (k > 250 && fabs(p.th) > maxth) maxth = fabs(p.th);
    if (fabs(v) > maxv) maxv = fabs(v);
  }
  printf("5 deg start, 1.5 N push for 50 ms at 2 s: max tilt after 0.5 s %.2f deg, final tilt %.3f deg, final position %.1f cm, peak voltage %.2f V\n",
         maxth * 180 / PI, p.th * 180 / PI, 100 * p.x, maxv);
  int ok_ctrl = maxth * 180 / PI < 15 && fabs(p.th) * 180 / PI < 1;
  printf(ok_budget && ok_ctrl ? "PASS\n" : "FAIL\n");
  return 0;
}
