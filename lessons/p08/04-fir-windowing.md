---
id: p08-l04
minutes: 40
summary: The ideal low-pass filter's impulse response is an infinite sinc. Truncate it and you get ripples; taper it with a window and you trade transition width for stopband depth. You design FIR filters with Hamming and Kaiser windows, size a Kaiser filter from a specification, and check the stopband meets it.
---

## The ideal filter and its problem

An ideal low-pass with cutoff $f_c$ (in cycles per sample) has the impulse response

$$h_d[k] = 2f_c\,\operatorname{sinc}(2f_c k) = \frac{\sin(2\pi f_c k)}{\pi k},$$

which runs from $-\infty$ to $\infty$. Keep $N$ taps around the centre, shifted by $M = (N-1)/2$ so the filter is causal, and multiply by a **window** $w[n]$:

$$h[n] = h_d[n - M]\,w[n].$$

The result is **linear phase**, with a delay of $M$ samples, because $h$ is symmetric.

## Windows

Truncating abruptly (a rectangular window) leaves the Gibbs ripple: the first stopband sidelobe is only about −21 dB however many taps you use. Tapered windows push the sidelobes down at the cost of a wider transition:

| Window | Stopband | Transition width $\Delta f$ |
|---|---|---|
| Rectangular | −21 dB | $0.9/N$ |
| Hamming | −53 dB | $3.3/N$ |
| Blackman | −74 dB | $5.5/N$ |

The **Kaiser window** has a parameter β that tunes the trade-off continuously. For a stopband attenuation $A$ dB and a transition $\Delta f$:

$$\beta = 0.1102(A - 8.7)\ (A > 50),\qquad N \approx \frac{A - 8}{2.285\cdot2\pi\Delta f} + 1.$$

:::figure widget=firwin caption="A windowed-sinc low-pass with cutoff 0.1 f_s. The readout gives the worst level beyond 0.15 f_s; compare the windows and tap counts."
:::end

## Worked example

Specification: sample at 1 kHz; pass up to 100 Hz, attenuate by at least 60 dB above 150 Hz.

1. Transition: $\Delta f = 50/1000 = 0.05$. Design cutoff in the middle: $f_c = 0.125$.
2. Kaiser: $\beta = 0.1102(60 - 8.7) = 5.65$ and $N \approx 52/(2.285\times2\pi\times0.05) + 1 = 73.4$, so 75 taps (odd, for a whole-sample delay).
3. With the same 75 taps, a Hamming window reaches only about 56 dB at 150 Hz: its sidelobes level off in the 50s, so it can't reliably meet 60 dB. Rectangular manages about 26 dB.
4. Delay: 37 samples, 37 ms. Fine for logging, a lot for a control loop (lesson 7).

## Code it from scratch

:::code file=fir_window.py
```python
import numpy as np
from scipy import signal

def fir_lowpass(n_taps, fc, window):
    m = (n_taps - 1) / 2
    k = np.arange(n_taps) - m
    h = 2 * fc * np.sinc(2 * fc * k)                    # np.sinc(x) = sin(pi x)/(pi x)
    h *= window
    return h / h.sum()                                   # unity gain at DC

def hamming(n):
    return 0.54 - 0.46 * np.cos(2 * np.pi * np.arange(n) / (n - 1))

def kaiser(n, beta):
    m = (n - 1) / 2
    return np.i0(beta * np.sqrt(1 - ((np.arange(n) - m) / m) ** 2)) / np.i0(beta)

def kaiser_design(atten_db, df):
    beta = 0.1102 * (atten_db - 8.7) if atten_db > 50 else 0.5842 * (atten_db - 21) ** 0.4 + 0.07886 * (atten_db - 21)
    n = int(np.ceil((atten_db - 8) / (2.285 * 2 * np.pi * df) + 1)) | 1
    return n, beta

def stopband_db(h, f_stop):
    w, H = signal.freqz(h, worN=8192, fs=1.0)
    return 20 * np.log10(np.abs(H[w >= f_stop]).max())

def passband_ripple_db(h, f_pass):
    w, H = signal.freqz(h, worN=8192, fs=1.0)
    g = 20 * np.log10(np.abs(H[w <= f_pass]))
    return g.max() - g.min()

if __name__ == "__main__":
    n, beta = kaiser_design(60, 0.05)
    print("Kaiser design:", n, "taps, beta", round(beta, 3))
    assert n == 75 and abs(beta - 5.653) < 1e-3
    hk = fir_lowpass(n, 0.125, kaiser(n, beta))
    assert np.allclose(hk, signal.firwin(n, 0.25, window=("kaiser", beta)), atol=1e-12)
    sb, pr = stopband_db(hk, 0.15), passband_ripple_db(hk, 0.10)
    print(f"Kaiser: stopband {sb:.1f} dB, passband ripple {pr:.3f} dB")
    assert sb <= -60 and pr < 0.02
    hh = fir_lowpass(n, 0.125, hamming(n))
    assert np.allclose(hh, signal.firwin(n, 0.25, window="hamming"), atol=1e-12)
    ham = stopband_db(hh, 0.15)
    rect = stopband_db(fir_lowpass(n, 0.125, np.ones(n)), 0.15)
    print(f"same 75 taps: Hamming {ham:.1f} dB, rectangular {rect:.1f} dB: neither meets 60 dB")
    assert -60 < ham < -50 and rect > -30
    assert np.allclose(hk, hk[::-1])                     # symmetric: linear phase
```
:::end

## Exercises

:::exercise
Halving the transition width at the same attenuation does what to the Kaiser filter length?
:::solution
$N$ is inversely proportional to $\Delta f$, so the length (and the delay, and the cost per sample) doubles.
:::end

:::exercise
Why can't a longer rectangular-window filter push its stopband below about −21 dB?
:::solution
The Gibbs overshoot comes from the abrupt truncation, and its relative size doesn't depend on $N$. More taps make the transition narrower and the ripples squeeze toward the edge, but the first sidelobe stays near −21 dB.
:::end

## Quiz

:::quiz
- type: num
  q: Kaiser β for 60 dB attenuation?
  answer: 5.6533
  tol: 0.001
  py: "0.1102*(60-8.7)"
  explain: 0.1102(A − 8.7).
- type: num
  q: Estimated Kaiser length for 60 dB and Δf = 0.05 (before rounding)?
  answer: 73.43
  tol: 0.003
  py: "(60-8)/(2.285*2*math.pi*0.05)+1"
  explain: (A − 8)/(2.285·2πΔf) + 1.
- type: num
  q: Group delay in samples of a 75-tap linear-phase FIR?
  answer: 37
  tol: 0.001
  unit: samples
  py: "(75-1)/2"
  explain: (N − 1)/2.
- type: mc
  q: The Hamming window's stopband is about…
  options:
    - −21 dB
    - −53 dB
    - −74 dB
    - −120 dB
  answer: 1
  explain: Fixed, whatever N.
- type: mc
  q: A symmetric FIR impulse response guarantees…
  options:
    - stability and linear phase
    - zero delay
    - an infinite stopband
    - minimum phase
  answer: 0
  explain: FIR is always stable; symmetry gives linear phase.
- type: num
  q: Design cutoff in cycles/sample for a 100–150 Hz transition at f_s = 1 kHz?
  answer: 0.125
  tol: 0.001
  py: "125/1000"
  explain: The middle of the transition.
:::end

:::verify
assert (73 | 1) == 73 and (74 | 1) == 75
:::end
