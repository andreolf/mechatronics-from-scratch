---
id: p19-l14
minutes: 40
summary: Lithium-ion cells charge with constant current, then constant voltage. You write the charger as a state machine with precharge, CC, CV, done and fault states, close a voltage loop with a clamped integrator, and check on a simulated cell that voltage and current never exceed their limits and that over-temperature stops charging.
---

## The CC/CV profile

A Li-ion charger pushes a **constant current** (CC), often 0.5C to 1C, until the cell voltage reaches its maximum (4.2 V for many NMC cells). It then holds that **constant voltage** (CV) while the current tapers as the cell's internal RC voltages relax, and stops when the current falls below a termination level such as C/20. A deeply discharged cell first gets a small **precharge** current (C/10) until it recovers above about 3.0 V. Never exceeding the maximum voltage matters: overcharge causes lithium plating and can lead to thermal runaway.

## A state machine

States are the clearest way to write the logic:

- IDLE chooses PRECHARGE or CC from the voltage;
- PRECHARGE moves to CC above $V_{pre}$;
- CC moves to CV near $V_{max}$;
- CV ends in DONE once $i < I_{end}$;
- any active state goes to FAULT on temperature outside 0 to 45 °C, a timeout, or overvoltage.

In CV, a PI loop adjusts the current command from the voltage error $V_{max} - v$. Its integrator must be clamped (anti-windup) and initialised to the CC current when CV starts (bumpless transfer); without both, the simulation overshot by about 10 mV. The values here are illustrative; use the cell datasheet's limits.

:::figure widget=ccvcplot caption="Voltage, current and state through a charge. Change the CC rate, termination current and the cell's temperature rise; a fault shows where charging stopped."
:::end

## Worked example

Illustrative 3 Ah cell from 2 % SOC, 1C CC, 4.20 V, termination C/20, half-second steps:

1. PRECHARGE from 0.0 min, CC from 30.6 min, CV from 79.0 min, DONE at 98.7 min with SOC 98.8 %.
2. Maximum voltage 4.2009 V (within the 5 mV regulation tolerance), maximum current 3.000 A.
3. 83 % of the charge went in during CC; CV adds the last part slowly.
4. With the cell heating 1 K per minute from 25 °C, the charger faults at 20.0 min (45 °C) and the current goes to 0.

## Code it from scratch

