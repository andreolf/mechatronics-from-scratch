---
id: p09-l07
minutes: 40
summary: Torque is proportional to current, so a drive that controls current controls torque. You design the inner PI current loop by cancelling the winding's electrical pole, which leaves a first-order closed loop with exactly the bandwidth you choose, then check bandwidth and phase margin in a sampled simulation with a realistic one-sample delay.
---

## Why an inner current loop

The voltage you apply doesn't set the torque directly. The current lags by $L/R$, and the back-EMF subtracts a speed-dependent voltage. Closing a fast loop on current makes the motor behave like a **torque source**: the outer speed or position loop (Phase 13) commands current, and the current loop delivers it regardless of back-EMF, supply variation or winding temperature.

## Pole-zero cancellation

The plant from voltage to current, treating back-EMF as a slow disturbance, is

$$P(s) = \frac{1}{Ls + R}.$$

A PI controller $C(s) = K_p + K_i/s = K_p\,\dfrac{s + K_i/K_p}{s}$ has a zero at $-K_i/K_p$. Put it on the plant's pole, $K_i/K_p = R/L$, and the open loop collapses to an integrator:

$$C(s)P(s) = \frac{K_p}{L s}, \qquad T(s) = \frac{1}{1 + s L/K_p}.$$

So choosing the bandwidth $\omega_c$ gives the gains directly:

$$K_p = L\,\omega_c, \qquad K_i = R\,\omega_c.$$

## Choosing the bandwidth

A digital loop measures current, computes and updates PWM once per period $T_s$. That's about 1.5 sample periods of delay (one for computation, half for the PWM's zero-order hold), which takes away phase margin $\omega_c\cdot1.5T_s$ (in radians). A rule of thumb is $\omega_c \le 2\pi f_s/20$: at 20 kHz, about 1 kHz, leaving roughly 60° of margin.

If $R$ is misestimated (it rises 40 % from cold to hot copper), the zero misses the pole and the response gets a slow tail. The integrator still removes steady error, but the step response loses its clean first-order shape.

:::figure widget=currentloop caption="Current step response with the PI designed by cancellation. Change the bandwidth: the 63 % rise time follows 1/ω_c. Misestimate R: the cancellation fails and a slow tail appears."
:::end

## Worked example

$L = 1$ mH, $R = 1$ Ω, 20 kHz loop, target 1 kHz bandwidth.

1. $\omega_c = 2\pi\cdot1000 = 6283$ rad/s.
2. $K_p = 10^{-3}\cdot6283 = 6.28$ V/A and $K_i = 1\cdot6283 = 6283$ V/(A·s).
3. Delay $1.5\cdot50$ µs $= 75$ µs costs $6283\cdot75\times10^{-6} = 0.471$ rad $= 27°$, so the phase margin is about $90 - 27 = 63°$.
4. A 10 A step reaches 6.3 A after about $1/\omega_c = 159$ µs.

## Code it from scratch

