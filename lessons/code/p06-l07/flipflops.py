def sr_latch(S, R, q=0, qb=1):
    """Iterate the cross-coupled NOR pair until it settles (or report a race)."""
    for _ in range(10):
        nq, nqb = int(not (R or qb)), int(not (S or q))
        if (nq, nqb) == (q, qb):
            return q, qb
        q, qb = nq, nqb
    raise RuntimeError("oscillates")

class DLatch:
    def __init__(self):
        self.q, self.qb = 0, 1
    def step(self, d, en):
        self.q, self.qb = sr_latch(d and en, (not d) and en, self.q, self.qb)
        return self.q

class DFF:
    """Master-slave: master transparent when clk = 0, slave when clk = 1."""
    def __init__(self):
        self.m, self.s = DLatch(), DLatch()
    def step(self, d, clk):
        mq = self.m.step(d, not clk)
        return self.s.step(mq, clk)

if __name__ == "__main__":
    assert sr_latch(1, 0) == (1, 0) and sr_latch(0, 1, 1, 0) == (0, 1)
    assert sr_latch(0, 0, 1, 0) == (1, 0) and sr_latch(0, 0, 0, 1) == (0, 1)     # memory
    assert sr_latch(1, 1) == (0, 0)                                              # the forbidden state
    import random
    random.seed(7)
    ff, lat = DFF(), DLatch()
    t_steps = 4000
    clk_prev, q_prev, d_prev, d_at_edge = 0, 0, 0, None
    for t in range(t_steps):
        clk = (t // 20) % 2                                  # 20 sub-steps per half period
        d = int(random.random() < 0.5) if t % 7 == 0 else d_prev
        q = ff.step(d, clk)
        rising = clk == 1 and clk_prev == 0
        if rising:
            d_at_edge = d_prev                               # the value D held just before the edge
        if q != q_prev:
            assert rising, f"flip-flop output changed off an edge at t={t}"
        if d_at_edge is not None:
            assert q == d_at_edge                           # holds the value captured at the edge
        ql = lat.step(d, clk)
        assert not clk or ql == d                           # the latch is transparent while enabled
        clk_prev, q_prev, d_prev = clk, q, d
    print("DFF output changes only on rising edges; the latch is transparent while enabled")
