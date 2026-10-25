---
id: p20-l09
minutes: 45
summary: Quadcopters fly on two nested loops. You design a fast rate loop that turns rate error into torque through lagging motors and a loop delay, put a slower attitude loop around it, check both phase and gain margins, and see what goes wrong when the outer loop is pushed too close to the inner one.
---

## Two loops, two speeds

The gyro gives the body rate directly and cleanly, so the inner loop controls **rate**: a PID turns the rate error into a torque command, the mixer of Lesson 07 turns that into thrusts. Around it, a P controller turns the **attitude** error into a rate setpoint, $p_{ref} = k_a(\phi_{ref} - \hat\phi)$. Per axis, with motor lag $\tau_m$ and loop delay $T_d$,

$$L_{rate}(s) = C(s)\,\frac{e^{-sT_d}}{\tau_m s + 1}\,\frac{1}{I_{xx} s},\qquad L_{att}(s) = \frac{k_a}{s}\,\frac{L_{rate}}{1 + L_{rate}}.$$

The outer loop sees the closed inner loop as a fast actuator only if its crossover is several times lower: a separation of 4 to 10 times is the usual rule. Push it closer and the inner loop's lag eats the outer loop's phase margin.

:::figure widget=cascade caption="Roll step through the cascaded loops. Change the rate and attitude gains, the motor lag and the delay; the readout gives both crossovers, margins and the overshoot."
:::end

## Worked example

Roll axis of the Lesson 07 quad, $I_{xx} = 0.012$ kg·m², motor lag 20 ms, delay 6 ms, 500 Hz, torque limit 1.5 N·m; rate PID $k_p = 0.36$, $k_i = 1.0$, $k_d = 0.004$; attitude $k_a = 6$:

1. Rate loop: crossover 27.8 rad/s, phase margin 62.4°, gain margin 17.1 dB, delay margin 39.1 ms.
2. Attitude loop: crossover 6.54 rad/s, phase margin 78.6°, gain margin 20.0 dB; separation 4.3 times.
3. A 20° roll step reaches 90 % in 321 ms with no overshoot (−0.2 %), is within 2 % after 655 ms, ends at 19.96°, and peaks at 0.567 N·m of torque, well inside the limit.
4. Raising $k_a$ to 25 moves the attitude crossover to 24.9 rad/s, next to the rate loop: phase margin drops to 37.3° and the step overshoots by 26.2 %.

## Code it from scratch

:::code file=cascaded_control.py
```python
import numpy as np

Ixx, TAU_M, DELAY, T = 0.012, 0.02, 0.006, 0.002     # roll inertia, motor lag (s), sensing + compute delay (s), 500 Hz loop
TAU_MAX = 1.5                                          # largest roll torque at hover (Lesson 07)
KP_R, KI_R, KD_R = 0.36, 1.0, 0.004                    # rate loop PID, torque per rad/s of rate error
KP_A = 6.0                                             # attitude loop P, rad/s of rate per rad of angle error

def rate_controller(s): return KP_R + KI_R / s + KD_R * s / (1 + s / 200)       # derivative filtered at 200 rad/s
def actuator(s): return np.exp(-DELAY * s) / (TAU_M * s + 1)
def body(s): return 1 / (Ixx * s)                     # torque -> roll rate

def L_inner(s): return rate_controller(s) * actuator(s) * body(s)
def T_inner(s): L = L_inner(s); return L / (1 + L)
def L_outer(s): return KP_A * T_inner(s) / s           # attitude error -> rate setpoint -> roll rate -> angle

def margins(L, w=np.logspace(-1, 3.5, 40000)):
    Lw = L(1j * w); mag, ph = np.abs(Lw), np.unwrap(np.angle(Lw))
    i = np.where(np.diff(np.sign(mag - 1)))[0][0]; wc = w[i]; pm = 180 + np.degrees(ph[i])
    j = np.where(np.diff(np.sign(ph + np.pi)))[0]; gm = -20 * np.log10(mag[j[0]]) if len(j) else np.inf
    return wc, pm, gm, np.radians(pm) / wc

def step(target_deg=20, t_end=1.5, dt=1e-4):
    """time simulation with saturation and the delay as a buffer: roll step through both loops"""
    n_del = int(round(DELAY / dt)); buf = [0.0] * (n_del + 1); phi = p = tau = integ = d_f = 0.0; prev_e = 0.0
    u = 0.0; log = []; sub = int(T / dt)
    for k in range(int(t_end / dt)):
        if k % sub == 0:
            p_ref = KP_A * (np.radians(target_deg) - phi)
            e = p_ref - p; integ += e * T
            d_f += T * 200 * ((e - prev_e) / T - d_f); prev_e = e
            u_raw = KP_R * e + KI_R * integ + KD_R * d_f; u = np.clip(u_raw, -TAU_MAX, TAU_MAX)
            if u != u_raw: integ -= e * T                # anti-windup: stop integrating while saturated
        buf.append(u); u_del = buf.pop(0)
        tau += dt / TAU_M * (u_del - tau); p += dt * tau / Ixx; phi += dt * p
        log.append((k * dt, np.degrees(phi), tau))
    return np.array(log)

def test_loops():
    wi, pmi, gmi, dmi = margins(L_inner); wo, pmo, gmo, dmo = margins(L_outer)
    print(f"rate loop: crossover {wi:.1f} rad/s, phase margin {pmi:.1f} deg, gain margin {gmi:.1f} dB, delay margin {1000 * dmi:.1f} ms")
    print(f"attitude loop: crossover {wo:.2f} rad/s, phase margin {pmo:.1f} deg, gain margin {gmo:.1f} dB, delay margin {1000 * dmo:.1f} ms")
    print(f"bandwidth separation: {wi / wo:.1f}x")
    assert pmi > 45 and gmi > 6 and pmo > 45 and gmo > 6 and wi / wo > 4
    log = step(); t, phi, tau = log.T; final = phi[-1]
    over = 100 * (phi.max() - 20) / 20; t90 = t[np.argmax(phi >= 18)]
    settle = t[np.where(np.abs(phi - 20) > 0.4)[0][-1]]
    print(f"20 deg step: rise to 90 % in {1000 * t90:.0f} ms, overshoot {over:.1f} %, within 2 % after {1000 * settle:.0f} ms, "
          f"final {final:.2f} deg, peak torque {np.abs(tau).max():.3f} N m")
    assert over < 10 and abs(final - 20) < 0.2 and np.abs(tau).max() <= TAU_MAX + 1e-9

def test_bad_tuning():
    global KP_A
    keep = KP_A; KP_A = 25.0                            # outer loop too close to the inner loop
    wo, pmo, gmo, _ = margins(L_outer); log = step(); over = 100 * (log[:, 1].max() - 20) / 20
    print(f"attitude P 25: crossover {wo:.1f} rad/s, phase margin {pmo:.1f} deg, overshoot {over:.1f} %")
    assert pmo < 45 and over > 10
    KP_A = keep

test_loops(); test_bad_tuning(); print("PASS")
```
:::end

