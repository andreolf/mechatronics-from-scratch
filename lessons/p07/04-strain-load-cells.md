---
id: p07-l04
minutes: 40
summary: A strain gauge changes resistance by a few parts per thousand when stretched. You derive the gauge factor and full-bridge output, size the instrumentation amplifier and ADC for a 5 kg load cell, and model the whole chain from mass to counts and back, recovering the weight to better than 0.5 percent.
---

## Strain gauges

A foil strain gauge is a zig-zag metal track bonded to a part. Stretching it makes the track longer and thinner, so its resistance rises:

$$\frac{\Delta R}{R} = GF\cdot\varepsilon,$$

with a **gauge factor** $GF \approx 2$ for metal foil and strain $\varepsilon = \Delta L/L$. At 1000 µε (0.1 % stretch, near a typical design limit), $\Delta R/R = 0.2$ %: 0.7 Ω on a 350 Ω gauge.

## The bridge

You can't read 0.2 % directly against a 3.3 V background, so use a Wheatstone bridge (Phase 05). A **load cell** puts four gauges on a bending beam, two stretched and two compressed, as a full bridge:

$$V_{out} = V_{ex}\cdot GF\cdot\varepsilon.$$

That's 6.6 mV at full load with 3.3 V excitation, so datasheets quote the sensitivity as **2 mV/V**. The full bridge also cancels temperature effects, since all four gauges drift together.

## The signal chain

1. **Excitation**: power the bridge from the ADC's own reference, so the measurement is **ratiometric** and supply drift cancels.
2. **Instrumentation amplifier** (Phase 05): high common-mode rejection, since both bridge outputs sit at about $V_{ex}/2$. Its gain maps the full-scale signal onto most of the ADC range, around a mid-rail reference.
3. **ADC**: 16–24 bits; dedicated load-cell ADCs such as the HX711 include the amplifier.
4. **Calibration** (lesson 2): tare (offset) plus one or more reference weights (gain).

:::figure widget=loadcell caption="Mass to bridge voltage to amplifier output to ADC code. Raise the gain until the full scale nearly fills the ADC, but not so far that it clips."
:::end

## Worked example

A 5 kg, 2 mV/V load cell with 3.3 V excitation, an INA with a 1.65 V reference and a 16-bit ADC on 3.3 V.

1. Full-scale bridge output: $2\text{ mV/V}\times3.3\text{ V} = 6.6$ mV.
2. Headroom above mid-rail is 1.65 V, so the gain must stay below $1.65/0.0066 = 250$. Choose $G = 200$: full scale becomes 1.32 V above the reference.
3. Counts per kilogram: $200\times6.6\text{ mV}/5\text{ kg}/3.3\text{ V}\times65\,536 = 5243$, so one count is 0.19 g.
4. Noise, not the ADC step, usually sets the real resolution. An INA with 1 µV rms input noise gives $1/1320 = 0.08$ % of full scale, about 4 g, before averaging.

## Code it from scratch

:::code file=load_cell_chain.py
```python
import numpy as np

rng = np.random.default_rng(11)
CAP, SENS, VEX, VREF, BITS = 5.0, 2e-3, 3.3, 3.3, 16

def chain(mass, G=200, gauge_offset=0.15e-3, noise_uV=1.0, n_avg=1):
    """Mass in kg to ADC code: bridge, INA around a mid-rail reference, ratiometric ADC."""
    vb = VEX * SENS * mass / CAP + gauge_offset                          # bridge imbalance at zero load
    vb = vb + noise_uV * 1e-6 * rng.standard_normal(n_avg)
    vo = np.clip(VREF / 2 + G * vb, 0, VREF)
    return float(np.mean(np.floor(vo / VREF * 2**BITS).clip(0, 2**BITS - 1)))

if __name__ == "__main__":
    GF, eps = 2.0, 1000e-6
    assert abs(GF * eps - 0.002) < 1e-15 and abs(VEX * GF * eps - 6.6e-3) < 1e-12
    assert 1.65 / 6.6e-3 == 250
    counts_per_kg = 200 * VEX * SENS / CAP / VREF * 2**BITS
    assert abs(counts_per_kg - 5242.88) < 0.01
    # calibrate: tare, then a 5 kg reference (each averaged over 64 samples)
    tare = chain(0, n_avg=64)
    g = (chain(5.0, n_avg=64) - tare) / 5.0
    worst = 0
    for m in np.linspace(0.25, 5.0, 20):
        est = (chain(m, n_avg=64) - tare) / g
        worst = max(worst, abs(est - m) / m)
    print(f"{counts_per_kg:.0f} counts/kg, worst relative error {100*worst:.3f} %")
    assert worst < 0.005
    # too much gain clips: 400 x 6.6 mV + 1.65 V exceeds the rail
    assert chain(5.0, G=400) == 2**BITS - 1
```
:::end

## Exercises

:::exercise
Why does exciting the bridge from the ADC reference make supply drift cancel?
:::solution
The bridge output is proportional to $V_{ex}$, and the ADC code is proportional to $V_{in}/V_{ref}$. With $V_{ex} = V_{ref}$, the ratio, and so the code, is independent of the actual voltage.
:::end

:::exercise
A quarter bridge (one active gauge) gives about $V_{ex}GF\varepsilon/4$. How much smaller is its signal than a full bridge, and what else does it lose?
:::solution
Four times smaller. It also loses temperature compensation, because the single gauge's thermal drift isn't cancelled by matching gauges in the other arms.
:::end

## Quiz

:::quiz
- type: num
  q: ΔR/R in % for GF = 2 and 1000 µε?
  answer: 0.2
  tol: 0.001
  unit: '%'
  py: "2*1000e-6*100"
  explain: GF × strain.
- type: num
  q: Full-scale output in mV of a 2 mV/V load cell at 3.3 V excitation?
  answer: 6.6
  tol: 0.001
  unit: mV
  py: "2*3.3"
  explain: Sensitivity × excitation.
- type: num
  q: Maximum INA gain with 1.65 V headroom and 6.6 mV full scale?
  answer: 250
  tol: 0.001
  py: "1.65/6.6e-3"
  explain: Headroom over signal.
- type: num
  q: Grams per count with G = 200 and a 16-bit ADC (5 kg, 2 mV/V, ratiometric)?
  answer: 0.19073
  tol: 0.002
  unit: g
  py: "5000/(200*3.3*2e-3/5/3.3*65536*5)"
  explain: 5243 counts per kg.
- type: mc
  q: A full bridge with two stretched and two compressed gauges…
  options:
    - quadruples the signal and cancels temperature drift
    - needs no excitation
    - removes the need for an amplifier
    - halves the signal
  answer: 0
  explain: Compared with a single gauge.
- type: mc
  q: Ratiometric measurement means…
  options:
    - the ADC reference also excites the sensor
    - two ADCs are used
    - the gain is unity
    - the signal is AC
  answer: 0
  explain: The ratio cancels supply variation.
:::end

:::verify
assert abs(200*6.6e-3 - 1.32) < 1e-12
:::end
