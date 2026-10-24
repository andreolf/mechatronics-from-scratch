#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* receiver: a state machine run once per sample (16 samples per bit) */
typedef enum { RX_IDLE, RX_START, RX_DATA, RX_STOP, RX_WAIT_IDLE } rx_state_t;
typedef struct {
  rx_state_t st; int cnt, bit, votes; uint8_t shift;
  int majority;               /* 1: vote samples 7,8,9; 0: single sample at 8 */
  int framing_errors, false_starts;
} uart_rx_t;

/* returns a received byte (0..255) or -1 */
static int rx_sample(uart_rx_t *r, int s) {
  switch (r->st) {
  case RX_IDLE:
    if (!s) { r->st = RX_START; r->cnt = 0; r->votes = 0; }
    return -1;
  case RX_START:
    r->cnt++;
    if (r->cnt == 1) r->bit = s;
    if (r->cnt == 2 && r->bit && s) { r->false_starts++; r->st = RX_IDLE; return -1; }  /* one low sample then high: a spike */
    if (r->cnt >= 7 && r->cnt <= 9) r->votes += s;
    if (r->cnt == 9) {
      int high = r->majority ? (r->votes >= 2) : s;
      if (high) { r->false_starts++; r->st = RX_IDLE; }                   /* a glitch, not a start bit */
      else { r->st = RX_DATA; r->bit = 0; r->shift = 0; r->cnt = 9 - 16; r->votes = 0; }
    }
    return -1;
  case RX_DATA:
  case RX_STOP:
    r->cnt++;
    if (r->cnt >= 7 && r->cnt <= 9) r->votes += r->majority ? s : (r->cnt == 8 ? 3 * s : 0);
    if (r->cnt == 9) {
      int b = r->votes >= 2;
      r->cnt = 9 - 16; r->votes = 0;
      if (r->st == RX_DATA) {
        r->shift |= (uint8_t)(b << r->bit);
        if (++r->bit == 8) r->st = RX_STOP;
      } else {
        if (b) { r->st = RX_IDLE; return r->shift; }
        r->framing_errors++; r->st = RX_WAIT_IDLE;
      }
    }
    return -1;
  case RX_WAIT_IDLE:
    if (s) r->st = RX_IDLE;
    return -1;
  }
  return -1;
}

/* a noisy line: frames sent with a clock error, random idle gaps, isolated one-sample spikes */
static uint32_t rng = 12345;
static uint32_t rnd(void) { rng = rng * 1103515245u + 12345u; return (rng >> 8) & 0xFFFFFF; }

#define NBYTES 2000
static int8_t line[NBYTES * 200];
static uint8_t sent[NBYTES];

static int make_line(double err, int spike_every) {
  int n = 0;
  for (int i = 0; i < NBYTES; i++) {
    int gap = (int)(rnd() % 24);
    for (int g = 0; g < gap; g++) line[n++] = 1;
    uint8_t b = (uint8_t)rnd(); sent[i] = b;
    int bits[10]; bits[0] = 0; for (int k = 0; k < 8; k++) bits[k + 1] = (b >> k) & 1; bits[9] = 1;
    double bitlen = 16.0 * (1.0 + err), phase = (rnd() % 1000) / 1000.0;   /* edge falls between samples */
    int len = (int)(10 * bitlen - phase);
    for (int j = 0; j < len; j++) { int k = (int)((j + phase) / bitlen); line[n++] = (int8_t)bits[k > 9 ? 9 : k]; }
  }
  for (int g = 0; g < 40; g++) line[n++] = 1;
  if (spike_every)
    for (int j = 4; j < n - 4; j += 4 + (int)(rnd() % (unsigned)spike_every)) line[j] ^= 1;   /* spikes at least 4 apart */
  return n;
}

static int run(double err, int spike_every, int majority, uart_rx_t *out) {
  int n = make_line(err, spike_every), got = 0, ok = 0;
  uart_rx_t r; memset(&r, 0, sizeof r); r.majority = majority;
  for (int j = 0; j < n; j++) {
    int b = rx_sample(&r, line[j]);
    if (b >= 0) { if (got < NBYTES && b == sent[got]) ok++; got++; }
  }
  *out = r;
  return (got == NBYTES && ok == NBYTES) ? 1 : 0;
}
#define CHECK(c) do { if (!(c)) { printf("FAIL line %d: %s\n", __LINE__, #c); exit(1); } } while (0)

int main(void) {
  uart_rx_t r;
  const double errs[5] = {-0.03, -0.015, 0.0, 0.015, 0.03};
  for (int e = 0; e < 5; e++) {
    CHECK(run(errs[e], 0, 1, &r));
    CHECK(run(errs[e], 60, 1, &r));                     /* a spike every ~32 samples on average */
    printf("baud error %+5.1f %%, spikes on: %d bytes ok, %d false starts rejected\n", errs[e] * 100, NBYTES, r.false_starts);
  }
  int single_ok = run(0.0, 60, 0, &r);
  printf("single sample per bit with spikes: %s (%d framing errors)\n", single_ok ? "ok" : "corrupted", r.framing_errors);
  CHECK(!single_ok);
  int far_ok = run(0.065, 0, 1, &r);
  printf("baud error +6.5 %%: %s (%d framing errors)\n", far_ok ? "ok" : "fails", r.framing_errors);
  CHECK(!far_ok);
  printf("PASS\n");
  return 0;
}
