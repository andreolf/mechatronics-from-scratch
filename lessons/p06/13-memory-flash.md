---
id: p06-l13
minutes: 35
summary: SRAM forgets at power-off, while flash and EEPROM remember but wear out and can only be erased in blocks. You model the program-and-erase rules of NOR flash, build a wear-levelled, power-fail-safe parameter log with sequence numbers and checksums, and compute how long the memory lasts.
---

## Three kinds of memory

- **SRAM**: six transistors per bit (a latch, lesson 7). Fast, unlimited writes, lost at power-off. Your variables and stack live here.
- **Flash**: one transistor per bit with a floating gate that traps charge. Non-volatile and dense, so your program lives here. But:
  - **Program** can only turn bits from 1 to 0.
  - **Erase** sets a whole page (1–128 KiB) back to all 1s, takes milliseconds, and wears the cells. Typical endurance is $10^4$–$10^5$ erase cycles.
- **EEPROM**: byte-erasable with endurance around $10^6$, but small. Many microcontrollers emulate it in flash with the technique below.

Saving a parameter by erasing the same page each time kills that page after 10 000 saves. If a save happens every minute, that's a week.

## A log-structured store

Instead of overwriting, **append** records:

1. Each record holds a sequence number, the value and a checksum (CRC in Phase 11; a simple sum here).
2. Write records one after another through a ring of pages. Erase a page only when the log wraps around to it, so every page wears evenly: **wear levelling**.
3. At boot, scan every record. The valid one with the highest sequence number is the current value.
4. If power fails mid-write, the half-written record fails its checksum and is ignored, so you get the previous value. Never a corrupt one. The next write goes after the half-written slot, which is simply skipped.

:::figure widget=flash caption="Erase counts across 64 pages. With the ring, wear spreads evenly; with a fixed page, one page dies while 63 stay new."
:::end

## Worked example

Parameters are saved 10 million times over the product's life. Each page holds 16 records, there are 64 pages, and the endurance is 10 000 erases.

1. Page fills: $10^7/16 = 625\,000$ erases in total.
2. Fixed page: 625 000 erases on one page, 62 times its endurance. It wears out after $10^4\times16 = 160\,000$ saves.
3. Ring of 64: $625\,000/64 = 9766$ erases per page, 98 % of life. Just enough. Add pages or records per page for margin.
4. One save every 10 s gives 10 million saves in $10^8$ s, about 3.2 years.

## Code it from scratch

:::code file=flashlog.py
```python
import random

PAGE_RECORDS, N_PAGES = 16, 8
ERASED = None                                          # an erased slot reads as all 1s; model it as None

class Flash:
    def __init__(self):
        self.pages = [[ERASED] * PAGE_RECORDS for _ in range(N_PAGES)]
        self.erases = [0] * N_PAGES
    def program(self, page, slot, rec, cut=False):
        assert self.pages[page][slot] is ERASED, "can only program an erased slot (bits 1 -> 0)"
        seq, val, chk = rec
        self.pages[page][slot] = (seq, val, chk ^ 0xFFFF) if cut else rec   # power cut: checksum incomplete
    def erase(self, page):
        self.pages[page] = [ERASED] * PAGE_RECORDS
        self.erases[page] += 1

def checksum(seq, val):
    return (seq * 31 + val * 7 + 0x1234) & 0xFFFF

class ParamStore:
    def __init__(self, flash):
        self.f = flash
        self.boot()
    def boot(self):
        best, newest, pos = None, 0, None
        for p in range(N_PAGES):
            for s in range(PAGE_RECORDS):
                r = self.f.pages[p][s]
                if r is ERASED:
                    continue
                if r[0] > newest:                     # newest slot written, even if half-written
                    newest, pos = r[0], (p, s)
                if r[2] == checksum(r[0], r[1]) and (best is None or r[0] > best[0]):
                    best = r                          # newest *valid* record
        self.value = best[1] if best else 0
        self.seq = newest
        self.next = self._advance(pos) if pos else (0, 0)
    def _advance(self, pos):
        p, s = pos
        s += 1
        if s == PAGE_RECORDS:
            p, s = (p + 1) % N_PAGES, 0
        return p, s
    def save(self, val, cut=False):
        p, s = self.next
        if s == 0 and self.f.pages[p][0] is not ERASED:
            self.f.erase(p)                            # wrapping onto the oldest page
        self.seq += 1
        self.f.program(p, s, (self.seq, val, checksum(self.seq, val)), cut)
        if not cut:
            self.value = val
        self.next = self._advance((p, s))

if __name__ == "__main__":
    random.seed(7)
    flash = Flash()
    store = ParamStore(flash)
    committed = 0
    for i in range(20_000):
        v = random.randrange(1000)
        if random.random() < 0.01:                      # power fails during this write
            store.save(v, cut=True)
            store = ParamStore(flash)                   # reboot
            assert store.value == committed, (i, store.value, committed)
        else:
            store.save(v)
            committed = v
        if i % 997 == 0:
            assert ParamStore(flash).value == committed
    print("erase counts per page:", flash.erases)
    assert max(flash.erases) - min(flash.erases) <= 1
    assert 10**7 // 16 // 64 == 9765 and 10**4 * 16 == 160_000
```
:::end

## Exercises

:::exercise
Why must the store skip, rather than reuse, a slot that holds a half-written record?
:::solution
Flash can only program erased bits. The half-written slot is no longer erased, so writing over it would AND the old and new bits together. Skip it; it'll be erased when the ring wraps.
:::end

:::exercise
A data logger writes a 32-byte record every second to a 4 MiB flash with 4 KiB sectors and 100 000-cycle endurance. Lifetime with a full ring?
:::solution
4 MiB / 32 B = 131 072 records per pass. 100 000 passes take $1.31\times10^{10}$ s, about 415 years. The flash won't be the limit.
:::end

## Quiz

:::quiz
- type: mc
  q: Programming a flash cell can…
  options:
    - set bits 0 to 1
    - only clear bits from 1 to 0
    - change any bit freely
    - erase a page
  answer: 1
  explain: Setting bits back to 1 needs an erase of the whole page.
- type: num
  q: Saves before a fixed page wears out (16 records per page, 10 000 erases)?
  answer: 160000
  tol: 0.001
  py: "16*10000"
  explain: Records per erase × endurance.
- type: num
  q: Erases per page for 10 million saves over a ring of 64 pages (16 records each)?
  answer: 9765.6
  tol: 0.001
  py: "1e7/16/64"
  explain: Just under the endurance.
- type: mc
  q: At boot the store returns…
  options:
    - the first record in flash
    - the valid record with the highest sequence number
    - the last physical slot
    - the average of all records
  answer: 1
  explain: Sequence numbers order the log.
- type: num
  q: Years to make 10 million saves at one every 10 s?
  answer: 3.17
  tol: 0.01
  unit: years
  py: "1e8/3.156e7"
  explain: $10^8$ s.
- type: mc
  q: SRAM keeps its data…
  options:
    - for 10 years without power
    - only while powered
    - for 10 000 writes
    - only when erased first
  answer: 1
  explain: It's a latch.
:::end

:::verify
assert 4*2**20//32 == 131072
:::end
