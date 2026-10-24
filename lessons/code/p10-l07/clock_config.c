#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

typedef struct { uint32_t m, n, p, q, sysclk, vco_in, usb; int ok; } pll_t;

static pll_t pll_search(uint32_t f_in, uint32_t target, int need_usb) {
  pll_t best = {0}; long best_score = -1;
  for (uint32_t m = 2; m <= 63; m++) {
    uint32_t vin = f_in / m;
    if (f_in % m || vin < 1000000 || vin > 2000000) continue;
    for (uint32_t n = 50; n <= 432; n++) {
      uint32_t vco = vin * n;
      if (vco < 100000000u || vco > 432000000u) continue;
      for (uint32_t p = 2; p <= 8; p += 2) {
        uint32_t sys = vco / p;
        if (sys > 168000000u || vco % p) continue;
        uint32_t q = (vco + 24000000u) / 48000000u; if (q < 2) q = 2; if (q > 15) q = 15;
        uint32_t usb = vco / q;
        long err = labs((long)sys - (long)target);
        int usb_ok = (vco % q == 0) && usb == 48000000u;
        if (need_usb && !usb_ok) continue;
        /* score: exact frequency first, then USB, then the recommended 2 MHz VCO input */
        long score = 1000000000L - err * 8 + (usb_ok ? 4 : 0) + (vin == 2000000 ? 2 : 0);
        if (score > best_score) { best_score = score; best = (pll_t){m, n, p, q, sys, vin, usb, 1}; }
      }
    }
  }
  return best;
}

static uint32_t flash_ws(uint32_t hclk) { return (hclk + 29999999u) / 30000000u - 1; }  /* 2.7-3.6 V */

static uint32_t pllcfgr(pll_t c) {
  return c.m | (c.n << 6) | (((c.p / 2) - 1) << 16) | (1u << 22) | (c.q << 24);
}

/* SysTick model: counts core cycles down from RELOAD; fires when it wraps */
static double systick_period_ms(uint32_t sysclk, uint32_t reload, uint32_t ticks) {
  uint64_t cycles = 0, fired = 0; uint32_t cvr = reload;
  while (fired < ticks) { cycles++; if (cvr == 0) { cvr = reload; fired++; } else cvr--; }
  return (double)cycles / sysclk * 1000.0 / ticks;
}
#define CHECK(c) do { if (!(c)) { printf("FAIL line %d: %s\n", __LINE__, #c); exit(1); } } while (0)

int main(void) {
  pll_t c = pll_search(8000000u, 168000000u, 1);
  printf("HSE 8 MHz -> M=%u N=%u P=%u Q=%u: VCO in %u Hz, SYSCLK %u Hz, USB %u Hz, WS %u, PLLCFGR 0x%08X\n",
         c.m, c.n, c.p, c.q, c.vco_in, c.sysclk, c.usb, flash_ws(c.sysclk), pllcfgr(c));
  CHECK(c.ok && c.sysclk == 168000000u && c.usb == 48000000u && c.vco_in == 2000000u);
  CHECK(c.m == 4 && c.n == 168 && c.p == 2 && c.q == 7);
  CHECK(pllcfgr(c) == 0x07402A04u);
  CHECK(flash_ws(168000000u) == 5 && flash_ws(30000000u) == 0 && flash_ws(30000001u) == 1 && flash_ws(84000000u) == 2);

  pll_t d = pll_search(25000000u, 100000000u, 0);              /* 25 MHz crystal, 100 MHz core, no USB */
  CHECK(d.ok && d.sysclk == 100000000u);
  pll_t u = pll_search(25000000u, 100000000u, 1);              /* with USB, 100 MHz is impossible: VCO would  */
  CHECK(u.ok && u.sysclk == 96000000u && u.usb == 48000000u);  /* need to be 200 or 400 and a multiple of 48 */
  printf("HSE 25 MHz -> 100 MHz without USB (N=%u P=%u); with USB the best is %u Hz (N=%u P=%u Q=%u)\n", d.n, d.p, u.sysclk, u.n, u.p, u.q);

  pll_t e = pll_search(8000000u, 180000000u, 0);              /* beyond the 168 MHz limit */
  CHECK(e.ok && e.sysclk == 168000000u);                       /* best legal setting is the maximum */

  uint32_t reload = c.sysclk / 1000u - 1u;                     /* 1 kHz tick */
  CHECK(reload == 167999u && reload <= 0xFFFFFFu);             /* fits SysTick's 24 bits */
  double t = systick_period_ms(c.sysclk, reload, 50);
  printf("SysTick reload %u -> period %.6f ms\n", reload, t);
  CHECK(t > 0.999999 && t < 1.000001);
  CHECK(16000000u / 1000u - 1u <= 0xFFFFFFu && 168000000u / 1u > 0xFFFFFFu);   /* a 1 Hz tick at 168 MHz would not fit */
  printf("PASS\n");
  return 0;
}
