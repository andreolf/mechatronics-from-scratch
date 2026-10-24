---
id: p05-l06
minutes: 35
summary: An inductor stores energy in a magnetic field, so its current can't jump. You derive v = L di/dt, solve the RL transient of a relay coil, calculate the voltage spike when a switch opens, and see how a flyback diode tames it.
---

## The inductor law

A coil of wire builds a magnetic field when current flows. Changing the current changes the field, which induces a voltage opposing the change (Faraday and Lenz):

$$v = L\frac{di}{dt},$$

with inductance $L$ in henries (H). It's the dual of the capacitor:

- **The current through an inductor can't change instantly**; that would need infinite voltage.
- **In DC steady state it's a short circuit** (just the wire's resistance).
- Stored energy: $E = \tfrac12Li^2$.

Motors, solenoids, relays and every switching power supply are inductors. In mechatronics, that's where most destroyed transistors come from.

## RL transients

Connect $V$ across $R$ in series with $L$. KVL gives $V = Ri + L\,di/dt$, which is first order with $\tau = L/R$:

$$i(t) = \frac VR\left(1 - e^{-t/\tau}\right).$$

**Switching off is the dangerous part.** The current wants to keep flowing. If a transistor opens in time $\Delta t$, the coil generates roughly $L\,I/\Delta t$, which can be kilovolts, and it breaks the transistor down or arcs across relay contacts.

**The flyback diode.** A diode across the coil (reverse-biased in normal operation) gives the current a path when the switch opens. The coil's voltage is then clamped to about one diode drop $V_d$, and the current decays through $R$:

$$L\frac{di}{dt} = -(Ri + V_d) \quad\Rightarrow\quad t_{off} = \tau\ln\left(1 + \frac{I_0R}{V_d}\right).$$

The cost is a slower release. Relays with a plain diode drop out more slowly, which is why fast drivers use a Zener diode in series to clamp at a higher voltage.

:::figure widget=rc args={"kind":"rl"} caption="An RL circuit driven by a square wave. The current, not the voltage, rises with τ = L/R."
:::end

## Worked example

A 12 V solenoid has $R = 10$ Ω and $L = 50$ mH.

1. $\tau = 0.05/10 = 5$ ms. The final current is $12/10 = 1.2$ A.
2. Time to reach 1.0 A, the pull-in current: $-\tau\ln(1 - 1.0/1.2) = \tau\ln6 = 8.96$ ms.
3. Stored energy at 1.2 A: $\tfrac12\times0.05\times1.44 = 36$ mJ.
4. A MOSFET that switches off in 1 µs with no protection: the coil tries to produce $0.05\times1.2/10^{-6} = 60$ kV. In practice the MOSFET avalanches and absorbs the 36 mJ, often failing.
5. With a flyback diode ($V_d = 0.7$ V), the current decays to zero in $5\ln(1 + 12/0.7) = 14.5$ ms, and the switch sees only $12 + 0.7$ V.

## Code it from scratch

:::code file=rl.py
```python
import math

def turn_on(V, R, L, t):
    return V / R * (1 - math.exp(-t * R / L))

def flyback(I0, R, L, Vd, dt=1e-7):
    """Integrate L di/dt = -(R i + Vd) until the current reaches zero."""
    i, t, energy_diode = I0, 0.0, 0.0
    while i > 0:
        di = -(R * i + Vd) / L * dt
        energy_diode += Vd * i * dt
        i += di; t += dt
    return t, energy_diode

if __name__ == "__main__":
    V, R, L = 12.0, 10.0, 0.05
    tau = L / R
    t1 = tau * math.log(6)
    assert abs(turn_on(V, R, L, t1) - 1.0) < 1e-12 and abs(t1 - 8.9588e-3) < 1e-6
    assert abs(0.5 * L * 1.2**2 - 0.036) < 1e-12
    t_off, e_d = flyback(1.2, R, L, 0.7)
    print(f"flyback decay {t_off*1e3:.2f} ms (formula {tau*math.log(1+12/0.7)*1e3:.2f} ms)")
    assert abs(t_off - tau * math.log(1 + 1.2 * R / 0.7)) < 1e-5
    # energy balance: coil energy = diode heat + resistor heat
    i, t, e_r = 1.2, 0.0, 0.0
    while i > 0:
        e_r += R * i * i * 1e-7
        i -= (R * i + 0.7) / L * 1e-7
    assert abs(e_r + e_d - 0.036) < 1e-4
    assert abs(L * 1.2 / 1e-6 - 60_000) < 1e-6
```
:::end

## Exercises

:::exercise
Replace the plain flyback diode with a diode plus a 24 V Zener (total clamp about 24.7 V). How long does the release take now, and what voltage must the MOSFET withstand?
:::solution
$t = 5\ln(1 + 12/24.7) = 1.98$ ms, about 7× faster. The MOSFET sees $12 + 24.7 = 36.7$ V, so pick a part rated for 60 V or more.
:::end

:::exercise
Why does an inductor look like a short in DC steady state while a capacitor looks like an open circuit?
:::solution
In steady state nothing changes. $v = L\,di/dt = 0$ means no voltage across the inductor whatever the current (a short), and $i = C\,dv/dt = 0$ means no current through the capacitor whatever the voltage (an open).
:::end

## Quiz

:::quiz
- type: num
  q: What is τ for 50 mH and 10 Ω, in ms?
  answer: 5
  tol: 0.001
  unit: ms
  py: "50/10"
  explain: $\tau = L/R$.
- type: num
  q: How long (ms) until the current reaches 1.0 A of its 1.2 A final value?
  answer: 8.9588
  tol: 0.002
  unit: ms
  py: "5*math.log(6)"
  explain: $\tau\ln\frac{1}{1 - 1/1.2}$.
- type: num
  q: What energy in mJ is stored at 1.2 A?
  answer: 36
  tol: 0.001
  unit: mJ
  py: "0.5*50*1.2**2"
  explain: $\tfrac12Li^2$ with L in mH gives mJ.
- type: mc
  q: The current through an inductor…
  options:
    - can jump instantly
    - can't change instantly
    - is always zero in DC
    - leads the voltage by 180°
  answer: 1
  explain: It would need infinite voltage.
- type: num
  q: With a 0.7 V flyback diode, how long (ms) does the 1.2 A current take to decay?
  answer: 14.491
  tol: 0.003
  unit: ms
  py: "5*math.log(1+12/0.7)"
  explain: $\tau\ln(1 + I_0R/V_d)$.
- type: mc
  q: A flyback diode across a relay coil…
  options:
    - speeds up the release
    - clamps the turn-off spike but slows the release
    - increases the pull-in current
    - is only needed with AC
  answer: 1
  explain: The current recirculates slowly through the low clamp voltage.
:::end

:::verify
import math
assert abs(5*math.log(1+12/24.7)-1.98)<0.005 and abs(14.49/1.98-7.3)<0.1
:::end
