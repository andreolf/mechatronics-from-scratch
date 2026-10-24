---
id: p13-l18
minutes: 35
summary: Feedforward acts on what you already know, such as the reference trajectory or a measurable disturbance like gravity, so the controller does not have to wait for an error to appear before responding. You derive inverse-plant and disturbance feedforward, add gravity compensation and then full inverse dynamics to a PD-controlled arm joint, and test that the tracking error falls by more than half with gravity feedforward and further with the full model.
---

## Feedback waits; feedforward doesn't

Feedback responds only after an error exists. For a known reference $r(t)$ and plant $G$, the input that produces $y = r$ exactly is $u_{ff} = G^{-1}r$. Add it to the feedback:

$$u = u_{ff} + C(r - y).$$

If the model is perfect, the error stays zero and the feedback has nothing to do. If not, feedback corrects the remainder, which is much smaller than the full signal. Feedforward doesn't change stability: it's outside the loop.

**Disturbance feedforward**: if a disturbance $d$ can be measured or computed, cancel it at the input. Gravity on a robot joint is the classic case: it's known from the joint angle.

## An arm joint

A single link of inertia $J$ about its joint, gravity torque $mg\ell\sin\theta$, viscous friction $b$:

$$J\ddot\theta = \tau - mg\ell\sin\theta - b\dot\theta.$$

Three controllers, all with the same PD feedback $K_p(\theta_r - \theta) + K_d(\dot\theta_r - \dot\theta)$:

1. PD only;
2. PD + gravity feedforward $mg\ell\sin\theta_r$;
3. PD + full inverse dynamics $J\ddot\theta_r + b\dot\theta_r + mg\ell\sin\theta_r$ (computed-torque feedforward).

:::figure widget=feedforward caption="An arm joint tracking a swinging trajectory with PD feedback alone, with gravity feedforward, and with the full inverse model. The tracking error shrinks at each step; untick model accuracy to see what a 20 % mass error leaves."
:::end

## Worked example

Illustrative joint: $J = 0.05$ kg·m², $mg\ell = 1.47$ N·m (0.5 kg at 0.3 m), $b = 0.01$ N·m·s; PD $K_p = 20$ N·m/rad, $K_d = 2$ N·m·s/rad. Reference $\theta_r = 1 + 0.6\sin t$ rad.

1. Static error from gravity alone at $\theta = 1$ rad with PD: $mg\ell\sin 1/K_p = 1.24/20 = 0.062$ rad, 3.5°.
2. Gravity feedforward removes that offset; what's left comes from the inertia and friction the PD must supply as the arm swings.
3. Inverse dynamics leaves only the error from the initial condition, which decays.

## Code it from scratch

:::code file=feedforward.py
```python
import numpy as np

J, mgl, b = 0.05, 0.5 * 9.81 * 0.3, 0.01
Kp, Kd = 20.0, 2.0
ref = lambda t: (1 + 0.6 * np.sin(t), 0.6 * np.cos(t), -0.6 * np.sin(t))

def run(mode, model_scale=1.0, T=20.0, dt=1e-3):
    th, om = 1.0, 0.6; errs = []
    for k in range(int(T / dt)):
        t = k * dt
        r, rd, rdd = ref(t)
        tau = Kp * (r - th) + Kd * (rd - om)
        if mode in ("gravity", "full"): tau += model_scale * mgl * np.sin(r)
        if mode == "full": tau += model_scale * J * rdd + b * rd
        f = lambda s: np.array([s[1], (tau - mgl * np.sin(s[0]) - b * s[1]) / J])
        s = np.array([th, om])
        k1 = f(s); k2 = f(s + dt / 2 * k1); k3 = f(s + dt / 2 * k2); k4 = f(s + dt * k3)
        th, om = s + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4)
        errs.append(ref(t + dt)[0] - th)
    e = np.array(errs)
    return np.sqrt(np.mean(e[len(e) // 4:] ** 2))      # RMS after the start-up transient

def test_error_reduced_by_feedforward():
    e_pd, e_g, e_full = run("pd"), run("gravity"), run("full")
    print(f"RMS tracking error: PD {np.degrees(e_pd):.2f} deg, + gravity {np.degrees(e_g):.2f} deg, + inverse dynamics {np.degrees(e_full):.4f} deg")
    assert e_g < 0.5 * e_pd                              # more than 50 % reduction
    assert e_full < 0.01 * e_pd

def test_model_error_still_helps():
    e_pd, e_bad = run("pd"), run("full", model_scale=0.8)
    print(f"inverse dynamics with a 20 % low model: {np.degrees(e_bad):.2f} deg ({e_bad / e_pd:.0%} of PD alone)")
    assert e_bad < 0.5 * e_pd

def test_static_offset():
    assert abs(mgl * np.sin(1.0) / Kp - 0.0619) < 1e-3

test_error_reduced_by_feedforward()
test_model_error_still_helps()
test_static_offset()
print("PASS")
```
:::end

## Exercises

:::exercise
Why use $\sin\theta_r$ (the reference) rather than $\sin\theta$ (the measurement) in the gravity feedforward?
:::solution
Both work. Using the reference keeps the feedforward a pure function of the plan, free of sensor noise and outside the loop, so it can't affect stability. Using the measurement cancels gravity exactly even when tracking is off, but puts a nonlinear term in the feedback path. Robot controllers use both, depending on noise and model quality.
:::end

:::exercise
A temperature loop knows the flow rate of cold water entering a tank. How would you use it?
:::solution
Disturbance feedforward: compute the heat the cold flow removes, $\dot m c_p(T_{set} - T_{in})$, and add that heater power directly. The temperature controller then corrects only what the calculation gets wrong, instead of waiting for the temperature to drop.
:::end

## Quiz

:::quiz
- type: num
  q: Gravity torque in N·m of 0.5 kg at 0.3 m, arm horizontal?
  answer: 1.4715
  tol: 0.001
  unit: N·m
  py: "0.5*9.81*0.3"
  explain: mgℓ.
- type: num
  q: Static PD error in rad from that gravity at θ = 1 rad with K_p = 20?
  answer: 0.0619
  tol: 0.01
  unit: rad
  py: "1.4715*__import__('math').sin(1)/20"
  explain: mgℓ sin θ / K_p.
- type: num
  q: Inertial feedforward torque in N·m at peak reference acceleration 0.6 rad/s² with J = 0.05?
  answer: 0.03
  tol: 0.001
  unit: N·m
  py: "0.05*0.6"
  explain: J θ̈_r.
- type: num
  q: Fraction of the error left if feedforward removes 90 % of the required torque (ideal linear case)?
  answer: 0.1
  tol: 0.001
  py: "1-0.9"
  explain: Feedback handles the remainder.
- type: mc
  q: Does adding feedforward change closed-loop stability?
  options:
    - no, it acts outside the loop
    - yes, it adds poles
    - it always destabilises
    - only for integrators
  answer: 0
  explain: The loop transfer function is unchanged.
- type: mc
  q: Gravity compensation on a robot joint is an example of…
  options:
    - disturbance feedforward
    - integral action
    - a Smith predictor
    - derivative filtering
  answer: 0
  explain: A known disturbance cancelled at the input.
:::end