## In practice

PX4 uses exactly this structure: `MC_ROLLRATE_P/I/D` for the rate loop and `MC_ROLL_P` for the attitude loop, tuned from the inside out. Its autotuner identifies the plant and sets the rate gains, and flight logs give step responses to check against margins like these. Try the step on the site's [live quadcopter lab](#lab-quad).

## Exercises

:::exercise
Why tune the rate loop first?
:::solution
The attitude loop's plant is the closed rate loop. If the rate loop changes, the outer loop's margins change with it; tuning from the inside out keeps each step well defined.
:::end

:::exercise
A 0.2 N·m gust lasts long. What steady roll error does the cascade hold before the integrator acts?
:::solution
The stiffness is $k_a k_p = 6 \times 0.36 = 2.16$ N·m/rad, so $0.2 / 2.16 = 0.093$ rad, 5.3°. The rate integrator then slowly removes it.
:::end

## Quiz

:::quiz
- type: num
  q: Bandwidth separation of 27.8 and 6.54 rad/s?
  answer: 4.25
  tol: 0.005
  py: "27.8/6.54"
  explain: Ratio of crossovers.
- type: num
  q: Delay margin for 62.4° at 27.8 rad/s (ms)?
  answer: 39.2
  tol: 0.005
  py: "1000*math.radians(62.4)/27.8"
  explain: φm/ωc.
- type: num
  q: Phase lag of a 20 ms motor at 27.8 rad/s (degrees)?
  answer: 29.08
  tol: 0.005
  py: "math.degrees(math.atan(0.02*27.8))"
  explain: atan(ωτ).
- type: num
  q: Phase lag of a 6 ms delay at 27.8 rad/s (degrees)?
  answer: 9.56
  tol: 0.005
  py: "math.degrees(0.006*27.8)"
  explain: ωTd in degrees.
- type: mc
  q: What happens when the attitude crossover approaches the rate crossover?
  options: ["The outer phase margin falls and the step overshoots", "The drone becomes slower", "Nothing, the loops are independent", "The rate loop becomes unstable"]
  answer: 0
  explain: The inner loop's lag is no longer negligible.
- type: mc
  q: Why does the inner loop control rate rather than angle?
  options: ["The gyro measures rate directly with little lag and noise", "Angles cannot be measured", "Rate loops need no tuning", "The mixer needs rates"]
  answer: 0
  explain: The fastest, cleanest signal goes in the inner loop.
:::end
