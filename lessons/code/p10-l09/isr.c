#include <stdint.h>
void rt_puts(const char *s); void rt_putu(uint32_t v);

#define SYST_CSR  (*(volatile uint32_t *)0xE000E010)
#define SYST_RVR  (*(volatile uint32_t *)0xE000E014)
#define SYST_CVR  (*(volatile uint32_t *)0xE000E018)
#define SHPR3     (*(volatile uint32_t *)0xE000ED20)     /* SysTick priority in bits 31:24 */
#define T0_CTRL   (*(volatile uint32_t *)0x40000000)     /* CMSDK APB timer 0 */
#define T0_VALUE  (*(volatile uint32_t *)0x40000004)
#define T0_RELOAD (*(volatile uint32_t *)0x40000008)
#define TICKS 200
#define RELOAD (25000u - 1u)                              /* 25 MHz / 25 000 = 1 kHz */
#ifndef CRIT_LOOPS
#define CRIT_LOOPS 0                                      /* critical section length in loop iterations */
#endif

static volatile uint32_t n_ticks, stamp[TICKS];
static int32_t y_q16, integ_q16;                          /* plant output and PI integrator, Q16.16 */

void SysTick_Handler(void) {
  uint32_t now = T0_VALUE;                                /* timestamp first: that's "ISR start" */
  if (n_ticks < TICKS) stamp[n_ticks] = now;
  /* one control step at 1 kHz: PI on a first-order plant y' = (u - y)/tau, tau = 50 ms, setpoint 1.0 */
  int32_t e = (1 << 16) - y_q16;
  integ_q16 += e / 20;                                    /* Ki*Ts = 0.05 */
  int32_t u = 2 * e + integ_q16;                          /* Kp = 2 */
  y_q16 += (u - y_q16) / 50;                              /* Ts/tau = 1/50 */
  n_ticks++;
}

static void spin(uint32_t n) { if (n) __asm__ volatile("1: subs %0, %0, #1\n\t bne 1b" : "+r"(n) : : "cc"); }

int main(void) {
  T0_RELOAD = 0xFFFFFFFFu; T0_VALUE = 0xFFFFFFFFu; T0_CTRL = 1;   /* free-running down-counter */
  SHPR3 = (SHPR3 & 0x00FFFFFFu) | (0x40u << 24);                  /* SysTick priority 4 (of 0..15) */
  SYST_RVR = RELOAD; SYST_CVR = 0; SYST_CSR = 7;                  /* core clock, interrupt, enable */
  while (n_ticks < TICKS) {
    if (CRIT_LOOPS) { __asm__ volatile("cpsid i" ::: "memory"); spin(CRIT_LOOPS); __asm__ volatile("cpsie i" ::: "memory"); }
    spin(1733);                                           /* other work, deliberately not a divisor of the period */
  }
  SYST_CSR = 0;
  uint32_t lo = 0xFFFFFFFFu, hi = 0;
  for (int k = 2; k < TICKS; k++) { uint32_t d = stamp[k - 1] - stamp[k]; if (d < lo) lo = d; if (d > hi) hi = d; }
  rt_puts("period_min "); rt_putu(lo); rt_puts(" period_max "); rt_putu(hi);
  rt_puts(" y_milli "); rt_putu((uint32_t)((y_q16 * 1000LL) >> 16)); rt_puts("\n");
  return 0;
}
