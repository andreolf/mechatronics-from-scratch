/* build: gcc -std=c99 -O1 ring_spsc.c -pthread */
#define _POSIX_C_SOURCE 200809L
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>

#define RB_SIZE 256u                                   /* must be a power of two */
#define RB_MASK (RB_SIZE - 1u)
typedef struct {
  uint8_t data[RB_SIZE];
  uint32_t head;                                       /* written only by the producer */
  uint32_t tail;                                       /* written only by the consumer */
  uint32_t dropped;
} ring_t;

static int rb_put(ring_t *r, uint8_t b) {              /* producer (the UART ISR) */
  uint32_t h = r->head;                                /* our own index: plain read is fine */
  uint32_t t = __atomic_load_n(&r->tail, __ATOMIC_ACQUIRE);
  if (h - t == RB_SIZE) { r->dropped++; return 0; }    /* full: drop and count */
  r->data[h & RB_MASK] = b;                            /* 1: write the data */
  __atomic_store_n(&r->head, h + 1, __ATOMIC_RELEASE); /* 2: then publish it */
  return 1;
}
static int rb_get(ring_t *r, uint8_t *b) {             /* consumer (the main loop) */
  uint32_t t = r->tail;
  uint32_t h = __atomic_load_n(&r->head, __ATOMIC_ACQUIRE);
  if (h == t) return 0;                                /* empty */
  *b = r->data[t & RB_MASK];                           /* 1: read the data */
  __atomic_store_n(&r->tail, t + 1, __ATOMIC_RELEASE); /* 2: then free the slot */
  return 1;
}
static uint32_t rb_count(ring_t *r) { return __atomic_load_n(&r->head, __ATOMIC_ACQUIRE) - __atomic_load_n(&r->tail, __ATOMIC_ACQUIRE); }

#define CHECK(c) do { if (!(c)) { printf("FAIL line %d: %s\n", __LINE__, #c); exit(1); } } while (0)
#define TOTAL 10000000u
static ring_t shared;
static void *producer(void *arg) {
  (void)arg;
  for (uint32_t i = 0; i < TOTAL;) if (rb_put(&shared, (uint8_t)(i * 7u + (i >> 8)))) i++;   /* retry when full */
  return NULL;
}

int main(void) {
  /* single-threaded unit tests, starting just below the 32-bit wrap of the indices */
  ring_t r = {{0}, 0xFFFFFFF0u, 0xFFFFFFF0u, 0}; uint8_t b;
  CHECK(!rb_get(&r, &b) && rb_count(&r) == 0);
  for (uint32_t i = 0; i < RB_SIZE; i++) CHECK(rb_put(&r, (uint8_t)i));
  CHECK(rb_count(&r) == RB_SIZE && !rb_put(&r, 99) && r.dropped == 1);   /* all N slots usable, then full */
  CHECK(r.head < r.tail);                                                 /* head wrapped past 2^32 */
  for (uint32_t i = 0; i < RB_SIZE; i++) { CHECK(rb_get(&r, &b)); CHECK(b == (uint8_t)i); }
  CHECK(rb_count(&r) == 0 && !rb_get(&r, &b));
  CHECK((4294967290u & RB_MASK) == 250u && (uint32_t)(10u - 4294967200u) == 106u);

  /* stress: a producer thread and this consumer pass 10 million bytes through a 256-byte ring */
  pthread_t th; CHECK(pthread_create(&th, NULL, producer, NULL) == 0);
  uint32_t got = 0, errors = 0, max_fill = 0;
  while (got < TOTAL) {
    uint32_t c = rb_count(&shared); if (c > max_fill) max_fill = c;
    if (rb_get(&shared, &b)) { if (b != (uint8_t)(got * 7u + (got >> 8))) errors++; got++; }
  }
  pthread_join(th, NULL);
  printf("stress: %u bytes received, %u out of order or corrupted, max fill %u of %u\n", got, errors, max_fill, RB_SIZE);
  CHECK(errors == 0 && max_fill <= RB_SIZE && rb_count(&shared) == 0);
  printf("PASS\n");
  return 0;
}
