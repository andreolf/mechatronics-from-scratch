---
id: p11-l08
minutes: 35
summary: SPI is two shift registers connected in a ring, clocked by the master, with four modes set by the clock's idle level (CPOL) and which edge samples the data (CPHA). You derive the timing of each mode and the round-trip limit on clock speed, write a bit-banged master for all four modes, and test it against simulated slaves to show that data is sampled correctly when the modes match and corrupted when they don't.
---

## Two shift registers in a ring

SPI uses four wires: **SCK** (clock, driven by the master), **MOSI** (master out, slave in), **MISO** (master in, slave out) and **CS** (chip select, active low, one per slave). Master and slave each hold an 8-bit shift register. Each clock shifts one bit out of each and into the other, so after 8 clocks they've **swapped** contents. Every transfer is full duplex: to read, you send something (often 0x00 or 0xFF); to write, you receive something you may ignore.

No addresses, no ACKs, no pull-ups, push-pull drivers: SPI runs at tens of MHz where I2C manages 0.4–1 MHz. The cost is a CS wire per device, and no built-in way to tell that a slave exists.

## The four modes

- **CPOL** is the idle level of SCK: 0 idles low, 1 idles high.
- **CPHA** says which edge samples: 0 samples on the **leading** edge (the first edge after CS falls), so the transmitter must have the first bit ready as soon as CS falls and changes data on trailing edges. 1 changes data on the leading edge and samples on the **trailing** edge.

| mode | CPOL | CPHA | sample on | shift out on |
|---|---|---|---|---|
| 0 | 0 | 0 | rising | falling |
| 1 | 0 | 1 | falling | rising |
| 2 | 1 | 0 | falling | rising |
| 3 | 1 | 1 | rising | falling |

Modes 0 and 3 both sample on rising edges, and many chips accept either by checking the SCK level when CS falls. Most sensors and memories use mode 0; data is usually MSB first.

## How fast

In mode 0 the slave changes MISO on a falling edge and the master samples it on the next rising edge, half a period later. In that half period the clock has to travel to the slave, the slave's output has to change (clock-to-output time $t_{co}$), and the data has to travel back and be stable for the master's setup time $t_{su}$:

$$\frac{T}{2} \ge 2\,t_{pd} + t_{co} + t_{su}.$$

With 2 ns of wiring each way, $t_{co} = 15$ ns and $t_{su} = 5$ ns, $T/2 \ge 24$ ns, so $f_{SCK} \le 20.8$ MHz, even if the slave's datasheet claims 50 MHz. Long cables and level shifters are why SPI that works on the bench fails off-board.

:::figure widget=spimodes caption="SCK, MOSI and MISO for each SPI mode with the sampling edges marked. Pick the master's and the slave's mode: when they differ, the sample points fall on changing data and the received byte is shifted."
:::end

A simulation with zero delays can make some mismatched pairs look fine: if one side samples on exactly the edge where the other changes the line, the ideal model happens to read the old value. On real wires that's a **hold-time race** that works or fails with temperature and board layout, so the test below treats any sample taken on the same edge as a change as a failure.

## Worked example

Send 0xA5 to a mode-3 slave that replies 0x3C.

1. CS falls with SCK high (CPOL 1).
2. Leading edge (falling): master puts bit 7 of 0xA5 (1) on MOSI, slave puts bit 7 of 0x3C (0) on MISO.
3. Trailing edge (rising): both sample. After 8 clocks the master holds 0x3C and the slave holds 0xA5.
4. If the master instead ran mode 0 against this slave, it would sample MISO on the first rising edge before the slave had driven bit 7, so the slave's reply arrives one bit late: 0x3C reads as 0x1E or 0x9E depending on the line's previous level.

## Code it from scratch

