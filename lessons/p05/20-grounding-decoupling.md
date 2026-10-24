---
id: p05-l20
minutes: 35
summary: Most "mystery" glitches in mechatronics are currents flowing where you didn't expect. You compute ground shifts from shared return paths, design star grounding for motors and sensors, and size decoupling capacitors using their real impedance with ESR and ESL.
---

## Ground is not zero volts everywhere

A ground wire or trace has resistance and inductance. Every current returning through it creates a voltage drop $\Delta V = IR + L\,di/dt$. If a motor's 2 A return shares a 20 mΩ trace with an analogue sensor's reference, the sensor's "ground" moves by 40 mV whenever the motor runs. To a 12-bit ADC on a 3.3 V range (0.8 mV per count), that's 50 counts of error.

**Rules that prevent it:**

- **Separate return paths**: route high-current (motor, LED, heater) returns separately from signal returns, joining at one point near the supply: a **star ground**.
- **Ground planes**: on multilayer boards, a solid plane gives every signal a low-impedance return directly under its trace. High-frequency return current follows the path of least *inductance*, which is right beneath the signal trace. Don't cut slots in it under signals.
- **Differential signalling** (lesson 16, and Phase 11's CAN and RS-485) rejects ground shifts between boards.
- **Ground loops**: two ground connections between the same equipment form a loop that picks up magnetic fields as hum. Break the loop or make the second path high impedance.

## Decoupling

Digital chips draw current in nanosecond spikes. The supply traces' inductance can't deliver them fast enough, so the local supply voltage dips. A **decoupling capacitor** next to each supply pin supplies the spike: $\Delta V = I\Delta t/C$.

A real capacitor isn't ideal. It has series resistance (ESR) and series inductance (ESL, from its package and the vias, typically 0.5–2 nH):

$$|Z(f)| = \sqrt{\text{ESR}^2 + \left(2\pi fL - \frac{1}{2\pi fC}\right)^2}, \qquad f_{SRF} = \frac{1}{2\pi\sqrt{LC}}.$$

Below its self-resonant frequency it's a capacitor, at $f_{SRF}$ only ESR is left, and above it it's an inductor. So placement matters more than capacitance at high frequencies: short, wide connections and vias right at the pad. The usual pattern is a 100 nF ceramic at every supply pin plus a few µF bulk capacitor per rail.

:::figure widget=decoupling caption="Impedance of a real capacitor. The dashed lines are the ideal capacitor and the inductance alone. Shrink the ESL and the useful range extends upward."
:::end

## Worked example

A microcontroller draws 100 mA spikes lasting 10 ns from a 3.3 V rail, and must stay within 50 mV.

1. Target impedance: $0.05/0.1 = 0.5$ Ω across the spike's frequency content (up to roughly $0.35/t_{rise}$, about 100 MHz for 3 ns edges).
2. Charge needed: a 100 nF capacitor drops $0.1\times10^{-8}/10^{-7} = 10$ mV during a spike, within budget.
3. Its impedance (ESR 0.05 Ω, ESL 1 nH): SRF = 15.9 MHz, and $|Z(100\text{ MHz})| = 0.61$ Ω, which misses the 0.5 Ω target.
4. Fix: two 100 nF capacitors in parallel halve the ESL (0.31 Ω at 100 MHz), or use a smaller package with lower ESL. The chip package and the board's power planes carry the rest.

## Code it from scratch

:::code file=decoupling.py
```python
import math
import numpy as np

def z_cap(f, C, esr, esl):
    w = 2 * math.pi * f
    return esr + 1j * (w * esl - 1 / (w * C))

def parallel(*zs):
    return 1 / sum(1 / z for z in zs)

if __name__ == "__main__":
    C, esr, esl = 100e-9, 0.05, 1e-9
    srf = 1 / (2 * math.pi * math.sqrt(esl * C))
    assert abs(srf - 15.915e6) < 1e3
    assert abs(abs(z_cap(srf, C, esr, esl)) - esr) < 1e-9
    z100 = abs(z_cap(100e6, C, esr, esl))
    z2 = abs(parallel(z_cap(100e6, C, esr, esl), z_cap(100e6, C, esr, esl)))
    print(f"|Z| at 100 MHz: one cap {z100:.3f} ohm, two in parallel {z2:.3f} ohm")
    assert abs(z100 - 0.6144) < 1e-3 and abs(z2 - z100 / 2) < 1e-9
    assert abs(0.1 * 10e-9 / C - 0.010) < 1e-12               # droop during a 10 ns, 100 mA spike
    # minimum of |Z| over frequency is at the SRF and equals ESR
    f = np.logspace(5, 9, 40_001)
    zs = np.abs(z_cap(f, C, esr, esl))
    assert abs(f[np.argmin(zs)] / srf - 1) < 1e-3
    # ground shift from a shared return
    assert abs(2.0 * 0.020 / (3.3 / 4096) - 49.6) < 0.1
```
:::end

## Exercises

:::exercise
A 10 µF ceramic in a larger package has ESL 2 nH and ESR 5 mΩ. Find its SRF, and say whether it's useful at 50 MHz.
:::solution
$f_{SRF} = 1/(2\pi\sqrt{2\times10^{-9}\times10^{-5}}) = 1.13$ MHz. At 50 MHz it's an inductor with $|Z| \approx 2\pi\times5\times10^7\times2\times10^{-9} = 0.63$ Ω, no better than a small capacitor. It's for low-frequency bulk storage.
:::end

:::exercise
A stepper driver's 1.5 A return and a thermistor's ground share 5 cm of 0.5 mm trace (about 50 mΩ). How large is the error, and how do you fix it?
:::solution
$1.5\times0.05 = 75$ mV shift. Route the thermistor's ground separately back to the ADC's ground at the star point, or measure differentially.
:::end

## Quiz

:::quiz
- type: num
  q: Self-resonant frequency in MHz of 100 nF with 1 nH ESL?
  answer: 15.9155
  tol: 0.001
  unit: MHz
  py: "1/(2*math.pi*math.sqrt(1e-9*100e-9))/1e6"
  explain: $1/(2\pi\sqrt{LC})$.
- type: num
  q: Ground shift in mV from 2 A through 20 mΩ?
  answer: 40
  tol: 0.001
  unit: mV
  py: "2*0.020*1e3"
  explain: $IR$.
- type: mc
  q: Above its self-resonant frequency, a capacitor behaves like…
  options:
    - a better capacitor
    - an inductor
    - an open circuit
    - a diode
  answer: 1
  explain: The ESL term dominates.
- type: num
  q: Voltage droop in mV when 100 nF supplies 100 mA for 10 ns?
  answer: 10
  tol: 0.001
  unit: mV
  py: "0.1*10e-9/100e-9*1e3"
  explain: $\Delta V = I\Delta t/C$.
- type: mc
  q: A star ground…
  options:
    - joins all returns in a daisy chain
    - brings separate returns together at one point
    - is only for AC mains
    - removes the need for decoupling
  answer: 1
  explain: High-current returns don't share signal return paths.
- type: num
  q: SRF in MHz of 10 µF with 2 nH?
  answer: 1.1254
  tol: 0.002
  unit: MHz
  py: "1/(2*math.pi*math.sqrt(2e-9*10e-6))/1e6"
  explain: Big capacitors resonate low.
:::end

:::verify
import math
assert abs(2*math.pi*5e7*2e-9-0.628)<1e-3 and abs(1.5*0.05-0.075)<1e-12
:::end
