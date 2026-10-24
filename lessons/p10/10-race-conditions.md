---
id: p10-l10
minutes: 40
summary: An interrupt can land between any two instructions of the main loop, so any shared variable that takes more than one access to read or update can be torn. You derive the two classic hazards, a torn multi-word read and a lost read-modify-write, reproduce both deterministically by firing a modelled interrupt at every possible instruction boundary, fix them with a re-read loop, a critical section and an atomic operation, and stress-test the fixes over millions of placements.
---

## Where an interrupt can land

The main loop and an ISR share memory, and the ISR can run between *any* two instructions of `main`. A C statement is usually several instructions. On a 32-bit Cortex-M:

- a single aligned 8-, 16- or 32-bit load or store is **atomic**: the ISR sees the old value or the new one, never a mix;
- anything bigger or compound is **not**: a 64-bit variable takes two loads, and `x++` or `flags |= bit` is a load, a modify and a store.

That gives two hazards, and both are bugs that pass every bench test and then fail once a week in the field, because the window is a few nanoseconds wide.

## Hazard 1: a torn read

A 64-bit millisecond counter `ticks` is stored as two words `lo` and `hi`; the 1 kHz ISR does `if (++lo == 0) ++hi;`. Main reads `lo` then `hi`. If the counter is at `hi:lo` = 5:0xFFFFFFFF and the ISR runs **between the two loads**, main gets lo = 0xFFFFFFFF (old) and hi = 6 (new): a time $2^{32}$ ms in the future, about 50 days. The fix needs no interrupt masking: read `hi`, then `lo`, then `hi` again, and retry if `hi` changed:

```c
do { h1 = hi; l = lo; h2 = hi; } while (h1 != h2);
```

If an ISR changed `hi` during the read, the two copies differ and we go round again. If they agree, `l` was read while `hi` held that value.

## Hazard 2: a lost update

Main does `flags |= MAIN_BIT` and the ISR does `flags |= ISR_BIT`. Main's statement is `ldr; orr; str`. If the ISR runs after main's load, main stores its stale copy plus its own bit and **erases the ISR's bit**. Three fixes:

1. a **critical section**: disable interrupts around the RMW (`__disable_irq(); flags |= b; __enable_irq();`, or save and restore PRIMASK if you might already be inside one). Short and simple, but it adds latency (lesson 09);
2. an **atomic RMW** with exclusive access: Cortex-M3 and up have LDREX/STREX, which the compiler emits for C11 atomics or GCC's `__atomic_fetch_or`. The store fails and retries if an exception happened in between;
3. a design without sharing: give each writer its own variable, or hardware that does the modify for you (BSRR, lesson 05).

:::figure widget=racetime caption="Main's instructions on a timeline with the ISR firing between two of them. Slide the interrupt point: when it lands inside the read window or the RMW window, the result is wrong. Switch on the fix to see the retry or the masked window."
:::end

## Testing a race deterministically

Random timing tests miss races. A model finds them: write the main-side code as steps, with a hook between every pair of accesses, and fire the ISR at **every** hook in turn. If the result is wrong for any placement, the code is broken; if it's right for all, and the ISR can't run twice inside the window, the code is correct for one interrupt. Then run a random stress test that fires the ISR at random hooks, sometimes several times in a row, over millions of operations.

## Worked example

Counter at 5:0xFFFFFFFF, ISR due.

1. Naive read, ISR before both loads: 6:0x00000000, correct.
2. ISR between the loads: lo = 0xFFFFFFFF, hi = 6, reads 6:0xFFFFFFFF, wrong by $2^{32}$.
3. ISR after both loads: 5:0xFFFFFFFF, correct (just old).
4. Re-read loop, ISR after the first `hi`: h1 = 5, l = 0, h2 = 6, retry, then 6:0 correct.
5. How rare? The window is two loads, about 4 cycles at 168 MHz = 24 ns. Main reads 1000 times a second, so it spends a fraction $1000 \times 24\ \text{ns} = 2.4\times10^{-5}$ of its time inside the window. For the 64-bit counter the dangerous ISR (the one that wraps `lo`) comes once per 49.7 days, so this device fails about once per 5700 years. The *same code* reading a 16-bit timer count plus a software overflow counter, which wraps every 65.5 ms, fails $15.3 \times 2.4\times10^{-5}$ times a second: about once every 45 minutes. Rare is not never.

