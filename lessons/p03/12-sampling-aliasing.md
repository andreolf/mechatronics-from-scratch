---
id: p03-l12
minutes: 30
summary: Sampling folds every frequency above half the sample rate back into the band you can see. You derive the Nyquist criterion from sampling as multiplication by an impulse train, predict alias frequencies with |f − k·fs|, and reproduce the wagon-wheel effect and an IMU that reports vibration that isn't there.
---

## Sampling in the frequency domain

Sampling a signal every $T$ seconds is multiplication by an impulse train $\sum_n\delta(t - nT)$. The Fourier transform of an impulse train is another impulse train, spaced $f_s = 1/T$ apart, and multiplication in time is convolution in frequency (lesson 8). So the sampled signal's spectrum is the original spectrum copied at every multiple of $f_s$:

$$X_s(f) = f_s\sum_{k=-\infty}^{\infty}X(f - kf_s).$$

If the original occupies $|f| < f_s/2$, the copies don't overlap and an ideal low-pass filter recovers the signal exactly. That's the **Nyquist criterion**: sample faster than twice the highest frequency present. If anything lies above $f_s/2$, its copies land inside the band and are indistinguishable from real content. That's **aliasing**, and no processing after the sampler can undo it.

## Predicting the alias

A sinusoid at $f$ produces exactly the same samples as one at $f - kf_s$ for any integer $k$, because

$$\cos(2\pi f\,nT) = \cos(2\pi(f - kf_s)nT + 2\pi kn) .$$

The apparent frequency is the one in $[0, f_s/2]$:

$$f_\text{alias} = |f - kf_s|, \quad k = \operatorname{round}(f/f_s).$$

**Wagon wheel.** A film camera samples the rotation at 24 frames per second. A wheel turning at 23 rev/s advances by $23/24$ of a turn per frame, which looks like going back $1/24$ of a turn: −1 rev/s, so it seems to spin slowly backwards. If the wheel has 8 identical spokes, the pattern repeats every 1/8 turn, so the spoke frequency $8f$ is what gets aliased.

**The fix** is an analog anti-aliasing filter before the ADC (Phase 05 lesson 17 builds one), or sampling much faster and filtering digitally. Many MEMS IMUs have a configurable digital low-pass for this reason.

:::figure widget=alias caption="A 9 Hz cosine sampled at 10 Hz produces the same samples as a 1 Hz cosine (amber). Raise the sample rate above 18 Hz and the alias disappears."
:::end

## Worked example

1. **The widget's default.** 9 Hz sampled at 10 Hz: $k = 1$, so $f_\text{alias} = |9 - 10| = 1$ Hz.
2. **An IMU on a drone.** The gyro samples at 1 kHz and the propellers vibrate the frame at 1200 Hz. The alias is $|1200 - 1000| = 200$ Hz: a strong, fake 200 Hz vibration in the data, right where the attitude controller might react to it.
3. **Wagon wheel.** A wheel at 23.5 rev/s filmed at 24 fps appears to turn at $|23.5 - 24| = 0.5$ rev/s backwards. At 24.5 rev/s it appears to turn 0.5 rev/s forwards.
4. **A signal exactly at Nyquist.** 500 Hz sampled at 1 kHz: depending on phase, the samples hit the peaks (alternating ±1) or the zero crossings (all zero). That's why you need strictly more than twice the bandwidth, plus margin for a real filter's roll-off.

## Code it from scratch

