---
id: p09-l09
minutes: 40
summary: An open-loop stepper has no idea where its rotor is, so if the load or the acceleration asks for more than the holding torque, it slips and never knows. You model the rotor as a nonlinear torsional spring and mass, find its natural frequency, and simulate a move to show that steps are lost exactly when the required torque exceeds the pull-out torque.
---

## The rotor is a spring and a mass

From lesson 8, the rotor feels $T = -T_h\sin(N_r\delta)$ when it's $\delta$ away from the commanded position $\theta_c(t)$. With inertia $J$ and a little damping $b$:

$$J\ddot\theta = -T_h\sin\!\big(N_r(\theta - \theta_c)\big) - b\dot\theta - T_L.$$

For small errors this is a spring with stiffness $K = T_hN_r$, so the rotor rings at

$$\omega_n = \sqrt{\frac{T_hN_r}{J}}.$$

Every step is a small kick. If the step rate is near $\omega_n/2\pi$ steps per second, the kicks pump energy into the oscillation (**low-speed resonance**). At higher speeds the electrical time constant and the drive's chopping cause **mid-band resonance** too. Microstepping (smaller kicks), mechanical dampers and drives with active damping all help.

## Pull-out: when torque runs out

To follow the command while accelerating at $\alpha$ against a load, the motor must supply $J\alpha + T_L$. The spring can't give more than $T_h$, so the condition to stay in step is

$$J\alpha + T_L < T_h.$$

That's the static condition. A trapezoidal speed profile switches the acceleration on and off abruptly, which is a *step* in the torque the spring must supply, and a lightly damped spring overshoots a step to twice its static deflection. So with abrupt ramps the rotor stays in step only if

$$2J\alpha + T_L < T_h,$$

and the overshoot is also why it rings after every move. **Jerk-limited (S-curve) ramps** bring the acceleration in gradually, avoid the overshoot and recover most of the factor of two.

In practice the available torque also falls with speed, because the winding inductance limits how fast the current can reverse, so datasheets give a **pull-out torque curve** against step rate. Leave a safety margin of 30–50 %.

When the rotor slips, it falls back by whole electrical cycles, 4 full steps at a time, and an open-loop controller keeps counting as if nothing happened. Above a critical speed it can't catch up at all and stalls while the windings buzz. The remedies are a gentler acceleration ramp, more torque, or an encoder (a "closed-loop stepper" detects the slip).

:::figure widget=steppermiss caption="Rotor lag behind the command during an accelerating move. Watch it ring when the ramp starts and ends. Increase the acceleration or the load: once the overshoot passes the holding torque, the lag jumps past whole electrical cycles and the motor stalls."
:::end

## Worked example

$T_h = 0.5$ N·m, $N_r = 50$, rotor plus load $J = 5\times10^{-5}$ kg·m², load 0.1 N·m.

1. $\omega_n = \sqrt{0.5\cdot50/5\times10^{-5}} = 707$ rad/s, or 112.5 Hz. Running near 112 full steps per second (0.56 rev/s) excites it.
2. Damping ratio: with $b = 2\times10^{-3}$ N·m·s, $\zeta = b/(2\sqrt{T_hN_rJ}) = 0.028$. It's barely damped.
3. Static limit: $\alpha < (0.5 - 0.1)/5\times10^{-5} = 8000$ rad/s².
4. With an abrupt trapezoidal ramp: $\alpha < (0.5 - 0.1)/(2\cdot5\times10^{-5}) = 4000$ rad/s². Reaching 60 rad/s (9.5 rev/s) then takes 15 ms.

## Code it from scratch

