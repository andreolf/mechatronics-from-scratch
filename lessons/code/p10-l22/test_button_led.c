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
