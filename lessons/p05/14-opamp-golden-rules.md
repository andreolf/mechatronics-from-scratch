---
id: p05-l14
minutes: 35
summary: An op-amp has enormous gain, and negative feedback trades it for precision. You derive the two golden rules from the feedback equation, quantify the gain error from finite open-loop gain, and use the gain-bandwidth product to predict how fast an amplifier can be.
---

## The feedback equation

An op-amp amplifies the difference between its inputs: $v_{out} = A(v_+ - v_-)$, with open-loop gain $A$ around $10^5$ to $10^6$ at DC. That's far too much gain to use directly; a few microvolts would saturate it. Instead, feed a fraction $\beta$ of the output back to the inverting input. For a non-inverting amplifier, $v_- = \beta v_{out}$ and $v_+ = v_{in}$:

$$v_{out} = A(v_{in} - \beta v_{out}) \quad\Rightarrow\quad G = \frac{v_{out}}{v_{in}} = \frac{A}{1 + A\beta} \approx \frac1\beta \text{ when } A\beta \gg 1.$$

The gain is set by the feedback network (resistors, which are precise and stable), not by $A$ (which varies 10× between parts). The relative error is about $1/(A\beta)$, the reciprocal of the **loop gain**.

**The golden rules** for an ideal op-amp with negative feedback:

1. **No current flows into the inputs** (input bias currents are pA to nA).
2. **The output does whatever it takes to make $v_+ = v_-$**, because $v_+ - v_- = v_{out}/A \approx 0$.

These two rules solve almost every op-amp circuit in one line (lesson 15). They fail when the output hits a supply rail, when the feedback is positive (lesson 18), or at frequencies where $A$ has fallen.

## Gain-bandwidth product

Most op-amps are compensated with a single dominant pole, so above a few hertz $|A(f)| \approx \text{GBW}/f$. The closed-loop gain stays at $1/\beta$ until $|A|$ falls to meet it:

$$f_{-3\text{dB}} \approx \frac{\text{GBW}}{G_{noise}}, \qquad G_{noise} = \frac1\beta.$$

A 1 MHz GBW op-amp at gain 10 has about 100 kHz of bandwidth; at gain 100, 10 kHz. Need gain 1000 at 10 kHz? Split it across two stages, or choose a faster part.

**DC errors.** The input offset voltage $V_{OS}$ (µV to mV) is also multiplied by the noise gain $1/\beta$ at the output.

:::figure widget=bode args={"kind":"opamp"} caption="Open-loop gain (dashed) and closed-loop gain of a non-inverting amplifier. The closed-loop curve follows 1/β until it meets the open-loop line at about GBW/G."
:::end

## Worked example

A non-inverting amplifier with $\beta = 0.1$ (ideal gain 10) uses an op-amp with $A_0 = 10^5$ and GBW = 1 MHz.

1. At DC: $G = 10^5/(1 + 10^4) = 9.9990$, a 0.01 % error.
2. At 10 kHz, $|A| \approx 100$, so the loop gain is only 10 and the error is about 10 %. Using the full complex $A$, $|G| = 9.95$, but the phase shift is already −5.7°.
3. Bandwidth: $1\text{ MHz}/10 = 100$ kHz.
4. With $V_{OS} = 1$ mV, the output carries a 10 mV error.

## Code it from scratch

:::code file=opamp_feedback.py
```python
import math
import numpy as np

A0, GBW = 1e5, 1e6
FP = GBW / A0                                       # dominant pole at 10 Hz

def A(f):
    return A0 / (1 + 1j * f / FP)

def closed_loop(f, beta):
    a = A(f)
    return a / (1 + a * beta)

if __name__ == "__main__":
    g0 = closed_loop(0, 0.1)
    assert abs(g0.real - 9.99900) < 1e-5
    g10k = closed_loop(1e4, 0.1)
    print(f"|G(10 kHz)| = {abs(g10k):.4f}, phase {math.degrees(np.angle(g10k)):.2f} deg")
    assert abs(abs(g10k) - 9.9494) < 1e-3 and abs(math.degrees(np.angle(g10k)) + 5.71) < 0.01
    # find the -3 dB frequency numerically and compare with GBW/G
    f = np.logspace(3, 7, 200_000)
    mag = np.abs(closed_loop(f, 0.1))
    f3 = f[np.argmin(np.abs(mag - abs(g0) / math.sqrt(2)))]
    assert abs(f3 / 1e5 - 1) < 0.01
    # gain 100 -> 10 kHz
    mag100 = np.abs(closed_loop(f, 0.01))
    f3_100 = f[np.argmin(np.abs(mag100 - abs(closed_loop(0, 0.01)) / math.sqrt(2)))]
    assert abs(f3_100 / 1e4 - 1) < 0.01
    assert abs(1e-3 / 0.1 - 0.01) < 1e-15            # offset times noise gain
```
:::end

## Exercises

:::exercise
You need gain 1000 with 20 kHz bandwidth from 1 MHz GBW op-amps. Is one stage enough? Design a two-stage version.
:::solution
One stage gives $10^6/1000 = 1$ kHz. Two stages of gain $\sqrt{1000} = 31.6$ each give 31.6 kHz per stage. Cascading two identical poles shrinks the bandwidth by $\sqrt{\sqrt2 - 1} = 0.64$, so about 20.4 kHz overall: just enough.
:::end

:::exercise
Using the golden rules, find the output of a voltage follower (output wired directly to the inverting input, signal into +).
:::solution
Rule 2: $v_- = v_+ = v_{in}$, and $v_- = v_{out}$, so $v_{out} = v_{in}$. Gain 1, with very high input impedance and low output impedance: a buffer.
:::end

## Quiz

:::quiz
- type: num
  q: Closed-loop DC gain for A = 1e5 and β = 0.1?
  answer: 9.999
  tol: 0.0001
  py: "1e5/(1+1e5*0.1)"
  explain: $A/(1 + A\beta)$.
- type: num
  q: Bandwidth in kHz of a gain-10 amplifier with GBW 1 MHz?
  answer: 100
  tol: 0.001
  unit: kHz
  py: "1e6/10/1e3"
  explain: $\text{GBW}/G$.
- type: mc
  q: With negative feedback and the output not saturated, an ideal op-amp…
  options:
    - draws large input current
    - drives its output so that v+ = v−
    - always outputs zero
    - has unity open-loop gain
  answer: 1
  explain: That's golden rule 2.
- type: num
  q: Output offset in mV for VOS = 1 mV at noise gain 10?
  answer: 10
  tol: 0.001
  unit: mV
  py: "1*10"
  explain: Offset is amplified by $1/\beta$.
- type: mc
  q: The closed-loop gain of a feedback amplifier is set mainly by…
  options:
    - the open-loop gain A
    - the feedback network β
    - the supply voltage
    - the load
  answer: 1
  explain: $G \approx 1/\beta$ when $A\beta \gg 1$.
- type: num
  q: Bandwidth in kHz of one gain-31.6 stage with GBW 1 MHz?
  answer: 31.623
  tol: 0.002
  unit: kHz
  py: "1e6/math.sqrt(1000)/1e3"
  explain: $10^6/\sqrt{1000}$.
:::end

:::verify
import math
assert abs(math.sqrt(math.sqrt(2)-1)-0.6436)<1e-4 and abs(31.62*0.6436-20.35)<0.05
:::end