:::code file=current_pi.py
```python
import numpy as np

L, R, Ts = 1e-3, 1.0, 50e-6               # winding and a 20 kHz control loop
a = np.exp(-R * Ts / L)                    # exact discretisation of the RL plant (zero-order hold)

def gains(wc, R_est=R):
    return L * wc, R_est * wc              # Kp, Ki by pole-zero cancellation

def loop_gain(w, Kp, Ki):
    z = np.exp(1j * w * Ts)
    P = (1 - a) / R / (z - a)              # plant
    C = Kp + Ki * Ts * z / (z - 1)         # PI, backward-Euler integrator
    return C * P / z                       # one sample of computation delay

def step(Kp, Ki, n=4000):
    i = I = v_prev = 0.0; out = []
    for _ in range(n):
        e = 1.0 - i; I += Ki * Ts * e; v = Kp * e + I
        i = a * i + (1 - a) / R * v_prev; v_prev = v          # last sample's voltage is applied now
        out.append(i)
    return np.array(out)

if __name__ == "__main__":
    wc = 2 * np.pi * 1000
    Kp, Ki = gains(wc)
    w = np.linspace(10, 2 * np.pi * 9000, 400000)
    Lw = loop_gain(w, Kp, Ki)
    ic = np.argmax(np.abs(Lw) < 1)
    pm = 180 + np.degrees(np.angle(Lw[ic]))
    y = step(Kp, Ki)
    bw_step = 1 / ((np.argmax(y >= 0.632) + 1) * Ts)
    print(f"crossover {w[ic]/2/np.pi:.0f} Hz, phase margin {pm:.1f} deg, 63% rise bandwidth {bw_step/2/np.pi:.0f} Hz")
    assert abs(w[ic] - wc) / wc < 0.10 and abs(bw_step - wc) / wc < 0.10
    assert 55 < pm < 70
    assert abs(y[-1] - 1) < 1e-6                              # integrator removes steady error
    # wrong R estimate: the zero misses the pole and the response creeps
    y_bad = step(*gains(wc, R_est=0.4 * R))
    t_bad = np.argmax(y_bad >= 0.98); t_ok = np.argmax(y >= 0.98)
    print(f"98 % settling: matched {t_ok * Ts * 1e3:.2f} ms, R underestimated {t_bad * Ts * 1e3:.2f} ms")
    assert t_bad > 2 * t_ok
```
:::end

## Exercises

:::exercise
The same drive must control a motor with 10 mH and 4 Ω at the same 1 kHz bandwidth. What are the new gains?
:::solution
$K_p = 0.01\cdot6283 = 62.8$ V/A, $K_i = 4\cdot6283 = 25\,130$ V/(A·s). Check that the bus voltage can deliver it: a 1 A step asks for $K_p\cdot1 = 63$ V at the first instant, so on a 24 V bus the output saturates and you need anti-windup.
:::end

:::exercise
Why does the back-EMF not need to be in the current-loop design?
:::solution
It changes at the mechanical time scale, tens of milliseconds, while the current loop settles in a fraction of a millisecond. To the current loop it's a slowly varying disturbance voltage that the integrator absorbs. Many drives also add it back as feed-forward, $v_{ff} = k\hat\omega$, to make the integrator's job easier.
:::end

## Quiz

:::quiz
- type: num
  q: K_p in V/A for L = 1 mH and ω_c = 6283 rad/s?
  answer: 6.283
  tol: 0.001
  unit: V/A
  py: "1e-3*2*math.pi*1000"
  explain: K_p = L·ω_c.
- type: num
  q: K_i in V/(A·s) for R = 1 Ω at the same bandwidth?
  answer: 6283
  tol: 0.001
  py: "1*2*math.pi*1000"
  explain: K_i = R·ω_c.
- type: num
  q: Phase lost in degrees to 75 µs of delay at 1 kHz crossover?
  answer: 27.0
  tol: 0.01
  unit: °
  py: "math.degrees(2*math.pi*1000*75e-6)"
  explain: ω_c·T_d.
- type: num
  q: Time in µs to reach 63 % of a step at ω_c = 6283 rad/s?
  answer: 159.2
  tol: 0.002
  unit: µs
  py: "1e6/(2*math.pi*1000)"
  explain: 1/ω_c for a first-order loop.
- type: num
  q: Rule-of-thumb maximum current-loop bandwidth in Hz for a 20 kHz loop?
  answer: 1000
  tol: 0.001
  unit: Hz
  py: "20000/20"
  explain: f_s/20.
- type: mc
  q: Pole-zero cancellation places the PI zero…
  options:
    - at the origin
    - on the plant pole at −R/L
    - at the PWM frequency
    - at the crossover frequency
  answer: 1
  explain: K_i/K_p = R/L.
:::end

:::verify
import math
assert abs(90 - math.degrees(2*math.pi*1000*75e-6) - 63) < 0.5
:::end
