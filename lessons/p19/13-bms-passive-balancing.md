---
id: p19-l13
minutes: 35
summary: Cells in series drift apart, and the string is only as good as its weakest and fullest cells. You simulate passive balancing, where a battery management system bleeds the high cells through resistors, measure how fast the voltage spread shrinks and how much energy becomes heat, and show the string can accept more charge afterwards.
---

## Why cells drift

Cells in a series string carry the same current, but they differ slightly in capacity, self-discharge and temperature. Over weeks the states of charge spread. During charging, the fullest cell reaches its maximum voltage first and charging must stop; during discharge, the emptiest cell reaches its cut-off first. A spread of a few percent can cost a noticeable share of the pack's usable capacity, and an unbalanced cell is more likely to be overcharged.

## Bleeding the high cells

**Passive balancing** puts a resistor and a switch across each cell. The battery management system (BMS) turns on the bleed for every cell whose voltage is more than a threshold above the lowest, wasting its excess charge as heat until the voltages match:

$$i_{bleed} = \frac{v_{cell}}{R_{bleed}}, \qquad P = \frac{v_{cell}^2}{R_{bleed}}.$$

Bleed currents are small (tens to a few hundred mA), so balancing is slow and typically runs near the top of charge or while the pack rests, when OCV differences reflect SOC differences. **Active balancing** shuttles charge between cells with inductors or capacitors instead of burning it, at higher cost and complexity.

:::figure widget=balancebars caption="Six cells in series with their voltages. Toggle balancing, change the bleed resistor and threshold, and step time forward; bleeding cells are highlighted."
:::end

## Worked example

Six illustrative cells, SOC 90 to 97 %, capacities 2.9 to 3.05 Ah, 33 Ω bleed resistors, 5 mV threshold:

1. Initial spread 74.1 mV (7.0 % SOC).
2. Below 10 mV after 1.47 h; 5.0 mV (the threshold) after 12 h, with 2.687 Wh turned into heat.
3. The lowest cell is never touched (SOC 0.9000 before and after).
4. The charge the string can accept before its fullest cell is full rises from 0.092 Ah to 0.277 Ah.
5. Each bleed resistor at 4.0 V draws 121 mA and dissipates 485 mW, which the board layout must handle.

## Code it from scratch

:::code file=balance.py
```python
import numpy as np

def ocv(s): return 3.0 + 1.2 * s - 0.25 * np.exp(-12 * s) + 0.05 * np.sin(3 * s)   # illustrative curve (Lesson 11)

def balance(soc0, q_ah, r_bleed=33.0, threshold_mv=5.0, hours=12.0, dt=10.0):
    """passive balancing at rest: every cell more than threshold above the lowest cell voltage bleeds through its resistor."""
    soc = np.array(soc0, float); q = np.array(q_ah, float) * 3600; heat = 0.0; t = 0.0; log = []
    while t < hours * 3600:
        v = ocv(soc); on = v > v.min() + threshold_mv / 1000
        i = np.where(on, v / r_bleed, 0.0); heat += np.sum(i * v) * dt
        soc -= i * dt / q; t += dt; log.append(1000 * (v.max() - v.min()))
    return soc, heat / 3600, np.array(log)

def pack_window(soc, q_ah):
    q = np.array(q_ah); down = np.min(soc * q); up = np.min((1 - soc) * q)   # Ah available before any cell hits a limit
    return down, up

def test_balancing():
    soc0 = [0.95, 0.92, 0.97, 0.90, 0.94, 0.96]; q = [3.0, 2.9, 3.05, 3.0, 2.95, 3.0]
    v0 = 1000 * (ocv(np.array(soc0)).max() - ocv(np.array(soc0)).min())
    soc, wh, log = balance(soc0, q)
    print(f"initial spread {v0:.1f} mV ({100 * (max(soc0) - min(soc0)):.1f} % SOC)")
    hrs = np.argmax(log < 10) * 10 / 3600
    print(f"after 12 h at 33 ohm: spread {log[-1]:.1f} mV, below 10 mV after {hrs:.2f} h, {wh:.3f} Wh turned into heat")
    print(f"lowest cell untouched: {soc0[3]:.4f} -> {soc[3]:.4f}")
    d0, u0 = pack_window(np.array(soc0), q); d1, u1 = pack_window(soc, q)
    print(f"charge the string can still accept before the fullest cell is full: {u0:.3f} Ah -> {u1:.3f} Ah")
    assert log[-1] < 0.25 * v0 and log[-1] < 10 and abs(soc[3] - soc0[3]) < 1e-12 and u1 > u0

def test_bleed_current():
    print(f"bleed current at 4.0 V through 33 ohm: {1000 * 4.0 / 33:.0f} mA, {1000 * 4.0**2 / 33:.0f} mW per cell")

test_balancing()
test_bleed_current()
print("PASS")
```
:::end

## In practice

Cell-monitoring ICs (from Analog Devices, Texas Instruments, NXP and others) measure every cell voltage and drive internal or external bleed switches; the BMS firmware decides when to balance. Open-source BMS projects such as foxBMS (a research platform from Fraunhofer IISB) show complete implementations. Thermal limits often cap how many cells can bleed at once.

## Exercises

:::exercise
How long does a 100 mA bleed take to remove 2 % of a 3 Ah cell's charge?
:::solution
$0.02 \times 3 = 0.06$ Ah, so $0.06 / 0.1 = 0.6$ h, 36 minutes.
:::end

:::exercise
Why balance at the top of charge rather than mid-range for an LFP pack?
:::solution
The LFP OCV curve is flat in the middle, so small voltage differences hide large SOC differences. Near full the curve steepens and voltage reveals which cells are high.
:::end

## Quiz

:::quiz
- type: num
  q: Bleed current at 4.1 V through 47 Ω (mA)?
  answer: 87.2
  tol: 0.003
  py: "1000*4.1/47"
  explain: v / R.
- type: num
  q: Power in a 33 Ω bleed resistor at 4.2 V (W)?
  answer: 0.535
  tol: 0.003
  py: "4.2**2/33"
  explain: v² / R.
- type: num
  q: Hours to bleed 0.15 Ah at 120 mA?
  answer: 1.25
  tol: 0.002
  py: "0.15/0.12"
  explain: Charge over current.
- type: num
  q: Energy wasted bleeding 0.1 Ah at about 4 V (Wh)?
  answer: 0.4
  tol: 0.002
  py: "0.1*4"
  explain: Charge times voltage.
- type: mc
  q: Which cell limits charging in a series string?
  options: ["The fullest cell", "The emptiest cell", "The middle cell", "None, the pack voltage decides"]
  answer: 0
  explain: It reaches maximum voltage first.
- type: mc
  q: What does passive balancing do with excess charge?
  options: ["Turns it into heat in a resistor", "Moves it to the lowest cell", "Returns it to the charger", "Stores it in a capacitor permanently"]
  answer: 0
  explain: Active balancing moves charge; passive burns it.
:::end
