---
id: p12-l06
minutes: 40
summary: A motor converts electrical to mechanical power through one constant, and power conservation forces the torque constant to equal the back-EMF constant in SI units. You derive that, build a model of a motor driving a load through a gearbox, simulate it, and test that every joule from the supply is accounted for, as copper loss, friction, stored kinetic and magnetic energy and work done on the load, to within 1 %.
---

## Why k_t equals k_e

A DC motor produces torque $\tau = k_t i$ and back-EMF $e = k_e\omega$ (Phase 09). The electrical power going into the conversion is $e\,i$, the mechanical power coming out is $\tau\omega$. The conversion itself stores nothing and loses nothing (losses are separate: resistance, friction), so

$$e\,i = \tau\,\omega \;\Rightarrow\; k_e\,\omega\, i = k_t\, i\,\omega \;\Rightarrow\; k_t = k_e$$

in SI units (N·m/A and V·s/rad). Datasheets quoting $k_e$ in V/krpm hide this: $1$ V/krpm $= 60/(2\pi \cdot 1000) = 9.55$ mV·s/rad.

## Motor, gearbox, load

A gearbox with ratio $N$ (motor turns $N$ times per load turn) multiplies torque and divides speed: $\omega_L = \omega_m/N$, $\tau_L = N\tau_{out}$. Seen from the motor, a load inertia shrinks by $N^2$ and a load torque by $N$:

$$J_{eq} = J_m + \frac{J_L}{N^2}, \qquad L\frac{di}{dt} = V - Ri - k\omega_m, \qquad J_{eq}\dot\omega_m = k i - b\,\omega_m - \frac{\tau_{load}}{N}.$$

## The energy balance

Integrate power over the run. Everything the supply delivers goes somewhere:

$$\int V i\,dt = \underbrace{\int R i^2 dt}_{\text{copper}} + \underbrace{\int b\,\omega_m^2 dt}_{\text{friction}} + \underbrace{\tfrac12 L i^2 + \tfrac12 J_{eq}\omega_m^2}_{\text{stored}} + \underbrace{\int \frac{\tau_{load}}{N}\omega_m\, dt}_{\text{work on the load}}.$$

If a simulation doesn't close this balance, either the equations or the integration are wrong. It's the multi-domain version of the energy check in lesson 04.

:::figure widget=motorflywheel caption="A motor spinning up a flywheel through a gearbox, with the energy flows stacked: copper loss, friction, kinetic energy and work done. Change the gear ratio to see the best match between motor and load inertia."
:::end

## Worked example

A 24 V motor with $R = 0.8$ Ω, $L = 1$ mH, $k = 0.05$ N·m/A, $J_m = 2\times10^{-5}$ kg·m², $b = 10^{-5}$ N·m·s, driving a winch drum ($J_L = 0.01$ kg·m²) lifting against 1.5 N·m through $N = 20$.

1. $J_{eq} = 2\times10^{-5} + 0.01/400 = 4.5\times10^{-5}$ kg·m².
2. Load torque at the motor: $1.5/20 = 0.075$ N·m, so the steady current is about $0.075/0.05 = 1.5$ A plus friction.
3. Steady speed: $\omega_m = (kV - R\,\tau)/(k^2 + Rb)$ with $\tau = 0.075$: $(1.2 - 0.06)/(0.0025 + 8\times10^{-6}) = 454.5$ rad/s, so the drum turns at 22.7 rad/s.
4. In steady state the supply gives $24 \times 1.59 = 38$ W, of which about 2 W is copper loss and 34 W lifts the load.

## Code it from scratch

