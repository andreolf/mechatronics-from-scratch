#include <stdint.h>
void rt_puts(const char *s); void rt_putu(uint32_t v); void rt_exit(int code);

#define CCR   (*(volatile uint32_t *)0xE000ED14)
#define CFSR  (*(volatile uint32_t *)0xE000ED28)
#define HFSR  (*(volatile uint32_t *)0xE000ED2C)
#define MMFAR (*(volatile uint32_t *)0xE000ED34)
#define BFAR  (*(volatile uint32_t *)0xE000ED38)

static void put_hex(const char *name, uint32_t v) {
  char b[11] = "0x00000000"; for (int i = 0; i < 8; i++) b[9 - i] = "0123456789abcdef"[(v >> (4 * i)) & 0xF];
  rt_puts(name); rt_puts("="); rt_puts(b); rt_puts(" ");
}
/* the stub: pick MSP or PSP from EXC_RETURN bit 2, pass the frame pointer to C */
__attribute__((naked)) void HardFault_Handler(void) {
  __asm__ volatile("tst lr, #4      \n\t"
                   "ite eq          \n\t"
                   "mrseq r0, msp   \n\t"
                   "mrsne r0, psp   \n\t"
                   "b hardfault_c   \n\t");
}
void hardfault_c(const uint32_t *frame) {
  uint32_t cfsr = CFSR, hfsr = HFSR;
  put_hex("pc", frame[6]); put_hex("lr", frame[5]); put_hex("xpsr", frame[7]);
  put_hex("cfsr", cfsr); put_hex("hfsr", hfsr); rt_puts("\n");
  if (hfsr & (1u << 30)) rt_puts("cause: FORCED (escalated to HardFault)\n");
  if (cfsr & (1u << 25)) rt_puts("cause: DIVBYZERO\n");
  if (cfsr & (1u << 16)) rt_puts("cause: UNDEFINSTR\n");
  if (cfsr & (1u << 17)) rt_puts("cause: INVSTATE\n");
  if (cfsr & (1u << 9))  rt_puts("cause: PRECISERR\n");
  if (cfsr & (1u << 10)) rt_puts("cause: IMPRECISERR (PC is after the culprit)\n");
  if (cfsr & (1u << 15)) { put_hex("bfar", BFAR); rt_puts("\n"); }
  if (cfsr & (1u << 7))  { put_hex("mmfar", MMFAR); rt_puts("\n"); }
  rt_exit(0);                                    /* on a board: log to backup RAM, then reset */
}

__attribute__((noinline)) int divide(int a, int b) { return a / b; }
__attribute__((noinline)) uint32_t peek(uint32_t addr) { return *(volatile uint32_t *)addr; }
__attribute__((noinline)) void bad_opcode(void) { __asm__ volatile("udf #0"); }

int main(void) {
  volatile int zero = 0;
#if FAULT == 1
  CCR |= 1u << 4;                                /* DIV_0_TRP: trap integer division by zero */
  rt_putu((uint32_t)divide(10, zero));
#elif FAULT == 2
  rt_putu(peek(0xF0000000u));                    /* no memory or peripheral here */
#else
  bad_opcode();
#endif
  (void)zero;
  rt_puts("no fault?\n");
  return 1;
}
