---
id: p19-l07
minutes: 30
summary: An N-channel high-side MOSFET needs a gate voltage above its own source, which floats at the input voltage. You learn how gate drivers and bootstrap circuits provide it, size a bootstrap capacitor from the charge it must deliver, simulate its charge and droop cycle by cycle, and see why a bootstrap cannot hold the switch on at 100 % duty.
---

## Why a driver

A MOSFET switches when its gate-source capacitance is charged to about 10 V and discharged to 0 V. Charging $Q_g$ in 20 ns needs $Q_g/t = 60\,\text{nC}/20\,\text{ns} = 3$ A of peak current, far more than a microcontroller pin gives. A **gate driver** amplifies the logic signal into amperes of gate current, adds dead time between the high and low switches, and often an undervoltage lockout (UVLO) that keeps the switches off when the gate supply is too low to turn them fully on.

## The high-side problem

In a half-bridge (buck, motor inverter) the high-side N-channel MOSFET's source is the switch node, which swings between 0 V and $V_{in}$. To turn it on, its gate must be about 10 V *above* $V_{in}$. A **bootstrap** circuit makes this supply: a diode and capacitor $C_b$ from the driver's 12 V supply to the switch node.

- Low side on: the switch node is at ground, and $C_b$ charges to $V_{dd} - V_f$ through the diode.
- High side on: the switch node rises to $V_{in}$, carrying $C_b$ with it. The diode blocks, and $C_b$ powers the floating high-side driver.

## Sizing

While the high side is on, $C_b$ supplies the gate charge, the floating driver's quiescent current, leakage and level-shifter charge. For a droop of at most $\Delta V$:

$$C_b \ge \frac{Q_g + Q_{ls} + (I_q + I_{leak})\, t_{on,max}}{\Delta V}.$$

Choose a value several times larger, with a low-ESR ceramic capacitor rated above $V_{dd}$. The capacitor recharges only while the low side is on, so the duty cycle cannot reach 100 % for long: the voltage drains towards the UVLO threshold. Designs that need 100 % duty use a charge pump or an isolated supply.

:::figure widget=bootstrap caption="Bootstrap capacitor voltage over switching cycles: charging when the low side is on, drooping when the high side is on. Change the capacitor, duty cycle and gate charge."
:::end

## Worked example

Illustrative values: $Q_g = 60$ nC, $Q_{ls} = 5$ nC, $I_q = 150$ µA, $I_{leak} = 20$ µA, 20 kHz at $D = 0.9$ (on-time 45 µs), 12 V driver supply, 0.6 V diode:

1. The charge per cycle is 72.7 nC, so $C_b \ge 145$ nF for 0.5 V droop. We choose 470 nF.
2. The simulation starts at 11.4 V and its minimum is 11.226 V, a droop of 0.174 V, within the 0.5 V budget.
3. At 100 % duty the voltage reaches the 8 V undervoltage lockout after 9.02 ms and the driver turns the switch off.

## Code it from scratch

