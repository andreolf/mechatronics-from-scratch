#include <stdint.h>
void rt_puts(const char *s); void rt_putu(uint32_t v);
extern uint32_t _heap_end, _estack;

#ifndef BUF_SIZE
#define BUF_SIZE 1024
#endif
const uint32_t lut[4] = {0x11, 0x22, 0x33, 0x44};   /* .rodata */
uint32_t counter = 7;                                /* .data   */
uint32_t flags = 0xA5;                               /* .data   */
uint8_t buffer[BUF_SIZE];                            /* .bss    */

static void show(const char *name, const volatile void *p) {
  rt_puts(name); rt_puts(" "); rt_putu((uint32_t)(uintptr_t)p); rt_puts("\n");
}
int main(void) {
  uint32_t sp; __asm__ volatile("mov %0, sp" : "=r"(sp));
  show("lut", lut); show("counter", &counter); show("buffer", buffer);
  rt_puts("sp "); rt_putu(sp); rt_puts("\n");
  buffer[BUF_SIZE - 1] = (uint8_t)lut[1];
  int ok = counter == 7 && flags == 0xA5 && buffer[0] == 0 && buffer[BUF_SIZE - 1] == 0x22
           && sp > (uint32_t)(uintptr_t)&_heap_end && sp <= (uint32_t)(uintptr_t)&_estack;
  rt_puts(ok ? "PASS\n" : "FAIL\n");
  return ok ? 0 : 1;
}
