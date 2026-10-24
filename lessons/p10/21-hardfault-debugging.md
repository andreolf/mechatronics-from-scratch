---
id: p10-l21
minutes: 40
summary: When firmware crashes on a Cortex-M it doesn't vanish, it takes a HardFault with the crashing context saved on the stack and the reason recorded in fault status registers. You learn what GDB over SWD gives you, breakpoints, watchpoints and fault registers, write a HardFault handler that recovers the stacked frame and decodes CFSR, HFSR and BFAR, and test it in QEMU on three real faults, checking that it names the faulting function from the stacked PC.
---

## The debugger's view

A Cortex-M has its debugger built in. Over **SWD** (two wires, SWDIO and SWCLK) a probe such as an ST-LINK or J-Link, driven by **OpenOCD**, lets **GDB** halt the core, read and write any register or memory address, and flash the part:

- **breakpoints**: the Flash Patch and Breakpoint unit (FPB) gives a handful of hardware breakpoints (6 on a typical Cortex-M3/M4), which work on code in flash;
- **watchpoints**: the DWT's comparators (4 on M3/M4) halt when an address is read or written. They're how you find out *who* is corrupting a variable;
- `monitor reset halt`, `load`, `continue`, `bt`, `info registers`, `x/8wx $sp` are most of what you need day to day.

GDB is the right tool when you can reproduce the bug at the bench. The fault handler below is for when you can't: it records what happened at the moment of the crash.

## What a fault leaves behind

Bad memory accesses, undefined instructions, division by zero (when trapping is enabled) and bad exception returns raise **fault exceptions**. If the configurable faults (MemManage, BusFault, UsageFault) aren't enabled, they **escalate** to HardFault. On entry the core stacks the usual exception frame (lesson 09):

| offset | 0 | 4 | 8 | 12 | 16 | 20 | 24 | 28 |
|---|---|---|---|---|---|---|---|---|
| register | r0 | r1 | r2 | r3 | r12 | LR | **PC** | xPSR |

The stacked **PC** is the address of the instruction that faulted (for a precise fault), and the stacked **LR** is where that function would have returned. Bit 2 of the handler's own LR (EXC_RETURN) says which stack the frame is on: 0 for MSP, 1 for PSP (used by an RTOS's threads). A three-instruction assembly stub picks the right one and passes a pointer to C.

## The fault status registers

| register | address | what it tells you |
|---|---|---|
| CFSR | 0xE000ED28 | the cause: MemManage (bits 7:0), BusFault (15:8), UsageFault (31:16) |
| HFSR | 0xE000ED2C | bit 30 FORCED: a configurable fault escalated to HardFault |
| MMFAR | 0xE000ED34 | faulting address, valid if CFSR.MMARVALID (bit 7) |
| BFAR | 0xE000ED38 | faulting address, valid if CFSR.BFARVALID (bit 15) |

Useful CFSR bits: **PRECISERR** (bit 9, a bus error at a known instruction), **IMPRECISERR** (bit 10, a buffered write failed later, so the PC is past the culprit), **UNDEFINSTR** (bit 16), **INVSTATE** (bit 17, typically a call through a function pointer with bit 0 clear), **DIVBYZERO** (bit 25, needs CCR.DIV_0_TRP).

:::figure widget=faultdecode caption="A HardFault decoder. Pick a fault: the stacked frame, CFSR bits and the faulting address are decoded, and the stacked PC is mapped back to a function the way addr2line would."
:::end

## Worked example

The handler prints CFSR = 0x0000_8200, HFSR = 0x4000_0000, BFAR = 0xF000_0000, stacked PC = 0x0000_018C.

1. HFSR bit 30 (FORCED): a BusFault escalated.
2. CFSR bit 9 PRECISERR and bit 15 BFARVALID: a precise data bus error at a known address.
3. BFAR = 0xF000_0000: the code read an address where there's no memory or peripheral.
4. `arm-none-eabi-addr2line -f -e fw.elf 0x18c` names the function, and with `-g` the source line.

## Code it from scratch

`fault.c` holds the handler and three ways to crash, selected by `-DFAULT=n`: a division by zero with trapping enabled, a read from an unmapped address, and an undefined instruction. The handler prints the decoded state and exits through semihosting. `run.py` builds each, runs it in QEMU, and checks that the decoder identified the cause and that the stacked PC lies inside the function that crashed.

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

:::code file=fault.c target=arm
```c
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
```
:::end

