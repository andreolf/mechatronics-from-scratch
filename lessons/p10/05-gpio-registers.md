---
id: p10-l05
minutes: 35
summary: A GPIO pin is a handful of bits in memory-mapped registers. You learn the STM32F4 GPIO register set, enable the port clock, configure a pin with a read-modify-write that leaves its neighbours alone, set and clear it atomically through BSRR, and test a blink driver on the host against fake registers and a simulated logic analyser that checks the period.
---

## Registers are addresses

On an STM32F4 each GPIO port (A, B, C, ...) is a block of 32-bit registers 0x400 bytes apart, starting with GPIOA at 0x4002_0000. The registers you need first:

| offset | register | bits per pin | meaning |
|---|---|---|---|
| 0x00 | MODER | 2 | 00 input, 01 output, 10 alternate function, 11 analog |
| 0x04 | OTYPER | 1 | 0 push-pull, 1 open-drain |
| 0x08 | OSPEEDR | 2 | edge rate (low to very high) |
| 0x0C | PUPDR | 2 | 00 none, 01 pull-up, 10 pull-down |
| 0x10 | IDR | 1 | input level (read-only) |
| 0x14 | ODR | 1 | output level |
| 0x18 | BSRR | 1+1 | write 1 to bit $n$ to set pin $n$, to bit $16+n$ to reset it |
| 0x20 | AFR[0..1] | 4 | alternate function number |

In C you describe the block with a struct whose members are `volatile uint32_t` in register order, and point it at the base address:

```c
#define GPIOA ((GPIO_TypeDef *)0x40020000u)
GPIOA->ODR |= 1u << 5;
```

Before any of this works, the port's **clock** must be on. Peripherals are clock-gated after reset to save power, and writes to a gated peripheral are ignored. For GPIOA that's bit 0 of `RCC->AHB1ENR` at 0x4002_3830.

## Read-modify-write, and why BSRR exists

Setting pin 5 to output means writing 01 into MODER bits 11:10 *without touching the other 30 bits*, which belong to other pins:

$$\text{MODER} \leftarrow (\text{MODER} \;\&\; \sim(3 \ll 2n)) \;|\; (1 \ll 2n), \qquad n = 5.$$

That's a **read-modify-write** (RMW): load, change, store. It's fine during init, but `ODR ^= 1u << 5` in the main loop is three instructions, and if an interrupt changes another ODR bit between the load and the store, its change is lost (lesson 10). **BSRR** avoids this: a single store of `1u << 5` sets pin 5, `1u << (5 + 16)` clears it, and bits you write as 0 do nothing. The hardware does the modify step atomically.

:::figure widget=gpioblink caption="PA5 driving an LED. Each step shows the register write and the bits it changes; the logic-analyser trace below records the pin. Switch between ODR toggling and BSRR writes, and inject an interrupt that writes PA6 to see the RMW hazard."
:::end

## Testing without a board

The trick that makes register code testable: compile the *same* driver against a fake. On the host, `GPIOA` points at an ordinary struct in RAM instead of 0x4002_0000. A tiny model applies what the hardware would do (BSRR writes update ODR, then read back as zero), and a fake millisecond clock lets a simulated logic analyser timestamp every edge. The test then checks that init set exactly the right bits and that the blink period is what you asked for. On the board, the only change is the `#define`.

## Worked example

Blink PA5 at 1 Hz with 50 % duty.

1. Enable the clock: `RCC->AHB1ENR |= 1u << 0`.
2. MODER: clear bits 11:10 (mask 0xC00), set bit 10 (0x400).
3. Toggle every 500 ms: set with BSRR = 0x20, clear with BSRR = 0x200000.
4. A logic analyser should show rising edges 1000 ms apart, high for 500 ms.

## Code it from scratch

