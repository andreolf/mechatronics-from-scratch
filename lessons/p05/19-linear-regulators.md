---
id: p05-l19
minutes: 30
summary: A linear regulator makes a clean, fixed voltage by burning the excess as heat. You learn dropout, compute dissipation, efficiency and junction temperature, find the largest safe load for a 12 V to 5 V LDO, and decide when you need a switching regulator instead.
---

## How a linear regulator works

Inside is a pass transistor between input and output, an error amplifier and a voltage reference. The amplifier compares a fraction of the output with the reference and adjusts the pass transistor (negative feedback, lesson 14) so the output stays at its set voltage despite input and load changes.

- **Dropout voltage**: the minimum $V_{in} - V_{out}$ at which it still regulates. Classic 78xx parts need about 2 V; **LDOs** (low-dropout) need 0.1–0.5 V. Below dropout, the output just follows the input minus the dropout.
- **Current**: input current equals output current (plus a small quiescent current), so

$$P_{diss} = (V_{in} - V_{out})I_{load}, \qquad \eta = \frac{V_{out}}{V_{in}}.$$

A 12 V to 5 V linear regulator is at most 42 % efficient, whatever the part.

**Heat.** The junction temperature is $T_J = T_A + P_{diss}\theta_{JA}$, where $\theta_{JA}$ (°C/W) depends on the package and how much copper it's soldered to. Typical values: SOT-23 around 200 °C/W, SOT-223 50–90 °C/W, TO-220 on a heatsink 5–20 °C/W. Above the rated maximum (often 125 °C), the part goes into thermal shutdown or wears out early.

**Stability.** LDOs need the output capacitor the datasheet specifies, often with a range of ESR. The wrong capacitor can make the feedback loop oscillate.

:::figure widget=ldo caption="A 5 V LDO with 0.3 V dropout. Raise the input or the load and watch the dissipation and junction temperature."
:::end

## Worked example

A robot's 12 V battery feeds a 5 V LDO in a SOT-223 package ($\theta_{JA} \approx 50$ °C/W on a good copper area), with 25 °C ambient.

1. At 300 mA: $P = 7\times0.3 = 2.1$ W and $T_J = 25 + 2.1\times50 = 130$ °C. That's above a 125 °C rating.
2. The largest safe load: $(125 - 25)/(50\times7) = 0.286$ A.
3. Efficiency: $5/12 = 41.7$ %. The other 58 % heats the board.
4. Fix: pre-regulate with a buck converter to 7 V (90 % efficient), then the LDO dissipates only $2\times0.3 = 0.6$ W ($T_J = 55$ °C), and you keep its low noise for analogue circuits.
5. Minimum input for regulation: $5 + 0.3 = 5.3$ V. A 2-cell LiPo (6.0–8.4 V) works down to almost flat.

## Code it from scratch

:::code file=ldo.py
```python
import math

def ldo(vin, iload, vout=5.0, drop=0.3, theta=50.0, ta=25.0):
    vo = min(vout, max(0.0, vin - drop))
    p = (vin - vo) * iload
    return vo, p, vo / vin, ta + p * theta

def max_current(vin, vout=5.0, tj_max=125.0, theta=50.0, ta=25.0):
    return (tj_max - ta) / (theta * (vin - vout))

if __name__ == "__main__":
    vo, p, eff, tj = ldo(12.0, 0.3)
    assert vo == 5.0 and abs(p - 2.1) < 1e-12 and abs(tj - 130.0) < 1e-9 and abs(eff - 5 / 12) < 1e-12
    imax = max_current(12.0)
    print(f"max load at 12 V in: {imax*1e3:.0f} mA")
    assert abs(imax - 0.285714) < 1e-6 and abs(ldo(12.0, imax)[3] - 125.0) < 1e-9
    assert abs(ldo(7.0, 0.3)[3] - 55.0) < 1e-9
    assert ldo(5.1, 0.1)[0] < 5.0                     # in dropout the output sags
    # thermal transient: first-order heating with a 30 s thermal time constant
    tau = 30.0
    t_cross = -tau * math.log(1 - (125 - 25) / (130 - 25))
    assert abs(t_cross - 91.4) < 0.1                  # it takes about 1.5 minutes to overheat
```
:::end

## Exercises

:::exercise
A 3.3 V LDO in SOT-23 (200 °C/W) runs from 5 V and feeds a 150 mA microcontroller and radio. What's the junction temperature at 40 °C ambient?
:::solution
$P = 1.7\times0.15 = 0.255$ W; $T_J = 40 + 0.255\times200 = 91$ °C. Acceptable, but radio transmit bursts at 300 mA would push it to 142 °C during long bursts. Use a bigger package.
:::end

:::exercise
Why is the input current of a linear regulator equal to its output current, while a buck converter's input current is smaller?
:::solution
The linear regulator's pass transistor is in series: the same current flows through it, and the voltage difference is burned. A buck converter transfers energy through an inductor, so $V_{in}I_{in} \approx V_{out}I_{out}/\eta$, and with $V_{in} > V_{out}$ the input current is smaller.
:::end

## Quiz

:::quiz
- type: num
  q: Dissipation in W for 12 V in, 5 V out, 0.3 A?
  answer: 2.1
  tol: 0.001
  unit: W
  py: "(12-5)*0.3"
  explain: $(V_{in} - V_{out})I$.
- type: num
  q: Junction temperature in °C with θJA = 50 °C/W at 25 °C ambient?
  answer: 130
  tol: 0.001
  unit: °C
  py: "25+2.1*50"
  explain: $T_A + P\theta_{JA}$.
- type: num
  q: Largest load in mA for a 125 °C junction at 12 V in?
  answer: 285.71
  tol: 0.002
  unit: mA
  py: "(125-25)/(50*7)*1e3"
  explain: $(T_{J,max} - T_A)/(\theta_{JA}(V_{in} - V_{out}))$.
- type: mc
  q: The best possible efficiency of a 12 V to 5 V linear regulator is…
  options:
    - 90 %
    - about 42 %
    - 100 % with an LDO
    - 58 %
  answer: 1
  explain: $V_{out}/V_{in}$.
- type: mc
  q: Dropout voltage is…
  options:
    - the output voltage
    - the minimum input-output difference for regulation
    - the voltage at which it shuts down thermally
    - the reference voltage
  answer: 1
  explain: Below it the output follows the input.
- type: num
  q: Junction temperature in °C of the 3.3 V SOT-23 LDO exercise?
  answer: 91
  tol: 0.001
  unit: °C
  py: "40+(5-3.3)*0.15*200"
  explain: 0.255 W × 200 °C/W + 40 °C.
:::end

:::verify
assert abs(40+1.7*0.3*200-142)<1e-9 and abs(25+0.6*50-55)<1e-12
:::end
