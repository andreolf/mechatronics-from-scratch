---
id: p10-l08
minutes: 35
summary: A hardware timer turns a fast clock into a precise slow one by counting, and two registers set the rate. You derive f_update = f_clk/((PSC + 1)(ARR + 1)), work out the best prescaler and reload for any target frequency within 16-bit limits, configure a 1 kHz control tick, and test it with a cycle-level counter model that must hit the frequency within 0.1 %.
---

## A counter with two dividers

An STM32 general-purpose timer is a counter clocked by the timer clock $f_{clk}$ (84 MHz for TIM2–TIM7 on an STM32F407 at 168 MHz, from lesson 07). Two registers shape it:

- the **prescaler** PSC divides the clock: the counter advances once every $\text{PSC} + 1$ clock cycles;
- the **auto-reload** ARR is the top: the counter goes $0, 1, \dots, \text{ARR}$, then wraps to 0 and raises an **update event** (which can trigger an interrupt, a DMA request or an ADC conversion).

So each update period is $(\text{PSC}+1)(\text{ARR}+1)$ clock cycles:

$$f_{\text{update}} = \frac{f_{clk}}{(\text{PSC} + 1)(\text{ARR} + 1)}.$$

Both are 16-bit on most timers (TIM2 and TIM5 have a 32-bit ARR), so each factor is at most 65 536. The *product* is fixed by the frequency you want; how you split it is a design choice. A small PSC and a large ARR give the finest resolution for PWM duty or capture timestamps (lessons 11 and 12). A larger PSC gives a slower, human-readable tick, such as 1 µs per count.

:::figure widget=timerpsc caption="The counter rises from 0 to ARR and wraps, firing an update event (dots) on each wrap. Change PSC and ARR: the readout shows the update frequency and its error against the target."
:::end

## When the division isn't exact

The product must be an integer, $K = f_{clk}/f_{target}$ rounded. If $K$ is not an integer, round it and accept a frequency error

$$\varepsilon = \frac{f_{clk}/K - f_{target}}{f_{target}}.$$

If $K > 65\,536$, it must be factored into two 16-bit factors, and a prime-ish $K$ may need a small compromise. Searching every PSC from 0 to 65 535 with $\text{ARR} = \text{round}(K/(\text{PSC}+1)) - 1$ finds the best split in a fraction of a millisecond on a host.

Note the shadow registers: writes to PSC and ARR take effect at the next update event (ARR only if ARPE is set), so set `EGR.UG = 1` once after configuration to load them immediately.

## Worked example

A 1 kHz control tick from 84 MHz.

1. $K = 84\,000\,000 / 1000 = 84\,000$, too big for one 16-bit register.
2. PSC = 83 makes a 1 MHz counter (1 µs per count), and ARR = 999 makes 1000 counts: exact.
3. A 44.1 kHz audio rate: $K = 84\,000\,000/44\,100 = 1904.76$, so PSC = 0, ARR = 1904 gives $84\,000\,000/1905 = 44\,094.5$ Hz, an error of −0.012 %.
4. A 1 Hz tick: $K = 84\,000\,000$ needs PSC + 1 ≥ 84 000 000 / 65 536 ≈ 1282. The smallest divisor of $K$ above that is 1344, so PSC = 1343, ARR = 62 499 (1344 × 62 500), exact.
5. The search's own 1 kHz answer is PSC = 1, ARR = 41 999: the same product, 84 000, split for the finest resolution. PSC = 83, ARR = 999 is the readable 1 µs-per-count choice; both are exact.

## Code it from scratch

:::code file=timer_config.c
```c
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
```
:::end

## Exercises

:::exercise
You need a 1 µs timestamp counter that wraps as rarely as possible on a 16-bit timer at 84 MHz. What PSC and ARR, and how often does it wrap?
:::solution
PSC = 83 makes 1 MHz; ARR = 65 535 (the maximum) wraps every 65.536 ms. For longer intervals, count the update events in software (an overflow counter) or use the 32-bit TIM2, which wraps every 71.6 minutes at 1 MHz.
:::end

:::exercise
You want 20 kHz PWM with the finest duty resolution at 84 MHz. What split, and how many duty steps?
:::solution
$K = 4200$. PSC = 0, ARR = 4199 gives 4200 duty steps (about 12 bits). Any larger PSC divides the resolution by PSC + 1 for no benefit.
:::end

## Quiz

:::quiz
- type: num
  q: f_clk = 84 MHz, PSC = 83, ARR = 999. Update frequency in Hz?
  answer: 1000
  tol: 0.001
  unit: Hz
  py: "84e6/(84*1000)"
  explain: 84 MHz / 84 000.
- type: num
  q: With PSC = 0, ARR = 1904 at 84 MHz, the update rate in Hz?
  answer: 44094.49
  tol: 0.0001
  unit: Hz
  py: "84e6/1905"
  explain: K rounded to 1905.
- type: num
  q: Frequency error of that setting against 44.1 kHz, in percent?
  answer: -0.0125
  tol: 0.01
  unit: "%"
  py: "(84e6/1905 - 44100)/44100*100"
  explain: Small, and fine for most uses.
- type: num
  q: How long between wraps of a 16-bit counter at 1 MHz, in ms?
  answer: 65.536
  tol: 0.001
  unit: ms
  py: "65536/1e6*1000"
  explain: 65 536 counts of 1 µs.
- type: mc
  q: Why prefer PSC = 0, ARR = 4199 over PSC = 3, ARR = 1049 for 20 kHz PWM?
  options:
    - lower power
    - four times the duty-cycle resolution
    - it avoids shadow registers
    - higher update frequency
  answer: 1
  explain: The ARR range is the number of duty steps.
- type: mc
  q: You wrote new PSC and ARR values but the old rate continues until the next wrap. Why?
  options:
    - the timer clock is off
    - PSC (and ARR with ARPE) are buffered until an update event; set EGR.UG to load now
    - the counter is 32-bit
    - the values are too small
  answer: 1
  explain: Shadow registers.
:::end

:::verify
assert 84e6 / (84 * 1000) == 1000
assert abs(84e6 / 1905 - 44094.488) < 1e-3
assert 1344 * 62500 == 84000000 and 84e6 / 65536 > 1281
:::end
