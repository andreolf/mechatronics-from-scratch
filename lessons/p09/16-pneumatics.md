---
id: p09-l16
minutes: 40
summary: Compressed air is cheap, clean and forgiving, and it's also a spring. You derive cylinder force, choked flow through a valve orifice, and the stiffness of the trapped air, then simulate a cylinder extending against a load and check its stroke time against a hand estimate from the flow rate.
---

## Force and flow

A cylinder of bore area $A$ with gauge pressure $p - p_{atm}$ pushes with

$$F = (p - p_{atm})A.$$

The speed is set by how fast air can get in. Flow through a valve orifice of area $A_o$ from a supply $p_s$ is **choked** (sonic at the throat) whenever the downstream pressure is below $0.528\,p_s$. Then the mass flow is independent of the downstream pressure:

$$\dot m = C_d A_o\,p_s\sqrt{\frac{\kappa}{R T}}\left(\frac{2}{\kappa + 1}\right)^{\frac{\kappa + 1}{2(\kappa - 1)}} = 0.0404\,\frac{C_d A_o p_s}{\sqrt T}$$

for air ($\kappa = 1.4$, $R = 287$ J/(kg·K), SI units). Above $0.528p_s$ the flow falls toward zero as the pressures equalise.

## Stroke time estimate

While moving at steady speed, the chamber sits near the **working pressure** $p_w = p_{atm} + F/A$ (plus friction). The incoming air fills volume at $\dot V = \dot m R T/p_w$, so the piston speed and stroke time are

$$v = \frac{\dot m R T}{p_w A}, \qquad t \approx t_{fill} + \frac{s\,A\,p_w}{\dot m R T},$$

where $t_{fill} = (p_w - p_{atm})V_0/(\dot m R T)$ is the time to pressurise the dead volume $V_0$ before the piston moves. The estimate ignores the time to accelerate the moving mass and the extra pressure that seal friction needs, so it's optimistic. It's good (within 15 % here) for loaded, flow-limited strokes of a quarter-second or more, and it underestimates fast, lightly loaded strokes, where the motion is limited by dynamics instead.

Speed is therefore set by the **valve**, and flow-control valves (throttles on the exhaust, usually) are how you adjust it.

## Air is a spring

Trapped air of volume $V$ at pressure $p$ resists a small displacement with stiffness

$$k = \frac{n\,p\,A^2}{V},$$

with $n = 1$ for slow (isothermal) and $n = 1.4$ for fast (adiabatic) changes. It's soft: a moving mass bounces on it, which is why pneumatic cylinders are great for end-to-end moves and hard to stop in the middle. Positioning needs proportional valves and feedback, or a servo-electric axis.

:::figure widget=pneumatic caption="Chamber pressure and piston travel as a valve opens. Pressure builds, the piston moves at a nearly constant pressure set by the load, then pressure rises to supply at the end of stroke."
:::end

## Worked example

32 mm bore ($A = 8.04$ cm²), 200 mm stroke, 7 bar abs supply, 200 N load, orifice 1.5 mm ($C_d = 0.8$), 10 mm of dead length, 293 K.

1. Working pressure: $1.013 + 200/8.04\times10^{-4}/10^5 = 3.50$ bar abs, below $0.528\cdot7 = 3.70$ bar, so the flow is choked.
2. $\dot m = 0.0404\cdot0.8\cdot1.767\times10^{-6}\cdot7\times10^5/\sqrt{293} = 2.34$ g/s.
3. Stroke: $0.2\cdot8.04\times10^{-4}\cdot3.50\times10^5/(2.34\times10^{-3}\cdot287\cdot293) = 0.287$ s, plus a fill time of 10 ms: about 0.30 s.
4. Air spring at mid-stroke (adiabatic): $1.4\cdot3.5\times10^5\cdot(8.04\times10^{-4})^2/8.85\times10^{-5} = 3580$ N/m. With a 5 kg load that's $\sqrt{3580/5}/2\pi = 4.3$ Hz.

## Code it from scratch