:::code file=spi.c
```c
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

/* ---------- the wires ---------- */
static int sck, mosi, miso = 1, cs = 1;
static int edges, sck_at_cs_fall;
/* which edges each side drove or sampled on; edge 0 is CS falling. Sampling on the same edge
   the other side changes the line is a hold-time race: it only "works" in a zero-delay model. */
static uint32_t m_change, m_sample, s_change, s_sample;

/* ---------- a simulated slave: a shift register in a given mode ---------- */
static struct { int cpol, cpha; uint8_t out, in; int bit_out; } sl;
static void slave_put(void) { if (sl.bit_out < 8) { miso = sl.out >> (7 - sl.bit_out) & 1; s_change |= 1u << edges; } sl.bit_out++; }
static void slave_cs(int level) {
  if (!level) { sl.in = 0; sl.bit_out = 0; sck_at_cs_fall = sck; if (!sl.cpha) slave_put(); }   /* CPHA 0: first bit on CS fall */
}
static void slave_edge(void) {
  if (cs) return;
  edges++;
  int leading = (sck != sl.cpol);
  int sample = sl.cpha ? !leading : leading;
  if (sample) { sl.in = (uint8_t)(sl.in << 1 | mosi); s_sample |= 1u << edges; }
  else slave_put();
}

/* ---------- HAL ----------
   the slave reacts to an edge immediately, so the master reads MISO just before it makes the edge:
   that models the real slave's clock-to-output delay (it changes MISO slightly after the edge) */
static void set_sck(int v) { if (v != sck) { sck = v; slave_edge(); } }
static void set_cs(int v) { cs = v; slave_cs(v); }
static void delay(void) {}

/* ---------- the bit-banged master, any mode, MSB first ---------- */
static uint8_t spi_xfer(int mode, uint8_t tx) {
  int cpol = mode >> 1 & 1, cpha = mode & 1;
  uint8_t rx = 0;
  for (int i = 7; i >= 0; i--) {
    if (!cpha) {
      mosi = tx >> i & 1; m_change |= 1u << edges; delay();
      int in = miso; m_sample |= 1u << (edges + 1);
      set_sck(!cpol); rx = (uint8_t)(rx << 1 | in);          /* sample at the leading edge, before the slave reacts */
      delay(); set_sck(cpol);
    } else {
      set_sck(!cpol); mosi = tx >> i & 1; m_change |= 1u << edges; delay();   /* change on the leading edge */
      int in = miso; m_sample |= 1u << (edges + 1);
      set_sck(cpol); rx = (uint8_t)(rx << 1 | in);           /* sample at the trailing edge */
      delay();
    }
  }
  return rx;
}
static uint8_t transaction(int master_mode, int slave_mode, uint8_t tx, uint8_t reply, uint8_t *slave_got) {
  sl.cpol = slave_mode >> 1 & 1; sl.cpha = slave_mode & 1; sl.out = reply;
  sck = master_mode >> 1 & 1;                               /* the clock idles at CPOL before CS falls */
  edges = 0; m_change = m_sample = s_change = s_sample = 0;
  set_cs(0);
  uint8_t rx = spi_xfer(master_mode, tx);
  set_cs(1);
  *slave_got = sl.in;
  return rx;
}
#define CHECK(c) do { if (!(c)) { printf("FAIL line %d: %s\n", __LINE__, #c); exit(1); } } while (0)

int main(void) {
  uint8_t got;
  /* the worked example */
  CHECK(transaction(3, 3, 0xA5, 0x3C, &got) == 0x3C && got == 0xA5);
  CHECK(sck_at_cs_fall == 1 && edges == 16);
  /* every mode against every slave mode, all byte pairs from a sweep */
  int ok[4][4] = {{0}};
  for (int mm = 0; mm < 4; mm++)
    for (int sm = 0; sm < 4; sm++) {
      int good = 1;
      for (int a = 0; a < 256; a += 7)
        for (int b = 0; b < 256; b += 13) {
          edges = 0; miso = 1;
          uint8_t rx = transaction(mm, sm, (uint8_t)a, (uint8_t)b, &got);
          if (rx != b || got != a) good = 0;
          if (sck_at_cs_fall != (mm >> 1)) good = 0;
          if (edges != 16) good = 0;
          if ((m_change & s_sample) || (s_change & m_sample)) good = 0;   /* a race is not a working link */
        }
      ok[mm][sm] = good;
    }
  printf("full duplex correct and race-free (rows = master mode, columns = slave mode):\n");
  for (int mm = 0; mm < 4; mm++) printf("  mode %d: %d %d %d %d\n", mm, ok[mm][0], ok[mm][1], ok[mm][2], ok[mm][3]);
  for (int mm = 0; mm < 4; mm++)
    for (int sm = 0; sm < 4; sm++) CHECK(ok[mm][sm] == (mm == sm));
  /* a mode-0 master against a mode-3 slave: MOSI still arrives (both sample on rising edges) but MISO is a bit late */
  miso = 0;
  uint8_t rx = transaction(0, 3, 0xA5, 0x3C, &got);
  printf("mode 0 master, mode 3 slave: slave got 0x%02X, master got 0x%02X instead of 0x3C\n", got, rx);
  CHECK(got == 0xA5 && rx == 0x1E);
  /* the round-trip speed limit */
  double half = 2 * 2e-9 + 15e-9 + 5e-9, fmax = 1 / (2 * half);
  printf("round trip limit: f_SCK <= %.1f MHz\n", fmax / 1e6);
  CHECK(fmax > 20.8e6 && fmax < 20.9e6);
  printf("PASS\n");
  return 0;
}
```
:::end

