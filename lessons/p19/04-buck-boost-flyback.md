---
id: p19-l04
minutes: 35
summary: The flyback stores energy in a coupled inductor and releases it on a separate winding, so it can step up or down, invert and isolate in one stage. You derive Vout = Vin n D/(1 - D), simulate a flyback, check the formula, follow the energy in and out of the core, and recover the buck-boost as the case n = 1.
---

## Buck-boost

Swap the boost's inductor and switch positions: the switch connects the inductor to the input during $DT$, and during $(1-D)T$ the inductor discharges through a diode into an output whose polarity is reversed. Volt-second balance gives

$$V_{in} D = |V_{out}| (1 - D) \;\Rightarrow\; |V_{out}| = V_{in} \frac{D}{1 - D},$$

lower than the input for $D < 0.5$ and higher above.

## The flyback

Now split the inductor into two windings on one core, $N_p$ primary turns and $N_s$ secondary turns, $n = N_s/N_p$. It is not a transformer in the usual sense: no current flows in both windings at once.

- **On**: the primary sees $V_{in}$, the magnetising current rises with slope $V_{in}/L_m$, and the energy $\tfrac12 L_m i^2$ is stored in the core's air gap. The secondary diode is reverse biased.
- **Off**: the primary current stops, the field collapses, and the same flux now drives current out of the secondary through the diode. The secondary sees $V_{out}$, which reflects to the primary as $V_{out}/n$.

Volt-second balance on the primary: $V_{in} D = (V_{out}/n)(1-D)$, so

$$V_{out} = V_{in}\, n \frac{D}{1 - D}.$$

The windings give **galvanic isolation** (lesson 22) and the turns ratio picks the voltage range. This is why almost every phone charger and the standby supply of many machines is a flyback. Real cores also have **leakage inductance**, whose energy does not transfer and must be clamped by a snubber, or it destroys the switch.

:::figure widget=flybackcore caption="Energy stored in the flyback's core over a few periods: it rises while the primary conducts and falls while the secondary delivers it. Change duty cycle, turns ratio and load."
:::end

## Worked example

24 V input, $n = 0.25$, $L_m = 200$ µH, $C = 220$ µF, a 5 Ω load and 100 kHz (illustrative):

1. $D = 0.3$, 0.4 and 0.5 give 2.570, 3.998 and 5.998 V in simulation, against 2.571, 4.000 and 6.000 V from the formula.
2. Over 10 periods at $D = 0.4$, 317.80 µJ go into the core and 317.80 µJ come out of the secondary; the load used 319.73 µJ, the same within the simulation's 1 % step error.
3. With $n = 1$, $D = 0.6$ and a 50 Ω load, the output is 35.898 V against $24 \times 0.6/0.4 = 36$ V: the buck-boost.

## Code it from scratch

