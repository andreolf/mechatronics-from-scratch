---
id: p05-l02
minutes: 30
summary: Ohm's law plus series and parallel rules solve most resistor networks. You size an LED resistor, derive the voltage divider, see why loading pulls its output down, and write a function that reduces a ladder network and checks itself against a matrix solve.
---

## Ohm's law and the two combination rules

A resistor obeys $v = iR$. Its power is $p = vi = i^2R = v^2/R$, and its power rating (often 0.1 W or 0.25 W for small parts) must cover that with margin.

- **Series** (same current through each): $R = R_1 + R_2 + \dots$
- **Parallel** (same voltage across each): $1/R = 1/R_1 + 1/R_2 + \dots$; for two, $R_1\|R_2 = R_1R_2/(R_1 + R_2)$. A parallel combination is always smaller than its smallest member.

**The voltage divider.** Two resistors in series across $V$ share it in proportion:

$$V_{out} = V\frac{R_2}{R_1 + R_2}.$$

That only holds if nothing draws current from the midpoint. A load $R_L$ sits in parallel with $R_2$, so the real output is $V\frac{R_2\|R_L}{R_1 + R_2\|R_L}$, which is always lower. Rule of thumb: keep $R_L$ at least 100× the divider's resistance, or buffer it with an op-amp (lesson 15).

:::figure widget=divider caption="A 5 V divider feeding a load. The dashed line is the unloaded output; heavy loads (small R_load) pull it down."
:::end

## Worked example

**LED resistor.** A 5 V pin drives a red LED that drops 2.0 V at the 10 mA you want.

1. The resistor sees $5 - 2 = 3$ V, so $R = 3/0.010 = 300$ Ω. 300 Ω is a standard E24 value.
2. Power: $3\times0.010 = 30$ mW, comfortably under a 0.1 W rating.

**Divider loading.** $R_1 = R_2 = 10$ kΩ from 5 V gives 2.5 V unloaded.

1. A 100 kΩ load makes the bottom leg $10\|100 = 9.09$ kΩ.
2. $V_{out} = 5\times9.09/(10 + 9.09) = 2.381$ V, which is 4.8 % low. A 1 MΩ load would cost only 0.5 %.

## Code it from scratch

:::code file=networks.py
```python
import numpy as np

def series(*r):
    return sum(r)

def parallel(*r):
    return 1.0 / sum(1.0 / x for x in r)

def ladder(rs, rp):
    """Input resistance of a ladder: series rs[k] then shunt rp[k], last rung at the far end."""
    r = rp[-1]
    for k in range(len(rp) - 2, -1, -1):
        r = parallel(rp[k], series(rs[k + 1], r))
    return series(rs[0], r)

def ladder_nodal(rs, rp, V=1.0):
    """Same ladder by nodal analysis: returns the source current, so R_in = V / i."""
    n = len(rp)
    G = np.zeros((n, n)); b = np.zeros(n)
    for k in range(n):
        G[k, k] += 1 / rp[k] + 1 / rs[k]
        if k == 0:
            b[0] += V / rs[0]
        else:
            G[k, k - 1] -= 1 / rs[k]; G[k - 1, k] -= 1 / rs[k]; G[k - 1, k - 1] += 1 / rs[k]
    v = np.linalg.solve(G, b)
    return (V - v[0]) / rs[0]

if __name__ == "__main__":
    assert abs((5 - 2.0) / 0.010 - 300) < 1e-9
    assert abs(parallel(10, 100) - 9.0909) < 1e-4
    vout = 5 * parallel(10, 100) / (10 + parallel(10, 100))
    assert abs(vout - 2.380952) < 1e-6
    rs, rp = [1.0, 2.2, 4.7, 1.0], [10.0, 3.3, 6.8, 2.2]
    r_reduce, r_nodal = ladder(rs, rp), 1.0 / ladder_nodal(rs, rp)
    print(f"ladder input resistance {r_reduce:.6f} kOhm (reduction) vs {r_nodal:.6f} (nodal)")
    assert abs(r_reduce - r_nodal) < 1e-12
    assert parallel(1, 2, 3) < 1                       # smaller than the smallest
```
:::end

## Exercises

:::exercise
You need 3.3 V from 5 V for an ADC reference input that draws negligible current. Pick $R_2 = 20$ kΩ. What $R_1$ do you need, and what's the nearest E24 value?
:::solution
$3.3 = 5\times20/(R_1 + 20)$ gives $R_1 = 10.30$ kΩ. E24 has 10 kΩ (3.33 V) and 11 kΩ (3.26 V); 10 kΩ is closer.
:::end

:::exercise
Three 330 Ω resistors in parallel, in series with a 100 Ω resistor. What's the total?
:::solution
$330/3 = 110$ Ω, plus 100 gives 210 Ω.
:::end

## Quiz

:::quiz
- type: num
  q: 5 V supply, LED drops 2.0 V, 10 mA wanted. What resistor in ohms?
  answer: 300
  tol: 0.001
  unit: Ω
  py: "(5-2.0)/0.010"
  explain: The resistor carries the remaining 3 V.
- type: num
  q: What is 10 kΩ ∥ 100 kΩ in kΩ?
  answer: 9.0909
  tol: 0.001
  unit: kΩ
  py: "10*100/110"
  explain: $R_1R_2/(R_1 + R_2)$.
- type: num
  q: 10 k / 10 k divider from 5 V, 100 kΩ load. What is the output in volts?
  answer: 2.38095
  tol: 0.001
  unit: V
  py: "5*(1000/110)/(10+1000/110)"
  explain: The load sits in parallel with R2.
- type: mc
  q: A parallel combination of resistors is always…
  options:
    - larger than the largest
    - smaller than the smallest
    - equal to the average
    - equal to the sum
  answer: 1
  explain: Each extra path adds conductance.
- type: num
  q: Three 330 Ω in parallel plus 100 Ω in series. What's the total in ohms?
  answer: 210
  tol: 0.001
  unit: Ω
  py: "330/3+100"
  explain: 110 + 100.
- type: num
  q: What power in mW does the LED resistor dissipate?
  answer: 30
  tol: 0.001
  unit: mW
  py: "3*10"
  explain: $vi = 3\ \text{V}\times10\ \text{mA}$.
:::end

:::verify
assert abs(20*(5/3.3-1) - 10.30) < 0.005 and abs(5*20/30-3.333)<5e-4 and abs(5*20/31-3.226)<5e-4
:::end
