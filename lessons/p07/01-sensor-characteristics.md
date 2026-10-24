---
id: p07-l01
minutes: 35
summary: A datasheet lists range, resolution, accuracy, linearity, hysteresis, noise and bandwidth, and each one is a different way the reading can lie. You separate accuracy from precision, build a sensor model with gain, offset, non-linearity, noise and saturation, and check that it reproduces a datasheet error budget.
---

## The vocabulary of a datasheet

A sensor turns a physical quantity into a signal. Its datasheet describes how faithfully it does that:

- **Range**: the inputs it measures, with the output range, for example 0–100 kPa giving 0.5–4.5 V. Outside the range it **saturates**.
- **Sensitivity**: output per unit input, here 40 mV/kPa. **Resolution** is the smallest change you can detect, set by noise or the ADC step.
- **Offset** (zero error) and **gain error** (span error): the straight-line errors, which calibration removes (lesson 2).
- **Non-linearity**: the worst deviation from the best straight line, in % of full scale (% FS).
- **Hysteresis**: a different output for the same input approached from below or above.
- **Noise and repeatability**: random scatter from one reading to the next.
- **Bandwidth or response time**: how fast it follows a change (Phase 03).

## Accuracy is not precision

Take many readings of the same true value. Their **mean** minus the truth is the **bias**: systematic error, poor accuracy. Their **standard deviation** is the scatter: random error, poor precision. A sensor can be precise but inaccurate (tight cluster, wrong place). Averaging removes scatter (by $\sqrt{N}$, Phase 04) but never bias; calibration removes bias but not scatter.

## Error budgets

To state the total error, combine the error sources:

- **Worst case**: add the magnitudes. Guaranteed, but pessimistic.
- **Root sum of squares (RSS)**: $\sqrt{\sum e_i^2}$ for independent errors. More realistic, because the errors rarely all line up.

:::figure widget=sensorchar caption="A sensor's rising (lime) and falling (blue) characteristic against the ideal line. Each slider adds one datasheet error; the readout shows the worst total."
:::end

## Worked example

A 0–100 kPa pressure sensor's datasheet gives: offset ±0.5 % FS, gain error ±1.5 % FS, non-linearity ±0.25 % FS, hysteresis 0.1 % FS and noise 0.05 % FS rms.

1. Worst case: $0.5 + 1.5 + 0.25 + 0.1 = 2.35$ % FS, which is ±2.35 kPa.
2. RSS of the systematic terms: $\sqrt{0.5^2 + 1.5^2 + 0.25^2 + 0.1^2} = 1.60$ % FS.
3. A one-time calibration removes offset and gain, leaving $\sqrt{0.25^2 + 0.1^2} = 0.27$ % FS plus noise.
4. Noise at 0.05 % FS rms is 0.05 kPa; averaging 16 readings brings it to 0.0125 kPa.

## Code it from scratch

