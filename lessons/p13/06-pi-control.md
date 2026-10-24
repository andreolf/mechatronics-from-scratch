---
id: p13-l06
minutes: 35
summary: Adding integral action to a proportional controller puts a pole at the origin of the loop, which raises the system type by one and drives the steady-state error to a step, and to a constant load, all the way to zero. You derive the PI controller's transfer function and where to place its zero, simulate the live lab's motor speed loop with and without the integral, and test that the speed error after a reference step and after a load step decays to zero.
---

## The integral term

$$u = K_pe + K_i\int e\,dt, \qquad C(s) = K_p + \frac{K_i}{s} = \frac{K_ps + K_i}{s}.$$

The PI controller adds a pole at $s = 0$ and a zero at $s = -K_i/K_p$. The pole makes $L(s)$ type 1, so $K_p^{loop} = \infty$ and the step error is zero (lesson 04).

Why it works physically: as long as any error remains, the integral keeps growing and pushes the voltage further. The only steady state is $e = 0$, with the integrator holding exactly the voltage the load needs.

The cost is phase: the integrator adds up to 90° of lag below the zero frequency. Put the zero below the crossover frequency so the lag is mostly gone by the time it matters; a common start is $K_i/K_p \approx \omega_c/5$.

## The lab's speed loop

The [live motor lab](#lab-motor) runs a PI loop with $K_p = 0.12$ V per rad/s and $K_i = 2.5$ V per rad (illustrative values), so the zero is at $-20.8$ rad/s. Turn the integral off in the lab and the speed settles below its target under load; turn it on and the error vanishes.

:::figure widget=pispeed caption="The motor speed after a reference step at 0 s and a load step at 1 s, with P only and with PI. With the integral on, both errors decay to zero; with P only, each leaves an offset."
:::end

## Worked example

Motor as in lesson 05, physical units.

1. P only, $K_p = 0.12$: loop DC gain $0.12 \times 19.81 = 2.38$, so a step error of $1/3.38 = 30$ %, plus a load droop.
2. PI: closed-loop characteristic polynomial $s\,a(s) + k(K_ps + K_i) = 0$, which is $4\times10^{-7}s^3 + 2.4\times10^{-4}s^2 + 8.52\times10^{-3}s + 0.125$. Routh: $2.4\times10^{-4} \times 8.52\times10^{-3} > 4\times10^{-7} \times 0.125$, so it's stable.
3. Load step $\tau_L = 0.05$ N·m: P only droops by $\tau_L/(\beta + kK_p/R) = 0.05/0.0071 = 7.0$ rad/s; PI recovers fully.

## Code it from scratch

:::code file=pi.py
```python
import numpy as np

R, L, k, J, b = 1.2, 0.002, 0.05, 2e-4, 2e-5
Kp, Ki = 0.12, 2.5

def simulate(use_i, w_ref=200.0, load=0.05, t_load=1.0, T=2.0, dt=5e-5):
    i = w = integ = 0.0; out = []
    for n in range(int(T / dt)):
        t = n * dt
        e = w_ref - w
        if use_i: integ += e * dt
        V = Kp * e + (Ki * integ if use_i else 0.0)
        tl = load if t >= t_load else 0.0
        f = lambda s: np.array([(V - R * s[0] - k * s[1]) / L, (k * s[0] - b * s[1] - tl) / J])
        s = np.array([i, w])
        k1 = f(s); k2 = f(s + dt / 2 * k1); k3 = f(s + dt / 2 * k2); k4 = f(s + dt * k3)
        i, w = s + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4); out.append(w)
    return np.arange(len(out)) * dt, np.array(out)

def test_closed_loop_stable():
    a = np.array([L * J, L * b + R * J, R * b + k * k])
    cl = np.polyadd(np.polymul([1, 0], a), [0, 0, k * Kp, k * Ki])
    print("closed-loop poles:", np.round(np.roots(cl), 1))
    assert np.all(np.roots(cl).real < 0)
    assert cl[1] * cl[2] > cl[0] * cl[3]                    # Routh condition for a cubic

def test_zero_error_with_integral():
    t, w = simulate(True)
    e_ref = 200 - w[np.searchsorted(t, 0.99)]
    e_load = 200 - w[-1]
    print(f"PI: error before the load {e_ref:.2e} rad/s, after the load {e_load:.2e} rad/s")
    assert abs(e_ref) < 1e-3 and abs(e_load) < 1e-3

def test_p_only_leaves_offsets():
    t, w = simulate(False)
    G0 = k / (R * b + k * k); Lg = Kp * G0
    e_ref = 200 - w[np.searchsorted(t, 0.99)]
    pred_ref = 200 / (1 + Lg)
    pred_droop = 0.05 / (k * k / R + b + k * Kp / R)
    droop = w[np.searchsorted(t, 0.99)] - w[-1]
    print(f"P only: reference error {e_ref:.1f} rad/s (predicted {pred_ref:.1f}), load droop {droop:.2f} (predicted {pred_droop:.2f})")
    assert abs(e_ref - pred_ref) < 0.05 and abs(droop - pred_droop) < 0.05

test_closed_loop_stable()
test_zero_error_with_integral()
test_p_only_leaves_offsets()
print("PASS")
```
:::end

## Exercises

:::exercise
Where is the PI zero, and roughly where should crossover be for the lab's tuning to have the integral's lag mostly gone?
:::solution
At $-K_i/K_p = -20.8$ rad/s. With the rule of thumb of a factor of 5, crossover should be at 100 rad/s or more. The loop's gain crossover with these values is about $K_pG(0)\times10.7 \approx 25$ rad/s, near the zero, so the integral's lag still matters and the response overshoots somewhat (the closed-loop poles are at hBHc18.4 \pm 14.7j$). Try a smaller $K_i$ in the lab to see it calm down.
:::end

:::exercise
Why does integral action fix a constant load torque but not a ramp in load?
:::solution
With one integrator, a constant disturbance needs a constant voltage correction, which the integrator can hold with zero error. A ramping load needs a ramping voltage, and the integrator can only ramp if its input, the error, is a non-zero constant. Two integrators would be needed for zero error.
:::end

## Quiz

:::quiz
- type: num
  q: Zero location in rad/s of a PI with K_p = 0.12 and K_i = 2.5 (give the magnitude)?
  answer: 20.83
  tol: 0.002
  unit: rad/s
  py: "2.5/0.12"
  explain: K_i/K_p.
- type: num
  q: Steady error in % of P-only control with loop DC gain 2.38?
  answer: 29.6
  tol: 0.01
  unit: "%"
  py: "100/(1+2.38)"
  explain: 1/(1 + K).
- type: num
  q: P-only load droop in rad/s for 0.05 N·m (β + kK_p/R = 0.007103)?
  answer: 7.04
  tol: 0.01
  unit: rad/s
  py: "0.05/0.007103"
  explain: τ_L over the total damping.
- type: num
  q: Steady error with PI against a constant load?
  answer: 0
  tol: 0
  py: "0"
  explain: Type 1 rejects constants.
- type: mc
  q: The PI controller adds…
  options:
    - a pole at the origin and a zero at −K_i/K_p
    - two zeros
    - a pole at −K_i/K_p
    - only gain
  answer: 0
  explain: C(s) = (K_p s + K_i)/s.
- type: mc
  q: The price of integral action is…
  options:
    - phase lag that reduces stability margins
    - steady error
    - lower DC gain
    - slower rejection of noise only
  answer: 0
  explain: Up to 90° lag below the zero.
:::end
