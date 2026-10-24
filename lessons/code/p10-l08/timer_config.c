#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <math.h>

typedef struct { uint32_t psc, arr; double f, err; } tim_cfg;

/* best (PSC, ARR) for a target update rate; 16-bit fields; ties prefer the largest ARR (finest resolution) */
static tim_cfg tim_search(double fclk, double target) {
  tim_cfg best = {0, 0, 0, 1e9};
  for (uint32_t psc = 0; psc <= 65535; psc++) {
    double arr1 = round(fclk / target / (psc + 1));
    if (arr1 < 1 || arr1 > 65536) continue;
    double f = fclk / ((psc + 1) * arr1), err = fabs(f - target) / target;
    if (err < best.err - 1e-12) best = (tim_cfg){psc, (uint32_t)arr1 - 1, f, err};
  }
  return best;
}

/* register-level model: count timer-clock cycles, fire an update when CNT wraps from ARR */
static uint64_t count_updates(uint32_t psc, uint32_t arr, uint64_t clk_cycles) {
  uint32_t pre = 0, cnt = 0; uint64_t updates = 0;
  for (uint64_t c = 0; c < clk_cycles; c++) {
    if (pre == psc) { pre = 0; if (cnt == arr) { cnt = 0; updates++; } else cnt++; } else pre++;
  }
  return updates;
}
#define CHECK(c) do { if (!(c)) { printf("FAIL line %d: %s\n", __LINE__, #c); exit(1); } } while (0)

int main(void) {
  const double fclk = 84e6;
  const double targets[] = {1000, 44100, 1, 20000, 3333, 50};
  for (int i = 0; i < 6; i++) {
    tim_cfg c = tim_search(fclk, targets[i]);
    printf("%8.0f Hz: PSC=%5u ARR=%5u -> %.4f Hz (%.4f %%)\n", targets[i], c.psc, c.arr, c.f, 100 * c.err);
    CHECK(c.psc <= 65535 && c.arr <= 65535);
    CHECK(c.err < 0.001);                                    /* within 0.1 % */
  }
  tim_cfg t = tim_search(fclk, 1000);
  CHECK((t.psc + 1) * (t.arr + 1) == 84000);
  /* the 1 kHz tick from the worked example, checked against the cycle-level model over 0.25 s */
  uint64_t n = count_updates(83, 999, (uint64_t)(0.25 * fclk));
  printf("PSC=83 ARR=999: %llu updates in 0.25 s\n", (unsigned long long)n);
  CHECK(n == 250);
  tim_cfg a = tim_search(fclk, 44100);
  CHECK(a.psc == 0 && a.arr == 1904 && fabs(a.f - 44094.488) < 0.01);
  uint64_t na = count_updates(a.psc, a.arr, (uint64_t)fclk / 10);   /* 0.1 s */
  CHECK(fabs((double)na / 0.1 - 44100) / 44100 < 0.001);
  printf("PASS\n");
  return 0;
}
