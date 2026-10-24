---
id: p13-l08
minutes: 35
summary: A pure derivative has gain that rises without limit with frequency, so sensor noise differentiated at a fast sample rate turns into violent actuator chatter, and every practical PID filters its derivative. You derive the filtered derivative Kd s over Tf s plus 1 and how much noise it passes, add sensor noise to the cart-pole of lesson 07, and test that the filter cuts the actuator RMS by the predicted factor while too much filtering adds enough lag to make the pendulum fall.
---

## Why raw derivatives are noisy

A derivative's frequency response is $|j\omega| = \omega$: the faster the signal, the more it's amplified. In discrete time with sample period $T_s$, white sensor noise of standard deviation $\sigma$ becomes

$$\frac{n_k - n_{k-1}}{T_s} \quad\Rightarrow\quad \text{RMS} = \frac{\sqrt2\,\sigma}{T_s}.$$

At 200 Hz with $\sigma = 0.5°$ (0.0087 rad), that's 2.5 rad/s of fake angular rate, and with $K_d = 7$ it commands 17 N RMS of pure noise on a cart whose actuator saturates at 30 N.

## The filtered derivative

Replace $K_ds$ by

$$D(s) = \frac{K_ds}{T_fs + 1},$$

a derivative below $1/T_f$ and a constant gain $K_d/T_f$ above it. In discrete form with $a = e^{-T_s/T_f}$:

$$d_k = a\,d_{k-1} + (1 - a)\frac{y_k - y_{k-1}}{T_s}.$$

Its noise output follows from summing the filter's squared impulse response:

$$\text{RMS} = \frac{\sigma(1 - a)}{T_s}\sqrt{\frac{2}{1 + a}}.$$

