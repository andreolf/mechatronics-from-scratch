---
id: p05-l12
minutes: 35
summary: A bipolar transistor lets a microcontroller pin switch a load that needs far more current than the pin can give. You learn the three regions, size a base resistor so a relay switches fully on, and see why a transistor left in the active region gets hot.
---

## How an NPN transistor switches

An NPN BJT has three terminals: base, collector and emitter. A small base current $I_B$ (into the base, out of the emitter) allows a much larger collector current:

- **Cut-off**: $V_{BE} < $ about 0.6 V and no base current, so the transistor is off and $I_C \approx 0$.
- **Active**: $I_C = \beta I_B$, with $\beta$ (also called $h_{FE}$) typically 50 to 400. It varies widely between parts and with temperature and current, so never design for an exact value. $V_{CE}$ is whatever the rest of the circuit leaves.
- **Saturation**: the load limits the current below $\beta I_B$. The transistor is fully on with $V_{CE(sat)} \approx 0.1$–0.3 V.

As a switch, you want only cut-off and saturation. Dissipation is $V_{CE}I_C$: near zero in both of those states, but large in the active region where both are significant.

**The low-side switch.** The load goes from the supply to the collector, the emitter goes to ground, and the GPIO pin drives the base through a resistor $R_B$:

$$I_B = \frac{V_{in} - V_{BE}}{R_B}, \qquad \text{saturated if } \beta_{min}I_B > I_{C(sat)} = \frac{V_{CC} - V_{CE(sat)}}{R_{load}}.$$

Design with an **overdrive** factor of 2 to 5 over the minimum β so the switch saturates for every part and temperature. Add a flyback diode across inductive loads (lesson 6).

:::figure widget=bjt caption="An NPN switch driving a 400 Ω relay coil from 12 V. Raise R_B or lower β and the transistor drops out of saturation into the hot active region."
:::end

## Worked example

A 3.3 V pin drives a 12 V relay with a 400 Ω coil. The datasheet guarantees $\beta \ge 100$.

1. Load current when fully on: $(12 - 0.2)/400 = 29.5$ mA, more than most GPIO pins should supply.
2. Minimum base current: $29.5/100 = 0.295$ mA. With an overdrive of 3: 0.885 mA.
3. $R_B = (3.3 - 0.7)/0.885 = 2.94$ kΩ; use 2.7 kΩ, giving $I_B = 0.963$ mA.
4. With 4.7 kΩ: $I_B = 0.553$ mA and $\beta I_B = 55.3$ mA > 29.5 mA, so it still saturates (overdrive 1.9) and dissipates $0.2\times29.5 = 5.9$ mW.
5. With 47 kΩ: $I_B = 55.3$ µA and $I_C = 5.5$ mA, active region. $V_{CE} = 12 - 5.53\times0.4 = 9.79$ V, dissipation 54 mW, and the relay never pulls in.

## Code it from scratch

:::code file=bjt_switch.py
```python
VBE, VCESAT = 0.7, 0.2

def switch(vin, rb, beta, vcc, rload):
    """Piecewise model of an NPN low-side switch. Returns (region, ib, ic, vce, power)."""
    ib = max(0.0, (vin - VBE) / rb)
    ic_sat = (vcc - VCESAT) / rload
    if ib == 0:
        return "cutoff", 0.0, 0.0, vcc, 0.0
    if beta * ib >= ic_sat:
        return "saturation", ib, ic_sat, VCESAT, VCESAT * ic_sat
    ic = beta * ib
    vce = vcc - ic * rload
    return "active", ib, ic, vce, vce * ic

def base_resistor(vin, ic, beta_min, overdrive=3.0):
    return (vin - VBE) / (overdrive * ic / beta_min)

if __name__ == "__main__":
    ic = (12 - VCESAT) / 400
    assert abs(ic - 0.0295) < 1e-12
    rb = base_resistor(3.3, ic, 100)
    assert abs(rb - 2937.9) < 0.1
    for beta in (100, 150, 400):                     # every guaranteed part saturates with 2.7 k
        assert switch(3.3, 2700, beta, 12, 400)[0] == "saturation"
    reg, ib, ic2, vce, p = switch(3.3, 4700, 100, 12, 400)
    assert reg == "saturation" and abs(p - 0.0059) < 1e-6 and abs(100 * ib / ic2 - 1.8745) < 1e-3
    reg, ib, ic3, vce, p = switch(3.3, 47000, 100, 12, 400)
    print(f"47 k base resistor: {reg}, Ic = {ic3*1e3:.2f} mA, Vce = {vce:.2f} V, P = {p*1e3:.1f} mW")
    assert reg == "active" and abs(vce - 9.787) < 1e-3 and abs(p - 0.05412) < 1e-4
    assert switch(0.0, 2700, 100, 12, 400)[0] == "cutoff"
```
:::end

## Exercises

:::exercise
A BJT with $\beta_{min} = 50$ must switch a 1 A load from a 5 V pin with overdrive 2. What base current and resistor do you need, and is that reasonable?
:::solution
$I_B = 2\times1/50 = 40$ mA and $R_B = 4.3/0.04 = 107.5$ Ω. 40 mA is too much for a GPIO pin. Use a logic-level MOSFET (lesson 13) or a Darlington pair instead.
:::end

:::exercise
Where is the transistor's dissipation highest as $V_{in}$ ramps slowly from 0 to 3.3 V with the relay load?
:::solution
In the active region $P = (V_{CC} - I_CR)I_C$, which peaks when $I_CR = V_{CC}/2$: $I_C = 15$ mA and $P = 6\times0.015 = 90$ mW. Switch quickly through this region.
:::end

## Quiz

:::quiz
- type: num
  q: Relay current in mA when the switch is fully on (12 V, 400 Ω, VCE(sat) 0.2 V)?
  answer: 29.5
  tol: 0.001
  unit: mA
  py: "(12-0.2)/400*1e3"
  explain: $(V_{CC} - V_{CE(sat)})/R$.
- type: num
  q: Base resistor in kΩ for overdrive 3 with βmin = 100 from a 3.3 V pin?
  answer: 2.9379
  tol: 0.002
  unit: kΩ
  py: "(3.3-0.7)/(3*29.5/100)"
  explain: $I_B = 3I_C/\beta_{min}$.
- type: mc
  q: A BJT used as a switch should operate in…
  options:
    - the active region
    - cut-off or saturation only
    - breakdown
    - reverse active
  answer: 1
  explain: Those are the two low-dissipation states.
- type: num
  q: With a 47 kΩ base resistor and β = 100, what is VCE in volts?
  answer: 9.7872
  tol: 0.002
  unit: V
  py: "12-100*(3.3-0.7)/47000*400"
  explain: It's in the active region.
- type: num
  q: What is the maximum active-region dissipation in mW for 12 V and 400 Ω?
  answer: 90
  tol: 0.001
  unit: mW
  py: "12**2/(4*400)*1e3"
  explain: $V_{CC}^2/(4R)$ at half the supply.
- type: mc
  q: Why design with overdrive instead of exactly $I_B = I_C/\beta$?
  options:
    - β varies widely between parts and with temperature
    - it lowers the base current
    - it makes the transistor slower on purpose
    - it isn't needed
  answer: 0
  explain: The guaranteed minimum β must still saturate.
:::end

:::verify
assert abs(2.6/(2.7)-0.963)<5e-4 and abs(4.3/0.04-107.5)<1e-9
:::end
