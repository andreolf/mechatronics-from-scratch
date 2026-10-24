---
id: p08-l16
minutes: 45
summary: A spalled bearing in a ski-lift gearbox hits its defect a known number of times per revolution, but each impact only rings a high-frequency resonance that hides the fault rate from an ordinary spectrum. You derive the bearing fault frequencies, then build envelope analysis (band-pass, Hilbert transform, spectrum of the magnitude) and show it finds the injected fault frequency that the raw spectrum misses.
---

## Bearing fault frequencies

A rolling-element bearing with $N_b$ balls of diameter $d$ on a pitch diameter $D$, contact angle $\varphi$, and shaft rate $f_r$ (outer race fixed) has four characteristic frequencies:

$$\text{BPFO} = \frac{N_b}{2} f_r\left(1 - \frac{d}{D}\cos\varphi\right),\qquad \text{BPFI} = \frac{N_b}{2} f_r\left(1 + \frac{d}{D}\cos\varphi\right),$$

$$\text{FTF} = \frac{f_r}{2}\left(1 - \frac{d}{D}\cos\varphi\right),\qquad \text{BSF} = \frac{D}{2d} f_r\left(1 - \left(\frac{d}{D}\cos\varphi\right)^2\right).$$

These are the rates at which balls pass a point on the outer race (BPFO) or inner race (BPFI), the cage speed (FTF) and the ball spin (BSF). A spall on the outer race is struck at BPFO.

They come from rolling kinematics: the cage turns at the average of the inner and outer surface speeds at the ball centres. In practice they're 1–2 % off, because of slip, so search a small band around them.

## Why the raw spectrum misses it

Each impact is short, so it rings the structure's resonances, typically 1–10 kHz. The vibration is a train of decaying high-frequency bursts repeating at BPFO. Its spectrum is a comb around the resonance, spaced by BPFO, and at BPFO itself there's almost nothing. Below 500 Hz the spectrum is dominated by shaft harmonics and gear mesh.

## Envelope analysis

Demodulate the bursts:

1. **Band-pass** around the excited resonance (choose it from a spectral kurtosis map, or by looking where the spectrum grew).
2. Take the **analytic signal** $x_a = x + j\mathcal{H}\{x\}$, where $\mathcal{H}$ is the Hilbert transform. In the frequency domain: zero the negative frequencies and double the positive ones. Its magnitude $|x_a|$ is the **envelope**.
3. Take the **spectrum of the envelope**. It shows lines at BPFO and its harmonics.

As the defect grows, the impacts get stronger and the BPFO line rises out of the noise; trending its level is how condition monitoring decides when to replace the bearing.

:::figure widget=envelope caption="Simulated outer-race fault. With envelope analysis off, the largest low-frequency line is the 25 Hz shaft; switch it on and the fault frequency and its harmonics appear."
:::end

## Worked example

A ski-lift gearbox input bearing (a deep-groove ball bearing, $\varphi = 0$) has $N_b = 9$, $d = 7.94$ mm and $D = 39.0$ mm on a 25 Hz shaft.

1. $d/D = 0.2036$.
2. BPFO $= 4.5\cdot25\cdot0.7964 = 89.6$ Hz.
3. BPFI $= 4.5\cdot25\cdot1.2036 = 135.4$ Hz.
4. FTF $= 12.5\cdot0.7964 = 9.96$ Hz.
5. BSF $= (39/15.88)\cdot25\cdot(1 - 0.0415) = 58.9$ Hz.

A line at 89–90 Hz in the envelope spectrum, with harmonics at 179 and 269 Hz, points to the outer race.

## Code it from scratch