:::code file=sensor_model.py
```python
import numpy as np

class SensorModel:
    """0-100 kPa in, 0.5-4.5 V out, with gain, offset, bow non-linearity, hysteresis, noise and saturation."""
    def __init__(self, gain_err=0.0, offset_fs=0.0, nl_fs=0.0, hys_fs=0.0, noise_fs=0.0, seed=0):
        self.g, self.o, self.nl, self.hys, self.noise = gain_err, offset_fs, nl_fs, hys_fs, noise_fs
        self.rng = np.random.default_rng(seed)
        self.last = 0.0
    def read(self, p):
        x = p / 100.0                                          # fraction of full scale
        rising = p >= self.last
        self.last = p
        y = x * (1 + self.g) + self.o + self.nl * 4 * x * (1 - x) + (-0.5 if rising else 0.5) * self.hys
        y += self.noise * self.rng.standard_normal()
        v = 0.5 + 4.0 * y
        return float(np.clip(v, 0.25, 4.75))                   # output stage saturates
    @staticmethod
    def to_kpa(v):
        return (v - 0.5) / 4.0 * 100

if __name__ == "__main__":
    spec = dict(offset_fs=0.005, gain_err=0.015, nl_fs=0.0025, hys_fs=0.001)
    worst = sum(spec.values()) * 100
    rss = np.sqrt(sum(v**2 for v in spec.values())) * 100
    assert abs(worst - 2.35) < 1e-9 and abs(rss - 1.60) < 0.005
    # worst-case corner: all errors at their limit, read at full scale while rising
    s = SensorModel(gain_err=0.015, offset_fs=0.005, nl_fs=0.0, hys_fs=0.001)
    s.last = -1
    assert abs(s.to_kpa(s.read(100)) - 100 - (1.5 + 0.5 - 0.05)) < 1e-9
    # random parts within the spec never exceed the worst case
    rng = np.random.default_rng(1)
    errs = []
    for part in range(2000):
        e = {k: v * rng.uniform(-1, 1) for k, v in spec.items()}
        e["hys_fs"] = spec["hys_fs"]
        m = SensorModel(**e, seed=part)
        for p in np.linspace(0, 100, 21):
            errs.append(m.to_kpa(m.read(p)) - p)
    errs = np.abs(errs)
    print(f"max error over 2000 parts {errs.max():.2f} kPa (worst case {worst:.2f}), 99th percentile {np.percentile(errs, 99):.2f}")
    assert errs.max() <= worst and np.percentile(errs, 99) < rss
    # accuracy against precision: bias survives averaging, scatter does not
    m = SensorModel(offset_fs=0.01, noise_fs=0.002, seed=3)
    r = np.array([m.to_kpa(m.read(50)) for _ in range(10_000)])
    assert abs(r.mean() - 50 - 1.0) < 0.01 and abs(r.std() - 0.2) < 0.01
    assert SensorModel().read(150) == 4.75                        # saturates above range
```
:::end

## Exercises

:::exercise
A temperature sensor reads 25.3, 25.4, 25.3, 25.2, 25.3 °C in a bath known to be 24.0 °C. Comment on its accuracy and precision.
:::solution
The mean is 25.3 °C, a bias of +1.3 K, so the accuracy is poor. The scatter is about 0.07 K, so the precision is good. A one-point offset calibration would fix it.
:::end

:::exercise
Why does a worst-case budget overstate the typical error of a production batch?
:::solution
It assumes every error is at its limit with the same sign. Independent errors partly cancel, so the typical total follows RSS: here 1.60 % rather than 2.35 %.
:::end

## Quiz

:::quiz
- type: num
  q: Worst-case total of 0.5, 1.5, 0.25 and 0.1 % FS?
  answer: 2.35
  tol: 0.001
  unit: '% FS'
  py: "0.5+1.5+0.25+0.1"
  explain: Add the magnitudes.
- type: num
  q: RSS total of the same four errors?
  answer: 1.6035
  tol: 0.002
  unit: '% FS'
  py: "math.sqrt(0.5**2+1.5**2+0.25**2+0.1**2)"
  explain: Root of the sum of squares.
- type: mc
  q: Averaging many readings removes…
  options:
    - bias
    - random scatter, but not bias
    - hysteresis
    - gain error
  answer: 1
  explain: The mean converges to truth plus bias.
- type: num
  q: Sensitivity in mV/kPa of a 0–100 kPa sensor with a 0.5–4.5 V output?
  answer: 40
  tol: 0.001
  unit: mV/kPa
  py: "4000/100"
  explain: 4 V over 100 kPa.
- type: mc
  q: Different outputs for the same input approached from above and below is…
  options:
    - non-linearity
    - hysteresis
    - noise
    - offset
  answer: 1
  explain: It depends on the history.
- type: num
  q: Noise in kPa after averaging 16 readings of 0.05 kPa rms noise?
  answer: 0.0125
  tol: 0.001
  unit: kPa
  py: "0.05/4"
  explain: Divide by √16.
:::end

:::verify
import math
assert abs(math.sqrt(0.25**2+0.1**2) - 0.269) < 0.001
:::end
