---
id: p05-l23
minutes: 35
summary: A circuit isn't finished until it's on a board. You learn the PCB design flow, size traces for current with the IPC-2221 formula, compute trace resistance and voltage drop, and apply the layout rules that keep a mixed motor-and-sensor board working.
---

## From schematic to board

1. **Schematic**: the circuit, with every part linked to a footprint.
2. **Board outline and stack-up**: 2 layers for simple boards; 4 layers (signal, ground, power, signal) is the easy route to good grounding (lesson 20).
3. **Placement**: connectors on the edges; decoupling capacitors next to their pins; noisy power stages away from sensitive analogue parts.
4. **Routing**: power and high current first, then sensitive signals, then the rest.
5. **Checks**: the design-rule check (DRC) against the manufacturer's minimum trace, spacing and drill sizes, and the electrical-rule check (ERC) on the schematic.
6. **Outputs**: Gerber and drill files, a bill of materials, and pick-and-place data.

Free tools such as KiCad do all of this.

## Trace width for current

Copper heats up with $I^2R$. The IPC-2221 chart, fitted as a formula, relates current, temperature rise $\Delta T$ and cross-section $A$ (in mil²):

$$I = k\,\Delta T^{0.44}A^{0.725}, \qquad k = 0.048 \text{ (outer layers)}, \quad 0.024 \text{ (inner layers)}.$$

Copper thickness is given in ounces per square foot: 1 oz = 35 µm = 1.378 mil. Inner layers run hotter because they can't shed heat to the air, so they need about 2.6× the width.

Width isn't the whole story. **Resistance** is $R = \rho L/(wt)$ with $\rho = 1.72\times10^{-8}$ Ω·m for copper, and its voltage drop also counts as ground shift (lesson 20).

**Other rules of thumb:**

- Spacing: 0.15–0.2 mm is fine for low voltage. Mains voltages need several millimetres of creepage, so follow the safety standard.
- Vias: a 0.3 mm via carries roughly 1 A. Use several in parallel for power.
- Keep switching loops (MOSFET, flyback diode, input capacitor) as small as possible: their area is what radiates noise.
- Route analogue signals over unbroken ground, away from motor and switching traces.

:::figure widget=trace caption="Minimum trace width against current from the IPC-2221 fit. Switch to an inner layer or thinner copper and the width needed grows."
:::end

## Worked example

A 2 A motor supply trace on the outer layer of a 1 oz board, with a 10 °C rise allowed.

1. Area: $A = (2/(0.048\times10^{0.44}))^{1/0.725} = 42.4$ mil².
2. Width: $42.4/1.378 = 30.8$ mil = 0.78 mm. Use 1 mm for margin.
3. On an inner layer it would need 2.03 mm.
4. Resistance of 10 cm at 0.78 mm: $1.72\times10^{-8}\times0.1/(0.78\times10^{-3}\times35\times10^{-6}) = 62.9$ mΩ, dropping 126 mV at 2 A. A wider trace or a copper pour is often worth it for that reason alone.
5. At 5 A on the same layer: 2.77 mm, or 0.91 mm with 2 oz copper and a 20 °C rise.

## Code it from scratch

:::code file=traces.py
```python
RHO = 1.72e-8
MIL = 25.4e-6

def width_mm(I, dT, oz=1.0, inner=False):
    k = 0.024 if inner else 0.048
    area_mil2 = (I / (k * dT**0.44)) ** (1 / 0.725)
    return area_mil2 / (1.378 * oz) * 0.0254

def current_for(width_mm_, dT, oz=1.0, inner=False):
    k = 0.024 if inner else 0.048
    area = (width_mm_ / 0.0254) * 1.378 * oz
    return k * dT**0.44 * area**0.725

def resistance(length_m, width_m, oz=1.0):
    return RHO * length_m / (width_m * 35e-6 * oz)

if __name__ == "__main__":
    w = width_mm(2, 10)
    print(f"2 A, 10 C rise, 1 oz outer: {w:.3f} mm; inner {width_mm(2, 10, inner=True):.3f} mm")
    assert abs(w - 0.7814) < 1e-3 and abs(width_mm(2, 10, inner=True) - 2.0328) < 1e-3
    assert abs(current_for(w, 10) - 2.0) < 1e-9                  # the formula inverts cleanly
    assert abs(width_mm(2, 10, inner=True) / w - 2 ** (1 / 0.725)) < 1e-9   # about 2.6x
    r = resistance(0.1, w / 1000)
    assert abs(r - 0.06289) < 1e-4 and abs(2 * r - 0.1258) < 2e-4
    assert abs(width_mm(5, 10) - 2.7654) < 1e-3 and abs(width_mm(5, 20, oz=2) - 0.9079) < 1e-3
    assert abs(1.378 * MIL - 35e-6) < 0.1e-6                     # 1 oz is about 35 um
```
:::end

## Exercises

:::exercise
How much current can a 0.25 mm signal trace (1 oz, outer) carry with a 10 °C rise?
:::solution
$A = (0.25/0.0254)\times1.378 = 13.6$ mil², so $I = 0.048\times10^{0.44}\times13.6^{0.725} = 0.875$ A. Fine for signals, not for motor power.
:::end

:::exercise
List three layout changes that would reduce the noise a PWM motor driver injects into a nearby IMU.
:::solution
Make the switching loop (MOSFETs, diode, input capacitor) tight; give the motor return its own path to the star point; place the IMU far from the driver over an unbroken ground plane, with its own decoupling and ideally a separate LDO. Routing motor wires as a twisted pair also helps.
:::end

## Quiz

:::quiz
- type: num
  q: Minimum width in mm for 2 A, 10 °C rise, 1 oz outer layer?
  answer: 0.78141
  tol: 0.002
  unit: mm
  py: "(2/(0.048*10**0.44))**(1/0.725)/1.378*0.0254"
  explain: Solve the IPC-2221 fit for area, then divide by thickness.
- type: num
  q: Resistance in mΩ of 10 cm of that trace?
  answer: 62.89
  tol: 0.003
  unit: mΩ
  py: "1.72e-8*0.1/(0.78141e-3*35e-6)*1e3"
  explain: $\rho L/(wt)$.
- type: mc
  q: Inner-layer traces need to be wider than outer ones because…
  options:
    - inner copper is thinner
    - they can't shed heat to the air as well
    - they have more resistance per metre
    - the IPC standard is arbitrary
  answer: 1
  explain: Same current, poorer cooling.
- type: num
  q: Current in A for a 0.25 mm trace, 1 oz outer, 10 °C rise?
  answer: 0.87538
  tol: 0.005
  unit: A
  py: "0.048*10**0.44*((0.25/0.0254)*1.378)**0.725"
  explain: Forward formula.
- type: mc
  q: To reduce radiated noise from a switching stage, you should…
  options:
    - make the switching current loop as small as possible
    - route its traces around the board edge
    - remove decoupling capacitors
    - use thinner traces
  answer: 0
  explain: Loop area is antenna area.
- type: num
  q: How many times wider must an inner trace be than an outer one (same I and ΔT)?
  answer: 2.5995
  tol: 0.002
  py: "2**(1/0.725)"
  explain: Half the k, raised to $1/0.725$.
:::end

:::verify
assert abs(0.25/0.0254*1.378-13.56)<0.01
:::end
