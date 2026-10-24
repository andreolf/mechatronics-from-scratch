---
id: p12-l07
minutes: 35
summary: A tank stores liquid the way a capacitor stores charge, and an outlet valve resists flow the way a resistor does, except that a real orifice's flow grows with the square root of the level, not linearly. You derive hydraulic capacitance and resistance and their thermal counterparts, simulate an irrigation tank filling and draining, and test that the steady level matches the flow balance and the drain time matches the closed form.
---

## Hydraulic capacitance and resistance

A tank of cross-section $A$ holding level $h$ obeys conservation of volume:

$$A\frac{dh}{dt} = q_{in} - q_{out}.$$

In pressure terms ($p = \rho g h$) the **hydraulic capacitance** is $C = A/(\rho g)$: a wide tank is a big capacitor. The outlet sets the **resistance**:

- **laminar** flow through a long thin pipe: $q = h/R$ (a linear resistor, Hagen-Poiseuille);
- an **orifice** or valve (turbulent): $q = C_d a\sqrt{2gh}$ (Torricelli), with discharge coefficient $C_d \approx 0.6$ for a sharp orifice of area $a$.

Most real outlets are orifices, which makes the tank **nonlinear**: lesson 10 linearises it.

## Steady state from the flow balance

At steady state nothing accumulates: $q_{out} = q_{in}$.

- Linear: $h_{ss} = R\,q_{in}$.
- Orifice: $h_{ss} = \dfrac{1}{2g}\left(\dfrac{q_{in}}{C_d a}\right)^2$, so doubling the inflow quadruples the level.

Draining from $h_0$ with the inflow off, $A\dot h = -C_d a\sqrt{2gh}$ separates: $\sqrt h$ falls linearly, and the tank empties in

$$t_{empty} = \frac{A}{C_d a}\sqrt{\frac{2h_0}{g}}.$$

## The thermal twin

Heat works the same way (lesson 01): $C\dot T = q_{in} - (T - T_a)/R$, with $C = mc_p$. Thermal resistances are nearly linear for conduction; convection and radiation add nonlinearity, just like orifices.

:::figure widget=tanklevel caption="An irrigation tank with a pump filling it and an orifice draining it. The level rises to where outflow balances inflow; switch the pump off to watch it drain, fast at first and slower as the head falls."
:::end

## Worked example

A 1 m² tank, a 3 cm orifice ($a = 7.07$ cm², $C_d = 0.6$), a pump delivering 2 L/s.

1. Steady level: $q_{in}/(C_d a) = 0.002/4.24\times10^{-4} = 4.72$ m/s, so $h_{ss} = 4.72^2/(2 \times 9.81) = 1.13$ m.
2. Drain from 1.13 m: $t = \frac{1}{4.24\times10^{-4}}\sqrt{2 \times 1.13/9.81} = 1132$ s, about 19 minutes.
3. Linearised near 1.13 m, the outlet looks like $R = 2h_{ss}/q_{in} = 1133$ s/m², time constant $AR \approx 19$ minutes too.

## Code it from scratch

