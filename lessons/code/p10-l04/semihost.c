/* semihost.c: print and exit through the debugger (QEMU) interface. */
#include <stdint.h>
static int semihost(int op, const void *arg) {
  register int r0 __asm__("r0") = op;
  register const void *r1 __asm__("r1") = arg;
  __asm__ volatile("bkpt 0xAB" : "+r"(r0) : "r"(r1) : "memory");
  return r0;
}
void rt_puts(const char *s) { semihost(0x04, s); }
void rt_exit(int code) { semihost(0x18, (const void *)(uintptr_t)(code ? 0x20024u : 0x20026u)); for (;;) {} }
