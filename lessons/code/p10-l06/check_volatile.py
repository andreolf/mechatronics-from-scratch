"""Compile poll.c with -O2 for a Cortex-M3 and check where the loads are."""
import re, shutil, subprocess, sys
if not shutil.which("arm-none-eabi-gcc"):
    sys.exit("needs arm-none-eabi-gcc (Debian/Ubuntu: apt install gcc-arm-none-eabi)")
asm = subprocess.run(["arm-none-eabi-gcc", "-mcpu=cortex-m3", "-mthumb", "-O2", "-S", "poll.c", "-o", "-"],
                     capture_output=True, text=True, check=True).stdout

def body(name):
    lines = asm.split(name + ":\n", 1)[1].split("\t.size", 1)[0].splitlines()
    return [l.strip() for l in lines if l.strip() and not l.strip().startswith(("@", "."))
            or re.match(r"^\.L\d+:", l.strip())]

def loop(lines):
    """Instructions between a label and the branch that jumps back to it."""
    for i, l in enumerate(lines):
        m = re.match(r"^(\.L\d+):$", l)
        if m:
            for j in range(i + 1, len(lines)):
                if lines[j].endswith(m.group(1)) and lines[j].split()[0].startswith("b"):
                    return lines[i + 1:j + 1]
    return []

plain, vol = loop(body("wait_plain")), loop(body("wait_volatile"))
print("plain loop:   ", plain)
print("volatile loop:", vol)
assert plain and not any(l.startswith("ldr") for l in plain)    # loaded once, then spins forever
assert any(l.startswith("ldr") for l in vol)                     # re-reads memory every iteration
print("PASS")
