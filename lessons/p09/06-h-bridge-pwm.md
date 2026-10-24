---
id: p09-l06
minutes: 40
summary: Four switches let one supply drive a motor in both directions. You derive the average voltage and the current ripple of PWM, see why the motor's inductance makes a square-wave voltage into a smooth current, add dead time to prevent shoot-through, and simulate it all to check the ripple formula and the voltage that dead time steals.
---

## Four switches, two legs

An **H-bridge** has two half-bridges ("legs"), each a high-side and a low-side switch (MOSFETs), with the motor between their midpoints.

- Q1 and Q4 on: current flows left to right, the motor sees $+V_{bus}$.
- Q3 and Q2 on: it sees $-V_{bus}$, and the motor reverses.
- Q2 and Q4 on: both ends at 0 V, the motor is shorted through the low sides. That's **braking** or freewheeling.
- Q1 and Q2 on together: a dead short across the supply, called **shoot-through**. Never allow this.

## PWM: averaging with inductance

Switch Q1/Q2 at frequency $f$ with duty $D$ while Q4 stays on (**unipolar** PWM). The motor terminal voltage is $V_{bus}$ for $DT$ and 0 for $(1-D)T$, an average of

$$\bar V = D\,V_{bus}.$$

The winding's inductance can't follow the square wave. If $L/R \gg T$, the current ramps up and down linearly around its average. During the on-time the inductor sees $V_{bus} - \bar V = (1-D)V_{bus}$ for $DT$, so the peak-to-peak ripple is

$$\Delta I = \frac{(1-D)V_{bus}\cdot DT}{L} = \frac{V_{bus}\,D(1-D)}{L f},$$

which is largest at $D = 0.5$: $\Delta I_{max} = V_{bus}/(4Lf)$. Ripple costs extra copper loss and acoustic noise, which is why drives switch at 16–40 kHz (above hearing). **Bipolar** PWM (diagonal pairs alternating between $\pm V_{bus}$) has twice this ripple.

## Dead time

A MOSFET takes tens to hundreds of nanoseconds to turn off. If Q2's gate rises the moment Q1's falls, both conduct briefly. So the gate driver inserts a **dead time** $t_d$ with both switches off. During it the current keeps flowing (inductors insist) through a body diode:

- current positive: through Q2's diode, terminal at $-V_d$;
- current negative: through Q1's diode, terminal at $V_{bus} + V_d$.

With positive current the dead time before Q1 turns on replaces $V_{bus}$ by $-V_d$, losing about $t_d f (V_{bus} + V_d)$ of average voltage. The error flips sign with the current, which causes distortion near zero current that current loops and dead-time compensation fight.

:::figure widget=hbridge caption="The bridge at the chosen instant (top) and the motor current with the left-leg gate signals (bottom). Raise the frequency and the ripple shrinks as 1/f; move the duty and it peaks at 0.5."
:::end

## Worked example

$V_{bus} = 24$ V, $L = 1$ mH, $f = 20$ kHz.

1. $D = 0.5$: $\bar V = 12$ V and $\Delta I = 24\cdot0.25/(10^{-3}\cdot2\times10^4) = 0.30$ A.
2. $D = 0.75$: $\bar V = 18$ V and $\Delta I = 24\cdot0.1875/20 = 0.225$ A.
3. Dead time 0.5 µs with a 0.7 V diode: lost voltage $0.5\times10^{-6}\cdot2\times10^4\cdot24.7 = 0.247$ V, about 1 % of the bus.
4. Bipolar PWM at $D = 0.5$ (zero average) would ripple by 0.60 A.

## Code it from scratch

