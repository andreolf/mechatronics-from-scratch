---
id: p13-l15
minutes: 40
summary: Gain and phase margins say how far a stable loop is from the critical point, the gain margin as the factor of extra gain and the phase margin as the extra lag it could take before oscillating, and a time delay eats phase margin in proportion to frequency. You derive both margins and the delay margin from the crossover frequencies, compute them for a third-order loop, and test in time-domain simulation that the loop goes unstable exactly at the predicted gain and the predicted delay.
---

## Two crossovers

On the Bode plot of a stable open loop $L$:

- **Gain crossover** $\omega_c$: where $|L| = 1$. The **phase margin** is $PM = 180° + \angle L(j\omega_c)$.
- **Phase crossover** $\omega_{180}$: where $\angle L = -180°$. The **gain margin** is $GM = 1/|L(j\omega_{180})|$, often quoted in dB.

Multiply the gain by $GM$ and the plot passes through $-1$: the loop oscillates at $\omega_{180}$. Add $PM$ of lag at $\omega_c$ and the same happens at $\omega_c$.

## Delay eats phase

A dead time $e^{-s\tau}$ has gain 1 and phase $-\omega\tau$. It leaves $\omega_c$ unchanged and subtracts $\omega_c\tau$ from the margin, so the loop goes unstable at the **delay margin**

$$\tau_{max} = \frac{PM\ (\text{rad})}{\omega_c}.$$

Typical targets: $PM$ of 45° to 60°, $GM$ of 6 dB or more.

:::figure widget=margins caption="The Bode plot of 2/(s(s + 1)(s + 2)) with both margins marked. Add a delay and watch the phase curve bend down and the phase margin shrink to zero at 0.76 s."
:::end

## Worked example

$L(s) = \dfrac{2}{s(s + 1)(s + 2)}$.

1. Phase crossover: $-90° - \arctan\omega - \arctan(\omega/2) = -180°$ gives $\omega_{180} = \sqrt2$. There $|L| = 2/(\sqrt2\sqrt3\sqrt6) = 1/3$, so $GM = 3$ (9.5 dB). Routh agrees: $s^3 + 3s^2 + 2s + K$ is stable for $K < 6 = 3 \times 2$.
2. Gain crossover: $|L| = 1$ at $\omega_c = 0.749$ rad/s, where $PM = 32.6°$.
3. Delay margin: $0.569\ \text{rad}/0.749 = 0.76$ s.

## Code it from scratch

:::code file=margins.py
```python
import numpy as np
from scipy.optimize import brentq

K0 = 2.0
L = lambda s, K=K0: K / (s * (s + 1) * (s + 2))
A = np.array([[0, 1, 0], [0, 0, 1], [0, -2, -3.0]]); B = np.array([0, 0, 1.0]); C = np.array([1.0, 0, 0])   # 1/(s(s+1)(s+2))

def margins(L):
    w180 = brentq(lambda w: np.unwrap([np.angle(L(1j * x)) for x in np.linspace(1e-3, w, 200)])[-1] + np.pi, 0.1, 10)
    wc = brentq(lambda w: abs(L(1j * w)) - 1, 1e-3, 10)
    return 1 / abs(L(1j * w180)), w180, 180 + np.degrees(np.angle(L(1j * wc))), wc

def growth(K, delay=0.0, T=80.0, dt=1e-3):
    """simulate u = -K y with a dead time; ratio of late to early oscillation size"""
    x = np.array([0.1, 0, 0]); nd = int(round(delay / dt)); buf = [0.0] * (nd + 1); ys = []
    f = lambda x, u: A @ x + B * u
    for _ in range(int(T / dt)):
        buf.append(-K * (C @ x)); u = buf.pop(0)
        k1 = f(x, u); k2 = f(x + dt / 2 * k1, u); k3 = f(x + dt / 2 * k2, u); k4 = f(x + dt * k3, u)
        x = x + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4); ys.append(C @ x)
    ys = np.abs(np.array(ys)); n = len(ys)
    return ys[3 * n // 4:].max() / ys[n // 4:n // 2].max()

GM, w180, PM, wc = margins(L)
tau_max = np.radians(PM) / wc

def test_margins():
    print(f"GM = {GM:.4f} ({20 * np.log10(GM):.2f} dB) at {w180:.4f} rad/s; PM = {PM:.2f} deg at {wc:.4f} rad/s; delay margin {tau_max:.3f} s")
    assert abs(GM - 3) < 1e-6 and abs(w180 - np.sqrt(2)) < 1e-6 and abs(PM - 32.61) < 0.01

def test_unstable_at_predicted_gain():
    g_lo, g_hi = growth(0.97 * GM * K0), growth(1.03 * GM * K0)
    print(f"gain x{0.97 * GM:.2f}: oscillation ratio {g_lo:.2f}; gain x{1.03 * GM:.2f}: {g_hi:.2f}")
    assert g_lo < 1 < g_hi

def test_unstable_at_predicted_delay():
    g_lo, g_hi = growth(K0, delay=0.95 * tau_max), growth(K0, delay=1.05 * tau_max)
    print(f"delay {0.95 * tau_max:.3f} s: ratio {g_lo:.2f}; delay {1.05 * tau_max:.3f} s: ratio {g_hi:.2f}")
    assert g_lo < 1 < g_hi

test_margins()
test_unstable_at_predicted_gain()
test_unstable_at_predicted_delay()
print("PASS")
```
:::end

## Exercises

:::exercise
A loop has $PM = 50°$ at $\omega_c = 20$ rad/s. A filter adds 1 ms of delay and a 5 ms sample-and-hold adds roughly half a sample more. What phase margin remains?
:::solution
Total effective delay $1 + 2.5 = 3.5$ ms. Phase lost at 20 rad/s: $20 \times 0.0035 = 0.07$ rad, which is 4.0°. About 46° remains. Delay matters more as crossover rises: at 200 rad/s the same delay would cost 40°.
:::end

:::exercise
Why can a loop have a large gain margin and still be nearly unstable?
:::solution
Margins test only two points. A loop can pass close to $-1$ at some other frequency, between the crossovers, with both margins looking healthy. The peak sensitivity $M_s = \max|1/(1 + L)|$, the inverse of the closest distance to $-1$, catches that (lesson 16).
:::end

## Quiz

:::quiz
- type: num
  q: Gain margin of 2/(s(s + 1)(s + 2))?
  answer: 3
  tol: 0.001
  py: "6/2"
  explain: Routh limit 6 over the current gain 2.
- type: num
  q: That gain margin in dB?
  answer: 9.54
  tol: 0.002
  unit: dB
  py: "20*__import__('math').log10(3)"
  explain: 20 log₁₀ 3.
- type: num
  q: Delay margin in s with PM = 32.6° at 0.749 rad/s?
  answer: 0.760
  tol: 0.005
  unit: s
  py: "__import__('math').radians(32.6)/0.749"
  explain: PM in radians over ω_c.
- type: num
  q: Phase in degrees lost to a 3.5 ms delay at 20 rad/s?
  answer: 4.01
  tol: 0.01
  unit: °
  py: "__import__('math').degrees(20*0.0035)"
  explain: ωτ.
- type: mc
  q: A pure time delay changes…
  options:
    - phase only, by −ωτ
    - gain only
    - both gain and phase
    - nothing
  answer: 0
  explain: Its magnitude is 1 at all frequencies.
- type: mc
  q: At the gain limit the loop oscillates at…
  options:
    - the phase crossover frequency
    - the gain crossover frequency
    - DC
    - the highest plant pole
  answer: 0
  explain: Where the phase is −180°.
:::end
