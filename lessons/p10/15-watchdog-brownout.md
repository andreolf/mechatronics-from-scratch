---
id: p10-l15
minutes: 35
summary: A watchdog is a countdown timer that resets the chip unless the firmware proves it's alive by refreshing it in time, and a window watchdog also rejects refreshes that come too early. You derive the IWDG timeout and its spread from the inaccurate LSI clock, the WWDG window, and the brown-out reset's job, then test a simulated main loop where an injected hang and an early refresh both produce a reset within the designed time.
---

## Why a watchdog

Firmware hangs: a peripheral never sets its ready flag, a corrupted pointer sends the PC into a loop, an EMI spike flips a bit. In a device nobody can reach, for example a solar-powered sensor on an Alpine pass that's snowed in for months, the only recovery is a reset the hardware does on its own. That's the watchdog: a counter running from its own clock that resets the MCU when it reaches zero. The firmware **refreshes** ("kicks") it to reload the counter. A hang stops the kicks, and the reset follows.

The rule that makes it work: kick the watchdog **only from one place that proves the whole system is healthy**, typically the end of the main loop after every task has reported in. Kicking it from a timer interrupt proves only that the interrupt still fires, which it will, even while the main loop is stuck.

## Independent watchdog (IWDG) timing

The STM32F4's IWDG counts down from a 12-bit reload value RL (up to 4095) at the LSI clock divided by a prescaler $4 \cdot 2^{\text{PR}}$ (PR = 0…6, so ÷4 to ÷256):

$$t_{\text{timeout}} = \frac{4 \cdot 2^{\text{PR}} \,(\text{RL} + 1)}{f_{\text{LSI}}}.$$

The LSI is a cheap RC oscillator, nominally 32 kHz, and the STM32F4 datasheet allows 17–47 kHz. So the real timeout spans almost a factor of three. Design for both ends:

- at the **fastest** LSI the timeout is shortest; it must still exceed the longest legitimate gap between kicks, with margin;
- at the **slowest** LSI it's longest; that bounds how long a hung device stays dead before it resets.

Because the IWDG runs from its own clock, it keeps working even if the main clock fails, which is why it's "independent".

## Window watchdog (WWDG)

The WWDG catches a different failure: code that runs **too fast**, for example a loop that skips its work and kicks immediately. Its 7-bit counter counts down from up to 0x7F; a reset happens when it passes 0x3F, *or* if you refresh while the counter is still above the window value W. So a refresh is accepted only in the window $0x3F < \text{counter} \le W$. It runs from APB1 / 4096 / 2^WDGTB.

:::figure widget=watchdog caption="The watchdog counter counting down, with the main loop's kicks. Inject a hang and the counter reaches zero and resets the chip; switch to the window watchdog and kick early to see the early-refresh reset."
:::end

## Brown-out reset

When the supply sags, a CPU can execute garbage before it stops completely, and garbage can include writing flash. The **brown-out reset** (BOR) holds the chip in reset whenever the supply is below a threshold, selected in the option bytes on an STM32F4 (levels around 2.1, 2.4 and 2.7 V), and releases it only when the supply is back with some hysteresis. Use the highest level your supply allows, and never write flash or EEPROM without checking the supply first.

## Worked example

Main loop worst case 40 ms; target nominal timeout ≈ 100 ms.

1. With PR = 1 (÷8), each count is 8/32 kHz = 0.25 ms; RL = 399 gives $8 \cdot 400 / 32\,000 = 100$ ms nominal.
2. At 47 kHz: $3200/47\,000 = 68.1$ ms, still above 40 ms (1.7× margin).
3. At 17 kHz: $3200/17\,000 = 188$ ms, the longest a hang can last.
4. WWDG at 42 MHz APB1, WDGTB = 3: tick = 4096 · 8/42 MHz = 780 µs. From 0x7F to 0x3F is 64 ticks = 49.9 ms; with W = 0x5F, a refresh earlier than 32 ticks (25 ms) after the last one resets.

