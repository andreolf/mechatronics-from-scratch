---
id: p10-l17
minutes: 40
summary: Fixed-point arithmetic used to be the only way to run a control loop fast on a small MCU, and on a core without an FPU it still is, but an M4F with a single-precision FPU changes the trade-off. You derive the Q15 PID step with rounding and saturation, cross-compile the same float and Q15 controllers for a Cortex-M3 and a Cortex-M4F, count their instructions in QEMU, and test that both agree within 0.1 % and that truncation instead of rounding breaks that.
---

## The trade-off

A PID step is a handful of multiplies and adds. How much it costs depends on the core:

- **Cortex-M3 or M0, no FPU**: every `float` operation is a call into the compiler's soft-float library (`__aeabi_fmul`, `__aeabi_fadd`, ...), tens of instructions each;
- **Cortex-M4F/M7F**: single-precision `float` is native: `vmul.f32`, `vadd.f32` and `vfma.f32` take about one cycle, but `double` is still emulated, so a stray `1.0` instead of `1.0f` costs a lot;
- **Q15 fixed point** (Phase 08) is integer multiplies and shifts everywhere, and very fast, but you manage the scaling, rounding and saturation yourself.

## The Q15 PID step

With error $e$, gains below 1 stored as Q15 integers $K = \text{round}(k \cdot 2^{15})$, and the integrator $I$ kept in a 32-bit integer:

$$I \leftarrow \operatorname{sat}\!\left(I + \frac{K_i e + 2^{14}}{2^{15}}\right), \quad u = \operatorname{sat}\!\left(\frac{K_p e + 2^{14}}{2^{15}} + I + \frac{K_d (e - e_{\text{prev}}) + 2^{14}}{2^{15}}\right).$$

Each product of two Q15 numbers is Q30 in 32 bits; adding $2^{14}$ before the shift by 15 **rounds** to nearest. A plain `>> 15` floors instead, which is a bias of −0.5 LSB on average **every step**, and the integrator accumulates it: after 1000 steps that's about −500 LSB, 1.5 % of full scale. Saturation (and integrator clamping, which is anti-windup) keeps the result inside $[-1, 1)$.

:::figure widget=cyclebars caption="Instructions per PID step for float and Q15 on a Cortex-M3 (soft-float) and a Cortex-M4F (hardware FPU), as measured in QEMU. Toggle truncation to see the Q15 error grow."
:::end

## What we measure

As in lesson 01, QEMU with `-icount shift=0` counts **instructions**, not cycles: it doesn't model the FPU's or the multiplier's timing, flash wait states or the soft-float library's branches. Instruction counts still show the big effect, the soft-float calls, and on hardware you confirm the cycles with DWT_CYCCNT. We run the same `pid.c` on QEMU's MPS2-AN385 (Cortex-M3) and MPS2-AN386 (Cortex-M4 with FPU). Before any FPU instruction the firmware must enable the coprocessor by setting CP10 and CP11 to full access in `CPACR` (0xE000ED88), or the first `vmov` faults.

## Worked example

Gains $k_p = 0.6$, $k_i = 0.05$, $k_d = 0.2$.

1. $K_p = \text{round}(0.6 \cdot 32768) = 19\,661$, $K_i = 1638$, $K_d = 6554$.
2. $e = 0.25$ is 8192 in Q15. $K_p e = 161\,062\,912$; $(161\,062\,912 + 16384) \gg 15 = 4915$, i.e. 0.15 (exactly $0.6 \times 0.25$ would be 4915.2).
3. In QEMU the run measured about 37 instructions per Q15 step on both cores, about 41 per float step on the M4F, and about 547 per float step on the M3, where the time goes into soft-float calls (and the float loop also converts the integer error to float).
4. At 1 instruction per cycle and 72 MHz, 547 instructions is 7.6 µs per step, still fine for a 1 kHz loop; at 20 kHz (a current loop) it uses 15 % of the CPU.

## Code it from scratch

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

