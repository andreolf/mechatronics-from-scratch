---
id: p10-l01
minutes: 40
summary: A Cortex-M microcontroller is a 32-bit core, a few buses and a lot of memory-mapped peripherals on one chip. You learn the register file, the three-stage pipeline and what an instruction costs, then cross-compile a counting loop for a Cortex-M3, run it in QEMU and check that the measured count matches the instructions you predicted by hand.
---

## What is on the chip

A microcontroller (MCU) puts a processor core, its memories and its peripherals on one die. For an Arm Cortex-M part such as an STM32F4, the pieces are:

- the **core**: 16 registers of 32 bits, an ALU, a hardware multiplier and divider, and (on the M4F/M7) a floating-point unit;
- **flash** for code and constants (hundreds of kilobytes) and **SRAM** for variables and the stack (tens to hundreds of kilobytes);
- **buses** that connect them. Cortex-M3/M4 cores have separate instruction (I-code) and data (D-code) buses into the code region plus a system bus, so an instruction fetch and a data access can happen in the same cycle. That is a modified **Harvard** design: separate paths, but one address space;
- **peripherals** (GPIO, timers, ADC, UART, SPI, DMA) on slower peripheral buses behind a bridge;
- the **NVIC** (interrupt controller), **SysTick** timer and debug blocks inside the core's private region at 0xE000_0000.

Everything is **memory-mapped**: a peripheral register is an address, and you control the hardware by loading from and storing to it. The rest of this phase is about doing that correctly.

:::figure widget=mcuarch caption="Inside a Cortex-M MCU. Pick an operation to see which bus it uses and roughly what it costs. A fetch from flash with wait states stalls the pipeline unless the prefetch buffer or cache hides it."
:::end

## Registers and the pipeline

The programmer sees r0–r12 (general purpose), **SP** (r13, the stack pointer), **LR** (r14, the return address after a call) and **PC** (r15), plus **xPSR** with the condition flags N, Z, C, V. The calling convention (AAPCS) passes the first four arguments in r0–r3 and returns in r0.

The Cortex-M3/M4 pipeline has three stages: **fetch, decode, execute**. While one instruction executes, the next is decoded and the one after is fetched, so most data-processing instructions complete at one per clock. Rough costs on a Cortex-M3/M4 with zero-wait-state memory, from Arm's technical reference manuals:

| instruction | cycles |
|---|---|
| ADD, SUB, AND, MOV, compare | 1 |
| MUL (32-bit result) | 1 |
| LDR / STR (single) | 2 (pipelined back-to-back loads cost less) |
| SDIV / UDIV | 2–12, depends on operands |
| taken branch | 1 + P, where P (pipeline refill) is 1–3 |

A taken branch throws away the fetched and decoded instructions behind it, which is why loops have overhead. Flash also matters: at 168 MHz an STM32F4's flash needs 5 wait states, and only the ART accelerator (prefetch plus a small cache) keeps a loop running near one instruction per cycle.

## Counting a loop by hand

The tightest counting loop is two Thumb-2 instructions:

```
1:  subs r0, r0, #1    @ decrement, set the Z flag
    bne  1b            @ branch back while not zero
```

For $N$ iterations that is exactly $2N$ instructions executed. On real silicon the cycles are $1 + (1+P)$ per iteration, so 3–4 cycles: about $3.5N$ cycles, or $N = 100\,000$ taking about $350\,000 / 168\ \text{MHz} \approx 2.1$ ms at 168 MHz.

On hardware you measure cycles with the **DWT cycle counter**: enable trace in DEMCR (bit 24 at 0xE000EDFC), set CYCCNTENA (bit 0 of DWT_CTRL at 0xE0001000), then read DWT_CYCCNT at 0xE0001004 before and after. The difference is the exact cycle count, including wait states.

## What QEMU can and cannot tell you

We run the code in **QEMU**, emulating the Arm MPS2-AN385 board (a Cortex-M3). QEMU does not model the pipeline or wait states, so it cannot count real cycles, and it has no DWT cycle counter. With `-icount shift=0` it does something useful instead: time advances by exactly 1 ns per **instruction**, and the SysTick timer, clocked at the board's 25 MHz, advances once every 40 instructions. So in QEMU

$$\text{instructions} = 40 \times \Delta\text{SysTick},$$

which lets you check an instruction count exactly. Converting to cycles on a real chip still needs the table above or a DWT measurement. Keep the two ideas separate: **instruction count** is a property of the code, **cycle count** is a property of the code on a particular memory system.

## Worked example

You time the two-instruction loop for $N = 100\,000$ with SysTick in QEMU.

1. Instructions: $2N = 200\,000$.
2. SysTick ticks: $200\,000 / 40 = 5000$.
3. Doubling $N$ doubles the ticks, so the slope is 2 instructions per iteration, and the intercept is the call overhead (a few instructions).
4. On a Cortex-M3 at 72 MHz with $P = 2$, the same loop is $4N = 400\,000$ cycles, or 5.56 ms.

## Code it from scratch

Four files. `link.ld` and `rt.c` are a minimal linker script and runtime (vector table, reset handler, and semihosting to print and exit through the debugger interface). Lessons 03 and 04 build them up line by line; here just use them. `cycles.c` is the experiment, and `run.py` cross-compiles, runs QEMU and checks the counts.

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

