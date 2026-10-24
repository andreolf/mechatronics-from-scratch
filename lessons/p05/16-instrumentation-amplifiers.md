---
id: p05-l16
minutes: 35
summary: Small sensor signals often ride on large common-mode voltages. You see why a single op-amp difference amplifier loses its common-mode rejection to resistor tolerance, how the three-op-amp instrumentation amplifier fixes it, and design a load-cell front end with gain 100.
---

## The problem: a small difference on a large common voltage

A load-cell bridge (lesson 21) excited at 5 V produces a few millivolts *between* its two outputs, while both outputs sit near 2.5 V. Long cables also pick up mains hum equally on both wires. You want to amplify the **differential** voltage $v_d = v_2 - v_1$ and reject the **common-mode** voltage $v_{cm} = (v_1 + v_2)/2$.

The figure of merit is the **common-mode rejection ratio**: CMRR $= G_d/G_{cm}$, usually in dB. At CMRR = 100 dB, a 1 V common-mode signal looks like a 10 µV differential one.

## The difference amplifier and its weakness

One op-amp with four resistors: $v_1$ through $R_1$ to the − input, $R_2$ as feedback, and $v_2$ through $R_3$ to the + input with $R_4$ to ground. With $R_2/R_1 = R_4/R_3$, $v_{out} = \frac{R_2}{R_1}(v_2 - v_1)$, and in theory the common-mode gain is zero.

In practice, the ratios must match exactly. With resistor tolerance $t$, the worst-case CMRR is about

$$\text{CMRR} \approx \frac{1 + G}{4t}.$$

With 1 % resistors at unity gain, that's only 50 (34 dB). It also loads the sources through $R_1$ and $R_3$.

## The three-op-amp instrumentation amplifier

Two non-inverting buffers share a gain resistor $R_G$ between their inverting inputs, followed by a unity-gain difference amplifier.

- The first stage amplifies the differential signal by $1 + 2R/R_G$ but passes the common-mode signal at gain 1. So the CMRR improves by the first-stage gain before the mismatch-sensitive stage.
- Both inputs see op-amp inputs: very high impedance.
- One resistor, $R_G$, sets the gain. Integrated parts laser-trim the rest. For the classic AD620-style part: $G = 1 + 49.4\text{ kΩ}/R_G$.

Datasheets give CMRR rising with gain, typically 90–130 dB at DC and falling with frequency, so 50 Hz hum is the true test.

:::figure widget=inamp caption="An instrumentation amplifier amplifying a small 5 Hz differential signal on top of 50 Hz common-mode hum. Lower the CMRR and the hum leaks through."
:::end

## Worked example

A load cell gives 2 mV/V at full scale with 5 V excitation, so 10 mV full scale. The cable picks up 1 V of 50 Hz common-mode hum.

1. For about 1 V at full scale: $G = 100$, so $R_G = 49.4\text{ k}/99 = 499$ Ω (an E96 value), giving $G = 99.998$.
2. Full-scale output: $100\times10$ mV = 1.0 V.
3. At 100 dB CMRR, the hum at the output is $100\times1\text{ V}\times10^{-5} = 1$ mV, which is 0.1 % of full scale.
4. A single difference amplifier with 1 % resistors at gain 100 would have CMRR ≈ $101/0.04 = 2525$ (68 dB): the hum would be about 40 mV at the output, 4 % of full scale.

## Code it from scratch

:::code file=inamp.py
```python
import itertools
import math

def diff_amp(v1, v2, R1, R2, R3, R4):
    return v2 * R4 / (R3 + R4) * (1 + R2 / R1) - v1 * R2 / R1

def cmrr_worst(G, tol, R=10e3):
    worst = math.inf
    for s in itertools.product((-1, 1), repeat=4):
        R1, R2, R3, R4 = (R * (1 + k * tol) * (G if i in (1, 3) else 1) for i, k in enumerate(s))
        gd = diff_amp(-0.5, 0.5, R1, R2, R3, R4)
        gcm = abs(diff_amp(1, 1, R1, R2, R3, R4))
        worst = min(worst, gd / gcm if gcm else math.inf)
    return worst

if __name__ == "__main__":
    assert abs(diff_amp(2.5, 2.51, 10e3, 10e3, 10e3, 10e3) - 0.01) < 1e-12
    c1 = cmrr_worst(1, 0.01)
    c100 = cmrr_worst(100, 0.01)
    print(f"difference amp, 1 % parts: CMRR {c1:.1f} ({20*math.log10(c1):.1f} dB) at G=1, {c100:.0f} at G=100")
    assert abs(c1 / (2 / 0.04) - 1) < 0.03 and abs(c100 / (101 / 0.04) - 1) < 0.03
    G = 1 + 49.4e3 / 499
    assert abs(G - 99.998) < 1e-3
    hum_out = G * 1.0 * 10 ** (-100 / 20)
    assert abs(hum_out - 1e-3) < 1e-6
    assert abs(G * 1.0 / c100 - 0.0396) < 0.002       # the plain difference amp lets ~40 mV through
```
:::end

## Exercises

:::exercise
What $R_G$ gives a gain of 500 on the 49.4 kΩ in-amp? What's the full-scale output for the 10 mV load cell?
:::solution
$R_G = 49.4\text{ k}/499 = 99.0$ Ω, so use 100 Ω (gain 495). Full scale: 4.95 V, too close to a 5 V rail; gain 300 would be safer.
:::end

:::exercise
Why does the in-amp's first stage improve CMRR?
:::solution
It amplifies the differential signal by $1 + 2R/R_G$ but passes the common-mode signal at gain 1 (no current flows through $R_G$ when both inputs move together). The difference stage then sees a signal that's already much larger relative to the common mode, so its mismatch matters less.
:::end

## Quiz

:::quiz
- type: num
  q: In-amp gain with R_G = 499 Ω and G = 1 + 49.4 kΩ/R_G?
  answer: 99.998
  tol: 0.0001
  py: "1+49400/499"
  explain: Plug in.
- type: num
  q: Worst-case CMRR of a unity-gain difference amplifier with 1 % resistors (approximate formula)?
  answer: 50
  tol: 0.001
  py: "(1+1)/(4*0.01)"
  explain: $(1 + G)/(4t)$.
- type: num
  q: Output hum in mV for 1 V common mode, G = 100, CMRR 100 dB?
  answer: 1
  tol: 0.001
  unit: mV
  py: "100*1*10**(-100/20)*1e3"
  explain: $G\,v_{cm}/\text{CMRR}$.
- type: mc
  q: Common-mode voltage means…
  options:
    - the difference between the inputs
    - the average voltage both inputs share
    - the supply voltage
    - the output offset
  answer: 1
  explain: $(v_1 + v_2)/2$.
- type: mc
  q: The main advantage of a three-op-amp in-amp over a single difference amplifier is…
  options:
    - lower cost
    - high input impedance and CMRR insensitive to the gain setting resistor
    - it needs no power supply
    - it has unity gain only
  answer: 1
  explain: One resistor sets the gain; matching is done on-chip.
- type: num
  q: Express CMRR = 2525 in dB.
  answer: 68.046
  tol: 0.002
  unit: dB
  py: "20*math.log10(2525)"
  explain: $20\log_{10}$.
:::end

:::verify
assert abs(49400/499-99.0)<0.01 and abs(1+49400/100-495)<1e-9
:::end
