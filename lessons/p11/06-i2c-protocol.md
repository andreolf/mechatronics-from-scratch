---
id: p11-l06
minutes: 40
summary: I2C runs many chips on two open-drain wires that devices can only pull low, with pull-up resistors doing the rising, so the pull-up value sets the rise time t_r = 0.8473 RC and with it the top speed. You derive pull-up sizing, the start, stop, address and ACK rules, write a bit-banged I2C master, and test it against a simulated sensor that acknowledges, stretches the clock and auto-increments its register pointer.
---

## Open drain and pull-ups

I2C has two lines, SCL (clock) and SDA (data). Every device has **open-drain** outputs: it can pull a line low or let go, never drive it high. A pull-up resistor $R_p$ to $V_{DD}$ does the rising. Two consequences:

- The bus is a **wired AND**: if anyone pulls low, the line is low. Two devices can't fight and short the supply, and a slow slave can hold SCL low to make the master wait (**clock stretching**).
- Rising edges are an RC charge of the bus capacitance $C_b$ (pins plus wiring) through $R_p$.

The spec measures rise time from 30 % to 70 % of $V_{DD}$:

$$t_r = R_p C_b \ln\frac{1 - 0.3}{1 - 0.7} = 0.8473\, R_p C_b.$$

So the largest allowed pull-up is $R_{max} = t_r^{max}/(0.8473\, C_b)$: with $t_r^{max} = 1000$ ns (standard mode, 100 kHz) and 400 pF that's 2.95 kΩ; fast mode (400 kHz, 300 ns) with 200 pF gives 1.77 kΩ. The smallest is set by how much current a pin can sink at $V_{OL} = 0.4$ V, typically 3 mA: $R_{min} = (V_{DD} - 0.4)/3\text{ mA} = 967$ Ω at 3.3 V.

## The protocol

- **Idle**: both lines high.
- **START**: SDA falls while SCL is high. **STOP**: SDA rises while SCL is high. These are the only times SDA may change while SCL is high; data changes while SCL is low and is sampled while it's high.
- After a START the master sends a byte: a **7-bit address** and a R/W bit (0 = write). Bytes are MSB first.
- After every byte the receiver pulls SDA low for one clock: the **ACK**. A high SDA in that slot (**NACK**) means nobody answered, or that the master wants no more data.
- To read register $r$: START, address+W, $r$, **repeated START**, address+R, read bytes (ACK all but the last, NACK the last), STOP.

:::figure widget=i2ctrace caption="SDA and SCL for a register read: START, address and write bit, ACK, register number, repeated START, address and read bit, data, NACK, STOP. Drag the pull-up and bus capacitance to see the rising edges slow down."
:::end

## Worked example

Size the pull-ups for a 400 kHz bus at 3.3 V with an IMU, a magnetometer and 30 cm of cable, about 120 pF in total.

1. $R_{max} = 300\text{ ns}/(0.8473 \times 120\text{ pF}) = 2.95$ kΩ.
2. $R_{min} = (3.3 - 0.4)/3\text{ mA} = 967$ Ω.
3. Pick 2.2 kΩ: $t_r = 0.8473 \times 2200 \times 120\text{ pF} = 224$ ns, under 300 ns with margin. The MCU's internal 40 kΩ pull-ups would give 4.1 µs, which is why they're no good for I2C.

## Code it from scratch

