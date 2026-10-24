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
