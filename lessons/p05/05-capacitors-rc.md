---
id: p05-l05
minutes: 35
summary: A capacitor stores charge, so its voltage can't jump. You derive i = C dv/dt, solve the RC charging equation, time a power-on reset and a button debounce, and discover that charging a capacitor through a resistor always wastes exactly half the energy.
---

## The capacitor law

A capacitor holds charge $q = Cv$ on two plates; capacitance is in farads (F), and real parts range from pF to thousands of µF. Differentiate:

$$i = C\frac{dv}{dt}.$$

Two consequences matter constantly:

- **The voltage across a capacitor can't change instantly**, because that would need infinite current. At the instant a switch closes, a discharged capacitor looks like a short circuit.
- **In DC steady state, no current flows** ($dv/dt = 0$), so a capacitor looks like an open circuit.

The stored energy is $E = \int vi\,dt = \int Cv\,dv = \tfrac12Cv^2$.

## RC charging

Close a switch connecting a source $V$ through $R$ to an uncharged $C$. KVL gives $V = iR + v = RC\,\dot v + v$. That's the first-order ODE of Phase 02 lesson 8, with time constant $\tau = RC$:

$$v(t) = V\left(1 - e^{-t/\tau}\right), \qquad i(t) = \frac VRe^{-t/\tau}.$$

At $t = \tau$ the capacitor has reached 63.2 %, at $3\tau$ 95.0 % and at $5\tau$ 99.3 %. To reach a threshold fraction $k$, solve: $t = -\tau\ln(1 - k)$.

**Half the energy is lost, always.** The source delivers $\int Vi\,dt = V\cdot CV = CV^2$, but the capacitor ends with $\tfrac12CV^2$. The other half heats the resistor, whatever $R$ is.

:::figure widget=rc caption="An RC circuit driven by a square wave. Change R or C and the time constant (and how fully the capacitor charges in each half-cycle) follows."
:::end

## Worked example

A microcontroller's reset pin has a 10 kΩ pull-up to 3.3 V and a 10 µF capacitor to ground. The chip leaves reset when the pin crosses 0.7 × 3.3 V.

1. $\tau = 10\times10^3\times10\times10^{-6} = 0.1$ s.
2. Time to 70 %: $-0.1\ln(0.3) = 0.1204$ s, so reset releases 120 ms after power-up, giving the supply time to settle.
3. Energy stored at 3.3 V: $\tfrac12\times10^{-5}\times3.3^2 = 54.5$ µJ. The same amount heats the resistor during charging.
4. Initial current: $3.3/10^4 = 0.33$ mA, decaying with τ.

## Code it from scratch

:::code file=rc.py
```python
import math
import numpy as np

def rc_charge(V, R, C, t):
    return V * (1 - np.exp(-t / (R * C)))

def simulate(V, R, C, T, dt):
    """Integrate RC dv/dt = V - v with small explicit steps; also integrate resistor heating."""
    v, heat = 0.0, 0.0
    for _ in range(int(T / dt)):
        i = (V - v) / R
        heat += i * i * R * dt
        v += i / C * dt
    return v, heat

if __name__ == "__main__":
    R, C, V = 10e3, 10e-6, 3.3
    tau = R * C
    t70 = -tau * math.log(0.3)
    assert abs(t70 - 0.12040) < 1e-5 and abs(rc_charge(V, R, C, t70) - 0.7 * V) < 1e-12
    assert abs(rc_charge(1, 1, 1, 1.0) - 0.632) < 1e-3 and abs(rc_charge(1, 1, 1, 5.0) - 0.993) < 1e-3
    v, heat = simulate(V, R, C, 2.0, 1e-5)
    E_cap = 0.5 * C * v * v
    print(f"after 20 tau: v = {v:.5f} V, stored {E_cap*1e6:.2f} uJ, resistor heat {heat*1e6:.2f} uJ")
    assert abs(v - V) < 1e-6 and abs(E_cap - 54.45e-6) < 1e-8
    assert abs(heat / E_cap - 1) < 1e-3                 # half the delivered energy is lost
    # the loss doesn't depend on R
    _, heat2 = simulate(V, 100.0, C, 0.02, 1e-7)
    assert abs(heat2 / E_cap - 1) < 1e-3
```
:::end

## Exercises

:::exercise
A button bounces for up to 5 ms. You debounce it with an RC filter into a Schmitt-trigger input that switches at 60 % of the supply. Pick C if R = 10 kΩ, so that the input needs at least 5 ms to cross the threshold.
:::solution
$t = -RC\ln(0.4) = 0.916RC \ge 5$ ms gives $RC \ge 5.46$ ms, so $C \ge 0.546$ µF. Use 1 µF (τ = 10 ms, crossing at 9.2 ms).
:::end

:::exercise
A 1000 µF capacitor is charged to 12 V. How much energy does it hold, and why can shorting it with a screwdriver weld the tip?
:::solution
$\tfrac12\times10^{-3}\times144 = 72$ mJ. That's small, but it's released in microseconds through milliohms, so the current reaches hundreds of amps and the power is huge for an instant.
:::end

## Quiz

:::quiz
- type: num
  q: What is τ for 10 kΩ and 10 µF, in seconds?
  answer: 0.1
  tol: 0.001
  unit: s
  py: "10e3*10e-6"
  explain: $\tau = RC$.
- type: num
  q: How long, in ms, until it reaches 70 % of the supply?
  answer: 120.397
  tol: 0.002
  unit: ms
  py: "-100*math.log(0.3)"
  explain: $t = -\tau\ln(1 - 0.7)$.
- type: mc
  q: At the instant a switch connects a discharged capacitor to a source through R, the capacitor behaves like…
  options:
    - an open circuit
    - a short circuit
    - a resistor of value R
    - a battery
  answer: 1
  explain: Its voltage can't jump, so it starts at 0 V.
- type: num
  q: What fraction of the final voltage is reached at t = 3τ?
  answer: 0.950213
  tol: 0.001
  py: "1-math.exp(-3)"
  explain: $1 - e^{-3}$.
- type: mc
  q: Charging a capacitor from a fixed voltage through a resistor wastes…
  options:
    - nothing if R is small
    - exactly half the delivered energy, whatever R is
    - more energy for larger R
    - all the energy
  answer: 1
  explain: The source delivers $CV^2$ and the capacitor keeps $\tfrac12CV^2$.
- type: num
  q: Energy in µJ stored in 10 µF at 3.3 V?
  answer: 54.45
  tol: 0.002
  unit: µJ
  py: "0.5*10*3.3**2"
  explain: $\tfrac12CV^2$.
:::end

:::verify
import math
assert abs(-math.log(0.4)-0.916)<5e-4 and abs(5/0.916-5.46)<0.005 and abs(10*0.916-9.2)<0.05 and abs(0.5e-3*144-0.072)<1e-12
:::end
