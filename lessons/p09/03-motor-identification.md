---
id: p09-l03
minutes: 40
summary: A datasheet gives typical values, and your motor isn't typical. You design three bench tests (locked rotor, no-load at two voltages, and spin-down) that separate the five parameters R, L, k, J and b plus Coulomb friction, then fit them from noisy synthetic measurements and recover every one within 5 percent.
---

## Test 1: locked rotor gives R and L

Clamp the shaft so $\omega = 0$. The back-EMF vanishes and the electrical equation is just an RL circuit:

$$i(t) = \frac{V}{R}\left(1 - e^{-tR/L}\right).$$

The final current gives $R = V/i_\infty$, and the time to reach 63 % gives $\tau_e = L/R$. Use a low voltage so the stalled motor doesn't overheat, and rotate the shaft to a few positions and average, because brush contact resistance varies.

## Test 2: no-load at two voltages gives k, b and Coulomb friction

Let the motor spin freely and measure steady speed $\omega$ and current $i$. With friction modelled as viscous plus Coulomb, $T_f = b\omega + T_c$:

$$V = R i + k\omega \;\Rightarrow\; k = \frac{V - R i}{\omega},$$
$$k i = b\omega + T_c.$$

One test gives $k$. Two tests at different voltages give two points on the line $k i = b\omega + T_c$, so its slope is $b$ and its intercept is $T_c$.

## Test 3: spin-down gives J

Run at speed, then open the circuit ($i = 0$). Only friction acts:

$$J\frac{d\omega}{dt} = -b\omega - T_c \;\Rightarrow\; \omega(t) = \left(\omega_0 + \frac{T_c}{b}\right)e^{-t/\tau} - \frac{T_c}{b},\quad \tau = \frac{J}{b}.$$

Fitting $\tau$ and knowing $b$ from test 2 gives $J = b\,\tau$. Spin-down is used for large machines too: it's how you measure the inertia of a generator or a flywheel.

:::figure widget=motorid caption="Spin-down data with tachometer noise and the fitted model ω = A·e^(−t/τ) − B. For each trial τ the model is linear in A and B, so the fit scans τ and solves a small least-squares problem."
:::end

## Worked example

Measurements on a small 12 V motor:

1. Locked rotor at 1.0 V: the current settles at 0.833 A and reaches 63 % after 0.50 ms. So $R = 1.20$ Ω and $L = 0.5\text{ ms}\cdot1.2\ \Omega = 0.60$ mH.
2. No-load at 12 V: 595.2 rad/s, 79.5 mA. So $k = (12 - 1.2\cdot0.0795)/595.2 = 0.0200$ V·s/rad.
3. No-load at 6 V: 297.0 rad/s, 49.7 mA. The two points $(\omega, k i)$ are $(595.2, 1.590\times10^{-3})$ and $(297.0, 0.994\times10^{-3})$. Slope $b = 2.0\times10^{-6}$ N·m·s, intercept $T_c = 0.40$ mN·m.
4. Spin-down from 595 rad/s with $\tau = 1.50$ s: $J = 2\times10^{-6}\cdot1.5 = 3.0\times10^{-6}$ kg·m².

## Code it from scratch

