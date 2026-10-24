---
id: p07-l15
minutes: 30
summary: Differential pressure across an orifice measures flow, but through a square root. You derive the orifice equation from Bernoulli, estimate flow from a noisy pressure sensor, correct the air density for temperature, and see why a small pressure offset ruins low-flow readings unless you zero it.
---

## Pressure sensors

Most electronic pressure sensors are a thin silicon diaphragm with piezoresistive strain gauges in a bridge (lesson 4). Pressure bends the diaphragm and unbalances the bridge. They come in three references:

- **Absolute**: against a sealed vacuum (barometers, altitude).
- **Gauge**: against the surrounding air (tyre pressure).
- **Differential**: between two ports (flow, filter clogging).

## Flow from a pressure drop

Bernoulli along a streamline, $p + \tfrac12\rho v^2 = \text{const}$, says the fluid speeds up and its pressure drops as it squeezes through a restriction. For an orifice of area $A$ with differential pressure $\Delta p$:

$$Q = C_d\,A\,\sqrt{\frac{2\,\Delta p}{\rho}}.$$

The **discharge coefficient** $C_d \approx 0.6$ for a sharp-edged orifice, accounting for the jet contracting and for losses. Calibrate it for your geometry.

**Consequences of the square root**:

- The range compresses: 10:1 in flow needs 100:1 in pressure.
- At low flow, $dQ/d\Delta p$ blows up, so a tiny pressure offset or noise becomes a large flow error. **Zero** the sensor at no flow, and set a cut-off below which you report zero.
- Density matters: $\rho = p/(R_s T)$ for a gas, with $R_s = 287$ J/(kg·K) for air. 30 K of temperature change is a 5 % density change, which is 2.5 % in flow.

:::figure widget=orifice caption="Flow through a 10 mm orifice against differential pressure. At low Δp, one sensor step is a large fraction of the reading."
:::end

## Worked example

Air at 20 °C and 101.3 kPa through a 10 mm sharp orifice ($C_d = 0.61$) with $\Delta p = 2000$ Pa.

1. $\rho = 101\,300/(287\times293.15) = 1.204$ kg/m³.
2. $A = \pi(0.005)^2 = 7.854\times10^{-5}$ m².
3. $Q = 0.61\times7.854\times10^{-5}\times\sqrt{2\times2000/1.204} = 2.76\times10^{-3}$ m³/s, which is 2.76 L/s.
4. A sensor offset of 12.5 Pa (0.25 % of a 5 kPa range) at $\Delta p = 50$ Pa gives $\sqrt{62.5/50} = 1.118$: an 11.8 % flow error. At 2000 Pa it's only 0.3 %.

## Code it from scratch

:::code file=orifice.py
```python
import numpy as np

rng = np.random.default_rng(15)
CD, D, RS = 0.61, 0.010, 287.0
A = np.pi * D**2 / 4

def rho_air(p_abs=101_300.0, T_c=20.0):
    return p_abs / (RS * (T_c + 273.15))

def flow(dp, rho):
    return CD * A * np.sqrt(2 * np.maximum(dp, 0) / rho)

class DpSensor:
    """0-5 kPa differential sensor: 12-bit, 0.25 % FS offset, 0.05 % FS noise."""
    def __init__(self):
        self.offset, self.zero = 12.5, 0.0
    def read(self, dp, n=16):
        raw = dp + self.offset + 2.5 * rng.standard_normal(n)
        return float(np.mean(np.round(raw / (5000 / 4096)) * (5000 / 4096))) - self.zero
    def calibrate_zero(self):
        self.zero = self.read(0.0, n=256)

if __name__ == "__main__":
    rho = rho_air()
    q = flow(2000, rho)
    assert abs(rho - 1.204) < 0.001 and abs(q * 1000 - 2.76) < 0.01
    s = DpSensor()
    q_full = flow(5000, rho)
    def worst_error(sensor):
        worst = 0.0
        for frac in np.linspace(0.1, 1.0, 10):              # 10-100 % of full flow
            q_true = frac * q_full
            dp = (q_true / (CD * A)) ** 2 * rho / 2
            worst = max(worst, abs(flow(sensor.read(dp), rho) - q_true) / q_true)
        return worst
    before = worst_error(s)
    s.calibrate_zero()
    after = worst_error(s)
    print(f"worst flow error over 10-100 % flow: {100*before:.1f} % before zeroing, {100*after:.2f} % after")
    assert before > 0.05 and after < 0.05
    # temperature: using 20 C density when the air is at 50 C
    err = flow(2000, rho_air(T_c=20)) / flow(2000, rho_air(T_c=50)) - 1
    assert abs(err - (np.sqrt(293.15 / 323.15) - 1)) < 1e-12
    print(f"density from the wrong temperature (20 vs 50 C): {100*err:.1f} % flow error")
```
:::end

## Exercises

:::exercise
A flow meter must cover 1 to 20 L/s. What range of differential pressure does that span?
:::solution
$\Delta p \propto Q^2$, so 20:1 in flow is 400:1 in pressure. At the low end the signal is 0.25 % of the top-end pressure, which is why wide-range meters switch sensors or use other principles.
:::end

:::exercise
Why report zero flow below a small threshold instead of the computed value?
:::solution
Near zero, noise and residual offset alternate between small positive and negative $\Delta p$, and the square root turns them into large apparent flows. A cut-off at a few percent of full scale avoids reporting flow that isn't there.
:::end

## Quiz

:::quiz
- type: num
  q: Air density in kg/m³ at 20 °C and 101.3 kPa?
  answer: 1.2041
  tol: 0.001
  unit: kg/m³
  py: "101300/(287*293.15)"
  explain: p/(R_s T).
- type: num
  q: Flow in L/s through a 10 mm orifice (C_d 0.61) at 2000 Pa, ρ = 1.204?
  answer: 2.7604
  tol: 0.003
  unit: L/s
  py: "0.61*math.pi*0.005**2*math.sqrt(2*2000/1.204)*1000"
  explain: C_d A √(2Δp/ρ).
- type: num
  q: Pressure ratio needed for a 10:1 flow range?
  answer: 100
  tol: 0.001
  py: "10**2"
  explain: Δp ∝ Q².
- type: num
  q: Flow error in % from a 12.5 Pa offset at Δp = 50 Pa?
  answer: 11.803
  tol: 0.002
  unit: '%'
  py: "(math.sqrt(62.5/50)-1)*100"
  explain: The square root amplifies it at low flow.
- type: mc
  q: A differential pressure sensor measures…
  options:
    - against vacuum
    - against ambient air
    - between two ports
    - temperature
  answer: 2
  explain: Used for flow.
- type: mc
  q: The discharge coefficient accounts for…
  options:
    - the jet contracting and losses
    - the sensor's offset
    - temperature
    - ADC resolution
  answer: 0
  explain: Real flow is less than ideal.
:::end

:::verify
import math
assert abs(math.sqrt(293.15/323.15) - 0.9524) < 1e-3
:::end