:::code file=bootstrap.py
```python
import numpy as np

def boot_cap(qg=60e-9, iq=150e-6, ileak=20e-6, t_on=50e-6, dv=0.5, qls=5e-9):
    """bootstrap capacitor: it must deliver the gate charge, the high-side driver's quiescent and leakage current
    for the longest on-time, and the level-shifter charge, while drooping no more than dv"""
    q = qg + (iq + ileak) * t_on + qls; return q / dv, q

def simulate(Cb, vdd=12.0, vf=0.6, r_chg=5.0, qg=60e-9, iq=150e-6, ileak=20e-6, qls=5e-9, fs=20e3, D=0.9, periods=200, n=400):
    """switch-node cycles: low side on -> Cb charges from Vdd through the diode and a resistance;
    high side on -> Cb supplies the gate charge at turn-on, then the driver's quiescent and leakage current"""
    T = 1 / fs; dt = T / n; v = vdd - vf; hist, vmin, was_on = [], v, False
    for p in range(periods):
        for k in range(n):
            on = k < round(D * n)
            if on:                                                            # high side on: switch node at Vin
                if not was_on: v -= (qg + qls) / Cb                           # gate charge pulled at turn-on
                v -= (iq + ileak) * dt / Cb
            else:                                                             # low side on: switch node at ground
                v += max(0.0, (vdd - vf - v) / r_chg) * dt / Cb
            was_on = on
            v = max(v, 0.0); vmin = min(vmin, v)
            if p == periods - 1 or D >= 1: hist.append(v)
    return vmin, np.array(hist)

def test_sizing_and_droop():
    t_on = 0.9 / 20e3; Cb, q = boot_cap(t_on=t_on)
    C_pick = 0.47e-6                                                          # next standard value above, with margin
    vmin, _ = simulate(C_pick)
    print(f"charge per cycle {1e9 * q:.1f} nC -> Cb >= {1e9 * Cb:.0f} nF for 0.5 V droop; chosen 470 nF")
    print(f"simulated minimum bootstrap voltage {vmin:.3f} V (start {12 - 0.6:.1f} V), droop {12 - 0.6 - vmin:.3f} V")
    assert C_pick >= Cb and 12 - 0.6 - vmin < 0.5

def test_hundred_percent_duty():
    _, h = simulate(0.47e-6, D=1.0, periods=400)                              # 20 ms with the high side always on
    uvlo = 8.0; t_fail = np.argmax(h < uvlo) * (1 / 20e3 / 400)
    print(f"100 % duty: the bootstrap voltage reaches the {uvlo} V undervoltage lockout after {1000 * t_fail:.2f} ms")
    assert (h < uvlo).any() and t_fail < 20e-3                                # a bootstrap cannot hold the gate on forever

test_sizing_and_droop()
test_hundred_percent_duty()
print("PASS")
```
:::end

## In practice

Half-bridge drivers such as the IR2110 family, the TI UCC27211 or the gate drivers integrated in motor-driver chips have bootstrap diodes inside or need an external fast diode. Their datasheets give $I_q$ and the formula above. In ngspice, simulate a few hundred cycles to check the droop and the start-up, when $C_b$ is empty and needs a few low-side pulses before the high side can switch.

## Exercises

:::exercise
At start-up the bootstrap capacitor is empty. What must the controller do before the first high-side pulse?
:::solution
Turn the low side on (or run a few short low-side pulses) so $C_b$ charges through the diode. Many drivers hold the high side off until the bootstrap voltage passes its UVLO.
:::end

:::exercise
Why is the bootstrap diode a fast or ultrafast type?
:::solution
When the switch node rises, the diode must block quickly. A slow diode conducts in reverse during recovery, discharging $C_b$ into the supply and causing losses and noise.
:::end

## Quiz

:::quiz
- type: num
  q: Minimum bootstrap capacitor for 80 nC per cycle and 0.4 V droop (nF)?
  answer: 200
  tol: 0.002
  py: "80e-9/0.4*1e9"
  explain: Q/ΔV.
- type: num
  q: Charge drawn by 200 µA over a 100 µs on-time (nC)?
  answer: 20
  tol: 0.002
  py: "200e-6*100e-6*1e9"
  explain: I t.
- type: num
  q: Peak gate current to deliver 40 nC in 10 ns (A)?
  answer: 4
  tol: 0.002
  py: "40e-9/10e-9"
  explain: Q/t.
- type: num
  q: Initial bootstrap voltage from a 15 V supply with a 0.7 V diode (V)?
  answer: 14.3
  tol: 0.002
  py: "15-0.7"
  explain: Vdd − Vf.
- type: mc
  q: The bootstrap capacitor recharges when…
  options:
    - the low-side switch is on and the switch node is at ground
    - the high-side switch is on
    - both switches are on
    - the input voltage is maximum
  answer: 0
  explain: Only then is the diode forward biased.
- type: mc
  q: A design that must keep the high-side switch on indefinitely needs…
  options:
    - a charge pump or isolated gate supply
    - a larger bootstrap capacitor only
    - a slower diode
    - a lower switching frequency
  answer: 0
  explain: A bootstrap only refills during low-side on-time.
:::end