:::code file=i2c.c
```c
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* ---------- the bus: wired AND of master and slave, plus a recorder ---------- */
static int m_scl = 1, m_sda = 1;                    /* 1 = released */
static int s_scl = 1, s_sda = 1;
static int line_scl = 1, line_sda = 1;
static int sda_changes_while_scl_high;

/* ---------- a simulated sensor at address 0x48 with 16 registers ---------- */
enum { S_IDLE, S_RX, S_TX };
static struct {
  int st, bit, addr_phase, have_reg, master_ack, stretch, go_tx;
  uint8_t shift, reg, regs[16];
  int stretch_cycles;                                /* hold SCL low this many delays after each ACK */
} dev;
#define DEV_ADDR 0x48

static void slave_tx_load(void) { dev.shift = dev.regs[dev.reg & 15]; dev.reg++; dev.bit = 0; s_sda = dev.shift >> 7 & 1; }
/* bit counts the clocks of the current byte: 0..7 data, 8 = ACK slot pending, 9 = in the ACK slot */
static void slave_scl_rise(void) {
  if (dev.st == S_RX && dev.bit < 8) { dev.shift = (uint8_t)(dev.shift << 1 | line_sda); dev.bit++; }
  else if (dev.st == S_TX) { if (dev.bit < 8) dev.bit++; else { dev.master_ack = !line_sda; dev.bit = 9; } }
}
static void slave_scl_fall(void) {
  if (dev.st == S_RX) {
    if (dev.bit == 8) {                              /* a byte is in: decide whether to ACK */
      if (dev.addr_phase) {
        if ((dev.shift >> 1) != DEV_ADDR) { dev.st = S_IDLE; return; }
        dev.addr_phase = 0;
        dev.go_tx = dev.shift & 1;                   /* a read: start sending after the ACK slot */
      } else if (!dev.have_reg) { dev.reg = dev.shift; dev.have_reg = 1; }
      else { dev.regs[dev.reg & 15] = dev.shift; dev.reg++; }
      s_sda = 0; dev.bit = 9;                        /* ACK */
    } else if (dev.bit == 9) {                       /* the ACK slot is over */
      s_sda = 1; dev.bit = 0; dev.shift = 0;
      if (dev.go_tx) { dev.go_tx = 0; dev.st = S_TX; slave_tx_load(); return; }
      if (dev.stretch_cycles) { s_scl = 0; dev.stretch = dev.stretch_cycles; }
    }
  } else if (dev.st == S_TX) {
    if (dev.bit < 8) s_sda = dev.shift >> (7 - dev.bit) & 1;
    else if (dev.bit == 8) s_sda = 1;                /* let the master drive its ACK */
    else if (dev.master_ack) slave_tx_load();
    else { dev.st = S_IDLE; s_sda = 1; }
  }
}
static void bus_update(void) {
  for (int pass = 0; pass < 3; pass++) {             /* settle: the slave may respond to an edge */
    int scl = m_scl & s_scl, sda = m_sda & s_sda;
    if (scl == line_scl && sda == line_sda) return;
    int old_scl = line_scl, old_sda = line_sda;
    line_scl = scl; line_sda = sda;
    if (old_scl && scl && old_sda != sda) {
      sda_changes_while_scl_high++;
      if (!sda) { dev.st = S_RX; dev.bit = 0; dev.shift = 0; dev.addr_phase = 1; dev.go_tx = 0; s_sda = 1; }   /* START */
      else { dev.st = S_IDLE; dev.have_reg = 0; s_sda = 1; }                                     /* STOP */
    }
    if (!old_scl && scl) slave_scl_rise();
    if (old_scl && !scl) slave_scl_fall();
  }
}

/* ---------- the HAL a real port would implement with GPIO open-drain writes ---------- */
static void scl(int v) { m_scl = v; bus_update(); }
static void sda(int v) { m_sda = v; bus_update(); }
static int sda_read(void) { return line_sda; }
static int scl_read(void) { return line_scl; }
static long delays;
static void delay_half(void) {                       /* half a bit period; the slave's stretch counts down */
  delays++;
  if (dev.stretch && --dev.stretch == 0) { s_scl = 1; bus_update(); }
}

/* ---------- the bit-banged master ---------- */
static int scl_high(void) {                          /* release SCL and wait for any clock stretching */
  scl(1);
  for (int t = 0; t < 1000; t++) { if (scl_read()) return 0; delay_half(); }
  return -1;
}
static void i2c_start(void) { sda(1); scl_high(); delay_half(); sda(0); delay_half(); scl(0); }
static void i2c_stop(void) { sda(0); delay_half(); scl_high(); delay_half(); sda(1); delay_half(); }
static int i2c_write_byte(uint8_t b) {               /* returns 1 for ACK */
  for (int i = 7; i >= 0; i--) { sda(b >> i & 1); delay_half(); scl_high(); delay_half(); scl(0); }
  sda(1); delay_half(); scl_high(); int ack = !sda_read(); delay_half(); scl(0);
  return ack;
}
static uint8_t i2c_read_byte(int ack) {
  uint8_t b = 0; sda(1);
  for (int i = 0; i < 8; i++) { delay_half(); scl_high(); b = (uint8_t)(b << 1 | sda_read()); delay_half(); scl(0); }
  sda(!ack); delay_half(); scl_high(); delay_half(); scl(0); sda(1);
  return b;
}
static int i2c_write_regs(uint8_t addr, uint8_t reg, const uint8_t *d, int n) {
  i2c_start();
  if (!i2c_write_byte((uint8_t)(addr << 1))) { i2c_stop(); return -1; }
  int ok = i2c_write_byte(reg);
  for (int i = 0; i < n && ok; i++) ok = i2c_write_byte(d[i]);
  i2c_stop();
  return ok ? 0 : -2;
}
static int i2c_read_regs(uint8_t addr, uint8_t reg, uint8_t *d, int n) {
  i2c_start();
  if (!i2c_write_byte((uint8_t)(addr << 1))) { i2c_stop(); return -1; }
  if (!i2c_write_byte(reg)) { i2c_stop(); return -2; }
  i2c_start();                                       /* repeated START */
  if (!i2c_write_byte((uint8_t)(addr << 1 | 1))) { i2c_stop(); return -1; }
  for (int i = 0; i < n; i++) d[i] = i2c_read_byte(i < n - 1);
  i2c_stop();
  return 0;
}
#define CHECK(c) do { if (!(c)) { printf("FAIL line %d: %s\n", __LINE__, #c); exit(1); } } while (0)

int main(void) {
  /* pull-up sizing */
  double rmax = 300e-9 / (0.8473 * 120e-12), rmin = (3.3 - 0.4) / 3e-3, tr = 0.8473 * 2200 * 120e-12;
  printf("400 kHz, 120 pF: R between %.0f and %.0f ohm; 2.2k gives t_r = %.0f ns\n", rmin, rmax, tr * 1e9);
  CHECK(rmax > 2200 && rmin < 2200 && tr < 300e-9);

  for (int i = 0; i < 16; i++) dev.regs[i] = (uint8_t)(0xA0 + i);
  uint8_t buf[16];
  /* read one register, then a burst with auto-increment */
  CHECK(i2c_read_regs(DEV_ADDR, 3, buf, 1) == 0 && buf[0] == 0xA3);
  CHECK(i2c_read_regs(DEV_ADDR, 0, buf, 16) == 0);
  for (int i = 0; i < 16; i++) CHECK(buf[i] == 0xA0 + i);
  /* write two registers and read them back */
  const uint8_t w[2] = {0x5A, 0xC3};
  CHECK(i2c_write_regs(DEV_ADDR, 7, w, 2) == 0 && dev.regs[7] == 0x5A && dev.regs[8] == 0xC3);
  CHECK(i2c_read_regs(DEV_ADDR, 7, buf, 2) == 0 && buf[0] == 0x5A && buf[1] == 0xC3);
  /* nobody at 0x50: NACK on the address */
  CHECK(i2c_read_regs(0x50, 0, buf, 1) == -1);
  CHECK(line_scl && line_sda);                       /* bus released and idle */
  /* the slave stretches the clock after every byte it receives */
  dev.stretch_cycles = 25; long before = delays;
  CHECK(i2c_read_regs(DEV_ADDR, 0, buf, 4) == 0 && buf[0] == 0xA0 && buf[3] == 0xA3);
  long stretched = delays - before; dev.stretch_cycles = 0; before = delays;
  CHECK(i2c_read_regs(DEV_ADDR, 0, buf, 4) == 0);
  long plain = delays - before;
  printf("clock stretching: the same read took %ld half-bits instead of %ld, data still correct\n", stretched, plain);
  CHECK(stretched > plain + 40);              /* two received bytes, 25 half-bits each */
  /* SDA changed while SCL was high only for STARTs and STOPs:
     per read 2 STARTs + 1 STOP; per write 1 START + 1 STOP; the failed read 1 + 1 */
  int expect = 3 * 5 + 2 * 1 + 2;
  printf("SDA changed with SCL high %d times = START/STOP count %d\n", sda_changes_while_scl_high, expect);
  CHECK(sda_changes_while_scl_high == expect);
  printf("PASS\n");
  return 0;
}
```
:::end

