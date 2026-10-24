---
id: p10-l09
minutes: 40
summary: An interrupt lets hardware stop the main loop within a few hundred nanoseconds to run a handler. You learn how the NVIC prioritises, preempts and tail-chains exceptions and what entry latency costs, write a 1 kHz SysTick interrupt that runs a control-loop step, and measure its period jitter in QEMU against an independent hardware timer, first clean and then with a main loop that disables interrupts for too long.
---

## What happens on an interrupt

When a peripheral raises an interrupt request and the NVIC (nested vectored interrupt controller) decides it should run, a Cortex-M3/M4 does in hardware:

1. finishes (or abandons and restarts) the current instruction;
2. **stacks** eight registers, r0–r3, r12, LR, PC and xPSR, onto the current stack, which is exactly what the C calling convention says a function may clobber;
3. loads the handler address from the vector table and puts a special **EXC_RETURN** value in LR;
4. runs the handler, an ordinary C function. Returning (`bx lr` with EXC_RETURN) unstacks the eight registers.

On a Cortex-M3/M4 with zero-wait-state memory the entry takes **12 cycles** and the exit 10. Back-to-back interrupts are **tail-chained**: the core skips the unstack/restack and goes from one handler to the next in 6 cycles.

## Priority and preemption

Each interrupt has a priority number; **lower numbers are more urgent**. STM32 parts implement 4 priority bits, so 16 levels, kept in the upper bits of each 8-bit priority field. The priority group splits those bits into:

- **preemption priority**: a handler can interrupt (preempt) a running handler only if its preemption priority is strictly more urgent;
- **subpriority**: only decides which of two *pending* interrupts runs first.

Worst-case latency for an interrupt is its entry time plus the longest stretch it can't run: a higher-priority handler, or a **critical section** where code has disabled interrupts with `cpsid i` / `__disable_irq()`. That's why critical sections must be short and bounded.

:::figure widget=nvictl caption="A timeline of the main loop (grey), a 1 kHz timer ISR (lime) and a UART ISR (blue). Raise the UART's priority above the timer's to see preemption, and add a critical section in main to see the timer's start time jitter."
:::end

## Measuring jitter

A control loop driven by a timer interrupt assumes a constant sample time $T_s$. If the ISR starts $\delta_k$ late on tick $k$, the actual period is $T_s + \delta_k - \delta_{k-1}$, and the **jitter** is the spread of that period:

$$J = \max_k T_k - \min_k T_k.$$

On hardware you'd toggle a pin in the ISR and measure on a scope. In QEMU we read an *independent* free-running timer (the MPS2 board's CMSDK TIMER0, also clocked at 25 MHz, so 40 ns per count) at ISR entry. As in lesson 01, QEMU with `-icount shift=0` executes 1 instruction per ns and doesn't model the 12-cycle entry, so this tests **where the interrupt is taken**, not the silicon's latency. That's exactly where a long critical section hurts.

## Worked example

A 1 kHz tick from SysTick at 25 MHz.

1. Reload = 25 000 − 1 = 24 999, period 25 000 counts = 1 ms.
2. A clean main loop: the ISR is taken at the next instruction boundary, so periods are 25 000 ± 1 count, jitter ≤ 40 ns.
3. A main loop that disables interrupts for 5000 instructions (5 µs in QEMU) can delay the ISR up to 5 µs: jitter up to 125 counts.
4. On a 168 MHz Cortex-M4, 12 cycles of entry is 71 ns, and a 1 µs jitter budget means no critical section longer than about 168 cycles.

## Code it from scratch

The ISR timestamps itself with TIMER0 and runs one step of a discrete PI controller on a first-order plant, so you can see the "control loop" really runs at 1 kHz. `run.py` builds two variants, clean and with critical sections, and checks the jitter.

:::code file=link.ld
```ld
/* QEMU mps2-an385: code memory at 0x0, SRAM at 0x20000000 (we use 256 KiB and 64 KiB of them). */
MEMORY {
  FLASH (rx)  : ORIGIN = 0x00000000, LENGTH = 256K
  RAM   (rwx) : ORIGIN = 0x20000000, LENGTH = 64K
}
ENTRY(Reset_Handler)
SECTIONS {
  .text : { KEEP(*(.vectors)) *(.text*) *(.rodata*) . = ALIGN(4); } > FLASH
  .data : { _sdata = .; *(.data*) . = ALIGN(4); _edata = .; } > RAM AT > FLASH
  _sidata = LOADADDR(.data);
  .bss (NOLOAD) : { _sbss = .; *(.bss*) *(COMMON) . = ALIGN(4); _ebss = .; } > RAM
  _estack = ORIGIN(RAM) + LENGTH(RAM);
}
```
:::end

:::code file=rt.c target=arm
```c
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
```
:::end

:::code file=isr.c target=arm
```c
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
```
:::end

