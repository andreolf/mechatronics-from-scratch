---
id: p03-l02
minutes: 25
summary: Euler's formula ties exponentials to sines and cosines. You derive it from Taylor series, use it to turn trigonometry into algebra (amplitude-phase form, product-to-sum, triple-angle), and check the identities to 1e-12 across a sweep.
---

## Deriving Euler's formula

Take the Taylor series from Phase 02 lesson 2 and substitute $x = j\theta$ into $e^x = \sum x^n/n!$. Powers of $j$ cycle: $j^2 = -1$, $j^3 = -j$, $j^4 = 1$. Group the real and imaginary terms:

$$e^{j\theta} = \Big(1 - \frac{\theta^2}{2!} + \frac{\theta^4}{4!} - \dots\Big) + j\Big(\theta - \frac{\theta^3}{3!} + \frac{\theta^5}{5!} - \dots\Big) = \cos\theta + j\sin\theta.$$

The two brackets are exactly the series of cosine and sine. With $\theta = \omega t$, the point $e^{j\omega t}$ walks around the unit circle at $\omega$ rad/s. Its shadow on the real axis is $\cos\omega t$, and on the imaginary axis $\sin\omega t$. Add time as a third axis and you get a helix whose two side views are the cosine and the sine.

Adding $e^{j\theta}$ and $e^{-j\theta}$ cancels the imaginary parts:

$$\cos\theta = \frac{e^{j\theta} + e^{-j\theta}}{2}, \qquad \sin\theta = \frac{e^{j\theta} - e^{-j\theta}}{2j}.$$

A real sinusoid is two counter-rotating phasors. That's why a real signal's spectrum (lesson 10) is symmetric: every positive frequency has a mirror at the negative frequency.

## Trigonometry becomes algebra

**Amplitude-phase form.** $a\cos\omega t + b\sin\omega t = \operatorname{Re}\{(a - jb)e^{j\omega t}\}$, so it equals $R\cos(\omega t - \varphi)$ with $R = \sqrt{a^2 + b^2}$ and $\varphi = \operatorname{atan2}(b, a)$.

**Products to sums.** Multiplying two sinusoids gives sum and difference frequencies:

$$\cos\alpha\cos\beta = \tfrac12[\cos(\alpha - \beta) + \cos(\alpha + \beta)].$$

This is how a lock-in amplifier or a synchronous demodulator works: multiply the sensor signal by a reference at the same frequency, and the difference term lands at DC, where a low-pass filter picks it out.

**Multiple angles.** De Moivre's rule $(e^{j\theta})^n = e^{jn\theta}$ gives $\cos 3\theta = \operatorname{Re}\{(\cos\theta + j\sin\theta)^3\} = 4\cos^3\theta - 3\cos\theta$.

:::figure widget=phasor caption="One phasor alone is e^{jωt} scaled and rotated. Set amplitude 2 to zero: the time trace of phasor 1 is the shadow of a rotating arrow."
:::end

## Worked example

A vibration sensor reads $3\cos\omega t + 4\sin\omega t$ mm/s². Find its amplitude and phase.

1. $R = \sqrt{3^2 + 4^2} = 5$.
2. $\varphi = \operatorname{atan2}(4, 3) = 53.13°$.
3. So the signal is $5\cos(\omega t - 53.13°)$: it peaks 53.13° (0.927 rad) after a pure cosine would.

Then demodulate: multiplying by $2\cos\omega t$ gives $5\cos(53.13°) + 5\cos(2\omega t - 53.13°)$. The DC part is $3$, which recovers the in-phase coefficient $a$. Multiplying by $2\sin\omega t$ recovers $b = 4$.

## Code it from scratch