:::code file=motor_energy.py
```python
import numpy as np

R, L, k, Jm, b = 0.8, 1e-3, 0.05, 2e-5, 1e-5
JL, N, tau_load, V = 0.01, 20.0, 1.5, 24.0
Jeq = Jm + JL / N ** 2

def f(s):
    i, w, _ = s
    di = (V - R * i - k * w) / L
    dw = (k * i - b * w - tau_load / N) / Jeq
    return np.array([di, dw, w / N])                # last state: load angle

def simulate(T=0.5, dt=1e-5):
    n = int(round(T / dt)); s = np.zeros(3); S = np.empty((n + 1, 3)); S[0] = s
    for j in range(n):
        k1 = f(s); k2 = f(s + dt / 2 * k1); k3 = f(s + dt / 2 * k2); k4 = f(s + dt * k3)
        s = s + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4); S[j + 1] = s
    return np.arange(n + 1) * dt, S

def trapz(y, t):
    return float(np.sum((y[1:] + y[:-1]) * np.diff(t)) / 2)

def test_kt_equals_ke():
    # power through the conversion: e*i must equal tau*w at every instant
    t, S = simulate(0.05)
    i, w = S[:, 0], S[:, 1]
    assert np.max(np.abs((k * w) * i - (k * i) * w)) < 1e-9
    v_per_krpm = 0.05 * 1000 * 2 * np.pi / 60
    print(f"k = 0.05 N*m/A = 0.05 V*s/rad = {v_per_krpm:.3f} V/krpm")
    assert abs(v_per_krpm - 5.236) < 1e-3

def test_energy_balance():
    t, S = simulate()
    i, w = S[:, 0], S[:, 1]
    supplied = trapz(V * i, t)
    copper = trapz(R * i ** 2, t)
    friction = trapz(b * w ** 2, t)
    stored = 0.5 * L * i[-1] ** 2 + 0.5 * Jeq * w[-1] ** 2
    work = tau_load * S[-1, 2]                       # torque times drum angle
    accounted = copper + friction + stored + work
    err = abs(supplied - accounted) / supplied
    print(f"supplied {supplied:.3f} J = copper {copper:.3f} + friction {friction:.4f} + stored {stored:.3f} + lifting {work:.3f} J; error {err * 100:.4f} %")
    assert err < 0.01

def test_steady_state():
    t, S = simulate()
    tau = tau_load / N
    w_ss = (k * V - R * tau) / (k ** 2 + R * b)
    print(f"steady motor speed {S[-1, 1]:.1f} rad/s (formula {w_ss:.1f}); drum {S[-1, 1] / N:.2f} rad/s; current {S[-1, 0]:.3f} A")
    assert abs(S[-1, 1] - w_ss) / w_ss < 1e-3
    assert abs(Jeq - 4.5e-5) < 1e-12

test_kt_equals_ke()
test_energy_balance()
test_steady_state()
print("PASS")
```
:::end

## Exercises

:::exercise
For a pure inertia load and a fixed motor, which gear ratio gives the fastest acceleration of the load?
:::solution
Load acceleration is $\alpha_L = N\tau_m/(J_m N^2 + J_L)$. Differentiating in $N$ and setting to zero gives $N^2 = J_L/J_m$: the reflected load inertia equals the motor's. For the winch drum, $N = \sqrt{0.01/2\times10^{-5}} = 22.4$, close to the 20 used.
:::end

:::exercise
A datasheet gives $k_e = 6$ V/krpm and $k_t = 0.06$ N·m/A. Is that consistent?
:::solution
6 V/krpm is $6 \times 60/(2\pi \times 1000) = 0.0573$ V·s/rad, about 4.5 % lower than $k_t$. Real datasheets differ by a few percent through measurement conditions, magnet temperature and friction torque being folded into $k_t$; a large mismatch means a units error.
:::end

## Quiz

:::quiz
- type: num
  q: Torque constant in N·m/A of a motor with k_e = 10 V/krpm?
  answer: 0.0955
  tol: 0.001
  unit: N·m/A
  py: "10*60/(2*__import__('math').pi*1000)"
  explain: Convert to V·s/rad; then k_t = k_e.
- type: num
  q: Reflected inertia in kg·m² of J_L = 0.01 through N = 20?
  answer: 2.5e-5
  tol: 0.001
  unit: kg·m²
  py: "0.01/20**2"
  explain: Divided by N².
- type: num
  q: Steady motor speed in rad/s in the worked example?
  answer: 454.5
  tol: 0.002
  unit: rad/s
  py: "(0.05*24 - 0.8*1.5/20)/(0.05**2 + 0.8*1e-5)"
  explain: (kV − Rτ)/(k² + Rb).
- type: num
  q: Gear ratio that matches J_m = 2×10⁻⁵ to J_L = 0.01?
  answer: 22.36
  tol: 0.001
  py: "(0.01/2e-5)**0.5"
  explain: N² = J_L/J_m.
- type: mc
  q: Why must k_t equal k_e in SI units?
  options:
    - the conversion conserves power, so e·i = τ·ω
    - by definition of the ampere
    - because of friction
    - it's a coincidence
  answer: 0
  explain: Losses are modelled separately.
- type: mc
  q: What does a load torque look like from the motor side of an N:1 gearbox?
  options:
    - divided by N
    - multiplied by N
    - divided by N²
    - unchanged
  answer: 0
  explain: Torque scales by N; inertia by N².
:::end
