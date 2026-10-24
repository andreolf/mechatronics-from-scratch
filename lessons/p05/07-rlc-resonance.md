---
id: p05-l07
minutes: 35
summary: Put an inductor and a capacitor together and energy sloshes between them. You derive the series RLC equation, map it onto ωn and ζ, predict ringing and overshoot, and compute the resonant peak and Q of a filter, checked against simulation.
---

## The series RLC equation

A source $V$ drives $R$, $L$ and $C$ in series. The same current $i = C\,\dot v_C$ flows through all three, and KVL gives

$$LC\,\ddot v_C + RC\,\dot v_C + v_C = V.$$

Divide by $LC$ and compare with the standard second-order form of Phase 02 lesson 9, $\ddot x + 2\zeta\omega_n\dot x + \omega_n^2x = \omega_n^2u$:

$$\omega_n = \frac{1}{\sqrt{LC}}, \qquad \zeta = \frac R2\sqrt{\frac CL}, \qquad Q = \frac{1}{2\zeta} = \frac1R\sqrt{\frac LC}.$$

Energy moves back and forth between the capacitor's electric field and the inductor's magnetic field at $\omega_n$, and the resistor drains it. With $\zeta < 1$ the step response rings. Its overshoot is $e^{-\pi\zeta/\sqrt{1-\zeta^2}}$ and its peak comes at $t_p = \pi/(\omega_n\sqrt{1 - \zeta^2})$.

**Resonance.** Driven by a sine at $\omega_n$, the impedances of L and C cancel ($j\omega L + 1/(j\omega C) = 0$). The current is limited only by R, and the capacitor voltage is Q times the source. That's how radios select a station, and how an unintended LC (a long motor cable with a filter capacitor) can ring and damage a driver.

:::figure widget=response caption="A second-order step response. Lower ζ (less resistance) means more overshoot and longer ringing."
:::end

## Worked example

$L = 10$ mH, $C = 1$ µF, $R = 20$ Ω.

1. $\omega_n = 1/\sqrt{10^{-2}\times10^{-6}} = 10\,000$ rad/s, so $f_n = 1592$ Hz.
2. $\zeta = 10\sqrt{10^{-6}/10^{-2}} = 0.1$, so $Q = 5$.
3. A step of 1 V overshoots by $e^{-\pi\times0.1/\sqrt{0.99}} = 72.9$ %: the capacitor reaches 1.73 V.
4. The peak comes at $\pi/(10^4\sqrt{0.99}) = 0.316$ ms.
5. Driven at 1592 Hz with 1 V, the capacitor voltage is $Q\times1 = 5$ V. Damping it to ζ = 0.7 needs $R = 2\times0.7\sqrt{L/C} = 140$ Ω.

## Code it from scratch

:::code file=rlc.py
```python
import math
import numpy as np
from scipy import signal

L, C, R = 10e-3, 1e-6, 20.0

def params(R, L, C):
    wn = 1 / math.sqrt(L * C)
    zeta = R / 2 * math.sqrt(C / L)
    return wn, zeta, 1 / (2 * zeta)

if __name__ == "__main__":
    wn, zeta, Q = params(R, L, C)
    assert abs(wn - 1e4) < 1e-9 and abs(zeta - 0.1) < 1e-12 and abs(Q - 5) < 1e-12
    sys = signal.TransferFunction([1], [L * C, R * C, 1])
    t = np.linspace(0, 3e-3, 30001)
    _, y = signal.step(sys, T=t)
    os_sim, tp_sim = y.max() - 1, t[np.argmax(y)]
    os_th = math.exp(-math.pi * zeta / math.sqrt(1 - zeta**2))
    print(f"overshoot {100*os_sim:.2f} % (theory {100*os_th:.2f} %), peak at {tp_sim*1e3:.4f} ms")
    assert abs(os_sim - os_th) < 1e-4 and abs(tp_sim - math.pi / (wn * math.sqrt(1 - zeta**2))) < 1e-6
    # at resonance the capacitor voltage is Q times the source
    w = wn
    H = 1 / (L * C * (1j * w) ** 2 + R * C * (1j * w) + 1)
    assert abs(abs(H) - Q) < 1e-9
    # R for zeta = 0.7
    assert abs(2 * 0.7 * math.sqrt(L / C) - 140) < 1e-9
```
:::end

## Exercises

:::exercise
An LC filter on a motor driver uses 22 µH and 10 µF, with only 0.05 Ω of resistance. Find $f_n$ and Q. Is that a problem?
:::solution
$f_n = 1/(2\pi\sqrt{22\times10^{-6}\times10^{-5}}) = 10.7$ kHz. $Q = \frac{1}{0.05}\sqrt{22\times10^{-6}/10^{-5}} = 29.7$. Any disturbance near 10.7 kHz (a PWM frequency, for example) gets amplified about 30×. You'd add damping, such as an RC snubber or a capacitor with higher ESR.
:::end

:::exercise
Show that $Q = \frac1R\sqrt{L/C}$ follows from $\zeta = \frac R2\sqrt{C/L}$.
:::solution
$Q = \frac{1}{2\zeta} = \frac{1}{R\sqrt{C/L}} = \frac1R\sqrt{\frac LC}$.
:::end

## Quiz

:::quiz
- type: num
  q: What is fn in Hz for L = 10 mH and C = 1 µF?
  answer: 1591.55
  tol: 0.001
  unit: Hz
  py: "1/(2*math.pi*math.sqrt(10e-3*1e-6))"
  explain: $1/(2\pi\sqrt{LC})$.
- type: num
  q: What is ζ with R = 20 Ω?
  answer: 0.1
  tol: 0.001
  py: "20/2*math.sqrt(1e-6/10e-3)"
  explain: $\frac R2\sqrt{C/L}$.
- type: num
  q: What is the step overshoot in per cent?
  answer: 72.925
  tol: 0.002
  unit: "%"
  py: "100*math.exp(-math.pi*0.1/math.sqrt(1-0.01))"
  explain: $e^{-\pi\zeta/\sqrt{1-\zeta^2}}$.
- type: num
  q: Which R in ohms gives ζ = 0.7?
  answer: 140
  tol: 0.001
  unit: Ω
  py: "2*0.7*math.sqrt(10e-3/1e-6)"
  explain: $R = 2\zeta\sqrt{L/C}$.
- type: mc
  q: At the resonant frequency of a series RLC…
  options:
    - the impedance is infinite
    - the L and C impedances cancel, leaving only R
    - no current flows
    - the capacitor voltage is zero
  answer: 1
  explain: $j\omega L$ and $1/(j\omega C)$ are equal and opposite.
- type: num
  q: What is Q of the motor filter (22 µH, 10 µF, 0.05 Ω)?
  answer: 29.665
  tol: 0.003
  py: "1/0.05*math.sqrt(22e-6/10e-6)"
  explain: $\frac1R\sqrt{L/C}$.
:::end

:::verify
import math
assert abs(1/(2*math.pi*math.sqrt(22e-6*1e-5))-10730)<10 and abs(math.pi/(1e4*math.sqrt(0.99))-3.157e-4)<1e-7
:::end
