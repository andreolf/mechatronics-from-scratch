---
id: p10-l22
minutes: 40
summary: Most firmware bugs are logic bugs, and logic can be tested on a laptop in milliseconds if the code doesn't talk to registers directly. You derive a hardware abstraction layer with an interface the application calls and fakes the tests control, write a tiny Unity-style test framework, and test a debounced button and LED controller against fake GPIO and a fake clock, producing a CI-ready report and exit code.
---

## Why test on the host

Flashing a board, pressing a button and watching an LED is a slow test that only covers what you thought of trying. Most of the code in a firmware project is **logic**: state machines, protocol parsers, filters, schedulers. None of it needs the hardware, *if* it doesn't touch registers directly. Then it compiles with the host's gcc and runs thousands of cases in milliseconds, on every commit, in CI.

The tool most embedded teams use for this is **Unity** (a small C test framework from ThrowTheSwitch), often with CMock to generate fakes. The ideas fit in a page, so here we build a minimal version ourselves.

## The seam: a hardware abstraction layer

Put an interface between the logic and the registers:

```c
typedef struct {
  int  (*read_button)(void);            /* 1 = pressed */
  void (*write_led)(int on);
  uint32_t (*millis)(void);
} hal_t;
```

The application module takes a `const hal_t *` and calls only through it. On the board, the functions read `GPIOC->IDR`, write `GPIOA->BSRR` and return a SysTick counter (lessons 05 and 09). In the tests, a **fake** implements the same interface with plain variables the test controls: it can make the button bounce, jump the clock forward, and record every LED write.

Three kinds of test double, from simplest:

- a **stub** returns canned values;
- a **fake** has working, simplified behaviour (a clock you advance by hand);
- a **mock** also checks that it was called the right way (CMock generates these).

## What to test

The module under test toggles an LED on each debounced press of a button, and blinks when the button is held for 2 s:

- a press that stays stable for 20 ms toggles the LED, once;
- **bounce** (transitions faster than 20 ms) is ignored;
- holding for 2 s enters blink mode at 2 Hz; releasing leaves it;
- `millis()` wrapping at $2^{32}$ ms doesn't break timing, because elapsed time is computed as `now - start` in unsigned arithmetic (lesson 18's trick).

:::figure widget=testreport caption="The test report from running the suite. Introduce a bug in the module (a debounce off by one, or signed time arithmetic) and see which tests catch it."
:::end

## Worked example

Debounce 20 ms, fake clock in 1 ms steps.

1. Button goes down at $t$ = 100 ms and bounces until 104 ms, then stays down. The last raw change is at 104, so the press is accepted at 124 ms: one toggle.
2. A 10 ms glitch is shorter than 20 ms: no toggle.
3. Start the clock at $2^{32} - 10$ ms. A press accepted 20 ms later has `now - start` = 20 even though `now` < `start`: correct with `uint32_t`, broken with `int64_t` casts of the two values.
4. Hold from 1000 ms: blink mode at 3020 ms (2 s after the press was accepted at 1020 ms); the LED then toggles every 250 ms.

## Code it from scratch

Everything is in one file so it runs as is; in a project, `minitest.h`, `button_led.c/.h`, `hal_fake.c` and `test_button_led.c` would be separate, with only `test_*.c` and the fake left out of the firmware build.

