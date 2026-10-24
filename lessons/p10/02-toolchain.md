---
id: p10-l02
minutes: 40
summary: An IDE's build button hides four steps, which are compile, assemble, link and convert. You learn what an object file holds, how the linker resolves symbols and places sections, and why an ELF becomes a raw binary for flashing, then write a Makefile for arm-none-eabi-gcc that builds firmware which boots in QEMU and has the vector table exactly where the core expects it.
---

## From .c to flash

A firmware build is a pipeline, and each step has a tool you can run by hand:

1. **Preprocess and compile** (`arm-none-eabi-gcc -c`): each `.c` file becomes an **object file** (`.o`) of machine code for the target, organised into **sections**: `.text` (code), `.rodata` (constants), `.data` (initialised variables) and `.bss` (zero-initialised variables). Addresses inside it are not final yet.
2. **Link** (`arm-none-eabi-ld`, usually invoked through gcc): combine all objects, resolve every **symbol** (a call to `rt_puts` in `main.o` is an *undefined* symbol until `rt.o` supplies it), place each section at an address given by the **linker script**, and write an **ELF** file.
3. **Convert** (`arm-none-eabi-objcopy -O binary`): strip the ELF down to the raw bytes that go into flash, starting at flash address 0.
4. **Flash** (OpenOCD, st-flash, or a vendor tool over SWD): write those bytes into the chip.

The ELF keeps symbols, section headers and debug information, which is what GDB needs. The `.bin` is only the bytes, which is what the chip needs. A `.hex` file is the same bytes as text with addresses, which some programmers prefer.

:::figure widget=buildpipe caption="The build pipeline. Step through it: two object files with undefined symbols, the linker placing sections, and objcopy cutting out the flash image. Toggle --gc-sections to see unused functions disappear."
:::end

## Symbols and sections

`arm-none-eabi-nm` lists symbols with a type letter: **T** for code in `.text`, **D** for initialised data, **B** for `.bss`, **R** for read-only data, and **U** for undefined (needed from somewhere else). If a U symbol has no definition in any object at link time, you get the classic `undefined reference to ...` error. If two objects both define it, you get `multiple definition`.

Two flags shrink firmware: `-ffunction-sections -fdata-sections` put each function and variable in its own section, and `-Wl,--gc-sections` lets the linker drop every section that nothing references. The vector table must be marked `KEEP` in the linker script, because nothing *calls* it: the hardware reads it.

## Why the binary starts with the stack pointer

A Cortex-M core boots by reading two words from address 0: the initial **stack pointer** and the **reset vector** (the address of `Reset_Handler`). Thumb code addresses have bit 0 set to mark Thumb state, so the reset vector is odd. Your build is correct only if the first 8 bytes of the `.bin` are exactly those two values. That is a cheap, strong test, and it's the first thing to check when a board doesn't boot.

## The size of a flash image

`arm-none-eabi-size` prints `text`, `data` and `bss`. Flash holds `text + data` (the initial values of `.data` are stored in flash and copied to RAM at startup). RAM holds `data + bss` plus the stack. So

$$\text{flash used} = \text{text} + \text{data}, \qquad \text{static RAM used} = \text{data} + \text{bss}.$$

## Worked example

`size` reports text = 412, data = 16, bss = 8 for a build.

1. The `.bin` is $412 + 16 = 428$ bytes.
2. Static RAM is $16 + 8 = 24$ bytes, plus the stack.
3. The first word is the stack top, $0x2000\,0000 + 64\ \text{KiB} = 0x2001\,0000$.
4. If `Reset_Handler` is at 0x40 in flash, the second word is 0x41 (Thumb bit set).

## Code it from scratch

The same `link.ld` and `rt.c` as lesson 01, a `main.c`, the `Makefile`, and `run.py`, which runs `make`, inspects the outputs with the binutils, and boots the image in QEMU. The `flash` target shows the OpenOCD command for an STM32F4 board with an ST-LINK; it isn't run here.

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

:::code file=main.c target=arm
```c
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
```
:::end

:::code file=Makefile lang=makefile
```makefile
# Makefile: build Cortex-M3 firmware with no IDE. Recipe lines start with a TAB.
CC      = arm-none-eabi-gcc
OBJCOPY = arm-none-eabi-objcopy
SIZE    = arm-none-eabi-size
CFLAGS  = -mcpu=cortex-m3 -mthumb -O2 -g -Wall -Werror -ffreestanding -ffunction-sections -fdata-sections
LDFLAGS = -nostdlib -T link.ld -Wl,--gc-sections -Wl,-Map=fw.map
OBJS    = rt.o main.o
QEMU    = qemu-system-arm -M mps2-an385 -nographic -semihosting-config enable=on,target=native

all: fw.bin

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

fw.elf: $(OBJS) link.ld
	$(CC) $(CFLAGS) $(LDFLAGS) $(OBJS) -o $@
	$(SIZE) $@

fw.bin: fw.elf
	$(OBJCOPY) -O binary $< $@

run: fw.elf
	$(QEMU) -kernel fw.elf

flash: fw.elf
	openocd -f interface/stlink.cfg -f target/stm32f4x.cfg -c "program fw.elf verify reset exit"

clean:
	rm -f *.o fw.elf fw.bin fw.map

.PHONY: all run flash clean
```
:::end