:::code file=stepper_slip.py
```python
import numpy as np

TH, NR, J, B = 0.5, 50, 5e-5, 2e-3
STEP = 2 * np.pi / 200

def move(acc, TL, w_top=60.0, T=0.15, dt=1e-5):
    """Accelerating move; returns the final lag in full steps."""
    th = om = 0.0; ta = w_top / acc
    for k in range(int(T / dt)):
        t = k * dt
        tc = 0.5 * acc * t * t if t < ta else 0.5 * acc * ta * ta + w_top * (t - ta)
        Tm = -TH * np.sin(NR * (th - tc))
        Tl = TL * np.sign(om) if abs(om) > 1e-6 else np.clip(Tm, -TL, TL)   # load opposes motion (or sticks)
        om += dt * (Tm - B * om - Tl) / J
        th += dt * om
    return (tc - th) / STEP

def natural_frequency():
    return np.sqrt(TH * NR / J)

if __name__ == "__main__":
    print(f"natural frequency {natural_frequency():.1f} rad/s = {natural_frequency()/2/np.pi:.1f} Hz")
    for acc, TL in [(3000, 0.1), (5000, 0.1), (2000, 0.2), (9000, 0.1), (12000, 0.0), (2000, 0.45)]:
        need = J * acc + TL
        lag = move(acc, TL)
        lost = int(4 * round(lag / 4))
        print(f"acc {acc:>5}, load {TL:.2f}: needs {need:.2f} N*m ({100*need/TH:.0f} % of T_h), lag {lag:6.2f} steps, lost {lost}")
        if 2 * J * acc + TL < 0.9 * TH:                # abrupt ramp: overshoot doubles the acceleration torque
            assert lost == 0 and abs(lag) < 1           # stays in step, lag under one full step
        if need > 1.05 * TH:                            # even the static condition fails
            assert lost >= 4                             # slips by at least one electrical cycle
```
:::end

## Exercises

:::exercise
The same motor drives a lead screw that adds $2\times10^{-5}$ kg·m² of reflected inertia. What happens to the natural frequency and the safe acceleration with the 0.1 N·m load?
:::solution
$J = 7\times10^{-5}$, so $\omega_n = \sqrt{25/7\times10^{-5}} = 598$ rad/s (95 Hz). The static limit becomes $0.4/7\times10^{-5} = 5714$ rad/s², and with an abrupt ramp half that, 2857 rad/s².
:::end

:::exercise
Why does a slipping stepper lose steps in groups of four?
:::solution
The torque $-T_h\sin(N_r\delta)$ is periodic with one tooth pitch, $2\pi/N_r$, which is one electrical cycle or 4 full steps. When the rotor slips past the unstable point it falls into the next stable equilibrium, a whole tooth behind.
:::end

## Quiz

:::quiz
- type: num
  q: Natural frequency in Hz (T_h = 0.5 N·m, N_r = 50, J = 5e-5 kg·m²)?
  answer: 112.5
  tol: 0.002
  unit: Hz
  py: "math.sqrt(0.5*50/5e-5)/(2*math.pi)"
  explain: √(T_h N_r/J)/2π.
- type: num
  q: Maximum acceleration in rad/s² with a 0.1 N·m load?
  answer: 8000
  tol: 0.001
  unit: rad/s²
  py: "(0.5-0.1)/5e-5"
  explain: (T_h − T_L)/J.
- type: num
  q: Maximum acceleration in rad/s² with an abrupt ramp (same motor and load)?
  answer: 4000
  tol: 0.001
  unit: rad/s²
  py: "(0.5-0.1)/(2*5e-5)"
  explain: The step overshoot doubles J·α.
- type: num
  q: Full steps lost per slip?
  answer: 4
  tol: 0.001
  py: "4"
  explain: One electrical cycle.
- type: num
  q: Small-angle stiffness in N·m/rad?
  answer: 25
  tol: 0.001
  unit: N·m/rad
  py: "0.5*50"
  explain: T_h·N_r.
- type: mc
  q: An open-loop stepper that misses steps…
  options:
    - stops and raises an error
    - keeps counting as if it hadn't, so its position is wrong
    - automatically retries
    - recalibrates at the next step
  answer: 1
  explain: It has no position feedback.
:::end

:::verify
import math
assert abs(2e-3/(2*math.sqrt(0.5*50*5e-5)) - 0.028) < 0.001
assert abs(math.sqrt(25/7e-5) - 598) < 1
:::end