:::code file=aliasing.py
```python
import numpy as np

def alias(f, fs):
    return abs(f - round(f / fs) * fs)

def apparent_frequency(f, fs, N=4096):
    """Sample a cosine and find the strongest FFT bin."""
    n = np.arange(N)
    x = np.cos(2 * np.pi * f * n / fs + 0.3)
    X = np.abs(np.fft.rfft(x * np.hanning(N)))
    return np.fft.rfftfreq(N, 1 / fs)[np.argmax(X)]

def wheel_apparent_rev_s(rev_s, fps):
    """Signed apparent rotation rate, folded into (-fps/2, fps/2]."""
    r = rev_s - round(rev_s / fps) * fps
    return r if r > -fps / 2 else r + fps

if __name__ == "__main__":
    fs = 1000
    for f in (100, 450, 900, 1200, 1990, 2600):
        meas = apparent_frequency(f, fs)
        assert abs(meas - alias(f, fs)) <= fs / 4096, (f, meas)
    assert alias(1200, 1000) == 200 and alias(9, 10) == 1
    assert wheel_apparent_rev_s(23.5, 24) == -0.5 and wheel_apparent_rev_s(24.5, 24) == 0.5
    assert wheel_apparent_rev_s(23, 24) == -1
    # samples of 9 Hz and 1 Hz cosines at 10 Hz are identical
    n = np.arange(50)
    assert np.allclose(np.cos(2 * np.pi * 9 * n / 10), np.cos(2 * np.pi * 1 * n / 10))
    print("1200 Hz vibration at 1 kHz sampling appears at", alias(1200, 1000), "Hz")
```
:::end

## Exercises

:::exercise
A motor current sensor is sampled at 10 kHz. The PWM runs at 16 kHz. Where does the ripple appear in the samples, and how could you avoid seeing it at all?
:::solution
$|16 - 2\times10| = 4$ kHz. Most motor drivers instead synchronise the ADC trigger to the PWM, sampling at the centre of each PWM period where the ripple crosses its average, so the ripple is never sampled at all.
:::end

:::exercise
An 8-spoke wheel turns at 3.1 rev/s and is filmed at 24 fps. What does the viewer see?
:::solution
The spoke pattern repeats at $8 \times 3.1 = 24.8$ Hz. Folded with $f_s = 24$: $24.8 - 24 = 0.8$ patterns per second forwards, so the spokes appear to creep forward at $0.8/8 = 0.1$ rev/s.
:::end

## Quiz

:::quiz
- type: num
  q: A 1200 Hz vibration sampled at 1 kHz appears at what frequency in Hz?
  answer: 200
  tol: 0.001
  unit: Hz
  py: "abs(1200-1000)"
  explain: $|f - kf_s|$ with $k = 1$.
- type: num
  q: What is the alias of 2600 Hz sampled at 1 kHz, in Hz?
  answer: 400
  tol: 0.001
  unit: Hz
  py: "abs(2600-3*1000)"
  explain: $k = \operatorname{round}(2.6) = 3$, giving $|2600 - 3000|$.
- type: num
  q: A wheel at 23.5 rev/s filmed at 24 fps appears to turn at how many rev/s? Use a negative sign for backwards.
  answer: -0.5
  tol: 0.001
  unit: rev/s
  py: "23.5-24"
  explain: It advances 23.5/24 of a turn per frame, which looks like −0.5/24.
- type: mc
  q: Aliasing can be removed after sampling by…
  options:
    - a digital low-pass filter
    - nothing; an analog filter must act before the sampler
    - zero-padding the FFT
    - a Hann window
  answer: 1
  explain: Once frequencies fold onto each other, the samples can't tell them apart.
- type: num
  q: What is the minimum sample rate in Hz for a signal band-limited to 3.4 kHz (ideal filter)?
  answer: 6800
  tol: 0.001
  unit: Hz
  py: "2*3400"
  explain: More than twice the bandwidth; telephony uses 8 kHz to leave filter margin.
- type: mc
  q: In the frequency domain, sampling…
  options:
    - removes all frequencies above Nyquist
    - copies the spectrum at every multiple of $f_s$
    - shifts the spectrum by $f_s/2$
    - squares the spectrum
  answer: 1
  explain: Multiplying by an impulse train convolves the spectrum with another impulse train.
:::end

:::verify
assert abs(8*3.1-24-0.8)<1e-9
:::end
