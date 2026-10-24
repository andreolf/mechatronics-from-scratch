---
id: p06-l04
minutes: 30
summary: Every logic gate is a pair of transistor networks fighting over one wire. You derive the CMOS pull-up/pull-down duality, model NAND and NOR as switch graphs, check their truth tables, and compute why static power is nearly zero while switching power grows with frequency.
---

## Transistors as switches

In CMOS logic both transistor types act as switches (lesson 13 of Phase 05):

- **NMOS** conducts when its gate is high. It's good at pulling the output down to ground.
- **PMOS** conducts when its gate is low. It's good at pulling the output up to VDD.

A gate has a **pull-up network** of PMOS between VDD and the output, and a **pull-down network** of NMOS between the output and ground. The two are **duals**: where one has transistors in series, the other has them in parallel. For every input combination exactly one network conducts, so the output is always driven firmly to 0 or 1.

- **Inverter**: one PMOS above, one NMOS below.
- **NAND**: NMOS in series (output pulled low only if A *and* B are high) and PMOS in parallel.
- **NOR**: NMOS in parallel and PMOS in series.

CMOS gates are naturally *inverting*. AND is a NAND followed by an inverter, which is why NAND and NOR are the basic cells.

## Power

- **Static**: with one network always off, no DC current flows from VDD to ground. Only leakage remains (nanoamps per gate, though that adds up across a billion transistors).
- **Dynamic**: every output transition charges or discharges the load capacitance $C$. Energy $CV^2$ is drawn from the supply per full charge-discharge cycle, so

$$P_{dyn} = \alpha CV^2f,$$

with activity factor $\alpha$ (the fraction of cycles in which the node switches). That's why lowering the supply voltage is the most effective power saving, and why microcontrollers slow their clocks in sleep modes.

:::figure widget=cmos caption="A NAND or NOR gate as transistor switches. Toggle A and B: exactly one network conducts, and the output follows."
:::end

## Worked example

A microcontroller core has an effective switched capacitance of 1 nF (all its gates together, with α included), runs at 48 MHz and 1.2 V.

1. $P = 10^{-9}\times1.2^2\times48\times10^6 = 69.1$ mW.
2. At 0.9 V and the same clock: $P = 38.9$ mW, 44 % less, from the $V^2$ term alone.
3. Clock at 1 MHz in a low-power mode: $P = 1.44$ mW at 1.2 V. Leakage then becomes a noticeable share.
4. Each gate drives about 2 fF; at 1.2 V one transition costs $\tfrac12CV^2 = 1.44$ fJ.

## Code it from scratch

:::code file=cmos.py
```python
from itertools import product

def conducts(net, inputs):
    """net is ('n', var) / ('p', var) for a transistor, or ('series'|'parallel', [nets])."""
    kind = net[0]
    if kind == "n":
        return inputs[net[1]] == 1
    if kind == "p":
        return inputs[net[1]] == 0
    parts = [conducts(x, inputs) for x in net[1]]
    return all(parts) if kind == "series" else any(parts)

def dual(net):
    """Swap series/parallel and NMOS/PMOS: builds the pull-up from the pull-down."""
    kind = net[0]
    if kind in ("n", "p"):
        return ("p" if kind == "n" else "n", net[1])
    return ("parallel" if kind == "series" else "series", [dual(x) for x in net[1]])

def gate(pulldown):
    pullup = dual(pulldown)
    def f(**inputs):
        up, down = conducts(pullup, inputs), conducts(pulldown, inputs)
        assert up != down, "contention or floating output"
        return 1 if up else 0
    return f

NAND = gate(("series", [("n", "A"), ("n", "B")]))
NOR = gate(("parallel", [("n", "A"), ("n", "B")]))
AOI = gate(("parallel", [("series", [("n", "A"), ("n", "B")]), ("n", "C")]))   # (AB + C)'

if __name__ == "__main__":
    for a, b in product((0, 1), repeat=2):
        assert NAND(A=a, B=b) == 1 - (a & b) and NOR(A=a, B=b) == 1 - (a | b)
    for a, b, c in product((0, 1), repeat=3):
        assert AOI(A=a, B=b, C=c) == 1 - ((a & b) | c)
    P = lambda C, V, f: C * V * V * f
    assert abs(P(1e-9, 1.2, 48e6) - 0.06912) < 1e-12 and abs(P(1e-9, 0.9, 48e6) / P(1e-9, 1.2, 48e6) - 0.5625) < 1e-12
    print("NAND, NOR and AND-OR-INVERT truth tables verified; one network always conducts")
```
:::end

## Exercises

:::exercise
Design the pull-down and pull-up networks for $Y = (A(B + C))'$.
:::solution
Pull-down: NMOS A in series with (NMOS B parallel NMOS C). Pull-up (dual): PMOS A in parallel with (PMOS B in series with PMOS C). Six transistors.
:::end

:::exercise
What happens if both networks conduct at once, and when can that happen briefly?
:::solution
Current flows straight from VDD to ground (short-circuit or "crowbar" current). It happens for a moment during slow input transitions, when the input sits mid-way and both transistor types are partly on, which is another reason to keep edges fast and use Schmitt inputs for slow signals.
:::end

## Quiz

:::quiz
- type: mc
  q: In a CMOS NAND gate, the NMOS transistors are…
  options:
    - in parallel
    - in series
    - absent
    - connected to VDD
  answer: 1
  explain: The output is pulled low only when A and B are both high.
- type: mc
  q: A PMOS transistor conducts when its gate is…
  options:
    - high
    - low
    - floating
    - at mid-rail only
  answer: 1
  explain: It's the complement of NMOS.
- type: num
  q: Dynamic power in mW for C = 1 nF, V = 1.2 V, f = 48 MHz?
  answer: 69.12
  tol: 0.001
  unit: mW
  py: "1e-9*1.2**2*48e6*1e3"
  explain: $CV^2f$.
- type: num
  q: Ratio of dynamic power at 0.9 V to 1.2 V?
  answer: 0.5625
  tol: 0.001
  py: "(0.9/1.2)**2"
  explain: Power scales with $V^2$.
- type: mc
  q: The static power of an ideal CMOS gate is…
  options:
    - large
    - nearly zero, because one network is always off
    - proportional to frequency
    - the same as dynamic power
  answer: 1
  explain: Only leakage remains.
- type: num
  q: How many transistors does a 2-input CMOS NOR gate use?
  answer: 4
  tol: 0.001
  py: "4"
  explain: Two NMOS in parallel and two PMOS in series.
:::end

:::verify
assert abs(0.5*2e-15*1.44 - 1.44e-15) < 1e-20 and abs(1e-9*1.44*1e6*1e3 - 1.44) < 1e-9
:::end