:::code file=euler.py
```python
import numpy as np

def cis(theta):
    """e^{j theta} from the two Taylor series, summed until the terms vanish."""
    theta = np.asarray(theta, float)
    c, s = np.zeros_like(theta), np.zeros_like(theta)
    term = np.ones_like(theta, dtype=complex)    # (j theta)^n / n!
    for n in range(60):
        if n % 2 == 0: c += term.real
        else:          s += term.imag
        term = term * 1j * theta / (n + 1)
    return c + 1j * s

if __name__ == "__main__":
    th = np.linspace(-np.pi, np.pi, 2001)
    z = cis(th)
    assert np.max(np.abs(z - np.exp(1j * th))) < 1e-12
    assert np.max(np.abs((z + z.conj()) / 2 - np.cos(th))) < 1e-12
    assert np.max(np.abs(np.cos(3 * th) - (4 * np.cos(th)**3 - 3 * np.cos(th)))) < 1e-12
    # amplitude-phase form of 3 cos wt + 4 sin wt
    a, b = 3.0, 4.0
    R, phi = np.hypot(a, b), np.arctan2(b, a)
    assert np.max(np.abs(a * np.cos(th) + b * np.sin(th) - R * np.cos(th - phi))) < 1e-12
    # demodulation: mean of signal * 2cos over whole periods recovers a
    t = np.linspace(0, 1, 10000, endpoint=False); w = 2 * np.pi * 5
    sig = a * np.cos(w * t) + b * np.sin(w * t)
    assert abs(np.mean(sig * 2 * np.cos(w * t)) - a) < 1e-9 and abs(np.mean(sig * 2 * np.sin(w * t)) - b) < 1e-9
    print("Euler identities hold to 1e-12;", f"R = {R}, phi = {np.degrees(phi):.2f} deg")
```
:::end

## Exercises

:::exercise
Use Euler's formula to show $\sin^2\theta = \tfrac12(1 - \cos 2\theta)$.
:::solution
$\sin^2\theta = \left(\frac{e^{j\theta} - e^{-j\theta}}{2j}\right)^2 = \frac{e^{2j\theta} - 2 + e^{-2j\theta}}{-4} = \frac{2 - 2\cos 2\theta}{4} = \tfrac12(1 - \cos 2\theta)$. The power of a sinusoid therefore oscillates at twice the frequency around a mean of ½, which is where the RMS factor $1/\sqrt 2$ comes from.
:::end

:::exercise
A 1 kHz reference is multiplied by a 1.05 kHz signal. Which frequencies appear in the product?
:::solution
50 Hz (the difference) and 2.05 kHz (the sum). A low-pass filter at, say, 200 Hz keeps only the 50 Hz beat: this is heterodyning, used in radios and in some encoder interpolators.
:::end

## Quiz

:::quiz
- type: num
  q: What is the amplitude $R$ of $3\cos\omega t + 4\sin\omega t$?
  answer: 5
  tol: 0.001
  py: "math.hypot(3,4)"
  explain: $R = \sqrt{a^2 + b^2}$.
- type: num
  q: What is the phase lag $\varphi$ of $3\cos\omega t + 4\sin\omega t$ in degrees?
  answer: 53.13
  tol: 0.001
  unit: °
  py: "math.degrees(math.atan2(4,3))"
  explain: $\varphi = \operatorname{atan2}(b, a)$.
- type: num
  q: Evaluate $\operatorname{Re}\{e^{j\pi/3}\}$.
  answer: 0.5
  tol: 0.001
  py: "math.cos(math.pi/3)"
  explain: $\operatorname{Re}\{e^{j\theta}\} = \cos\theta$.
- type: mc
  q: Multiplying signals at 1 kHz and 1.05 kHz produces…
  options:
    - only 1.025 kHz
    - 50 Hz and 2.05 kHz
    - 1 kHz and 1.05 kHz unchanged
    - a DC value only
  answer: 1
  explain: Product-to-sum gives the difference and sum frequencies.
- type: mc
  q: A real sinusoid $\cos\omega t$ is the sum of…
  options:
    - two phasors rotating in the same direction
    - two half-amplitude phasors rotating in opposite directions
    - a phasor and its derivative
    - one phasor at frequency 2ω
  answer: 1
  explain: $\cos\theta = (e^{j\theta} + e^{-j\theta})/2$.
- type: num
  q: Using $\cos 3\theta = 4\cos^3\theta - 3\cos\theta$, what is $\cos 3\theta$ when $\cos\theta = 0.8$?
  answer: -0.352
  tol: 0.001
  py: "4*0.8**3-3*0.8"
  explain: $4(0.512) - 2.4 = -0.352$.
:::end

:::verify
import math
assert abs(math.degrees(math.atan2(4,3))-53.13)<0.005 and abs(math.atan2(4,3)-0.927)<5e-4
assert abs(5*math.cos(math.atan2(4,3))-3)<1e-12
:::end
