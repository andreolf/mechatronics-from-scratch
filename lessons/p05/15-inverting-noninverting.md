---
id: p05-l15
minutes: 35
summary: The two workhorse op-amp circuits follow from the golden rules in a line each. You derive the inverting, non-inverting and summing amplifiers, scale a 0–0.5 V sensor to a 3.3 V ADC, check input impedance and clipping, and verify the ideal formulas against a finite-gain model.
---

## Inverting amplifier

The input goes through $R_{in}$ to the inverting input, $R_f$ goes from the output back to it, and $v_+ = 0$.

1. Rule 2: $v_- = v_+ = 0$, a **virtual ground**.
2. Current through $R_{in}$: $v_{in}/R_{in}$. Rule 1: all of it continues through $R_f$.
3. So $0 - v_{out} = R_f\,v_{in}/R_{in}$:

$$G = -\frac{R_f}{R_{in}}, \qquad Z_{in} = R_{in}.$$

**Summing amplifier**: several inputs, each through its own resistor, into the same virtual ground: $v_{out} = -R_f\left(\frac{v_1}{R_1} + \frac{v_2}{R_2} + \dots\right)$. It's useful for adding an offset to a signal.

## Non-inverting amplifier

The input goes to $v_+$, and the divider $R_f$, $R_g$ feeds $v_- = v_{out}R_g/(R_f + R_g)$ back.

1. Rule 2: $v_- = v_{in}$.
2. So $v_{out} = v_{in}(R_f + R_g)/R_g$:

$$G = 1 + \frac{R_f}{R_g}, \qquad Z_{in} \approx \infty.$$

**Choosing between them.** The non-inverting amplifier doesn't load the source (essential for high-impedance sensors) but can't have gain below 1. The inverting one flips the sign and loads the source with $R_{in}$, but its inputs sit at a constant voltage, which avoids common-mode errors.

**Limits.** The output can't go beyond the supply rails (within 0.05–2 V, depending on the part; "rail-to-rail" outputs get closest). Keep resistors between about 1 kΩ and 1 MΩ: lower values load the output, higher ones add noise and bias-current errors.

:::figure widget=amp caption="An op-amp amplifier on ±12 V rails. Raise the gain or the input until the output clips at ±11.5 V."
:::end

## Worked example

A pressure sensor outputs 0–0.5 V and has 5 kΩ output impedance. You want 0–3.3 V for the ADC.

1. Gain needed: $3.3/0.5 = 6.6$.
2. The source impedance rules out an inverting stage (5 kΩ would form a divider with $R_{in}$), and the sign would be wrong anyway. Use non-inverting.
3. $R_f/R_g = 5.6$: $R_g = 10$ kΩ and $R_f = 56$ kΩ, both E12 values, giving exactly 6.6.
4. Run the op-amp from a single 3.3 V supply with a rail-to-rail output; it can't quite reach 3.3 V, so in practice aim for 3.2 V full scale (gain 6.4: $R_f = 54$ kΩ, or use 6.2 kΩ + 47.5 kΩ, or adjust in software).
5. In the widget's default inverting amplifier ($R_{in} = 10$ kΩ, $R_f = 47$ kΩ), the gain is −4.7. A 1 V peak input gives 4.7 V; a 3 V input would want 14.1 V and clips at 11.5 V.

## Code it from scratch

