---
id: p09-l04
minutes: 35
summary: The steady-state DC motor equations give a straight torque-speed line. You derive stall torque and no-load speed, show output power peaks at half the no-load speed, find where efficiency peaks once no-load current is included, and learn why you run a motor near peak efficiency rather than peak power.
---

## The torque-speed line

From lesson 2, in steady state with friction neglected, $V = R i + k\omega$ and $T = k i$, so

$$T = \frac{k}{R}(V - k\omega) = T_s\left(1 - \frac{\omega}{\omega_0}\right), \qquad T_s = \frac{kV}{R},\quad \omega_0 = \frac{V}{k}.$$

- **Stall torque** $T_s$ at zero speed, drawing the stall current $V/R$.
- **No-load speed** $\omega_0$ at zero torque.

A load with torque $T_L$ settles where the line crosses its torque. If $T_L > T_s$ the motor stalls, and stalled motors burn.

## Peak power at half speed

Output power is $P = T\omega = T_s\,\omega(1 - \omega/\omega_0)$, a downward parabola. Setting $dP/d\omega = 0$:

$$\omega^* = \frac{\omega_0}{2},\qquad P_{max} = \frac{T_s\,\omega_0}{4} = \frac{V^2}{4R}.$$

At that point half the input power is lost in $R$: efficiency is at most 50 %. It's the maximum power transfer theorem in mechanical clothing.

## Peak efficiency is near no-load

A real motor draws a no-load current $I_0$ to overcome its own friction, so the useful torque is $k(i - I_0)$:

$$\eta = \frac{k(i - I_0)\,\omega}{V i}.$$

Maximising over $i$ gives $i^* = \sqrt{I_0\, I_s}$ (where $I_s = V/R$) and

$$\eta_{max} = \left(1 - \sqrt{I_0/I_s}\right)^2.$$

Peak efficiency sits at high speed and low torque, usually 10–20 % of stall torque. So: size the motor so its **continuous** operating point is near peak efficiency, and its **peak** demands stay well below stall, inside the thermal limits (lesson 19).

:::figure widget=torquespeed caption="Torque, power and efficiency of a 12 V motor, each normalised. Raise the load: the operating point slides down the line, power peaks at half speed (dashed), efficiency peaks much earlier."
:::end

## Worked example

$V = 12$ V, $R = 1.2$ Ω, $k = 0.02$ N·m/A, $I_0 = 0.15$ A.

1. $T_s = 0.02\cdot12/1.2 = 0.2$ N·m; $I_s = 10$ A; $\omega_0 = 600$ rad/s.
2. $P_{max} = 0.2\cdot600/4 = 30$ W at 300 rad/s (ignoring $I_0$).
3. $i^* = \sqrt{0.15\cdot10} = 1.225$ A; $\eta_{max} = (1 - \sqrt{0.015})^2 = 77.0$ %.
4. At that point $T = 0.02(1.225 - 0.15) = 21.5$ mN·m and $\omega = (12 - 1.2\cdot1.225)/0.02 = 526.5$ rad/s.

## Code it from scratch

:::code file=torque_speed.py
```python
import numpy as np

V, R, k, I0 = 12.0, 1.2, 0.02, 0.15
Ts, w0, Is = k * V / R, V / k, V / R

def operating_point(TL):
    """Speed and current where the motor's output torque k(i - I0) meets the load."""
    i = TL / k + I0
    return (V - R * i) / k, i

w = np.linspace(0, w0, 200001)
P_ideal = Ts * (1 - w / w0) * w
i = (V - k * w) / R
eta = np.where(i > I0, k * (i - I0) * w / (V * i), 0)

if __name__ == "__main__":
    w_star = w[np.argmax(P_ideal)]
    print(f"peak power {P_ideal.max():.2f} W at {w_star:.1f} rad/s (w0/2 = {w0/2})")
    assert abs(w_star - w0 / 2) < 0.01 and abs(P_ideal.max() - V * V / (4 * R)) < 1e-6
    eta_max_formula = (1 - np.sqrt(I0 / Is)) ** 2
    print(f"peak efficiency {eta.max():.4f} (formula {eta_max_formula:.4f}) at i = {i[np.argmax(eta)]:.3f} A")
    assert abs(eta.max() - eta_max_formula) < 1e-6
    assert abs(i[np.argmax(eta)] - np.sqrt(I0 * Is)) < 1e-3
    # a load just below stall still runs, at the stall torque it stops
    w_op, _ = operating_point(0.9 * (Ts - k * I0))
    assert w_op > 0 and operating_point(Ts)[0] < 0
```
:::end

## Exercises

:::exercise
You double the supply voltage on this motor. What happens to stall torque, no-load speed and peak power?
:::solution
$T_s = kV/R$ doubles, $\omega_0 = V/k$ doubles, and $P_{max} = V^2/(4R)$ quadruples. The line moves outward parallel to itself. The thermal limit on current doesn't change, though, so the continuous torque doesn't grow.
:::end

:::exercise
A pump needs 0.05 N·m at 450 rad/s from this motor. Is that a good operating point?
:::solution
At 0.05 N·m, $i = 0.05/0.02 + 0.15 = 2.65$ A and $\omega = (12 - 3.18)/0.02 = 441$ rad/s, slightly below the target. The efficiency is $0.05\cdot441/(12\cdot2.65) = 69$ %, close to the 77 % peak, and 25 % of stall torque, so it's thermally comfortable. It's acceptable, though 13 V or a slightly stronger motor would reach 450 rad/s.
:::end

## Quiz

:::quiz
- type: num
  q: Stall torque in N·m (12 V, 1.2 Ω, k = 0.02)?
  answer: 0.2
  tol: 0.001
  unit: N·m
  py: "0.02*12/1.2"
  explain: kV/R.
- type: num
  q: Peak output power in W?
  answer: 30
  tol: 0.001
  unit: W
  py: "12**2/(4*1.2)"
  explain: V²/(4R).
- type: num
  q: Speed in rad/s at peak power?
  answer: 300
  tol: 0.001
  unit: rad/s
  py: "12/0.02/2"
  explain: ω₀/2.
- type: num
  q: Peak efficiency with I₀ = 0.15 A and I_s = 10 A, in %?
  answer: 77.0
  tol: 0.002
  unit: "%"
  py: "100*(1-math.sqrt(0.015))**2"
  explain: (1 − √(I₀/I_s))².
- type: num
  q: Current in A at peak efficiency?
  answer: 1.2247
  tol: 0.002
  unit: A
  py: "math.sqrt(0.15*10)"
  explain: √(I₀·I_s).
- type: mc
  q: The maximum efficiency at the peak-power point is…
  options:
    - 100 %
    - 77 %
    - 50 %
    - 25 %
  answer: 2
  explain: Half the input is lost in R there.
:::end

:::verify
import math
i = math.sqrt(0.15*10)
assert abs(0.02*(i-0.15) - 0.0215) < 1e-4 and abs((12-1.2*i)/0.02 - 526.5) < 0.1
assert abs(0.05*441/(12*2.65) - 0.69) < 0.01
:::end
