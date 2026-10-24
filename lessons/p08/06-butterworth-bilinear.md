---
id: p08-l06
minutes: 40
summary: Classic IIR filters are designed as analogue prototypes and then mapped to z. You build a Butterworth filter from scratch, from its poles on a circle through prewarping and the bilinear transform to digital coefficients, and match scipy.signal.butter to machine precision.
---

## The analogue prototype

A Butterworth low-pass of order $n$ is *maximally flat*: $|H(j\Omega)|^2 = 1/(1 + (\Omega/\Omega_c)^{2n})$, with no ripple anywhere. Its poles sit evenly on a semicircle of radius $\Omega_c$ in the left half-plane:

$$p_k = \Omega_c\,e^{j\pi(2k + n - 1)/(2n)},\qquad k = 1\dots n.$$

## The bilinear transform

Map the $s$-plane to the $z$-plane with the trapezoidal rule (Phase 02):

$$s = 2f_s\,\frac{z - 1}{z + 1}\quad\Longleftrightarrow\quad z = \frac{1 + s/(2f_s)}{1 - s/(2f_s)}.$$

It maps the whole left half-plane inside the unit circle, so a stable analogue filter stays stable, and it maps the entire $j\Omega$ axis onto the unit circle exactly once, so there's no aliasing. But the frequency axis is **warped**:

$$\Omega = 2f_s\tan(\pi f/f_s).$$

Analogue infinity lands at Nyquist. To make the digital cutoff land at $f_c$, **prewarp**: design the analogue prototype at $\Omega_c = 2f_s\tan(\pi f_c/f_s)$.

## The recipe

1. Prewarp $f_c$ to $\Omega_c$.
2. Place the $n$ analogue poles on the circle.
3. Map each pole with $z = (1 + p/2f_s)/(1 - p/2f_s)$. The $n$ zeros at $s = \infty$ map to $z = -1$.
4. Multiply out (or pair into biquads, lesson 5) and scale for unit gain at DC ($z = 1$).

:::figure widget=bilinear caption="An analogue Butterworth (dashed) and its bilinear-transform digital version (lime). Raise the cutoff toward Nyquist and turn prewarping off to see the cutoff slide."
:::end

## Worked example

A 2nd-order Butterworth at $f_c = 100$ Hz with $f_s = 1$ kHz.

1. $\Omega_c = 2000\tan(0.1\pi) = 649.8$ rad/s, against $2\pi\times100 = 628.3$ without prewarping.
2. Poles at $\Omega_c e^{\pm j3\pi/4} = -459.5 \pm 459.5j$.
3. Mapped: $z = 0.5715 \pm 0.2936j$, at radius 0.6425.
4. Coefficients: $a = [1, -1.1430, 0.4128]$ and $b = [0.0675, 0.1349, 0.0675]$, the same as `scipy.signal.butter(2, 0.2)`.

## Code it from scratch

:::code file=butterworth.py
```python
import numpy as np
from scipy import signal

def butter_lowpass(n, fc, fs, prewarp=True):
    wc = 2 * fs * np.tan(np.pi * fc / fs) if prewarp else 2 * np.pi * fc
    k = np.arange(1, n + 1)
    p = wc * np.exp(1j * np.pi * (2 * k + n - 1) / (2 * n))          # analogue poles
    z_poles = (1 + p / (2 * fs)) / (1 - p / (2 * fs))                  # bilinear map
    a = np.real(np.poly(z_poles))
    b = np.real(np.poly(-np.ones(n)))                                   # zeros at z = -1
    b *= a.sum() / b.sum()                                              # unit DC gain
    return b, a

def minus3db(b, a, fs):
    w, H = signal.freqz(b, a, worN=200_000, fs=fs)
    return w[np.argmax(np.abs(H) < 2**-0.5)]

if __name__ == "__main__":
    for n in range(1, 9):
        for fc in (10, 100, 300, 450):
            b, a = butter_lowpass(n, fc, 1000)
            bs, as_ = signal.butter(n, fc, fs=1000)
            assert np.allclose(b, bs, rtol=1e-9, atol=1e-14) and np.allclose(a, as_, rtol=1e-9, atol=1e-12), (n, fc)
    b, a = butter_lowpass(2, 100, 1000)
    print("2nd order at 100 Hz:", b.round(4), a.round(4))
    assert np.allclose(a, [1, -1.1430, 0.4128], atol=1e-4)
    assert np.allclose(np.abs(np.roots(a)), 0.6425, atol=1e-4)
    # without prewarping the cutoff falls short, more so near Nyquist
    for fc in (50, 300):
        f_w, f_nw = minus3db(*butter_lowpass(4, fc, 1000), 1000), minus3db(*butter_lowpass(4, fc, 1000, False), 1000)
        print(f"fc {fc} Hz: prewarped -3 dB at {f_w:.2f} Hz, not prewarped {f_nw:.2f} Hz")
        assert abs(f_w - fc) < 0.01 and f_nw < fc
    assert abs(2000 * np.tan(0.1 * np.pi) - 649.84) < 0.01
```
:::end

## Exercises

:::exercise
Where does the bilinear transform map $s = 0$ and $s \to \infty$?
:::solution
$s = 0$ goes to $z = 1$ (DC to DC), and $s \to \infty$ goes to $z = -1$ (Nyquist). That's why the Butterworth's zeros at infinity become zeros at $z = -1$.
:::end

:::exercise
Design a 1st-order digital low-pass at 100 Hz, $f_s = 1$ kHz, by hand.
:::solution
$\Omega_c = 649.8$. Pole $p = -649.8$ maps to $z = (1 - 0.3249)/(1 + 0.3249) = 0.5095$. Then $a = [1, -0.5095]$ and $b = [0.2452, 0.2452]$, with unit DC gain.
:::end

## Quiz

:::quiz
- type: num
  q: Prewarped analogue cutoff in rad/s for 100 Hz at f_s = 1 kHz?
  answer: 649.84
  tol: 0.001
  unit: rad/s
  py: "2000*math.tan(0.1*math.pi)"
  explain: 2f_s tan(πf_c/f_s).
- type: num
  q: Digital pole for an analogue pole at s = −649.8, f_s = 1 kHz?
  answer: 0.50953
  tol: 0.001
  py: "(1-649.84/2000)/(1+649.84/2000)"
  explain: z = (1 + s/2f_s)/(1 − s/2f_s).
- type: mc
  q: The bilinear transform maps the analogue frequency axis…
  options:
    - linearly onto the unit circle
    - onto the unit circle once, with tangent warping
    - outside the unit circle
    - only up to f_s/4
  answer: 1
  explain: Ω = 2f_s tan(πf/f_s).
- type: mc
  q: Butterworth filters are…
  options:
    - equiripple in the passband
    - maximally flat in the passband
    - linear phase
    - FIR
  answer: 1
  explain: No ripple.
- type: num
  q: Number of zeros at z = −1 for a 6th-order Butterworth low-pass?
  answer: 6
  tol: 0.001
  py: "6"
  explain: One per pole.
- type: num
  q: Magnitude in dB of an n-th order Butterworth at its cutoff?
  answer: -3.0103
  tol: 0.001
  unit: dB
  py: "-10*math.log10(2)"
  explain: Half power.
:::end

:::verify
import math
assert abs((1-0.32492)/(1+0.32492) - 0.50953) < 1e-4
:::end
