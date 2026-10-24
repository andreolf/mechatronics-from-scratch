---
id: p05-l17
minutes: 35
summary: Op-amps make second-order filters without inductors. You derive the unity-gain Sallen-Key low-pass by nodal analysis, design a 1 kHz Butterworth anti-alias filter with standard parts, and check its natural frequency and Q against a numerical solve.
---

## Why active filters

Passive RC stages load each other (lesson 9) and need inductors for a sharp, peaked response. An op-amp provides isolation and lets a resistor-capacitor network act like a complex-pole pair.

## The unity-gain Sallen-Key low-pass

From the input: $R_1$ to node A, $R_2$ from A to node B, $C_2$ from B to ground, and $C_1$ from A to the output. The op-amp is a follower, so $v_{out} = v_B$. KCL at A and B gives

$$H(s) = \frac{1}{s^2R_1R_2C_1C_2 + sC_2(R_1 + R_2) + 1}.$$

Matching it with $\omega_n^2/(s^2 + 2\zeta\omega_ns + \omega_n^2)$:

$$\omega_n = \frac{1}{\sqrt{R_1R_2C_1C_2}}, \qquad Q = \frac{\sqrt{R_1R_2C_1C_2}}{C_2(R_1 + R_2)}.$$

With $R_1 = R_2 = R$, $Q = \tfrac12\sqrt{C_1/C_2}$. A **Butterworth** response (maximally flat, $Q = 0.707$) needs $C_1 = 2C_2$. Higher Q gives a peak (Chebyshev-like) and lower Q a gentle roll-off (Bessel-like, best step response). Beyond the corner it falls at −40 dB/decade, twice as fast as one RC stage.

:::figure widget=bode args={"kind":"second","fn":1000,"zeta":0.707} caption="A second-order low-pass at 1 kHz. ζ = 0.707 (Q = 0.707) is Butterworth; lower ζ peaks."
:::end

## Worked example

A 1 kHz Butterworth anti-alias filter in front of an ADC sampling at 10 kHz.

1. Use standard capacitors: $C_2 = 10$ nF and $C_1 = 22$ nF (close to 2×). Then $Q = \tfrac12\sqrt{2.2} = 0.742$, slightly above 0.707; that's a tiny 0.1 dB bump.
2. Equal resistors: $R = 1/(2\pi\times1000\sqrt{22\times10^{-9}\times10\times10^{-9}}) = 10.73$ kΩ, so use 10.7 kΩ (E96), giving $f_n = 1003$ Hz.
3. At the 5 kHz Nyquist frequency: about $-20\log_{10}(5^2) = -28$ dB. A single RC with the same corner gives only −14 dB.
4. For more attenuation, cascade two stages with Q = 0.541 and 1.307 to make a fourth-order Butterworth.

## Code it from scratch

:::code file=sallen_key.py
```python
import math
import numpy as np

def h_nodal(f, R1, R2, C1, C2):
    """Solve KCL at nodes A and B numerically (ideal follower: vout = vB)."""
    s = 2j * math.pi * f
    # node A: (vA - 1)/R1 + (vA - vB)/R2 + s*C1*(vA - vout) = 0, with vout = vB
    # node B: (vB - vA)/R2 + s*C2*vB = 0
    G = np.array([[1 / R1 + 1 / R2 + s * C1, -1 / R2 - s * C1],
                  [-1 / R2, 1 / R2 + s * C2]], dtype=complex)
    vA, vB = np.linalg.solve(G, [1 / R1, 0])
    return vB

def h_formula(f, R1, R2, C1, C2):
    s = 2j * math.pi * f
    return 1 / (s * s * R1 * R2 * C1 * C2 + s * C2 * (R1 + R2) + 1)

if __name__ == "__main__":
    R, C1, C2 = 10.7e3, 22e-9, 10e-9
    fn = 1 / (2 * math.pi * R * math.sqrt(C1 * C2))
    Q = math.sqrt(R * R * C1 * C2) / (C2 * 2 * R)
    print(f"fn = {fn:.1f} Hz, Q = {Q:.4f}")
    assert abs(fn - 1002.82) < 0.01 and abs(Q - 0.74162) < 1e-5
    for f in (10, 500, 1000, 5000, 20000):
        assert abs(h_nodal(f, R, R, C1, C2) - h_formula(f, R, R, C1, C2)) < 1e-12
    att = 20 * math.log10(abs(h_formula(5000, R, R, C1, C2)))
    assert -29 < att < -27
    peak = max(abs(h_formula(f, R, R, C1, C2)) for f in np.linspace(10, 3000, 3000))
    assert 0 < 20 * math.log10(peak) < 0.15          # Q slightly above 0.707: a tiny bump
    # an exact Butterworth with C1 = 2 C2 is flat
    assert abs(math.sqrt(2) / 2 - 0.5 * math.sqrt(2.0)) < 1e-15
```
:::end

## Exercises

:::exercise
With equal resistors, what capacitor ratio gives Q = 0.5 (critically damped, no overshoot)?
:::solution
$Q = \tfrac12\sqrt{C_1/C_2} = 0.5$ gives $C_1 = C_2$.
:::end

:::exercise
Design a 100 Hz Butterworth with $C_2 = 100$ nF and equal resistors.
:::solution
$C_1 = 200$ nF (use 220 nF, Q = 0.742). $R = 1/(2\pi\times100\sqrt{220\times10^{-9}\times10^{-7}}) = 10.73$ kΩ: the same resistors as before, with capacitors 10× larger.
:::end

## Quiz

:::quiz
- type: num
  q: Natural frequency in Hz with R = 10.7 kΩ, C1 = 22 nF, C2 = 10 nF?
  answer: 1002.82
  tol: 0.001
  unit: Hz
  py: "1/(2*math.pi*10.7e3*math.sqrt(22e-9*10e-9))"
  explain: $1/(2\pi\sqrt{R_1R_2C_1C_2})$.
- type: num
  q: Q of the equal-resistor design with C1/C2 = 2.2?
  answer: 0.74162
  tol: 0.001
  py: "0.5*math.sqrt(2.2)"
  explain: $\tfrac12\sqrt{C_1/C_2}$.
- type: mc
  q: A Butterworth response is characterised by…
  options:
    - the sharpest cut-off with ripple
    - a maximally flat passband (Q = 0.707 for second order)
    - linear phase
    - unity gain at all frequencies
  answer: 1
  explain: No peaking, but some step overshoot (4 %).
- type: mc
  q: Far above f_n, a second-order low-pass falls at…
  options:
    - −20 dB/decade
    - −40 dB/decade
    - −60 dB/decade
    - 0 dB/decade
  answer: 1
  explain: Two poles.
- type: num
  q: Capacitor ratio C1/C2 for Butterworth with equal resistors?
  answer: 2
  tol: 0.001
  py: "(2*0.7071067811865476)**2"
  explain: $Q = \tfrac12\sqrt{C_1/C_2} = 1/\sqrt2$.
- type: num
  q: Approximate attenuation in dB of a second-order low-pass 5× above its corner (asymptote)?
  answer: -27.959
  tol: 0.002
  unit: dB
  py: "-40*math.log10(5)"
  explain: −40 dB/decade × log10(5).
:::end

:::verify
import math
assert abs(1/(2*math.pi*100*math.sqrt(220e-9*1e-7))-10730)<5
:::end
