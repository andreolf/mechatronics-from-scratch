---
id: p11-l02
minutes: 35
summary: A UART receiver samples the line 16 times per bit, waits for a falling edge, checks it in the middle of the start bit to reject glitches, and reads each bit by a majority vote of three samples around its centre. You derive why that tolerates noise spikes and a few percent of clock error, write the receiver as a state machine fed one sample at a time, and test it on a noisy trace with ±3 % baud error.
---

## Oversampling

A receiver doesn't know where bit boundaries are, so it samples much faster than the bit rate, typically **16×**. In each sample period it does a small amount of work: a state machine fed one sample at a time, which is exactly how a timer ISR or the hardware UART itself works.

1. **Idle:** wait for a low sample, a candidate falling edge.
2. **Start:** if the two samples right after the edge are both high, it was a one-sample spike: go back to idle at once, so a real edge a few samples later is still caught on time. Otherwise count to the middle of the start bit and vote; if it's high there, it was a glitch too. This is *false-start detection*.
3. **Data:** every 16 samples, read a bit at its centre.
4. **Stop:** read the stop bit. If it's low, report a **framing error** (wrong baud rate, a break, or noise) and wait for the line to go idle.

## Majority vote

One sample per bit can land on a noise spike. Taking three samples at positions 7, 8 and 9 of 16 and voting turns any single-sample spike into a non-event. Two adjacent bad samples still get through, so the vote handles short impulse noise, not sustained interference.

## How much baud error

The edge is detected up to one sample late, and with a fractional clock error $\varepsilon$ the centre of bit $k$ (stop is $k = 9$ for 8N1) drifts by $16(k + 0.5)\varepsilon$ samples. The three voting samples span positions 7 to 9, so the window stays inside the bit while $152|\varepsilon| + 1 + 1 < 8$, about **4 %**. A **±3 %** error keeps every voting sample in its bit; at 6 % or so the stop-bit samples slide into the next frame's start bit.

:::figure widget=uartrx caption="Sampling points of a 16× oversampling receiver on a noisy trace. The three votes around each bit centre are shown; raise the baud error to watch them drift towards the bit edges, and add spikes to see the vote reject them."
:::end

## Worked example

The transmitter runs 3 % slow, so its bits are 16.48 receiver samples long.

1. The edge is seen at sample 0 (or 1 if it fell just after a sample).
2. The stop bit spans 9 × 16.48 = 148.3 to 164.8 samples after the true edge.
3. The votes at 151, 152 and 153 (plus one sample of detection lag at most) are all inside: margin about 2.7 samples to the left edge.
4. At 6 % slow the stop bit starts at 9 × 16.96 = 152.6, so samples 151 and 152 still sit in the last data bit: if that bit is 0, the vote reads the stop as 0 and flags a framing error.

## Code it from scratch

:::code file=uart_rx.c
```c
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
```
:::end

## Exercises

:::exercise
Why does the receiver wait for the line to go high after a framing error instead of going straight back to idle?
:::solution
A framing error often means the line is held low, a *break* or a disconnected wire. Going straight to idle would treat every low sample as a new start bit and produce a stream of garbage bytes. Waiting for a high sample resynchronises on a real idle-to-start edge.
:::end

:::exercise
With 8× oversampling instead of 16×, which samples would you vote on and how much baud error would you tolerate?
:::solution
Vote on samples 3, 4 and 5 of 8. The edge detection lag is now up to 1/8 bit, and the window spans ±1/8 bit, so the drift budget at the stop bit is about $(0.5 - 0.125 - 0.125)/9.5 = 2.6$ %, versus about 4 % at 16×. That's why many UARTs default to 16×.
:::end

## Quiz

:::quiz
- type: num
  q: Samples per bit at 16× oversampling for a transmitter 3 % slow?
  answer: 16.48
  tol: 0.001
  unit: samples
  py: "16*1.03"
  explain: Its bits are 3 % longer.
- type: num
  q: Where does the stop bit start (in receiver samples) when the transmitter is 6 % slow?
  answer: 152.64
  tol: 0.001
  unit: samples
  py: "9*16*1.06"
  explain: Past samples 151 and 152, so the vote reads the previous data bit.
- type: num
  q: Drift of the stop-bit centre in samples at 3 % baud error (16×, 8N1)?
  answer: 4.56
  tol: 0.001
  unit: samples
  py: "16*9.5*0.03"
  explain: 9.5 bits × 16 × 0.03.
- type: num
  q: Sample rate in Hz for 16× oversampling at 115 200 baud?
  answer: 1843200
  tol: 0.001
  unit: Hz
  py: "16*115200"
  explain: Which is why 1.8432 MHz crystals exist.
- type: mc
  q: The line is high at the middle of a detected start bit. What does the receiver do?
  options:
    - reads the byte anyway
    - treats it as a glitch and returns to idle
    - reports a parity error
    - doubles its sample rate
  answer: 1
  explain: False-start detection.
- type: mc
  q: What does a majority vote of three samples reject?
  options:
    - any noise
    - an isolated one-sample spike
    - a 10 % baud error
    - a broken wire
  answer: 1
  explain: Two adjacent bad samples still win the vote.
:::end

:::verify
assert 9 * 16 * 1.06 > 152
assert 9 * 16 * 1.03 + 1 < 151
:::end
