---
id: p06-l07
minutes: 40
summary: Feedback gives logic memory. You derive the SR latch from two cross-coupled NOR gates, build a gated D latch and a master-slave D flip-flop, simulate them, and prove that a flip-flop's output changes only on rising clock edges while a latch is transparent.
---

## The SR latch

Connect two NOR gates so each one's output feeds the other's input:

$$Q = (R + \bar Q)', \qquad \bar Q = (S + Q)'.$$

- $S = 1, R = 0$ forces $\bar Q = 0$ and then $Q = 1$: **set**.
- $S = 0, R = 1$ forces $Q = 0$: **reset**.
- $S = R = 0$: each gate holds the other, so the latch **remembers** its last state. That's one bit of memory from two gates.
- $S = R = 1$ forces both outputs to 0, and releasing both at once leaves the result to a race between the gates. That input is forbidden.

## D latch and D flip-flop

A **gated D latch** adds steering logic so $S = DE$ and $R = D'E$. While the enable $E$ is high, Q follows D (the latch is **transparent**). When E falls, Q holds. No forbidden input is possible.

A **D flip-flop** is two D latches in series: the **master** is enabled when the clock is low and the **slave** when it's high. While CLK is low the master tracks D but the slave holds. At the rising edge the master freezes and the slave copies it. So Q takes the value D had *at the rising edge*, and nothing D does at other times reaches Q. Every register, counter and state machine (lesson 8) is built on this edge-triggered behaviour.

Two timing rules come with it (lesson 11): D must be stable for a **setup time** before the edge and a **hold time** after it.

:::figure widget=dff caption="Clock, data, a D latch's output and a D flip-flop's output. The latch follows D whenever the clock is high; the flip-flop changes only at rising edges (dotted)."
:::end

## Worked example

Trace a master-slave flip-flop. CLK rises at $t = 1, 3, 5$; D goes 0 → 1 at $t = 1.5$ and back to 0 at $t = 2.5$.

1. $t < 1$ (CLK low, from $t = 0$): the master is transparent and holds D = 0. The slave is closed and holds Q = 0.
2. $t = 1$ (rising edge): the master closes on 0, and the slave opens and copies 0. Q = 0.
3. $t = 1.5$: D = 1, but the master is closed (CLK high). Nothing changes.
4. $t = 2$ (CLK falls): the master opens and sees D = 1; the slave closes. Q stays 0.
5. $t = 2.5$: D = 0 again. The master follows, so it holds 0.
6. $t = 3$ (rising edge): the slave copies 0. **The 1 pulse never reached Q**, because it didn't span a rising edge. A transparent latch on CLK would have passed it through between $t = 1.5$ and 2.

## Code it from scratch

:::code file=flipflops.py
```python
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
```
:::end

The same flip-flop as a Verilog behavioural model, checked by Icarus:

:::code file=dff_tb.v
```verilog
`timescale 1ns/1ps
module dff(input clk, d, output reg q);
  always @(posedge clk) q <= d;
endmodule

module tb;
  reg clk = 0, d = 0; wire q; integer errors = 0; reg expected = 0;
  dff u(.clk(clk), .d(d), .q(q));
  always #5 clk = ~clk;                       // 10 ns period
  always @(posedge clk) expected <= d;
  initial begin
    #12 d = 1; #3 d = 0;                      // a short pulse between edges: must not appear on q
    #20 d = 1; #40 d = 0; #30;
    $finish;
  end
  always @(negedge clk) if (q !== expected) begin errors = errors + 1; $display("FAIL at %0t", $time); end
  final if (errors == 0) $display("PASS: q only changes on rising edges");
endmodule
```
:::end

## Exercises

:::exercise
Why can't a D latch reach the SR latch's forbidden state?
:::solution
$S = DE$ and $R = D'E$ can't both be 1, because D and D′ are never both 1.
:::end

:::exercise
A design uses a D latch instead of a flip-flop in a counter. What goes wrong?
:::solution
While the enable is high the latch is transparent, so the incremented value feeds straight back and increments again, racing through many counts in one half-period. Edge triggering breaks that loop.
:::end

## Quiz

:::quiz
- type: mc
  q: With S = R = 0, an SR latch…
  options:
    - resets
    - holds its previous state
    - sets
    - oscillates
  answer: 1
  explain: The cross-coupled feedback remembers.
- type: mc
  q: A D latch with enable high is…
  options:
    - edge-triggered
    - transparent: Q follows D
    - frozen
    - in the forbidden state
  answer: 1
  explain: It's level-sensitive.
- type: mc
  q: A master-slave D flip-flop captures D…
  options:
    - continuously
    - at the rising clock edge
    - while the clock is low
    - at the falling edge only if D is 1
  answer: 1
  explain: The master closes and the slave copies.
- type: num
  q: How many gates in a NOR-based SR latch?
  answer: 2
  tol: 0.001
  py: "2"
  explain: Two cross-coupled NORs.
- type: num
  q: In the worked example, Q after the edge at t = 3?
  answer: 0
  tol: 0.001
  py: "0"
  explain: The pulse didn't span an edge.
- type: mc
  q: Setup time is…
  options:
    - how long D must be stable before the clock edge
    - the clock period
    - the gate delay of the slave
    - how long after the edge Q changes
  answer: 0
  explain: Hold time is the stability required after the edge.
:::end

:::verify
assert all(not ((d and e) and ((not d) and e)) for d in (0,1) for e in (0,1))
:::end
