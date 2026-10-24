---
id: p13-l12
minutes: 40
summary: Lead and lag compensators are a zero and a pole placed near each other, and the order of the pair decides their job, since lead adds phase around crossover to restore stability margin while lag raises low-frequency gain to cut steady error without touching crossover. You derive the lead's maximum phase and the design procedure, design a lead for a servo that needs a velocity constant of 10 and a 50 degree phase margin, and test both the margin and the preserved velocity constant.
---

## Lead

$$C_{lead}(s) = \frac{Ts + 1}{\alpha Ts + 1}, \qquad 0 < \alpha < 1.$$

The zero at $1/T$ comes before the pole at $1/(\alpha T)$, so the phase is positive between them. Its maximum is at the geometric mean $\omega_m = 1/(T\sqrt\alpha)$:

$$\sin\varphi_{max} = \frac{1 - \alpha}{1 + \alpha}, \qquad |C_{lead}(j\omega_m)| = \frac{1}{\sqrt\alpha}.$$

## Design procedure

1. Pick the gain $K$ to meet the steady-error spec (lesson 04).
2. Find the phase margin of $KG$; the lead must add $\varphi_{max} = PM_{spec} - PM_{now} + $ a few degrees (the crossover will move right, where the plant has less phase).
3. Compute $\alpha$ from $\varphi_{max}$.
4. Place $\omega_m$ at the new crossover: where $|KG(j\omega)| = \sqrt\alpha$, because the lead adds $1/\sqrt\alpha$ there.
5. $T = 1/(\omega_m\sqrt\alpha)$. Check the margin; iterate if short.

## Lag

$$C_{lag}(s) = \beta\frac{Ts + 1}{\beta Ts + 1}, \qquad \beta > 1.$$

DC gain $\beta$, high-frequency gain 1. Put the corner $1/T$ about a decade below crossover: low-frequency gain (and the error constants) rises by $\beta$ while crossover and its phase barely move. The cost is a slow "tail" in the step response as the lag's slow pole settles.

:::figure widget=leadbode caption="Bode magnitude and phase of the servo with and without a lead compensator, plus the step response. Slide the zero and the pole: the phase bump is largest at their geometric mean, and the margin peaks when that sits at crossover."
:::end

## Worked example

Servo $G(s) = \dfrac{1}{s(s + 1)}$, spec $K_v = 10$ s⁻¹ and $PM \ge 50°$.

1. $K = 10$. Crossover of $10/(s(s + 1))$ is at 3.08 rad/s, where $PM = 18°$.
2. Need $50 - 18 + 10 = 42°$, so $\alpha = (1 - \sin 42°)/(1 + \sin 42°) = 0.198$.
3. $|KG| = \sqrt{0.198} = 0.445$ at $\omega_m = 4.69$ rad/s.
4. $T = 1/(4.69 \times 0.445) = 0.479$ s: zero at 2.09 rad/s, pole at 10.5 rad/s.
5. Result: $PM = 54°$ at 4.69 rad/s, and $K_v$ is still 10 because the lead's DC gain is 1.

## Code it from scratch

