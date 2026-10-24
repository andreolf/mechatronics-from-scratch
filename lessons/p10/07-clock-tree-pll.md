---
id: p10-l07
minutes: 40
summary: The core clock is not the crystal, it's the crystal multiplied up by a PLL and divided down for each bus. You derive f_out = f_in N/(M P) with the STM32F407's limits on every stage, work out the flash wait states, write a configurator that searches for valid divider settings and packs them into RCC_PLLCFGR, and test it with a simulated SysTick whose period has to come out at exactly 1 ms.
---

## Why a clock tree

A microcontroller can run from an internal RC oscillator (the STM32F4's HSI is 16 MHz, accurate to about 1 %) or an external crystal (HSE, typically 8 or 25 MHz, accurate to tens of ppm). Neither is fast enough to run the core at its maximum, so a **phase-locked loop** multiplies the frequency up. Then **prescalers** divide it down for each bus, because the peripheral buses have lower limits than the core. Getting this right decides whether your UART baud rate, your timer ticks and your USB link are correct.

## The PLL equations

The STM32F407 main PLL has an input divider $M$, a multiplier $N$ for the voltage-controlled oscillator (VCO), and two output dividers, $P$ for the system clock and $Q$ for USB/SDIO:

$$f_{\text{VCO,in}} = \frac{f_{\text{in}}}{M}, \quad f_{\text{VCO}} = f_{\text{VCO,in}}\,N, \quad f_{\text{SYSCLK}} = \frac{f_{\text{VCO}}}{P}, \quad f_{\text{USB}} = \frac{f_{\text{VCO}}}{Q}.$$

The reference manual (RM0090) limits each stage:

| quantity | allowed |
|---|---|
| $M$ | 2–63, and $f_{\text{VCO,in}}$ = 1–2 MHz (2 MHz recommended, it lowers jitter) |
| $N$ | 50–432, and $f_{\text{VCO}}$ = 100–432 MHz |
| $P$ | 2, 4, 6 or 8; $f_{\text{SYSCLK}} \le 168$ MHz |
| $Q$ | 2–15; USB needs exactly 48 MHz |

Then the bus prescalers: AHB (HCLK) up to 168 MHz, APB2 up to 84 MHz, APB1 up to 42 MHz. A timer on an APB bus whose prescaler isn't 1 runs at **twice** that bus clock, so TIM2–TIM7 see 84 MHz when APB1 is 42 MHz.

:::figure widget=clocktree caption="The STM32F407 clock tree from the crystal to the buses. Change M, N and P: stages outside their limits turn red, and the flash wait states follow the core clock."
:::end

## Flash wait states

Flash can't be read in one cycle at 168 MHz. At 2.7–3.6 V the STM32F4 needs one extra wait state per 30 MHz:

$$\text{WS} = \left\lceil \frac{f_{\text{HCLK}}}{30\ \text{MHz}} \right\rceil - 1, \qquad 168\ \text{MHz} \Rightarrow 5.$$

The order matters: **raise the wait states before** switching to the faster clock, and lower them only after slowing down. Running even briefly with too few wait states reads corrupted instructions. The full switch-over sequence is: enable HSE and wait for HSERDY; set PLLCFGR; enable the PLL and wait for PLLRDY; set FLASH_ACR latency; set the bus prescalers; switch SW to PLL and wait until SWS confirms.

Not every target is reachable. 100 MHz with USB, for example, would need a VCO of 200 or 400 MHz ($P$ = 2 or 4; $P$ = 6 puts it above 432 MHz), and neither is a multiple of 48 MHz, whatever the crystal. The configurator has to report the nearest legal setting (96 MHz) rather than silently pick an illegal one.

## Packing RCC_PLLCFGR

| bits | field |
|---|---|
| 5:0 | PLLM |
| 14:6 | PLLN |
| 17:16 | PLLP, encoded as $P/2 - 1$ |
| 22 | PLLSRC (1 = HSE) |
| 27:24 | PLLQ |

## Worked example

8 MHz crystal, target 168 MHz with USB.

1. $M = 4$ gives $f_{\text{VCO,in}} = 2$ MHz.
2. $N = 168$ gives $f_{\text{VCO}} = 336$ MHz, inside 100–432.
3. $P = 2$ gives 168 MHz; $Q = 7$ gives 48 MHz.
4. WS = $\lceil 168/30 \rceil - 1 = 5$. AHB /1, APB2 /2 = 84 MHz, APB1 /4 = 42 MHz, so APB1 timers run at 84 MHz.
5. RCC_PLLCFGR = $4 \;|\; 168 \ll 6 \;|\; 0 \ll 16 \;|\; 1 \ll 22 \;|\; 7 \ll 24 = 0x0740\,2A04$.
6. SysTick at 1 kHz from 168 MHz: reload = 168 000 − 1 = 167 999.

## Code it from scratch

The configurator searches every legal $(M, N, P, Q)$, prefers an exact SYSCLK, then an exact 48 MHz USB clock, then a 2 MHz VCO input. A model of SysTick counting core cycles checks the tick period.

:::code file=clock_config.c
```c
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
```
:::end

## Exercises

:::exercise
Your UART runs at 115 200 baud in a test at 16 MHz HSI, but sends garbage after you switch to the PLL at 168 MHz. The UART code didn't change. Why?
:::solution
The baud-rate register is a divider of the APB clock, computed for 16 MHz. After the switch, USART2's APB1 clock is 42 MHz, so the baud rate is 2.6 times too high. Recompute BRR from the new bus clock, ideally from a single `SystemCoreClock`-style variable that the clock setup updates.
:::end

:::exercise
Why is $M = 8$ ($f_{\text{VCO,in}}$ = 1 MHz, $N$ = 336) worse than $M = 4$, $N = 168$, though both give 336 MHz?
:::solution
Both are legal. A higher comparison frequency at the PLL's phase detector lets its loop correct faster, and a smaller $N$ multiplies the reference's phase noise less, so ST recommends 2 MHz to reduce PLL jitter. That matters for ADC sampling clocks and audio.
:::end

## Quiz

:::quiz
- type: num
  q: HSE 8 MHz, M = 4, N = 168, P = 2. SYSCLK in MHz?
  answer: 168
  tol: 0.001
  unit: MHz
  py: "8/4*168/2"
  explain: f_in N/(M P).
- type: num
  q: Flash wait states at 120 MHz (one per 30 MHz)?
  answer: 3
  tol: 0.001
  unit: ""
  py: "math.ceil(120/30) - 1"
  explain: ceil(120/30) − 1.
- type: num
  q: With APB1 = HCLK/4 at 168 MHz, what clock does TIM2 see, in MHz?
  answer: 84
  tol: 0.001
  unit: MHz
  py: "168/4*2"
  explain: Timer clock doubles when the APB prescaler is not 1.
- type: num
  q: SysTick reload for a 1 kHz tick at 100 MHz?
  answer: 99999
  tol: 0.001
  unit: ""
  py: "100e6/1000 - 1"
  explain: f/1000 − 1, since the counter includes 0.
- type: mc
  q: When moving from 16 MHz to 168 MHz, when do you raise the flash wait states?
  options:
    - after switching SYSCLK to the PLL
    - before switching SYSCLK to the PLL
    - it does not matter
    - only if the ART accelerator is off
  answer: 1
  explain: Too few wait states for even a few cycles corrupts instruction fetches.
- type: mc
  q: Which constraint rules out M = 2 with an 8 MHz crystal?
  options:
    - M must be odd
    - the VCO input would be 4 MHz, above the 2 MHz limit
    - N would exceed 432
    - USB would not be 48 MHz
  answer: 1
  explain: f_VCO,in must be 1–2 MHz.
:::end

:::verify
assert 4 | (168 << 6) | (0 << 16) | (1 << 22) | (7 << 24) == 0x07402A04
assert 8e6 / 4 * 168 / 7 == 48e6
import math
assert math.ceil(168 / 30) - 1 == 5
:::end
