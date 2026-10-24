---
id: p07-l18
minutes: 35
summary: The gyro is smooth but drifts; the accelerometer is absolute but noisy and fooled by acceleration. A complementary filter takes the low frequencies from one and the high frequencies from the other, with filters that sum to one. You derive it, choose the time constant, and show the fused tilt beats both sensors.
---

## Two flawed sensors

From lessons 9 and 10:

- **Accelerometer tilt** is right on average (no drift) but noisy, and wrong whenever the device accelerates. Its errors are **high-frequency**.
- **Integrated gyro** is smooth and ignores acceleration, but its bias makes it drift. Its errors are **low-frequency**.

So low-pass the accelerometer, high-pass the gyro angle, and add them. If the two filters sum to one,

$$H_{lp}(s) + H_{hp}(s) = \frac{1}{\tau s + 1} + \frac{\tau s}{\tau s + 1} = 1,$$

the true angle passes through undistorted at every frequency, and each sensor contributes only where it's good. That's a **complementary filter**.

## The one-line implementation

Discretise with sample time $\Delta t$ and $\alpha = \tau/(\tau + \Delta t)$:

$$\hat\theta_k = \alpha\left(\hat\theta_{k-1} + \omega_k\Delta t\right) + (1 - \alpha)\,\theta_{acc,k}.$$

Integrate the gyro, then nudge the result a little toward the accelerometer each step. The time constant $\tau$ sets the crossover:

- **Shorter τ** trusts the accelerometer more: less drift, more noise, and more sensitivity to acceleration.
- **Longer τ** trusts the gyro more: smoother, but bias errors decay more slowly. A constant gyro bias $b$ leaves a steady error of $b\tau$.

A τ of 0.5–2 s is typical for a small drone or balancing robot. The Kalman filter (Phase 14) chooses that blend optimally from the noise statistics, and it estimates the gyro bias too.

:::figure widget=compfilter caption="Pitch from the gyro alone (red), the accelerometer alone (blue) and the complementary filter (lime), against truth (dashed). A 1 s push at t = 10 s fools the accelerometer, but barely moves the fused estimate."
:::end

## Worked example

200 Hz sampling, τ = 0.5 s, gyro bias 1.5 °/s.

1. $\alpha = 0.5/(0.5 + 0.005) = 0.9901$.
2. Steady bias error: $1.5\times0.5 = 0.75°$. Without the filter, the gyro alone drifts 30° in 20 s.
3. Accelerometer noise of 4° rms is low-passed with a 0.5 s time constant. Its bandwidth is $1/(2\pi\tau) = 0.32$ Hz, against a 100 Hz Nyquist band, so the noise shrinks by roughly $\sqrt{0.32\times\pi/2/100} = 0.07$, to about 0.3°.
4. The live quadrotor lab (linked at the top of this lesson) uses exactly this kind of attitude estimate.

## Code it from scratch

:::code file=complementary.py
```python
import numpy as np

rng = np.random.default_rng(18)
FS = 200.0
DT = 1 / FS

def simulate(T=20.0, bias=1.5, gyro_noise=0.5, acc_noise=4.0):
    t = np.arange(0, T, DT)
    theta = 30 * np.sin(2 * np.pi * 0.2 * t) * (t > 2)
    rate = np.gradient(theta, DT)
    gyro = rate + bias + gyro_noise * rng.standard_normal(t.size)
    push = np.where((t > 10) & (t < 11), 15.0, 0.0)          # a forward acceleration seen as tilt
    acc = theta + acc_noise * rng.standard_normal(t.size) + push
    return t, theta, gyro, acc

def complementary(gyro, acc, tau):
    a = tau / (tau + DT)
    est = np.empty_like(acc)
    est[0] = acc[0]
    for k in range(1, len(acc)):
        est[k] = a * (est[k - 1] + gyro[k] * DT) + (1 - a) * acc[k]
    return est

def rms(e):
    return float(np.sqrt(np.mean(e ** 2)))

if __name__ == "__main__":
    t, theta, gyro, acc = simulate()
    gyro_only = theta[0] + np.cumsum(gyro) * DT
    fused = complementary(gyro, acc, tau=0.5)
    e_g, e_a, e_f = rms(gyro_only - theta), rms(acc - theta), rms(fused - theta)
    print(f"rms error: gyro {e_g:.2f} deg, accelerometer {e_a:.2f} deg, complementary {e_f:.2f} deg")
    assert e_f < e_a and e_f < e_g
    # the two filters sum to one at every frequency
    w = np.logspace(-2, 2, 50)
    tau = 0.5
    lp, hp = 1 / (1j * w * tau + 1), 1j * w * tau / (1j * w * tau + 1)
    assert np.allclose(lp + hp, 1)
    # steady-state error from a constant bias is bias * tau
    still = complementary(np.full(20_000, 1.5), np.zeros(20_000), tau=0.5)
    assert abs(still[-1] - 1.5 * 0.5) < 0.01
    assert abs(0.5 / (0.5 + DT) - 0.9901) < 1e-4
```
:::end

## Exercises

:::exercise
Your robot accelerates hard for 3 s at a time. Which way should you move τ, and what do you give up?
:::solution
Lengthen τ well beyond 3 s, so the accelerometer's acceleration-induced error is filtered out. You give up drift rejection: the bias error $b\tau$ grows, so estimate the gyro bias at rest first (lesson 10).
:::end

:::exercise
Show that a constant gyro bias $b$ gives a steady error of $b\tau$.
:::solution
In steady state with zero true angle and zero accelerometer reading, $\hat\theta = \alpha(\hat\theta + b\Delta t)$, so $\hat\theta = \alpha b\Delta t/(1 - \alpha)$. With $\alpha = \tau/(\tau + \Delta t)$, $\alpha/(1-\alpha) = \tau/\Delta t$, giving $\hat\theta = b\tau$.
:::end

## Quiz

:::quiz
- type: num
  q: α for τ = 0.5 s at 200 Hz?
  answer: 0.9901
  tol: 0.001
  py: "0.5/(0.5+0.005)"
  explain: τ/(τ + Δt).
- type: num
  q: Steady error in degrees from a 1.5 °/s gyro bias with τ = 0.5 s?
  answer: 0.75
  tol: 0.001
  unit: °
  py: "1.5*0.5"
  explain: bτ.
- type: mc
  q: In a complementary filter, the gyro contributes…
  options:
    - the low frequencies
    - the high frequencies
    - only the bias
    - nothing
  answer: 1
  explain: Its errors are low-frequency drift.
- type: mc
  q: The two filters must sum to one so that…
  options:
    - noise doubles
    - the true signal passes undistorted at every frequency
    - the gyro bias vanishes
    - α is zero
  answer: 1
  explain: That's what complementary means.
- type: num
  q: Crossover frequency in Hz for τ = 0.5 s?
  answer: 0.31831
  tol: 0.002
  unit: Hz
  py: "1/(2*math.pi*0.5)"
  explain: 1/(2πτ).
- type: num
  q: Gyro-only drift in degrees after 20 s with a 1.5 °/s bias?
  answer: 30
  tol: 0.001
  unit: °
  py: "1.5*20"
  explain: Linear growth.
:::end

:::verify
assert abs(0.5/(0.5+0.005) - 0.990099) < 1e-6
:::end
