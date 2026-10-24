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
