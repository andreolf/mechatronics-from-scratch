---
id: p03-l13
minutes: 35
summary: The z-transform is the Laplace transform of sampled signals, and the language of every digital filter and controller. You derive H(z) from a difference equation, map the s-plane to the z-plane with z = e^{sT}, check stability against the unit circle, and implement lfilter yourself.
---

## From difference equations to H(z)

A digital filter computes each output from current and past inputs and past outputs:

$$y[n] = b_0u[n] + b_1u[n-1] + \dots - a_1y[n-1] - a_2y[n-2] - \dots$$

Define the z-transform $X(z) = \sum_{n\ge0}x[n]z^{-n}$. A one-sample delay multiplies by $z^{-1}$, since $\sum x[n-1]z^{-n} = z^{-1}X(z)$ for a signal that starts at zero. Transform the difference equation:

$$H(z) = \frac{Y(z)}{U(z)} = \frac{b_0 + b_1z^{-1} + b_2z^{-2} + \dots}{1 + a_1z^{-1} + a_2z^{-2} + \dots}.$$

The coefficient lists are exactly what `scipy.signal.lfilter(b, a, u)` and every DSP library expect.

## The s-plane maps to the z-plane

Sample $e^{pt}$ every $T$ seconds: $x[n] = (e^{pT})^n$. Its z-transform is $\frac{1}{1 - e^{pT}z^{-1}}$, a pole at

$$z = e^{pT}.$$

So a continuous pole at $s$ becomes a discrete pole at $e^{sT}$:

- The left half-plane ($\operatorname{Re}s < 0$) maps inside the unit circle, $|z| < 1$. **Stable means every pole inside the unit circle.**
- The imaginary axis maps onto the circle itself, and $s = 0$ maps to $z = 1$.
- Fast poles far to the left map close to $z = 0$; oscillation at $\omega_d$ becomes a pole angle of $\omega_dT$ radians.

The radius $r$ of a pole is the per-sample decay factor and its angle $\theta$ is the phase advance per sample, so the impulse response behaves like $r^n\cos(n\theta)$.

:::figure widget=zplane caption="A pole pair in the z-plane and its impulse response. Push the radius past 1 and the response grows; the angle sets how many samples per oscillation."
:::end

## Worked example

A first-order low-pass with $\tau = 10$ ms, run at $T = 1$ ms:

1. Continuous pole $s = -1/\tau = -100$ s⁻¹ maps to $z = e^{-100\times0.001} = e^{-0.1} = 0.904837$.
2. Difference equation with unit DC gain: $y[n] = 0.904837\,y[n-1] + 0.095163\,u[n]$. Check: $H(1) = 0.095163/(1 - 0.904837) = 1$.
3. Step response: $y[n] = 1 - 0.904837^{\,n+1}$. After 10 samples, 10 ms or one time constant, the classic $1 - e^{-1} = 0.632$ shows up as $1 - 0.904837^{10}$ (for the sample one step earlier).
4. Stability: the pole at 0.905 is inside the unit circle. Write $y[n] = 1.1\,y[n-1] + \dots$ by mistake and it grows by 10 % per sample.

That two-line filter, often written as `y += alpha * (u - y)` with $\alpha = 0.095$, is the most common piece of DSP in embedded code.

## Code it from scratch

