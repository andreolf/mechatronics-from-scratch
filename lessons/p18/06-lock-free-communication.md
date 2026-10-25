---
id: p18-l06
minutes: 40
summary: A real-time loop must never wait on a lock held by a slower thread. You learn why a shared struct tears, what memory ordering means, and build a deterministic interleaving checker that runs every schedule of a writer and a reader, showing that a naive buffer tears while a seqlock and a triple buffer never do.
---

## The torn read

A control loop reads a pose (several words) that a vision thread writes. If the reader runs between two of the writer's stores, it sees half an old pose and half a new one: a **torn read**. A mutex fixes it but makes the real-time reader wait for the writer (lesson 04). **Lock-free** structures let both sides proceed without ever blocking each other.

## Atomics and memory ordering

An **atomic** operation (a load, a store, an exchange, a compare-and-swap) is indivisible: no other thread sees it half done. But compilers and processors also **reorder** ordinary loads and stores. A writer that stores the data and then sets a flag may, on an ARM core, publish the flag first. C11 and C++ atomics fix the order:

- a **release** store makes every earlier write visible before it,
- an **acquire** load makes every later read happen after it,
- `seq_cst` (the default) gives one global order, at some cost.

A writer that fills the data and then publishes with release, and a reader that checks with acquire and then reads the data, always see complete data. This lesson's checker assumes sequentially consistent memory, which is exactly what correct atomics give you.

## Two lock-free patterns

**Seqlock.** The writer increments a sequence counter (odd: writing), writes the data, increments again (even). The reader reads the counter, the data, the counter again, and retries if the counter was odd or changed. The writer never waits; the reader may retry.

**Triple buffer.** Three slots: the writer owns a back slot, the reader owns a front slot, and a shared middle index plus a "new data" flag sit in one atomic word. The writer fills its back slot and atomically exchanges it with the middle; the reader, if the flag is set, atomically exchanges its front with the middle. Neither waits nor retries, and the reader always gets the latest complete sample, ideal for a fast loop reading a slower producer.

:::figure widget=triplebuf caption="Step a writer and a reader through one interleaving. Pick naive, seqlock or triple buffer, and the readout says whether the reader's value is torn."
:::end

## Worked example

The writer publishes two samples, 1 and 2, each written as two words; the reader reads once (the seqlock reader may try twice). The checker runs every interleaving:

1. Naive shared struct: 56 interleavings, 24 of them torn, for example $(0, 1)$, $(1, 0)$ and $(2, 1)$.
2. Seqlock: 46378 interleavings, 0 torn. The reader sees $(0, 0)$, $(1, 1)$ or $(2, 2)$, or gives up after two tries and reads again next cycle.
3. Triple buffer: 330 interleavings, 0 torn, and the reader always gets a complete sample.

## Code it from scratch

