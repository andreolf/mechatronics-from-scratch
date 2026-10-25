---
id: p19-l11
minutes: 40
summary: The equivalent circuit model is the workhorse of battery management. You build a Thevenin model with a series resistance and RC branches, simulate a pulse test on an illustrative cell, fit a one-RC model with least squares to an error under 10 mV, and see what a second RC branch adds.
---

## Voltage that lags current

Step the current drawn from a cell and its voltage drops at once, then keeps sagging for tens of seconds; remove the load and it recovers the same way. The instant drop is ohmic (electrolyte, contacts, current collectors). The slow part comes from charge transfer and diffusion inside the electrodes, which behave like resistors with capacitors across them.

## The Thevenin model

The **equivalent circuit model** (ECM) puts OCV(SOC) in series with $R_0$ and one or more parallel $R_j C_j$ branches:

$$v = \mathrm{OCV}(\mathrm{SOC}) - i R_0 - \sum_j v_j, \qquad v_j[k+1] = e^{-\Delta t/\tau_j} v_j[k] + R_j \left(1 - e^{-\Delta t/\tau_j}\right) i[k],$$

with $\tau_j = R_j C_j$. The update is exact for a current held constant over each step, so the model runs at any sample rate in a few multiplications: ideal for a battery management system microcontroller.

## Fitting to a pulse test

A **pulse test** applies current steps with rests between them and logs the voltage. $R_0$ is the instantaneous voltage step divided by the current step; the relaxation curves set the RC branches. Least squares fits all parameters at once by minimising the difference between simulated and measured voltage. Here the "measured" data come from a two-RC cell with 0.5 mV noise, so you can check what a one-RC fit misses. All parameter values are illustrative.

:::figure widget=ecmfit caption="A pulse test and the model's response. Adjust R0, R1 and the time constant by hand and watch the error; the button jumps to the least-squares fit."
:::end

## Worked example

Pulse test: 10 s rest, 30 s at 6 A, 60 s rest, 30 s at 3 A, 60 s rest, sampled at 10 Hz.

1. Resistance only: peak error 91.8 mV, the relaxation is missing entirely.
2. One RC branch: $R_0 = 23.65$ mΩ, $R_1 = 17.08$ mΩ, $C_1 = 1014$ F, $\tau = 17.3$ s. RMS error 2.79 mV, peak 10.09 mV, under the 10 mV target on average.
3. Two RC branches: $R_0 = 22.00$ mΩ, time constants 9.5 s and 47.1 s (truth 9.6 s and 48 s), RMS 0.50 mV, peak 1.92 mV: down to the noise.
4. $R_0$ from the instantaneous step alone: 22.08 mΩ against 22.00 mΩ.

## Code it from scratch

