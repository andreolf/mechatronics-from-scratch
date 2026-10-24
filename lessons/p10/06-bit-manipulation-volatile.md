---
id: p10-l06
minutes: 35
summary: Register code lives on masks and shifts, and one wrong parenthesis or a signed 1 << 31 corrupts a neighbouring field. You derive field insert and extract, write SET_BIT, CLEAR_BIT and field macros with host tests over every position and width, then compile a polling loop for a Cortex-M3 and read the assembly to see exactly what volatile changes.
---

## Masks and shifts

A register field is $w$ bits starting at bit $p$. Everything follows from one mask:

$$m_w = 2^w - 1, \qquad M_{p,w} = m_w \ll p.$$

- **extract**: $\text{get}(r) = (r \gg p) \;\&\; m_w$
- **insert**: $r \leftarrow (r \;\&\; \sim M_{p,w}) \;|\; ((v \;\&\; m_w) \ll p)$
- **set / clear / toggle bit $n$**: $r \;|=\; 1 \ll n$, $\; r \;\&=\; \sim(1 \ll n)$, $\; r \;\hat{}=\; 1 \ll n$

Three bugs show up in nearly every codebase:

1. **Signed shifts.** `1 << 31` shifts a signed `int` into its sign bit, which is undefined behaviour in C. Always use `1u`.
2. **Width 32.** $2^{32} - 1$ via `(1u << 32) - 1` is also undefined (shift ≥ width). Use `0xFFFFFFFFu >> (32 - w)`, valid for $1 \le w \le 32$.
3. **Unmasked values.** Inserting $v$ without `& m_w` lets an oversized value spill into the next field.

Macros must parenthesise every argument, so `FIELD_GET(x | y, 4, 2)` doesn't parse as `x | (y >> 4)`.

:::figure widget=regview caption="A 32-bit register, bit by bit. Pick a position and width, and a value to insert. The mask, the cleared register and the result are shown in binary; an unmasked insert shows the spill into the neighbouring field."
:::end

## What volatile means

`volatile` tells the compiler that every read and write of the object is an observable side effect: it must perform each access, in program order, and it can't keep the value in a register or assume it hasn't changed. A hardware status register changes on its own, so code that polls it **must** read through a `volatile` lvalue:

```c
while (!(USART1->SR & USART_SR_TXE)) {}   /* SR is declared volatile uint32_t */
```

Without `volatile`, the optimiser sees a loop that never writes the variable, concludes the condition can't change, loads it once and spins forever. You'll see this in the assembly below.

What volatile does **not** do: it doesn't make a read-modify-write atomic, it doesn't order accesses to non-volatile variables, and it doesn't add memory barriers between cores or DMA. For sharing data with interrupts you still need the techniques in lesson 10.

## Worked example

Insert the value 5 into a 3-bit field at bit 4 of a register holding 0xFFFF_FF0F.

1. $m_3 = 7$, $M = 7 \ll 4 = 0x70$.
2. Clear: $0xFFFF\,FF0F \;\&\; \sim0x70 = 0xFFFF\,FF0F$ (those bits were already zero).
3. Insert: $(5 \;\&\; 7) \ll 4 = 0x50$, giving $0xFFFF\,FF5F$.
4. Extract back: $(0xFFFF\,FF5F \gg 4) \;\&\; 7 = 5$.
5. Unmasked insert of 13: $13 \ll 4 = 0xD0$ sets bit 7, which belongs to the next field.

## Code it from scratch

The top of `bits_test.c` is the macro header (what you would put in `bits.h`), and the rest tests every position and width against a bit-by-bit reference. `poll.c` is two polling loops for the Cortex-M3, and `check_volatile.py` compiles them with `-O2` and reads the assembly.