## Exercises

:::exercise
Two sensors on your bus both have address 0x68. What are your options?
:::solution
Many parts have an address pin (the MPU-6050's AD0 picks 0x68 or 0x69), so strap one differently. Otherwise use two I2C peripherals, an I2C multiplexer such as the TCA9548A, or a part with a programmable address. Two devices at one address both ACK and both drive data, which corrupts every read.
:::end

:::exercise
After a reset mid-transfer, the bus is stuck with SDA low. Why, and how do you recover?
:::solution
The slave was in the middle of sending a 0 bit and is still waiting for clocks; it doesn't know the master reset. The standard fix is to toggle SCL up to nine times until the slave releases SDA, then generate a STOP. Many drivers do this at startup.
:::end

## Quiz

:::quiz
- type: num
  q: Rise time in ns for 4.7 kΩ and 100 pF?
  answer: 398.2
  tol: 0.001
  unit: ns
  py: "0.8473*4700*100e-12*1e9"
  explain: 0.8473 RC; too slow for 400 kHz.
- type: num
  q: Largest pull-up in Ω for standard mode (1000 ns) with 400 pF?
  answer: 2950.5
  tol: 0.001
  unit: Ω
  py: "1000e-9/(0.8473*400e-12)"
  explain: t_r/(0.8473 C_b).
- type: num
  q: Smallest pull-up in Ω at 5 V for 3 mA sink at V_OL = 0.4 V?
  answer: 1533.3
  tol: 0.001
  unit: Ω
  py: "(5-0.4)/3e-3"
  explain: (V_DD − V_OL)/I_OL.
- type: num
  q: The first byte sent to read from a device at 0x48?
  answer: 145
  tol: 0
  py: "0x48*2 + 1"
  explain: 0x91, address shifted left with R/W = 1.
- type: mc
  q: What is a START condition?
  options:
    - SDA falls while SCL is high
    - SCL falls while SDA is high
    - SDA rises while SCL is high
    - nine clocks with SDA low
  answer: 0
  explain: SDA rising with SCL high is a STOP.
- type: mc
  q: Why can a slave stretch the clock?
  options:
    - SCL is open drain, so holding it low makes the master wait
    - the slave generates the clock
    - the pull-up is weak
    - it can't
  answer: 0
  explain: The master releases SCL and waits until it actually rises.
:::end

:::verify
import math
assert abs(math.log(0.7 / 0.3) - 0.8473) < 1e-4
:::end
