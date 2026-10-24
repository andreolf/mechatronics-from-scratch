#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <math.h>

/* a logic-analyser trace: the line level changes at these times (ns); idle high before the first edge */
typedef struct { int64_t t[64]; int lvl[64]; int n; } trace_t;
static void emit(trace_t *tr, int64_t t, int level) {
  if (tr->n && tr->lvl[tr->n - 1] == level) return;
  if (!tr->n && level == 1) return;
  tr->t[tr->n] = t; tr->lvl[tr->n] = level; tr->n++;
}
static int level_at(const trace_t *tr, int64_t t) { int v = 1; for (int i = 0; i < tr->n && tr->t[i] <= t; i++) v = tr->lvl[i]; return v; }

typedef enum { PAR_NONE, PAR_EVEN, PAR_ODD } parity_t;

/* bit-banged transmitter: one GPIO write per bit, edges scheduled on a 1 us timer tick.
   exact = 1 keeps a running ideal time and rounds each edge; exact = 0 rounds the bit period once. */
static void uart_tx(trace_t *tr, uint8_t byte, double baud, parity_t par, int exact, double clock_err) {
  int bits[11], nb = 0, ones = 0;
  bits[nb++] = 0;                                           /* start */
  for (int i = 0; i < 8; i++) { int b = (byte >> i) & 1; bits[nb++] = b; ones += b; }   /* LSB first */
  if (par != PAR_NONE) bits[nb++] = (par == PAR_EVEN) ? (ones & 1) : !(ones & 1);
  bits[nb++] = 1;                                           /* stop */
  double bit_us = 1e6 / baud * (1 + clock_err);
  for (int i = 0; i < nb; i++) {
    double ideal = i * bit_us;
    int64_t tick = exact ? (int64_t)llround(ideal) : (int64_t)i * (int64_t)llround(bit_us);
    emit(tr, tick * 1000, bits[i]);                         /* 1 us = 1000 ns */
  }
}

/* an ideal receiver, as a logic analyser decodes: find the falling edge, sample each bit in its middle */
static int uart_decode(const trace_t *tr, double baud, parity_t par, uint8_t *out) {
  if (!tr->n || tr->lvl[0] != 0) return -1;
  double t0 = tr->t[0], bit_ns = 1e9 / baud;
  uint8_t v = 0; int ones = 0;
  for (int i = 0; i < 8; i++) { int b = level_at(tr, (int64_t)(t0 + (1.5 + i) * bit_ns)); v |= (uint8_t)(b << i); ones += b; }
  int k = 9;
  if (par != PAR_NONE) { int p = level_at(tr, (int64_t)(t0 + 9.5 * bit_ns)); if (((ones + p) & 1) != (par == PAR_ODD)) return -2; k = 10; }
  if (level_at(tr, (int64_t)(t0 + (k + 0.5) * bit_ns)) != 1) return -3;    /* framing error */
  *out = v; return 0;
}
#define CHECK(c) do { if (!(c)) { printf("FAIL line %d: %s\n", __LINE__, #c); exit(1); } } while (0)

int main(void) {
  const double baud = 115200;
  /* every byte value, 8N1, 8E1 and 8O1 */
  for (int par = PAR_NONE; par <= PAR_ODD; par++)
    for (int b = 0; b < 256; b++) {
      trace_t tr = {{0}, {0}, 0}; uint8_t got;
      uart_tx(&tr, (uint8_t)b, baud, (parity_t)par, 1, 0);
      CHECK(uart_decode(&tr, baud, (parity_t)par, &got) == 0 && got == b);
    }
  /* the worked example: 'K' as 8E1 */
  trace_t k = {{0}, {0}, 0}; uart_tx(&k, 0x4B, baud, PAR_EVEN, 1, 0);
  const int expect[11] = {0, 1, 1, 0, 1, 0, 0, 1, 0, 0, 1};
  for (int i = 0; i < 11; i++) CHECK(level_at(&k, (int64_t)((i + 0.5) * 1e9 / baud)) == expect[i]);
  /* fractional timing keeps every edge within half a tick of ideal; naive rounding drifts */
  double worst = 0;
  for (int i = 0; i <= 10; i++) { double ideal = i * 1e6 / baud, got = (double)llround(ideal); if (fabs(got - ideal) > worst) worst = fabs(got - ideal); }
  CHECK(worst <= 0.5);
  printf("8N1/8E1/8O1: all 256 bytes decode at 115200 baud; worst edge error %.2f us with fractional timing\n", worst);
  /* clock error: the decoder tolerates a few percent, then fails */
  int ok_at[2] = {0, 0};
  const double errs[2] = {0.03, 0.065};
  for (int e = 0; e < 2; e++)
    for (int b = 0; b < 256; b++) { trace_t tr = {{0}, {0}, 0}; uint8_t got; uart_tx(&tr, (uint8_t)b, baud, PAR_NONE, 1, errs[e]); ok_at[e] += uart_decode(&tr, baud, PAR_NONE, &got) == 0 && got == b; }
  printf("transmitter 3.0 %% slow: %d/256 bytes ok; 6.5 %% slow: %d/256 ok\n", ok_at[0], ok_at[1]);
  CHECK(ok_at[0] == 256 && ok_at[1] < 256);
  printf("PASS\n");
  return 0;
}
