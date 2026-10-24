#include <stdint.h>
void rt_puts(const char *s); void rt_putu(uint32_t v);
#define SYST_CSR (*(volatile uint32_t *)0xE000E010)
#define SYST_RVR (*(volatile uint32_t *)0xE000E014)
#define SYST_CVR (*(volatile uint32_t *)0xE000E018)
#define CPACR    (*(volatile uint32_t *)0xE000ED88)
#define N 1000
#ifdef TRUNCATE
#define RND 0                                /* plain >> 15 floors: a bias of -0.5 LSB per step */
#else
#define RND (1 << 14)                        /* add half an LSB first: round to nearest */
#endif

/* float PID */
typedef struct { float kp, ki, kd, i, prev, lo, hi; } pid_f;
__attribute__((noinline)) static float pid_f_step(pid_f *c, float e) {
  c->i += c->ki * e;
  if (c->i > c->hi) c->i = c->hi; else if (c->i < c->lo) c->i = c->lo;
  float u = c->kp * e + c->i + c->kd * (e - c->prev);
  c->prev = e;
  return u > c->hi ? c->hi : u < c->lo ? c->lo : u;
}
/* Q15 PID: gains Q15 (<1), integrator Q15 in int32, output saturated to Q15 */
typedef struct { int16_t kp, ki, kd; int32_t i; int16_t prev; } pid_q;
static inline int16_t sat16(int32_t v) { return v > 32767 ? 32767 : v < -32768 ? -32768 : (int16_t)v; }
__attribute__((noinline)) static int16_t pid_q_step(pid_q *c, int16_t e) {
  c->i += ((int32_t)c->ki * e + RND) >> 15;                  /* round, don't truncate */
  if (c->i > 32767) c->i = 32767; else if (c->i < -32768) c->i = -32768;
  int32_t u = (((int32_t)c->kp * e + RND) >> 15) + c->i + (((int32_t)c->kd * (e - c->prev) + RND) >> 15);
  c->prev = e;
  return sat16(u);
}
static int16_t err_q[N];
static uint32_t ticks(void) { return SYST_CVR; }
__attribute__((noinline)) static int run(void) {
  uint32_t s = 1;                                    /* a reproducible pseudo-random error sequence in [-0.25, 0.25) */
  for (int k = 0; k < N; k++) { s = s * 1664525u + 1013904223u; err_q[k] = (int16_t)(((int32_t)(s >> 16) - 32768) / 4); }
  SYST_RVR = 0xFFFFFF; SYST_CVR = 0; SYST_CSR = 5;
  pid_f cf = {0.6f, 0.05f, 0.2f, 0, 0, -1.0f, 32767.0f / 32768.0f};
  pid_q cq = {19661, 1638, 6554, 0, 0};
  static float uf[N]; static int16_t uq[N];
  uint32_t t0 = ticks();
  for (int k = 0; k < N; k++) uf[k] = pid_f_step(&cf, err_q[k] / 32768.0f);   /* includes int -> float */
  uint32_t t1 = ticks();
  for (int k = 0; k < N; k++) uq[k] = pid_q_step(&cq, err_q[k]);
  uint32_t t2 = ticks();
  float worst = 0;
  for (int k = 0; k < N; k++) { float d = uf[k] - uq[k] / 32768.0f; if (d < 0) d = -d; if (d > worst) worst = d; }
  rt_puts("float_ticks "); rt_putu((t0 - t1) & 0xFFFFFF); rt_puts(" q15_ticks "); rt_putu((t1 - t2) & 0xFFFFFF);
  rt_puts(" worst_ppm "); rt_putu((uint32_t)(worst * 1e6f)); rt_puts("\n");
  return 0;
}

int main(void) {
#ifdef HARD_FPU
  CPACR |= 0xFu << 20;                       /* enable CP10/CP11 before any FPU instruction */
  __asm__ volatile("dsb\n\tisb" ::: "memory");
#endif
  return run();
}