:::code file=ecm.py
```python
import numpy as np
from scipy.optimize import least_squares

def ocv(soc): return 3.0 + 1.2 * soc - 0.25 * np.exp(-12 * soc) + 0.05 * np.sin(3 * soc)   # illustrative smooth curve

def simulate(i, dt, q_ah, r0, rcs, soc0=0.9):
    """Thevenin model: OCV(SOC) - i R0 - sum of RC branch voltages, each updated exactly for a step in current."""
    soc = soc0; vs = np.zeros(len(rcs)); out = np.empty(len(i))
    for k, ik in enumerate(i):
        out[k] = ocv(soc) - ik * r0 - vs.sum()
        for j, (r, c) in enumerate(rcs):
            a = np.exp(-dt / (r * c)); vs[j] = a * vs[j] + r * (1 - a) * ik
        soc -= ik * dt / (q_ah * 3600)
    return out

def pulse_test(dt=0.1):
    """10 s rest, 30 s at 6 A (2C), 60 s rest, 30 s at 3 A, 60 s rest."""
    seg = [(10, 0), (30, 6), (60, 0), (30, 3), (60, 0)]
    return np.concatenate([np.full(int(t / dt), a, float) for t, a in seg])

def test_fit_one_rc():
    dt = 0.1; q = 3.0; i = pulse_test(dt); rng = np.random.default_rng(1)
    truth = dict(r0=0.022, rcs=[(0.012, 800.0), (0.008, 6000.0)])           # "real" cell: two RC branches (illustrative)
    v = simulate(i, dt, q, **truth) + rng.normal(0, 0.5e-3, len(i))          # measured with 0.5 mV noise
    def resid(p): return simulate(i, dt, q, p[0], [(p[1], p[2])]) - v
    fit = least_squares(resid, [0.01, 0.01, 1000.0], bounds=([0, 0, 1], [0.2, 0.2, 1e6]), x_scale=[0.01, 0.01, 1000])
    r0, r1, c1 = fit.x; err = resid(fit.x)
    rms, peak = 1000 * np.sqrt(np.mean(err**2)), 1000 * np.max(np.abs(err))
    print(f"1-RC fit: R0 {1000 * r0:.2f} mOhm, R1 {1000 * r1:.2f} mOhm, C1 {c1:.0f} F, tau {r1 * c1:.1f} s")
    print(f"error: rms {rms:.2f} mV, peak {peak:.2f} mV")
    d0 = simulate(i, dt, q, r0, []) - v                                      # resistance only, no RC branch
    print(f"R0-only model: peak error {1000 * np.max(np.abs(d0)):.1f} mV")
    assert rms < 10 and np.max(np.abs(d0)) > 0.05
    def resid2(p): return simulate(i, dt, q, p[0], [(p[1], p[2]), (p[3], p[4])]) - v
    fit2 = least_squares(resid2, [0.01, 0.01, 500.0, 0.01, 5000.0], bounds=([0, 0, 1, 0, 1], [0.2, 0.2, 1e6, 0.2, 1e6]),
                         x_scale=[0.01, 0.01, 500, 0.01, 5000])
    e2 = resid2(fit2.x); taus = sorted([fit2.x[1] * fit2.x[2], fit2.x[3] * fit2.x[4]])
    print(f"2-RC fit: R0 {1000 * fit2.x[0]:.2f} mOhm, tau {taus[0]:.1f} s and {taus[1]:.1f} s, rms {1000 * np.sqrt(np.mean(e2**2)):.2f} mV, peak {1000 * np.max(np.abs(e2)):.2f} mV")
    assert np.max(np.abs(e2)) < 0.4 * peak / 1000
    r0_step = (v[int(10 / dt) - 1] - v[int(10 / dt) + 0]) / 6                # instantaneous drop at the pulse edge
    print(f"R0 from the instantaneous step: {1000 * r0_step:.2f} mOhm (truth 22.00)")
    assert abs(r0_step - 0.022) < 0.002

test_fit_one_rc()
print("PASS")
```
:::end

## In practice

Battery teams fit ECM parameters as tables over SOC and temperature from pulse tests (the hybrid pulse power characterisation, HPPC, is the common procedure), with scipy or MATLAB. PyBaMM includes ECM models alongside its physics-based ones, and can generate synthetic pulse tests to practise on. Parameters drift as the cell ages, which is why many BMS designs re-estimate $R_0$ online.

## Exercises

:::exercise
A 5 A step causes an instant 110 mV drop. What is $R_0$?
:::solution
$R_0 = 0.110 / 5 = 22$ mΩ.
:::end

:::exercise
Why does a one-RC fit leave a systematic error when the cell has two time constants?
:::solution
One exponential cannot match a relaxation that is the sum of a fast and a slow exponential. The fit compromises: too fast at the end of the rest, too slow at the start, giving a structured residual rather than noise.
:::end

## Quiz

:::quiz
- type: num
  q: Time constant of R = 15 mΩ, C = 2000 F (s)?
  answer: 30
  tol: 0.001
  py: "0.015*2000"
  explain: τ = R C.
- type: num
  q: Fraction of an RC branch's final voltage reached after one time constant (%)?
  answer: 63.2
  tol: 0.002
  py: "100*(1-math.exp(-1))"
  explain: 1 − e⁻¹.
- type: num
  q: Terminal voltage at OCV 3.8 V, 4 A, R0 20 mΩ and v1 30 mV (V)?
  answer: 3.69
  tol: 0.002
  py: "3.8-4*0.020-0.030"
  explain: OCV − i R0 − v1.
- type: num
  q: Discrete decay factor exp(−Δt/τ) for Δt 0.1 s and τ 20 s?
  answer: 0.995
  tol: 0.001
  py: "math.exp(-0.1/20)"
  explain: Close to 1 for fast sampling.
- type: mc
  q: What sets R0 in a pulse test?
  options: ["The instantaneous voltage step divided by the current step", "The voltage after a long rest", "The capacity", "The slowest time constant"]
  answer: 0
  explain: The ohmic part responds at once.
- type: mc
  q: Why do ECMs suit battery management systems?
  options: ["They run in a few multiplications per step and fit measured data", "They model every chemical reaction", "They need no parameters", "They ignore SOC"]
  answer: 0
  explain: Cheap and well-fitted.
:::end