## Code it from scratch

:::code file=watchdog.c
```c
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

/* IWDG model: time in microseconds, LSI frequency as a parameter */
typedef struct { uint32_t pr, rl; double f_lsi; double deadline_us; int resets; } iwdg_t;
static double iwdg_timeout_us(uint32_t pr, uint32_t rl, double f_lsi) { return 4.0 * (1u << pr) * (rl + 1) / f_lsi * 1e6; }
static void iwdg_kick(iwdg_t *w, double now) { w->deadline_us = now + iwdg_timeout_us(w->pr, w->rl, w->f_lsi); }
static int iwdg_expired(iwdg_t *w, double now) { return now >= w->deadline_us; }

/* WWDG model: 7-bit counter ticking down; reset below 0x40 or on refresh above the window */
typedef struct { int cnt, window; int reset; } wwdg_t;
static void wwdg_tick(wwdg_t *w) { if (--w->cnt < 0x40) w->reset = 1; }
static void wwdg_refresh(wwdg_t *w) { if (w->cnt > w->window) w->reset = 1; else w->cnt = 0x7F; }

/* a main loop of 4 tasks; each takes a few ms; at t_hang the third task gets stuck forever */
static double run_main_loop(iwdg_t *w, double t_hang_us, double t_end_us, double *loop_max_us) {
  double now = 0, last_kick = 0; *loop_max_us = 0; iwdg_kick(w, 0);
  uint32_t r = 12345;
  while (now < t_end_us) {
    for (int task = 0; task < 4; task++) {
      r = r * 1103515245u + 12345u;
      double dt = 3000 + (r >> 16) % 7000;                  /* 3..10 ms per task */
      if (task == 2 && now >= t_hang_us) {                  /* stuck: time passes, no kicks */
        while (!iwdg_expired(w, now)) now += 100;
        w->resets++; return now;                            /* time of the reset */
      }
      now += dt;
      if (iwdg_expired(w, now)) { w->resets++; return -now; }   /* false reset: timeout too short */
    }
    if (now - last_kick > *loop_max_us) *loop_max_us = now - last_kick;
    iwdg_kick(w, now); last_kick = now;                     /* kick once per complete loop */
  }
  return 0;
}
#define CHECK(c) do { if (!(c)) { printf("FAIL line %d: %s\n", __LINE__, #c); exit(1); } } while (0)

int main(void) {
  const uint32_t PR = 1, RL = 399;
  double nom = iwdg_timeout_us(PR, RL, 32000), fast = iwdg_timeout_us(PR, RL, 47000), slow = iwdg_timeout_us(PR, RL, 17000);
  printf("IWDG PR=%u RL=%u: timeout %.1f ms nominal, %.1f ms at 47 kHz, %.1f ms at 17 kHz\n", PR, RL, nom / 1e3, fast / 1e3, slow / 1e3);
  CHECK(nom == 100000.0 && fast > 68000 && fast < 68200 && slow > 188000 && slow < 188300);

  const double lsis[] = {17000, 32000, 47000};
  for (int i = 0; i < 3; i++) {
    iwdg_t w = {PR, RL, lsis[i], 0, 0}; double loop_max;
    double no_hang = run_main_loop(&w, 1e12, 10e6, &loop_max);     /* 10 s healthy */
    CHECK(no_hang == 0 && w.resets == 0);                         /* never a false reset */
    CHECK(loop_max <= 40000);                                     /* 4 tasks x 10 ms worst case */
    iwdg_t h = {PR, RL, lsis[i], 0, 0};
    double t_reset = run_main_loop(&h, 5e6, 20e6, &loop_max);     /* hang injected at t = 5 s */
    double timeout = iwdg_timeout_us(PR, RL, lsis[i]);
    printf("LSI %5.0f Hz: no false reset in 10 s (longest loop %.1f ms); hang at 5 s -> reset at %.3f s\n",
           lsis[i], loop_max / 1e3, t_reset / 1e6);
    CHECK(h.resets == 1 && t_reset > 5e6 && t_reset <= 5e6 + 40000 + timeout + 100);   /* within one loop + timeout */
  }

  /* WWDG: window 0x5F; refresh early -> reset, refresh in the window -> fine, no refresh -> reset */
  wwdg_t a = {0x7F, 0x5F, 0}; for (int k = 0; k < 20; k++) wwdg_tick(&a); wwdg_refresh(&a);
  CHECK(a.reset);                                                 /* counter 0x6B > 0x5F: too early */
  wwdg_t b = {0x7F, 0x5F, 0};
  for (int cycle = 0; cycle < 100; cycle++) { for (int k = 0; k < 40; k++) wwdg_tick(&b); wwdg_refresh(&b); }
  CHECK(!b.reset);                                                /* 40 ticks: counter 0x57, inside the window */
  wwdg_t c = {0x7F, 0x5F, 0}; for (int k = 0; k < 64; k++) wwdg_tick(&c);
  CHECK(c.reset);                                                 /* missed: passes 0x3F after 64 ticks */
  double tick_us = 4096.0 * 8 / 42e6 * 1e6;
  printf("WWDG tick %.1f us: window opens %.1f ms after a refresh, closes at %.1f ms\nPASS\n", tick_us, 32 * tick_us / 1e3, 64 * tick_us / 1e3);
  return 0;
}
```
:::end