:::code file=interleavings.py
```python
def naive_writer(m, vals):
    for v in vals:
        m["a"] = v; yield                                   # each yield is a point where the other thread may run
        m["b"] = v; yield

def naive_reader(m, out):
    a = m["a"]; yield
    b = m["b"]; yield
    out.append((a, b))

def seq_writer(m, vals):
    for v in vals:
        m["seq"] += 1; yield                                # odd: write in progress
        m["a"] = v; yield
        m["b"] = v; yield
        m["seq"] += 1; yield                                # even: consistent again

def seq_reader(m, out, tries=2):
    for _ in range(tries):
        s1 = m["seq"]; yield
        a = m["a"]; yield
        b = m["b"]; yield
        s2 = m["seq"]; yield
        if s1 % 2 == 0 and s1 == s2:
            out.append((a, b)); return
    out.append("gave up")                                   # the writer kept it busy; try again next cycle

def tb_writer(m, vals):
    for v in vals:
        m["slot"][m["back"]] = [v, None]; yield             # write the back buffer, which only the writer touches
        m["slot"][m["back"]][1] = v; yield
        m["back"], m["mid"] = m["mid"][0], (m["back"], True); yield   # one atomic exchange publishes it

def tb_reader(m, out):
    if m["mid"][1]:                                         # new data? swap it to the front with one atomic exchange
        m["front"], m["mid"] = m["mid"][0], (m["front"], False)
    yield
    a = m["slot"][m["front"]][0]; yield
    b = m["slot"][m["front"]][1]; yield
    out.append((a, b))

def init(kind):
    if kind == "triple": return {"slot": [[0, 0], [0, 0], [0, 0]], "back": 0, "mid": (1, False), "front": 2}
    return {"a": 0, "b": 0, "seq": 0}

def explore(writer, reader, kind, vals=(1, 2)):
    """run every interleaving of the two threads (sequentially consistent memory) and collect what the reader saw"""
    results = []
    def replay(schedule):
        m = init(kind); out = []; th = [writer(m, vals), reader(m, out)]; alive = [True, True]
        for who in schedule:
            try: next(th[who])
            except StopIteration: alive[who] = False
        return alive, out
    def dfs(schedule):
        alive, out = replay(schedule)
        live = [i for i in (0, 1) if alive[i]]
        for who in live: dfs(schedule + [who])           # branch: either thread may take the next step
        if not live: results.append(out[0] if out else None)
    dfs([])
    return results

def torn(r): return isinstance(r, tuple) and r[0] != r[1]

def test_all():
    for name, w, r, kind in [("naive shared struct", naive_writer, naive_reader, "plain"),
                             ("seqlock", seq_writer, seq_reader, "plain"),
                             ("triple buffer", tb_writer, tb_reader, "triple")]:
        res = explore(w, r, kind)
        seen = sorted({str(x) for x in res})
        nt = sum(torn(x) for x in res)
        print(f"{name}: {len(res)} interleavings, {nt} torn reads, reader saw {seen}")
        if name.startswith("naive"): assert nt > 0
        else: assert nt == 0 and any(isinstance(x, tuple) and x[0] == 2 for x in res)

test_all()
print("PASS")
```
:::end

## In practice

In C++ use `std::atomic` with explicit `memory_order_release` and `memory_order_acquire`, and check `is_lock_free()`. The ros2_control framework ships `realtime_tools::RealtimeBuffer` and `RealtimePublisher` for passing data between non-real-time and real-time threads, and `boost::lockfree::spsc_queue` is a standard single-producer single-consumer ring. Test with ThreadSanitizer, and with a model checker such as CDSChecker or TLA+ for anything subtle.

## Exercises

:::exercise
Why can the seqlock reader's retry loop starve in principle, and why does the triple buffer not have this problem?
:::solution
If the writer writes continuously, every read attempt overlaps a write and is retried. The triple-buffer reader never retries: it always has a complete slot of its own, at worst one sample old.
:::end

:::exercise
The writer stores the data, then stores `ready = 1` with a relaxed (unordered) store. What can go wrong on a weakly ordered processor?
:::solution
The `ready` store can become visible before the data stores, so a reader that sees `ready == 1` may read old data. Make the flag store a release and the reader's load an acquire.
:::end

## Quiz

:::quiz
- type: num
  q: Interleavings of a 2-step writer and a 2-step reader (choose 2 of 4)?
  answer: 6
  tol: 0.001
  py: "math.comb(4,2)"
  explain: Positions of the reader's steps among 4.
- type: num
  q: Buffers in a triple buffer?
  answer: 3
  tol: 0.001
  py: "3"
  explain: Front, middle, back.
- type: num
  q: Torn reads the checker found for the naive struct?
  answer: 24
  tol: 0.001
  py: "24"
  explain: Out of 56 interleavings.
- type: num
  q: Seqlock counter value after the writer has published 5 samples, starting at 0?
  answer: 10
  tol: 0.001
  py: "5*2"
  explain: Two increments per write.
- type: mc
  q: A seqlock reader must retry if…
  options:
    - the counter was odd or changed during the read
    - the counter is even
    - the data is zero
    - the writer is idle
  answer: 0
  explain: Either means a write overlapped.
- type: mc
  q: To publish data safely with a flag, the flag store should use…
  options:
    - release ordering, read with acquire
    - relaxed ordering on both sides
    - a plain volatile int
    - a sleep between the stores
  answer: 0
  explain: Release-acquire orders the data before the flag.
:::end
