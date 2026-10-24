---
id: p03-l09
minutes: 30
summary: Any periodic signal is a sum of sinusoids at multiples of its fundamental frequency. You derive the Fourier coefficients from orthogonality, compute the square-wave and PWM spectra, meet the Gibbs overshoot, and reconstruct a PWM wave from N harmonics.
---

## Orthogonality does all the work

A signal with period $T$ (fundamental $\omega_0 = 2\pi/T$) can be written

$$x(t) = a_0 + \sum_{k=1}^{\infty}\big(a_k\cos k\omega_0 t + b_k\sin k\omega_0 t\big).$$

To find $a_k$, multiply both sides by $\cos k\omega_0 t$ and integrate over one period. Over a full period,

$$\int_0^T \cos m\omega_0 t\,\cos k\omega_0 t\,dt = \begin{cases} T/2 & m = k \ne 0\\ 0 & m \ne k\end{cases}, \qquad \int_0^T \sin m\omega_0 t\,\cos k\omega_0 t\,dt = 0.$$

The product-to-sum identity from lesson 2 shows why: the product is two cosines at $(m \pm k)\omega_0$, and a full number of cycles integrates to zero. Every term except the one you want disappears:

$$a_0 = \frac1T\int_0^T x\,dt, \qquad a_k = \frac2T\int_0^T x\cos k\omega_0 t\,dt, \qquad b_k = \frac2T\int_0^T x\sin k\omega_0 t\,dt.$$

The sinusoids behave like perpendicular axes, and each coefficient is a projection onto one axis: the same idea as the dot product in Phase 01.

## The square wave and PWM

A ±1 square wave that is +1 for the first half period is odd, so all $a_k$ vanish, and

$$b_k = \frac{2}{T}\cdot 2\int_0^{T/2}\sin k\omega_0 t\,dt = \frac{2}{k\pi}(1 - \cos k\pi) = \begin{cases}\dfrac{4}{k\pi} & k \text{ odd}\\ 0 & k \text{ even}\end{cases}$$

Harmonics fall off as $1/k$: slowly, because the wave has jumps.

A PWM signal switching between 0 and $V$ with duty cycle $d$ has mean $dV$, and harmonic $k$ has amplitude

$$c_k = \frac{2V}{k\pi}\,|\sin(k\pi d)|.$$

That's what a motor driver feeds the winding: a DC value that sets the average torque plus harmonics at the switching frequency and its multiples. The winding inductance filters the harmonics, which is why PWM works at all (Phase 09).

**Gibbs phenomenon.** Truncating the series at $N$ terms leaves an overshoot next to each jump. It doesn't shrink as $N$ grows; it only gets narrower, and tends to about 8.95 % of the jump. For a ±1 square wave the partial sums peak near 1.179.

:::figure widget=fourier caption="A PWM wave rebuilt from N harmonics. Raise N: the ripple narrows but the overshoot at each edge stays near 9 % of the step."
:::end

## Worked example

A 12 V motor driver switches at 20 kHz with 25 % duty.

1. DC component: $0.25 \times 12 = 3$ V. That's what the motor's average current responds to.
2. Fundamental (20 kHz): $c_1 = \frac{2\cdot12}{\pi}\sin(\pi/4) = 5.40$ V amplitude.
3. Second harmonic (40 kHz): $c_2 = \frac{24}{2\pi}|\sin(\pi/2)| = 3.82$ V.
4. Fourth harmonic: $\sin(\pi) = 0$, so it vanishes. At 25 % duty, every multiple of 4 is missing.
5. With 1 mH of winding inductance the 20 kHz ripple current is about $5.40/(2\pi\cdot20000\cdot0.001) = 43$ mA amplitude, small next to an amp of DC.

## Code it from scratch