:::code file=charger.py
```python
import numpy as np

Q = 3.0; R0, R1, C1 = 0.022, 0.015, 1500.0                          # illustrative cell (Lessons 10-12)
def ocv(s): return 3.0 + 1.2 * s - 0.25 * np.exp(-12 * s) + 0.05 * np.sin(3 * s)

V_MAX, V_PRE, I_CC, I_PRE, I_END = 4.20, 3.00, 1.0 * Q, 0.1 * Q, 0.05 * Q
T_MIN, T_MAX, TIMEOUT = 0.0, 45.0, 4 * 3600
V_TOL = 0.005                                                      # regulation tolerance (illustrative; check the cell datasheet)

class Charger:
    """IDLE -> PRECHARGE (deeply empty) -> CC -> CV -> DONE, with FAULT from any active state."""
    def __init__(self): self.state, self.i, self.integ, self.t = "IDLE", 0.0, 0.0, 0.0
    def step(self, v, temp, dt):
        s = self.state
        if s in ("PRECHARGE", "CC", "CV"):
            self.t += dt
            if not (T_MIN <= temp <= T_MAX) or self.t > TIMEOUT or v > V_MAX + 0.05: self.state = "FAULT"
        if s == "IDLE": self.state = "PRECHARGE" if v < V_PRE else "CC"
        elif s == "PRECHARGE" and self.state != "FAULT":
            if v >= V_PRE: self.state = "CC"
        elif s == "CC" and self.state != "FAULT":
            if v >= V_MAX - 0.010: self.state, self.integ = "CV", self.i - 20.0 * (V_MAX - v)   # bumpless transfer
        elif s == "CV" and self.state != "FAULT":
            if self.i < I_END: self.state = "DONE"
        st = self.state
        if st == "PRECHARGE": self.i = I_PRE
        elif st == "CC": self.i = min(I_CC, self.i + I_CC * dt / 2)                  # soft start, 2 s ramp
        elif st == "CV":
            self.integ = float(np.clip(self.integ + 10.0 * (V_MAX - v) * dt, 0, I_CC))     # PI voltage loop, clamped integrator (anti-windup)
            self.i = float(np.clip(self.integ + 20.0 * (V_MAX - v), 0, I_CC))
        else: self.i = 0.0
        return self.i

def charge(soc0=0.02, temp=lambda t: 25.0, dt=0.5):
    ch = Charger(); soc, v1, t = soc0, 0.0, 0.0; log = []
    a = np.exp(-dt / (R1 * C1))
    while ch.state not in ("DONE", "FAULT") and t < 6 * 3600:
        v = ocv(soc) + R0 * ch.i + v1                                                  # terminal voltage while charging
        i = ch.step(v, temp(t), dt)
        v = ocv(soc) + R0 * i + v1
        log.append((t, ch.state, i, v, soc))
        v1 = a * v1 + R1 * (1 - a) * i; soc += i * dt / (Q * 3600); t += dt
    return ch, log

def test_full_charge():
    ch, log = charge()
    t, st, i, v, soc = map(np.array, zip(*log))
    first = {s: t[st == s][0] / 60 for s in ("PRECHARGE", "CC", "CV")}
    print("state entered at (min): " + ", ".join(f"{k} {val:.1f}" for k, val in first.items()))
    print(f"finished {ch.state} after {t[-1] / 60:.1f} min at SOC {100 * soc[-1]:.1f} %")
    print(f"max voltage {v.max():.4f} V (limit {V_MAX} V + {1000 * V_TOL:.0f} mV tolerance), max current {i.max():.3f} A (limit {I_CC})")
    assert ch.state == "DONE" and v.max() <= V_MAX + V_TOL and i.max() <= I_CC + 1e-9 and soc[-1] > 0.95
    cc_share = 100 * np.sum(i[st == "CC"]) / np.sum(i)
    print(f"{cc_share:.0f} % of the charge went in during CC")

def test_temperature_fault():
    ch, log = charge(soc0=0.5, temp=lambda t: 25 + t / 60)                            # cell heats 1 K per minute
    print(f"over-temperature: {ch.state} after {log[-1][0] / 60:.1f} min, current then {log[-1][2]:.1f} A")
    assert ch.state == "FAULT" and log[-1][2] == 0.0

test_full_charge()
test_temperature_fault()
print("PASS")
```
:::end

## In practice

Charger ICs implement this state machine in hardware with their own timers and temperature (NTC) inputs; BMS firmware adds JEITA-style temperature-dependent current and voltage limits. Writing the logic as an explicit state machine, as here, keeps every transition reviewable and testable, and the same pattern carries over to the safety logic later in this phase.

## Exercises

:::exercise
A 2.5 Ah cell, 0.7C charge, termination C/20: what are the CC and termination currents?
:::solution
CC $= 0.7 \times 2.5 = 1.75$ A; termination $= 2.5 / 20 = 0.125$ A.
:::end

:::exercise
What happens without anti-windup in the CV loop?
:::solution
While the current is saturated at the CC limit, the integrator keeps accumulating the voltage error, so when the voltage reaches the limit the command stays high until the integrator unwinds: the voltage overshoots its maximum.
:::end

## Quiz

:::quiz
- type: num
  q: Precharge current at C/10 for a 3.5 Ah cell (A)?
  answer: 0.35
  tol: 0.002
  py: "3.5/10"
  explain: Capacity over 10.
- type: num
  q: Termination current at C/20 for a 4 Ah cell (mA)?
  answer: 200
  tol: 0.001
  py: "1000*4/20"
  explain: Capacity over 20.
- type: num
  q: Minutes of CC at 1C to add 80 % SOC (ignoring losses)?
  answer: 48
  tol: 0.001
  py: "0.8*60"
  explain: 1C adds 100 % per hour.
- type: num
  q: Voltage during CC with OCV 4.0 V, 3 A, R0 22 mΩ and v1 30 mV (V)?
  answer: 4.096
  tol: 0.001
  py: "4.0+3*0.022+0.030"
  explain: Charging adds the drops.
- type: mc
  q: When does a CC/CV charger terminate?
  options: ["When the current in CV falls below the termination level", "As soon as the voltage reaches the maximum", "After exactly one hour", "When the cell is warm"]
  answer: 0
  explain: The taper current signals full.
- type: mc
  q: What should over-temperature during charging do?
  options: ["Enter a fault state with zero current", "Increase the current", "Switch to CV", "Nothing"]
  answer: 0
  explain: Fail safe.
:::end
