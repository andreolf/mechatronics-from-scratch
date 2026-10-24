---
id: p10-l04
minutes: 40
summary: Before main runs, something has to set the stack pointer, copy initialised variables into RAM and zero the rest, and that something is about thirty lines of C. You derive the reset sequence of a Cortex-M, write the vector table and startup code from scratch, and prove they work by booting in QEMU, then break them on purpose and watch the global-variable test catch it.
---

## What happens at reset

When a Cortex-M core leaves reset it does three things in hardware, with no code at all:

1. reads the word at address 0x0000_0000 into **SP** (the main stack pointer, MSP);
2. reads the word at 0x0000_0004, the **reset vector**, into **PC** (bit 0 must be 1, meaning Thumb);
3. starts executing there, in Thread mode, privileged, with interrupts enabled but nothing configured.

That's all. RAM contains whatever it powered up with. A global `int n = 7;` is **not** 7 yet: its initial value sits in flash at the `.data` load address, and `int buf[64];` is not zero. The C standard promises both before `main`, so the startup code must:

- copy `.data` from its LMA in flash (`_sidata`) to its VMA in RAM (`_sdata` to `_edata`),
- zero `.bss` (`_sbss` to `_ebss`),
- optionally set up clocks (`SystemInit`, lesson 07) and run C++ constructors (`__libc_init_array`),
- call `main`, and never return from the reset handler.

The cost is linear: copying $D$ bytes and zeroing $B$ bytes word by word takes about $D/4$ load/store pairs plus $B/4$ stores, a few microseconds for kilobytes at 100 MHz.

:::figure widget=resetstep caption="Step from reset to main. Watch SP and PC load from the vector table, then .data fill with its initial values and .bss clear, while a global's value changes from garbage to correct."
:::end

## The vector table

The vector table is an array of 32-bit words at address 0 (relocatable later through `SCB->VTOR`). On a Cortex-M3/M4:

| index | offset | entry |
|---|---|---|
| 0 | 0x00 | initial SP |
| 1 | 0x04 | Reset |
| 2 | 0x08 | NMI |
| 3 | 0x0C | HardFault |
| 4–6 | 0x10–0x18 | MemManage, BusFault, UsageFault |
| 11 | 0x2C | SVCall |
| 14 | 0x38 | PendSV |
| 15 | 0x3C | SysTick |
| 16 + n | 0x40 + 4n | external interrupt n (IRQn) |

Exception number $k$ lives at offset $4k$. Handlers are declared **weak aliases** of a default handler, so any file can define `void SysTick_Handler(void)` and the linker picks that over the default, with no registration call.

## Worked example

`.data` is 12 bytes and `.bss` is 40 bytes on a part at 64 MHz.

1. Copy: 3 words, each a load and a store; zero: 10 stores.
2. The external interrupt 5 vector lives at offset $0x40 + 4\cdot5 = 0x54$.
3. SysTick (exception 15) is at $4\cdot15 = 0x3C$.
4. If the copy loop were skipped, a global initialised to 42 would read whatever RAM held: 0 in QEMU, random on hardware.

## Code it from scratch

