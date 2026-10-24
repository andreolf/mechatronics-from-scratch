#include <stdint.h>
void rt_puts(const char *s);

uint32_t answer = 42;                       /* .data */
int16_t  coeffs[3] = {-3, 5, 7};            /* .data */
uint32_t zeros[16];                         /* .bss  */
static uint8_t seen;                        /* .bss  */

int main(void) {
  int ok = answer == 42 && coeffs[0] == -3 && coeffs[2] == 7 && seen == 0;
  for (int i = 0; i < 16; i++) ok = ok && zeros[i] == 0;
  rt_puts(ok ? "globals ok\n" : "globals WRONG\n");
  return ok ? 0 : 1;
}
