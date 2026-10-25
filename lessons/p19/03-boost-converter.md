---
id: p19-l03
minutes: 35
summary: The boost converter makes a higher voltage from a lower one, as in a single-cell device that needs 5 V. You derive Vout = Vin/(1 - D) by volt-second balance, simulate a switched boost with a real diode, check the formula in continuous conduction, see winding resistance cap the gain, and see light loads push the output above the formula.
---

## The circuit

The inductor sits at the input. When the switch closes, the inductor charges from $V_{in}$; when it opens, the inductor's current, which cannot change instantly, forces its way through a diode into the output capacitor, adding the inductor's voltage to the input's.

## Volt-second balance

On for $DT$: $v_L = V_{in}$. Off for $(1-D)T$: $v_L = V_{in} - V_{out}$. Zero average:

$$V_{in} D + (V_{in} - V_{out})(1 - D) = 0 \;\Rightarrow\; V_{out} = \frac{V_{in}}{1 - D}.$$

The average input (inductor) current is $I_{out}/(1-D)$, by power balance. That grows quickly as $D \to 1$, and so does the $I^2 R$ loss in the inductor's resistance $r_L$. Including it,

$$\frac{V_{out}}{V_{in}} = \frac{1}{1-D} \cdot \frac{1}{1 + r_L / \big(R (1-D)^2\big)},$$

which rises, peaks and then falls: a real boost cannot give arbitrary gain, and practical designs stay below about $D = 0.8$.

## Light load

At light load the inductor current reaches zero before the period ends and the diode stops it from going negative: **discontinuous conduction**. The output then depends on the load too. With $K = 2 L f_s / R$,

$$V_{out} = V_{in}\, \frac{1 + \sqrt{1 + 4D^2/K}}{2},$$

so an unloaded boost with a fixed duty cycle drives its output up until something breaks. Its controller must reduce $D$ or skip pulses. Note also that a boost has no off state: with the switch off, the input reaches the output through the inductor and diode.

:::figure widget=boostcurve caption="Boost output voltage against duty cycle: the ideal formula, the curve with winding resistance, and simulated points. Change the resistance and the load."
:::end

## Worked example

5 V input, $L = 10$ µH, $C = 100$ µF, a 10 Ω load, 200 kHz (illustrative values):

1. $D = 0.2$, 0.5 and 0.7 give 6.250, 9.999 and 16.666 V in simulation against 6.250, 10.000 and 16.667 V from $V_{in}/(1-D)$, with the inductor current always above zero (CCM).
2. With $r_L = 0.2$ Ω, the gain peaks at 3.53× near $D = 0.85$. At $D = 0.7$ the simulation gives 13.645 V against 13.636 V from the formula.
3. At a 200 Ω load and $D = 0.5$ the converter is discontinuous: the simulation gives 20.47 V, the DCM formula 20.35 V, twice the CCM value of 10.00 V.

## Code it from scratch

