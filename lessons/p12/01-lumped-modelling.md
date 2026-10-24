---
id: p12-l01
minutes: 35
summary: A lumped model replaces a continuous object with a few elements that store energy (capacitances, masses, inductances) and a few that dissipate it (resistances, dampers), and the number of independent storage elements is the model order. You derive a three-node thermal model of an espresso-machine boiler, simulate it, and show that a first-order model with the same total heat capacity stays within 5 % of it because the fast modes die out in seconds.
---

## Stores and dissipators

Physics happens everywhere inside a boiler, but a model only needs to track where energy **accumulates**. A lumped model uses:

- **Storage elements**: a thermal capacitance $C = m c_p$ (J/K) stores heat, a mass stores kinetic energy, a spring potential energy, a capacitor charge, an inductor flux.
- **Dissipators**: a thermal resistance $R$ (K/W) passes heat flow $q = \Delta T/R$; a damper or an electrical resistor turns energy into heat.
- **Sources**: a heater power $P$, a force, a voltage.

Each independent storage element contributes one state variable and one first-order equation, so the **model order** is the number of independent stores. For thermal nodes:

$$C_i \frac{dT_i}{dt} = P_i + \sum_j \frac{T_j - T_i}{R_{ij}}.$$

## Choosing the order

More nodes is not automatically better. Every extra store adds a time constant $\tau \approx RC$. If a store is small or tightly coupled, its time constant is tiny compared with the ones you care about: it reaches equilibrium almost instantly and can be **merged** into its neighbour. A good model keeps the slow stores you can observe and control and lumps the rest.

The espresso boiler below has three stores:

| node | capacitance | coupling |
|---|---|---|
| heater element | $C_h = 50$ J/K | $R_{hw} = 0.05$ K/W to the water |
| 0.3 L of water | $C_w = 1256$ J/K | $R_{wb} = 0.1$ K/W to the brass body |
| brass body | $C_b = 190$ J/K | $R_{ba} = 0.5$ K/W to the room |

The heater time constant $C_h R_{hw} = 2.5$ s and the body's $C_b R_{wb} = 19$ s are tiny next to the whole boiler's $\approx (C_h + C_w + C_b)(R_{wb} + R_{ba}) = 898$ s. So a **first-order** model, one capacitance $C = 1496$ J/K behind $R = 0.6$ K/W, should do.

:::figure widget=lumpedorder caption="Water temperature of the boiler model with one, two or three thermal nodes after the heater switches on. The coarse models track the full one closely because the dropped stores have time constants of seconds."
:::end

## Worked example

Heater at 150 W, room at 20 °C.

1. Steady state: all 150 W flows through $R_{wb}$ and $R_{ba}$ in series, so the water settles at $20 + 150 \times 0.6 = 110$ °C, and the body at $20 + 150 \times 0.5 = 95$ °C.
2. First-order model: $T_w(t) = 20 + 90\,(1 - e^{-t/898\,\text{s}})$.
3. After 10 minutes, $T_w = 20 + 90(1 - e^{-600/898}) = 63.9$ °C.
4. The full model's eigenvalues give time constants of 864 s, 14 s and 2.4 s: one slow mode, close to the lumped estimate of 898 s, and two that are gone within a minute. That's the formal version of "the fast modes die out". The simulation below finds the first-order model's worst error is 1.4 % of the rise (the full model reads 65.0 °C at 10 minutes).

## Code it from scratch

