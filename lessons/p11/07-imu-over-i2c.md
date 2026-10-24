---
id: p11-l07
minutes: 40
summary: A sensor driver is mostly a register map, a burst read and some scaling, and it's testable on a laptop if every bus access goes through a small HAL interface. You derive the scale factors and the burst-read reasoning for an MPU-6050-style IMU, write the driver against a HAL, and test it by replaying recorded register dumps that check both the bytes it decodes and every transaction it makes.
---

## Register maps

An I2C sensor looks like a small array of 8-bit registers. For the MPU-6050, a common six-axis IMU, the datasheet's register map gives:

| register | address | meaning |
|---|---|---|
| GYRO_CONFIG | 0x1B | bits 4:3 select ±250, ±500, ±1000 or ±2000 °/s |
| ACCEL_CONFIG | 0x1C | bits 4:3 select ±2, ±4, ±8 or ±16 g |
| ACCEL_XOUT_H … GYRO_ZOUT_L | 0x3B–0x48 | 14 bytes: accel X, Y, Z, temperature, gyro X, Y, Z, each 16-bit signed, high byte first |
| PWR_MGMT_1 | 0x6B | bit 6 = SLEEP (set at power-up); clock source in bits 2:0 |
| WHO_AM_I | 0x75 | reads 0x68 |

The driver's job: check WHO_AM_I so a wrong or missing part fails loudly, wake the chip, set the ranges, then read and scale samples.

## Scaling

A 16-bit signed reading spans ±32 768 counts over the full-scale range, so the sensitivity is

$$S = \frac{32768}{\text{range}}: \quad 16384\ \text{LSB/g at } \pm 2\,g, \quad 131\ \text{LSB/(°/s) at } \pm 250\,°/s.$$

The datasheet rounds some of these (65.5, 32.8, 16.4 for the gyro). The temperature is $T = \text{raw}/340 + 36.53$ °C. At rest, the accelerometer measures the reaction to gravity, so roll and pitch follow from it:

$$\phi = \operatorname{atan2}(a_y, a_z), \qquad \theta = \operatorname{atan2}\!\left(-a_x, \sqrt{a_y^2 + a_z^2}\right).$$

## Why one burst read

The chip updates its output registers at the sample rate. If you read ACCEL_XOUT_H, then ACCEL_XOUT_L in a separate transaction, a new sample can land in between and you get the high byte of one sample with the low byte of the next: a torn value that can be off by 255 counts. The chip latches the output registers during a single burst read, so one 14-byte read gives a consistent snapshot of all seven values. It's also 4× fewer bus transactions.

## A HAL for testability

The driver never touches the I2C peripheral directly. It calls two functions through a struct, `read(reg, buf, n)` and `write(reg, value)`. On the target they call the I2C driver; on a laptop they replay a **recorded register dump**: a script of the exact transactions a real chip produced, captured once with a logic analyser or a debug print. The test then checks the decoded values and that the driver made exactly the expected accesses, in order.

:::figure widget=imuaxes caption="Body axes of the IMU with the measured gravity vector. Tilt the board to see the raw counts, the scaled values in g and the roll and pitch computed from them; change the full-scale range to see the counts per g change."
:::end

## Worked example

A recorded burst at ±8 g gives accel bytes `00 00 08 00 0D DB` and temperature `F0 B0`.

1. Sensitivity at ±8 g is 32 768/8 = 4096 LSB/g.
2. $a_x = 0$, $a_y = 0x0800 = 2048 → 0.5\,g$, $a_z = 0x0DDB = 3547 → 0.866\,g$.
3. Roll $\phi = \operatorname{atan2}(0.5, 0.866) = 30.0°$, pitch 0.
4. Temperature raw 0xF0B0 = −3920, so $T = -3920/340 + 36.53 = 25.0$ °C.

## Code it from scratch