:::code file=fourier_series.py
```python
import numpy as np

def coefficients(x, T, K, n=200_000):
    """a0, a_k, b_k (k = 1..K) by numerical projection over one period."""
    t = np.arange(n) * T / n                     # periodic rectangle rule is spectrally accurate
    w0 = 2 * np.pi / T
    xs = x(t)
    a0 = xs.mean()
    a = np.array([2 * np.mean(xs * np.cos(k * w0 * t)) for k in range(1, K + 1)])
    b = np.array([2 * np.mean(xs * np.sin(k * w0 * t)) for k in range(1, K + 1)])
    return a0, a, b

def synth(a0, a, b, t, T):
    w0 = 2 * np.pi / T
    return a0 + sum(a[k - 1] * np.cos(k * w0 * t) + b[k - 1] * np.sin(k * w0 * t) for k in range(1, len(a) + 1))

if __name__ == "__main__":
    T = 1.0
    square = lambda t: np.where((t % T) < T / 2, 1.0, -1.0)
    a0, a, b = coefficients(square, T, 15)
    k = np.arange(1, 16)
    assert np.allclose(b, np.where(k % 2, 4 / (k * np.pi), 0), atol=1e-4)
    assert np.max(np.abs(a)) < 1e-4 and abs(a0) < 1e-4
    # PWM 0..12 V, 25 % duty: amplitudes 2V/(k pi)|sin(k pi d)|
    pwm = lambda t: np.where((t % T) < 0.25 * T, 12.0, 0.0)
    a0, a, b = coefficients(pwm, T, 8)
    c = np.hypot(a, b)
    kk = np.arange(1, 9)
    assert abs(a0 - 3) < 1e-3 and np.allclose(c, 24 / (kk * np.pi) * np.abs(np.sin(kk * np.pi / 4)), atol=1e-3)
    # Gibbs: the overshoot stays near 9 % of the jump as N grows
    t = np.linspace(0, 0.05, 200_001)
    for N, peak in ((99, 1.17901), (999, 1.17898)):
        kk = np.arange(1, N + 1, 2)
        s = (4 / (np.pi * kk)[:, None] * np.sin(2 * np.pi * kk[:, None] * t)).sum(0)
        assert abs(s.max() - peak) < 2e-4, (N, s.max())
    print("square-wave and PWM coefficients match theory; Gibbs peak ~1.179")
```
:::end

## Exercises

:::exercise
What duty cycle removes the third harmonic of a PWM signal entirely?
:::solution
$\sin(3\pi d) = 0$ requires $3d$ to be an integer, so $d = 1/3$ or $2/3$. Some inverters use this trick (or its multi-level relatives) to suppress specific harmonics.
:::end

:::exercise
A triangle wave is the integral of a square wave. How fast do its harmonics fall off, and why?
:::solution
Integrating $\sin k\omega_0 t$ divides by $k\omega_0$, so the coefficients fall as $1/k^2$. Smoother signals (no jumps, only kinks) have faster-decaying spectra; a signal with continuous derivatives up to order $m$ decays at least as $1/k^{m+2}$.
:::end

## Quiz

:::quiz
- type: num
  q: What is the coefficient $b_3$ of a ±1 square wave?
  answer: 0.42441
  tol: 0.001
  py: "4/(3*math.pi)"
  explain: $b_k = 4/(k\pi)$ for odd $k$.
- type: num
  q: 12 V PWM at 25 % duty. What is the amplitude of its fundamental in volts?
  answer: 5.4019
  tol: 0.001
  unit: V
  py: "24/math.pi*math.sin(math.pi/4)"
  explain: $c_1 = \frac{2V}{\pi}\sin(\pi d)$.
- type: num
  q: What is the DC component of that PWM signal in volts?
  answer: 3
  tol: 0.001
  unit: V
  py: "0.25*12"
  explain: $a_0 = dV$.
- type: mc
  q: As you add more harmonics, the Gibbs overshoot…
  options:
    - shrinks to zero
    - stays about 9 % of the jump but gets narrower
    - grows without bound
    - moves to the middle of the period
  answer: 1
  explain: The overshoot height converges to about 8.95 % of the jump; only its width shrinks.
- type: mc
  q: Why do the even harmonics of a 50 % duty square wave vanish?
  options:
    - Because of the DC offset
    - Because of half-wave symmetry, $x(t + T/2) = -x(t)$
    - Because the wave is even
    - Rounding error
  answer: 1
  explain: Half-wave symmetry cancels every even harmonic.
- type: num
  q: Which harmonic number is the first to vanish for PWM at 25 % duty?
  answer: 4
  tol: 0.001
  py: "4"
  explain: $\sin(4\pi\cdot0.25) = \sin\pi = 0$.
:::end

:::verify
import math
assert abs(24/(2*math.pi)-3.82)<0.005 and abs(5.40/(2*math.pi*20000*0.001)-0.043)<0.0005
:::end
