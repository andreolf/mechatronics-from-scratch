---
id: p05-l18
minutes: 30
summary: A comparator turns an analogue level into a clean digital edge, unless the input is noisy. You see why a plain comparator chatters, add hysteresis with positive feedback, derive the two switching thresholds, and count output edges in a simulation as the hysteresis grows.
---

## Comparators

A comparator outputs high when $v_+ > v_-$ and low otherwise. It's like an op-amp without feedback, but built to switch fast and drive logic, often with an open-drain output that needs a pull-up resistor. (Using an op-amp as a comparator works but is slow, and some op-amps misbehave when their inputs are far apart.)

**The chatter problem.** When a slow, noisy signal crosses the threshold, the noise carries it back and forth across many times, and the output toggles on every crossing. A microcontroller counting those edges would see dozens of events where there should be one.

## Hysteresis: the Schmitt trigger

Feed some of the output back to the **non-inverting** input (positive feedback). For an inverting Schmitt trigger: the signal goes to $v_-$; $v_+$ connects to a reference $V_{ref}$ through $R_1$ and to the output through $R_2$. Then

$$v_+ = V_{ref} + (v_{out} - V_{ref})\frac{R_1}{R_1 + R_2}.$$

Because $v_{out}$ is either high ($V_H$) or low ($V_L$), there are two thresholds. Once the output switches, the threshold moves away from the input, so noise smaller than the gap can't switch it back:

$$V_{T\pm} = V_{ref} + (V_{H/L} - V_{ref})\frac{R_1}{R_1 + R_2}, \qquad \text{hysteresis} = (V_H - V_L)\frac{R_1}{R_1 + R_2}.$$

Choose the hysteresis larger than the peak-to-peak noise, but small enough that the real signal still crosses both thresholds. Many microcontroller inputs (and 74HC14 gates) have built-in Schmitt inputs for buttons and slow edges.

:::figure widget=schmitt caption="A noisy sine into a comparator. With zero hysteresis the output chatters; widen the band until the edge count drops to the six true crossings."
:::end

## Worked example

A rail-to-rail comparator runs from 5 V ($V_H = 5$, $V_L = 0$) with $V_{ref} = 2.5$ V, $R_1 = 10$ kΩ and $R_2 = 100$ kΩ.

1. Feedback fraction: $10/110 = 0.0909$.
2. With the output high: $V_{T+} = 2.5 + 2.5\times0.0909 = 2.727$ V. The input must rise above this to switch the output low.
3. With the output low: $V_{T-} = 2.5 - 0.227 = 2.273$ V.
4. Hysteresis: 0.455 V. Noise up to about 0.45 V peak-to-peak can't cause chatter.
5. In the simulation below, a 1 V sine with noise σ = 0.15 V (about 0.9 V peak-to-peak) gives dozens of edges with no hysteresis and exactly the true number with a 1.0 V band.

## Code it from scratch

:::code file=schmitt.py
```python
import math
import numpy as np

def thresholds(vref, vh, vl, r1, r2):
    k = r1 / (r1 + r2)
    return vref + (vl - vref) * k, vref + (vh - vref) * k

def comparator(x, lo, hi):
    """Non-inverting-sense comparator with hysteresis: output 1 above hi, 0 below lo, else holds."""
    out, state = np.empty(len(x), dtype=int), int(x[0] > (lo + hi) / 2)
    for i, v in enumerate(x):
        if state and v < lo:
            state = 0
        elif not state and v > hi:
            state = 1
        out[i] = state
    return out

def edges(y):
    return int(np.sum(np.abs(np.diff(y))))

if __name__ == "__main__":
    lo, hi = thresholds(2.5, 5.0, 0.0, 10e3, 100e3)
    assert abs(lo - 2.272727) < 1e-6 and abs(hi - 2.727273) < 1e-6
    rng = np.random.default_rng(18)
    t = np.linspace(0, 3, 6000)                         # three periods: six true crossings
    clean = np.sin(2 * math.pi * t + 0.3)
    x = clean + 0.15 * rng.standard_normal(t.size)
    counts = {h: edges(comparator(x, -h / 2, h / 2)) for h in (0.0, 0.2, 0.5, 1.0)}
    print("edges by hysteresis width:", counts)
    assert edges(comparator(clean, 0, 0)) == 6
    assert counts[0.0] > 30 and counts[0.0] > counts[0.2] > counts[0.5] >= counts[1.0] == 6
```
:::end

## Exercises

:::exercise
You want thresholds of 1.0 V and 1.4 V on a 3.3 V rail-to-rail comparator. With $R_2 = 100$ kΩ, find $R_1$ and $V_{ref}$.
:::solution
Hysteresis 0.4 V = $3.3k$, so $k = 0.1212$ and $R_1 = kR_2/(1 - k) = 13.8$ kΩ. The centre of the band, $V_{ref} + (1.65 - V_{ref})k = 1.2$, gives $V_{ref} = (1.2 - 1.65k)/(1 - k) = 1.138$ V.
:::end

:::exercise
Why is the hysteresis feedback connected to the non-inverting input?
:::solution
Positive feedback reinforces a change: once the output starts to switch, the threshold moves to make the switch more certain. Feedback to the inverting input would be negative feedback, which makes a linear amplifier instead.
:::end

## Quiz

:::quiz
- type: num
  q: Upper threshold in volts (5 V rails, V_ref 2.5 V, R1 10 kΩ, R2 100 kΩ)?
  answer: 2.72727
  tol: 0.001
  unit: V
  py: "2.5+2.5*10/110"
  explain: $V_{ref} + (V_H - V_{ref})R_1/(R_1 + R_2)$.
- type: num
  q: What is the hysteresis width in volts?
  answer: 0.454545
  tol: 0.001
  unit: V
  py: "5*10/110"
  explain: $(V_H - V_L)R_1/(R_1 + R_2)$.
- type: mc
  q: Hysteresis prevents chatter because…
  options:
    - it filters the input
    - after switching, the threshold moves away from the input
    - it slows the comparator
    - it reduces noise in the signal
  answer: 1
  explain: Noise smaller than the gap can't re-cross.
- type: mc
  q: A Schmitt trigger uses…
  options:
    - negative feedback
    - positive feedback
    - no feedback
    - a capacitor in the feedback path
  answer: 1
  explain: Feedback goes to the non-inverting input.
- type: num
  q: R1 in kΩ for 0.4 V of hysteresis on 3.3 V rails with R2 = 100 kΩ?
  answer: 13.793
  tol: 0.003
  unit: kΩ
  py: "(0.4/3.3)*100/(1-0.4/3.3)"
  explain: $k = 0.4/3.3$, so $R_1 = kR_2/(1 - k)$.
- type: mc
  q: The hysteresis band should be…
  options:
    - smaller than the noise
    - larger than the peak-to-peak noise but smaller than the signal swing
    - exactly zero
    - equal to the supply voltage
  answer: 1
  explain: Otherwise either noise or the signal itself defeats it.
:::end

:::verify
k = 0.4/3.3; vref = (1.2-1.65*k)/(1-k)
assert abs(vref-1.138)<5e-4 and abs(vref+(0-vref)*k-1.0)<1e-9 and abs(vref+(3.3-vref)*k-1.4)<1e-9
:::end