:::code file=run.py
```python
"""Build with make, check the ELF and BIN with binutils, boot in QEMU."""
import re, shutil, struct, subprocess, sys

for tool in ("make", "arm-none-eabi-gcc", "qemu-system-arm"):
    if not shutil.which(tool):
        sys.exit(f"needs {tool} (Debian/Ubuntu: apt install make gcc-arm-none-eabi qemu-system-arm)")

def sh(*cmd):
    return subprocess.run(cmd, check=True, capture_output=True, text=True).stdout

sh("make", "clean"); print(sh("make", "all"))

def symbols(path):
    table = {}
    for line in sh("arm-none-eabi-nm", path).splitlines():
        parts = line.split()
        if len(parts) == 3: table[parts[2]] = (int(parts[0], 16), parts[1])
        elif len(parts) == 2: table[parts[1]] = (None, parts[0])
    return table

obj, elf = symbols("main.o"), symbols("fw.elf")
assert obj["rt_puts"][1] == "U"                      # undefined in main.o ...
assert elf["rt_puts"][1] == "T"                      # ... resolved by the linker
assert "unused_helper" in obj and "unused_helper" not in elf   # removed by --gc-sections
assert elf["table"][1] == "D" and elf["scratch"][1] == "B"

text, data, bss = map(int, sh("arm-none-eabi-size", "fw.elf").splitlines()[1].split()[:3])
image = open("fw.bin", "rb").read()
assert len(image) == text + data, (len(image), text, data)     # flash image = text + data

sp, reset = struct.unpack_from("<II", image, 0)
assert sp == elf["_estack"][0] == 0x20010000                     # word 0: initial stack pointer
assert reset == elf["Reset_Handler"][0] | 1                      # word 1: reset vector, Thumb bit set
print(f"text {text} data {data} bss {bss}; bin {len(image)} bytes; SP 0x{sp:08x}; reset 0x{reset:08x}")

boot = subprocess.run(["make", "-s", "run"], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=30)
print(boot.stdout.strip())
assert boot.returncode == 0 and "hello from flash" in boot.stdout and "PASS" in boot.stdout
print("PASS")
```
:::end

## Exercises

:::exercise
Delete `rt.o` from `OBJS` and run make. What error do you get, and which tool prints it?
:::solution
The linker (through gcc) reports `undefined reference to 'rt_puts'` (and to `Reset_Handler` as the entry). The compiler was happy because a declaration is enough to compile a call; only the linker needs the definition.
:::end

:::exercise
Your board doesn't boot. `xxd -l 8 fw.bin` shows `00 00 00 00 00 00 00 00`. What's the likely cause?
:::solution
The vector table isn't at the start of the image: either the `.vectors` section isn't placed first in `.text`, or it was removed by `--gc-sections` because it isn't marked `KEEP`. The core then loads SP = 0 and jumps to address 0, which faults immediately.
:::end

## Quiz

:::quiz
- type: num
  q: size reports text 1200, data 64, bss 256. How many bytes does the flash image take?
  answer: 1264
  tol: 0.001
  unit: bytes
  py: "1200 + 64"
  explain: text + data.
- type: num
  q: Static RAM for that build (data + bss), in bytes?
  answer: 320
  tol: 0.001
  unit: bytes
  py: "64 + 256"
  explain: Initialised and zeroed variables both live in RAM.
- type: num
  q: Reset_Handler is at 0x100. What value is stored in the reset vector (decimal)?
  answer: 257
  tol: 0.001
  unit: ""
  py: "0x100 | 1"
  explain: Thumb bit set.
- type: num
  q: Initial SP for 128 KiB of RAM starting at 0x20000000, in decimal?
  answer: 537001984
  tol: 0.0000001
  unit: ""
  py: "0x20000000 + 128*1024"
  explain: 0x20020000.
- type: mc
  q: In nm output, what does U mean?
  options:
    - unused
    - undefined, needed from another object
    - uninitialised data
    - user code
  answer: 1
  explain: The linker must find a definition.
- type: mc
  q: Why does the vector table need KEEP in the linker script?
  options:
    - it is too large
    - nothing in the code references it, so --gc-sections would drop it
    - it must be in RAM
    - KEEP makes it read-only
  answer: 1
  explain: The hardware reads it, not your code.
:::end

:::verify
assert 412 + 16 == 428 and 16 + 8 == 24
assert 0x20000000 + 64 * 1024 == 0x20010000 and (0x40 | 1) == 0x41
:::end