## Code it from scratch

:::code file=race_model.c
```c
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

/* ---- shared state and the ISR ---- */
static volatile uint32_t lo, hi, flags;
#define MAIN_BIT 0x1u
#define ISR_BIT  0x2u
static void tick_isr(void) { if (++lo == 0) ++hi; flags |= ISR_BIT; }

/* ---- the interrupt model: an ISR may run at any hook between two accesses of main ---- */
static int fire_at = -1, hook_no, irq_masked, pending, isr_runs, random_mode;
static uint32_t rng = 2463534242u;
static void request(void) { if (irq_masked) pending = 1; else { tick_isr(); isr_runs++; } }   /* masked: stays pending */
static void hook(void) {
  if (random_mode) { while ((rng ^= rng << 13, rng ^= rng >> 17, rng ^= rng << 5) % 7 == 0) request(); }
  else if (hook_no == fire_at) request();
  hook_no++;
}
static void irq_disable(void) { irq_masked = 1; }
static void irq_enable(void) {                           /* a pending ISR runs as soon as it's unmasked */
  irq_masked = 0;
  if (pending) { pending = 0; tick_isr(); isr_runs++; }
  hook();
}

/* ---- main-side code, written as individual accesses ---- */
static uint64_t read_naive(void) {
  hook(); uint32_t l = lo; hook(); uint32_t h = hi; hook();
  return ((uint64_t)h << 32) | l;
}
static uint64_t read_fixed(void) {
  uint32_t h1, l, h2;
  do { hook(); h1 = hi; hook(); l = lo; hook(); h2 = hi; hook(); } while (h1 != h2);
  return ((uint64_t)h1 << 32) | l;
}
static void set_naive(void) { hook(); uint32_t v = flags; hook(); v |= MAIN_BIT; hook(); flags = v; hook(); }
static void set_critical(void) { irq_disable(); hook(); uint32_t v = flags; hook(); flags = v | MAIN_BIT; hook(); irq_enable(); }
static void set_atomic(void) { hook(); __atomic_fetch_or(&flags, MAIN_BIT, __ATOMIC_SEQ_CST); hook(); }  /* LDREX/STREX on M3 */

static uint64_t now(void) { return ((uint64_t)hi << 32) | lo; }
#define CHECK(c) do { if (!(c)) { printf("FAIL line %d: %s\n", __LINE__, #c); exit(1); } } while (0)

/* run fn once with the ISR at hook k; report whether the result is consistent */
static int read_ok(uint64_t (*fn)(void), int k) {
  lo = 0xFFFFFFFFu; hi = 5; fire_at = k; hook_no = 0;
  uint64_t before = now(), v = fn(), after = now();
  return v >= before && v <= after;                   /* a correct read is some value the counter really held */
}
static int set_ok(void (*fn)(void), int k) {
  flags = 0; fire_at = k; hook_no = 0; isr_runs = 0; fn();
  return (flags & MAIN_BIT) && (isr_runs == 0 || (flags & ISR_BIT));   /* an ISR ran but its bit is gone = lost update */
}

int main(void) {
  int torn = 0, lost = 0;
  for (int k = 0; k < 8; k++) torn += !read_ok(read_naive, k);
  for (int k = 0; k < 8; k++) CHECK(read_ok(read_fixed, k));
  for (int k = 0; k < 8; k++) lost += !set_ok(set_naive, k);
  for (int k = 0; k < 8; k++) { CHECK(set_ok(set_critical, k)); CHECK(set_ok(set_atomic, k)); }
  printf("exhaustive: naive read torn at %d placement(s), naive RMW lost the ISR bit at %d placement(s); fixes clean\n", torn, lost);
  CHECK(torn == 1 && lost == 2);

  /* random stress: ISRs at random hooks, sometimes several in a row; time must never jump or go backwards */
  random_mode = 1; lo = 0xFFFFFF00u; hi = 0;
  uint64_t prev = 0; long bad_naive = 0;
  for (long i = 0; i < 3000000; i++) {
    if ((i & 0xFFFF) == 0) { lo = 0xFFFFFF00u; hi++; prev = now(); }   /* jump ahead to just before another wrap */
    uint64_t v = read_fixed(); CHECK(v >= prev && v - prev < 64); prev = v;
    if (i % 3 == 0) { uint64_t a = now(), w = read_naive(); if (w > now() || w < a) bad_naive++; }
  }
  for (long i = 0; i < 1000000; i++) {
    flags = 0; set_critical(); CHECK(flags & MAIN_BIT); flags = 0; set_atomic(); CHECK(flags & MAIN_BIT);
    flags = 0; tick_isr(); set_critical(); CHECK(flags == (MAIN_BIT | ISR_BIT));
  }
  printf("random stress: 3,000,000 fixed reads monotonic; naive reads gave %ld torn values\nPASS\n", bad_naive);
  CHECK(bad_naive > 0);
  return 0;
}
```
:::end

