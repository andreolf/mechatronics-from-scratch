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
