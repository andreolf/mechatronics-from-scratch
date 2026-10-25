---
id: p19-l01
minutes: 30
summary: A linear regulator burns the voltage difference as heat, a switching converter moves energy in small packets and wastes little. You derive both efficiencies, build a loss budget for a 12 V to 3.3 V, 2 A synchronous buck, compare it with a linear regulator, and see how switching frequency trades size for loss.
---

## Linear regulation

A linear regulator (an LDO or a 7805) is a transistor acting as a variable resistor between input and output. The full load current flows through it while it drops $V_{in} - V_{out}$, so

$$P_{loss} = (V_{in} - V_{out})\, I_{out} + V_{in} I_q, \qquad \eta = \frac{V_{out} I_{out}}{V_{in} (I_{out} + I_q)} \le \frac{V_{out}}{V_{in}}.$$

From 12 V to 3.3 V the best possible efficiency is 27.5 %: almost three quarters of the input power becomes heat. Linear regulators are still ideal for small currents, low noise (an ADC reference, Phase 07) and small dropouts.

## Switching conversion

A switching converter chops the input with transistors that are either fully on (small voltage across them) or fully off (no current), and smooths the result with an inductor and a capacitor, which store energy without dissipating it. Ideally it is lossless. Real losses come from:

- **conduction**: $I_{rms}^2 R$ in the MOSFET on-resistances and the inductor's copper (DCR),
- **switching**: during each transition the transistor briefly carries current and voltage together, about $\tfrac{1}{2} V_{in} I (t_r + t_f) f_s$,
- **gate drive**: $Q_g V_g f_s$ per transistor,
- **dead time**: both switches are off briefly to avoid shoot-through, and the body diode conducts,
- **controller** quiescent current.

Conduction losses do not depend on $f_s$; switching and gate losses grow with it. A higher frequency allows a smaller inductor and capacitor, which is why phone chargers switch at hundreds of kilohertz to megahertz.

:::figure widget=linvssw caption="Losses and temperature rise of a linear regulator and a buck converter for the same job. Change input voltage, load current and switching frequency."
:::end

## Worked example

12 V to 3.3 V at 2 A, illustrative component values (25 and 12 mΩ MOSFETs, 15 mΩ inductor, 10 ns transitions, 500 kHz):

1. Linear: efficiency 27.4 %, 17.46 W of heat. With a typical 40 K/W junction-to-ambient thermal resistance of a small package, that would be a 698 K rise: impossible without a large heatsink.
2. Buck: efficiency 95.2 %, 0.335 W of loss, a 13.4 K rise. The budget: switching overlap 120.0 mW, inductor copper 60.5 mW, gate drive 40.0 mW, low-side conduction 35.1 mW, dead-time diode 28.0 mW, high-side conduction 27.7 mW and controller 24.0 mW.
3. Efficiency falls with frequency: 97.3 % at 100 kHz, 95.2 % at 500 kHz, 88.0 % at 2 MHz and 76.5 % at 5 MHz.

This is an idealised budget; real 12 V bucks typically reach around 90 % at this load once capacitor, layout and magnetic core losses are included.

## Code it from scratch

