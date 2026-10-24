---
id: p05-l13
minutes: 35
summary: A MOSFET switches amps with almost no gate current, but only if you drive the gate hard enough. You learn threshold voltage versus on-resistance, compute conduction and switching losses for a 5 A motor load, and see why a 3.3 V pin needs a logic-level part or a gate driver.
---

## How an N-channel MOSFET switches

A MOSFET's gate is insulated from the channel, so in steady state no gate current flows. It's controlled by the gate-source voltage $V_{GS}$:

- **Below the threshold** $V_{GS(th)}$, typically 1–4 V: off. Note the datasheet's threshold is where it *starts* to conduct, at perhaps 250 µA. It's not a useful on-voltage.
- **Well above threshold**: the channel acts like a small resistor $R_{DS(on)}$, quoted at specific gate voltages (for example "10 mΩ at $V_{GS} = 10$ V, 14 mΩ at 4.5 V"). Logic-level parts specify $R_{DS(on)}$ at 4.5 V or 2.5 V.

Losses have two parts:

- **Conduction**: $P = I^2R_{DS(on)}$ while on (scaled by the PWM duty cycle).
- **Switching**: during each transition both voltage and current are significant. Roughly $P_{sw} \approx \tfrac12VI(t_r + t_f)f_{PWM}$.

**The gate is a capacitor.** It must be charged with the total gate charge $Q_g$ (tens of nC) at every switch. A GPIO pin that can deliver 20 mA needs $Q_g/I = 1$ µs, which is slow, and slow edges mean switching loss. Gate-driver ICs supply amps to switch in tens of nanoseconds. Always fit a gate pull-down resistor (around 100 kΩ) so the MOSFET stays off while the microcontroller boots.

:::figure widget=mosfet caption="On-resistance against gate voltage for a simplified logic-level MOSFET model (threshold 1.8 V, 10 mΩ at 10 V). Under-drive the gate and conduction loss climbs fast."
:::end

## Worked example

A 12 V brushed motor draws 5 A through a low-side MOSFET. Its on-resistance follows the lesson's simplified model $R_{DS(on)} = 10\text{ mΩ}\times\frac{10 - 1.8}{V_{GS} - 1.8}$. Real parts give a table or curve; use that.

1. At $V_{GS} = 10$ V: 10 mΩ, so $P = 25\times0.01 = 0.25$ W.
2. At 4.5 V (a 5 V gate drive): 30.4 mΩ, so 0.76 W.
3. Straight from a 3.3 V pin: 54.7 mΩ, so 1.37 W, and on a small package without a heatsink (about 62 °C/W) that's an 85 °C rise. Don't.
4. Switching at 20 kHz with 50 ns edges: $\tfrac12\times12\times5\times100\text{ ns}\times20\,000 = 0.06$ W. Driven from the 20 mA pin (1 µs edges with a 20 nC gate), that becomes 1.2 W.
5. To keep conduction loss under 0.5 W you need $R_{DS(on)} < 20$ mΩ, which means $V_{GS} > 5.9$ V. Use a gate driver at 10–12 V.

## Code it from scratch

:::code file=mosfet.py
```python
def rdson(vgs, vth=1.8, r10=0.010):
    if vgs <= vth:
        return float("inf")
    return r10 * (10 - vth) / (vgs - vth)

def losses(vgs, I, V, f, t_edge):
    p_cond = I * I * rdson(vgs)
    p_sw = 0.5 * V * I * (2 * t_edge) * f
    return p_cond, p_sw

if __name__ == "__main__":
    assert abs(rdson(10) - 0.010) < 1e-15
    for vgs, expect in ((10, 0.25), (4.5, 0.75926), (3.3, 1.36667)):
        pc, _ = losses(vgs, 5, 12, 20e3, 50e-9)
        assert abs(pc - expect) < 1e-4, (vgs, pc)
    _, psw = losses(10, 5, 12, 20e3, 50e-9)
    assert abs(psw - 0.06) < 1e-12
    t_gpio = 20e-9 / 20e-3                               # Qg / I
    _, psw_slow = losses(10, 5, 12, 20e3, t_gpio)
    print(f"GPIO gate edge {t_gpio*1e6:.1f} us -> switching loss {psw_slow:.2f} W")
    assert abs(t_gpio - 1e-6) < 1e-15 and abs(psw_slow - 1.2) < 1e-9
    # minimum gate voltage for < 0.5 W conduction loss
    vmin = 1.8 + 0.010 * 8.2 / (0.5 / 25)
    assert abs(vmin - 5.9) < 1e-9 and abs(losses(vmin, 5, 12, 0, 0)[0] - 0.5) < 1e-12
    assert abs(1.36667 * 62 - 84.7) < 0.1                # temperature rise without a heatsink
```
:::end

## Exercises

:::exercise
A gate driver supplies 1 A peak. How long does a 20 nC gate take to switch, and what switching loss results at 20 kHz, 12 V and 5 A?
:::solution
$t = 20\text{ nC}/1\text{ A} = 20$ ns per edge, so $P_{sw} = \tfrac12\times12\times5\times40\text{ ns}\times20\,000 = 0.024$ W.
:::end

:::exercise
At 50 % PWM duty cycle and $V_{GS} = 10$ V, what's the conduction loss at 5 A?
:::solution
$0.5\times0.25 = 0.125$ W: conduction only happens while the switch is on.
:::end

## Quiz

:::quiz
- type: num
  q: Model R_DS(on) in mΩ at V_GS = 4.5 V?
  answer: 30.370
  tol: 0.002
  unit: mΩ
  py: "10*8.2/2.7"
  explain: $10\times(10 - 1.8)/(4.5 - 1.8)$.
- type: num
  q: Conduction loss in W at 5 A and V_GS = 3.3 V?
  answer: 1.36667
  tol: 0.002
  unit: W
  py: "25*0.010*8.2/1.5"
  explain: $I^2R_{DS(on)}$ with 54.7 mΩ.
- type: num
  q: Switching loss in W at 12 V, 5 A, 20 kHz and 50 ns edges?
  answer: 0.06
  tol: 0.001
  unit: W
  py: "0.5*12*5*100e-9*20e3"
  explain: $\tfrac12VI(t_r + t_f)f$.
- type: mc
  q: The datasheet threshold voltage V_GS(th) is…
  options:
    - the voltage for full conduction
    - where the MOSFET just begins to conduct
    - the maximum gate voltage
    - the body diode drop
  answer: 1
  explain: You need several volts more for a low $R_{DS(on)}$.
- type: num
  q: How long in µs does a 20 mA pin take to deliver a 20 nC gate charge?
  answer: 1
  tol: 0.001
  unit: µs
  py: "20e-9/20e-3*1e6"
  explain: $Q_g/I$.
- type: mc
  q: A gate pull-down resistor…
  options:
    - speeds up switching
    - keeps the MOSFET off while the driving pin floats
    - lowers $R_{DS(on)}$
    - replaces the flyback diode
  answer: 1
  explain: A floating gate can drift on and partly conduct.
:::end

:::verify
assert abs(0.5*12*5*40e-9*20e3-0.024)<1e-12 and abs(0.010*8.2/2.7*1000-30.37)<0.01 and abs(0.010*8.2/1.5*1000-54.7)<0.05
:::end
