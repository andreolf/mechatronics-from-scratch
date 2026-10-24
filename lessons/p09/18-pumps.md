---
id: p09-l18
minutes: 40
summary: A pump settles where its head-flow curve crosses the pipe system's curve. You find that operating point, scale the pump curve with the affinity laws, and show for an irrigation pump lifting water to rice terraces in Bali that slowing the pump with a variable-frequency drive uses about half the power of throttling it with a valve.
---

## Two curves

A centrifugal pump at a fixed speed delivers less **head** (pressure expressed as metres of water, $H = p/\rho g$) as the flow rises. Over its useful range the curve is close to a downward parabola:

$$H_{pump}(Q) = H_0 - k\,Q^2.$$

The pipe network needs a **static head** $H_s$ (the height it lifts the water) plus friction losses that grow as $Q^2$ in turbulent flow:

$$H_{sys}(Q) = H_s + r\,Q^2.$$

The pump runs where they meet: $Q^* = \sqrt{(H_0 - H_s)/(k + r)}$. The hydraulic power is $\rho g Q H$, and the shaft power is that divided by the pump efficiency.

## Affinity laws

Run the same pump at speed ratio $n$ (from a variable-frequency drive feeding its induction motor). Velocities in the impeller scale with $n$, so:

$$Q \propto n, \qquad H \propto n^2, \qquad P \propto n^3.$$

The whole pump curve scales: $H_{pump}(Q, n) = n^2H_0 - kQ^2$. Power falling as the cube of speed is why a VFD saves so much: 80 % speed needs about half the power.

The laws compare points on the pump's own curves. The *operating point* only follows them exactly when the system curve is a parabola through the origin ($H_s = 0$, pure friction, as in a circulating loop). With a static lift, flow falls faster than speed, and below the speed where $n^2H_0 = H_s$ the pump delivers nothing at all.

## Throttle or slow down?

To deliver less water you can partly close a valve, which adds friction and moves the system curve up, while the pump keeps spinning at full speed; or slow the pump. The valve burns the excess head as heat in the water. The VFD avoids making it.

In Bali's terraced rice fields, the traditional *subak* irrigation system distributes river and spring water by gravity through canals and tunnels. Where farmers pump water up to higher fields instead, a slowed pump is the efficient way to match the flow to what the fields need.

:::figure widget=pumpcurve caption="Pump curves at the chosen speed (lime) and full speed (dashed), and the system curve with its static lift (amber). Slow the pump: the operating point slides down the system curve. Set the static lift to zero to see the affinity laws hold exactly."
:::end

## Worked example

A pump with $H_0 = 20$ m and $k = 0.08$ m/(m³/h)² lifts water 6 m through pipes with $r = 0.04$ m/(m³/h)². Take a pump efficiency of 60 % at every point (a simplification).

1. Full speed: $Q^* = \sqrt{14/0.12} = 10.80$ m³/h at $H = 6 + 0.04\cdot116.7 = 10.67$ m. Shaft power $= 1000\cdot9.81\cdot(10.80/3600)\cdot10.67/0.6 = 523$ W.
2. The fields need only 7 m³/h. **Throttling:** the pump stays on its full-speed curve at 7 m³/h, $H = 20 - 0.08\cdot49 = 16.08$ m, so $P = 511$ W.
3. **VFD:** $n^2\cdot20 = 6 + 0.12\cdot49$, so $n = 0.771$. Then $H = 6 + 0.04\cdot49 = 7.96$ m and $P = 253$ W, **50 % less**.
4. Over 8 hours a day that's $0.258\cdot8 = 2.1$ kWh saved every day.

## Code it from scratch