`startup.c` is the whole boot path. For testing it has two switches: `POISON` fills the static RAM with 0xA5 first, as real RAM would hold garbage (QEMU's RAM starts at zero, which would hide a missing `.bss` loop), and `SKIP_COPY` / `SKIP_ZERO` remove a step. `main.c` checks the globals. `run.py` boots the correct build and the broken ones.

:::code file=link.ld
```ld
/* Minimal linker script for a Cortex-M3 (QEMU mps2-an385 memory map). */
MEMORY {
  FLASH (rx)  : ORIGIN = 0x00000000, LENGTH = 256K
  RAM   (rwx) : ORIGIN = 0x20000000, LENGTH = 64K
}
STACK_SIZE = 4K;
ENTRY(Reset_Handler)

SECTIONS {
  .text : {
    KEEP(*(.vectors))          /* the vector table must be first, at address 0 */
    *(.text*)
    *(.rodata*)
    . = ALIGN(4);
  } > FLASH

  .data : {                    /* VMA in RAM, LMA in flash */
    _sdata = .;
    *(.data*)
    . = ALIGN(4);
    _edata = .;
  } > RAM AT > FLASH
  _sidata = LOADADDR(.data);

  .bss (NOLOAD) : {
    _sbss = .;
    *(.bss*) *(COMMON)
    . = ALIGN(4);
    _ebss = .;
  } > RAM

  _heap_start = _ebss;
  _estack     = ORIGIN(RAM) + LENGTH(RAM);
  _heap_end   = _estack - STACK_SIZE;
  ASSERT(_heap_end >= _heap_start, "RAM overflow: .data + .bss + stack do not fit")
}
```
:::end

:::code file=startup.c target=arm
```c
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
```
:::end

:::code file=semihost.c target=arm
```c
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
```
:::end

:::code file=main.c target=arm
```c
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
```
:::end

:::code file=run.py
```python
"""Boot the startup code in QEMU, then break it on purpose and check the test catches it."""
import shutil, struct, subprocess, sys

for tool in ("arm-none-eabi-gcc", "qemu-system-arm"):
    if not shutil.which(tool):
        sys.exit(f"needs {tool} (Debian/Ubuntu: apt install gcc-arm-none-eabi qemu-system-arm)")

def boot(*defines):
    subprocess.run(["arm-none-eabi-gcc", "-mcpu=cortex-m3", "-mthumb", "-O1", "-Wall", "-Werror", "-ffreestanding",
                    "-nostdlib", "-T", "link.ld", *[f"-D{d}" for d in defines],
                    "startup.c", "semihost.c", "main.c", "-o", "fw.elf"], check=True)
    r = subprocess.run(["qemu-system-arm", "-M", "mps2-an385", "-nographic", "-semihosting-config",
                        "enable=on,target=native", "-kernel", "fw.elf"],
                       stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=30)
    return r.returncode, r.stdout.strip()

cases = {(): 0, ("POISON",): 0, ("SKIP_COPY",): 1, ("POISON", "SKIP_ZERO"): 1, ("POISON", "SKIP_COPY", "SKIP_ZERO"): 1}
for defines, expect in cases.items():
    code, out = boot(*defines)
    print(f"{' '.join(defines) or 'normal':<28} exit {code}  {out}")
    assert code == expect, (defines, code, out)

# vector table layout: SysTick handler address at offset 0x3C, reset vector odd
boot()
subprocess.run(["arm-none-eabi-objcopy", "-O", "binary", "fw.elf", "fw.bin"], check=True)
words = struct.unpack_from("<16I", open("fw.bin", "rb").read(), 0)
nm = {l.split()[2]: int(l.split()[0], 16) for l in subprocess.run(["arm-none-eabi-nm", "fw.elf"], capture_output=True, text=True).stdout.splitlines() if len(l.split()) == 3}
assert words[0] == nm["_estack"] and words[1] == nm["Reset_Handler"] | 1
assert words[15] == nm["SysTick_Handler"] | 1 == nm["Default_Handler"] | 1   # weak alias: not overridden here
print("PASS")
```
:::end

## Exercises

:::exercise
Add `void SysTick_Handler(void) { ticks++; }` to `main.c`. What changes in the vector table, and why didn't you have to edit `startup.c`?
:::solution
Word 15 now holds the address of your `SysTick_Handler` (with bit 0 set) instead of `Default_Handler`. The startup file's declaration is a *weak* alias, and a strong definition anywhere in the program wins at link time.
:::end

:::exercise
A colleague moves the `.bss` loop before the `.data` copy. Does it still work? What if a C++ constructor runs before both?
:::solution
The order of the two loops doesn't matter because the regions don't overlap. A constructor (from `__libc_init_array`) must run *after* both, since it may read initialised globals; called first, it would see garbage and its writes into `.bss` would then be zeroed.
:::end

## Quiz

:::quiz
- type: num
  q: Offset in the vector table of external interrupt IRQ 5 (decimal)?
  answer: 84
  tol: 0.001
  unit: bytes
  py: "0x40 + 4*5"
  explain: 0x54.
- type: num
  q: Offset of the SysTick vector (exception 15), decimal?
  answer: 60
  tol: 0.001
  unit: bytes
  py: "4*15"
  explain: 0x3C.
- type: num
  q: How many word stores zero a 40-byte .bss?
  answer: 10
  tol: 0.001
  unit: stores
  py: "40/4"
  explain: One per 32-bit word.
- type: num
  q: Copying 4 KiB of .data at about 4 cycles per word on a 64 MHz core takes how many µs?
  answer: 64
  tol: 0.001
  unit: µs
  py: "4096/4*4/64e6*1e6"
  explain: 1024 words × 4 cycles / 64 MHz.
- type: mc
  q: What does the core read from address 0x00000000 at reset?
  options:
    - the first instruction
    - the initial stack pointer
    - the reset vector
    - the clock configuration
  answer: 1
  explain: Word 0 is SP, word 1 is the reset vector.
- type: mc
  q: Why does the test poison RAM with 0xA5 before checking .bss?
  options:
    - QEMU RAM starts at zero and would hide a missing .bss loop
    - to speed up boot
    - the linker requires it
    - to set the stack
  answer: 0
  explain: Real RAM powers up with garbage; the test must too.
:::end

:::verify
assert 0x40 + 4 * 5 == 0x54 and 4 * 15 == 0x3C
assert abs(4096 / 4 * 4 / 64e6 * 1e6 - 64) < 1e-9
:::end
