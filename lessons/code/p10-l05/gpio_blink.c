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