:::code file=test_button_led.c
```c
#include <stdint.h>
#include <stdio.h>
#include <string.h>

/* ---------------- minitest.h: a tiny Unity-style framework ---------------- */
static int mt_tests, mt_failures, mt_current_failed;
static const char *mt_name;
#define TEST_ASSERT_TRUE(c) do { if (!(c)) { printf("%s:%d:%s:FAIL: %s\n", __FILE__, __LINE__, mt_name, #c); mt_current_failed = 1; return; } } while (0)
#define TEST_ASSERT_EQUAL_INT(e, a) do { long _e = (long)(e), _a = (long)(a); if (_e != _a) { \
    printf("%s:%d:%s:FAIL: expected %ld was %ld\n", __FILE__, __LINE__, mt_name, _e, _a); mt_current_failed = 1; return; } } while (0)
static void setUp(void);
#define RUN_TEST(fn) do { mt_name = #fn; mt_current_failed = 0; setUp(); fn(); mt_tests++; \
    if (mt_current_failed) mt_failures++; else printf("%s:PASS\n", #fn); } while (0)

/* ---------------- hal.h ---------------- */
typedef struct { int (*read_button)(void); void (*write_led)(int on); uint32_t (*millis)(void); } hal_t;

/* ---------------- button_led.c: the module under test ---------------- */
#define DEBOUNCE_MS 20u
#define HOLD_MS 2000u
#define BLINK_HALF_MS 250u
typedef struct { const hal_t *hal; int raw, stable, led, blinking; uint32_t t_change, t_press, t_blink; } button_led_t;
static void bl_init(button_led_t *b, const hal_t *hal) {
  memset(b, 0, sizeof *b); b->hal = hal; b->t_change = hal->millis(); hal->write_led(0);
}
static void bl_poll(button_led_t *b) {                    /* call every millisecond or so */
  uint32_t now = b->hal->millis(); int raw = b->hal->read_button();
  if (raw != b->raw) { b->raw = raw; b->t_change = now; }
  if (raw != b->stable && (uint32_t)(now - b->t_change) >= DEBOUNCE_MS) {   /* unsigned: wrap-safe */
    b->stable = raw;
    if (raw) { b->led = !b->led; b->hal->write_led(b->led); b->t_press = now; }
    else if (b->blinking) { b->blinking = 0; b->led = 0; b->hal->write_led(0); }
  }
  if (b->stable && !b->blinking && (uint32_t)(now - b->t_press) >= HOLD_MS) { b->blinking = 1; b->t_blink = now; }
  if (b->blinking && (uint32_t)(now - b->t_blink) >= BLINK_HALF_MS) { b->t_blink += BLINK_HALF_MS; b->led = !b->led; b->hal->write_led(b->led); }
}

/* ---------------- hal_fake.c ---------------- */
static int fake_button; static uint32_t fake_now; static int fake_led, fake_led_writes;
static int fake_read_button(void) { return fake_button; }
static void fake_write_led(int on) { fake_led = on; fake_led_writes++; }
static uint32_t fake_millis(void) { return fake_now; }
static const hal_t fake_hal = {fake_read_button, fake_write_led, fake_millis};
static button_led_t bl;
static void run_ms(uint32_t ms) { while (ms--) { fake_now++; bl_poll(&bl); } }
static void set_button(int v) { fake_button = v; bl_poll(&bl); }   /* the edge is seen at the current ms */

/* ---------------- test_button_led.c ---------------- */
static void setUp(void) { fake_button = 0; fake_now = 1000; fake_led = -1; fake_led_writes = 0; bl_init(&bl, &fake_hal); }

static void test_led_starts_off(void) { TEST_ASSERT_EQUAL_INT(0, fake_led); }
static void test_clean_press_toggles_once(void) {
  set_button(1); run_ms(19); TEST_ASSERT_EQUAL_INT(0, fake_led);       /* not yet stable */
  run_ms(1); TEST_ASSERT_EQUAL_INT(1, fake_led);                       /* accepted at 20 ms */
  run_ms(500); TEST_ASSERT_EQUAL_INT(1, fake_led); TEST_ASSERT_EQUAL_INT(2, fake_led_writes);
}
static void test_bounce_is_ignored(void) {
  for (int i = 0; i < 5; i++) { set_button(!fake_button); run_ms(1); }    /* 5 ms of chatter, ends pressed */
  run_ms(18); TEST_ASSERT_EQUAL_INT(0, fake_led);
  run_ms(1); TEST_ASSERT_EQUAL_INT(1, fake_led);                           /* 20 ms after the last edge */
}
static void test_short_glitch_does_nothing(void) {
  set_button(1); run_ms(10); set_button(0); run_ms(100);
  TEST_ASSERT_EQUAL_INT(0, fake_led); TEST_ASSERT_EQUAL_INT(1, fake_led_writes);
}
static void test_two_presses_toggle_back(void) {
  set_button(1); run_ms(50); set_button(0); run_ms(50); set_button(1); run_ms(50);
  TEST_ASSERT_EQUAL_INT(0, fake_led);
}
static void test_hold_enters_blink_at_2hz(void) {
  set_button(1); run_ms(20 + HOLD_MS - 1); TEST_ASSERT_EQUAL_INT(0, bl.blinking);
  run_ms(1); TEST_ASSERT_TRUE(bl.blinking);
  int writes = fake_led_writes; run_ms(1000); TEST_ASSERT_EQUAL_INT(writes + 4, fake_led_writes);   /* 4 toggles per s */
  set_button(0); run_ms(20); TEST_ASSERT_EQUAL_INT(0, bl.blinking); TEST_ASSERT_EQUAL_INT(0, fake_led);
}
static void test_millis_wraparound(void) {
  fake_now = 0xFFFFFFFFu - 10; bl_init(&bl, &fake_hal);
  set_button(1); run_ms(19); TEST_ASSERT_EQUAL_INT(0, fake_led);
  run_ms(1); TEST_ASSERT_EQUAL_INT(1, fake_led); TEST_ASSERT_TRUE(fake_now < 100);   /* clock wrapped */
}
/* a meta-test: the framework itself must report a failing assertion */
static void failing_on_purpose(void) { TEST_ASSERT_EQUAL_INT(1, 2); }

int main(void) {
  RUN_TEST(test_led_starts_off);
  RUN_TEST(test_clean_press_toggles_once);
  RUN_TEST(test_bounce_is_ignored);
  RUN_TEST(test_short_glitch_does_nothing);
  RUN_TEST(test_two_presses_toggle_back);
  RUN_TEST(test_hold_enters_blink_at_2hz);
  RUN_TEST(test_millis_wraparound);
  int real_tests = mt_tests, real_failures = mt_failures;
  printf("-----------------------\n%d Tests %d Failures 0 Ignored\n%s\n", real_tests, real_failures, real_failures ? "FAIL" : "OK");
  RUN_TEST(failing_on_purpose);                           /* expected to print one FAIL line */
  if (mt_failures != real_failures + 1) { printf("framework did not catch a failure\n"); return 1; }
  if (real_failures) return 1;                             /* non-zero exit fails the CI job */
  printf("PASS\n");
  return 0;
}
```
:::end