:::code file=bits_test.c
```c
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

/* ---- bits.h ---- */
#define BIT(n)                 (1u << (n))
#define SET_BIT(r, n)          ((r) |= BIT(n))
#define CLEAR_BIT(r, n)        ((r) &= ~BIT(n))
#define TOGGLE_BIT(r, n)       ((r) ^= BIT(n))
#define READ_BIT(r, n)         (((r) >> (n)) & 1u)
#define FIELD_MASK_W(w)        (0xFFFFFFFFu >> (32u - (w)))            /* valid for 1 <= w <= 32 */
#define FIELD_MASK(p, w)       (FIELD_MASK_W(w) << (p))
#define FIELD_GET(r, p, w)     (((r) >> (p)) & FIELD_MASK_W(w))
#define FIELD_PREP(p, w, v)    ((((uint32_t)(v)) & FIELD_MASK_W(w)) << (p))
#define FIELD_SET(r, p, w, v)  ((r) = ((r) & ~FIELD_MASK(p, w)) | FIELD_PREP(p, w, v))
/* ---------------- */

static uint32_t rng = 0x12345678u;
static uint32_t next(void) { rng ^= rng << 13; rng ^= rng >> 17; rng ^= rng << 5; return rng; }

/* slow, obviously-correct reference: one bit at a time */
static uint32_t ref_set(uint32_t r, unsigned p, unsigned w, uint32_t v) {
  for (unsigned i = 0; i < w; i++) { uint32_t b = (v >> i) & 1u; r = (r & ~(1u << (p + i))) | (b << (p + i)); }
  return r;
}
#define CHECK(c) do { if (!(c)) { printf("FAIL line %d (p=%u w=%u)\n", __LINE__, p, w); exit(1); } } while (0)

int main(void) {
  unsigned cases = 0, p = 0, w = 0;
  for (p = 0; p < 32; p++)
    for (w = 1; w <= 32 - p; w++)
      for (int k = 0; k < 50; k++) {
        uint32_t r = next(), v = next(), r0 = r;
        FIELD_SET(r, p, w, v);
        CHECK(r == ref_set(r0, p, w, v));                          /* matches the reference */
        CHECK(FIELD_GET(r, p, w) == (v & FIELD_MASK_W(w)));        /* reads back */
        CHECK((r & ~FIELD_MASK(p, w)) == (r0 & ~FIELD_MASK(p, w))); /* neighbours untouched */
        cases++;
      }
  for (p = 0; p < 32; p++) {
    uint32_t r = 0; SET_BIT(r, p); CHECK(r == (1u << p) && READ_BIT(r, p) == 1);
    TOGGLE_BIT(r, p); CHECK(r == 0); r = 0xFFFFFFFFu; CLEAR_BIT(r, p); CHECK(r == ~(1u << p));
  }
  p = 4; w = 3;
  uint32_t r = 0xFFFFFF0Fu; FIELD_SET(r, 4, 3, 5); CHECK(r == 0xFFFFFF5Fu && FIELD_GET(r, 4, 3) == 5);
  CHECK(FIELD_MASK_W(32) == 0xFFFFFFFFu && FIELD_MASK(31, 1) == 0x80000000u);
  uint32_t a = 0x0F, b = 0x30; CHECK(FIELD_GET(a | b, 4, 2) == 3);   /* argument parenthesised */
  printf("%u field cases and 32 single-bit cases passed\nPASS\n", cases);
  return 0;
}
```
:::end

:::code file=poll.c target=arm
```c
#include <stdint.h>
uint32_t status_plain;              /* imagine an ISR or the hardware sets bit 0 */
volatile uint32_t status_vol;

void wait_plain(void)    { while (!(status_plain & 1u)) {} }
void wait_volatile(void) { while (!(status_vol & 1u)) {} }
```
:::end

:::code file=check_volatile.py
```python
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
```
:::end

## Exercises

:::exercise
Why is `#define FIELD_GET(r, p, w) r >> p & FIELD_MASK_W(w)` wrong even though it often works?
:::solution
Without parentheses, `FIELD_GET(x | y, 4, 2)` expands to `x | y >> 4 & 3`, which C parses as `x | ((y >> 4) & 3)`, because `>>` and `&` bind tighter than `|`. Every macro argument, and the whole expansion, needs parentheses.
:::end

:::exercise
A flag `done` is set in an ISR and polled in `main`. You add `volatile` and it works. A colleague says volatile makes it thread-safe. Is that right?
:::solution
Only for this case: a single aligned 32-bit store by the ISR and loads by main are each atomic on Cortex-M, and volatile forces main to re-read. But `count++` on a volatile is still load, add, store, and an interrupt between them loses an update. Volatile gives visibility, not atomicity (lesson 10).
:::end

## Quiz

:::quiz
- type: num
  q: Mask (decimal) of a 3-bit field at bit 4?
  answer: 112
  tol: 0.001
  unit: ""
  py: "7 << 4"
  explain: 0x70.
- type: num
  q: Result (decimal) of inserting 5 into that field of 0xFFFFFF0F?
  answer: 4294967135
  tol: 0.0000001
  unit: ""
  py: "(0xFFFFFF0F & ~0x70 & 0xFFFFFFFF) | (5 << 4)"
  explain: 0xFFFFFF5F.
- type: num
  q: Extract the 4-bit field at bit 8 of 0x00003A00 (decimal)?
  answer: 10
  tol: 0.001
  unit: ""
  py: "(0x3A00 >> 8) & 0xF"
  explain: 0xA.
- type: num
  q: How many (position, width) pairs are there for fields inside a 32-bit register?
  answer: 528
  tol: 0.001
  unit: ""
  py: "sum(32 - p for p in range(32))"
  explain: The test loops over all 528.
- type: mc
  q: What is wrong with 1 << 31 in C?
  options:
    - nothing
    - it shifts a signed int into the sign bit, which is undefined behaviour
    - it is too slow
    - it equals zero
  answer: 1
  explain: Use 1u << 31.
- type: mc
  q: What does volatile guarantee?
  options:
    - atomic read-modify-write
    - every access is performed, in order, and not cached in a register
    - mutual exclusion with interrupts
    - memory barriers for DMA
  answer: 1
  explain: Visibility, not atomicity.
:::end

:::verify
assert (0xFFFFFF0F & ~0x70) | (5 << 4) == 0xFFFFFF5F
assert ((0xFFFFFF5F >> 4) & 7) == 5
assert (13 << 4) & 0x80
:::end
