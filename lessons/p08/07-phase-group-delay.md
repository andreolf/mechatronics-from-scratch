---
id: p08-l07
minutes: 35
summary: Every causal filter delays the signal, and inside a feedback loop delay is phase lag taken straight from the stability margin. You define phase delay and group delay, compute them for FIR and IIR filters, measure the delay of a tone burst through a filter, and work out the phase a sensor filter costs a control loop.
---

## Two kinds of delay

A filter multiplies the sinusoid at frequency $\omega$ by $|H|e^{j\varphi(\omega)}$. Two delays follow from the phase:

- **Phase delay** $\tau_p = -\varphi(\omega)/\omega$: how far a pure sinusoid's crests shift.
- **Group delay** $\tau_g = -\,d\varphi/d\omega$: how far the *envelope* of a narrowband burst, its information, shifts.

For a **linear-phase FIR** (lesson 4) both equal $(N-1)/2$ samples at every frequency, so the waveform keeps its shape. IIR filters have frequency-dependent delay, usually peaking near the cutoff, so a step's shape changes (overshoot, ringing) even though the magnitude looks benign.

## Delay in a control loop

A pure delay $T_d$ contributes phase $-\omega T_d$ and no change of gain. At the loop's crossover frequency $f_c$, a filter in the feedback path removes roughly

$$\Delta\varphi \approx 360°\cdot f_c\cdot\tau$$

from the phase margin (Phase 13), where $\tau$ is the filter's delay near $f_c$. A 10 ms filter on a 20 Hz loop costs about 72°: often the whole margin. Hence the rules: filter only as much as needed, put the cutoff well above the crossover (5–10×), and count the ADC, the computation and the PWM update as delays too.

:::figure widget=groupdelay caption="Group delay against frequency for four filters at 1 kHz. Move the control bandwidth to see how much phase each filter takes from the loop there."
:::end

## Worked example

A 4th-order Butterworth anti-noise filter at 50 Hz, $f_s = 1$ kHz, sits in a loop with a 20 Hz crossover.

1. Group delay at 20 Hz: 8.94 samples, which is 8.94 ms.
2. Phase at 20 Hz: −60.9°. A 60° phase margin is gone.
3. Move the filter to 200 Hz instead: the phase at 20 Hz falls to about −15°.
4. A 31-tap linear-phase FIR has 15 ms of delay at every frequency, which is 108° at 20 Hz: worse still. FIR linear phase is great for logging, costly in loops.

## Code it from scratch

:::code file=group_delay.py
```python
import numpy as np
from scipy import signal

FS = 1000.0

def group_delay(b, a, f, df=1e-3):
    w = 2 * np.pi * np.array([f - df, f + df]) / FS
    _, H = signal.freqz(b, a, worN=w)
    dphi = np.angle(H[1] / H[0])                    # unwrap-free difference
    return -dphi / (w[1] - w[0])                    # in samples

def burst_delay(b, a, f0, width=60):
    """Delay of the envelope peak of a Gaussian tone burst through the filter, in samples."""
    n = np.arange(2000)
    env = np.exp(-0.5 * ((n - 600) / width) ** 2)
    x = env * np.sin(2 * np.pi * f0 * n / FS)
    y = signal.lfilter(b, a, x)
    env_out = np.abs(signal.hilbert(y))
    num = np.sum(env_out * n) / np.sum(env_out)
    return num - 600

if __name__ == "__main__":
    b, a = signal.butter(4, 50, fs=FS)
    gd = group_delay(b, a, 20)
    gd_ref = signal.group_delay((b, a), w=[20], fs=FS)[1][0]
    assert abs(gd - gd_ref) < 1e-3 and abs(gd - 8.936) < 0.01
    meas = burst_delay(b, a, 20)
    print(f"Butterworth 4 @ 50 Hz: group delay at 20 Hz {gd:.2f} samples, burst envelope delayed {meas:.2f}")
    assert abs(meas - gd) < 0.5
    _, H = signal.freqz(b, a, worN=[20], fs=FS)
    lag = -np.degrees(np.angle(H[0]))
    assert abs(lag - 60.92) < 0.01
    _, H200 = signal.freqz(*signal.butter(4, 200, fs=FS), worN=[20], fs=FS)
    assert -np.degrees(np.angle(H200[0])) < 16
    h = signal.firwin(31, 50, fs=FS)
    for f in (5, 20, 40):
        assert abs(group_delay(h, [1.0], f) - 15) < 1e-6          # linear phase: constant
    print(f"phase lag at 20 Hz: Butterworth {lag:.1f} deg, 31-tap FIR {360*20*15/FS:.0f} deg")
```
:::end

## Exercises

:::exercise
A loop crosses over at 50 Hz with 45° of phase margin. What's the largest total delay it can tolerate before going unstable?
:::solution
The margin is gone when $360°\cdot50\cdot T_d = 45°$, so $T_d = 2.5$ ms. That includes sampling, computation, filters and the actuator update.
:::end

:::exercise
Why does a step through a Butterworth filter overshoot even though its magnitude response has no peak?
:::solution
The group delay isn't constant: components near the cutoff are delayed more than low frequencies, so they arrive late and pile up after the edge. The waveform changes shape even though no frequency is amplified.
:::end

## Quiz

:::quiz
- type: num
  q: Group delay in samples of a 31-tap linear-phase FIR?
  answer: 15
  tol: 0.001
  unit: samples
  py: "(31-1)/2"
  explain: (N − 1)/2.
- type: num
  q: Phase lag in degrees from a 10 ms delay at 20 Hz?
  answer: 72
  tol: 0.001
  unit: °
  py: "360*20*0.010"
  explain: 360° f T_d.
- type: num
  q: Maximum delay in ms for a 45° margin at a 50 Hz crossover?
  answer: 2.5
  tol: 0.001
  unit: ms
  py: "45/(360*50)*1000"
  explain: Solve 360° f T_d = 45°.
- type: mc
  q: Group delay measures the delay of…
  options:
    - the envelope of a narrowband signal
    - a sinusoid's crests only
    - DC
    - the noise floor
  answer: 0
  explain: −dφ/dω.
- type: mc
  q: To protect phase margin, a sensor low-pass cutoff should be…
  options:
    - at the crossover
    - well above the crossover (5–10×)
    - below the crossover
    - as low as possible
  answer: 1
  explain: Its phase lag at crossover stays small.
- type: num
  q: Group delay in ms of the 4th-order 50 Hz Butterworth at 20 Hz (f_s = 1 kHz)?
  answer: 8.936
  tol: 0.002
  unit: ms
  py: "8.936"
  explain: From the code.
:::end

:::verify
assert abs(360*20*0.015 - 108) < 1e-9
:::end
