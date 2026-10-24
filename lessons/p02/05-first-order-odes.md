---
id: p02-l05
minutes: 30
summary: First-order systems are everywhere in mechatronics, from RC filters to motor winding temperature. You solve τẋ + x = u exactly, read the time constant off a step response, and check a numerical simulation against the exact solution.
---

## One storage element, one time constant

A system with a single energy store (a capacitor's charge, a thermal mass's heat, a motor's current with negligible speed change) obeys

$$\tau\dot x + x = u ,$$

where $u$ is the input and $\tau$ is the **time constant**. It says the state moves toward the input at a rate proportional to the gap: $\dot x = (u - x)/\tau$.

Two examples you'll meet again:

- **RC circuit**: a resistor $R$ charging a capacitor $C$ from a source $V$: $RC\,\dot v_C + v_C = V$, so $\tau = RC$.
- **Winding temperature**: heat capacity $C_\text{th}$ [J/K] heated by losses $P$ [W] and cooled through a thermal resistance $R_\text{th}$ [K/W] to ambient: $R_\text{th}C_\text{th}\,\dot{\Delta T} + \Delta T = R_\text{th}P$.

## The exact step response

For a constant input $u$ switched on at $t = 0$ with $x(0) = 0$, separate variables:

$$\frac{dx}{u - x} = \frac{dt}{\tau} \;\Rightarrow\; -\ln(u - x) = \frac{t}{\tau} + C \;\Rightarrow\; x(t) = u\big(1 - e^{-t/\tau}\big).$$

At $t = \tau$ the output has covered $1 - e^{-1} = 63.2\,\%$ of the way. It reaches 95 % at $t = -\tau\ln 0.05 = 3.0\,\tau$ and 98 % at $3.9\tau$, so engineers say a first-order system "settles in four time constants". The initial slope is $u/\tau$: if it kept that rate, it would arrive at exactly $t = \tau$.

:::figure widget=response args={"order":1} caption="Step response of τẋ + x = u. The amber marker is the 63.2 % point at t = τ."
:::end

## Worked example: how hot does the motor get?

A small motor's winding has $R_\text{th} = 2$ K/W and $C_\text{th} = 50$ J/K. It dissipates $P = 10$ W.

1. $\tau = R_\text{th}C_\text{th} = 100$ s.
2. Final temperature rise: $R_\text{th}P = 20$ K above ambient.
3. After 100 s: $20(1 - e^{-1}) = 12.64$ K. After 300 s: $20(1 - e^{-3}) = 19.0$ K.

If the insulation is rated for 60 K above ambient, you can overload the motor by $\sqrt{3}$ in current (3× the losses, 60 K final) indefinitely, or far more for a short burst. That is why servo drives model winding temperature with exactly this equation.

## Code it from scratch

:::code file=first_order.py
```python
import math
import numpy as np

def simulate(f, x0, t_end, h):
    """Forward Euler, enough for a smooth first-order system with h ≪ τ."""
    n = round(t_end / h)
    t, x = np.linspace(0, n * h, n + 1), np.empty(n + 1)
    x[0] = x0
    for k in range(n):
        x[k + 1] = x[k] + h * f(t[k], x[k])
    return t, x

if __name__ == "__main__":
    tau, u = 1.0, 5.0                                    # RC = 10 kΩ × 100 µF, 5 V step
    t, v = simulate(lambda t, x: (u - x) / tau, 0.0, 5.0, 1e-4)
    exact = u * (1 - np.exp(-t / tau))
    assert abs(v - exact).max() < 1e-4
    k63 = np.argmax(v >= u * (1 - math.exp(-1)))
    assert abs(t[k63] - tau) < 1e-3                      # 63.2 % at t = τ
    Rth, Cth, P = 2.0, 50.0, 10.0
    t, dT = simulate(lambda t, x: (Rth * P - x) / (Rth * Cth), 0.0, 300.0, 0.01)
    assert abs(dT[round(100 / 0.01)] - 12.64) < 0.01 and abs(dT[-1] - 19.0) < 0.05
    print(f"RC max error {abs(v - exact).max():.1e}; winding +{dT[-1]:.2f} K after 300 s")
```
:::end

## Exercises

:::exercise
An RC low-pass filter uses $R = 4.7$ kΩ and $C = 10$ µF. How long after a step does it reach 95 %?
:::solution
1. $\tau = 4700 \times 10\times10^{-6} = 0.047$ s.
2. 95 % at $3.0\tau = 0.141$ s.
:::end

:::exercise
A temperature sensor in a probe reads 63.2 % of a sudden 50 K step after 8 s. What will it read 16 s after the step?
:::solution
1. 63.2 % at 8 s means $\tau = 8$ s.
2. At $t = 2\tau$: $50(1 - e^{-2}) = 43.2$ K of the 50 K step.
:::end

## Quiz

:::quiz
- type: num
  q: In the motor example ($\tau = 100$ s, final rise 20 K), what is the temperature rise after 100 s, in kelvin?
  answer: 12.642
  tol: 0.002
  unit: K
  py: "20*(1-math.exp(-1))"
  explain: $20(1 - e^{-1}) = 12.64$ K.
- type: num
  q: How many time constants does a first-order system take to reach 95 % of a step?
  answer: 2.9957
  tol: 0.005
  py: "-math.log(0.05)"
  explain: $1 - e^{-t/\tau} = 0.95$ gives $t = -\tau\ln 0.05 = 3.0\tau$.
- type: num
  q: What is τ, in seconds, for R = 4.7 kΩ and C = 10 µF?
  answer: 0.047
  tol: 0.001
  unit: s
  py: "4700*10e-6"
  explain: $\tau = RC = 0.047$ s.
- type: mc
  q: The initial slope of the step response τẋ + x = u (from x = 0) is…
  options:
    - u
    - u/τ
    - τ/u
    - zero
  answer: 1
  explain: $\dot x(0) = (u - 0)/\tau$. Extending that tangent reaches $u$ at $t = \tau$.
- type: num
  q: A probe reaches 63.2 % of a 50 K step after 8 s. What rise does it show after 16 s?
  answer: 43.233
  tol: 0.002
  unit: K
  py: "50*(1-math.exp(-2))"
  explain: $\tau = 8$ s, so at $2\tau$ the rise is $50(1 - e^{-2}) = 43.2$ K.
:::end

:::verify
import math
assert abs(20*(1-math.exp(-3))-19.0)<0.05 and abs(1-math.exp(-1)-0.632)<5e-4 and abs(-math.log(0.02)-3.9)<0.05
assert abs(2*50-100)<1e-12 and abs(3*10*2-60)<1e-12
assert abs(3.0*0.047-0.141)<5e-4
:::end
