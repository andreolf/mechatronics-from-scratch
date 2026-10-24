/* startup.c: vector table and reset handler for a Cortex-M3, written from scratch. */
#include <stdint.h>

extern uint32_t _sidata, _sdata, _edata, _sbss, _ebss, _estack;   /* from link.ld */
int main(void);
void rt_exit(int code);

void Default_Handler(void) { for (;;) {} }       /* park here; a debugger shows where */
#define WEAK_ALIAS __attribute__((weak, alias("Default_Handler")))
void NMI_Handler(void) WEAK_ALIAS;
void HardFault_Handler(void) WEAK_ALIAS;
void MemManage_Handler(void) WEAK_ALIAS;
void BusFault_Handler(void) WEAK_ALIAS;
void UsageFault_Handler(void) WEAK_ALIAS;
void SVC_Handler(void) WEAK_ALIAS;
void PendSV_Handler(void) WEAK_ALIAS;
void SysTick_Handler(void) WEAK_ALIAS;
void Reset_Handler(void);

__attribute__((section(".vectors"), used))
static void (*const vector_table[16])(void) = {
  (void (*)(void))&_estack,   /* 0: initial SP */
  Reset_Handler,              /* 1 */
  NMI_Handler, HardFault_Handler, MemManage_Handler, BusFault_Handler, UsageFault_Handler,
  0, 0, 0, 0,                 /* 7-10 reserved */
  SVC_Handler, 0, 0,          /* 11 SVCall, 12 debug monitor, 13 reserved */
  PendSV_Handler, SysTick_Handler,
};

void Reset_Handler(void) {
#ifdef POISON
  for (uint32_t *p = &_sdata; p < &_ebss; p++) *p = 0xA5A5A5A5u;   /* emulate power-up garbage */
#endif
#ifndef SKIP_COPY
  const uint32_t *src = &_sidata;
  for (uint32_t *dst = &_sdata; dst < &_edata;) *dst++ = *src++;  /* .data: flash -> RAM */
#endif
#ifndef SKIP_ZERO
  for (uint32_t *dst = &_sbss; dst < &_ebss;) *dst++ = 0;          /* .bss = 0 */
#endif
  rt_exit(main());            /* on a real board: main(); for (;;) {} */
}
