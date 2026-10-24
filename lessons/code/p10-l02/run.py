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
