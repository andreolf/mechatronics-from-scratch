---
id: p19-l06
minutes: 35
summary: Every watt a switch loses must leave through a chain of thermal resistances, and its on-resistance rises as it heats. You compute conduction, switching and gate losses of a MOSFET, solve the junction temperature as a fixed point, size a heatsink, detect a design with no safe equilibrium, and see how fast the junction heats after a power step.
---

## Losses

A hard-switched MOSFET carrying $I$ at duty $D$ loses

$$P = D I^2 R_{ds}(T_j) + \tfrac12 V I (t_r + t_f) f_s + Q_g V_g f_s,$$

and $R_{ds}$ rises with junction temperature, roughly 0.4 to 0.5 % per kelvin for silicon (the datasheet gives a normalised curve, often 1.5 to 2 times the 25 °C value at 150 °C).

## The thermal path

Heat flows from the junction to the case, through a thermal interface to the heatsink, and from the heatsink to air. Like resistors in series (Phase 02),

$$T_j = T_a + P\,(\theta_{jc} + \theta_{cs} + \theta_{sa}).$$

Because $P$ depends on $T_j$, solve this as a fixed point: start at ambient, compute losses, compute the temperature, repeat. If the loss grows faster with temperature than the path can remove it, there is no safe equilibrium and the part heats until it fails. Design for a margin below the datasheet maximum (often 150 or 175 °C) with the losses evaluated at the target temperature.

## Transients

Thermal masses act like capacitors: the die heats in milliseconds, the package in seconds, the heatsink in minutes. Datasheets give the **transient thermal impedance** as a Foster RC network, $Z_{th}(t) = \sum_i R_i (1 - e^{-t/\tau_i})$, which shows how long a short overload is safe.

:::figure widget=thermalnet caption="The thermal network from junction to air. Change current, switching frequency and heatsink; the readout shows losses and the junction temperature, or that there is no safe equilibrium."
:::end

## Worked example

Illustrative values: 25 A at $D = 0.5$, 24 V, 100 kHz, $R_{ds} = 8$ mΩ at 25 °C, 40 °C ambient, $\theta_{jc} = 0.8$ K/W and $\theta_{cs} = 0.5$ K/W:

1. At $T_j = 100$ °C the losses are 3.344 W conduction, 1.2 W switching and 0.03 W gate drive, 4.574 W in total.
2. To keep $T_j$ at or below 100 °C (125 °C less a 25 K margin), the heatsink needs $\theta_{sa} \le 11.82$ K/W; with it the junction settles at 100.00 °C.
3. In free air (about 62 K/W for a TO-220 package) the iteration finds no equilibrium below 400 °C: the part would be destroyed. At 3 A the same package settles at 53.3 °C without a heatsink.
4. After a 5 W step, the junction rises 1.00 K in 1 ms, 3.70 K in 0.1 s, 7.54 K in 10 s and 16.50 K after 300 s, approaching $5 \times 3.3 = 16.5$ K.

## Code it from scratch