:::code file=imu.c
```c
#include <math.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* ---------- the HAL interface the driver depends on ---------- */
typedef struct {
  int (*read)(void *ctx, uint8_t reg, uint8_t *buf, int n);   /* 0 on success */
  int (*write)(void *ctx, uint8_t reg, uint8_t value);
  void *ctx;
} imu_hal_t;

/* ---------- the driver ---------- */
enum { REG_GYRO_CONFIG = 0x1B, REG_ACCEL_CONFIG = 0x1C, REG_ACCEL_XOUT_H = 0x3B, REG_PWR_MGMT_1 = 0x6B, REG_WHO_AM_I = 0x75 };
typedef enum { IMU_OK = 0, IMU_EBUS = -1, IMU_EID = -2, IMU_ERANGE = -3 } imu_err_t;
typedef struct { imu_hal_t hal; float accel_lsb_per_g, gyro_lsb_per_dps; } imu_t;
typedef struct { float ax, ay, az, temp_c, gx, gy, gz; } imu_sample_t;

static imu_err_t imu_init(imu_t *imu, imu_hal_t hal, int accel_g, int gyro_dps) {
  static const int ag[4] = {2, 4, 8, 16}, gd[4] = {250, 500, 1000, 2000};
  int ai = -1, gi = -1;
  for (int i = 0; i < 4; i++) { if (ag[i] == accel_g) ai = i; if (gd[i] == gyro_dps) gi = i; }
  if (ai < 0 || gi < 0) return IMU_ERANGE;
  imu->hal = hal;
  uint8_t id;
  if (hal.read(hal.ctx, REG_WHO_AM_I, &id, 1)) return IMU_EBUS;
  if (id != 0x68) return IMU_EID;
  if (hal.write(hal.ctx, REG_PWR_MGMT_1, 0x01)) return IMU_EBUS;        /* wake, clock from the X gyro PLL */
  if (hal.write(hal.ctx, REG_ACCEL_CONFIG, (uint8_t)(ai << 3))) return IMU_EBUS;
  if (hal.write(hal.ctx, REG_GYRO_CONFIG, (uint8_t)(gi << 3))) return IMU_EBUS;
  imu->accel_lsb_per_g = 32768.0f / (float)accel_g;
  imu->gyro_lsb_per_dps = 32768.0f / (float)gyro_dps;
  return IMU_OK;
}
static int16_t be16(const uint8_t *p) { return (int16_t)((uint16_t)p[0] << 8 | p[1]); }
static imu_err_t imu_read(imu_t *imu, imu_sample_t *s) {
  uint8_t b[14];
  if (imu->hal.read(imu->hal.ctx, REG_ACCEL_XOUT_H, b, 14)) return IMU_EBUS;   /* one burst: a consistent snapshot */
  s->ax = be16(b + 0) / imu->accel_lsb_per_g; s->ay = be16(b + 2) / imu->accel_lsb_per_g; s->az = be16(b + 4) / imu->accel_lsb_per_g;
  s->temp_c = be16(b + 6) / 340.0f + 36.53f;
  s->gx = be16(b + 8) / imu->gyro_lsb_per_dps; s->gy = be16(b + 10) / imu->gyro_lsb_per_dps; s->gz = be16(b + 12) / imu->gyro_lsb_per_dps;
  return IMU_OK;
}
static void imu_tilt(const imu_sample_t *s, float *roll_deg, float *pitch_deg) {
  *roll_deg = atan2f(s->ay, s->az) * 57.29578f;
  *pitch_deg = atan2f(-s->ax, sqrtf(s->ay * s->ay + s->az * s->az)) * 57.29578f;
}

/* ---------- a fake HAL that replays a recorded register dump ----------
   each line: "R reg byte byte ..." (the chip returned these bytes) or "W reg value", or "R reg NACK" */
typedef struct { const char *const *lines; int n, pos, failed; char why[128]; } replay_t;
static int replay_read(void *ctx, uint8_t reg, uint8_t *buf, int n) {
  replay_t *r = ctx;
  if (r->pos >= r->n) { snprintf(r->why, sizeof r->why, "unexpected read of 0x%02X", reg); r->failed = 1; return -1; }
  const char *l = r->lines[r->pos++];
  unsigned want_reg; int off;
  if (sscanf(l, "R %x%n", &want_reg, &off) != 1 || want_reg != reg) { snprintf(r->why, sizeof r->why, "read 0x%02X, dump has \"%s\"", reg, l); r->failed = 1; return -1; }
  if (strstr(l, "NACK")) return -1;
  const char *p = l + off;
  for (int i = 0; i < n; i++) {
    unsigned v; int used;
    if (sscanf(p, "%x%n", &v, &used) != 1) { snprintf(r->why, sizeof r->why, "read %d bytes, dump has fewer", n); r->failed = 1; return -1; }
    buf[i] = (uint8_t)v; p += used;
  }
  return 0;
}
static int replay_write(void *ctx, uint8_t reg, uint8_t value) {
  replay_t *r = ctx;
  unsigned want_reg, want_val;
  if (r->pos >= r->n || sscanf(r->lines[r->pos], "W %x %x", &want_reg, &want_val) != 2 || want_reg != reg || want_val != value) {
    snprintf(r->why, sizeof r->why, "wrote 0x%02X=0x%02X, dump has \"%s\"", reg, value, r->pos < r->n ? r->lines[r->pos] : "end");
    r->failed = 1; return -1;
  }
  r->pos++;
  return 0;
}
static imu_hal_t replay_hal(replay_t *r) { imu_hal_t h = {replay_read, replay_write, r}; return h; }
#define CHECK(c) do { if (!(c)) { printf("FAIL line %d: %s\n", __LINE__, #c); exit(1); } } while (0)
#define NEAR(a, b, tol) (fabsf((a) - (b)) <= (tol))

int main(void) {
  imu_t imu; imu_sample_t s; float roll, pitch;
  /* dump 1: flat on the bench, +-2 g, +-250 dps */
  const char *const flat[] = {
    "R 75 68", "W 6B 01", "W 1C 00", "W 1B 00",
    "R 3B FF 9C 00 52 40 1C F0 B0 00 0C FF F6 00 03",
  };
  replay_t r1 = {flat, 5, 0, 0, ""};
  CHECK(imu_init(&imu, replay_hal(&r1), 2, 250) == IMU_OK);
  CHECK(imu_read(&imu, &s) == IMU_OK && !r1.failed && r1.pos == r1.n);
  imu_tilt(&s, &roll, &pitch);
  printf("flat:   a = (%.4f, %.4f, %.4f) g, T = %.2f C, w = (%.3f, %.3f, %.3f) dps, roll %.2f pitch %.2f\n", s.ax, s.ay, s.az, s.temp_c, s.gx, s.gy, s.gz, roll, pitch);
  CHECK(NEAR(s.az, 1.0017f, 1e-4f) && NEAR(s.ax, -0.0061f, 1e-4f) && NEAR(s.temp_c, 25.0f, 0.01f));
  CHECK(NEAR(s.gx, 12 / 131.072f, 1e-4f) && NEAR(s.gy, -10 / 131.072f, 1e-4f));
  CHECK(fabsf(roll) < 0.5f && fabsf(pitch) < 0.5f);
  /* dump 2: tilted 30 degrees about x, +-8 g, +-1000 dps (the worked example) */
  const char *const tilted[] = {
    "R 75 68", "W 6B 01", "W 1C 10", "W 1B 10",
    "R 3B 00 00 08 00 0D DB F0 B0 00 00 00 00 00 00",
  };
  replay_t r2 = {tilted, 5, 0, 0, ""};
  CHECK(imu_init(&imu, replay_hal(&r2), 8, 1000) == IMU_OK && imu_read(&imu, &s) == IMU_OK && !r2.failed);
  imu_tilt(&s, &roll, &pitch);
  printf("tilted: a = (%.4f, %.4f, %.4f) g, roll %.2f pitch %.2f\n", s.ax, s.ay, s.az, roll, pitch);
  CHECK(NEAR(s.ay, 0.5f, 1e-4f) && NEAR(s.az, 0.86597f, 1e-4f) && NEAR(roll, 30.0f, 0.01f) && NEAR(pitch, 0.0f, 0.01f));
  /* dump 3: full-scale negative values decode as signed */
  const char *const neg[] = { "R 75 68", "W 6B 01", "W 1C 18", "W 1B 18", "R 3B 80 00 7F FF 00 01 00 00 80 00 7F FF FF FF" };
  replay_t r3 = {neg, 5, 0, 0, ""};
  CHECK(imu_init(&imu, replay_hal(&r3), 16, 2000) == IMU_OK && imu_read(&imu, &s) == IMU_OK);
  CHECK(NEAR(s.ax, -16.0f, 1e-4f) && NEAR(s.ay, 32767 / 2048.0f, 1e-4f) && NEAR(s.gx, -2000.0f, 1e-3f) && NEAR(s.gz, -2000 / 32768.0f, 1e-5f));
  /* dump 4: the wrong chip; dump 5: nobody answers; bad range: no bus access at all */
  const char *const wrong[] = { "R 75 71" };
  replay_t r4 = {wrong, 1, 0, 0, ""};
  CHECK(imu_init(&imu, replay_hal(&r4), 2, 250) == IMU_EID && r4.pos == 1);
  const char *const nack[] = { "R 75 NACK" };
  replay_t r5 = {nack, 1, 0, 0, ""};
  CHECK(imu_init(&imu, replay_hal(&r5), 2, 250) == IMU_EBUS);
  replay_t r6 = {NULL, 0, 0, 0, ""};
  CHECK(imu_init(&imu, replay_hal(&r6), 3, 250) == IMU_ERANGE && r6.pos == 0 && !r6.failed);
  /* a driver that configured ranges in the wrong order would be caught by the replay */
  const char *const order[] = { "R 75 68", "W 6B 01", "W 1B 00", "W 1C 00" };
  replay_t r7 = {order, 4, 0, 0, ""};
  CHECK(imu_init(&imu, replay_hal(&r7), 2, 250) == IMU_EBUS && r7.failed);
  printf("replay caught: %s\n", r7.why);
  printf("PASS\n");
  return 0;
}
```
:::end

