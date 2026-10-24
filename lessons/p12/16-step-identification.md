---
id: p12-l16
minutes: 35
summary: When you cannot derive a model's parameters you measure them, and the simplest experiment is a step, which a first- or second-order model fits from a few features of the response. You derive the hand formulas for gain and time constant, and for damping and natural frequency from overshoot and peak time, then fit the whole record with least squares, and test on noisy simulated logs that the identified parameters are within 5 percent of the truth.
---

## First order from a step

A DC motor's speed response to a voltage step is nearly first order, $G(s) = K/(\tau s + 1)$, and its step response is $y(t) = KU(1 - e^{-t/\tau})$. Two features give the parameters:

- **Gain**: $K = y_\infty/U$, from the average of the settled tail.
- **Time constant**: $y(\tau) = 0.632\,y_\infty$, so $\tau$ is the time to reach 63.2 %.

A single crossing is sensitive to noise. Interpolate the crossing on a lightly smoothed signal, or better, fit all the data.

## Second order from overshoot and peak time

For $G(s) = K\omega_n^2/(s^2 + 2\zeta\omega_n s + \omega_n^2)$ with $\zeta < 1$, the step overshoots by $M_p = e^{-\pi\zeta/\sqrt{1 - \zeta^2}}$ at $t_p = \pi/(\omega_n\sqrt{1 - \zeta^2})$. Inverting:

$$\zeta = \frac{-\ln M_p}{\sqrt{\pi^2 + \ln^2 M_p}}, \qquad \omega_n = \frac{\pi}{t_p\sqrt{1 - \zeta^2}}.$$

## Least squares

Hand formulas use three numbers from a thousand-sample record. Fitting minimises $\sum_k (y_k - \hat y(t_k; \theta))^2$ over all of it, with the hand values as the starting point. With white noise this is the maximum-likelihood estimate, and its error shrinks as $1/\sqrt N$.

:::figure widget=stepfit caption="A noisy step log with the fitted model laid over it. Raise the noise to see the 63 % crossing wander while the least-squares fit stays put."
:::end

## Worked example

A log with $U = 1$ V, a settled speed of 20 rad/s and a 63.2 % crossing at 0.12 s gives $K = 20$ (rad/s)/V and $\tau = 0.12$ s. For a second-order log with 37.2 % overshoot at 0.132 s:

1. $\ln M_p = -0.989$, so $\zeta = 0.989/\sqrt{9.870 + 0.978} = 0.300$.
2. $\omega_n = \pi/(0.132 \times 0.954) = 24.9$ rad/s.

## Code it from scratch

