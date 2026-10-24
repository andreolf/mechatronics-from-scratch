/* rt.c: minimal Cortex-M runtime. Vector table, reset handler, semihosting print and exit. */
#include <stdint.h>
extern uint32_t _sidata, _sdata, _edata, _sbss, _ebss, _estack;
int main(void);

static int semihost(int op, const void *arg) {          /* bkpt 0xAB traps to the debugger (QEMU) */
  register int r0 __asm__("r0") = op;
  register const void *r1 __asm__("r1") = arg;
  __asm__ volatile("bkpt 0xAB" : "+r"(r0) : "r"(r1) : "memory");
  return r0;
}
void rt_puts(const char *s) { semihost(0x04, s); }      /* SYS_WRITE0 */
void rt_putu(uint32_t v) {
  char b[12]; int i = 11; b[i] = 0;
  do { b[--i] = (char)('0' + v % 10); v /= 10; } while (v);
  rt_puts(&b[i]);
}
void rt_exit(int code) {                                /* SYS_EXIT: QEMU exits 0 for "application exit", 1 otherwise */
  semihost(0x18, (const void *)(uintptr_t)(code ? 0x20024u : 0x20026u));
  for (;;) {}
}
void Default_Handler(void) { rt_puts("unexpected exception\n"); rt_exit(3); }
void HardFault_Handler(void) __attribute__((weak, alias("Default_Handler")));
void SysTick_Handler(void)   __attribute__((weak, alias("Default_Handler")));

void Reset_Handler(void) {
  uint32_t *src = &_sidata, *dst = &_sdata;
  while (dst < &_edata) *dst++ = *src++;                /* copy .data from flash to RAM */
  for (dst = &_sbss; dst < &_ebss;) *dst++ = 0;         /* zero .bss */
  rt_exit(main());
}
__attribute__((section(".vectors"), used))
static void (*const vectors[16])(void) = {
  (void (*)(void))&_estack, Reset_Handler, Default_Handler, HardFault_Handler,
  Default_Handler, Default_Handler, Default_Handler, 0, 0, 0, 0,
  Default_Handler, Default_Handler, 0, Default_Handler, SysTick_Handler,
};