## Exercises

:::exercise
Your driver works, but every few hundred readings the X acceleration jumps by about 0.016 g at ±2 g for one sample. What's the likely cause?
:::solution
0.016 g at 16 384 LSB/g is about 256 counts: a torn read, with high and low bytes from different samples. Check that the driver reads all 14 bytes in one burst, and that the I2C layer doesn't split the transfer into several transactions.
:::end

:::exercise
Why does the test check the order of the configuration writes, and when would that be too strict?
:::solution
The order matters for some chips: the MPU-6050 ignores configuration writes while asleep, so waking it must come first. Checking the exact sequence catches such regressions. It's too strict when the order genuinely doesn't matter, because then a harmless refactor breaks the test; a looser fake can check the final register values instead.
:::end

## Quiz

:::quiz
- type: num
  q: Accelerometer sensitivity in LSB/g at ±4 g?
  answer: 8192
  tol: 0
  unit: LSB/g
  py: "32768/4"
  explain: 32 768 counts over the range.
- type: num
  q: Temperature in °C for a raw reading of 0?
  answer: 36.53
  tol: 0.0001
  unit: °C
  py: "0/340 + 36.53"
  explain: The datasheet's offset.
- type: num
  q: Roll in degrees for a_y = 0.5 g and a_z = 0.866 g?
  answer: 30.0
  tol: 0.001
  unit: °
  py: "__import__('math').degrees(__import__('math').atan2(0.5, 0.866))"
  explain: atan2(a_y, a_z).
- type: num
  q: Rate in °/s for a raw gyro reading of 1000 at ±500 °/s?
  answer: 15.26
  tol: 0.002
  unit: °/s
  py: "1000/(32768/500)"
  explain: 65.536 LSB per °/s.
- type: mc
  q: Why read all 14 output bytes in one burst?
  options:
    - the chip latches them, so all values come from one sample
    - I2C can't read single bytes
    - it saves flash
    - to avoid clock stretching
  answer: 0
  explain: Separate reads can tear between samples.
- type: mc
  q: What does the recorded-dump test catch that a fake returning fixed values doesn't?
  options:
    - wrong registers, wrong order or extra bus accesses
    - wiring faults
    - timing jitter
    - nothing more
  answer: 0
  explain: It checks every transaction against what the real chip saw.
:::end

:::verify
import math
assert 0x0DDB == 3547 and abs(3547 / 4096 - 0.866) < 1e-3
assert abs((0xF0B0 - 65536) / 340 + 36.53 - 25.0) < 0.01
:::end