:::code file=cycles.c target=arm
```c
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
```
:::end

:::code file=run.py
```python
"""Cross-compile cycles.c for a Cortex-M3, run it in QEMU with -icount and check the instruction counts."""
import re, shutil, subprocess, sys
import numpy as np

for tool in ("arm-none-eabi-gcc", "qemu-system-arm"):
    if not shutil.which(tool):
        sys.exit(f"needs {tool} (Debian/Ubuntu: apt install gcc-arm-none-eabi qemu-system-arm)")

CFLAGS = ["-mcpu=cortex-m3", "-mthumb", "-O1", "-nostdlib", "-ffreestanding", "-Wall", "-Werror"]
subprocess.run(["arm-none-eabi-gcc", *CFLAGS, "-T", "link.ld", "rt.c", "cycles.c", "-o", "cycles.elf"], check=True)
out = subprocess.run(["qemu-system-arm", "-M", "mps2-an385", "-nographic", "-icount", "shift=0",
                      "-semihosting-config", "enable=on,target=native", "-kernel", "cycles.elf"],
                     stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=30)
assert out.returncode == 0, out.stdout                # semihosting text arrives on QEMU's stderr, merged here
rows = [(int(n), int(t)) for n, t in re.findall(r"N (\d+) ticks (\d+)", out.stdout)]
assert len(rows) == 4, out.stdout
INSTR_PER_TICK = 40                     # QEMU: 1 ns per instruction, SysTick at 25 MHz
N = np.array([r[0] for r in rows], float); instr = np.array([r[1] for r in rows], float) * INSTR_PER_TICK
slope, intercept = np.polyfit(N, instr, 1)
for n, i in zip(N, instr):
    print(f"N={int(n):>6}  instructions={int(i):>7}  predicted={int(2 * n):>7}")
print(f"slope {slope:.4f} instructions per iteration, intercept {intercept:.0f}")
assert abs(slope - 2) < 1e-3                          # two instructions per iteration
assert abs(instr[2] - 200000) / 200000 < 0.005         # N=100000 matches the hand count within 0.5 %
print("PASS")
```
:::end

## Exercises

:::exercise
Replace `subs`/`bne` with a C loop `for (volatile uint32_t i = 0; i < n; i++) {}` and measure again. Why are there now about 6 instructions per iteration?
:::solution
`volatile` forces `i` to live in memory, so each iteration loads `i`, compares it with `n`, branches, loads it again, adds one and stores it back. That's roughly ldr, cmp, b, ldr, adds, str: six instructions, and on hardware the loads and stores cost 2 cycles each. This is why a "delay loop" in C is unpredictable, and why you use a timer instead (lesson 08).
:::end

:::exercise
A real Cortex-M4 at 168 MHz with flash wait states runs the loop in 5 cycles per iteration until you enable the ART accelerator, then in 3. How long do 100 000 iterations take in each case?
:::solution
$5 \times 100\,000 / 168\ \text{MHz} = 2.98$ ms, and $3 \times 100\,000 / 168\ \text{MHz} = 1.79$ ms. The code didn't change, only the memory system: measure with DWT_CYCCNT on the board before you trust any timing.
:::end

## Quiz

:::quiz
- type: num
  q: How many instructions does the subs/bne loop execute for N = 250 000?
  answer: 500000
  tol: 0.001
  unit: instructions
  py: "2*250000"
  explain: Two per iteration.
- type: num
  q: In QEMU with -icount shift=0, how many SysTick ticks does that take (40 instructions per tick)?
  answer: 12500
  tol: 0.001
  unit: ticks
  py: "2*250000/40"
  explain: Instructions divided by 40.
- type: num
  q: On a Cortex-M3 at 72 MHz with 4 cycles per iteration, how many ms do 100 000 iterations take?
  answer: 5.556
  tol: 0.001
  unit: ms
  py: "4*100000/72e6*1000"
  explain: Cycles divided by the clock.
- type: num
  q: A taken branch costs 1 + P cycles. With P = 3, how many cycles is one loop iteration (subs 1 cycle)?
  answer: 5
  tol: 0.001
  unit: cycles
  py: "1 + (1 + 3)"
  explain: The subs plus the branch with its refill.
- type: mc
  q: Which register holds the return address after a BL (function call)?
  options:
    - SP (r13)
    - LR (r14)
    - PC (r15)
    - r0
  answer: 1
  explain: The link register.
- type: mc
  q: What does QEMU's -icount shift=0 let you measure exactly?
  options:
    - clock cycles including wait states
    - instructions executed
    - cache misses
    - power consumption
  answer: 1
  explain: Time advances 1 ns per instruction; there is no pipeline or wait-state model.
:::end

:::verify
assert 2 * 100000 // 40 == 5000
assert abs(4 * 100000 / 72e6 * 1000 - 5.556) < 1e-3
assert abs(5 * 100000 / 168e6 * 1000 - 2.976) < 1e-3 and abs(3 * 100000 / 168e6 * 1000 - 1.786) < 1e-3
:::end