:::code file=thermal.py
```python
import numpy as np

def mosfet_loss(Tj, I=25.0, rds25=8e-3, alpha=0.0045, D=0.5, V=24.0, t_sw=20e-9, fs=100e3, qg=30e-9, vg=10.0):
    """losses of a hard-switched MOSFET: conduction rises with junction temperature, switching does not (simplified)"""
    rds = rds25 * (1 + alpha * (Tj - 25))                                   # on-resistance grows about 0.45 %/K
    return {"conduction": D * I**2 * rds, "switching": 0.5 * V * I * 2 * t_sw * fs, "gate": qg * vg * fs}

def junction_temp(theta, Ta=40.0, **kw):
    """solve Tj = Ta + P(Tj) * theta_total by fixed-point iteration; None if it never settles (thermal runaway)"""
    Tj = Ta
    for _ in range(200):
        Tn = Ta + sum(mosfet_loss(Tj, **kw).values()) * theta
        if Tn > 400: return None
        if abs(Tn - Tj) < 1e-9: return Tn
        Tj = Tn
    return None

def heatsink_needed(Tmax=125.0, margin=25.0, theta_jc=0.8, theta_cs=0.5, Ta=40.0, **kw):
    """largest heatsink-to-ambient resistance that keeps Tj below Tmax - margin"""
    Tt = Tmax - margin; P = sum(mosfet_loss(Tt, **kw).values())          # losses at the target temperature
    return (Tt - Ta) / P - theta_jc - theta_cs, P

def transient(P, R=(0.3, 0.5, 2.5), tau=(1e-3, 0.05, 30.0), t=np.array([1e-3, 0.01, 0.1, 1, 10, 100, 300])):
    """Foster thermal network: the junction rise after a power step is a sum of RC exponentials"""
    return np.array([sum(P * r * (1 - np.exp(-ti / ta)) for r, ta in zip(R, tau)) for ti in t]), t

def test_losses_and_heatsink():
    loss = mosfet_loss(100.0); print("losses at Tj = 100 C:", {k: round(v, 3) for k, v in loss.items()}, f"total {sum(loss.values()):.3f} W")
    th, P = heatsink_needed()
    Tj = junction_temp(0.8 + 0.5 + th)
    print(f"heatsink needed: theta_sa <= {th:.2f} K/W (at {P:.2f} W); with it Tj settles at {Tj:.2f} C")
    assert Tj is not None and Tj <= 100.0 + 1e-6

def test_no_heatsink_and_runaway():
    Tj = junction_temp(62.0)                                                 # a TO-220 in free air, about 62 K/W
    print(f"no heatsink (62 K/W): {'no equilibrium below 400 C: the part is destroyed' if Tj is None else f'Tj = {Tj:.1f} C'}")
    small = junction_temp(62.0, I=3.0); print(f"no heatsink at 3 A: Tj = {small:.1f} C")
    assert Tj is None and small < 125

def test_transient():
    rise, t = transient(5.0)
    print("junction rise after a 5 W step:", ", ".join(f"{ti:g} s {r:.2f} K" for ti, r in zip(t, rise)))
    assert np.all(np.diff(rise) > 0) and abs(rise[-1] - 5 * 3.3) < 0.5

test_losses_and_heatsink()
test_no_heatsink_and_runaway()
test_transient()
print("PASS")
```
:::end

## In practice

MOSFET datasheets list $\theta_{jc}$, the $R_{ds}$ temperature curve and $Z_{th}$ curves; heatsink datasheets give $\theta_{sa}$ against airflow. NumPy is enough for these budgets; for a board, a thermal camera or a thermocouple on the case checks the result. On a PCB without heatsink, copper area is the heatsink, and the package datasheet gives $\theta_{ja}$ for a standard board.

## Exercises

:::exercise
The same MOSFET must also survive a 0.1 s overload at 15 W. Using the transient network, how much does the junction rise?
:::solution
The rise scales with power: at 0.1 s the 5 W step gave 3.70 K, so 15 W gives about 11.1 K above the starting temperature. Short overloads are mostly absorbed by the die and package.
:::end

:::exercise
Why evaluate the losses at the target temperature rather than at 25 °C?
:::solution
$R_{ds}$ at 100 °C is about 34 % higher than at 25 °C in this model, so the conduction loss is too. Using 25 °C values would undersize the heatsink.
:::end

## Quiz

:::quiz
- type: num
  q: Junction temperature with 3 W through 0.5 + 0.3 + 4 K/W at 35 °C ambient (°C)?
  answer: 49.4
  tol: 0.002
  py: "35+3*(0.5+0.3+4)"
  explain: Ta + P Σθ.
- type: num
  q: Conduction loss of 20 A at D = 0.4 through 10 mΩ (W)?
  answer: 1.6
  tol: 0.002
  py: "0.4*20**2*0.01"
  explain: D I² Rds.
- type: num
  q: Rds at 125 °C if it is 5 mΩ at 25 °C and rises 0.45 %/K (mΩ)?
  answer: 7.25
  tol: 0.002
  py: "5*(1+0.0045*100)"
  explain: Linear temperature coefficient.
- type: num
  q: Largest heatsink resistance for 10 W, Tj 110 °C, Ta 40 °C, θjc + θcs = 1 K/W (K/W)?
  answer: 6
  tol: 0.002
  py: "(110-40)/10-1"
  explain: Total allowed minus the rest of the path.
- type: mc
  q: The fixed-point iteration for Tj finds no equilibrium when…
  options:
    - losses grow with temperature faster than the thermal path removes them
    - the ambient temperature is below 25 °C
    - the switching frequency is low
    - the heatsink is too large
  answer: 0
  explain: The temperature keeps rising.
- type: mc
  q: A Foster network's longest time constant usually belongs to…
  options:
    - the heatsink
    - the silicon die
    - the bond wires
    - the gate capacitance
  answer: 0
  explain: The largest thermal mass.
:::end