:::code file=pid.c target=arm
```c
#include <stdint.h>
void rt_puts(const char *s); void rt_putu(uint32_t v);
#define SYST_CSR (*(volatile uint32_t *)0xE000E010)
#define SYST_RVR (*(volatile uint32_t *)0xE000E014)
#define SYST_CVR (*(volatile uint32_t *)0xE000E018)
#define CPACR    (*(volatile uint32_t *)0xE000ED88)
#define N 1000
#ifdef TRUNCATE
#define RND 0                                /* plain >> 15 floors: a bias of -0.5 LSB per step */
#else
#define RND (1 << 14)                        /* add half an LSB first: round to nearest */
#endif

/* float PID */
typedef struct { float kp, ki, kd, i, prev, lo, hi; } pid_f;
__attribute__((noinline)) static float pid_f_step(pid_f *c, float e) {
  c->i += c->ki * e;
  if (c->i > c->hi) c->i = c->hi; else if (c->i < c->lo) c->i = c->lo;
  float u = c->kp * e + c->i + c->kd * (e - c->prev);
  c->prev = e;
  return u > c->hi ? c->hi : u < c->lo ? c->lo : u;
}
/* Q15 PID: gains Q15 (<1), integrator Q15 in int32, output saturated to Q15 */
typedef struct { int16_t kp, ki, kd; int32_t i; int16_t prev; } pid_q;
static inline int16_t sat16(int32_t v) { return v > 32767 ? 32767 : v < -32768 ? -32768 : (int16_t)v; }
__attribute__((noinline)) static int16_t pid_q_step(pid_q *c, int16_t e) {
  c->i += ((int32_t)c->ki * e + RND) >> 15;                  /* round, don't truncate */
  if (c->i > 32767) c->i = 32767; else if (c->i < -32768) c->i = -32768;
  int32_t u = (((int32_t)c->kp * e + RND) >> 15) + c->i + (((int32_t)c->kd * (e - c->prev) + RND) >> 15);
  c->prev = e;
  return sat16(u);
}
static int16_t err_q[N];
static uint32_t ticks(void) { return SYST_CVR; }
__attribute__((noinline)) static int run(void) {
  uint32_t s = 1;                                    /* a reproducible pseudo-random error sequence in [-0.25, 0.25) */
  for (int k = 0; k < N; k++) { s = s * 1664525u + 1013904223u; err_q[k] = (int16_t)(((int32_t)(s >> 16) - 32768) / 4); }
  SYST_RVR = 0xFFFFFF; SYST_CVR = 0; SYST_CSR = 5;
  pid_f cf = {0.6f, 0.05f, 0.2f, 0, 0, -1.0f, 32767.0f / 32768.0f};
  pid_q cq = {19661, 1638, 6554, 0, 0};
  static float uf[N]; static int16_t uq[N];
  uint32_t t0 = ticks();
  for (int k = 0; k < N; k++) uf[k] = pid_f_step(&cf, err_q[k] / 32768.0f);   /* includes int -> float */
  uint32_t t1 = ticks();
  for (int k = 0; k < N; k++) uq[k] = pid_q_step(&cq, err_q[k]);
  uint32_t t2 = ticks();
  float worst = 0;
  for (int k = 0; k < N; k++) { float d = uf[k] - uq[k] / 32768.0f; if (d < 0) d = -d; if (d > worst) worst = d; }
  rt_puts("float_ticks "); rt_putu((t0 - t1) & 0xFFFFFF); rt_puts(" q15_ticks "); rt_putu((t1 - t2) & 0xFFFFFF);
  rt_puts(" worst_ppm "); rt_putu((uint32_t)(worst * 1e6f)); rt_puts("\n");
  return 0;
}

int main(void) {
#ifdef HARD_FPU
  CPACR |= 0xFu << 20;                       /* enable CP10/CP11 before any FPU instruction */
  __asm__ volatile("dsb\n\tisb" ::: "memory");
#endif
  return run();
}
```
:::end

:::code file=run.py
```python
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
```
:::end

## Exercises

:::exercise
On an M4F, `u = 0.5 * e + i;` with `float e, i` is suddenly 20 times slower than expected. Why?
:::solution
`0.5` is a `double` constant, so `e` is promoted to double, the multiply and add run in the soft-float *double* library, and the result is converted back. Write `0.5f`, and compile with `-Wdouble-promotion` to catch these.
:::end

:::exercise
Why does the test compare against the float controller using the *same quantised gains* rather than the exact 0.6, 0.05 and 0.2?
:::solution
It does here only approximately: the float version uses the exact decimal gains, so a tiny part of the 0.03 % difference is gain quantisation (19 661/32 768 = 0.600006). To isolate arithmetic error, as in Phase 08's biquad, feed both versions the identical quantised coefficients. Either way the difference stays far inside 0.1 %.
:::end

## Quiz

:::quiz
- type: num
  q: Q15 representation of a gain of 0.05?
  answer: 1638
  tol: 0.001
  unit: ""
  py: "round(0.05*32768)"
  explain: round(k·2¹⁵).
- type: num
  q: Bias in LSB accumulated by truncation over 1000 integrator steps (about −0.5 LSB each)?
  answer: -500
  tol: 0.001
  unit: LSB
  py: "-0.5*1000"
  explain: Floors always round down.
- type: num
  q: That bias as a percentage of Q15 full scale (32768)?
  answer: -1.526
  tol: 0.002
  unit: "%"
  py: "-500/32768*100"
  explain: Enough to fail a 0.1 % test.
- type: num
  q: 547 instructions per step at 72 MHz and 1 instruction per cycle, as CPU load in percent at 20 kHz?
  answer: 15.19
  tol: 0.002
  unit: "%"
  py: "547/72e6*20e3*100"
  explain: Time per step times rate.
- type: mc
  q: What must firmware do before the first FPU instruction on a Cortex-M4F?
  options:
    - nothing, the FPU is on at reset
    - enable CP10 and CP11 in CPACR
    - set the PLL
    - disable interrupts
  answer: 1
  explain: The FPU is disabled at reset; an FPU instruction would fault.
- type: mc
  q: QEMU's -icount measurement of this benchmark counts…
  options:
    - exact cycles including FPU latency
    - instructions executed
    - cache misses
    - flash wait states
  answer: 1
  explain: Confirm cycles on hardware with DWT_CYCCNT.
:::end

:::verify
assert round(0.6 * 32768) == 19661 and round(0.2 * 32768) == 6554
assert (19661 * 8192 + 16384) >> 15 == 4915
assert abs(547 / 72e6 * 20e3 * 100 - 15.19) < 0.01
:::end
