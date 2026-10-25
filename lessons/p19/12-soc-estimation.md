---
id: p19-l12
minutes: 45
summary: State of charge cannot be measured, only estimated. You show how Coulomb counting drifts with a small current-sensor offset and never recovers from a wrong start, then build an extended Kalman filter around the equivalent circuit model that corrects with the terminal voltage and holds the error under 3 % on an illustrative e-scooter ride.
---

## Coulomb counting

Integrating the measured current, $\mathrm{SOC}_k = \mathrm{SOC}_0 - \tfrac{1}{Q}\sum i_k \Delta t$, is simple and accurate over short times. But it has no feedback: a 100 mA sensor offset on a 3 Ah cell adds 3.3 % of error per hour, and a wrong initial SOC (after a long rest with self-discharge, or a battery swap) stays wrong forever.

## Voltage as a measurement

The equivalent circuit model (Lesson 11) predicts the terminal voltage from SOC, current and the RC state. If the measured voltage is lower than predicted, the SOC is probably lower than estimated. An **extended Kalman filter** (Phase 14 built the linear Kalman filter) makes that correction optimally: the state is $x = [\mathrm{SOC}, v_1]$, the prediction step is Coulomb counting plus the RC update, and the measurement model $v = \mathrm{OCV}(\mathrm{SOC}) - R_0 i - v_1$ is linearised with $H = [\mathrm{d}\,\mathrm{OCV}/\mathrm{d}\,\mathrm{SOC}, -1]$. The filter's gain is large where the OCV curve is steep and small where it is flat, which is why LFP cells (Lesson 10) are harder.

## A scooter ride

E-scooters, common in places like Bali, see stop-and-go traffic, hill climbs and short regenerative pulses: a demanding profile for a fuel gauge, and a wrong reading strands the rider. The ride here is an illustrative random profile, not logged data, and the "real" cell has resistances 10 and 20 % higher than the filter's model, so the filter faces model error as well as sensor error.

:::figure widget=socekf caption="True SOC, Coulomb counting and the EKF over an illustrative ride. Change the sensor offset, the initial SOC error and the voltage noise."
:::end

## Worked example

One hour from 90 % to 34.8 % SOC, 100 mA current offset, 2 mV voltage noise:

1. Coulomb counting from the right start: final error 3.33 %.
2. Coulomb counting starting 20 % off: final error 23.33 %.
3. EKF starting 20 % off: error 0.31 % after 5 min, at most 1.17 % over the last 50 min, final 0.88 %, inside the 3 % target despite the model mismatch.

## Code it from scratch

