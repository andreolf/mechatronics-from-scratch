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
