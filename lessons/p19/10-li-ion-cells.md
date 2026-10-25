---
id: p19-l10
minutes: 35
summary: A lithium-ion cell is a voltage source that depends on its state of charge, behind an internal resistance. You model open-circuit voltage against state of charge for NMC and LFP chemistries, see why a flat curve makes voltage a poor fuel gauge, and simulate discharges at different C-rates to see how much charge and energy reach the load.
---

## Capacity, SOC and C-rate

A cell's **capacity** $Q$ (in Ah) is the charge it delivers from full to empty. The **state of charge** is the fraction left, $\mathrm{SOC} = 1 - \tfrac{1}{Q}\int i\,dt$. The **C-rate** expresses current relative to capacity: 1C empties the cell in about an hour, so 1C for a 3 Ah cell is 3 A, 0.2C is 0.6 A and 5C is 15 A.

## Open-circuit voltage

At rest, a cell's voltage settles to its **open-circuit voltage** (OCV), a fixed function of SOC set by the electrode chemistry. Nickel-manganese-cobalt (NMC) cells slope from about 4.2 V full to 3.0 V empty. Lithium iron phosphate (LFP) cells sit near 3.3 V across most of their range, which is great for a stable supply and hard for a fuel gauge: a small voltage error is a large SOC error. The curves in the code are illustrative shapes, not a datasheet.

## Under load

The simplest load model puts a resistance $R_0$ in series: $V = \mathrm{OCV}(\mathrm{SOC}) - i R_0$. Higher current lowers the terminal voltage, so the cell reaches its cut-off voltage earlier with charge still inside, and every amp also dissipates $i^2 R_0$. Real cells lose even more at high rates because lithium diffusion cannot keep up; Lesson 11 adds the RC dynamics, and physics-based models capture diffusion directly.

:::figure widget=ocvcurve caption="OCV against SOC for illustrative NMC and LFP curves, and the terminal voltage during a discharge. Change the chemistry, C-rate and internal resistance."
:::end

## Worked example

Illustrative 3.0 Ah NMC cell with $R_0 = 30$ mΩ and a 3.0 V cut-off:

1. Between 20 and 80 % SOC the OCV slopes 7.19 mV per % for NMC and 1.18 mV per % for LFP, so a 10 mV voltage error means 1.4 % SOC on NMC and 8.5 % on LFP.
2. Discharges to cut-off: 0.2C delivers 2.993 Ah and 11.16 Wh in 299.3 min; 1C 2.963 Ah and 10.86 Wh in 59.3 min; 2C 2.922 Ah and 10.47 Wh; 5C 2.704 Ah and 9.05 Wh in 10.8 min.
3. Energy falls faster than charge because the terminal voltage is lower at high current.

## Code it from scratch

:::code file=cell.py
```python
import numpy as np
from scipy.interpolate import PchipInterpolator

SOC = np.array([0, .05, .1, .2, .3, .4, .5, .6, .7, .8, .9, 1.0])
NMC = PchipInterpolator(SOC, [3.00, 3.30, 3.45, 3.55, 3.62, 3.68, 3.74, 3.82, 3.90, 3.98, 4.07, 4.20])   # illustrative curves,
LFP = PchipInterpolator(SOC, [2.50, 3.10, 3.20, 3.25, 3.27, 3.28, 3.29, 3.30, 3.31, 3.32, 3.34, 3.60])   # not from a datasheet

def discharge(c_rate, q_ah=3.0, r0=0.030, v_cut=3.0, ocv=NMC, dt=1.0):
    """constant-current discharge from full until the terminal voltage V = OCV(SOC) - I R0 reaches the cut-off."""
    i = c_rate * q_ah; soc = 1.0; t = e = 0.0
    while True:
        v = float(ocv(soc)) - i * r0
        if v <= v_cut or soc <= 0: break
        e += v * i * dt; soc -= i * dt / (q_ah * 3600); t += dt
    return (1 - soc) * q_ah, e / 3600, t / 60

def test_ocv_shapes():
    s = np.linspace(0.2, 0.8, 61)
    slope_nmc = np.mean(NMC(s, 1)); slope_lfp = np.mean(LFP(s, 1))
    print(f"mean OCV slope between 20 and 80 % SOC: NMC {1000 * slope_nmc / 100:.2f} mV/%, LFP {1000 * slope_lfp / 100:.2f} mV/%")
    for name, f in (("NMC", NMC), ("LFP", LFP)): assert np.all(np.diff(f(np.linspace(0, 1, 501))) > 0), name
    print(f"a 10 mV voltage error is {10 / (1000 * slope_nmc / 100):.1f} % SOC on NMC, {10 / (1000 * slope_lfp / 100):.1f} % on LFP")
    assert slope_nmc > 5 * slope_lfp

def test_c_rates():
    rows = [(c, *discharge(c)) for c in (0.2, 1, 2, 5)]
    for c, q, e, t in rows: print(f"{c:3.1f}C: {q:.3f} Ah, {e:.2f} Wh, {t:6.1f} min")
    qs = [r[1] for r in rows]; es = [r[2] for r in rows]
    assert all(np.diff(qs) < 0) and all(np.diff(es) < 0)               # higher rate: less charge and energy before cut-off
    assert abs(rows[1][3] - 60 * rows[1][1] / 3.0) < 0.5                  # 1C drains the delivered charge in its share of an hour

test_ocv_shapes()
test_c_rates()
print("PASS")
```
:::end

## In practice

Battery engineers start from the cell datasheet's discharge curves and their own pulse tests. PyBaMM (Python Battery Mathematical Modelling) solves physics-based models such as the single particle model and the Doyle-Fuller-Newman model, which capture diffusion and predict rate capability from electrode parameters. This lesson's OCV-plus-resistance model is what a battery management system actually runs.

## Exercises

:::exercise
What current is 2C for a 5 Ah cell, and roughly how long does it last?
:::solution
$2 \times 5 = 10$ A, lasting about half an hour (a little less in practice, because the cut-off is reached early at high current).
:::end

:::exercise
Why is estimating SOC from voltage harder for LFP than for NMC?
:::solution
The LFP OCV curve is nearly flat over most of the SOC range, so a millivolt-level measurement or model error maps to several percent of SOC. Coulomb counting and model-based estimators (Lesson 12) are needed.
:::end

## Quiz

:::quiz
- type: num
  q: Current for 0.5C on a 4 Ah cell (A)?
  answer: 2
  tol: 0.001
  py: "0.5*4"
  explain: C-rate times capacity.
- type: num
  q: Terminal voltage at OCV 3.7 V, 6 A and 25 mΩ (V)?
  answer: 3.55
  tol: 0.002
  py: "3.7-6*0.025"
  explain: V = OCV − i R0.
- type: num
  q: Heat in R0 = 30 mΩ at 15 A (W)?
  answer: 6.75
  tol: 0.002
  py: "15**2*0.030"
  explain: i² R0.
- type: num
  q: SOC after drawing 1.5 Ah from a full 3 Ah cell (%)?
  answer: 50
  tol: 0.001
  py: "100*(1-1.5/3)"
  explain: Coulomb counting.
- type: mc
  q: Why does a cell deliver less energy at high C-rate?
  options: ["Internal resistance lowers the voltage and the cut-off is reached earlier", "The capacity label is wrong", "Lithium is used up faster", "Cells only work at 1C"]
  answer: 0
  explain: Voltage drop and early cut-off.
- type: mc
  q: Which chemistry has the flattest OCV curve?
  options: ["LFP", "NMC", "Lead-acid", "All are equally steep"]
  answer: 0
  explain: LFP sits near 3.3 V for most of its range.
:::end