:::code file=motor_id.py
```python
import numpy as np
from scipy.optimize import curve_fit

TRUE = dict(R=1.2, L=0.6e-3, k=0.02, J=3e-6, b=2e-6, Tc=4e-4)
rng = np.random.default_rng(3)

def no_load(V, p):
    w = (V - p["R"] * p["Tc"] / p["k"]) / (p["k"] + p["R"] * p["b"] / p["k"])
    return w, (p["b"] * w + p["Tc"]) / p["k"]

# --- synthetic bench data, with noise ---
t1 = np.arange(0, 5e-3, 1e-5)
i_locked = 1.0 / TRUE["R"] * (1 - np.exp(-t1 * TRUE["R"] / TRUE["L"])) + 0.005 * rng.standard_normal(t1.size)
nl = {V: no_load(V, TRUE) for V in (6.0, 12.0)}
meas = {V: (w * (1 + 0.002 * rng.standard_normal()), i * (1 + 0.005 * rng.standard_normal())) for V, (w, i) in nl.items()}
w0 = nl[12.0][0]
tau = TRUE["J"] / TRUE["b"]; wc = TRUE["Tc"] / TRUE["b"]
t3 = np.arange(0, 3, 0.01)
w_sd = np.maximum((w0 + wc) * np.exp(-t3 / tau) - wc, 0)
keep = w_sd > 20
t3, w_sd = t3[keep], w_sd[keep] + 2.0 * rng.standard_normal(keep.sum())

# --- identification ---
(I_inf, tau_e), _ = curve_fit(lambda t, a, c: a * (1 - np.exp(-t / c)), t1, i_locked, p0=[1, 1e-3])
R = 1.0 / I_inf
L = tau_e * R
k = np.mean([(V - R * i) / w for V, (w, i) in meas.items()])
(wa, ia), (wb, ib) = meas[6.0], meas[12.0]
b = k * (ib - ia) / (wb - wa)
Tc = k * ia - b * wa
(A, tau_fit, B), _ = curve_fit(lambda t, A, c, B: A * np.exp(-t / c) - B, t3, w_sd, p0=[w0, 1, 100])
J = b * tau_fit
est = dict(R=R, L=L, k=k, J=J, b=b, Tc=Tc)

if __name__ == "__main__":
    for name, v in est.items():
        err = 100 * (v - TRUE[name]) / TRUE[name]
        print(f"{name:>2} = {v:.4g} (true {TRUE[name]:.4g}, {err:+.1f} %)")
        assert abs(err) < 5, name
```
:::end

## Exercises

:::exercise
Why do you need two no-load voltages rather than one to find b?
:::solution
One test gives one equation $k i = b\omega + T_c$ with two unknowns. Viscous and Coulomb friction both look like "friction torque at this speed", and only changing the speed separates the part that scales with speed (b) from the constant part ($T_c$).
:::end

:::exercise
The spin-down curve goes to zero in finite time instead of decaying forever. Which friction term causes that?
:::solution
Coulomb friction. A constant opposing torque $T_c$ makes $\omega$ hit zero at $t = \tau\ln(1 + \omega_0 b/T_c)$. Pure viscous friction would give an exponential that never quite reaches zero.
:::end

## Quiz

:::quiz
- type: num
  q: R in Ω from a locked-rotor test at 1.0 V settling at 0.833 A?
  answer: 1.2
  tol: 0.002
  unit: Ω
  py: "1.0/0.833"
  explain: R = V/i∞.
- type: num
  q: L in mH if the 63 % time is 0.50 ms with R = 1.2 Ω?
  answer: 0.6
  tol: 0.001
  unit: mH
  py: "0.5*1.2"
  explain: L = τ·R.
- type: num
  q: k from a no-load test at 12 V, 595.2 rad/s, 79.5 mA (R = 1.2 Ω)?
  answer: 0.0200
  tol: 0.002
  unit: V·s/rad
  py: "(12-1.2*0.0795)/595.2"
  explain: (V − R·i)/ω.
- type: num
  q: J in kg·m² if b = 2e-6 N·m·s and the spin-down time constant is 1.5 s?
  answer: 3e-6
  tol: 0.001
  unit: kg·m²
  py: "2e-6*1.5"
  explain: τ = J/b.
- type: num
  q: Time in s for that spin-down to stop from 595 rad/s with T_c/b = 200 rad/s?
  answer: 2.070
  tol: 0.002
  unit: s
  py: "1.5*math.log(1+595/200)"
  explain: t = τ ln(1 + ω₀ b/T_c).
- type: mc
  q: The locked-rotor test is done at low voltage because…
  options:
    - the back-EMF is too large
    - the full stall current would overheat the winding
    - inductance depends on voltage
    - k changes with voltage
  answer: 1
  explain: No back-EMF limits the current.
:::end

:::verify
import math
R, k, b, Tc = 1.2, 0.02, 2e-6, 4e-4
for V, ws, iss in ((12, 595.2, 0.0795), (6, 297.0, 0.0497)):
    w = (V - R*Tc/k)/(k + R*b/k); i = (b*w + Tc)/k
    assert abs(w - ws) < 0.1 and abs(i - iss) < 1e-4
assert abs((0.02*0.0795 - 0.02*0.0497)/(595.2-297.0) - 2.0e-6) < 0.03e-6
:::end
