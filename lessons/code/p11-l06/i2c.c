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
