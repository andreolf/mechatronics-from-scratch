---
id: p10-l03
minutes: 40
summary: The linker script decides where every byte of your firmware lives. You derive the layout of .text, .rodata, .data, .bss, heap and stack in flash and RAM, learn why .data has two addresses, write a minimal linker script with a stack reservation and an overflow check, and test the result by reading the section table and the map against the addresses the firmware prints in QEMU.
---

## Two memories, four kinds of data

A microcontroller has non-volatile **flash** (keeps its contents without power, slow to write) and volatile **SRAM** (fast, lost at power-off). The compiler sorts your program into sections, and each kind has one right home:

| section | holds | lives in | at reset |
|---|---|---|---|
| `.text` | code, the vector table | flash | already there |
| `.rodata` | `const` tables, string literals | flash | already there |
| `.data` | initialised globals (`int n = 7;`) | RAM, initial values in flash | copied flash → RAM |
| `.bss` | zero-initialised globals (`int buf[64];`) | RAM | zeroed |
| heap, stack | `malloc`, locals, return addresses | RAM | nothing |

`.data` is the interesting one. Code that uses it needs its **RAM address** (where it lives at run time, the *VMA*), but its initial values must survive power-off, so they are stored in flash at a *load address* (the *LMA*). The startup code (lesson 04) copies them across before `main`.

## Reading a linker script

```
MEMORY { FLASH (rx) : ORIGIN = 0x00000000, LENGTH = 256K
         RAM  (rwx) : ORIGIN = 0x20000000, LENGTH = 64K }
```

declares the regions. Inside `SECTIONS`, each output section collects input sections by pattern (`*(.text*)` means "the `.text...` sections of every object") and is placed in a region with `> FLASH`. The dot (`.`) is the **location counter**: `_sdata = .;` defines a symbol at the current address, and `ALIGN(4)` rounds it up. `> RAM AT > FLASH` gives `.data` its VMA in RAM and its LMA in flash, and `LOADADDR(.data)` returns that LMA. Symbols defined in the script are visible from C as `extern uint32_t _sdata;`, where *the address of the symbol is the value* you want (`&_sdata`).

The stack grows **down** from the top of RAM, so `_estack = ORIGIN(RAM) + LENGTH(RAM)`. A reserved stack size plus an `ASSERT` turns "the stack silently overwrites `.bss`" into a link-time error:

$$\underbrace{\text{data} + \text{bss}}_{\text{static}} + \text{heap} + \text{stack} \le \text{RAM}.$$

:::figure widget=memmap caption="Flash and RAM as bars. Grow .data, .bss and the stack reservation; .data appears twice, as its initial values in flash and as the live copy in RAM. Past the limit the linker ASSERT fires."
:::end

## The map file

`-Wl,-Map=fw.map` writes a report of every input section, its object file, address and size. When firmware outgrows its flash, the map tells you which object and which function is to blame. `arm-none-eabi-objdump -h` prints the output sections with both VMA and LMA, and `nm -n` lists the symbols in address order.

## Worked example

256 KiB flash at 0x0, 64 KiB RAM at 0x2000_0000, 4 KiB stack. A build has `.text` = 0x1F0 bytes (including `.rodata`), `.data` = 8 bytes, `.bss` = 1024 bytes.

1. `.text` at 0x0000_0000, ending at 0x1F0.
2. `.data` VMA 0x2000_0000; its LMA is right after `.text`, at 0x1F0.
3. `.bss` starts at 0x2000_0008 and ends at 0x2000_0408.
4. `_estack` = 0x2001_0000, so the stack reserve starts at 0x2000_F000 and the heap gets 0x2000_F000 − 0x2000_0408 = 60 408 bytes.
5. A 62 KiB buffer makes static RAM ≈ 63.5 KiB, which plus 4 KiB of stack exceeds 64 KiB: the ASSERT fails the link.

## Code it from scratch

`main.c` puts a variable in each section and prints their addresses. `run.py` builds with a map file, reads the section table and symbols, compares them with what the firmware printed in QEMU, and finally shows that an oversized buffer fails the link.

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

:::code file=main.c target=arm
```c
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
```
:::end