:::code file=lfilter.py
```python
import numpy as np
from scipy import signal

def lfilter(b, a, u):
    """Direct form I difference equation; a[0] normalises the coefficients."""
    b, a = np.asarray(b, float) / a[0], np.asarray(a, float) / a[0]
    y = np.zeros(len(u))
    for n in range(len(u)):
        acc = sum(b[k] * u[n - k] for k in range(len(b)) if n - k >= 0)
        acc -= sum(a[k] * y[n - k] for k in range(1, len(a)) if n - k >= 0)
        y[n] = acc
    return y

def stable(a):
    return bool(np.all(np.abs(np.roots(a)) < 1))

if __name__ == "__main__":
    rng = np.random.default_rng(3)
    u = rng.standard_normal(500)
    for b, a in (([0.095163], [1, -0.904837]),
                 ([0.2, 0.3, 0.1], [1, -0.5, 0.25]),
                 ([1, -2, 1], [2.0, -1.2, 0.5])):
        assert np.max(np.abs(lfilter(b, a, u) - signal.lfilter(b, a, u))) < 1e-12
    p = np.exp(-100 * 1e-3)
    step = lfilter([1 - p], [1, -p], np.ones(50))
    assert np.allclose(step, 1 - p ** (np.arange(50) + 1))
    assert abs(step[9] - (1 - np.exp(-1))) < 1e-12        # 10 samples = one time constant
    assert stable([1, -0.904837]) and not stable([1, -1.1])
    r, th = 0.9, np.radians(30)                            # pole pair from the widget
    assert stable([1, -2 * r * np.cos(th), r * r])
    print(f"pole z = {p:.6f}; y after 10 samples = {step[9]:.4f}")
```
:::end

## Exercises

:::exercise
A continuous system has poles at $-5 \pm 20j$ s⁻¹. Where are the discrete poles at $T = 10$ ms?
:::solution
$z = e^{(-5 \pm 20j)0.01} = e^{-0.05}e^{\pm0.2j} = 0.951\angle{\pm11.5°}$. The response decays by 4.9 % per sample and completes an oscillation every $360/11.46 = 31.4$ samples, matching $2\pi/20 = 0.314$ s.
:::end

:::exercise
Write $H(z)$ for a 4-sample moving average and find its poles and zeros.
:::solution
$H(z) = \frac14(1 + z^{-1} + z^{-2} + z^{-3}) = \frac{z^3 + z^2 + z + 1}{4z^3}$. All three poles are at $z = 0$, so it's always stable (an FIR filter). The zeros are at $-1$ and $\pm j$, which kill frequencies of $f_s/2$ and $f_s/4$ completely.
:::end

## Quiz

:::quiz
- type: num
  q: Where does the continuous pole $s = -100$ s⁻¹ map in the z-plane at $T = 1$ ms?
  answer: 0.904837
  tol: 0.0001
  py: "math.exp(-0.1)"
  explain: $z = e^{sT} = e^{-0.1}$.
- type: mc
  q: A discrete-time system is stable when all poles…
  options:
    - have negative real part
    - lie inside the unit circle
    - lie on the unit circle
    - are real
  answer: 1
  explain: $|z| < 1$ is the image of the left half-plane under $z = e^{sT}$.
- type: num
  q: What is the input gain $b_0$ that gives unit DC gain for $y[n] = 0.9y[n-1] + b_0u[n]$?
  answer: 0.1
  tol: 0.001
  py: "1-0.9"
  explain: $H(1) = b_0/(1 - 0.9) = 1$.
- type: num
  q: What is the magnitude of the discrete pole for $s = -5 + 20j$ at $T = 10$ ms?
  answer: 0.95123
  tol: 0.001
  py: "math.exp(-0.05)"
  explain: $|e^{sT}| = e^{\operatorname{Re}(s)T}$.
- type: mc
  q: In $H(z)$, a factor $z^{-1}$ means…
  options:
    - differentiation
    - a one-sample delay
    - integration
    - a pole at infinity
  answer: 1
  explain: $\mathcal Z\{x[n-1]\} = z^{-1}X(z)$.
- type: num
  q: A pole pair at angle 30° oscillates every how many samples?
  answer: 12
  tol: 0.001
  py: "360/30"
  explain: $360°/30°$ per sample.
:::end

:::verify
import cmath, math
z = cmath.exp((-5+20j)*0.01); assert abs(abs(z)-0.951)<5e-4 and abs(math.degrees(cmath.phase(z))-11.46)<0.01
assert abs(360/11.459-31.4)<0.05 and abs(1-math.exp(-0.1)-0.095163)<1e-6
:::end
