"""Build pid.c for a Cortex-M3 (soft-float) and a Cortex-M4F (FPU), count instructions in QEMU, compare outputs."""
import re, shutil, subprocess, sys
for tool in ("arm-none-eabi-gcc", "qemu-system-arm"):
    if not shutil.which(tool):
        sys.exit(f"needs {tool} (Debian/Ubuntu: apt install gcc-arm-none-eabi qemu-system-arm)")

N, INSTR_PER_TICK = 1000, 40
TARGETS = {"m3": (["-mcpu=cortex-m3"], "mps2-an385"),
           "m4f": (["-mcpu=cortex-m4", "-mfpu=fpv4-sp-d16", "-mfloat-abi=hard", "-DHARD_FPU"], "mps2-an386")}

def run(name, extra=()):
    flags, board = TARGETS[name]
    subprocess.run(["arm-none-eabi-gcc", *flags, "-mthumb", "-O2", "-Wall", "-Werror", "-ffreestanding", "-nostdlib",
                    "-T", "link.ld", *extra, "rt.c", "pid.c", "-lgcc", "-o", f"{name}.elf"], check=True)
    r = subprocess.run(["qemu-system-arm", "-M", board, "-nographic", "-icount", "shift=0", "-semihosting-config",
                        "enable=on,target=native", "-kernel", f"{name}.elf"], stdout=subprocess.PIPE,
                       stderr=subprocess.STDOUT, text=True, timeout=60)
    assert r.returncode == 0, r.stdout
    f, q, ppm = map(int, re.search(r"float_ticks (\d+) q15_ticks (\d+) worst_ppm (\d+)", r.stdout).groups())
    return f * INSTR_PER_TICK / N, q * INSTR_PER_TICK / N, ppm

res = {name: run(name) for name in TARGETS}
for name, (f, q, ppm) in res.items():
    print(f"{name:>4}: float {f:6.1f} instructions/step, Q15 {q:5.1f}, worst difference {ppm / 1e4:.3f} % of full scale")
m3f, m3q, m3e = res["m3"]; m4f, m4q, m4e = res["m4f"]
assert m3e < 1000 and m4e < 1000                     # float and Q15 agree within 0.1 % of full scale
assert m3f > 5 * m3q                                 # without an FPU, float costs many times more
assert m4f < 2 * m4q                                 # with an FPU, float is about as cheap as Q15
_, _, trunc = run("m3", ["-DTRUNCATE"])
print(f"Q15 with truncation instead of rounding: worst difference {trunc / 1e4:.2f} %")
assert trunc > 5000                                  # the -0.5 LSB bias accumulates in the integrator
print("PASS")