:::code file=tank.py
```python
import numpy as np

A, d, Cd, g = 1.0, 0.03, 0.6, 9.81
a = np.pi * d ** 2 / 4
q_pump = 0.002                                        # m^3/s

def q_out(h):
    return Cd * a * np.sqrt(2 * g * max(h, 0.0))

def simulate(h0, pump_on, T, dt=0.5):
    h, t, H = h0, 0.0, [h0]
    def f(h):
        return ((q_pump if pump_on else 0.0) - q_out(h)) / A
    while t < T - 1e-12:
        k1 = f(h); k2 = f(h + dt / 2 * k1); k3 = f(h + dt / 2 * k2); k4 = f(h + dt * k3)
        h = max(h + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4), 0.0); t += dt; H.append(h)
    return np.array(H)

def h_steady():
    return (q_pump / (Cd * a)) ** 2 / (2 * g)

def t_empty(h0):
    return A / (Cd * a) * np.sqrt(2 * h0 / g)

def test_fill_to_flow_balance():
    H = simulate(0.0, True, 20000)
    print(f"filled level {H[-1]:.4f} m, flow balance predicts {h_steady():.4f} m")
    assert abs(H[-1] - h_steady()) / h_steady() < 1e-3
    assert abs(q_out(H[-1]) - q_pump) / q_pump < 1e-3

def test_drain_time():
    h0, dt = h_steady(), 0.5
    H = simulate(h0, False, 1.5 * t_empty(h0), dt)
    t_sim = np.argmax(H < 1e-4) * dt
    print(f"drain from {h0:.3f} m: simulated {t_sim:.0f} s, closed form {t_empty(h0):.0f} s")
    assert abs(t_sim - t_empty(h0)) / t_empty(h0) < 0.01
    # sqrt(h) falls linearly
    t = np.arange(len(H)) * dt
    mid = (t > 100) & (t < 800)
    slope = np.polyfit(t[mid], np.sqrt(H[mid]), 1)[0]
    assert abs(slope + Cd * a * np.sqrt(2 * g) / (2 * A)) < 1e-6

def test_quadratic_scaling():
    global q_pump
    q0 = q_pump; h1 = h_steady(); q_pump = 2 * q0; h2 = h_steady(); q_pump = q0
    assert abs(h2 / h1 - 4) < 1e-12
    print(f"double the pump flow: level {h1:.2f} m -> {h2:.2f} m")

test_fill_to_flow_balance()
test_drain_time()
test_quadratic_scaling()
print("PASS")
```
:::end

## Exercises

:::exercise
The tank must not exceed 1.5 m. What's the largest pump flow it can take with the 3 cm orifice?
:::solution
$q = C_d a\sqrt{2gh} = 4.24\times10^{-4}\sqrt{2 \times 9.81 \times 1.5} = 2.30$ L/s. Any more and the level settles above 1.5 m (or overflows).
:::end

:::exercise
Why does the tank take about the same time to drain as its linearised time constant, when the two models are so different?
:::solution
It's exact, not a coincidence. With $q = \kappa\sqrt h$ and $\kappa = C_d a\sqrt{2g}$, the linearised resistance at $h_{ss}$ is $R = dh/dq = 2\sqrt{h_{ss}}/\kappa$, so $AR = 2A\sqrt{h_{ss}}/\kappa$, which is the drain time from $h_{ss}$. The shapes still differ: the linear model is only 63 % drained after one time constant and never quite empties, while the real tank empties completely at $t = AR$, because $\sqrt h$ falls linearly.
:::end

## Quiz

:::quiz
- type: num
  q: Steady level in m for 1 L/s through the lesson's orifice?
  answer: 0.2832
  tol: 0.002
  unit: m
  py: "(0.001/(0.6*__import__('math').pi*0.03**2/4))**2/(2*9.81)"
  explain: Quarter of the 2 L/s level.
- type: num
  q: Time in s to drain a 2 m² tank from 1 m through C_d a = 5×10⁻⁴ m²?
  answer: 1806
  tol: 0.001
  unit: s
  py: "2/5e-4*(2*1/9.81)**0.5"
  explain: (A/(C_d a)) sqrt(2h₀/g).
- type: num
  q: Hydraulic capacitance in m³/Pa of a 1 m² tank of water (ρ = 1000, g = 9.81)?
  answer: 1.019e-4
  tol: 0.002
  unit: m³/Pa
  py: "1/(1000*9.81)"
  explain: A/(ρg).
- type: num
  q: Factor by which the steady level rises when the inflow triples (orifice outlet)?
  answer: 9
  tol: 0
  py: "3**2"
  explain: h ∝ q².
- type: mc
  q: What makes a tank with an orifice outlet nonlinear?
  options:
    - outflow grows with the square root of the level
    - the tank's area
    - gravity
    - the pump
  answer: 0
  explain: Torricelli's law.
- type: mc
  q: Which quantity plays the role of voltage in the hydraulic analogy?
  options:
    - pressure (or level)
    - flow
    - volume
    - area
  answer: 0
  explain: Flow is current, volume is charge.
:::end
