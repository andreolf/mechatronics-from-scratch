---
id: p19-l02
minutes: 40
summary: The buck converter steps voltage down with a switch, an inductor and a capacitor. You derive Vout = D Vin from volt-second balance and the current and voltage ripple formulas, simulate both the switched circuit and its averaged model, check the ripple matches, and size an inductor.
---

## The circuit

A high-side switch connects the **switch node** to $V_{in}$ for a fraction $D$ (the **duty cycle**) of each period $T = 1/f_s$; for the rest, a low-side switch (or a diode) connects it to ground. An inductor $L$ from the switch node to the output and a capacitor $C$ across the load filter the square wave into a nearly constant $V_{out}$.

## Volt-second balance

In steady state the inductor current returns to the same value every period, so the average inductor voltage is zero: $v_L = L\, di/dt$ integrates to zero over a period.

$$(V_{in} - V_{out})\, D T + (0 - V_{out})(1 - D) T = 0 \;\Rightarrow\; V_{out} = D\, V_{in}.$$

## Ripple

During the on-time the current rises with slope $(V_{in} - V_{out})/L$, so the peak-to-peak inductor ripple is

$$\Delta I_L = \frac{(V_{in} - V_{out})\, D}{L f_s}.$$

The capacitor absorbs this triangular ripple; integrating its positive half gives the output ripple of an ideal capacitor

$$\Delta V_{out} = \frac{\Delta I_L}{8 C f_s}.$$

A real capacitor adds $\Delta I_L \cdot ESR$, which often dominates. Designers usually choose $L$ for a ripple of 20 to 40 % of the load current. The average inductor current equals the load current; if the ripple exceeds twice the load current, the current would go negative and a diode-based buck enters **discontinuous conduction** (DCM), where these formulas no longer hold.

## Averaged model

Replacing the switch node by its average $D V_{in}$ gives a linear L-C-R circuit with the same slow dynamics and no ripple. Lesson 05 uses it to design the feedback loop.

:::figure widget=buckripple caption="Inductor current and output voltage of a buck over a few switching periods. Change duty cycle, inductance and frequency; the readout compares the simulated ripple with the formulas."
:::end

## Worked example

12 V input, $D = 0.275$, $L = 22$ µH, $C = 47$ µF, a 1.65 Ω load and 500 kHz:

1. $V_{out} = 0.275 \times 12 = 3.300$ V. The switched simulation averages 3.300 V and the averaged model settles at 3.300 V.
2. $\Delta I_L = (12 - 3.3) \times 0.275 / (22\,\mu\text{H} \times 500\,\text{kHz}) = 0.2175$ A; the simulation gives 0.2175 A around a mean of 2.000 A, the load current.
3. $\Delta V_{out} = 0.2175 / (8 \times 47\,\mu\text{F} \times 500\,\text{kHz}) = 1.157$ mV; the simulation gives 1.161 mV.
4. For 30 % ripple at 2 A, $L = 7.97$ µH, with a peak current of 2.30 A that the inductor must carry without saturating.

## Code it from scratch

:::code file=buck.py
```python
import numpy as np

def buck_switched(vin=12.0, D=0.275, L=22e-6, Cc=47e-6, R=1.65, fs=500e3, periods=600, steps=200):
    """ideal synchronous buck: the switch node is Vin for D T and 0 for (1 - D) T; integrate the L-C-R filter"""
    T = 1 / fs; dt = T / steps; tr_i, tr_v = [], []
    vC = D * vin; iL = vC / R                                           # start at the averaged operating point: no slow LC ringing
    for k in range(periods * steps):
        vsw = vin if (k % steps) < round(D * steps) else 0.0
        diL = (vsw - vC) / L; dvC = (iL - vC / R) / Cc
        iL += dt * diL; vC += dt * dvC                                    # step small against T, so forward Euler is fine
        if k >= (periods - 4) * steps: tr_i.append(iL); tr_v.append(vC)
    return np.array(tr_i), np.array(tr_v)

def buck_averaged(vin=12.0, D=0.275, L=22e-6, Cc=47e-6, R=1.65, t_end=1.2e-3, dt=50e-9):
    """averaged model: replace the switch node by its average D Vin; no ripple, same slow dynamics"""
    iL, vC = 0.0, 0.0; out = []
    for _ in range(int(t_end / dt)):
        iL += dt * (D * vin - vC) / L; vC += dt * (iL - vC / R) / Cc; out.append(vC)
    return np.array(out)

def ripple_formulas(vin, D, L, Cc, fs):
    vout = D * vin; di = (vin - vout) * D / (L * fs)                     # inductor current ripple, peak to peak
    return vout, di, di / (8 * Cc * fs)                                  # capacitor voltage ripple, ideal capacitor

def test_volt_second_balance():
    vin, D, L, Cc, fs = 12.0, 0.275, 22e-6, 47e-6, 500e3
    i, v = buck_switched(vin, D, L, Cc, fs=fs); vout, di, dv = ripple_formulas(vin, D, L, Cc, fs)
    sim_di, sim_dv = i.max() - i.min(), v.max() - v.min()
    print(f"Vout: formula D Vin = {vout:.3f} V, switched simulation mean {v.mean():.3f} V, averaged model {buck_averaged()[-1]:.3f} V")
    print(f"inductor ripple: formula {di:.4f} A, simulation {sim_di:.4f} A; mean current {i.mean():.3f} A (load {vout / 1.65:.3f} A)")
    print(f"output ripple: formula {1000 * dv:.3f} mV, simulation {1000 * sim_dv:.3f} mV")
    assert abs(v.mean() - vout) < 0.02 and abs(sim_di - di) / di < 0.02 and abs(sim_dv - dv) / dv < 0.05

def test_design_inductor():
    vin, vout, iout, fs = 12.0, 3.3, 2.0, 500e3; D = vout / vin
    L = (vin - vout) * D / (0.3 * iout * fs)                              # pick L for 30 % ripple
    print(f"inductor for 30 % ripple at 2 A: {1e6 * L:.2f} uH; peak current {iout * 1.15:.2f} A (choose saturation above this)")
    assert abs(ripple_formulas(vin, D, L, 47e-6, fs)[1] - 0.6) < 1e-9

test_volt_second_balance()
test_design_inductor()
print("PASS")
```
:::end