:::code file=stepid.py
```python
import numpy as np
from scipy.optimize import least_squares
from scipy import signal

t = np.arange(0, 1.0, 1e-3)

def first_order(t, K, tau, U=1.0):
    return K * U * (1 - np.exp(-t / tau))

def second_order(t, K, zeta, wn):
    return signal.step(signal.lti([K * wn ** 2], [1, 2 * zeta * wn, wn ** 2]), T=t)[1]

def smooth(y, n=15):
    return np.convolve(y, np.ones(n) / n, mode="same")

def hand_first(t, y, U=1.0):
    yinf = y[-200:].mean()
    ys = smooth(y); k = np.argmax(ys > 0.632 * yinf)
    tc = t[k - 1] + (0.632 * yinf - ys[k - 1]) / (ys[k] - ys[k - 1]) * (t[k] - t[k - 1])
    return yinf / U, tc

def hand_second(t, y):
    yinf = y[-200:].mean()
    ys = smooth(y, 9); k = np.argmax(ys)
    a, b, _ = np.polyfit(t[k - 8:k + 9], ys[k - 8:k + 9], 2)   # parabola through the peak
    tp = -b / (2 * a); Mp = (np.polyval([a, b, _], tp) - yinf) / yinf
    zeta = -np.log(Mp) / np.sqrt(np.pi ** 2 + np.log(Mp) ** 2)
    return yinf, zeta, np.pi / (tp * np.sqrt(1 - zeta ** 2))

def fit(model, t, y, p0):
    return least_squares(lambda p: model(t, *p) - y, p0).x

def test_first_order():
    K, tau = 20.0, 0.12
    worst_hand = worst_fit = 0
    for seed in range(20):
        y = first_order(t, K, tau) + np.random.default_rng(seed).normal(0, 0.2, t.size)
        Kh, th = hand_first(t, y)
        Kf, tf = fit(first_order, t, y, [Kh, th])
        worst_hand = max(worst_hand, abs(Kh / K - 1), abs(th / tau - 1))
        worst_fit = max(worst_fit, abs(Kf / K - 1), abs(tf / tau - 1))
    print(f"first order, 20 noisy logs: worst hand error {worst_hand * 100:.2f} %, worst fit error {worst_fit * 100:.2f} %")
    assert worst_hand < 0.05 and worst_fit < 0.01

def test_second_order():
    K, zeta, wn = 1.0, 0.3, 25.0
    y0 = second_order(t, K, zeta, wn)
    Mp = (y0.max() - 1); tp = t[np.argmax(y0)]
    assert abs(Mp - np.exp(-np.pi * zeta / np.sqrt(1 - zeta ** 2))) < 2e-3
    worst_hand = worst_fit = 0
    for seed in range(20):
        y = y0 + np.random.default_rng(100 + seed).normal(0, 0.01, t.size)
        h = hand_second(t, y)
        f = fit(second_order, t, y, h)
        worst_hand = max(worst_hand, *(abs(a / b - 1) for a, b in zip(h, (K, zeta, wn))))
        worst_fit = max(worst_fit, *(abs(a / b - 1) for a, b in zip(f, (K, zeta, wn))))
    print(f"second order, 20 noisy logs: worst hand error {worst_hand * 100:.2f} %, worst fit error {worst_fit * 100:.2f} %")
    assert worst_hand < 0.05 and worst_fit < 0.01

def test_wrong_model_shows_in_residuals():
    # a first-order fit to second-order data leaves structured residuals, the cue to add an order
    y = second_order(t, 1.0, 0.3, 25.0) + np.random.default_rng(9).normal(0, 0.01, t.size)
    p = fit(first_order, t, y, [1.0, 0.05])
    r = y - first_order(t, *p)
    assert np.std(r) > 5 * 0.01

test_first_order()
test_second_order()
test_wrong_model_shows_in_residuals()
print("PASS")
```
:::end

## Exercises

:::exercise
A step log shows 10 % overshoot at 0.2 s. Find $\zeta$ and $\omega_n$.
:::solution
$\ln 0.1 = -2.303$, so $\zeta = 2.303/\sqrt{9.870 + 5.302} = 0.591$, and $\omega_n = \pi/(0.2\sqrt{1 - 0.349}) = 19.5$ rad/s.
:::end

:::exercise
Why is it worth applying the step from a steady operating point rather than from rest for a motor with friction?
:::solution
Static friction and backlash make the first part of a step from rest nonlinear: nothing moves until the torque overcomes stiction. Stepping from one running speed to another keeps the motor in the region where the linear model is valid, as lesson 10 showed.
:::end

## Quiz

:::quiz
- type: num
  q: Fraction of the final value a first-order step reaches after one time constant?
  answer: 0.632
  tol: 0.001
  py: "1-__import__('math').exp(-1)"
  explain: 1 − e⁻¹.
- type: num
  q: Damping ratio for 37.2 % overshoot?
  answer: 0.300
  tol: 0.01
  py: "-__import__('math').log(0.372)/(__import__('math').pi**2+__import__('math').log(0.372)**2)**0.5"
  explain: The inversion formula.
- type: num
  q: Damping ratio for 10 % overshoot?
  answer: 0.591
  tol: 0.005
  py: "-__import__('math').log(0.1)/(__import__('math').pi**2+__import__('math').log(0.1)**2)**0.5"
  explain: Same formula.
- type: num
  q: Time in s for a 20 rad/s, τ = 0.12 s motor to reach 95 % of final speed?
  answer: 0.3595
  tol: 0.005
  unit: s
  py: "0.12*__import__('math').log(20)"
  explain: 3τ (exactly τ ln 20).
- type: mc
  q: Why fit the whole record instead of using the 63 % point?
  options:
    - it uses every sample, so noise averages out
    - it's always unbiased for any model
    - it doesn't need a model
    - it's faster
  answer: 0
  explain: Error shrinks as 1/√N.
- type: mc
  q: A first-order fit to an oscillating response leaves…
  options:
    - structured residuals that reveal a missing order
    - white residuals
    - zero residuals
    - negative gain
  answer: 0
  explain: Residuals carry the oscillation.
:::end