:::code file=envelope.py
```python
import numpy as np
from scipy import signal

def bearing_frequencies(n_balls, d, D, fr, phi=0.0):
    r = d / D * np.cos(phi)
    return {"BPFO": n_balls / 2 * fr * (1 - r), "BPFI": n_balls / 2 * fr * (1 + r),
            "FTF": fr / 2 * (1 - r), "BSF": D / (2 * d) * fr * (1 - r * r)}

def analytic(x):
    """Analytic signal by the FFT: keep DC and Nyquist, double positive, zero negative."""
    n = len(x)
    X = np.fft.fft(x)
    g = np.zeros(n)
    g[0] = 1
    g[1:(n + 1) // 2] = 2
    if n % 2 == 0:
        g[n // 2] = 1
    return np.fft.ifft(X * g)

def simulate(fs, n, bpfo, fault, rng, f_res=3000.0):
    x = np.zeros(n)
    period = fs / bpfo
    k = 0
    while k * period < n:
        n0 = int(round(k * period + 3 * rng.standard_normal()))       # slip jitter
        m = np.arange(300)
        idx = n0 + m
        ok = (idx >= 0) & (idx < n)
        x[idx[ok]] += fault * np.exp(-m[ok] / 40) * np.sin(2 * np.pi * f_res * m[ok] / fs)
        k += 1
    t = np.arange(n) / fs
    return x + 0.6 * np.sin(2 * np.pi * 25 * t) + 0.5 * rng.standard_normal(n)

def spectrum(x, fs):
    w = np.hanning(len(x))
    return np.fft.rfftfreq(len(x), 1 / fs), np.abs(np.fft.rfft((x - x.mean()) * w))

def envelope_spectrum(x, fs, band=(2000, 4000)):
    sos = signal.butter(4, band, btype="bandpass", fs=fs, output="sos")
    env = np.abs(analytic(signal.sosfiltfilt(sos, x)))
    return spectrum(env, fs)

if __name__ == "__main__":
    f = bearing_frequencies(9, 7.94, 39.0, 25.0)
    print({k: round(v, 2) for k, v in f.items()})
    assert abs(f["BPFO"] - 89.6) < 0.05 and abs(f["BPFI"] - 135.4) < 0.05 and abs(f["BSF"] - 58.9) < 0.05

    x = np.random.default_rng(0).standard_normal(1001)
    assert np.allclose(analytic(x), signal.hilbert(x))                 # matches SciPy

    fs, n, bpfo = 20000.0, 2 ** 15, f["BPFO"]
    rng = np.random.default_rng(16)
    x = simulate(fs, n, bpfo, 1.0, rng)
    fr, R = spectrum(x, fs)
    lo = (fr > 5) & (fr < 500)
    raw_peak = fr[lo][np.argmax(R[lo])]
    fe, E = envelope_spectrum(x, fs)
    env_peak = fe[lo][np.argmax(E[lo])]
    print(f"largest line below 500 Hz: raw {raw_peak:.1f} Hz, envelope {env_peak:.1f} Hz")
    assert abs(raw_peak - 25) < 1                                      # raw: shaft dominates
    assert abs(env_peak - bpfo) < 1.5                                  # envelope: the fault
    assert abs(fe[lo][np.argmax(E[lo] * (fe[lo] > 150))] - 2 * bpfo) < 2.5   # and its harmonic

    # the BPFO line grows with the defect
    def bpfo_level(fault):
        fe, E = envelope_spectrum(simulate(fs, n, bpfo, fault, np.random.default_rng(1)), fs)
        band = np.abs(fe - bpfo) < 2
        ref = (fe > 300) & (fe < 500)
        return 20 * np.log10(E[band].max() / np.median(E[ref]))
    levels = [bpfo_level(a) for a in (0.0, 0.3, 1.0)]
    print("BPFO above floor (dB):", [round(v, 1) for v in levels])
    assert levels[0] < 6 < levels[1] and levels[2] > levels[1] + 6        # healthy: no line; growing defect: rising line
```
:::end

## Exercises

:::exercise
Why is the envelope spectrum taken of $|x_a|$ rather than of $|x|$ (full-wave rectification)?
:::solution
Rectifying also demodulates, but it creates harmonics of the 3 kHz carrier and leaves ripple at 6 kHz, which can alias and raises the floor. The analytic-signal magnitude is a smooth envelope with no carrier ripple, giving cleaner fault lines.
:::end

:::exercise
The envelope spectrum shows lines at 135 Hz with sidebands at ±25 Hz. Which part is damaged, and why the sidebands?
:::solution
135 Hz is BPFI: the inner race. The inner race turns with the shaft, so the defect moves in and out of the load zone once per revolution, amplitude-modulating the impacts at 25 Hz and creating sidebands at BPFI ± $f_r$.
:::end

## Quiz

:::quiz
- type: num
  q: BPFO in Hz for 9 balls, d/D = 0.2036, 25 Hz shaft?
  answer: 89.6
  tol: 0.002
  unit: Hz
  py: "4.5*25*(1-7.94/39.0)"
  explain: (N_b/2)·f_r·(1 − d/D).
- type: num
  q: BPFI in Hz for the same bearing?
  answer: 135.4
  tol: 0.002
  unit: Hz
  py: "4.5*25*(1+7.94/39.0)"
  explain: (N_b/2)·f_r·(1 + d/D).
- type: num
  q: Cage frequency FTF in Hz for the same bearing?
  answer: 9.955
  tol: 0.002
  unit: Hz
  py: "12.5*(1-7.94/39.0)"
  explain: (f_r/2)·(1 − d/D).
- type: num
  q: Sum BPFO + BPFI, in multiples of the shaft rate, for 9 balls?
  answer: 9
  tol: 0.001
  py: "4.5*(1-0.2036)+4.5*(1+0.2036)"
  explain: Always N_b.
- type: mc
  q: In the raw spectrum, an outer-race fault mostly shows as…
  options:
    - a strong line at BPFO
    - sidebands spaced by BPFO around a structural resonance
    - a line at the shaft rate
    - nothing at all
  answer: 1
  explain: The impacts ring a resonance.
- type: mc
  q: The analytic signal is obtained by…
  options:
    - squaring the signal
    - zeroing negative frequencies and doubling positive ones
    - low-pass filtering
    - taking the derivative
  answer: 1
  explain: Its magnitude is the envelope.
:::end

:::verify
import math
assert abs(4.5*25*(1-7.94/39.0) - 89.6) < 0.05
:::end