## Exercises

:::exercise
Is `volatile uint32_t count; ... count++;` in main safe if the ISR only *reads* `count`?
:::solution
Yes. Only main writes it, and the single 32-bit store is atomic, so the ISR sees the old or the new value. The hazard needs two writers (lost update) or a multi-access read of something the other side writes (torn read).
:::end

:::exercise
Your critical section is `__disable_irq(); ...; __enable_irq();` and it's called from inside another critical section. What goes wrong, and what's the fix?
:::solution
The inner `__enable_irq()` re-enables interrupts while the outer section still expects them off. Save and restore PRIMASK instead: `uint32_t m = __get_PRIMASK(); __disable_irq(); ...; __set_PRIMASK(m);`.
:::end

## Quiz

:::quiz
- type: num
  q: How many days until a 32-bit millisecond counter wraps?
  answer: 49.71
  tol: 0.001
  unit: days
  py: "2**32/1000/86400"
  explain: 4 294 967 296 ms.
- type: num
  q: A torn read of hi:lo at the wrap is wrong by how many ms?
  answer: 4294967296
  tol: 0.000001
  unit: ms
  py: "2**32"
  explain: The new hi with the old lo.
- type: num
  q: A 4-cycle window at 168 MHz lasts how many ns?
  answer: 23.81
  tol: 0.001
  unit: ns
  py: "4/168e6*1e9"
  explain: Cycles over the clock.
- type: num
  q: flags |= bit compiles to load, or, store. How many hook positions (between accesses) let an ISR's update be lost?
  answer: 2
  tol: 0.001
  unit: ""
  py: "2"
  explain: After the load and before the store, in either of the two gaps.
- type: mc
  q: Which of these is atomic on a Cortex-M3?
  options:
    - count++ on a uint32_t
    - an aligned 32-bit load
    - a 64-bit load
    - flags |= 4
  answer: 1
  explain: Single aligned word accesses are atomic; compound statements are not.
- type: mc
  q: The hi-lo-hi re-read loop works because…
  options:
    - it disables interrupts
    - if hi did not change across the read, lo was read while hi held that value
    - it uses LDREX
    - volatile makes it atomic
  answer: 1
  explain: A lock-free consistency check.
:::end

:::verify
assert abs(2**32 / 1000 / 86400 - 49.71) < 0.01
assert abs(4 / 168e6 * 1e9 - 23.81) < 0.01
f = 1000 * 24e-9
assert abs(49.71 / f / 365.25 - 5670) < 30   # years
assert abs(1 / (1 / 0.0655 * f) / 60 - 45) < 1.5
:::end
