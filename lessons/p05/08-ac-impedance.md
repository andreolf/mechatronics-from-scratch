---
id: p05-l08
minutes: 35
summary: With sinusoidal sources, every capacitor and inductor becomes a complex resistance. You derive impedance from phasors, solve an RC circuit at 1 kHz with complex arithmetic, read magnitude and phase, and confirm the answer with a time-domain simulation.
---

## From derivatives to multiplication

In steady state with a sinusoidal source, every voltage and current in a linear circuit is a sinusoid at the same frequency, differing only in amplitude and phase. Represent each one as a **phasor** (Phase 03 lesson 1): $v(t) = \operatorname{Re}\{\mathbf Ve^{j\omega t}\}$.

Differentiating $e^{j\omega t}$ multiplies it by $j\omega$. So the element laws become algebraic:

| element | time domain | impedance $Z = \mathbf V/\mathbf I$ |
|---|---|---|
| resistor | $v = Ri$ | $R$ |
| capacitor | $i = C\,dv/dt$ | $\dfrac{1}{j\omega C}$ |
| inductor | $v = L\,di/dt$ | $j\omega L$ |

Impedances combine exactly like resistances (series add, parallel by reciprocals), and nodal analysis works unchanged with complex numbers. The magnitude $|Z|$ is in ohms; the angle tells you how far the current lags or leads the voltage. A capacitor's current leads by 90°; an inductor's lags by 90°.

**Power.** Only the resistive part dissipates energy. Average power is $P = \tfrac12|\mathbf V||\mathbf I|\cos\varphi$ with peak amplitudes, where $\cos\varphi$ is the **power factor**.

:::figure widget=phasor caption="Phasors add as vectors. In a series RC, the resistor and capacitor voltages are 90° apart and their sum is the source."
:::end

## Worked example

A 5 V peak, 1 kHz source drives $R = 1$ kΩ in series with $C = 100$ nF.

1. $\omega = 2\pi\times1000 = 6283$ rad/s, so $Z_C = 1/(j\omega C) = -j1591.5$ Ω.
2. $Z = 1000 - j1591.5$, with $|Z| = 1879.6$ Ω and angle −57.9°.
3. $\mathbf I = 5/Z$: 2.660 mA peak, leading the source by 57.9°.
4. $|\mathbf V_R| = 2.660$ V and $|\mathbf V_C| = 2.660\times1.5915 = 4.234$ V. Note $2.660 + 4.234 \ne 5$, but $\sqrt{2.660^2 + 4.234^2} = 5$: they add as vectors.
5. Power: $\tfrac12\times5\times0.00266\times\cos57.9° = 3.54$ mW, which equals $\tfrac12I^2R$.

## Code it from scratch

:::code file=impedance.py
```python
import cmath
import math
import numpy as np

def z_c(C, w):
    return 1 / (1j * w * C)

def z_l(L, w):
    return 1j * w * L

if __name__ == "__main__":
    w = 2 * math.pi * 1000
    R, C, V = 1000.0, 100e-9, 5.0
    Z = R + z_c(C, w)
    I = V / Z
    Vc = I * z_c(C, w)
    assert abs(abs(Z) - 1879.635) < 1e-3 and abs(math.degrees(cmath.phase(I)) - 57.858) < 1e-3
    assert abs(abs(Vc) - 4.23367) < 1e-5 and abs(abs(I * R + Vc) - V) < 1e-12
    P = 0.5 * V * abs(I) * math.cos(cmath.phase(I))
    assert abs(P - 0.5 * abs(I) ** 2 * R) < 1e-12
    # time-domain check: integrate RC dv/dt = Vs - v and measure the steady-state amplitude
    dt, T = 1e-7, 0.01
    t = np.arange(0, T, dt)
    vs = V * np.sin(w * t)
    v = np.zeros_like(t)
    for k in range(len(t) - 1):
        v[k + 1] = v[k] + dt * (vs[k] - v[k]) / (R * C)
    amp = (v[t > 0.008].max() - v[t > 0.008].min()) / 2
    print(f"|Vc| phasor {abs(Vc):.4f} V, simulated {amp:.4f} V")
    assert abs(amp - abs(Vc)) < 5e-3
```
:::end

## Exercises

:::exercise
At what frequency does the 100 nF capacitor's impedance magnitude equal 1 kΩ? What's the phase of the current then?
:::solution
$1/(2\pi fC) = 1000$ gives $f = 1592$ Hz. Then $Z = 1000 - j1000$, so the current leads by 45°.
:::end

:::exercise
Find the impedance of a 10 mH inductor in parallel with a 1 µF capacitor at 1 kHz.
:::solution
$Z_L = j62.83$ Ω and $Z_C = -j159.15$ Ω. In parallel: $\frac{Z_LZ_C}{Z_L + Z_C} = \frac{10\,000}{-j96.32} = j103.8$ Ω. It's inductive below its 1592 Hz resonance.
:::end

## Quiz

:::quiz
- type: num
  q: What is |Z_C| in ohms for 100 nF at 1 kHz?
  answer: 1591.55
  tol: 0.001
  unit: Ω
  py: "1/(2*math.pi*1000*100e-9)"
  explain: $1/(\omega C)$.
- type: num
  q: What is |Z| in ohms for 1 kΩ in series with that capacitor?
  answer: 1879.64
  tol: 0.001
  unit: Ω
  py: "math.hypot(1000, 1/(2*math.pi*1000*100e-9))"
  explain: Real and imaginary parts at right angles.
- type: num
  q: What is the capacitor's peak voltage in volts?
  answer: 4.23367
  tol: 0.002
  unit: V
  py: "5*1591.549/math.hypot(1000,1591.549)"
  explain: $|I||Z_C|$.
- type: mc
  q: In a capacitor, the current…
  options:
    - lags the voltage by 90°
    - leads the voltage by 90°
    - is in phase with the voltage
    - is zero in AC
  answer: 1
  explain: $Z_C = -j/(\omega C)$, so $I = V\cdot j\omega C$ is rotated by +90°.
- type: num
  q: What is the average power in mW?
  answer: 3.5378
  tol: 0.003
  unit: mW
  py: "0.5*(5/1879.635)**2*1000*1000"
  explain: $\tfrac12|I|^2R$.
- type: mc
  q: Impedances in series…
  options:
    - add as complex numbers
    - add their magnitudes
    - combine like conductances
    - can't be combined
  answer: 0
  explain: Like resistors, but complex.
:::end

:::verify
zl, zc = 1j*62.83185, -1j*159.15494
zp = zl*zc/(zl+zc); assert abs(zp.imag-103.8)<0.1 and abs(zp.real)<1e-9
assert abs(1/(2*3.141592653589793*1000*100e-9)-1591.5)<0.1
:::end