:::code file=loss_budget.py
```python
import numpy as np

def linear_reg(vin, vout, iout, iq=5e-3):
    """a linear regulator drops the difference across a pass transistor: P_loss = (Vin - Vout) Iout + Vin Iq"""
    p_loss = (vin - vout) * iout + vin * iq; p_out = vout * iout
    return p_out / (p_out + p_loss), p_loss

def buck_losses(vin, vout, iout, fs=500e3, rds_hi=25e-3, rds_lo=12e-3, dcr=15e-3, t_sw=10e-9, qg=8e-9, vg=5.0, ripple=0.3, t_dead=20e-9, vf=0.7, iq=2e-3):
    """loss budget of a synchronous buck: conduction in both MOSFETs and the inductor, switching overlap, gate drive"""
    D = vout / vin; irms2 = iout**2 * (1 + ripple**2 / 12)             # rms squared of a triangle-on-DC current
    p = {"high-side conduction": D * irms2 * rds_hi,
         "low-side conduction": (1 - D) * irms2 * rds_lo,
         "inductor copper": irms2 * dcr,
         "switching overlap": 0.5 * vin * iout * 2 * t_sw * fs,         # rise and fall, each t_sw long
         "gate drive": 2 * qg * vg * fs,
         "dead-time diode": vf * iout * 2 * t_dead * fs,               # body diode conducts while both switches are off
         "controller": vin * iq}
    p_out = vout * iout
    return p_out / (p_out + sum(p.values())), p

def temp_rise(p, theta_ja=40.0): return p * theta_ja                    # K, from a junction-to-ambient thermal resistance

def test_compare():
    vin, vout, iout = 12.0, 3.3, 2.0
    eta_l, pl = linear_reg(vin, vout, iout); eta_s, parts = buck_losses(vin, vout, iout); ps = sum(parts.values())
    print(f"12 V to 3.3 V at 2 A: linear efficiency {100 * eta_l:.1f} %, loss {pl:.2f} W, temperature rise {temp_rise(pl):.0f} K")
    print(f"buck efficiency {100 * eta_s:.1f} %, loss {ps:.3f} W, temperature rise {temp_rise(ps):.1f} K")
    for k, v in parts.items(): print(f"  {k:22s} {1000 * v:6.1f} mW")
    assert eta_s > 0.85 and eta_l < vout / vin + 1e-12                   # a linear regulator can never beat Vout/Vin

def test_frequency_tradeoff():
    fs = np.array([100e3, 500e3, 2e6, 5e6]); eta = [buck_losses(12, 3.3, 2.0, fs=f)[0] for f in fs]
    print("efficiency against switching frequency:", ", ".join(f"{f / 1e3:.0f} kHz {100 * e:.1f} %" for f, e in zip(fs, eta)))
    assert all(np.diff(eta) < 0)                                          # switching losses grow with frequency

test_compare()
test_frequency_tradeoff()
print("PASS")
```
:::end

## In practice

Datasheets of buck controllers show efficiency curves against load, and vendor tools (TI WEBENCH, Analog Devices LTpowerCAD) produce loss budgets like this one. **ngspice** (lesson 02) simulates the switching waveforms. Use an LDO after a buck when you need both efficiency and low noise.

## Exercises

:::exercise
A sensor needs 3.3 V at 10 mA from a 5 V rail. Linear or switching?
:::solution
Linear: the loss is $(5 - 3.3) \times 0.01 = 17$ mW, negligible, and an LDO is quieter, smaller and cheaper than a buck.
:::end

:::exercise
Which loss terms grow if you double the switching frequency, and which shrink?
:::solution
Switching overlap, gate drive and dead-time losses double. Conduction losses stay the same for the same ripple; with the same inductor the ripple halves, so rms current and conduction loss fall slightly, and a smaller inductor (less copper) becomes possible.
:::end

## Quiz

:::quiz
- type: num
  q: Best possible efficiency of a linear regulator from 5 V to 3.3 V (percent)?
  answer: 66
  tol: 0.002
  py: "3.3/5*100"
  explain: Vout over Vin.
- type: num
  q: Heat in a linear regulator from 12 V to 5 V at 0.5 A (watts, ignore Iq)?
  answer: 3.5
  tol: 0.002
  py: "(12-5)*0.5"
  explain: (Vin − Vout) Iout.
- type: num
  q: Gate-drive loss of one MOSFET with Qg 10 nC at 5 V and 1 MHz (mW)?
  answer: 50
  tol: 0.002
  py: "10e-9*5*1e6*1000"
  explain: Qg Vg fs.
- type: num
  q: Switching-overlap loss at 24 V, 3 A, tr + tf = 20 ns, 400 kHz (W)?
  answer: 0.288
  tol: 0.002
  py: "0.5*24*3*20e-9*400e3"
  explain: ½ V I (tr + tf) fs.
- type: mc
  q: Raising the switching frequency mainly…
  options:
    - shrinks the inductor and capacitor but raises switching losses
    - lowers every loss
    - raises conduction losses
    - has no effect on efficiency
  answer: 0
  explain: Size against switching loss.
- type: mc
  q: A linear regulator is the better choice for…
  options:
    - a low-noise supply at small current and small dropout
    - 20 A from 48 V to 12 V
    - a battery-powered motor driver
    - a 12 V to 1 V conversion at 10 A
  answer: 0
  explain: Its loss is small only when dropout or current is small.
:::end
