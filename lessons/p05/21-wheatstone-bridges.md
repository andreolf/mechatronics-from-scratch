---
id: p05-l21
minutes: 35
summary: A Wheatstone bridge turns a tiny resistance change into a measurable voltage centred on zero. You derive the bridge output, quantify the quarter bridge's nonlinearity, show how half and full bridges double and quadruple the signal while cancelling temperature drift, and size the amplifier for a strain gauge.
---

## The bridge

Two dividers side by side across the same excitation $V$: $R_1$ over $R_2$ on the left and $R_3$ over $R_4$ on the right. The output is the difference between the midpoints:

$$v_{out} = V\left(\frac{R_2}{R_1 + R_2} - \frac{R_4}{R_3 + R_4}\right).$$

When $R_1/R_2 = R_3/R_4$ the bridge is **balanced** and $v_{out} = 0$. A small change in one arm gives a small output centred on zero, so you can amplify it hard with an in-amp (lesson 16) without amplifying a large offset.

## Strain gauges

A strain gauge is a foil resistor whose resistance changes with stretch: $\Delta R/R = GF\cdot\varepsilon$, with gauge factor $GF \approx 2$ and strain $\varepsilon$ (1 µε = $10^{-6}$). At 1000 µε, $\Delta R/R$ is only 0.2 %: 0.7 Ω on a 350 Ω gauge.

- **Quarter bridge** (one active gauge, $x = \Delta R/R$): $v_{out} = V\frac{x}{4 + 2x}$. That's about $Vx/4$, but slightly nonlinear, by roughly $x/2$ relative.
- **Half bridge** (two gauges, one in tension and one in compression on a bending beam, in adjacent arms): $v_{out} = Vx/2$, exactly linear.
- **Full bridge** (four active gauges): $v_{out} = Vx$, linear, and four times the quarter-bridge signal.

Gauges on the same part warm up together. In half and full bridges the temperature change appears in adjacent arms and cancels, which is why commercial load cells are full bridges.

:::figure widget=bridge caption="Bridge output against strain for quarter, half and full bridges at 5 V excitation. The readout shows the quarter bridge's small nonlinearity."
:::end

## Worked example

Excitation 5 V, gauge factor 2, strain 1000 µε, so $x = 0.002$.

1. Quarter bridge: $5\times0.002/(4 + 0.004) = 2.4975$ mV. The linear estimate is 2.5 mV, so the nonlinearity is 0.1 %.
2. Half bridge (bending): $5\times0.002/2 = 5.000$ mV.
3. Full bridge: 10.000 mV.
4. For a 0–2.5 V ADC range at 1000 µε full scale with the full bridge: in-amp gain 250 ($R_G = 49.4\text{ k}/249 = 198$ Ω).
5. Temperature: a 10 °C rise on a gauge with 10 ppm/°C changes $R$ by 0.01 %, equivalent to 50 µε in a quarter bridge. In the full bridge it cancels.

## Code it from scratch

:::code file=bridge.py
```python
def bridge(V, R1, R2, R3, R4):
    return V * (R2 / (R1 + R2) - R4 / (R3 + R4))

def strain_bridge(V, eps, mode, GF=2.0, R=350.0, drift=0.0):
    x = GF * eps
    up, dn = R * (1 + x + drift), R * (1 - x + drift)
    if mode == "quarter":
        return bridge(V, R, up, R, R)
    if mode == "half":                                    # tension and compression gauges in one divider
        return bridge(V, dn, up, R * (1 + drift), R * (1 + drift))
    if mode == "full":
        return bridge(V, dn, up, up, dn)
    raise ValueError(mode)

if __name__ == "__main__":
    assert bridge(5, 350, 350, 350, 350) == 0
    q, h, f = (strain_bridge(5, 1e-3, m) for m in ("quarter", "half", "full"))
    print(f"1000 ue at 5 V: quarter {q*1e3:.4f} mV, half {h*1e3:.4f} mV, full {f*1e3:.4f} mV")
    assert abs(q - 5 * 0.002 / 4.004) < 1e-12 and abs(h - 0.005) < 1e-12 and abs(f - 0.010) < 1e-12
    assert abs((0.0025 - q) / 0.0025 - 0.000999) < 1e-6
    # temperature drift: same fractional change on every gauge
    d = 10 * 10e-6
    q_drift = strain_bridge(5, 0, "quarter", drift=d)
    f_drift = strain_bridge(5, 0, "full", drift=d)
    assert abs(q_drift / (5 * 2 / 4) - 50e-6) < 1e-7    # looks like 50 microstrain
    assert abs(f_drift) < 1e-15                        # cancels
    assert abs(49.4e3 / 249 - 198.4) < 0.1
```
:::end

## Exercises

:::exercise
A quarter bridge with 350 Ω gauges at 3.3 V excitation measures 500 µε (GF 2.1). What's the output, and what current flows through the gauge?
:::solution
$x = 0.00105$; $v = 3.3\times0.00105/(4 + 0.0021) = 0.866$ mV. Gauge current: $3.3/700 = 4.7$ mA (self-heating of about 7.8 mW is why excitation is kept modest).
:::end

:::exercise
Why does the half-bridge in this lesson put the tension and compression gauges in the *same* divider?
:::solution
In the same divider one goes up and the other down, so the midpoint moves twice as far and exactly linearly: $\frac{R(1+x)}{2R} = \frac{1 + x}{2}$. A temperature change raises both equally and leaves the ratio unchanged.
:::end

## Quiz

:::quiz
- type: num
  q: Quarter-bridge output in mV at 5 V, GF 2, 1000 µε?
  answer: 2.4975
  tol: 0.0005
  unit: mV
  py: "5*0.002/(4+2*0.002)*1e3"
  explain: $Vx/(4 + 2x)$.
- type: num
  q: Full-bridge output in mV under the same conditions?
  answer: 10
  tol: 0.001
  unit: mV
  py: "5*0.002*1e3"
  explain: $Vx$.
- type: mc
  q: A balanced bridge has…
  options:
    - maximum output
    - zero output, because the two dividers have equal ratios
    - no current flowing
    - infinite sensitivity
  answer: 1
  explain: $R_1/R_2 = R_3/R_4$.
- type: num
  q: Resistance change in Ω of a 350 Ω gauge (GF 2) at 1000 µε?
  answer: 0.7
  tol: 0.001
  unit: Ω
  py: "350*2*1e-3"
  explain: $R\cdot GF\cdot\varepsilon$.
- type: mc
  q: Half and full bridges compensate temperature because…
  options:
    - gauges don't change with temperature
    - equal changes in adjacent arms cancel in the ratio
    - the excitation is regulated
    - the amplifier subtracts it
  answer: 1
  explain: Common changes don't move the midpoints.
- type: num
  q: Output in mV of the 3.3 V, 500 µε, GF 2.1 quarter bridge?
  answer: 0.86578
  tol: 0.002
  unit: mV
  py: "3.3*0.00105/(4+2*0.00105)*1e3"
  explain: $x = 2.1\times500\times10^{-6}$.
:::end

:::verify
assert abs(3.3/700*1e3-4.714)<1e-3 and abs(3.3**2/700/2*1e3-7.78)<0.01
:::end
