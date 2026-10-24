---
id: p11-l04
minutes: 30
summary: A byte stream needs packet boundaries, and COBS gives them by rewriting a packet so it contains no zero bytes, then using a single zero as the delimiter, at a worst-case cost of one byte per 254. You derive the encoding by hand, write the encoder and decoder in C, and test them by round-tripping random payloads of every awkward length and recovering from a corrupted frame mid-stream.
---

## The framing problem

A UART delivers bytes, not packets. If you send `[length][payload][crc]` and one byte is lost, the receiver reads the wrong length and stays out of step forever. You need a byte value that **only** ever means "end of packet", so the receiver can resynchronise at the next one.

SLIP and HDLC reserve a flag byte and **escape** it inside the payload, which doubles the size in the worst case (a payload full of flag bytes). **COBS** (consistent overhead byte stuffing, Cheshire and Baker, 1999) removes every zero from the payload with a bounded overhead, and then a zero is the delimiter.

## How COBS encodes

Split the packet at its zeros. Each piece becomes a **code byte** followed by up to 254 non-zero bytes, where the code is one more than the number of data bytes and stands for "this many bytes, then a zero":

- `11 22 00 33` becomes `03 11 22 02 33`. The code 03 means "two bytes, then a zero"; the final 02 means "one byte, end of packet" (the implicit zero at the end is dropped).
- A run of 254 non-zero bytes gets the code **FF**, which means "254 bytes and *no* zero", so long runs cost one extra byte per 254.
- `00` alone becomes `01 01`.

Worst-case output is $n + \lfloor n/254 \rfloor + 1$ bytes, plus the trailing 00 delimiter: about 0.4 % overhead, whatever the data. (This simple encoder ends an exact multiple of 254 with an extra 01 code; some implementations drop it, and the decoder accepts both.)

Decoding reverses it: read a code $c$, copy $c - 1$ bytes, then output a zero unless $c$ was FF or this is the end of the packet. A zero **inside** an encoded frame is an error, and is also where the next frame starts.

:::figure widget=cobs caption="COBS step by step: the packet's zeros, the code bytes that replace them (each points to the next zero), and the decoded result. Type bytes to see the pointers move."
:::end

## Worked example

Encode `45 00 00 2C 4C 79 00 05`.

1. Pieces split at zeros: `45` | (empty) | `2C 4C 79` | `05`.
2. Codes: `02 45`, `01`, `04 2C 4C 79`, `02 05`.
3. Encoded: `02 45 01 04 2C 4C 79 02 05`, 9 bytes for 8, then the delimiter `00`.
4. Decode: 02 → copy 45, add 00; 01 → add 00; 04 → copy three, add 00; 02 → copy 05, end. Back to the original.

## Code it from scratch

:::code file=cobs.c
```c
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
```
:::end

## Exercises

:::exercise
Your COBS frames go over a radio that sometimes inserts a spurious 00 byte. What happens, and what limits the damage?
:::solution
The receiver sees the 00 as a delimiter and splits one frame into two fragments. Both fail to decode or fail their checksum and are dropped; the next real delimiter resynchronises the stream, so only that one packet is lost. This is why COBS frames still need a CRC (lesson 03): COBS finds boundaries, it doesn't detect corruption.
:::end

:::exercise
What's the encoded size of a 1000-byte packet with no zeros, and with all zeros?
:::solution
No zeros: $1000 + \lfloor 1000/254 \rfloor + 1 = 1004$ bytes (three FF codes plus one final code), 1005 with the delimiter. All zeros: each zero becomes a code 01, plus a final 01, so 1001 bytes. Overhead never exceeds one byte per 254, whatever the data.
:::end

## Quiz

:::quiz
- type: num
  q: Worst-case encoded length (without the delimiter) of a 508-byte packet?
  answer: 511
  tol: 0
  unit: bytes
  py: "508 + 508//254 + 1"
  explain: Two FF blocks of 254, then a final 01 code for the empty last block.
- type: num
  q: Percentage overhead of COBS for long packets in the worst case?
  answer: 0.394
  tol: 0.002
  unit: "%"
  py: "1/254*100"
  explain: One byte per 254.
- type: num
  q: Encoded length of a packet of 300 zeros?
  answer: 301
  tol: 0
  unit: bytes
  py: "300 + 1"
  explain: Each zero becomes code 01, plus a final 01.
- type: num
  q: The code byte for "two data bytes, then a zero"?
  answer: 3
  tol: 0
  py: "2 + 1"
  explain: Code = data bytes + 1.
- type: mc
  q: What does the code byte FF mean?
  options:
    - 254 data bytes and no zero after them
    - end of packet
    - an escaped zero
    - an error
  answer: 0
  explain: Long runs are split every 254 bytes.
- type: mc
  q: Why do COBS frames still need a CRC?
  options:
    - COBS finds packet boundaries but doesn't detect corrupted bytes
    - COBS output contains zeros
    - the UART needs it
    - they don't
  answer: 0
  explain: A flipped bit decodes to a wrong but well-formed packet.
:::end

:::verify
import math
assert 508 + 508 // 254 + 1 == 511
assert 1000 + math.ceil(1000 / 254) == 1004
:::end