:::code file=gpio_blink.c
```c
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

typedef struct {                   /* STM32F4 GPIO register block, offsets 0x00..0x24 */
  volatile uint32_t MODER, OTYPER, OSPEEDR, PUPDR, IDR, ODR, BSRR, LCKR, AFR[2];
} GPIO_TypeDef;
typedef struct { volatile uint32_t pad[12]; volatile uint32_t AHB1ENR; } RCC_TypeDef;   /* AHB1ENR at 0x30 */

#ifdef ON_TARGET
#define GPIOA ((GPIO_TypeDef *)0x40020000u)
#define RCC   ((RCC_TypeDef *)0x40023800u)
#else                              /* host build: the same driver writes ordinary RAM */
static GPIO_TypeDef fake_gpioa;
static RCC_TypeDef fake_rcc;
#define GPIOA (&fake_gpioa)
#define RCC   (&fake_rcc)
#endif

/* ---------------- driver: identical on host and target ---------------- */
enum { MODE_IN = 0, MODE_OUT = 1, MODE_AF = 2, MODE_AN = 3 };
static void gpio_mode(GPIO_TypeDef *g, unsigned pin, unsigned mode) {
  uint32_t m = g->MODER;                         /* read   */
  m &= ~(3u << (2 * pin));                       /* modify */
  m |= (mode & 3u) << (2 * pin);
  g->MODER = m;                                  /* write  */
}
static void gpio_set(GPIO_TypeDef *g, unsigned pin)   { g->BSRR = 1u << pin; }
static void gpio_clear(GPIO_TypeDef *g, unsigned pin) { g->BSRR = 1u << (pin + 16); }
static void led_init(void) {
  RCC->AHB1ENR |= 1u << 0;                       /* GPIOA clock on */
  gpio_mode(GPIOA, 5, MODE_OUT);
  GPIOA->OTYPER &= ~(1u << 5);                   /* push-pull */
}

/* ---------------- host-side model of the hardware and a logic analyser ---------------- */
static uint32_t now_ms;
static uint32_t edges[64], n_edges, last_level;
static void hw_model(void) {                     /* what silicon does after a bus write */
  uint32_t b = GPIOA->BSRR;
  if (b) { GPIOA->ODR = (GPIOA->ODR | (b & 0xFFFFu)) & ~(b >> 16); GPIOA->BSRR = 0; }   /* BSRR reads as 0 */
  uint32_t level = (GPIOA->ODR >> 5) & 1u;
  if (level != last_level && n_edges < 64) edges[n_edges++] = (now_ms << 1) | level;
  last_level = level;
}
#define CHECK(c) do { if (!(c)) { printf("FAIL line %d: %s\n", __LINE__, #c); exit(1); } } while (0)

int main(void) {
  GPIOA->MODER = 0xA8000000u;                    /* STM32F4 reset value of GPIOA (debug pins in AF) */
  GPIOA->PUPDR = 0x64000000u;
  led_init(); hw_model();
  CHECK(RCC->AHB1ENR & 1u);
  CHECK(((GPIOA->MODER >> 10) & 3u) == MODE_OUT);
  CHECK((GPIOA->MODER & ~(3u << 10)) == 0xA8000000u);   /* the other 15 pins untouched */

  /* blink at 1 Hz for 10 s: the main loop polls a millisecond clock */
  uint32_t next = 0; int on = 0;
  for (now_ms = 0; now_ms <= 10000; now_ms++) {
    if (now_ms == next) { on = !on; if (on) gpio_set(GPIOA, 5); else gpio_clear(GPIOA, 5); next += 500; }
    hw_model();
  }
  CHECK(n_edges == 21);
  for (uint32_t i = 0; i + 2 < n_edges; i += 2) {
    CHECK((edges[i] & 1u) == 1 && (edges[i + 1] & 1u) == 0);          /* rise then fall */
    uint32_t t_rise = edges[i] >> 1, t_fall = edges[i + 1] >> 1, t_next = edges[i + 2] >> 1;
    CHECK(t_next - t_rise == 1000);                                     /* period 1000 ms */
    CHECK(t_fall - t_rise == 500);                                      /* 50 % duty */
  }
  CHECK(GPIOA->BSRR == 0);
  printf("MODER 0x%08X, %u edges, period 1000 ms, high 500 ms\nPASS\n", (unsigned)GPIOA->MODER, (unsigned)n_edges);
  return 0;
}
```
:::end

## Exercises

:::exercise
Configure PA9 and PA10 as alternate function 7 (USART1) in one write to AFR. Which register and which bits?
:::solution
Pins 8–15 use `AFR[1]` (AFRH), 4 bits each, so pin 9 is bits 7:4 and pin 10 is bits 11:8. `AFR[1] = (AFR[1] & ~0xFF0u) | (7u << 4) | (7u << 8)`. Also set both pins' MODER fields to 10 (alternate function).
:::end

:::exercise
Your LED never lights though the code runs and MODER looks right in the debugger. What's the first thing to check?
:::solution
The port clock. If `RCC->AHB1ENR` bit 0 isn't set, register writes to GPIOA are ignored (and may read back as 0). The second thing to check is whether the LED is active-low, i.e. wired from 3.3 V to the pin, so writing 1 turns it off.
:::end

## Quiz

:::quiz
- type: num
  q: Which MODER bit is the lower bit of pin 7's field?
  answer: 14
  tol: 0.001
  unit: ""
  py: "2*7"
  explain: Two bits per pin.
- type: num
  q: Value to write to BSRR to clear pin 3 (decimal)?
  answer: 524288
  tol: 0.001
  unit: ""
  py: "1 << (3 + 16)"
  explain: Reset bits are the upper half.
- type: num
  q: Address of GPIOC's ODR (decimal), with ports 0x400 apart from GPIOA at 0x40020000?
  answer: 1073874964
  tol: 0.0000001
  unit: ""
  py: "0x40020000 + 2*0x400 + 0x14"
  explain: 0x40020814.
- type: num
  q: Mask to clear the MODER field of pin 5 (decimal)?
  answer: 3072
  tol: 0.001
  unit: ""
  py: "3 << 10"
  explain: 0xC00.
- type: mc
  q: Why use BSRR instead of ODR |= bit in the main loop?
  options:
    - it is faster to read
    - a single store sets or clears pins atomically, so an interrupt cannot lose an update
    - ODR is read-only
    - BSRR also enables the clock
  answer: 1
  explain: No read-modify-write.
- type: mc
  q: You write to a GPIO register but nothing changes. The most common cause is…
  options:
    - the pin is analog
    - the port's clock is not enabled in RCC
    - the compiler optimised it away even with volatile
    - BSRR is full
  answer: 1
  explain: Peripherals are clock-gated after reset.
:::end

:::verify
assert (0xA8000000 & ~(3 << 10)) | (1 << 10) == 0xA8000400
assert 0x40020000 + 2 * 0x400 + 0x14 == 0x40020814
:::end
