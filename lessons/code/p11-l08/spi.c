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
