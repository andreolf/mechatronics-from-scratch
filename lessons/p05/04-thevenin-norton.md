---
id: p05-l04
minutes: 30
summary: Any linear circuit seen from two terminals is a single source and a single resistor. You derive the Thevenin and Norton equivalents, find them by two "measurements" (open circuit and short circuit), and use them to predict sensor loading and pick a matching load.
---

## The theorems

Look into any two terminals of a linear circuit made of sources and resistors. Whatever is inside, the terminal behaviour is identical to:

- **Thevenin**: a voltage source $V_{th}$ in series with $R_{th}$, or
- **Norton**: a current source $I_N$ in parallel with $R_N = R_{th}$, with $I_N = V_{th}/R_{th}$.

Why it works: the terminal voltage is a linear function of the terminal current, $v = V_{th} - R_{th}i$, a straight line. Two points fix a line:

1. **Open circuit** ($i = 0$): $v = V_{th}$.
2. **Short circuit** ($v = 0$): $i = I_N$. Then $R_{th} = V_{th}/I_N$.

Alternatively, switch off all independent sources (short voltage sources, open current sources) and find the resistance seen at the terminals.

On the bench you can do the same thing: measure the open-circuit voltage, then the voltage with a known load, and solve for $R_{th}$. That's how you characterise a sensor's output impedance.

:::figure widget=divider caption="A divider is a Thevenin source: V_th = V·R2/(R1+R2) and R_th = R1∥R2. Any load sees exactly that pair."
:::end

## Worked example

Take the circuit from lesson 3 with the current source removed, and look into node 2 versus ground.

1. Open-circuit voltage: $v_2 = 4.0$ V (the 10 V source alone).
2. Switch the 10 V source off (short it). From node 2: $R_4 = 4$ kΩ in parallel with $R_3 + R_1\|R_2 = 2 + 0.667 = 2.667$ kΩ, so $R_{th} = 1.6$ kΩ.
3. Norton current: $I_N = 4.0/1.6 = 2.5$ mA. Shorting node 2 to ground draws exactly that.
4. Prediction: inject 1 mA into the terminals and the voltage rises by $1\times1.6 = 1.6$ V to 5.6 V. That matches lesson 3, without re-solving anything.
5. A 1.6 kΩ load would take the maximum power, $V_{th}^2/(4R_{th}) = 2.5$ mW.

## Code it from scratch

:::code file=thevenin.py
```python
import numpy as np

def node2(R_load=None, I_inject=0.0, Vs=10.0):
    """Voltage at node 2 of the lesson 3 circuit, with an optional load to ground at node 2 (kOhm, mA, V)."""
    g4 = 1 / 4 + (0 if R_load is None else 1 / R_load)
    G = np.array([[1 / 1 + 1 / 2 + 1 / 2, -1 / 2], [-1 / 2, 1 / 2 + g4]])
    return np.linalg.solve(G, [Vs / 1, I_inject])[1]

def short_current():
    return node2(R_load=1e-9) / 1e-9

if __name__ == "__main__":
    vth = node2()
    isc = short_current()
    rth = vth / isc
    print(f"Vth {vth:.4f} V, IN {isc:.4f} mA, Rth {rth:.4f} kOhm")
    assert abs(vth - 4.0) < 1e-9 and abs(isc - 2.5) < 1e-6 and abs(rth - 1.6) < 1e-6
    # the equivalent predicts every load exactly
    for RL in (0.1, 1.0, 1.6, 10.0, 470.0):
        assert abs(node2(R_load=RL) - vth * RL / (rth + RL)) < 1e-6
    # and a current injection
    assert abs(node2(I_inject=1.0) - (vth + 1.0 * rth)) < 1e-6
    # bench method: open-circuit voltage plus one loaded reading
    v_loaded = node2(R_load=4.7)
    assert abs(4.7 * (vth / v_loaded - 1) - 1.6) < 1e-9
```
:::end

## Exercises

:::exercise
A sensor reads 2.000 V on a 10 MΩ meter and 1.900 V with a 100 kΩ load. Find its output resistance.
:::solution
$R_{th} = R_L(V_{oc}/V_L - 1) = 100\times(2.000/1.900 - 1) = 5.26$ kΩ.
:::end

:::exercise
Convert a 12 V source with 3 Ω series resistance into its Norton equivalent.
:::solution
$I_N = 12/3 = 4$ A in parallel with 3 Ω.
:::end

## Quiz

:::quiz
- type: num
  q: What is the Thevenin resistance at node 2, in kΩ?
  answer: 1.6
  tol: 0.001
  unit: kΩ
  py: "1/(1/4+1/(2+2/3))"
  explain: $R_4\|(R_3 + R_1\|R_2)$.
- type: num
  q: What is the Norton current in mA?
  answer: 2.5
  tol: 0.001
  unit: mA
  py: "4.0/1.6"
  explain: $V_{th}/R_{th}$.
- type: num
  q: Sensor 2.000 V open circuit, 1.900 V with 100 kΩ. What is R_th in kΩ?
  answer: 5.2632
  tol: 0.002
  unit: kΩ
  py: "100*(2/1.9-1)"
  explain: $R_L(V_{oc}/V_L - 1)$.
- type: mc
  q: To find R_th by switching off sources, a voltage source becomes…
  options:
    - an open circuit
    - a short circuit
    - a 1 Ω resistor
    - a current source
  answer: 1
  explain: An ideal voltage source at 0 V is a wire.
- type: num
  q: What is the maximum power (mW) that node 2 can deliver to a load?
  answer: 2.5
  tol: 0.001
  unit: mW
  py: "4.0**2/(4*1.6)"
  explain: $V_{th}^2/(4R_{th})$, in V²/kΩ = mW.
- type: mc
  q: Thevenin and Norton equivalents of the same circuit…
  options:
    - have different resistances
    - have the same resistance, with $I_N = V_{th}/R_{th}$
    - only apply to AC circuits
    - need a nonlinear circuit
  answer: 1
  explain: They're two forms of the same straight line.
:::end

:::verify
assert abs(2+2/3-2.667)<5e-4 and abs(12/3-4)<1e-12
:::end
