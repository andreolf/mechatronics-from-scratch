---
id: p10-l18
minutes: 35
summary: A UART interrupt produces bytes faster than the main loop wants to handle them one at a time, and a ring buffer is the standard way to pass them across without locks. You derive head and tail indices with power-of-two masking and why one producer and one consumer need no critical section, implement a lock-free SPSC ring buffer with acquire and release ordering, and stress-test it with two threads passing ten million bytes with none lost or reordered.
---

## The problem

A UART receive interrupt fires once per byte, at 115 200 baud about every 87 µs. The ISR must be short (lesson 09), so it can't parse a protocol. The main loop parses, but it might be busy for a few milliseconds. In between, the bytes have to wait somewhere. A **ring buffer** (circular FIFO) is a fixed array with two indices: the producer (the ISR) writes at `head`, the consumer (the main loop) reads at `tail`, and both wrap around.

## Indices that never wrap

The cleanest version keeps `head` and `tail` as free-running unsigned counters that are never reset, and wraps only when indexing, with a power-of-two size $N$:

$$\text{count} = \text{head} - \text{tail}, \qquad \text{slot} = \text{index} \;\&\; (N - 1).$$

Unsigned subtraction is modulo $2^{32}$, so `head - tail` is correct even after the counters overflow. The buffer is **empty** when count = 0 and **full** when count = $N$, so all $N$ slots are usable (the "keep one slot empty" trick is only needed when the indices are themselves wrapped). Masking with $N-1$ replaces a slow modulo, and works only when $N$ is a power of two.

## Why no lock is needed

With exactly **one producer and one consumer** (SPSC), each index has a single writer: only the producer writes `head`, only the consumer writes `tail`. Each reads the other's index, and a 32-bit aligned load or store is atomic (lesson 10). Two orderings make it correct:

- the producer writes the **data first, then publishes** the new `head` (a *release* store), so the consumer never sees an index pointing at unwritten data;
- the consumer reads `head` with an *acquire* load before reading the data, and publishes the new `tail` only **after** it has copied the byte out.

On a single-core Cortex-M with an ISR, the compiler is the main reorderer, and `volatile` or a compiler barrier is enough. On multi-core systems, or with DMA, you need real memory barriers, which is what C11 / GCC `__atomic` acquire and release give you portably. The test below uses two OS threads on a multi-core host, which is a harsher test than an MCU will ever give.

:::figure widget=ringbuf caption="Head (producer, lime) and tail (consumer, blue) chasing each other around a 16-slot ring. Change the producer and consumer rates; when the producer laps the consumer, bytes are dropped and counted."
:::end

## Sizing

If the producer delivers bytes at rate $r$ and the consumer can be away for at most $t_{\max}$, the buffer must hold $r\,t_{\max}$ bytes, rounded up to a power of two. When it's full, decide explicitly: drop the new byte and count it (usual for UART receive), or overwrite the oldest (usual for logs).

## Worked example

115 200 baud 8N1 is 11 520 bytes/s. The main loop can be busy up to 15 ms.

1. Worst backlog: $11\,520 \times 0.015 = 173$ bytes, so $N = 256$.
2. With head = 4 294 967 290 and tail = 4 294 967 200, count = 90; after head wraps to 10, count = $10 - 4\,294\,967\,200 \bmod 2^{32} = 106$. Still right.
3. Slot for index 4 294 967 290 with $N$ = 256: $4\,294\,967\,290 \;\&\; 255 = 250$.

## Code it from scratch

:::code file=ring_spsc.c
```c
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
```
:::end

## Exercises

:::exercise
A teammate adds a second ISR (a CAN receive) that also calls `rb_put` on the same buffer. What breaks?
:::solution
Now there are two producers writing `head`. If the CAN ISR preempts the UART ISR between its read of `head` and its store, both write the same slot and one byte is lost, the lost-update race from lesson 10. Fixes: one buffer per producer, give both ISRs the same priority so they can't preempt each other, or a critical section in `rb_put`.
:::end

:::exercise
Why does `rb_get` publish the new `tail` only after copying the byte out?
:::solution
Publishing `tail` frees the slot. If it happened first, the producer could see the space, write a new byte into that very slot, and the consumer would then read the new byte instead of the old one: data corruption without any lost count.
:::end

## Quiz

:::quiz
- type: num
  q: Bytes per second at 115 200 baud, 8N1 (10 bits per byte)?
  answer: 11520
  tol: 0.001
  unit: bytes/s
  py: "115200/10"
  explain: Start, 8 data, stop.
- type: num
  q: Backlog in bytes if the main loop is away for 15 ms at that rate?
  answer: 172.8
  tol: 0.001
  unit: bytes
  py: "11520*0.015"
  explain: Round up to a power of two, 256.
- type: num
  q: Slot index of counter value 1000 in a 64-entry ring?
  answer: 40
  tol: 0.001
  unit: ""
  py: "1000 & 63"
  explain: Masking with N − 1.
- type: num
  q: head = 5, tail = 4294967291 (both 32-bit). How many bytes are in the buffer?
  answer: 10
  tol: 0.001
  unit: bytes
  py: "(5 - 4294967291) % 2**32"
  explain: Unsigned subtraction wraps.
- type: mc
  q: Why must the ring size be a power of two for masking?
  options:
    - for alignment
    - index & (N−1) equals index mod N only when N is a power of two
    - to save RAM
    - the DMA requires it
  answer: 1
  explain: The mask keeps the low bits.
- type: mc
  q: In the producer, what is the correct order?
  options:
    - publish head, then write the data
    - write the data, then publish head with a release store
    - either order
    - disable interrupts first
  answer: 1
  explain: The consumer must never see an index pointing at unwritten data.
:::end

:::verify
assert 115200 / 10 * 0.015 < 256
assert (4294967290 & 255) == 250 and (10 - 4294967200) % 2**32 == 106
:::end
