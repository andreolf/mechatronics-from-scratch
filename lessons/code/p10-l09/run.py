"""Measure SysTick ISR period jitter in QEMU, with and without a 5 us critical section in main."""
import re, shutil, subprocess, sys
for tool in ("arm-none-eabi-gcc", "qemu-system-arm"):
    if not shutil.which(tool):
        sys.exit(f"needs {tool} (Debian/Ubuntu: apt install gcc-arm-none-eabi qemu-system-arm)")

NS_PER_COUNT = 40                                    # TIMER0 runs at 25 MHz
def measure(crit_loops):
    subprocess.run(["arm-none-eabi-gcc", "-mcpu=cortex-m3", "-mthumb", "-O1", "-Wall", "-Werror", "-ffreestanding",
                    "-nostdlib", "-T", "link.ld", f"-DCRIT_LOOPS={crit_loops}", "rt.c", "isr.c", "-o", "isr.elf"], check=True)
    r = subprocess.run(["qemu-system-arm", "-M", "mps2-an385", "-nographic", "-icount", "shift=0", "-semihosting-config",
                        "enable=on,target=native", "-kernel", "isr.elf"], stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                       text=True, timeout=60)
    assert r.returncode == 0, r.stdout
    lo, hi, y = map(int, re.search(r"period_min (\d+) period_max (\d+) y_milli (\d+)", r.stdout).groups())
    return lo, hi, y

lo, hi, y = measure(0)
jitter_ns = (hi - lo) * NS_PER_COUNT
print(f"clean:  period {lo}..{hi} counts ({lo * NS_PER_COUNT / 1e6:.4f} ms), jitter {jitter_ns} ns, plant output {y / 1000:.3f}")
assert abs((lo + hi) / 2 - 25000) <= 1                # 1 ms period
assert jitter_ns < 1000                               # jitter below 1 us
assert 990 <= y <= 1010                               # the PI loop has settled on the setpoint 1.0

lo2, hi2, _ = measure(2500)                           # 2 instructions x 2500 = 5000 ns with interrupts off
jitter2 = (hi2 - lo2) * NS_PER_COUNT
print(f"5 us critical sections: period {lo2}..{hi2} counts, jitter {jitter2} ns")
assert jitter2 > 1000                                 # the long critical section breaks the budget
assert jitter2 <= 2 * 5000 + 2 * NS_PER_COUNT         # but never more than twice its length
print("PASS")