## Exercises

:::exercise
A colleague kicks the IWDG from the 1 kHz SysTick interrupt "so it never resets by accident". What failure does that hide?
:::solution
Any hang in the main loop or in a lower-priority task: SysTick keeps firing and kicking, so the watchdog never expires and the device stays stuck forever. Kick from the main loop after every task has checked in (for example, each task sets a bit and the loop kicks only when all bits are set).
:::end

:::exercise
After a watchdog reset, how does the firmware know it happened, and what should it do?
:::solution
The reset-cause flags in `RCC_CSR` (IWDGRSTF, WWDGRSTF, BORRSTF, and so on) say why the chip reset. Log it (count it in backup RAM or flash), clear the flags, and consider a safe mode if it keeps happening. Silent resets hide bugs.
:::end

## Quiz

:::quiz
- type: num
  q: IWDG timeout in ms with PR = 1, RL = 399 at 32 kHz?
  answer: 100
  tol: 0.001
  unit: ms
  py: "4*2**1*400/32000*1000"
  explain: 4·2^PR·(RL+1)/f_LSI.
- type: num
  q: The same setting at 47 kHz, in ms?
  answer: 68.09
  tol: 0.001
  unit: ms
  py: "3200/47000*1000"
  explain: The fastest LSI gives the shortest timeout.
- type: num
  q: Maximum IWDG timeout in seconds at 32 kHz (PR = 6, RL = 4095)?
  answer: 32.768
  tol: 0.001
  unit: s
  py: "4*2**6*4096/32000"
  explain: ÷256 and 4096 counts.
- type: num
  q: WWDG tick in µs at 42 MHz with WDGTB = 3?
  answer: 780.19
  tol: 0.001
  unit: µs
  py: "4096*8/42e6*1e6"
  explain: APB1/4096/2^WDGTB.
- type: mc
  q: Where should the watchdog be kicked?
  options:
    - in the SysTick interrupt
    - once per main loop, after every task has reported healthy
    - in every function
    - only at startup
  answer: 1
  explain: The kick must prove the whole system is alive.
- type: mc
  q: The window watchdog resets the chip if…
  options:
    - it is refreshed too late only
    - it is refreshed too early or too late
    - the supply drops
    - the LSI fails
  answer: 1
  explain: The refresh must land in the window.
:::end

:::verify
assert 4 * 2 * 400 / 32000 == 0.1
assert abs(3200 / 17000 * 1000 - 188.2) < 0.1
assert abs(64 * 4096 * 8 / 42e6 * 1000 - 49.93) < 0.01
:::end