:::code file=run.py
```python
"""Trigger three faults in QEMU and check the HardFault decoder names the cause and the function."""
import re, shutil, subprocess, sys
for tool in ("arm-none-eabi-gcc", "qemu-system-arm"):
    if not shutil.which(tool):
        sys.exit(f"needs {tool} (Debian/Ubuntu: apt install gcc-arm-none-eabi qemu-system-arm)")

def function_at(elf, pc):
    out = subprocess.run(["arm-none-eabi-addr2line", "-f", "-e", elf, hex(pc)], capture_output=True, text=True).stdout
    return out.splitlines()[0]

cases = {1: ("DIVBYZERO", "divide"), 2: ("PRECISERR", "peek"), 3: ("UNDEFINSTR", "bad_opcode")}
for n, (cause, func) in cases.items():
    elf = f"fault{n}.elf"
    subprocess.run(["arm-none-eabi-gcc", "-mcpu=cortex-m3", "-mthumb", "-O1", "-g", "-Wall", "-Werror", "-ffreestanding",
                    "-nostdlib", "-T", "link.ld", f"-DFAULT={n}", "rt.c", "fault.c", "-o", elf], check=True)
    r = subprocess.run(["qemu-system-arm", "-M", "mps2-an385", "-nographic", "-semihosting-config", "enable=on,target=native",
                        "-kernel", elf], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=30)
    assert r.returncode == 0 and "no fault?" not in r.stdout, r.stdout
    regs = {k: int(v, 16) for k, v in re.findall(r"(\w+)=0x([0-9a-f]{8})", r.stdout)}
    assert f"cause: {cause}" in r.stdout and "FORCED" in r.stdout, r.stdout
    where = function_at(elf, regs["pc"])
    print(f"fault {n}: {cause:<10} pc=0x{regs['pc']:08x} in {where}()  cfsr=0x{regs['cfsr']:08x}"
          + (f" bfar=0x{regs['bfar']:08x}" if "bfar" in regs else ""))
    assert where == func                                   # the decoder identifies the faulting function
    if n == 2:
        assert regs["bfar"] == 0xF0000000 and regs["cfsr"] & (1 << 15)
print("PASS")
```
:::end

## Exercises

:::exercise
CFSR shows IMPRECISERR and the stacked PC points into an unrelated function. How do you find the real culprit?
:::solution
An imprecise bus fault comes from a buffered write that failed after the CPU moved on, so the PC is a few instructions later. Set `SCB->ACTLR` DISDEFWBUF (bit 1) to disable the write buffer while debugging; the fault then becomes precise and the PC points at the guilty store. Remember to re-enable it, since it costs performance.
:::end

:::exercise
A HardFault with INVSTATE right after calling a function pointer. What's wrong?
:::solution
The pointer's bit 0 is clear, so the core tried to switch to Arm state, which a Cortex-M doesn't have. Usually the pointer was computed by hand, read from uninitialised memory, or came from a corrupted table. Function addresses from the linker always have bit 0 set.
:::end

## Quiz

:::quiz
- type: num
  q: Offset in bytes of the stacked PC in the exception frame?
  answer: 24
  tol: 0.001
  unit: bytes
  py: "6*4"
  explain: The seventh word.
- type: num
  q: CFSR value (decimal) with only DIVBYZERO set?
  answer: 33554432
  tol: 0.0000001
  unit: ""
  py: "1 << 25"
  explain: 0x02000000.
- type: num
  q: CFSR value (decimal) for PRECISERR plus BFARVALID?
  answer: 33280
  tol: 0.001
  unit: ""
  py: "(1 << 9) | (1 << 15)"
  explain: 0x8200.
- type: num
  q: Size in bytes of the basic exception frame?
  answer: 32
  tol: 0.001
  unit: bytes
  py: "8*4"
  explain: Eight registers.
- type: mc
  q: EXC_RETURN bit 2 tells the handler…
  options:
    - the fault cause
    - which stack (MSP or PSP) holds the frame
    - the priority
    - whether the FPU was used
  answer: 1
  explain: The stub tests it and reads MSP or PSP.
- type: mc
  q: Which tool maps a stacked PC to a function and line?
  options:
    - objcopy
    - addr2line (or GDB's info symbol / list)
    - size
    - nm only
  answer: 1
  explain: It needs the ELF with symbols, and -g for lines.
:::end

:::verify
assert (1 << 9) | (1 << 15) == 0x8200 and 1 << 25 == 0x02000000
assert (1 << 30) == 0x40000000
:::end
