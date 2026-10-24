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