:::code file=amplifiers.py
```python
def inverting(vin, rin, rf, A=1e12):
    """Finite-gain solve: v- = (vin*rf + vout*rin)/(rin+rf), vout = -A v-."""
    k = rf / (rin + rf); m = rin / (rin + rf)
    return -A * k * vin / (1 + A * m)

def noninverting(vin, rg, rf, A=1e12):
    beta = rg / (rg + rf)
    return A * vin / (1 + A * beta)

def clip(v, rail=11.5):
    return max(-rail, min(rail, v))

if __name__ == "__main__":
    assert abs(inverting(1.0, 10e3, 47e3) + 4.7) < 1e-9
    assert abs(noninverting(0.5, 10e3, 56e3) - 3.3) < 1e-9
    # with a realistic A = 1e5 the error is about the noise gain over A
    err = 1 - noninverting(0.5, 10e3, 56e3, A=1e5) / 3.3
    print(f"gain error with A = 1e5: {err*100:.4f} %")
    assert abs(err - 6.6 / 1e5) < 1e-6
    err_inv = 1 - inverting(1.0, 10e3, 47e3, A=1e5) / -4.7
    assert abs(err_inv - 5.7 / 1e5) < 1e-6             # inverting: noise gain is 1 + Rf/Rin = 5.7
    assert clip(inverting(3.0, 10e3, 47e3)) == 11.5 or clip(inverting(3.0, 10e3, 47e3)) == -11.5
    # loading: a 5 k source into a 10 k inverting input loses a third of the signal
    assert abs(10e3 / (5e3 + 10e3) - 2 / 3) < 1e-12
    # summing: -Rf (v1/R1 + v2/R2)
    vout = -10e3 * (0.3 / 10e3 + (-1.0) / 20e3)
    assert abs(vout - 0.2) < 1e-12
```
:::end

## Exercises

:::exercise
Design an inverting amplifier with gain −20 and input impedance of at least 10 kΩ.
:::solution
$R_{in} = 10$ kΩ and $R_f = 200$ kΩ.
:::end

:::exercise
A bipolar ±1 V signal must become 0–3.3 V for an ADC. Using a summing amplifier followed by a unity-gain inverter, choose resistor values. A +3.3 V reference is available.
:::solution
You need $v_{out} = 1.65v_{in} + 1.65$. The summer produces $-R_f(v_{in}/R_1 + 3.3/R_2)$. With $R_f = 16.5$ kΩ and $R_1 = 10$ kΩ the signal term is $-1.65v_{in}$; with $R_2 = 33$ kΩ the reference term is $-16.5	imes3.3/33 = -1.65$ V. The summer's output is $-(1.65v_{in} + 1.65)$, and an inverter with two 10 kΩ resistors flips it to $1.65v_{in} + 1.65$: 0 V at −1 V in and 3.3 V at +1 V in.
:::end

## Quiz

:::quiz
- type: num
  q: Gain of an inverting amplifier with Rin = 10 kΩ and Rf = 47 kΩ?
  answer: -4.7
  tol: 0.001
  py: "-47/10"
  explain: $-R_f/R_{in}$.
- type: num
  q: Non-inverting gain with Rg = 10 kΩ and Rf = 56 kΩ?
  answer: 6.6
  tol: 0.001
  py: "1+56/10"
  explain: $1 + R_f/R_g$.
- type: mc
  q: The inverting input of an inverting amplifier sits at…
  options:
    - the input voltage
    - a virtual ground (0 V)
    - the positive rail
    - half the output
  answer: 1
  explain: Rule 2, with $v_+$ grounded.
- type: mc
  q: For a high-impedance sensor you'd normally choose…
  options:
    - an inverting amplifier with small R_in
    - a non-inverting amplifier or follower
    - a passive divider
    - a summing amplifier
  answer: 1
  explain: Its input draws essentially no current.
- type: num
  q: "Summing amplifier: Rf = 10 kΩ, inputs 0.3 V via 10 kΩ and −1.0 V via 20 kΩ. What is the output in volts?"
  answer: 0.2
  tol: 0.001
  unit: V
  py: "-10*(0.3/10+(-1.0)/20)"
  explain: $-R_f\sum v_i/R_i$.
- type: num
  q: Relative gain error (%) of the 6.6× non-inverting stage with A = 1e5?
  answer: 0.0066
  tol: 0.01
  unit: "%"
  py: "6.6/1e5*100"
  explain: About noise gain divided by A.
:::end

:::verify
assert abs(-16.5/33*3.3+1.65)<1e-12 and abs(16.5/10-1.65)<1e-12
:::end