The [live pendulum lab](#lab-pendulum) uses $T_f = 12$ ms at $T_s = 5$ ms: $a = 0.659$, and the noise RMS falls by a factor of 3.8. Also differentiate the measurement, not the error (lesson 07), to avoid derivative kick.

**The trade-off.** The filter adds phase lag of $\arctan(\omega T_f)$. Too large a $T_f$ and the damping the D term was meant to provide arrives too late.

:::figure widget=dfilter caption="The cart-pole's actuator command with sensor noise, using a raw or filtered derivative. Raise the noise to see the raw derivative shake the actuator, then stretch the filter until the lag starts to destabilise the balance."
:::end

## Worked example

$\sigma = 0.5°$, $K_d = 7$, $T_s = 5$ ms.

1. Raw: $7 \times 0.00873 \times \sqrt2/0.005 = 17.3$ N RMS.
2. $T_f = 12$ ms: $a = e^{-5/12} = 0.659$, so the factor is $0.341\sqrt{2/1.659} = 0.374$ against $\sqrt2$ raw. Noise drops to 4.6 N RMS.
3. Phase lag at the loop's 7 rad/s: $\arctan(7 \times 0.012) = 4.8°$, negligible. At $T_f = 100$ ms it's 35°, enough to erode most of the damping.

## Code it from scratch

:::code file=dfilter.py
```python
import numpy as np

M, m, l, g = 0.8, 0.25, 0.45, 9.81
Fmax, tauA, Kp, Ki, Kd, kx, kv = 30.0, 0.02, 38.0, 6.0, 7.0, 1.6, 2.6
SIGMA = np.radians(0.5)

def deriv(s, F):
    x, xd, th, thd = s
    sn, cs, tot = np.sin(th), np.cos(th), M + m
    temp = (F + m * l * thd * thd * sn) / tot
    thdd = (g * sn - cs * temp) / (l * (4 / 3 - m * cs * cs / tot)) - 0.02 * thd
    return np.array([xd, temp - m * l * thdd * cs / tot - 0.3 * xd, thd, thdd])

def run(Tf, sigma=SIGMA, T=20.0, seed=0):
    h, every = 1e-3, 5; dt = h * every
    a = np.exp(-dt / Tf) if Tf > 0 else 0.0
    rng = np.random.default_rng(seed)
    s = np.array([0.0, 0.0, 0.06, 0.0]); F = Fc = integ = d = 0.0; prev = 0.06
    cmds, ths = [], []
    for k in range(int(T / h)):
        if k % every == 0:
            y = s[2] + sigma * rng.normal()
            d = a * d + (1 - a) * (y - prev) / dt; prev = y
            integ = np.clip(integ + y * dt, -0.5, 0.5)
            Fc = np.clip(Kp * y + Ki * integ + Kd * d + kx * s[0] + kv * s[1], -Fmax, Fmax)
        F += h / tauA * (Fc - F)
        k1 = deriv(s, F); k2 = deriv(s + h / 2 * k1, F); k3 = deriv(s + h / 2 * k2, F); k4 = deriv(s + h * k3, F)
        s = s + h / 6 * (k1 + 2 * k2 + 2 * k3 + k4)
        cmds.append(Fc); ths.append(s[2])
        if abs(s[2]) > 1.0: break
    return np.array(cmds), np.array(ths)

def noise_rms(Tf, dt=0.005):
    if Tf == 0: return np.sqrt(2) / dt
    a = np.exp(-dt / Tf)
    return (1 - a) / dt * np.sqrt(2 / (1 + a))

def test_formula_matches_filter():
    rng = np.random.default_rng(1); n = rng.normal(size=400000); dt = 0.005
    for Tf in (0.0, 0.012, 0.05):
        a = np.exp(-dt / Tf) if Tf else 0.0
        raw = np.diff(n) / dt; d = np.zeros_like(raw)
        for k in range(1, len(raw)): d[k] = a * d[k - 1] + (1 - a) * raw[k]
        assert abs(np.std(d[100:]) / noise_rms(Tf) - 1) < 0.01

def test_actuator_rms_drops():
    raw, th_r = run(0.0); filt, th_f = run(0.012)
    r_raw, r_f = np.std(raw[2000:]), np.std(filt[2000:])
    print(f"actuator command RMS: raw derivative {r_raw:.1f} N (noise model {Kd * SIGMA * noise_rms(0):.1f}), filtered {r_f:.1f} N (model {Kd * SIGMA * noise_rms(0.012):.1f})")
    assert len(th_r) == len(th_f) == 20000                  # both still balance
    assert r_f < r_raw / 2.5
    assert abs(r_raw / r_f - noise_rms(0) / noise_rms(0.012)) / (noise_rms(0) / noise_rms(0.012)) < 0.25

def test_too_much_filter_destabilises():
    results = {}
    for Tf in (0.012, 0.03, 0.06, 0.1, 0.15):
        _, th = run(Tf)
        results[Tf] = (len(th) / 1000, np.max(np.abs(th[2000:])) if len(th) > 2000 else 1.0)
        print(f"Tf = {Tf * 1000:5.0f} ms: upright {results[Tf][0]:4.1f} s, max tilt after 2 s {results[Tf][1]:.3f} rad")
    assert results[0.012][1] < 0.05 and results[0.06][1] < 0.05
    assert results[0.1][1] > 0.2 and results[0.15][0] < 20

test_formula_matches_filter()
test_actuator_rms_drops()
test_too_much_filter_destabilises()
print("PASS")
```
:::end

## Exercises

:::exercise
You halve the sample period to 2.5 ms but keep $T_f = 12$ ms. Does the filtered noise RMS go up or down?
:::solution
Up. $a = e^{-2.5/12} = 0.812$, factor $(1 - a)/T_s\sqrt{2/(1 + a)} = 0.188/0.0025 \times 1.051 = 79$ per rad, against 75 at 5 ms. Above $1/T_f$ the filter's gain is flat at $K_d/T_f$, so as sampling gets faster the factor tends to $1/T_f = 83$ per rad: the same noise samples, each passed at full high-frequency gain. Fast loops need sensors with low noise, not just fast filters.
:::end

:::exercise
Why might a gyroscope be a better source of $\dot\theta$ than differentiating an angle sensor?
:::solution
A gyro measures rate directly, so its noise isn't amplified by differentiation. Its drawback is bias drift, which doesn't matter for the D term because damping needs the fast part of the rate, not its long-term average.
:::end

## Quiz

:::quiz
- type: num
  q: RMS in rad/s of a raw derivative of 0.0087 rad white noise sampled at 5 ms?
  answer: 2.46
  tol: 0.01
  unit: rad/s
  py: "2**0.5*0.0087/0.005"
  explain: √2 σ/T_s.
- type: num
  q: Filter coefficient a for T_f = 12 ms and T_s = 5 ms?
  answer: 0.659
  tol: 0.002
  py: "__import__('math').exp(-5/12)"
  explain: e^(−T_s/T_f).
- type: num
  q: Factor by which that filter reduces derivative noise RMS?
  answer: 3.78
  tol: 0.01
  py: "2**0.5/((1-__import__('math').exp(-5/12))*(2/(1+__import__('math').exp(-5/12)))**0.5)"
  explain: √2 over (1 − a)√(2/(1 + a)).
- type: num
  q: Phase lag in degrees of a 100 ms filter at 7 rad/s?
  answer: 35.0
  tol: 0.01
  unit: °
  py: "__import__('math').degrees(__import__('math').atan(0.7))"
  explain: arctan(ωT_f).
- type: mc
  q: High-frequency gain of K_d s/(T_f s + 1)?
  options:
    - K_d/T_f
    - infinite
    - zero
    - K_d
  answer: 0
  explain: The filter caps it.
- type: mc
  q: What limits how much you can filter the derivative?
  options:
    - the phase lag erodes the damping
    - the actuator saturates more
    - the integral winds up
    - nothing
  answer: 0
  explain: Damping that arrives late is no damping.
:::end