:::code file=h_bridge.py
```python
import numpy as np

V, L, R, Vd = 24.0, 1e-3, 1.0, 0.7

def simulate(D, f, td=0.0, E=None, periods=60, n=2000):
    """Left leg PWM (Q1/Q2), right leg low side Q4 always on. Returns the last period's current."""
    T = 1 / f; dt = T / n
    if E is None:
        E = D * V - R * 2.0                       # back-EMF that gives about 2 A average
    i = 2.0; last = []
    for k in range(periods * n):
        ph = (k % n) / n
        q1 = td / T <= ph < D                     # Q1 turns on td after the period starts
        q2 = D + td / T <= ph < 1.0               # Q2 turns on td after Q1 turns off
        if q1: v = V
        elif q2: v = 0.0
        else: v = -Vd if i > 0 else V + Vd       # dead time: a body diode carries the current
        i += dt * (v - R * i - E) / L
        if k >= (periods - 1) * n: last.append(i)
    return np.array(last)

if __name__ == "__main__":
    for D in (0.25, 0.5, 0.75):
        i = simulate(D, 20e3)
        rip = i.max() - i.min(); est = V * D * (1 - D) / (L * 20e3)
        print(f"D = {D}: ripple {rip:.4f} A, formula {est:.4f} A")
        assert abs(rip - est) / est < 0.03
    # ripple halves when the frequency doubles
    r20 = np.ptp(simulate(0.5, 20e3)); r40 = np.ptp(simulate(0.5, 40e3))
    assert abs(r20 / r40 - 2) < 0.05
    # dead time steals about td*f*(V+Vd) of average voltage when the current is positive
    E = 0.5 * V - 2.0
    i0 = simulate(0.5, 20e3, td=0.0, E=E).mean(); i1 = simulate(0.5, 20e3, td=0.5e-6, E=E).mean()
    lost = (i0 - i1) * R
    print(f"voltage lost to 0.5 us dead time: {lost:.3f} V")
    assert abs(lost - 0.5e-6 * 20e3 * (V + Vd)) < 0.02
```
:::end

## Exercises

:::exercise
A gimbal motor has only 0.1 mH of inductance. You want under 0.2 A ripple at 12 V. What PWM frequency do you need?
:::solution
Worst case $\Delta I = V/(4Lf) \le 0.2$, so $f \ge 12/(4\cdot10^{-4}\cdot0.2) = 150$ kHz. That's high for MOSFET switching losses, so add a series inductor or accept the ripple.
:::end

:::exercise
Why does the dead-time error change sign with the current direction, and why does that matter for a position-controlled motor?
:::solution
During dead time the conducting diode depends on the current's direction, so the terminal voltage goes to the opposite rail each time the current reverses. At low speed, near zero current, the voltage error jumps by $2t_dfV_{bus}$, which shows up as a dead zone and torque ripple, exactly where a position loop is holding still.
:::end

## Quiz

:::quiz
- type: num
  q: Average voltage in V at D = 0.75 on a 24 V bus?
  answer: 18
  tol: 0.001
  unit: V
  py: "0.75*24"
  explain: D·V_bus.
- type: num
  q: Ripple in A at D = 0.5, 24 V, 1 mH, 20 kHz?
  answer: 0.3
  tol: 0.001
  unit: A
  py: "24*0.25/(1e-3*20e3)"
  explain: V·D(1 − D)/(L·f).
- type: num
  q: Ripple in A at D = 0.75 (same bridge)?
  answer: 0.225
  tol: 0.001
  unit: A
  py: "24*0.75*0.25/(1e-3*20e3)"
  explain: D(1 − D) = 0.1875.
- type: num
  q: PWM frequency in kHz for ≤ 0.2 A ripple, 12 V, 0.1 mH?
  answer: 150
  tol: 0.001
  unit: kHz
  py: "12/(4*1e-4*0.2)/1000"
  explain: V/(4L·ΔI).
- type: num
  q: Average voltage in V lost to 0.5 µs dead time at 20 kHz (24 V bus, 0.7 V diode)?
  answer: 0.247
  tol: 0.002
  unit: V
  py: "0.5e-6*20e3*24.7"
  explain: t_d·f·(V + V_d).
- type: mc
  q: Shoot-through happens when…
  options:
    - both low-side switches are on
    - the high and low switch of the same leg are on together
    - the motor stalls
    - dead time is too long
  answer: 1
  explain: That shorts the supply.
:::end

:::verify
assert abs(24*0.1875/20 - 0.225) < 1e-12
:::end
