---
id: p07-l03
minutes: 30
summary: A potentiometer is a voltage divider whose ratio is the shaft position: the cheapest absolute angle sensor. You derive the loading error caused by whatever reads the wiper, find where it peaks, and show that a buffer brings it below 0.1 percent.
---

## A divider you can turn

A potentiometer of total resistance $R_p$ across a supply $V_s$, with the wiper at fraction $x$ of its travel, splits into $xR_p$ and $(1-x)R_p$. Unloaded,

$$V_{out} = x\,V_s.$$

A 300° single-turn pot read by a 12-bit ADC resolves $300/4096 = 0.073°$ in principle. Linearity (typically ±1–2 %), wear of the track and wiper noise limit it in practice, but it's absolute, so no homing is needed, and it costs very little. Hobby servos use one.

## Loading error

Whatever reads the wiper (an ADC input, a resistor, a long cable) puts a resistance $R_L$ in parallel with the lower part of the track. With $k = R_L/R_p$:

$$\frac{V_{out}}{V_s} = \frac{x}{1 + x(1-x)/k}.$$

The error is zero at both ends and peaks near $x = 2/3$, at about $15/k$ % of $V_s$. A 10 kΩ pot into a 100 kΩ load ($k = 10$) is off by 1.5 %.

The fixes:

- **Make $R_L \gg R_p$**: a lower-value pot (at the cost of supply current) or a higher-impedance input.
- **Buffer**: a voltage follower (Phase 05) has an input resistance of $10^9$–$10^{12}$ Ω, so the loading error disappears.
- **Watch the ADC's sampling capacitor**: a SAR ADC (Phase 06) briefly draws current to charge it. With a high source resistance, add a capacitor at the input or slow the sampling.

:::figure widget=potload caption="Wiper voltage against position for an ideal (dashed) and a loaded pot. The amber dot marks the worst error, near two-thirds of the travel."
:::end

## Worked example

A 10 kΩ pot on 3.3 V feeds an ADC input modelled as 100 kΩ.

1. $k = 10$. At $x = 2/3$: $V_{out}/V_s = 0.6667/(1 + 0.2222/10) = 0.6522$.
2. The error is $0.6667 - 0.6522 = 0.0145$, which is 1.45 % of $V_s$ (48 mV), or about 4.4° on a 300° pot.
3. With an op-amp buffer of $R_{in} = 10^{12}$ Ω, $k = 10^8$ and the error is $1.5\times10^{-7}$ %. The op-amp's offset (say 1 mV, 0.03 %) now dominates.

## Code it from scratch

:::code file=pot.py
```python
import numpy as np

def v_loaded(x, Rp, RL, Vs=3.3):
    lower = x * Rp
    par = lower * RL / (lower + RL) if RL != np.inf else lower
    return Vs * par / (par + (1 - x) * Rp)

def worst_error(Rp, RL, Vs=3.3):
    xs = np.linspace(0, 1, 10_001)
    err = xs * Vs - np.array([v_loaded(x, Rp, RL, Vs) for x in xs])
    i = int(np.argmax(np.abs(err)))
    return err[i] / Vs * 100, xs[i]

if __name__ == "__main__":
    e, at = worst_error(10e3, 100e3)
    print(f"10k pot into 100k: worst error {e:.2f} % at x = {at:.3f}")
    assert abs(e - 1.45) < 0.01 and 0.6 < at < 0.7
    # closed form matches the circuit
    x, k = 2 / 3, 10
    assert abs(v_loaded(x, 10e3, 100e3) / 3.3 - x / (1 + x * (1 - x) / k)) < 1e-12
    # rule of thumb: about 15/k percent for large k
    for k in (10, 30, 100, 1000):
        e, _ = worst_error(10e3, k * 10e3)
        assert abs(e * k - 15) < 2.5, (k, e * k)
    # buffered: an op-amp follower with 1e12 ohm input and 1 mV offset
    e_buf, _ = worst_error(10e3, 1e12)
    total = abs(e_buf) + 1e-3 / 3.3 * 100
    print(f"buffered: loading {e_buf:.2e} %, with 1 mV offset {total:.3f} %")
    assert total < 0.1
```
:::end

## Exercises

:::exercise
You can't add a buffer. What pot value keeps the loading error below 0.5 % into a 100 kΩ load?
:::solution
You need $k \gtrsim 15/0.5 = 30$, so $R_p \le 100/30 \approx 3.3$ kΩ. On 3.3 V it draws 1 mA.
:::end

:::exercise
Why is the loading error zero at both ends of the travel?
:::solution
At $x = 0$ the wiper is at ground, and at $x = 1$ it is tied straight to $V_s$ through zero resistance. In neither case can the load change the voltage.
:::end

## Quiz

:::quiz
- type: num
  q: Loaded output ratio at x = 2/3 with k = 10?
  answer: 0.65217
  tol: 0.001
  py: "(2/3)/(1+(2/3)*(1/3)/10)"
  explain: The loading formula.
- type: num
  q: Approximate worst loading error in % for k = 10?
  answer: 1.5
  tol: 0.05
  unit: '%'
  py: "15/10"
  explain: About 15/k %.
- type: mc
  q: The loading error peaks at about…
  options:
    - x = 0
    - x = 1/2
    - x = 2/3
    - x = 1
  answer: 2
  explain: Where $x - x/(1 + x(1-x)/k)$ is largest.
- type: num
  q: Angle resolution in degrees of a 300° pot on a 12-bit ADC?
  answer: 0.073242
  tol: 0.002
  unit: °
  py: "300/4096"
  explain: In principle, before noise and linearity.
- type: mc
  q: The simplest way to remove loading error is…
  options:
    - a bigger pot
    - a voltage-follower buffer
    - a lower supply
    - a longer cable
  answer: 1
  explain: Very high input resistance.
- type: num
  q: Maximum pot value in kΩ for < 0.5 % error into 100 kΩ (using 15/k)?
  answer: 3.333
  tol: 0.002
  unit: kΩ
  py: "100/30"
  explain: k ≥ 30.
:::end

:::verify
assert abs(0.6667 - 0.6522 - 0.0145) < 1e-3
:::end
