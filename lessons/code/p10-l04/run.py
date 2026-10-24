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
