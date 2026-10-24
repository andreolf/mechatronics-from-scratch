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