:::code file=pump_curves.py
```python
import numpy as np
from scipy.optimize import brentq

H0, K, RHO, G, ETA = 20.0, 0.08, 1000.0, 9.81, 0.6

def pump_head(Q, n=1.0):
    return n * n * H0 - K * Q * Q

def operating_point(n, Hs, r):
    f = lambda Q: pump_head(Q, n) - (Hs + r * Q * Q)
    if f(0.0) <= 0:
        return 0.0, Hs                                  # can't lift the water at all
    Q = brentq(f, 0.0, 100.0)
    return Q, Hs + r * Q * Q

def shaft_power(Q, H):
    return RHO * G * (Q / 3600) * H / ETA               # Q in m3/h, H in m, P in W

if __name__ == "__main__":
    # affinity laws hold exactly for a pure-friction system (Hs = 0)
    Q1, H1 = operating_point(1.0, 0.0, 0.04); P1 = shaft_power(Q1, H1)
    for n in (0.5, 0.7, 0.9):
        Q, H = operating_point(n, 0.0, 0.04)
        assert abs(Q / Q1 - n) < 1e-9 and abs(H / H1 - n * n) < 1e-9 and abs(shaft_power(Q, H) / P1 - n ** 3) < 1e-9
    # with a 6 m static lift, flow falls faster than speed
    Qf, Hf = operating_point(1.0, 6.0, 0.04)
    Qh, _ = operating_point(0.8, 6.0, 0.04)
    print(f"full speed {Qf:.2f} m3/h at {Hf:.2f} m, {shaft_power(Qf, Hf):.0f} W; 80 % speed {Qh:.2f} m3/h")
    assert Qh < 0.8 * Qf and operating_point(np.sqrt(6 / 20) * 0.99, 6.0, 0.04)[0] == 0.0
    # deliver 7 m3/h: throttle valve versus VFD
    Qt = 7.0
    P_throttle = shaft_power(Qt, pump_head(Qt))
    n = np.sqrt((6.0 + (K + 0.04) * Qt * Qt) / H0)
    Qv, Hv = operating_point(n, 6.0, 0.04)
    P_vfd = shaft_power(Qv, Hv)
    print(f"7 m3/h: throttled {P_throttle:.0f} W, VFD at {100*n:.1f} % speed {P_vfd:.0f} W")
    assert abs(Qv - Qt) < 1e-9 and P_vfd < 0.55 * P_throttle
    assert abs(shaft_power(Qf, Hf) - 523) < 1 and abs(P_throttle - 511) < 1 and abs(P_vfd - 253) < 1
```
:::end

## Exercises

:::exercise
At what speed does the pump stop delivering water to the 6 m terrace?
:::solution
When its shut-off head equals the lift: $n^2\cdot20 = 6$, so $n = 0.548$. Below 55 % speed it just churns (and heats) the water in the pipe. VFDs for lifting duty have a minimum speed setting for this reason.
:::end

:::exercise
Why do affinity-law savings claims for building fans and chilled-water loops often hold well, but for irrigation lifts less so?
:::solution
Closed circulating loops and air ducts have almost no static head, so their system curve passes through the origin and the cube law applies. A lift has a large static head that doesn't shrink with speed, so the savings at a given flow are smaller (though still large compared with throttling).
:::end

## Quiz

:::quiz
- type: num
  q: Full-speed flow in m³/h (H₀ = 20, k = 0.08, H_s = 6, r = 0.04)?
  answer: 10.80
  tol: 0.002
  unit: m³/h
  py: "math.sqrt(14/0.12)"
  explain: √((H₀ − H_s)/(k + r)).
- type: num
  q: Power ratio at 80 % speed by the affinity laws?
  answer: 0.512
  tol: 0.001
  py: "0.8**3"
  explain: P ∝ n³.
- type: num
  q: Speed ratio that delivers 7 m³/h with a VFD?
  answer: 0.7707
  tol: 0.002
  py: "math.sqrt((6+0.12*49)/20)"
  explain: n²H₀ = H_s + (k + r)Q².
- type: num
  q: Shaft power in W when throttling to 7 m³/h (H = 16.08 m, η = 0.6)?
  answer: 511
  tol: 0.003
  unit: W
  py: "1000*9.81*7/3600*16.08/0.6"
  explain: ρgQH/η.
- type: num
  q: Minimum speed ratio to lift water 6 m with H₀ = 20 m?
  answer: 0.5477
  tol: 0.002
  py: "math.sqrt(6/20)"
  explain: n²H₀ = H_s.
- type: mc
  q: The affinity laws apply exactly to the operating point when…
  options:
    - the system has a static lift
    - the system curve passes through the origin
    - the pump is throttled
    - the pump efficiency is 100 %
  answer: 1
  explain: Pure-friction systems.
:::end

:::verify
import math
P = lambda Q, H: 1000*9.81*Q/3600*H/0.6
assert abs(P(7, 7.96) - 253) < 1 and abs((511-253)*8/1000 - 2.06) < 0.01
:::end