## Exercises

:::exercise
A flash chip reads back correct data at 1 MHz and garbage at 24 MHz on a board with a 10 cm ribbon cable. What do you compute first?
:::solution
The round-trip budget: $T/2$ at 24 MHz is 20.8 ns, which has to cover twice the cable delay, the flash's clock-to-output time and the MCU's setup time. A ribbon cable adds about 0.5 ns, but crosstalk and the flash's 8–10 ns $t_{co}$ plus the GPIO's input delay can eat it all. Many MCUs offer a delayed sampling point for SPI masters for exactly this case.
:::end

:::exercise
Why does SPI need a separate CS per slave, while I2C doesn't?
:::solution
SPI has no addressing: a slave responds to every clock while its CS is low and must release MISO (tri-state) when CS is high. CS also frames the transfer: many chips use the CS falling edge to reset their state machine and the rising edge to latch a command.
:::end

## Quiz

:::quiz
- type: num
  q: Maximum SCK in MHz with t_pd = 1 ns, t_co = 8 ns and t_su = 3 ns?
  answer: 38.46
  tol: 0.001
  unit: MHz
  py: "1/(2*(2*1e-9 + 8e-9 + 3e-9))/1e6"
  explain: Half a period covers the round trip.
- type: num
  q: Clock edges during one 8-bit SPI transfer?
  answer: 16
  tol: 0
  py: "8*2"
  explain: A leading and a trailing edge per bit.
- type: num
  q: Time in µs to read 4096 bytes at 10 MHz SCK, ignoring gaps?
  answer: 3276.8
  tol: 0.0001
  unit: µs
  py: "4096*8/10e6*1e6"
  explain: 8 bits per byte at 100 ns per bit.
- type: num
  q: Which SPI mode number has CPOL = 1 and CPHA = 0?
  answer: 2
  tol: 0
  py: "1*2 + 0"
  explain: mode = 2·CPOL + CPHA.
- type: mc
  q: In mode 0, when must the slave have its first bit on MISO?
  options:
    - as soon as CS falls, before the first rising edge
    - after the first rising edge
    - after the first falling edge
    - after 8 clocks
  answer: 0
  explain: CPHA 0 samples on the leading edge.
- type: mc
  q: Why can modes 0 and 3 often interoperate?
  options:
    - both sample on rising edges, and many slaves detect the idle clock level at CS fall
    - they have the same CPOL
    - SPI ignores the clock polarity
    - they can't
  answer: 0
  explain: Only the idle level differs.
:::end
