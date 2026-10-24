---
id: p11-l01
minutes: 35
summary: A UART sends each byte as a start bit, eight data bits least significant first, an optional parity bit and a stop bit, with no clock wire, so both ends must agree on the bit rate. You derive the frame, the baud-rate divider and how much rate mismatch a receiver tolerates, write a bit-banged transmitter driven by a 1 µs timer with fractional timing, and test it by decoding its trace like a logic analyser at 115 200 baud.
---

## The frame

A UART (universal asynchronous receiver-transmitter) line idles **high**. Each character is a frame:

1. a **start bit** (low), which tells the receiver "a byte begins here" and lets it align its timing;
2. 5–9 **data bits**, usually 8, **least significant bit first**;
3. an optional **parity bit**: even parity makes the number of 1s in data + parity even, odd makes it odd;
4. one or two **stop bits** (high), which guarantee an idle-to-start falling edge before the next frame.

"8N1" is 8 data bits, no parity, 1 stop: 10 bit times per byte, so 115 200 baud carries 11 520 bytes/s. There's no clock line, which is why it's *asynchronous*: the receiver re-times itself on every start bit's falling edge and then trusts its own clock for the rest of the frame.

## How much clock error is allowed

The receiver samples each bit in the middle. It finds the falling edge of the start bit, waits 1.5 bit times to the middle of bit 0, then one bit time for each next bit. The last sample, the stop bit's middle, is at **9.5 bit times** after the edge for 8N1. If the two clocks differ by a fraction $\varepsilon$, that sample drifts by $9.5\,\varepsilon$ bits, and it must stay within the bit, less than half a bit from the middle:

$$9.5\,|\varepsilon| < 0.5 \quad\Rightarrow\quad |\varepsilon| < 5.3\ \%.$$

That's the total between transmitter and receiver, and edge detection with 16× oversampling eats about 1/16 bit of it, so the usual rule is **under about 2 % on each side**. Parity or 9-bit frames lengthen the frame and shrink the budget.

## The baud-rate divider

A hardware UART divides its clock. An STM32 USART with 16× oversampling uses $\text{USARTDIV} = f_{clk}/(16 \cdot \text{baud})$, stored with 4 fraction bits. At 84 MHz and 115 200 baud, USARTDIV = 45.57, stored as 45 + 9/16 = 45.5625, which gives 115 226 baud, an error of +0.02 %.

A **bit-banged** transmitter toggles a GPIO from a timer. With a 1 µs tick, a bit is 8.68 µs. Rounding every bit to 9 µs is +3.7 % slow, most of the budget. Better: keep the ideal edge times as a running sum and round each one, so each bit is 8 or 9 µs but the error never accumulates beyond half a tick (the same idea as Bresenham's line algorithm).

:::figure widget=uarttrace caption="A UART frame on a logic trace with the receiver's mid-bit sampling points. Change the byte, parity and the transmitter's clock error: past about 5 % the stop-bit sample lands in the wrong bit and the frame fails."
:::end

## Worked example

Send 0x4B ('K') as 8E1 at 115 200 baud.

1. 0x4B = 0100 1011; LSB first the data bits are 1, 1, 0, 1, 0, 0, 1, 0.
2. Four 1s, so even parity is 0.
3. The line: idle 1, start 0, 1 1 0 1 0 0 1 0, parity 0, stop 1. Eleven bit times, 95.5 µs.
4. With a 1 µs tick, the ideal edges are at 0, 8.68, 17.36, 26.04, … µs, rounded to 0, 9, 17, 26, …; no edge is more than 0.5 µs (5.8 % of a bit) from its ideal place, and the error doesn't grow.
5. Rounding every bit to 9 µs instead puts the stop bit's middle at $10.5 \times 9 = 94.5$ µs instead of 91.1 µs: 0.39 bit late, close to failing.

## Code it from scratch

:::code file=uart_tx.c
```c
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
```
:::end

## Exercises

:::exercise
A sensor sends 9600 baud from an RC oscillator rated ±2 %, and your MCU's UART is crystal-accurate. Will it work at 8N1? At 8E2?
:::solution
8N1 tolerates about 5 % total (less the oversampling allowance), so ±2 % is fine. 8E2 has the last stop bit at 11.5 bit times, so the limit is $0.5/11.5 = 4.3$ %, still fine for ±2 %. Two RC-clocked ends at ±2 % each, 4 % in the worst case, would be marginal.
:::end

:::exercise
Why are the data bits sent LSB first, and does it matter?
:::solution
It's the historical convention of serial lines and shift registers, and both ends must agree. A logic analyser or a decoder written MSB-first reads 0x4B as 0xD2. SPI, by contrast, is usually MSB first (lesson 08), which is a frequent source of confusion.
:::end

## Quiz

:::quiz
- type: num
  q: Bytes per second at 115 200 baud, 8N1?
  answer: 11520
  tol: 0.001
  unit: bytes/s
  py: "115200/10"
  explain: Ten bit times per byte.
- type: num
  q: Maximum total clock mismatch in percent for 8N1 (stop-bit middle at 9.5 bits)?
  answer: 5.263
  tol: 0.001
  unit: "%"
  py: "0.5/9.5*100"
  explain: Half a bit over 9.5 bit times.
- type: num
  q: Actual baud rate with USARTDIV = 45.5625 at 84 MHz (16× oversampling)?
  answer: 115226.3
  tol: 0.0001
  unit: baud
  py: "84e6/(16*45.5625)"
  explain: f/(16·USARTDIV).
- type: num
  q: Error in percent of rounding every 115 200-baud bit to 9 µs?
  answer: 3.68
  tol: 0.002
  unit: "%"
  py: "(9 - 1e6/115200)/(1e6/115200)*100"
  explain: Most of the budget gone.
- type: mc
  q: What is the even parity bit for data 0x4B?
  options:
    - "0"
    - "1"
    - it depends on the stop bits
    - parity is not defined for 8 bits
  answer: 0
  explain: Four 1s already, so parity 0 keeps the count even.
- type: mc
  q: The UART line when idle is…
  options:
    - low
    - high
    - floating
    - toggling at the baud rate
  answer: 1
  explain: The start bit is the falling edge out of idle.
:::end

:::verify
assert bin(0x4B).count("1") == 4
assert abs(10.5 * 9 - 10.5 * 1e6 / 115200) / (1e6 / 115200) < 0.40
assert round(84e6 / (16 * 115200) * 16) / 16 == 45.5625
:::end