:::code file=run.py
```python
"""Measure SysTick ISR period jitter in QEMU, with and without a 5 us critical section in main."""
import re, shutil, subprocess, sys
for tool in ("arm-none-eabi-gcc", "qemu-system-arm"):
    if not shutil.which(tool):
        sys.exit(f"needs {tool} (Debian/Ubuntu: apt install gcc-arm-none-eabi qemu-system-arm)")

NS_PER_COUNT = 40                                    # TIMER0 runs at 25 MHz
def measure(crit_loops):
    subprocess.run(["arm-none-eabi-gcc", "-mcpu=cortex-m3", "-mthumb", "-O1", "-Wall", "-Werror", "-ffreestanding",
                    "-nostdlib", "-T", "link.ld", f"-DCRIT_LOOPS={crit_loops}", "rt.c", "isr.c", "-o", "isr.elf"], check=True)
    r = subprocess.run(["qemu-system-arm", "-M", "mps2-an385", "-nographic", "-icount", "shift=0", "-semihosting-config",
                        "enable=on,target=native", "-kernel", "isr.elf"], stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                       text=True, timeout=60)
    assert r.returncode == 0, r.stdout
    lo, hi, y = map(int, re.search(r"period_min (\d+) period_max (\d+) y_milli (\d+)", r.stdout).groups())
    return lo, hi, y

lo, hi, y = measure(0)
jitter_ns = (hi - lo) * NS_PER_COUNT
print(f"clean:  period {lo}..{hi} counts ({lo * NS_PER_COUNT / 1e6:.4f} ms), jitter {jitter_ns} ns, plant output {y / 1000:.3f}")
assert abs((lo + hi) / 2 - 25000) <= 1                # 1 ms period
assert jitter_ns < 1000                               # jitter below 1 us
assert 990 <= y <= 1010                               # the PI loop has settled on the setpoint 1.0

lo2, hi2, _ = measure(2500)                           # 2 instructions x 2500 = 5000 ns with interrupts off
jitter2 = (hi2 - lo2) * NS_PER_COUNT
print(f"5 us critical sections: period {lo2}..{hi2} counts, jitter {jitter2} ns")
assert jitter2 > 1000                                 # the long critical section breaks the budget
assert jitter2 <= 2 * 5000 + 2 * NS_PER_COUNT         # but never more than twice its length
print("PASS")
```
:::end

## Exercises

:::exercise
A UART receive ISR at priority 2 takes 8 µs. The 1 kHz control ISR is at priority 5. What's the worst-case delay of the control ISR, and how do you fix it?
:::solution
Up to 8 µs (plus entry), because a running priority-2 handler can't be preempted by priority 5. Either make the control ISR more urgent (a lower number than the UART's), or shorten the UART ISR to just moving the byte into a ring buffer (lesson 18) and parse in the main loop.
:::end

:::exercise
Why does the ISR read the timestamp as its very first statement?
:::solution
Everything after it (the controller arithmetic) adds a constant offset but no jitter, as long as it is deterministic. Reading it last would mix the controller's data-dependent execution time (like a division's variable cycle count on hardware) into the measurement.
:::end

## Quiz

:::quiz
- type: num
  q: SysTick reload for a 1 kHz tick at 25 MHz?
  answer: 24999
  tol: 0.001
  unit: ""
  py: "25e6/1000 - 1"
  explain: f/1000 − 1.
- type: num
  q: Cortex-M4 interrupt entry of 12 cycles at 168 MHz, in ns?
  answer: 71.43
  tol: 0.001
  unit: ns
  py: "12/168e6*1e9"
  explain: Cycles over the clock.
- type: num
  q: A 1 µs jitter budget at 168 MHz allows a critical section of at most how many cycles?
  answer: 168
  tol: 0.001
  unit: cycles
  py: "1e-6*168e6"
  explain: Ignoring the entry time itself.
- type: num
  q: Measured periods range from 24 990 to 25 110 counts of 40 ns. Jitter in µs?
  answer: 4.8
  tol: 0.001
  unit: µs
  py: "(25110-24990)*40/1000"
  explain: Spread times the count period.
- type: mc
  q: On a Cortex-M, which priority number is most urgent?
  options:
    - the highest number
    - the lowest number
    - priority 8
    - all are equal unless grouped
  answer: 1
  explain: 0 is the most urgent configurable priority.
- type: mc
  q: What does tail-chaining save?
  options:
    - the vector table lookup
    - unstacking and restacking registers between back-to-back handlers
    - the priority comparison
    - flash wait states
  answer: 1
  explain: The core goes straight to the next handler.
:::end

:::verify
assert 25e6 / 1000 - 1 == 24999
assert abs(12 / 168e6 * 1e9 - 71.43) < 0.01
assert 2 * 2500 == 5000 and 5000 / 40 == 125
:::end
