---
id: p06-l06
minutes: 45
summary: A truth table says what a circuit computes; a simulator says when. You build an event-driven gate-level simulator with propagation delays, watch it produce a glitch that the Boolean algebra says can't exist, simulate a 4-bit adder netlist, and check the same adder in Verilog with Icarus.
---

## Events, not time steps

Digital signals change rarely compared with how finely you'd need to sample time. An **event-driven** simulator only does work when something changes:

1. Keep a priority queue of events (time, net, new value).
2. Pop the earliest event. If the net's value really changes, look up every gate driven by that net.
3. Re-evaluate each of those gates. If its output will change, schedule a new event at *now + gate delay*.
4. Repeat until the queue is empty or a time limit is reached.

This is how Verilog simulators such as Icarus work, and how a logic analyser's view of your circuit can be predicted.

## Glitches

Take $Y = A\cdot A'$, which is always 0 in Boolean algebra. Built from gates, $A'$ comes through an inverter with delay $t_{inv}$. When A rises, for $t_{inv}$ both AND inputs are 1, and $Y$ pulses high. That's a **static hazard**. The same thing happens in real decoders and adders whenever two paths to one gate have different delays.

Glitches don't matter in synchronous logic if the outputs settle before the next clock edge (lesson 11). They matter a lot when a combinational output drives something directly: an asynchronous reset, a chip select, or a clock.

:::figure widget=glitch caption="Y = A·(NOT A) through real gates. Logically Y is always 0, but it pulses high for as long as the inverter delay."
:::end

## Worked example

Inverter delay 2 ns, AND gate delay 1 ns; A rises at $t = 5$ ns.

1. $t = 5$: event A = 1. The AND gate sees (1, 1) because $A'$ still reads 1, so it schedules Y = 1 at $t = 6$.
2. The inverter schedules $A' = 0$ at $t = 7$.
3. $t = 6$: Y = 1. $t = 7$: $A' = 0$, the AND re-evaluates and schedules Y = 0 at $t = 8$.
4. Y is high from 6 to 8 ns: a 2 ns glitch, exactly the inverter delay.
5. When A falls, $A'$ rises 2 ns later and the AND sees (0, 1) throughout: no glitch on the falling edge.

## Code it from scratch

:::code file=eventsim.py
```python
import heapq
from itertools import count

OPS = {"AND": lambda a, b: a & b, "OR": lambda a, b: a | b, "XOR": lambda a, b: a ^ b, "NOT": lambda a: 1 - a}

class Sim:
    def __init__(self):
        self.gates, self.val, self.fanout, self.q, self.trace, self.seq = [], {}, {}, [], {}, count()

    def gate(self, op, out, *ins, delay=1.0):
        g = (op, out, ins, delay)
        self.gates.append(g)
        for n in ins:
            self.fanout.setdefault(n, []).append(g)
        for n in (out, *ins):
            self.val.setdefault(n, 0)

    def settle_initial(self):
        for _ in range(len(self.gates)):                       # propagate initial values without timing
            for op, out, ins, _ in self.gates:
                self.val[out] = OPS[op](*(self.val[i] for i in ins))

    def drive(self, t, net, v):
        heapq.heappush(self.q, (t, next(self.seq), net, v))

    def run(self, t_end=1e9):
        while self.q and self.q[0][0] <= t_end:
            t, _, net, v = heapq.heappop(self.q)
            if self.val.get(net) == v:
                continue
            self.val[net] = v
            self.trace.setdefault(net, []).append((t, v))
            for op, out, ins, d in self.fanout.get(net, []):
                self.drive(t + d, out, OPS[op](*(self.val[i] for i in ins)))

def adder_netlist(sim, n=4):
    sim.val["c0"] = 0
    for i in range(n):
        a, b, c = f"a{i}", f"b{i}", f"c{i}"
        sim.gate("XOR", f"p{i}", a, b); sim.gate("AND", f"g{i}", a, b)
        sim.gate("AND", f"t{i}", f"p{i}", c); sim.gate("OR", f"c{i+1}", f"g{i}", f"t{i}")
        sim.gate("XOR", f"s{i}", f"p{i}", c)

if __name__ == "__main__":
    s = Sim()
    s.gate("NOT", "na", "a", delay=2.0)
    s.gate("AND", "y", "a", "na", delay=1.0)
    s.settle_initial()
    s.drive(5.0, "a", 1); s.drive(14.0, "a", 0)
    s.run()
    print("Y events:", s.trace["y"])
    assert s.trace["y"] == [(6.0, 1), (8.0, 0)]               # one 2 ns glitch on the rising edge only

    for a in range(16):
        for b in range(16):
            sim = Sim(); adder_netlist(sim); sim.settle_initial()
            for i in range(4):
                sim.drive(0.0, f"a{i}", (a >> i) & 1); sim.drive(0.0, f"b{i}", (b >> i) & 1)
            sim.run()
            total = sum(sim.val[f"s{i}"] << i for i in range(4)) + (sim.val["c4"] << 4)
            assert total == a + b, (a, b, total)
    print("event-driven 4-bit adder correct for all 256 input pairs")
```
:::end

