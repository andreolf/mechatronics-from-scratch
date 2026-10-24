---
id: p07-l10
minutes: 35
summary: A MEMS gyro measures rotation rate through the Coriolis force on a vibrating mass. Integrating it gives angle, and integrating its bias gives an error that grows without limit. You simulate a biased, noisy gyro, estimate the bias from 10 s at rest to within 5 percent, and quantify the drift that remains.
---

## Coriolis on a chip

A MEMS gyro drives a proof mass to vibrate along one axis at velocity $v$. When the chip rotates at rate $\Omega$ about a perpendicular axis, the mass feels the Coriolis acceleration

$$a_c = 2\,\Omega\times v,$$

along the third axis. Sensing that motion (at the drive frequency, then demodulating) gives a signal proportional to $\Omega$. At $\Omega = 100$ °/s and a peak $v = 0.1$ m/s, $a_c = 2\times1.745\times0.1 = 0.35$ m/s², a tiny force on a mass of micrograms.

## Bias and its integral

A real gyro reads $\omega_m = \omega + b + n$, with a **bias** $b$ (offset, which drifts slowly with temperature) and white **noise** $n$ with density $N$ in °/s/√Hz (the *angle random walk*). Integrate to get angle:

$$\theta_m(t) = \theta(t) + b\,t + \int_0^t n\,d\tau.$$

- The bias term grows **linearly**: 0.5 °/s of bias is 30° of error after a minute.
- The noise term grows like $\sqrt t$: its standard deviation is $N\sqrt t$.

**Estimate the bias at rest**: if the device is known to be still for $T$ seconds, the mean reading is the bias, with an uncertainty of $N/\sqrt T$. Subtract it. The leftover drift is then $(N/\sqrt T)\,t$ plus the random walk, small but still unbounded, which is why lesson 18 fuses the gyro with an absolute reference. The Allan deviation (Phase 04) shows how long averaging keeps helping before bias instability takes over.

:::figure widget=gyrobias caption="Heading from integrating a stationary gyro, without (red) and with (lime) the bias estimated at rest and subtracted. Lengthen the averaging and the corrected drift shrinks."
:::end

## Worked example

A gyro with a bias of 0.5 °/s and a noise density of 0.01 °/s/√Hz, sampled at 100 Hz.

1. Per-sample noise: $0.01\sqrt{100} = 0.1$ °/s rms.
2. Averaging 10 s (1000 samples): bias uncertainty $0.1/\sqrt{1000} = 0.0032$ °/s, which is 0.63 % of the bias.
3. Uncorrected drift after 60 s: 30°. Corrected: $0.0032\times60 = 0.19°$ from the residual bias, plus $0.01\sqrt{60} = 0.077°$ of random walk.

## Code it from scratch

:::code file=gyro_bias.py
```python
import numpy as np

rng = np.random.default_rng(6)
FS, BIAS, N_DENS = 100.0, 0.5, 0.01                     # Hz, deg/s, deg/s/sqrt(Hz)

def gyro(true_rate):
    return true_rate + BIAS + N_DENS * np.sqrt(FS) * rng.standard_normal(np.shape(true_rate))

def estimate_bias(seconds_at_rest):
    return gyro(np.zeros(int(seconds_at_rest * FS))).mean()

if __name__ == "__main__":
    ests = np.array([estimate_bias(10) for _ in range(300)])
    rel = np.abs(ests - BIAS) / BIAS
    print(f"bias estimates from 10 s: mean {ests.mean():.4f}, std {ests.std():.4f} deg/s, worst {100*rel.max():.2f} %")
    assert rel.max() < 0.05
    assert abs(ests.std() - N_DENS / np.sqrt(10)) < 0.0007
    # a manoeuvre: rotate 90 deg in 2 s, then hold, over 60 s
    t = np.arange(0, 60, 1 / FS)
    rate = np.where(t < 2, 45.0, 0.0)
    m = gyro(rate)
    b = estimate_bias(10)
    raw = np.cumsum(m) / FS
    corrected = np.cumsum(m - b) / FS
    truth = np.cumsum(rate) / FS
    print(f"after 60 s: raw error {raw[-1]-truth[-1]:.1f} deg, corrected error {corrected[-1]-truth[-1]:.2f} deg")
    assert abs(raw[-1] - truth[-1] - 30) < 1 and abs(corrected[-1] - truth[-1]) < 1
    assert abs(2 * np.radians(100) * 0.1 - 0.349) < 0.001
```
:::end

## Exercises

:::exercise
A drone's gyro bias changes by 0.02 °/s per kelvin, and the board warms by 15 K after start-up. What does that do to a bias estimated at power-on?
:::solution
The bias moves by 0.3 °/s, far more than the averaging uncertainty. Estimate the bias again when the device is still (zero-velocity updates), model it against temperature, or let a filter track it continuously.
:::end

:::exercise
How long must the device stay still for the bias uncertainty to drop to 0.001 °/s with $N = 0.01$ °/s/√Hz?
:::solution
$N/\sqrt T = 0.001$ gives $T = 100$ s, as long as the bias stays stable that long (check the Allan deviation).
:::end

## Quiz

:::quiz
- type: num
  q: Heading error in degrees after 60 s from a 0.5 °/s bias?
  answer: 30
  tol: 0.001
  unit: °
  py: "0.5*60"
  explain: Linear growth.
- type: num
  q: Bias uncertainty in °/s after 10 s at rest with N = 0.01 °/s/√Hz?
  answer: 0.0031623
  tol: 0.002
  unit: °/s
  py: "0.01/math.sqrt(10)"
  explain: N/√T.
- type: num
  q: Coriolis acceleration in m/s² for 100 °/s and 0.1 m/s?
  answer: 0.34907
  tol: 0.002
  unit: m/s²
  py: "2*math.radians(100)*0.1"
  explain: 2Ωv.
- type: mc
  q: The angle error from white gyro noise grows like…
  options:
    - t
    - √t
    - t²
    - it doesn't grow
  answer: 1
  explain: A random walk.
- type: num
  q: Seconds at rest for a bias uncertainty of 0.001 °/s with N = 0.01 °/s/√Hz?
  answer: 100
  tol: 0.001
  unit: s
  py: "(0.01/0.001)**2"
  explain: T = (N/σ)².
- type: mc
  q: After subtracting an estimated bias, heading drift is…
  options:
    - eliminated forever
    - smaller but still unbounded
    - larger
    - bounded by 1°
  answer: 1
  explain: Residual bias and random walk remain.
:::end

:::verify
import math
assert abs(0.01*math.sqrt(100) - 0.1) < 1e-12
:::end