The same circuit in ngspice, for reference (not run by this site's checks; needs ngspice):

:::code file=buck.cir lang=text
```text
* buck.cir: reference only, not run by this site's checks; needs ngspice (ngspice -b buck.cir)
Vin  in  0   12
Vgh  gh  0   PULSE(0 5 0 1n 1n 549n 2u)      ; high-side gate, D = 0.275 at 500 kHz
Vgl  gl  0   PULSE(5 0 0 1n 1n 549n 2u)      ; complementary low-side gate
S1   in  sw  gh 0 SWM
S2   sw  0   gl 0 SWM
.model SWM SW(Ron=25m Roff=1Meg Vt=2.5)
L1   sw  out 22u
C1   out 0   47u
Rl   out 0   1.65
.tran 10n 1.2m 1m
.control
run
meas tran vavg AVG v(out) from=1.1m to=1.2m
meas tran ipp PP i(L1) from=1.19m to=1.2m
.endc
.end
```
:::end

## In practice

**ngspice** (free, also built into KiCad) simulates this netlist with real MOSFET models and parasitics; LTspice is a popular free alternative. In hardware, measure inductor current with a current probe and output ripple with a short ground spring on the probe, since a long ground lead picks up switching noise and exaggerates the ripple.

## Exercises

:::exercise
At what load current does the example buck (with a diode instead of a low-side MOSFET) enter discontinuous conduction?
:::solution
When the current valley reaches zero: $I_{load} = \Delta I_L / 2 = 0.109$ A. Below that the diode stops conducting before the period ends.
:::end

:::exercise
The output ripple measures 25 mV, far above 1.2 mV. What is the likely cause?
:::solution
The capacitor's ESR (for example 0.1 Ω × 0.22 A = 22 mV) or probe pickup from a long ground lead. Use low-ESR ceramic capacitors and measure with a ground spring.
:::end

## Quiz

:::quiz
- type: num
  q: Duty cycle for 5 V from 24 V in an ideal buck?
  answer: 0.2083
  tol: 0.002
  py: "5/24"
  explain: D = Vout/Vin.
- type: num
  q: Inductor ripple for Vin 24 V, Vout 5 V, L 33 µH, 300 kHz (A)?
  answer: 0.3998
  tol: 0.002
  py: "(24-5)*(5/24)/(33e-6*300e3)"
  explain: (Vin − Vout) D / (L fs).
- type: num
  q: Output ripple from 0.4 A ripple with 22 µF at 300 kHz (mV)?
  answer: 7.576
  tol: 0.002
  py: "0.4/(8*22e-6*300e3)*1000"
  explain: ΔI / (8 C fs).
- type: num
  q: Average inductor current of a buck delivering 3 A?
  answer: 3
  tol: 0.001
  unit: A
  py: "3"
  explain: The capacitor carries no DC current.
- type: mc
  q: Volt-second balance states that in steady state…
  options:
    - the average inductor voltage over a period is zero
    - the average capacitor voltage is zero
    - the inductor current is constant
    - the duty cycle is one half
  answer: 0
  explain: Otherwise the current would keep growing.
- type: mc
  q: Doubling the inductance of a buck…
  options:
    - halves the current ripple
    - doubles the output voltage
    - doubles the current ripple
    - changes the duty cycle needed
  answer: 0
  explain: ΔI is inversely proportional to L.
:::end