:::code file=pneumatic_cylinder.py
```python
import numpy as np

Rg, Tk, pa, Cd = 287.0, 293.0, 1.013e5, 0.8

def mass_flow(ps, p, d_orifice):
    Ao = np.pi * d_orifice ** 2 / 4
    r = p / ps
    psi = 0.0404 if r <= 0.528 else 0.0404 * np.sqrt(max(0.0, 1 - ((r - 0.528) / 0.472) ** 2))
    return Cd * Ao * psi * ps / np.sqrt(Tk)

def simulate(d0, F, ps=7e5, bore=0.032, stroke=0.2, m=5.0, x0=0.01, c=50.0, dt=2e-5, T=3.0):
    A = np.pi * bore ** 2 / 4
    p, x, v = pa, 0.0, 0.0
    for n in range(int(T / dt)):
        mdot = mass_flow(ps, p, d0)
        Vol = A * (x0 + x)
        a = ((p - pa) * A - F - c * v) / m
        if x <= 0 and a < 0: a, v = 0.0, 0.0
        v += a * dt; x = min(max(x + v * dt, 0.0), stroke)
        p += dt * (Rg * Tk * mdot - p * A * v) / Vol          # isothermal chamber
        if x >= stroke:
            return n * dt
    return np.inf

def estimate(d0, F, ps=7e5, bore=0.032, stroke=0.2, x0=0.01):
    A = np.pi * bore ** 2 / 4; pw = pa + F / A
    mdot = mass_flow(ps, pw, d0)
    t_fill = (pw - pa) * A * x0 / (mdot * Rg * Tk)
    return t_fill + stroke * A * pw / (mdot * Rg * Tk)

if __name__ == "__main__":
    for d0 in (1.0e-3, 1.5e-3, 2.5e-3):
        for F in (100.0, 200.0, 300.0):
            ts, te = simulate(d0, F), estimate(d0, F)
            print(f"orifice {d0*1e3:.1f} mm, load {F:.0f} N: simulated {ts:.3f} s, estimate {te:.3f} s ({100*(ts-te)/te:+.0f} %)")
            assert ts >= te                                   # the estimate ignores acceleration: always optimistic
            if te > 0.25 and F >= 200:                        # flow-limited strokes: the estimate holds
                assert (ts - te) / te < 0.15
    A = np.pi * 0.032 ** 2 / 4
    k = 1.4 * 3.5e5 * A ** 2 / (A * 0.11)
    print(f"air spring {k:.0f} N/m, {np.sqrt(k / 5) / (2 * np.pi):.1f} Hz with 5 kg")
    assert abs(k - 3580) < 10
```
:::end

## Exercises

:::exercise
The load drops to zero. Why does the estimate get worse, and what limits the speed instead?
:::solution
With no load the working pressure is barely above atmospheric, so the estimate predicts a very high speed (over 2 m/s here). In reality the piston's mass must be accelerated, seal friction and exhaust back-pressure resist it, and the exhaust valve limits the outflow. The motion becomes dynamics-limited, and you need cushioning at the end of stroke.
:::end

:::exercise
Why are pneumatic speed controls usually fitted on the exhaust rather than the supply?
:::solution
Throttling the exhaust keeps air trapped on the outgoing side, which acts as a cushion and gives a stiffer, steadier motion, independent of load. Throttling the supply lets the piston lurch forward ("stick-slip") whenever friction breaks free, because nothing holds it back.
:::end

## Quiz

:::quiz
- type: num
  q: Working pressure in bar abs for 200 N on a 32 mm bore?
  answer: 3.50
  tol: 0.003
  unit: bar
  py: "(1.013e5+200/(math.pi*0.032**2/4))/1e5"
  explain: p_atm + F/A.
- type: num
  q: Highest downstream pressure in bar abs at which flow from 7 bar abs is still choked?
  answer: 3.696
  tol: 0.002
  unit: bar
  py: "0.528*7"
  explain: 0.528·p_s.
- type: num
  q: Choked mass flow in g/s through a 1.5 mm orifice (C_d 0.8, 7 bar abs, 293 K)?
  answer: 2.34
  tol: 0.005
  unit: g/s
  py: "0.0404*0.8*math.pi*1.5e-3**2/4*7e5/math.sqrt(293)*1000"
  explain: 0.0404·C_d·A_o·p_s/√T.
- type: num
  q: Stroke time in s at that flow (200 mm, A = 8.04 cm², p_w = 3.50 bar)?
  answer: 0.287
  tol: 0.01
  unit: s
  py: "0.2*8.04e-4*3.50e5/(2.34e-3*287*293)"
  explain: s·A·p_w/(ṁRT).
- type: num
  q: Natural frequency in Hz of 5 kg on a 3580 N/m air spring?
  answer: 4.26
  tol: 0.005
  unit: Hz
  py: "math.sqrt(3580/5)/(2*math.pi)"
  explain: √(k/m)/2π.
- type: mc
  q: Under choked flow, the mass flow…
  options:
    - rises with downstream pressure
    - doesn't depend on downstream pressure
    - is zero
    - depends only on the cylinder size
  answer: 1
  explain: The throat is sonic.
:::end

:::verify
import math
assert abs(math.sqrt(1.4/287)*(2/2.4)**3 - 0.0404) < 1e-4
:::end
