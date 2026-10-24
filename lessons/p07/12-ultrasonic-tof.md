---
id: p07-l12
minutes: 35
summary: An ultrasonic ranger times an echo, and the distance is half the round trip times the speed of sound. You correct the speed of sound for temperature, compare threshold detection with cross-correlation on simulated noisy echoes, and reach errors below 1 cm with correlation plus parabolic interpolation.
---

## Time of flight

A transducer sends a short burst at 40 kHz, the sound bounces off the target and returns after $t$, so

$$d = \frac{c\,t}{2}.$$

The speed of sound in air depends on temperature: $c \approx 331.3 + 0.606\,T$ m/s with $T$ in °C. That's 343.4 m/s at 20 °C and 337.4 m/s at 10 °C, a 1.8 % difference, so 3.5 cm at 2 m. Measure the air temperature or calibrate against a known distance.

The beam is wide (about 30°), soft surfaces absorb, and angled ones reflect away, so ultrasonic rangers are good for "is something close?" and poor at fine detail. A minimum range of a few centimetres comes from the transducer still ringing after transmitting.

## Detecting the echo

**Threshold**: report the first sample above a fixed level. It's simple, but the resonant transducer's echo rises over several cycles, so a weak echo crosses the threshold later than a strong one. The error depends on the target's reflectivity and distance: often a centimetre or more, and a whole cycle (4.3 mm of range) at a time.

**Cross-correlation**: slide a copy of the transmitted burst along the received signal and find the lag where they match best:

$$r[k] = \sum_n x[n]\,s[n-k],\qquad \hat k = \arg\max_k r[k].$$

That uses the whole echo, not one sample, so it is independent of amplitude and robust to noise. It's the optimal *matched filter* for a known pulse in white noise. Fitting a parabola through the peak and its two neighbours gives sub-sample resolution (Phase 08 lesson 15).

:::figure widget=echo caption="A received echo in noise (top) and its correlation with the transmitted burst (bottom). The correlation peak marks the round-trip time even when the echo is hard to see."
:::end

## Worked example

An echo returns after 11.66 ms at 20 °C.

1. $c = 331.3 + 0.606\times20 = 343.42$ m/s.
2. $d = 343.42\times0.01166/2 = 2.002$ m.
3. If the firmware assumed 343 m/s while the air was at 0 °C (331.3 m/s), it would report 2.000 m for a target really at 1.931 m: a 7 cm error from temperature alone.
4. Sampling at 1 MHz, one sample is 0.17 mm of range, so correlation is limited by noise, not by sampling.

## Code it from scratch

:::code file=ultrasonic.py
```python
import numpy as np

rng = np.random.default_rng(21)
FS, F0 = 1e6, 40e3

def c_air(T):
    return 331.3 + 0.606 * T

def burst(cycles=10):
    n = int(cycles * FS / F0)
    t = np.arange(n) / FS
    return np.sin(2 * np.pi * F0 * t) * np.sin(np.pi * np.arange(n) / n) ** 2   # transducer-shaped envelope

def received(d, amp, noise, T=20.0, n=14000):
    s = burst()
    x = noise * rng.standard_normal(n)
    delay = 2 * d / c_air(T) * FS
    k0 = int(delay)
    frac = delay - k0
    shifted = np.interp(np.arange(len(s)) - frac, np.arange(len(s)), s, left=0, right=0)
    x[k0:k0 + len(s)] += amp * shifted
    return x

def by_threshold(x, level):
    return np.argmax(np.abs(x) > level) / FS

def by_correlation(x):
    s = burst()
    r = np.correlate(x, s, mode="valid")
    k = int(np.argmax(r))
    y0, y1, y2 = r[k - 1], r[k], r[k + 1]
    return (k + 0.5 * (y0 - y2) / (y0 - 2 * y1 + y2)) / FS   # parabolic peak

if __name__ == "__main__":
    assert abs(c_air(20) - 343.42) < 1e-9 and abs(343.42 * 0.01166 / 2 - 2.002) < 0.001
    worst_thr = worst_cor = 0.0
    for d in np.linspace(0.3, 2.2, 20):
        for amp in (0.05, 0.2, 1.0):                         # weak, medium, strong reflectors
            x = received(d, amp, noise=0.01)
            d_thr = by_threshold(x, 0.04) * c_air(20) / 2
            d_cor = by_correlation(x) * c_air(20) / 2
            worst_thr = max(worst_thr, abs(d_thr - d))
            worst_cor = max(worst_cor, abs(d_cor - d))
    print(f"worst error: threshold {100*worst_thr:.1f} cm, correlation {100*worst_cor:.2f} cm")
    assert worst_cor < 0.01 and worst_thr > 2 * worst_cor
```
:::end

## Exercises

:::exercise
Why does threshold detection err in steps of about 4.3 mm?
:::solution
The echo is a 40 kHz sine under an envelope, so the threshold can only be crossed near a peak of a cycle. Moving from one cycle to the next shifts the time by 25 µs, which is $343\times25\times10^{-6}/2 = 4.3$ mm of range.
:::end

:::exercise
Two rangers on one robot fire at the same time. What goes wrong, and how does correlation help?
:::solution
Each can hear the other's burst and report a false echo. Fire them in turn, or give each a different coded burst (a chirp or pseudo-random sequence, Phase 06's LFSR). Correlation with its own code then rejects the other's.
:::end

## Quiz

:::quiz
- type: num
  q: Speed of sound in m/s at 20 °C?
  answer: 343.42
  tol: 0.001
  unit: m/s
  py: "331.3+0.606*20"
  explain: 331.3 + 0.606 T.
- type: num
  q: Distance in m for an 11.66 ms round trip at 20 °C?
  answer: 2.0021
  tol: 0.001
  unit: m
  py: "343.42*0.01166/2"
  explain: Half the round trip.
- type: num
  q: Range per 40 kHz cycle in mm (c = 343 m/s)?
  answer: 4.2875
  tol: 0.002
  unit: mm
  py: "343/40e3/2*1000"
  explain: Half a wavelength.
- type: mc
  q: Cross-correlation beats a fixed threshold because…
  options:
    - it is faster
    - it uses the whole echo and doesn't depend on amplitude
    - it needs no transmitted signal
    - it removes the speed of sound
  answer: 1
  explain: A matched filter.
- type: num
  q: Range error in % from assuming 343 m/s when the air is at 0 °C?
  answer: 3.53
  tol: 0.01
  unit: '%'
  py: "(343-331.3)/331.3*100"
  explain: Measure the temperature.
- type: mc
  q: Fitting a parabola to the correlation peak gives…
  options:
    - sub-sample time resolution
    - the speed of sound
    - the echo amplitude only
    - a wider beam
  answer: 0
  explain: Interpolation between samples.
:::end

:::verify
assert abs((331.3+0.606*10) - 337.36) < 0.01
:::end