:::code file=lead.py
```python
import numpy as np
from scipy import signal

w = np.logspace(-3, 3, 400001)

def margins(L):
    """gain crossover frequency and phase margin of a loop given as a function of s"""
    resp = L(1j * w)
    mag, ph = np.abs(resp), np.unwrap(np.angle(resp))
    i = np.where((mag[:-1] >= 1) & (mag[1:] < 1))[0][0]
    return w[i], 180 + np.degrees(ph[i])

G = lambda s: 1 / (s * (s + 1))
K = 10.0

def design_lead(G, K, pm_spec, extra=10.0):
    _, pm0 = margins(lambda s: K * G(s))
    phi = np.radians(pm_spec - pm0 + extra)
    alpha = (1 - np.sin(phi)) / (1 + np.sin(phi))
    mag = np.abs(K * G(1j * w))
    wm = w[np.argmin(np.abs(mag - np.sqrt(alpha)))]
    T = 1 / (wm * np.sqrt(alpha))
    return alpha, T, pm0

alpha, T, pm0 = design_lead(G, K, 50)
C = lambda s: (T * s + 1) / (alpha * T * s + 1)

def test_uncompensated():
    wc, pm = margins(lambda s: K * G(s))
    print(f"K G alone: crossover {wc:.2f} rad/s, PM {pm:.1f} deg")
    assert abs(pm - 17.96) < 0.05

def test_lead_meets_spec():
    wc, pm = margins(lambda s: K * C(s) * G(s))
    print(f"lead alpha = {alpha:.3f}, zero {1 / T:.2f}, pole {1 / (alpha * T):.2f} rad/s -> PM {pm:.1f} deg at {wc:.2f} rad/s")
    assert pm >= 50
    # cross-check the phase at crossover with scipy.signal.bode
    sys = signal.lti(K * np.array([T, 1]), np.polymul([alpha * T, 1], [1, 1, 0]))
    _, mag, ph = signal.bode(sys, w=[wc])
    assert abs(mag[0]) < 0.01 and abs(180 + ph[0] - pm) < 0.05
    # Kv unchanged: lim s * K C G = K
    s = 1e-7; assert abs(s * K * C(s) * G(s) - K) < 1e-5

def test_max_phase_formula():
    for a in (0.05, 0.2, 0.5):
        Tt = 1.0
        ph = np.degrees(np.angle((Tt * 1j * w + 1) / (a * Tt * 1j * w + 1)))
        i = np.argmax(ph)
        assert abs(w[i] - 1 / (Tt * np.sqrt(a))) / w[i] < 1e-3
        assert abs(np.sin(np.radians(ph[i])) - (1 - a) / (1 + a)) < 1e-6

def test_step_overshoot_reduced():
    t = np.linspace(0, 10, 20001)
    def overshoot(num, den):
        _, y = signal.step(signal.lti(num, np.polyadd(den, num)), T=t)
        return y.max() - 1
    os0 = overshoot([K], [1, 1, 0])
    os1 = overshoot(K * np.array([T, 1]), np.polymul([alpha * T, 1], [1, 1, 0]))
    print(f"step overshoot: {os0:.0%} without lead, {os1:.0%} with")
    assert os1 < os0 / 2

def test_lag_raises_kv_keeps_margin():
    _, pm1 = margins(G)                                      # K = 1
    beta, Tl = 10.0, 10.0
    Lag = lambda s: beta * (Tl * s + 1) / (beta * Tl * s + 1)
    _, pm2 = margins(lambda s: Lag(s) * G(s))
    print(f"lag: Kv 1 -> 10, PM {pm1:.1f} -> {pm2:.1f} deg")
    assert pm1 - pm2 < 8 and pm2 > 40

test_uncompensated()
test_lead_meets_spec()
test_max_phase_formula()
test_step_overshoot_reduced()
test_lag_raises_kv_keeps_margin()
print("PASS")
```
:::end

## Exercises

:::exercise
Why add an extra 5° to 10° when sizing the lead?
:::solution
The lead's gain of $1/\sqrt\alpha$ at $\omega_m$ pushes crossover to a higher frequency, where the plant's own phase is lower. The extra degrees pay for that loss; without them the design falls a few degrees short and has to be iterated.
:::end

:::exercise
Why not get all the phase from one lead with $\alpha = 0.01$?
:::solution
It would add up to 78°, but its high-frequency gain is $1/\alpha = 100$, amplifying sensor noise a hundredfold and pushing the actuator hard. Beyond about 60° per stage, designers use two leads in series or rethink the loop.
:::end

## Quiz

:::quiz
- type: num
  q: α for a lead that adds 42° at most?
  answer: 0.198
  tol: 0.005
  py: "(1-__import__('math').sin(__import__('math').radians(42)))/(1+__import__('math').sin(__import__('math').radians(42)))"
  explain: (1 − sin φ)/(1 + sin φ).
- type: num
  q: Maximum phase in degrees of a lead with α = 0.1?
  answer: 54.9
  tol: 0.005
  unit: °
  py: "__import__('math').degrees(__import__('math').asin(0.9/1.1))"
  explain: arcsin((1 − α)/(1 + α)).
- type: num
  q: Lead gain in dB at ω_m for α = 0.198?
  answer: 7.03
  tol: 0.01
  unit: dB
  py: "-10*__import__('math').log10(0.198)"
  explain: 1/√α.
- type: num
  q: Phase margin in degrees of 10/(s(s + 1)) without compensation?
  answer: 17.96
  tol: 0.005
  unit: °
  py: "17.96"
  explain: Crossover at 3.08 rad/s.
- type: mc
  q: A lag compensator mainly…
  options:
    - raises low-frequency gain without moving crossover much
    - adds phase at crossover
    - removes the integrator
    - speeds up the response
  answer: 0
  explain: Its corner sits a decade below crossover.
- type: mc
  q: Where should a lead's maximum phase be placed?
  options:
    - at the new gain crossover frequency
    - at DC
    - at the plant pole
    - far above crossover
  answer: 0
  explain: That is where phase margin is measured.
:::end