The same adder in Verilog, with a testbench that checks all 256 pairs. Our checker runs it with Icarus Verilog (`iverilog -g2012`, then `vvp`):

:::code file=adder4_tb.v
```verilog
`timescale 1ns/1ps
module full_adder(input a, b, c, output s, cout);
  wire p, g, t;
  xor #1 x1(p, a, b);
  and #1 a1(g, a, b);
  and #1 a2(t, p, c);
  or  #1 o1(cout, g, t);
  xor #1 x2(s, p, c);
endmodule

module adder4(input [3:0] a, b, output [3:0] s, output cout);
  wire [4:0] c;
  assign c[0] = 1'b0;
  genvar i;
  generate for (i = 0; i < 4; i = i + 1) begin : fa
    full_adder u(.a(a[i]), .b(b[i]), .c(c[i]), .s(s[i]), .cout(c[i+1]));
  end endgenerate
  assign cout = c[4];
endmodule

module tb;
  reg [3:0] a, b; wire [3:0] s; wire cout;
  integer i, j, errors = 0;
  adder4 dut(.a(a), .b(b), .s(s), .cout(cout));
  initial begin
    for (i = 0; i < 16; i = i + 1)
      for (j = 0; j < 16; j = j + 1) begin
        a = i; b = j; #20;                      // longer than the 9 ns worst-case ripple
        if ({cout, s} !== i + j) begin errors = errors + 1; $display("FAIL %0d + %0d = %0d", i, j, {cout, s}); end
      end
    if (errors == 0) $display("PASS: all 256 sums correct");
    $finish;
  end
endmodule
```
:::end

## Exercises

:::exercise
In the glitch circuit, what happens if the inverter delay is 0.5 ns and the AND gate delay is 1 ns?
:::solution
With *transport* delay (as in our simulator), Y still pulses for 0.5 ns. Real gates and Verilog's default *inertial* delay swallow pulses shorter than the gate's own delay, so the AND gate would filter it out. Inertial delay is a better model of real gates.
:::end

:::exercise
How would you remove the static hazard in $F = AB + A'C$ when B = C = 1 and A changes?
:::solution
Add the consensus term $BC$: $F = AB + A'C + BC$. It stays 1 while A switches, covering the gap between the two original terms.
:::end

## Quiz

:::quiz
- type: mc
  q: An event-driven simulator does work…
  options:
    - at every fixed time step
    - only when a net changes value
    - only at clock edges
    - once per truth-table row
  answer: 1
  explain: Unchanged inputs need no re-evaluation.
- type: num
  q: Glitch width in ns for Y = A·A′ with a 2 ns inverter?
  answer: 2
  tol: 0.001
  unit: ns
  py: "2.0"
  explain: Both inputs are 1 until the inverter catches up.
- type: num
  q: At what time (ns) does Y first go high if A rises at 5 ns and the AND delay is 1 ns?
  answer: 6
  tol: 0.001
  unit: ns
  py: "5+1"
  explain: The AND sees (1, 1) immediately.
- type: mc
  q: A static-1 hazard can be removed by…
  options:
    - adding the consensus term
    - removing the inverter
    - slowing the clock
    - using a NOR gate
  answer: 0
  explain: The redundant term covers the transition.
- type: mc
  q: Glitches are harmless in synchronous logic when…
  options:
    - they are shorter than 1 ns
    - outputs settle before the next clock edge
    - the circuit uses NAND gates
    - the supply is 3.3 V
  answer: 1
  explain: Flip-flops only sample at the edge.
- type: num
  q: Worst-case ripple carry-out time (gate delays) for the 4-bit netlist?
  answer: 9
  tol: 0.001
  py: "2*4+1"
  explain: Carry c_i is ready at 2i + 1.
:::end

:::verify
assert 20 > 9
:::end
