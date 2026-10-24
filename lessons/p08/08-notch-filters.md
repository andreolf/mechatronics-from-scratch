---
id: p08-l08
minutes: 30
summary: A mechanical resonance or a mains harmonic sits at one frequency, so remove just that frequency. You place zeros on the unit circle and poles just inside them, derive the notch width from the pole radius, design a 120 Hz notch deeper than 30 dB, and check it against scipy's iirnotch.
---

## Zeros on the circle, poles just inside

A sinusoid at $\omega_0$ is cancelled completely by a pair of zeros on the unit circle at $e^{\pm j\omega_0}$:

$$B(z) = 1 - 2\cos\omega_0\,z^{-1} + z^{-2}.$$

On its own that's a wide, deep dip that also cuts nearby frequencies. Add poles at the same angle but radius $r < 1$:

$$H(z) = g\,\frac{1 - 2\cos\omega_0\,z^{-1} + z^{-2}}{1 - 2r\cos\omega_0\,z^{-1} + r^2 z^{-2}}.$$

Away from $\omega_0$ each pole nearly cancels its zero, so the response returns to 1; only near $\omega_0$ does the zero win. The gain $g$ normalises the DC gain to 1.

**Width**: the −3 dB bandwidth is approximately

$$\Delta f \approx \frac{(1-r)\,f_s}{\pi}.$$

So $r = 0.95$ at 1 kHz gives 16 Hz, and $r = 0.99$ gives 3.2 Hz. A narrower notch removes less of the neighbouring signal, but needs the frequency to be known accurately and stable, and it rings for longer, about $1/(\pi\Delta f)$ seconds.

:::figure widget=notch caption="A 120 Hz notch at 1 kHz. Pull the pole radius toward 1 and the notch narrows; the depth at exactly 120 Hz is always infinite."
:::end

## Worked example

A gimbal has a structural resonance at 120 Hz that a 1 kHz control loop excites.

1. $\omega_0 = 2\pi\times120/1000 = 0.754$ rad/sample, so $\cos\omega_0 = 0.7290$.
2. With $r = 0.95$: $a = [1, -1.3850, 0.9025]$ and $b \propto [1, -1.4579, 1]$.
3. Bandwidth: $(0.05\times1000)/\pi = 15.9$ Hz.
4. Depth at 120 Hz is infinite on paper and limited by coefficient rounding in practice. At ±1 Hz it is still 18 dB and at ±2 Hz 12 dB; at 100 Hz the loss is only 0.6 dB. The resonance drifts with temperature and payload, so don't make it too narrow.

## Code it from scratch

:::code file=notch.py
```python
import numpy as np
from scipy import signal

def notch(f0, fs, r):
    w0 = 2 * np.pi * f0 / fs
    b = np.array([1, -2 * np.cos(w0), 1.0])
    a = np.array([1, -2 * r * np.cos(w0), r * r])
    return b * (a.sum() / b.sum()), a                     # unity gain at DC

def gain_db(b, a, f, fs):
    _, H = signal.freqz(b, a, worN=[f], fs=fs)
    return 20 * np.log10(np.abs(H[0]) + 1e-300)

def bandwidth(b, a, fs, f0):
    f = np.linspace(f0 - 60, f0 + 60, 120_001)
    _, H = signal.freqz(b, a, worN=f, fs=fs)
    below = f[np.abs(H) < 2**-0.5]
    return below.max() - below.min()

if __name__ == "__main__":
    fs, f0, r = 1000.0, 120.0, 0.95
    b, a = notch(f0, fs, r)
    assert np.allclose(a, [1, -1.38504, 0.9025], atol=1e-5)
    depth = gain_db(b, a, f0, fs)
    bw = bandwidth(b, a, fs, f0)
    print(f"depth at 120 Hz {depth:.0f} dB, -3 dB width {bw:.2f} Hz (estimate {(1-r)*fs/np.pi:.2f}), at 100 Hz {gain_db(b, a, 100, fs):.2f} dB")
    assert depth < -30 and abs(bw - (1 - r) * fs / np.pi) < 1.0
    assert gain_db(b, a, 121, fs) < -15 and gain_db(b, a, 122, fs) < -12 and gain_db(b, a, 10, fs) > -0.1
    # scipy's iirnotch with Q = f0 / bandwidth gives (nearly) the same filter
    bs, as_ = signal.iirnotch(f0, f0 / ((1 - r) * fs / np.pi), fs=fs)
    assert np.allclose(as_, a, atol=5e-3)
    # remove a 120 Hz resonance riding on a 5 Hz signal
    t = np.arange(4000) / fs
    x = np.sin(2 * np.pi * 5 * t) + 0.5 * np.sin(2 * np.pi * 120 * t)
    y = signal.lfilter(b, a, x)
    resid = y[1000:] - np.sin(2 * np.pi * 5 * t[1000:])
    assert np.abs(resid).max() < 0.02
```
:::end

## Exercises

:::exercise
The resonance moves from 120 to 126 Hz as the payload changes. Your notch has $r = 0.99$. What happens?
:::solution
The bandwidth is only 3.2 Hz, so at 126 Hz the notch gives little attenuation: the resonance comes back. Widen it ($r = 0.95$), track the frequency and retune, or use two notches.
:::end

:::exercise
Why does a narrow notch ring for a long time after a transient?
:::solution
Its poles are close to the unit circle, at radius $r$, so their response decays like $r^n$. At $r = 0.99$ that's a time constant of about 100 samples, 0.1 s at 1 kHz.
:::end

## Quiz

:::quiz
- type: num
  q: Approximate −3 dB width in Hz for r = 0.95 at f_s = 1 kHz?
  answer: 15.915
  tol: 0.002
  unit: Hz
  py: "0.05*1000/math.pi"
  explain: (1 − r) f_s/π.
- type: num
  q: The coefficient a₂ for r = 0.95?
  answer: 0.9025
  tol: 0.001
  py: "0.95**2"
  explain: r².
- type: mc
  q: The zeros of a notch filter are placed…
  options:
    - inside the unit circle
    - on the unit circle at ±ω₀
    - at z = 1
    - at the origin
  answer: 1
  explain: For complete cancellation.
- type: num
  q: Normalised frequency ω₀ in rad/sample for 120 Hz at 1 kHz?
  answer: 0.75398
  tol: 0.001
  unit: rad/sample
  py: "2*math.pi*120/1000"
  explain: 2πf₀/f_s.
- type: mc
  q: Moving the poles closer to the unit circle makes the notch…
  options:
    - wider
    - narrower, with longer ringing
    - shallower at ω₀
    - unstable immediately
  answer: 1
  explain: Smaller bandwidth, slower decay.
- type: num
  q: Approximate decay time constant in samples of poles at r = 0.99?
  answer: 99.5
  tol: 0.01
  unit: samples
  py: "-1/math.log(0.99)"
  explain: rⁿ = e^(n ln r).
:::end

:::verify
import math
assert abs(2*0.95*math.cos(2*math.pi*0.12) - 1.38504) < 1e-4
:::end