:::code file=run.py
```python
"""Build with a map file, check section addresses, compare with QEMU, and test the overflow ASSERT."""
import re, shutil, subprocess, sys

for tool in ("arm-none-eabi-gcc", "qemu-system-arm"):
    if not shutil.which(tool):
        sys.exit(f"needs {tool} (Debian/Ubuntu: apt install gcc-arm-none-eabi qemu-system-arm)")
CC = ["arm-none-eabi-gcc", "-mcpu=cortex-m3", "-mthumb", "-O1", "-Wall", "-Werror", "-ffreestanding", "-nostdlib", "-T", "link.ld"]

subprocess.run([*CC, "-Wl,-Map=fw.map", "rt.c", "main.c", "-o", "fw.elf"], check=True)

# output sections: name -> (size, VMA, LMA)
sec = {}
for line in subprocess.run(["arm-none-eabi-objdump", "-h", "fw.elf"], capture_output=True, text=True).stdout.splitlines():
    f = line.split()
    if len(f) >= 6 and f[0].isdigit():
        sec[f[1]] = (int(f[2], 16), int(f[3], 16), int(f[4], 16))
sym = {}
for line in subprocess.run(["arm-none-eabi-nm", "-n", "fw.elf"], capture_output=True, text=True).stdout.splitlines():
    a, t, name = line.split()
    sym[name] = int(a, 16)

text, data, bss = sec[".text"], sec[".data"], sec[".bss"]
print({k: (hex(v[0]), hex(v[1]), hex(v[2])) for k, v in sec.items() if k in (".text", ".data", ".bss")})
assert text[1] == 0x0                                    # code at the start of flash
assert data[1] == 0x20000000                             # .data runs from RAM ...
assert data[2] == text[1] + text[0]                      # ... and is loaded from flash right after .text
assert bss[1] == data[1] + data[0]                       # .bss follows .data
assert sym["_sidata"] == data[2] and sym["_sdata"] == data[1] and sym["_ebss"] == bss[1] + bss[0]
assert sym["_estack"] == 0x20010000 and sym["_heap_end"] == 0x20010000 - 4096
assert sym["lut"] < text[1] + text[0]                    # const data is in flash
assert data[1] <= sym["counter"] < data[1] + data[0]
assert bss[1] <= sym["buffer"] < bss[1] + bss[0]
mapfile = open("fw.map").read()
assert re.search(r"^\.data\s+0x0*20000000\s+0x[0-9a-f]+\s+load address 0x0*%x" % data[2], mapfile, re.M)

run = subprocess.run(["qemu-system-arm", "-M", "mps2-an385", "-nographic", "-semihosting-config", "enable=on,target=native",
                      "-kernel", "fw.elf"], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=30)
seen = {k: int(v) for k, v in re.findall(r"^(\w+) (\d+)$", run.stdout, re.M)}
assert run.returncode == 0 and "PASS" in run.stdout, run.stdout
for name in ("lut", "counter", "buffer"):
    assert seen[name] == sym[name], name                 # the firmware agrees with the linker
print("addresses at run time match the symbol table; sp =", hex(seen["sp"]))

big = subprocess.run([*CC, "-DBUF_SIZE=63488", "rt.c", "main.c", "-o", "big.elf"], capture_output=True, text=True)
assert big.returncode != 0 and "RAM overflow" in big.stderr  # 62 KiB buffer + 4 KiB stack does not fit
print("oversized build rejected:", big.stderr.strip().splitlines()[-2][-60:])
print("PASS")
```
:::end

## Exercises

:::exercise
You declare `const uint8_t font[4096] = {...};` but `size` shows `.data` grew by 4 KiB instead of `.text`. What happened, and why does it matter?
:::solution
The table ended up in `.data`, usually because it isn't really `const` (for example `const uint8_t *font[]`, where the pointers are writable, or the `const` was dropped). It now costs 4 KiB of flash *and* 4 KiB of RAM, plus copy time at boot. Keep lookup tables `static const` so they stay in `.rodata`.
:::end

:::exercise
Why does the stack go at the top of RAM and grow down, with the heap above `.bss` growing up?
:::solution
The two dynamic regions grow toward each other from opposite ends of the free space, so either can use all of it as long as their sum fits. A fixed stack reservation and the ASSERT turn the worst case into a build error, and a stack guard (an MPU region or a watermark pattern) catches it at run time.
:::end

## Quiz

:::quiz
- type: num
  q: .text is 0x1F0 bytes at 0x0. What is the LMA of .data (decimal)?
  answer: 496
  tol: 0.001
  unit: ""
  py: "0x1F0"
  explain: Right after .text.
- type: num
  q: .data is 8 bytes at 0x20000000 and .bss is 1024 bytes. Where does .bss end (decimal)?
  answer: 536871944
  tol: 0.0000001
  unit: ""
  py: "0x20000000 + 8 + 1024"
  explain: 0x20000408.
- type: num
  q: With 64 KiB RAM, 4 KiB stack and .bss ending at 0x20000408, how many bytes of heap remain?
  answer: 60408
  tol: 0.001
  unit: bytes
  py: "0x2000F000 - 0x20000408"
  explain: From _ebss to the stack reservation.
- type: num
  q: How much flash does .data with 200 bytes of initial values use?
  answer: 200
  tol: 0.001
  unit: bytes
  py: "200"
  explain: Its initial values are stored in flash (and it uses 200 bytes of RAM too).
- type: mc
  q: What does '> RAM AT > FLASH' mean for .data?
  options:
    - it is copied from RAM to flash at reset
    - it runs from RAM (VMA) but is stored in flash (LMA)
    - it is placed twice by the compiler
    - it is read-only
  answer: 1
  explain: Two addresses, one copy at startup.
- type: mc
  q: In C, how do you get the value of the linker symbol _estack?
  options:
    - _estack
    - '&_estack, the address of the symbol'
    - "*_estack"
    - sizeof(_estack)
  answer: 1
  explain: Linker symbols are addresses, not variables with storage.
:::end

:::verify
assert 0x20010000 - 4096 == 0x2000F000
assert 0x2000F000 - 0x20000408 == 60408
assert 62 * 1024 + 8 + 4096 > 64 * 1024
:::end
