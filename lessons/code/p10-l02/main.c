#include <stdint.h>
void rt_puts(const char *s); void rt_putu(uint32_t v);

static const char greeting[] = "hello from flash\n";        /* .rodata: stays in flash */
uint32_t table[4] = {3, 1, 4, 1};                           /* .data: initial values in flash, copied to RAM */
uint32_t scratch[2];                                        /* .bss: zeroed at startup */

uint32_t unused_helper(uint32_t x) { return x * 2654435761u; }   /* nothing calls this: --gc-sections drops it */

int main(void) {
  rt_puts(greeting);
  uint32_t sum = 0;
  for (int i = 0; i < 4; i++) sum += table[i];
  scratch[0] = sum;
  rt_puts(sum == 9 && scratch[1] == 0 ? "PASS\n" : "FAIL\n");
  return sum == 9 ? 0 : 1;
}
