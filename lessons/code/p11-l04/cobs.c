#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* encode n bytes; returns the encoded length (no delimiter). out needs n + n/254 + 1 bytes. */
static size_t cobs_encode(const uint8_t *in, size_t n, uint8_t *out) {
  size_t code_at = 0, o = 1;
  uint8_t code = 1;
  for (size_t i = 0; i < n; i++) {
    if (in[i] == 0) {
      out[code_at] = code; code_at = o++; code = 1;
    } else {
      out[o++] = in[i];
      if (++code == 0xFF) { out[code_at] = code; code_at = o++; code = 1; }
    }
  }
  out[code_at] = code;
  return o;
}

/* decode; returns the decoded length or -1 on a malformed frame */
static long cobs_decode(const uint8_t *in, size_t n, uint8_t *out) {
  size_t i = 0, o = 0;
  while (i < n) {
    uint8_t code = in[i++];
    if (code == 0) return -1;                      /* zeros never appear inside a frame */
    for (uint8_t k = 1; k < code; k++) {
      if (i >= n || in[i] == 0) return -1;
      out[o++] = in[i++];
    }
    if (code != 0xFF && i < n) out[o++] = 0;
  }
  return (long)o;
}

/* a streaming receiver: collects bytes until a 00, then decodes */
typedef struct { uint8_t buf[2048]; size_t n; int good, bad; uint8_t last[2048]; long last_len; } rx_t;
static void rx_byte(rx_t *r, uint8_t b) {
  if (b != 0) { if (r->n < sizeof r->buf) r->buf[r->n++] = b; return; }
  if (r->n) {
    long len = cobs_decode(r->buf, r->n, r->last);
    /* the last two payload bytes are a checksum: sum of the rest, mod 65536 */
    int ok = len >= 2;
    if (ok) { unsigned s = 0; for (long i = 0; i < len - 2; i++) s += r->last[i]; ok = (s & 0xFFFF) == (unsigned)(r->last[len - 2] << 8 | r->last[len - 1]); }
    if (ok) { r->good++; r->last_len = len - 2; } else r->bad++;
  }
  r->n = 0;
}
#define CHECK(c) do { if (!(c)) { printf("FAIL line %d: %s\n", __LINE__, #c); exit(1); } } while (0)

static uint32_t rng = 99;
static uint32_t rnd(void) { rng ^= rng << 13; rng ^= rng >> 17; rng ^= rng << 5; return rng; }

static void roundtrip(const uint8_t *p, size_t n) {
  static uint8_t enc[4096], dec[4096];
  size_t m = cobs_encode(p, n, enc);
  CHECK(m <= n + n / 254 + 1);
  for (size_t i = 0; i < m; i++) CHECK(enc[i] != 0);
  long d = cobs_decode(enc, m, dec);
  CHECK(d == (long)n && memcmp(p, dec, n) == 0);
}

int main(void) {
  static uint8_t p[2000];
  /* the worked example */
  const uint8_t ex[8] = {0x45, 0, 0, 0x2C, 0x4C, 0x79, 0, 0x05};
  const uint8_t want[9] = {0x02, 0x45, 0x01, 0x04, 0x2C, 0x4C, 0x79, 0x02, 0x05};
  uint8_t enc[16];
  CHECK(cobs_encode(ex, 8, enc) == 9 && memcmp(enc, want, 9) == 0);
  const uint8_t z = 0; CHECK(cobs_encode(&z, 1, enc) == 2 && enc[0] == 1 && enc[1] == 1);
  /* awkward lengths: around 254, all zeros, no zeros */
  const size_t lens[] = {0, 1, 253, 254, 255, 256, 507, 508, 509, 1000, 1999};
  for (size_t li = 0; li < sizeof lens / sizeof lens[0]; li++) {
    size_t n = lens[li];
    memset(p, 0, n); roundtrip(p, n);
    for (size_t i = 0; i < n; i++) p[i] = (uint8_t)(1 + i % 255);
    roundtrip(p, n);
    static uint8_t e2[4096];
    CHECK(cobs_encode(p, n, e2) == n + n / 254 + 1 || n == 0);      /* worst case is exactly reached */
  }
  /* random payloads, from mostly-zero to no zeros */
  for (int t = 0; t < 20000; t++) {
    size_t n = rnd() % 700;
    unsigned zero_pct = rnd() % 101;
    for (size_t i = 0; i < n; i++) p[i] = (rnd() % 100 < zero_pct) ? 0 : (uint8_t)(1 + rnd() % 255);
    roundtrip(p, n);
  }
  printf("round-trip: worked example, awkward lengths and 20000 random payloads ok\n");
  /* a stream of 100 frames with one byte corrupted in frame 40 and one dropped in frame 70 */
  rx_t r; memset(&r, 0, sizeof r);
  for (int f = 0; f < 100; f++) {
    size_t n = 1 + rnd() % 60; unsigned s = 0;
    for (size_t i = 0; i < n; i++) { p[i] = (uint8_t)rnd(); s += p[i]; }
    p[n] = (uint8_t)(s >> 8 & 0xFF); p[n + 1] = (uint8_t)(s & 0xFF);
    static uint8_t e[256]; size_t m = cobs_encode(p, n + 2, e);
    if (f == 40) e[m / 2] ^= 0x10;
    for (size_t i = 0; i < m; i++) { if (f == 70 && i == 1) continue; rx_byte(&r, e[i]); }
    rx_byte(&r, 0);
  }
  printf("stream: %d frames good, %d rejected, receiver back in step after each\n", r.good, r.bad);
  CHECK(r.good == 98 && r.bad == 2);
  printf("PASS\n");
  return 0;
}
