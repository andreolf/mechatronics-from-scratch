---
id: p20-l04
minutes: 45
summary: The balancing robot's firmware is a 500 Hz loop of sense, estimate, control and actuate. You budget the loop's time from the I2C transfer and cycle counts, then write it in C against the nonlinear plant model with a biased, noisy IMU and a quantised encoder, and check that it uses under half its deadline and holds the robot upright through a push.
---

## One loop, one deadline

Every 2 ms the firmware must:

1. read the IMU (gyro rate and accelerometer) and the wheel encoders;
2. fuse them into a tilt estimate with a complementary filter, $\hat\theta_k = \alpha(\hat\theta_{k-1} + \omega_k T) + (1 - \alpha)\theta_{acc,k}$;
3. compute the motor voltage $v = K s$ from the estimated state;
4. update the PWM and, if time allows, send telemetry.

## The timing budget

Budget the worst case before writing code. An I2C read of 14 data bytes plus address and register bytes is about $2 + 17 \times 9$ bit times; at 400 kHz that is 387.5 µs if the CPU waits for it (DMA frees the CPU but not the bus). Computation is cheap at 84 MHz; telemetry formatting is often the largest compute item. Aim to use under half the period, so a late interrupt or a future feature does not cause a deadline miss (Phase 18), and measure on the target with a GPIO toggle and an oscilloscope, or the cycle counter.

## Testing on a simulated plant

The firmware logic is plain C that calls `read_gyro`, `read_acc_tilt` and `read_encoder_x`. On the target those talk to hardware; here they sample the nonlinear model of Lesson 02 with a 0.01 rad/s gyro bias, noise, and a 1440-count encoder. The same control code then runs unchanged in both places, a habit that catches most bugs before the robot can fall.

:::figure widget=looptiming caption="The 2 ms loop as a timeline: I2C transfer, computation and telemetry. Change the I2C clock, CPU frequency and telemetry size; tasks past the deadline turn red."
:::end

## Worked example

1. Budget: IMU read 387.5 µs, encoder read 6.0 µs, filter 23.8 µs, control 17.9 µs, PWM update 3.6 µs, telemetry 95.2 µs: total 533.9 µs, 26.7 % of the 2 ms period.
2. Closed loop from 5°, with a 1.5 N push for 50 ms at 2 s: maximum tilt after the first 0.5 s 2.19°, final tilt 0.033°, final position −1.1 cm, peak motor voltage 2.06 V.

## Code it from scratch

:::code file=balance_fw.c
```c
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
```
:::end

## In practice

PlatformIO builds and flashes the same C (or C++) for STM32, ESP32 or RP2040 boards, and its unit-test runner can run the control code on the host, as here. Keep hardware access behind small functions, run the loop from a timer interrupt or an RTOS task with `vTaskDelayUntil`, and log loop time and deadline misses from the first flight of the code.

## Exercises

:::exercise
How long does the 155-bit IMU read take at 1 MHz (Fast-mode Plus)?
:::solution
$155 / 10^6 = 155$ µs, so the loop's busiest item shrinks from 387.5 µs to 155 µs.
:::end

:::exercise
Why does the complementary filter use $\alpha$ close to 1 at 500 Hz?
:::solution
The filter's crossover time constant is about $\alpha T / (1 - \alpha)$. With $\alpha = 0.995$ and $T = 2$ ms that is 0.4 s: the gyro dominates fast motion and the accelerometer corrects slow drift, so the accelerometer's dynamic errors (Lesson 03) are filtered out.
:::end

## Quiz

:::quiz
- type: num
  q: Bit time of 155 bits at 400 kHz (µs)?
  answer: 387.5
  tol: 0.001
  py: "155/400e3*1e6"
  explain: Bits over clock rate.
- type: num
  q: Time for 8000 cycles at 84 MHz (µs)?
  answer: 95.2
  tol: 0.002
  py: "8000/84e6*1e6"
  explain: Cycles over frequency.
- type: num
  q: Share of a 2 ms period used by 534 µs (%)?
  answer: 26.7
  tol: 0.003
  py: "100*534/2000"
  explain: Busy time over period.
- type: num
  q: Complementary filter time constant for α 0.995 and T 2 ms (s)?
  answer: 0.398
  tol: 0.005
  py: "0.995*0.002/(1-0.995)"
  explain: α T / (1 − α).
- type: mc
  q: Why keep hardware access behind small functions?
  options: ["The same control code runs on the target and against a simulated plant", "It makes the code faster", "The compiler requires it", "It removes the need for tests"]
  answer: 0
  explain: Host testing catches bugs early.
- type: mc
  q: Which item dominates this loop's budget?
  options: ["The blocking I2C read", "The control law", "The PWM update", "The encoder read"]
  answer: 0
  explain: Bus time, not computation.
:::end
