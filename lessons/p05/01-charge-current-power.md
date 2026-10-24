---
id: p05-l01
minutes: 30
summary: Charge, current, voltage and power are the four quantities every circuit question reduces to. You define them precisely, see why a battery's internal resistance limits power, prove the maximum power transfer theorem, and size a battery for a robot.
---

## Four quantities

- **Charge** $q$, in coulombs (C). One electron carries $-1.602\times10^{-19}$ C, so one coulomb is about $6.24\times10^{18}$ electrons.
- **Current** $i = dq/dt$, in amperes (A = C/s). By convention it flows from + to −, opposite to the electrons. Battery capacity in mAh is charge: 1 Ah = 3600 C.
- **Voltage** $v$, in volts (V = J/C): the energy each coulomb gains or loses between two points. It's always *between* two points; "the voltage at a node" means relative to a chosen ground.
- **Power** $p = vi$, in watts (W = J/s). Multiply the voltage across an element by the current through it. With the **passive sign convention** (current entering the + terminal), positive $p$ means the element absorbs power. A resistor always absorbs; a battery that's discharging has negative $p$, meaning it delivers power.

Energy is power integrated over time: $E = \int p\,dt$. A 12 V, 2000 mAh battery stores about $12\times2\times3600 = 86.4$ kJ (24 Wh).

## Internal resistance and maximum power

A real battery behaves like an ideal source $V$ in series with an internal resistance $r$. With load $R$:

$$i = \frac{V}{R + r}, \qquad P_L = i^2R = \frac{V^2R}{(R + r)^2}.$$

Differentiate with respect to $R$ and set it to zero: $(R + r)^2 - 2R(R + r) = 0$, so $R = r$. **Maximum power transfer** happens when the load matches the source resistance, and then $P_{max} = V^2/(4r)$, with exactly half the power wasted inside the source. Efficiency is $R/(R + r)$, so power electronics deliberately runs far from this point. Matching matters for RF and antennas, not for batteries.

:::figure widget=power caption="A battery with internal resistance r driving a load. Move the load: power peaks at R = r (dashed), where efficiency is only 50 %."
:::end

## Worked example

A 12 V pack with $r = 0.5$ Ω and 2000 mAh drives a 6 Ω motor winding (stalled, so it behaves like a resistor).

1. $i = 12/6.5 = 1.846$ A.
2. Load power: $1.846^2\times6 = 20.45$ W. Power heating the battery: $1.846^2\times0.5 = 1.70$ W.
3. Efficiency: $6/6.5 = 92.3$ %.
4. Runtime: $2\ \text{Ah}/1.846\ \text{A} = 1.08$ h (ideal; real capacity drops at high current).
5. Short-circuit current: $12/0.5 = 24$ A. That's why packs need fuses.

## Code it from scratch

:::code file=power.py
```python
import numpy as np

E_CHARGE = 1.602176634e-19

def load_power(V, r, R):
    i = V / (R + r)
    return i, i * i * R, i * i * r

if __name__ == "__main__":
    assert abs(1 / E_CHARGE - 6.2415e18) < 1e15
    i, pl, pr = load_power(12, 0.5, 6)
    assert abs(i - 1.846154) < 1e-6 and abs(pl - 20.4497) < 1e-4 and abs(pr - 1.7041) < 1e-4
    assert abs(pl + pr - 12 * i) < 1e-12               # source power = load + internal losses
    runtime_h = 2.0 / i
    assert abs(runtime_h - 1.0833) < 1e-4
    # maximum power transfer by brute force
    R = np.linspace(0.01, 5, 100_000)
    best = R[np.argmax(load_power(12, 0.5, R)[1])]
    print(f"best load {best:.3f} ohm, P = {load_power(12, 0.5, best)[1]:.2f} W")
    assert abs(best - 0.5) < 1e-3 and abs(load_power(12, 0.5, 0.5)[1] - 72.0) < 1e-9
    assert abs(12 * 2 * 3600 - 86_400) < 1e-9          # 2000 mAh at 12 V in joules
```
:::end

## Exercises

:::exercise
A 3.7 V, 1000 mAh LiPo cell powers a 150 mA microcontroller board. How long does it last, and how much energy is stored in joules?
:::solution
$1\ \text{Ah}/0.15\ \text{A} = 6.67$ h. Energy is $3.7\times1\times3600 = 13\,320$ J (3.7 Wh).
:::end

:::exercise
A resistor reads +5 V across it with 2 mA flowing into its + terminal. A battery has 9 V across it with 2 mA flowing *out of* its + terminal. Find each element's power with the passive sign convention.
:::solution
Resistor: $p = 5\times0.002 = +10$ mW (absorbed). Battery: the current entering its + terminal is −2 mA, so $p = 9\times(-0.002) = -18$ mW: it delivers 18 mW.
:::end

## Quiz

:::quiz
- type: num
  q: 12 V source, r = 0.5 Ω, load 6 Ω. What is the current in amperes?
  answer: 1.84615
  tol: 0.001
  unit: A
  py: "12/6.5"
  explain: $V/(R + r)$.
- type: num
  q: What is the maximum power in watts that this source can deliver to any load?
  answer: 72
  tol: 0.001
  unit: W
  py: "12**2/(4*0.5)"
  explain: $V^2/(4r)$ at $R = r$.
- type: mc
  q: At maximum power transfer, the efficiency is…
  options:
    - 100 %
    - 50 %
    - 25 %
    - it depends on V
  answer: 1
  explain: Equal power goes into r and R.
- type: num
  q: How many coulombs is 2000 mAh?
  answer: 7200
  tol: 0.001
  unit: C
  py: "2*3600"
  explain: 1 Ah = 3600 C.
- type: mc
  q: Under the passive sign convention, negative power means the element…
  options:
    - absorbs power
    - delivers power
    - is broken
    - is a resistor
  answer: 1
  explain: Current is leaving its + terminal.
- type: num
  q: A 3.7 V, 1000 mAh cell feeds 150 mA. How many hours does it last?
  answer: 6.6667
  tol: 0.002
  unit: h
  py: "1/0.15"
  explain: Capacity divided by current.
:::end

:::verify
assert abs(12/0.5 - 24) < 1e-12 and abs(6/6.5 - 0.923) < 5e-4 and abs(3.7*3600 - 13320) < 1e-9
:::end
