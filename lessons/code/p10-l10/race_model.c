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