:::code file=lumped.py
```python
import numpy as np

Ch, Cw, Cb = 50.0, 0.3 * 4186.0, 190.0       # J/K
Rhw, Rwb, Rba = 0.05, 0.1, 0.5               # K/W
P, Ta = 150.0, 20.0

def full(t, T):
    Th, Tw, Tb = T
    return np.array([(P - (Th - Tw) / Rhw) / Ch,
                     ((Th - Tw) / Rhw - (Tw - Tb) / Rwb) / Cw,
                     ((Tw - Tb) / Rwb - (Tb - Ta) / Rba) / Cb])

def two_node(t, T):                           # heater merged into the water
    Tw, Tb = T
    return np.array([(P - (Tw - Tb) / Rwb) / (Ch + Cw),
                     ((Tw - Tb) / Rwb - (Tb - Ta) / Rba) / Cb])

def one_node(t, T):                           # everything in one lump behind Rwb + Rba
    return np.array([(P - (T[0] - Ta) / (Rwb + Rba)) / (Ch + Cw + Cb)])

def rk4(f, x0, t_end, dt):
    n = int(round(t_end / dt))
    xs, x = [np.array(x0, float)], np.array(x0, float)
    for k in range(n):
        t = k * dt
        k1 = f(t, x); k2 = f(t + dt / 2, x + dt / 2 * k1); k3 = f(t + dt / 2, x + dt / 2 * k2); k4 = f(t + dt, x + dt * k3)
        x = x + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4)
        xs.append(x)
    return np.arange(n + 1) * dt, np.array(xs)

def test_steady_state():
    t, X = rk4(full, [Ta] * 3, 20000, 0.5)
    assert abs(X[-1, 1] - (Ta + P * (Rwb + Rba))) < 0.01      # water -> 110 C
    assert abs(X[-1, 2] - (Ta + P * Rba)) < 0.01              # body -> 95 C
    assert abs(X[-1, 0] - (Ta + P * (Rhw + Rwb + Rba))) < 0.01

def test_reduced_within_5_percent():
    t_end, dt = 3 * 898.0, 0.5                  # dt well below the 2.5 s heater time constant
    t, X3 = rk4(full, [Ta] * 3, t_end, dt)
    _, X2 = rk4(two_node, [Ta] * 2, t_end, dt)
    _, X1 = rk4(one_node, [Ta], t_end, dt)
    rise = P * (Rwb + Rba)
    e2 = np.max(np.abs(X2[:, 0] - X3[:, 1])) / rise
    e1 = np.max(np.abs(X1[:, 0] - X3[:, 1])) / rise
    print(f"worst water-temperature error over 3 tau: 2-node {e2 * 100:.2f} %, 1-node {e1 * 100:.2f} % of the 90 K rise")
    assert e1 < 0.05 and e2 < e1
    k600 = int(600 / dt)
    print(f"after 10 min: full {X3[k600, 1]:.1f} C, 1-node {X1[k600, 0]:.1f} C (hand: 63.9 C)")
    assert abs(X1[k600, 0] - (Ta + rise * (1 - np.exp(-600 / 897.6)))) < 0.01

def test_time_scales():
    A = np.array([[-1 / (Rhw * Ch), 1 / (Rhw * Ch), 0],
                  [1 / (Rhw * Cw), -(1 / Rhw + 1 / Rwb) / Cw, 1 / (Rwb * Cw)],
                  [0, 1 / (Rwb * Cb), -(1 / Rwb + 1 / Rba) / Cb]])
    taus = sorted(-1 / np.linalg.eigvals(A).real)
    print("time constants of the full model (s):", ", ".join(f"{x:.1f}" for x in taus))
    assert taus[-1] > 30 * taus[-2]             # one slow mode, well separated
    assert abs(taus[-1] - 898) / 898 < 0.05

test_steady_state()
test_reduced_within_5_percent()
test_time_scales()
print("PASS")
```
:::end

## Exercises

:::exercise
The real boiler has a thermostat sensor screwed into the brass body. Is the first-order model still good enough for designing the temperature controller?
:::solution
For the open-loop warm-up, yes. For control, the sensor sees the *body*, which lags the water by the 19 s body mode, plus the sensor's own lag. A controller tuned on a first-order model will be too aggressive and oscillate. Keep at least the water and body nodes, so the model has the lag the controller will actually face.
:::end

:::exercise
Why does merging the heater into the water not change the steady state at all?
:::solution
Steady state depends only on resistances and sources: no heat accumulates, so all of P flows through the resistances to ambient. Merging changes capacitances (dynamics) and removes the small $R_{hw}$ drop between heater and water, which affects the heater's temperature but not the water's.
:::end

## Quiz

:::quiz
- type: num
  q: Steady water temperature in °C at 200 W with the lesson's resistances and a 20 °C room?
  answer: 140
  tol: 0.001
  unit: °C
  py: "20 + 200*(0.1 + 0.5)"
  explain: P(R_wb + R_ba) above ambient.
- type: num
  q: Time constant in s of the first-order boiler model?
  answer: 897.6
  tol: 0.001
  unit: s
  py: "(50 + 0.3*4186 + 190)*0.6"
  explain: Total capacitance times total resistance.
- type: num
  q: Heater element time constant C_h R_hw in s?
  answer: 2.5
  tol: 0.001
  unit: s
  py: "50*0.05"
  explain: Far faster than the boiler.
- type: num
  q: Water temperature in °C after 600 s (first-order model, 150 W)?
  answer: 63.9
  tol: 0.002
  unit: °C
  py: "20 + 90*(1 - __import__('math').exp(-600/897.6))"
  explain: Exponential rise towards 110 °C.
- type: mc
  q: What sets the order of a lumped model?
  options:
    - the number of independent energy-storage elements
    - the number of resistances
    - the number of inputs
    - the simulation step size
  answer: 0
  explain: Each store is one state.
- type: mc
  q: When can a storage element be merged into its neighbour?
  options:
    - when its time constant is much shorter than the dynamics you care about
    - when it is the largest store
    - when it has no resistance
    - never
  answer: 0
  explain: It equilibrates almost instantly.
:::end
