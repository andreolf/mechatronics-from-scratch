#include <stdint.h>
void rt_puts(const char *s); void rt_putu(uint32_t v);

#define SYST_CSR (*(volatile uint32_t *)0xE000E010)   /* SysTick control and status */
#define SYST_RVR (*(volatile uint32_t *)0xE000E014)   /* reload value */
#define SYST_CVR (*(volatile uint32_t *)0xE000E018)   /* current value, counts DOWN */
#define DEMCR      (*(volatile uint32_t *)0xE000EDFC)
#define DWT_CTRL   (*(volatile uint32_t *)0xE0001000)
#define DWT_CYCCNT (*(volatile uint32_t *)0xE0001004)

/* exactly two instructions per iteration */
__attribute__((noinline)) static void loop2(uint32_t n) {
  __asm__ volatile("1: subs %0, %0, #1\n\t bne 1b" : "+r"(n) : : "cc");
}

static uint32_t systick_delta(uint32_t n) {
  SYST_RVR = 0xFFFFFF; SYST_CVR = 0; SYST_CSR = 5;      /* enable, core clock, no interrupt */
  uint32_t t0 = SYST_CVR;
  loop2(n);
  uint32_t t1 = SYST_CVR;
  SYST_CSR = 0;
  return (t0 - t1) & 0xFFFFFF;                          /* 24-bit down-counter */
}

#ifdef ON_HARDWARE   /* real silicon only: QEMU has no DWT cycle counter */
static uint32_t dwt_cycles(uint32_t n) {
  DEMCR |= 1u << 24; DWT_CYCCNT = 0; DWT_CTRL |= 1u;
  uint32_t c0 = DWT_CYCCNT; loop2(n); return DWT_CYCCNT - c0;
}
#endif

int main(void) {
  static const uint32_t ns[] = {1000, 10000, 100000, 200000};
  for (int i = 0; i < 4; i++) {
    rt_puts("N "); rt_putu(ns[i]); rt_puts(" ticks "); rt_putu(systick_delta(ns[i])); rt_puts("\n");
  }
#ifdef ON_HARDWARE
  rt_puts("cycles "); rt_putu(dwt_cycles(100000)); rt_puts("\n");
#endif
  return 0;
}