## Exercises

:::exercise
Your colleague changes `(uint32_t)(now - b->t_change) >= DEBOUNCE_MS` to `now >= b->t_change + DEBOUNCE_MS`. Which test fails, and why?
:::solution
`test_millis_wraparound`. Near the wrap, `t_change + 20` overflows to a small number, so `now >= ...` is true immediately and the press is accepted after 0 ms instead of 20 (or, depending on values, never). The subtraction form computes elapsed time modulo $2^{32}$, which is always right for intervals under 49 days.
:::end

:::exercise
How would you run these tests in CI, and what makes the job fail?
:::solution
Build them with the host compiler (`gcc -std=c99 -Wall -Werror test_button_led.c -o tests && ./tests`) in any CI runner. The process exit code is the contract: 0 passes the job, anything else fails it. That's why `main` returns 1 if any real test failed, and why the framework is checked against a test that's meant to fail.
:::end

## Quiz

:::quiz
- type: num
  q: With a 20 ms debounce, the last bounce at 104 ms, when is the press accepted, in ms?
  answer: 124
  tol: 0.001
  unit: ms
  py: "104 + 20"
  explain: 20 ms after the last raw change.
- type: num
  q: Elapsed ms computed as uint32 (now − start) with start = 2^32 − 10 and now = 10?
  answer: 20
  tol: 0.001
  unit: ms
  py: "(10 - (2**32 - 10)) % 2**32"
  explain: Unsigned subtraction wraps correctly.
- type: num
  q: LED writes per second in blink mode with a 250 ms half-period?
  answer: 4
  tol: 0.001
  unit: ""
  py: "1000/250"
  explain: Toggle every 250 ms is a 2 Hz blink.
- type: num
  q: When does blink mode start if the press is accepted at 1020 ms and the hold time is 2 s?
  answer: 3020
  tol: 0.001
  unit: ms
  py: "1020 + 2000"
  explain: Hold time after the accepted press.
- type: mc
  q: What lets the module be tested on the host?
  options:
    - compiling with -O0
    - it calls hardware only through a HAL interface that tests can replace with a fake
    - it uses volatile
    - it runs in QEMU
  answer: 1
  explain: The seam between logic and registers.
- type: mc
  q: Which test double records calls and checks they were made correctly?
  options:
    - a stub
    - a fake
    - a mock
    - a spy register
  answer: 2
  explain: Mocks verify interactions; CMock generates them.
:::end

:::verify
assert (10 - (2**32 - 10)) % 2**32 == 20
assert 1020 + 2000 == 3020
:::end