:::code file=boost.py
```python
import numpy as np

def boost(vin=5.0, D=0.5, L=10e-6, Cc=100e-6, R=10.0, rL=0.0, fs=200e3, periods=3000, steps=100, v0=None):
    """switched boost: switch on, the inductor charges from Vin; switch off, it discharges through the diode into the output.
    The diode blocks reverse current, so at light load the inductor current can stop at zero (DCM)."""
    dt = 1 / fs / steps; on = round(D * steps)
    vC = v0 if v0 is not None else vin / (1 - D); iL = vC / R / (1 - D); tv, ti = [], []
    for k in range(periods * steps):
        if k % steps < on: diL = (vin - iL * rL) / L; ic = -vC / R
        else:
            diL = (vin - iL * rL - vC) / L; ic = iL - vC / R
            if iL <= 0 and diL < 0: iL, diL, ic = 0.0, 0.0, -vC / R          # diode off: current stays at zero
        iL = max(iL + dt * diL, 0.0); vC += dt * ic / Cc
        if k >= (periods - 5) * steps: tv.append(vC); ti.append(iL)
    return np.mean(tv), np.ptp(ti), min(ti)

def ideal(vin, D): return vin / (1 - D)
def with_rL(vin, D, R, rL): return vin / (1 - D) / (1 + rL / (R * (1 - D) ** 2))

def test_ccm_matches():
    for D in (0.2, 0.5, 0.7):
        v, di, imin = boost(D=D)
        print(f"D = {D}: simulated {v:.3f} V, formula Vin/(1 - D) = {ideal(5, D):.3f} V, inductor valley {imin:.3f} A (CCM)")
        assert imin > 0 and abs(v - ideal(5, D)) / ideal(5, D) < 0.01

def test_losses_limit_gain():
    Ds = np.linspace(0, 0.95, 20); g = with_rL(5, Ds, 10, 0.2)
    print(f"with 0.2 ohm in the inductor the gain peaks at {g.max() / 5:.2f} x near D = {Ds[g.argmax()]:.2f}, not at D -> 1")
    v, _, _ = boost(D=0.7, rL=0.2); print(f"D = 0.7 with 0.2 ohm: simulated {v:.3f} V, formula {with_rL(5, 0.7, 10, 0.2):.3f} V")
    assert abs(v - with_rL(5, 0.7, 10, 0.2)) / v < 0.01 and Ds[g.argmax()] < 0.95

def dcm(vin, D, L, R, fs):
    K = 2 * L * fs / R; return vin * (1 + np.sqrt(1 + 4 * D**2 / K)) / 2     # boost output in discontinuous conduction

def test_dcm_light_load():
    v, di, imin = boost(D=0.5, R=200.0, v0=20.0, periods=6000, steps=400)   # finer steps: the diode turn-off is short
    print(f"light load (200 ohm): inductor valley {imin:.3f} A (DCM), output {v:.2f} V; DCM formula {dcm(5, 0.5, 10e-6, 200, 200e3):.2f} V, "
          f"CCM formula {ideal(5, 0.5):.2f} V")
    assert imin == 0 and abs(v - dcm(5, 0.5, 10e-6, 200, 200e3)) / v < 0.02

test_ccm_matches()
test_losses_limit_gain()
test_dcm_light_load()
print("PASS")
```
:::end

## In practice

Boost converters power LED strings, USB from a single lithium cell and the PFC stage at the input of mains supplies. In ngspice, replace the ideal switch and diode with a MOSFET model and a Schottky diode model to see reverse-recovery and switching losses. Datasheets give the maximum duty cycle, and the switch must withstand the full output voltage.

## Exercises

:::exercise
A boost makes 12 V from 3.6 V at 1 A out. What is the average input current, ignoring losses?
:::solution
$D = 1 - 3.6/12 = 0.7$; $I_{in} = I_{out}/(1-D) = 3.33$ A, which is also the average inductor current. Size the inductor and switch for this plus half the ripple.
:::end

:::exercise
Why does a fixed-duty boost overvoltage at no load, while a buck does not?
:::solution
Each cycle the boost pushes the inductor's stored energy into the output capacitor; with no load there is nowhere for it to go, so the voltage keeps rising. A buck's output cannot exceed its input, and at no load its synchronous version simply circulates current.
:::end

## Quiz

:::quiz
- type: num
  q: Ideal boost output from 3.3 V at D = 0.6?
  answer: 8.25
  tol: 0.002
  unit: V
  py: "3.3/(1-0.6)"
  explain: Vin/(1 − D).
- type: num
  q: Duty cycle to boost 5 V to 20 V?
  answer: 0.75
  tol: 0.002
  py: "1-5/20"
  explain: D = 1 − Vin/Vout.
- type: num
  q: Average inductor current for 2 A out at D = 0.5 (A)?
  answer: 4
  tol: 0.002
  py: "2/(1-0.5)"
  explain: Iout/(1 − D).
- type: num
  q: Boost gain at D = 0.5 with rL/R = 0.05?
  answer: 1.6667
  tol: 0.002
  py: "1/(1-0.5)/(1+0.05/(1-0.5)**2)"
  explain: The resistance term is 0.2.
- type: mc
  q: At very light load a fixed-duty boost's output…
  options:
    - rises above Vin/(1 − D)
    - falls to Vin
    - stays at Vin/(1 − D)
    - goes negative
  answer: 0
  explain: Discontinuous conduction raises the gain.
- type: mc
  q: With the boost switch held off, the output is…
  options:
    - about Vin minus a diode drop
    - zero
    - Vin/(1 − D)
    - negative
  answer: 0
  explain: The inductor and diode connect input to output.
:::end