:::code file=soc_ekf.py
```python
import numpy as np

Q = 3.0 * 3600; R0, R1, C1 = 0.022, 0.015, 1500.0                     # illustrative cell, 1-RC model (Lesson 11)
def ocv(s): return 3.0 + 1.2 * s - 0.25 * np.exp(-12 * s) + 0.05 * np.sin(3 * s)
def docv(s): return 1.2 + 3.0 * np.exp(-12 * s) + 0.15 * np.cos(3 * s)

def ride(seconds=3600, seed=3):
    """illustrative stop-and-go e-scooter current for one cell: cruising, hill climbs, stops and regenerative braking."""
    rng = np.random.default_rng(seed); i = np.zeros(seconds); t = 0
    while t < seconds:
        n = rng.integers(10, 60); a = rng.choice([0.0, 1.0, 2.5, 5.0, -1.5], p=[.2, .35, .2, .15, .1])
        i[t:t + n] = a + rng.normal(0, 0.3, min(n, seconds - t)); t += n
    return i

def truth(i, soc0=0.90, dt=1.0, noise=2e-3, seed=4, r0=1.1 * R0, r1=1.2 * R1, c1=C1):
    """the 'real' cell: its resistances are 10 and 20 % higher than the model the estimator uses."""
    rng = np.random.default_rng(seed); a = np.exp(-dt / (r1 * c1)); s, v1 = soc0, 0.0; socs, vs = [], []
    for ik in i:
        vs.append(ocv(s) - r0 * ik - v1 + rng.normal(0, noise)); socs.append(s)
        v1 = a * v1 + r1 * (1 - a) * ik; s -= ik * dt / Q
    return np.array(socs), np.array(vs)

def coulomb(i_meas, soc0, dt=1.0): return soc0 - np.concatenate([[0], np.cumsum(i_meas[:-1])]) * dt / Q

def ekf(i_meas, v_meas, soc0, dt=1.0, q_soc=1e-10, q_v1=1e-7, r=(3e-3)**2, p0=(0.2**2, 1e-4)):
    """state x = [SOC, v1]; predict with the measured current, correct with the terminal voltage."""
    a = np.exp(-dt / (R1 * C1)); F = np.diag([1.0, a]); Qn = np.diag([q_soc, q_v1])
    x = np.array([soc0, 0.0]); P = np.diag(p0); out = []
    for ik, vk in zip(i_meas, v_meas):
        H = np.array([docv(x[0]), -1.0]); y = vk - (ocv(x[0]) - R0 * ik - x[1])
        S = H @ P @ H + r; K = P @ H / S; x = x + K * y; P = (np.eye(2) - np.outer(K, H)) @ P
        out.append(x[0])
        x = np.array([x[0] - ik * dt / Q, a * x[1] + R1 * (1 - a) * ik]); P = F @ P @ F.T + Qn
    return np.array(out)

def test_soc_estimation():
    i = ride(); soc, v = truth(i)
    i_meas = i + 0.10                                                    # current sensor with a 100 mA offset
    cc_good = coulomb(i_meas, 0.90); cc_bad = coulomb(i_meas, 0.70)      # right and wrong starting SOC
    est = ekf(i_meas, v, 0.70)
    e = lambda x: 100 * np.abs(x - soc)
    print(f"true SOC {100 * soc[0]:.1f} % -> {100 * soc[-1]:.1f} % over {len(i) / 60:.0f} min")
    print(f"Coulomb counting, right start: final error {e(cc_good)[-1]:.2f} %")
    print(f"Coulomb counting, start 20 % off: final error {e(cc_bad)[-1]:.2f} %")
    print(f"EKF, start 20 % off: error after 5 min {e(est)[300]:.2f} %, max over the last 50 min {e(est)[600:].max():.2f} %, final {e(est)[-1]:.2f} %")
    assert e(cc_good)[-1] > 1 and e(cc_bad)[-1] > 15 and e(est)[600:].max() < 3

test_soc_estimation()
print("PASS")
```
:::end

## In practice

FilterPy provides Kalman, extended and unscented filters in Python for prototyping; production BMS firmware implements the two-state filter directly in C, with OCV and parameter tables over temperature. Fuel-gauge chips from battery IC vendors use related model-based methods. Wider OCV slopes, good current sensing and periodic rests (when OCV can be read directly) all help.

## Exercises

:::exercise
A 50 mA current offset on a 2 Ah cell: how much SOC error after 4 hours of Coulomb counting?
:::solution
$0.05 \times 4 / 2 = 0.10$, so 10 % SOC.
:::end

:::exercise
Why does the EKF correct SOC slowly on the flat part of an LFP curve?
:::solution
The measurement Jacobian $\mathrm{d}\,\mathrm{OCV}/\mathrm{d}\,\mathrm{SOC}$ is small there, so a voltage error says little about SOC; the Kalman gain for SOC is small, and the filter relies mostly on Coulomb counting until the curve steepens.
:::end

## Quiz

:::quiz
- type: num
  q: SOC drift per hour from a 100 mA offset on a 3 Ah cell (%)?
  answer: 3.33
  tol: 0.003
  py: "100*0.1/3"
  explain: Offset over capacity.
- type: num
  q: SOC after 1 Ah from 80 % on a 4 Ah cell (%)?
  answer: 55
  tol: 0.001
  py: "80-100*1/4"
  explain: Coulomb counting.
- type: num
  q: Number of states in the 1-RC SOC filter?
  answer: 2
  tol: 0.001
  py: "2"
  explain: SOC and the RC voltage.
- type: num
  q: Kalman gain for scalar P 0.04, H 1.2 and R 1e-5?
  answer: 0.833
  tol: 0.003
  py: "0.04*1.2/(1.2**2*0.04+1e-5)"
  explain: K = P H / (H² P + R).
- type: mc
  q: What can Coulomb counting never fix on its own?
  options: ["A wrong initial SOC", "Fast current changes", "Regenerative pulses", "Sampling at 1 Hz"]
  answer: 0
  explain: It has no feedback.
- type: mc
  q: What does the EKF use to correct SOC?
  options: ["The difference between measured and predicted terminal voltage", "The temperature only", "The capacity label", "Nothing, it only integrates current"]
  answer: 0
  explain: The voltage innovation.
:::end