:::code file=flyback.py
```python
import numpy as np

def flyback(vin=24.0, n=0.25, D=0.4, Lm=200e-6, Cc=220e-6, R=5.0, fs=100e3, periods=4000, steps=200, v0=None):
    """flyback: on, the primary magnetising current ramps up and stores energy in the core (output diode blocks);
    off, the stored energy flows out of the secondary (turns ratio n = Ns/Np) into the output capacitor.
    State: magnetising current referred to the primary, output voltage."""
    dt = 1 / fs / steps; on = round(D * steps)
    vC = v0 if v0 is not None else vin * n * D / (1 - D); im = 0.5; tv, e_in, e_out = [], 0.0, 0.0
    for k in range(periods * steps):
        if k % steps < on:
            dim = vin / Lm; ic = -vC / R; p_in, p_core_out = vin * im, 0.0
        else:
            dim = -(vC / n) / Lm; i_sec = im / n; ic = i_sec - vC / R; p_in, p_core_out = 0.0, vC * i_sec
            if im <= 0: dim, ic, p_core_out = 0.0, -vC / R, 0.0          # DCM: core empty, diode off
        im_old = im; im = max(im + dt * dim, 0.0); vC += dt * ic / Cc
        if k >= (periods - 10) * steps and im_old > 0:                      # trapezoidal energy: average current over the step
            f = 0.5 * (im_old + im) / im_old; e_in += p_in * f * dt; e_out += p_core_out * f * dt
        if k >= (periods - 10) * steps: tv.append(vC)
    return np.mean(tv), e_in, e_out

def ccm_formula(vin, n, D): return vin * n * D / (1 - D)

def test_ratio_formula():
    for D in (0.3, 0.4, 0.5):
        v, ei, eo = flyback(D=D)
        print(f"D = {D}: simulated {v:.3f} V, formula Vin n D/(1 - D) = {ccm_formula(24, 0.25, D):.3f} V")
        assert abs(v - ccm_formula(24, 0.25, D)) / v < 0.01

def test_energy_through_core():
    v, ei, eo = flyback()
    print(f"over 10 periods: energy into the core {1e6 * ei:.2f} uJ, out to the secondary {1e6 * eo:.2f} uJ, "
          f"load used {1e6 * v**2 / 5 * 10 / 100e3:.2f} uJ")
    assert abs(ei - eo) / ei < 0.01                                          # lossless core: what goes in comes out

def test_buck_boost_is_flyback_with_n1():
    v, _, _ = flyback(n=1.0, D=0.6, R=50.0)
    print(f"n = 1 (an inverting buck-boost, magnitude): {v:.3f} V, formula Vin D/(1 - D) = {24 * 0.6 / 0.4:.3f} V")
    assert abs(v - 36.0) / 36 < 0.01

test_ratio_formula()
test_energy_through_core()
test_buck_boost_is_flyback_with_n1()
print("PASS")
```
:::end

## In practice

Flyback design starts from the reflected voltage $V_{out}/n$, which adds to $V_{in}$ across the switch when it is off, so the MOSFET rating and the turns ratio are chosen together. ngspice models the coupled windings with two inductors and a `K` coupling statement, which also shows the leakage spike. Vendor tools (Power Integrations PI Expert, TI WEBENCH) design the transformer.

## Exercises

:::exercise
A 12 V to 5 V flyback with $n = 0.5$: what duty cycle does it need, and what voltage does the switch see when off?
:::solution
$5 = 12 \times 0.5\, D/(1-D)$ gives $D = 0.455$. The switch sees $V_{in} + V_{out}/n = 12 + 10 = 22$ V, plus any leakage spike.
:::end

:::exercise
Why does a flyback core need an air gap?
:::solution
The energy is stored in the magnetic field. A gapped core stores most of it in the gap, where it does not saturate the core material, so it can hold the needed $\tfrac12 L_m i^2$ without saturating.
:::end

## Quiz

:::quiz
- type: num
  q: Flyback output from 48 V with n = 0.2 at D = 0.4?
  answer: 6.4
  tol: 0.002
  unit: V
  py: "48*0.2*0.4/0.6"
  explain: Vin n D/(1 − D).
- type: num
  q: Buck-boost output magnitude from 12 V at D = 0.25?
  answer: 4
  tol: 0.002
  unit: V
  py: "12*0.25/0.75"
  explain: Vin D/(1 − D).
- type: num
  q: Energy in 100 µH carrying 2 A (µJ)?
  answer: 200
  tol: 0.002
  py: "0.5*100e-6*2**2*1e6"
  explain: ½ L i².
- type: num
  q: Voltage across a flyback switch when off, Vin 24 V, Vout 5 V, n = 0.25 (no leakage spike)?
  answer: 44
  tol: 0.002
  unit: V
  py: "24+5/0.25"
  explain: Vin plus the reflected voltage.
- type: mc
  q: In a flyback, primary and secondary currents flow…
  options:
    - at different times in the period
    - at the same time, like a transformer
    - only in the secondary
    - only at start-up
  answer: 0
  explain: Energy is stored, then released.
- type: mc
  q: The energy in a flyback's leakage inductance…
  options:
    - does not reach the output and must be clamped
    - is fully delivered to the output
    - increases the output voltage
    - is negligible in every design
  answer: 0
  explain: A snubber or clamp absorbs it.
:::end
