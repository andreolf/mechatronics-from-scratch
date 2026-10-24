---
id: p13-l09
minutes: 35
summary: When the actuator saturates, the loop is effectively open, but a plain integrator keeps accumulating error and then has to unwind, which causes large overshoot and slow settling. You derive the two standard fixes, clamping (conditional integration) and back-calculation, implement both on the motor speed loop with a 12 volt limit, and test that each cuts the overshoot from a large step by more than a factor of five while leaving small, unsaturated steps untouched.
---

## Windup

A PI speed loop asked to jump from 0 to 200 rad/s starts with an error of 200 rad/s. With $K_p = 0.12$ it wants 24 V, but the driver can only give 12 V. While the voltage is pinned at the limit:

- the motor accelerates as fast as it can, regardless of the controller;
- the integrator keeps adding $K_ie$ every step, storing a large voltage it can't use.

When the speed reaches its target the error turns negative, but the stored integral keeps the output saturated until the error has been negative long enough to unwind it. The result is a big overshoot, larger than the same loop shows without any limit.

## Clamping (conditional integration)

Stop integrating while the output is saturated **and** the error would push it further into saturation:

$$\dot I = \begin{cases} 0 & \text{if } u \ne v \text{ and } \operatorname{sign}(e) = \operatorname{sign}(v) \\ K_ie & \text{otherwise}\end{cases}$$

where $v$ is the controller's unsaturated output and $u = \operatorname{sat}(v)$.

## Back-calculation

Feed the saturation excess back into the integrator with time constant $T_t$:

$$\dot I = K_ie + \frac{1}{T_t}(u - v).$$

While saturated, the integrator is pulled towards the value that would just reach the limit. A $T_t$ a few times shorter than the integral time $T_i = K_p/K_i$ works well. Back-calculation is smooth and easy to extend to rate limits; clamping is simplest to code.

:::figure widget=windup caption="A large speed step with the drive limited to 12 V, with no anti-windup, with clamping and with back-calculation. The plain integrator keeps charging while the voltage is pinned and then overshoots; both fixes stop it."
:::end

## Worked example

The lab motor, $K_p = 0.12$, $K_i = 2.5$, so $T_i = 48$ ms; limit 12 V; back-calculation with $T_t = 20$ ms.

1. The steady voltage for 200 rad/s is $200/19.81 = 10.1$ V, within the limit, so the target is reachable.
2. Without a limit, this PI loop overshoots about 8 %.
3. With the limit and no anti-windup the overshoot grows to about 18 %; with either fix it drops to about 1 %.

## Code it from scratch

:::code file=antiwindup.py
```python
import numpy as np

R, L, k, J, b = 1.2, 0.002, 0.05, 2e-4, 2e-5
Kp, Ki, Vmax, Tt = 0.12, 2.5, 12.0, 0.02

def run(mode, w_ref=200.0, T=1.5, dt=5e-5, limit=True):
    i = w = I = 0.0; ws = []
    for _ in range(int(T / dt)):
        e = w_ref - w
        v = Kp * e + I                                     # unsaturated controller output
        u = np.clip(v, -Vmax, Vmax) if limit else v
        if mode == "none":
            I += Ki * e * dt
        elif mode == "clamp":
            if not (u != v and np.sign(e) == np.sign(v)):
                I += Ki * e * dt
        elif mode == "back":
            I += (Ki * e + (u - v) / Tt) * dt
        f = lambda s: np.array([(u - R * s[0] - k * s[1]) / L, (k * s[0] - b * s[1]) / J])
        s = np.array([i, w])
        k1 = f(s); k2 = f(s + dt / 2 * k1); k3 = f(s + dt / 2 * k2); k4 = f(s + dt * k3)
        i, w = s + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4); ws.append(w)
    return np.array(ws)

def overshoot(w, ref):
    return max(0.0, (w.max() - ref) / ref)

def settle(w, ref, dt=5e-5, band=0.02):
    return (np.where(np.abs(w - ref) > band * ref)[0][-1] + 1) * dt

def test_windup_and_fixes():
    lin = overshoot(run("none", limit=False), 200)
    res = {m: run(m) for m in ("none", "clamp", "back")}
    print(f"no limit: overshoot {lin:.1%}")
    for m, w in res.items():
        print(f"12 V limit, {m:5s}: overshoot {overshoot(w, 200):5.1%}, settles in {settle(w, 200) * 1000:.0f} ms")
    os_none = overshoot(res["none"], 200)
    assert os_none > lin                                   # windup is worse than no limit at all
    for m in ("clamp", "back"):
        assert overshoot(res[m], 200) < os_none / 5
        assert settle(res[m], 200) < settle(res["none"], 200)

def test_small_steps_untouched():
    ws = [run(m, w_ref=40.0, T=0.6) for m in ("none", "clamp", "back")]
    assert np.max(np.abs(40.0 * 0.12)) < Vmax                # never saturates: Kp*e starts at 4.8 V
    assert np.allclose(ws[0], ws[1]) and np.allclose(ws[0], ws[2])

test_windup_and_fixes()
test_small_steps_untouched()
print("PASS")
```
:::end

## Exercises

:::exercise
Why does clamping check the sign of the error, instead of freezing the integrator whenever the output is saturated?
:::solution
If the output is saturated high but the error has turned negative, integrating helps: it brings the output back out of saturation sooner. Freezing it there would leave the stored integral stuck at its saturated value and delay recovery.
:::end

:::exercise
A controller runs on a microcontroller whose PWM duty saturates at 95 %, but the anti-windup uses a 100 % limit. What happens?
:::solution
Between 95 % and 100 % the anti-windup thinks it's unsaturated and keeps integrating while the real actuator is pinned, so windup returns in that band. The anti-windup must use the true actuator limit, ideally the value actually applied.
:::end

## Quiz

:::quiz
- type: num
  q: Voltage in V the PI asks for at the first instant of a 200 rad/s step with K_p = 0.12?
  answer: 24
  tol: 0.001
  unit: V
  py: "0.12*200"
  explain: K_p e, before any integral.
- type: num
  q: Integral time T_i in ms for K_p = 0.12 and K_i = 2.5?
  answer: 48
  tol: 0.001
  unit: ms
  py: "1000*0.12/2.5"
  explain: K_p/K_i.
- type: num
  q: Steady voltage in V needed for 200 rad/s with a DC gain of 19.81 (rad/s)/V?
  answer: 10.10
  tol: 0.003
  unit: V
  py: "200/19.81"
  explain: Within the 12 V limit.
- type: num
  q: Largest step in rad/s that doesn't saturate a 12 V drive at the first instant with K_p = 0.12?
  answer: 100
  tol: 0.001
  unit: rad/s
  py: "12/0.12"
  explain: K_p e ≤ V_max.
- type: mc
  q: Back-calculation drives the integrator using…
  options:
    - the difference between the saturated and unsaturated output
    - the derivative of the error
    - the motor current
    - a separate model
  answer: 0
  explain: (u − v)/T_t.
- type: mc
  q: Without anti-windup, saturation typically causes…
  options:
    - larger overshoot and slower settling
    - zero overshoot
    - faster settling
    - a steady error
  answer: 0
  explain: The stored integral has to unwind.
:::end
