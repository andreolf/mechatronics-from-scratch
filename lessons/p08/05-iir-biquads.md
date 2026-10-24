---
id: p08-l05
minutes: 40
summary: High-order IIR filters are built as cascades of second-order sections, because a single high-order polynomial is fragile. You implement the biquad in transposed direct form II, cascade sections to match scipy's sosfilt to rounding error, and show coefficient quantisation destabilising the direct form while the cascade survives.
---

## The biquad

A second-order section (biquad) has two poles and two zeros:

$$H(z) = \frac{b_0 + b_1 z^{-1} + b_2 z^{-2}}{1 + a_1 z^{-1} + a_2 z^{-2}}.$$

Two poles can be a complex pair, which is enough for any resonance, notch or second-order low-pass. The **transposed direct form II** needs only two state variables per section:

$$\begin{aligned} y &= b_0 x + s_1,\\ s_1 &\leftarrow b_1 x - a_1 y + s_2,\\ s_2 &\leftarrow b_2 x - a_2 y. \end{aligned}$$

It has good numerical behaviour in floating point. In fixed point, direct form I, with its wide accumulator, is often preferred (lesson 13).

## Why cascade?

Any $H(z)$ factors into its poles and zeros. You could multiply them out into one big polynomial, or group them into conjugate pairs and cascade biquads:

$$H(z) = \prod_{i} H_i(z).$$

Mathematically the two are identical. Numerically they're not: the roots of a high-order polynomial are extremely sensitive to its coefficients. Narrow low-pass filters have poles clustered near $z = 1$, and rounding the coefficients to 16 bits can move a pole outside the unit circle. Each biquad's two coefficients pin its own pair of poles, so the damage stays local. **Always implement IIR filters above second order as cascaded biquads**: scipy's `output='sos'` does exactly that.

:::figure widget=biquad caption="A low-pass biquad with its coefficients rounded to fewer bits. Lower the cutoff and the bits, and the poles near z = 1 move until the response is wrong, then unstable."
:::end

## Worked example

An 8th-order Butterworth low-pass at $0.02 f_s$.

1. As one polynomial, $a_1 \dots a_8$ range up to about 50 in magnitude, with poles at radii up to 0.976.
2. Rounding those coefficients to 12 fraction bits ($2^{-12}$ steps) moves a pole out to radius 1.25: unstable. Even 20 fraction bits leave one outside.
3. As four biquads, each with $|a_1| < 2$ and $a_2 < 1$, the same 12-bit rounding moves the poles by less than $10^{-4}$, and the passband changes by under 1 %.

## Code it from scratch

:::code file=biquads.py
```python
import numpy as np
from scipy import signal

def biquad_df2t(b, a, x):
    s1 = s2 = 0.0
    y = np.empty(len(x))
    for n, xn in enumerate(x):
        yn = b[0] * xn + s1
        s1 = b[1] * xn - a[1] * yn + s2
        s2 = b[2] * xn - a[2] * yn
        y[n] = yn
    return y

def sos_filter(sos, x):
    for sec in sos:
        x = biquad_df2t(sec[:3], sec[3:], x)
    return x

def quantise(c, frac_bits):
    return np.round(np.asarray(c) * 2**frac_bits) / 2**frac_bits

if __name__ == "__main__":
    rng = np.random.default_rng(5)
    x = rng.standard_normal(3000)
    sos = signal.butter(6, 0.2, output="sos")
    y = sos_filter(sos, x)
    err = np.abs(y - signal.sosfilt(sos, x)).max()
    print(f"6th-order cascade vs scipy sosfilt: max difference {err:.2e}")
    assert err < 1e-12
    # quantisation sensitivity: 8th-order low-pass at 0.02 fs, coefficients on a 2^-12 grid
    b, a = signal.butter(8, 0.04)
    sos8 = signal.butter(8, 0.04, output="sos")
    r_tf = np.abs(np.roots(quantise(a, 12))).max()
    r_sos = max(np.abs(np.roots(quantise(sec[3:], 12))).max() for sec in sos8)
    print(f"largest pole radius after rounding to 12 fraction bits: direct form {r_tf:.4f}, cascade {r_sos:.4f}")
    assert r_tf > 1.0 and r_sos < 1.0
    # the quantised cascade still matches the ideal response closely in the passband
    q = sos8.copy()
    q[:, 3:] = quantise(sos8[:, 3:], 12)              # feedback coefficients rounded; gains kept exact
    w, H = signal.sosfreqz(sos8, worN=2048)
    _, Hq = signal.sosfreqz(q, worN=2048)
    band = w < 0.03 * np.pi
    assert np.abs(np.abs(Hq[band]) - np.abs(H[band])).max() < 0.1
    assert np.abs(a).max() > 50
    assert np.abs(np.roots(quantise(a, 20))).max() > 1.0  # even 20 fraction bits can't save the direct form
```
:::end

## Exercises

:::exercise
In which order should you put the sections of a cascade, and does it matter in floating point?
:::solution
The transfer function doesn't depend on the order. In fixed point it matters for overflow and noise: a common rule is to put the sections with poles closest to the unit circle (the highest gain peaks) last, and to scale each section's gain. scipy's `zpk2sos` orders them for you.
:::end

:::exercise
Why does a narrow low-pass suffer more from quantisation than a wide one?
:::solution
Its poles crowd near $z = 1$, where a small change in $a_1$ or $a_2$ is a large *relative* change in the distance to the unit circle, so the cutoff, the Q and even stability shift.
:::end

## Quiz

:::quiz
- type: num
  q: State variables per biquad in transposed direct form II?
  answer: 2
  tol: 0.001
  py: "2"
  explain: s₁ and s₂.
- type: num
  q: Biquads needed for an 8th-order filter?
  answer: 4
  tol: 0.001
  py: "8/2"
  explain: Two poles per section.
- type: mc
  q: High-order IIR filters are implemented as cascades because…
  options:
    - they need fewer multiplies
    - polynomial roots are very sensitive to coefficient rounding
    - cascades have linear phase
    - scipy requires it
  answer: 1
  explain: Local sensitivity per section.
- type: mc
  q: A biquad is stable when…
  options:
    - both poles lie inside the unit circle
    - b₀ = 1
    - a₁ > 0
    - the zeros are on the unit circle
  answer: 0
  explain: Poles inside |z| = 1.
- type: num
  q: For a pole pair at radius r, what is a₂?
  answer: 0.81
  tol: 0.001
  py: "0.9**2"
  explain: a₂ = r², here with r = 0.9.
- type: num
  q: Grid step of coefficients rounded to 12 fraction bits?
  answer: 0.00024414
  tol: 0.002
  py: "2**-12"
  explain: 2⁻¹².
:::end

:::verify
from scipy import signal
assert signal.butter(8, 0.04, output="sos").shape == (4, 6)
:::end
