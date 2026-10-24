---
id: p13-l17
minutes: 40
summary: Dead time, such as transport along a conveyor or a pipe, adds phase lag that grows without limit with frequency, which forces feedback to be slow, and a Smith predictor works around it by closing the loop on a model of the process without its delay. You derive the delay's phase and its Padé approximation, implement a Smith predictor around a PI controller, and test that with an exact model the predicted loop reproduces the delay-free response exactly, shifted by the dead time.
---

## Dead time

A pure delay $\theta$ has transfer function $e^{-s\theta}$: gain 1, phase $-\omega\theta$. Unlike a pole, its lag keeps growing with frequency, so it sets a hard limit on crossover. A rough rule: crossover below about $1/\theta$ unless you compensate.

For analysis with polynomial tools, replace it with a **Padé approximation**. First order:

$$e^{-s\theta} \approx \frac{1 - s\theta/2}{1 + s\theta/2},$$

which has gain exactly 1 and phase $-2\arctan(\omega\theta/2)$: within 1° of the true phase for $\omega\theta < 0.5$. Note the right-half-plane zero, the signature of a delay.

## The Smith predictor

Let the process be $G(s)e^{-s\theta}$ and the model $\hat G(s)e^{-s\hat\theta}$. Feed the controller

$$y_{fb} = y + \hat G u - \hat Ge^{-s\hat\theta}u.$$

If the model is exact, the last term cancels the real (delayed) output, and the controller sees $\hat Gu$: the **delay-free** process. So

$$\frac{Y}{R} = \frac{CG}{1 + CG}e^{-s\theta},$$

the delay-free closed loop, delayed. The delay is moved outside the loop, where it no longer limits stability. You can tune the controller as if there were no dead time.

The catch: a model error, especially in $\theta$, reintroduces the delay into the loop. Smith predictors need well-known, steady dead times.

:::figure widget=smithpred caption="Step response of a process with dead time under the same PI controller, with and without a Smith predictor. With an exact model the predicted response is the delay-free one, shifted; mis-set the model delay to see oscillation return."
:::end

## Worked example

Process $\dfrac{e^{-2s}}{5s + 1}$; PI $K_p = 2.5$, $T_i = 5$ s, so $C = 2.5(5s + 1)/(5s)$ cancels the lag.

1. Delay-free loop: $CG = 0.5/s$, so the closed loop is $1/(2s + 1)$: a 2 s first-order response.
2. With the Smith predictor: the same response starting 2 s late. Settling to 2 % at $2 + 4 \times 2 = 10$ s.
3. Without the predictor, $L = 0.5e^{-2s}/s$ has crossover 0.5 rad/s and phase $-90° - 57.3° = -147°$, so $PM = 33°$: a large overshoot.

## Code it from scratch

:::code file=smith.py
```python
import numpy as np

dt, tau, theta = 0.01, 5.0, 2.0
Kp, Ti = 2.5, 5.0
a = np.exp(-dt / tau)                                   # exact ZOH discretisation of 1/(tau s + 1)

def run(mode, model_theta=theta, T=40.0):
    n = int(T / dt); nd = int(round(theta / dt)); md = int(round(model_theta / dt))
    x = xm = integ = 0.0
    u_hist, xm_hist, y_out = [], [], []
    for k in range(n):
        y = x                                            # measured process output
        xm_hist.append(xm)
        if mode == "smith":
            fb = y + xm - (xm_hist[k - md] if k >= md else 0.0)   # y + model - delayed model
        else:
            fb = y
        e = 1.0 - fb
        integ += e * dt
        u = Kp * (e + integ / Ti)
        u_hist.append(u)
        ud = u if mode == "nodelay" else (u_hist[k - nd] if k >= nd else 0.0)
        x = a * x + (1 - a) * ud                          # process (input delayed by theta)
        xm = a * xm + (1 - a) * u                         # delay-free model
        y_out.append(y)
    return np.array(y_out)

def test_smith_equals_delayed_delay_free():
    y0, ys = run("nodelay"), run("smith")
    k = int(round(theta / dt))
    err = np.max(np.abs(ys[k:] - y0[:-k]))
    print(f"Smith predictor vs delay-free response shifted by {theta} s: max difference {err:.1e}")
    assert err < 1e-9 and np.max(np.abs(ys[:k])) < 1e-12

def test_better_than_plain_pi():
    yp, ys = run("plain"), run("smith")
    os_p, os_s = yp.max() - 1, ys.max() - 1
    iae_p, iae_s = np.sum(np.abs(1 - yp)) * dt, np.sum(np.abs(1 - ys)) * dt
    print(f"plain PI: overshoot {os_p:.0%}, IAE {iae_p:.2f}; Smith: overshoot {max(os_s, 0):.0%}, IAE {iae_s:.2f}")
    assert os_p > 0.3 and os_s < 0.01 and iae_s < iae_p

def test_model_delay_error_degrades():
    ys = run("smith"); yw = run("smith", model_theta=1.0)          # model delay half the real one
    assert (yw.max() - 1) > (ys.max() - 1) + 0.05

def test_pade_phase():
    for wt in np.linspace(0.01, 0.5, 50):
        assert abs(np.degrees(2 * np.arctan(wt / 2) - wt)) < 1.0
    w = 1.3; s = 1j * w
    assert abs(abs((1 - s * theta / 2) / (1 + s * theta / 2)) - 1) < 1e-12

test_smith_equals_delayed_delay_free()
test_better_than_plain_pi()
test_model_delay_error_degrades()
test_pade_phase()
print("PASS")
```
:::end

## Exercises

:::exercise
A conveyor carries material 3 m at 0.5 m/s to a weighing sensor. What is the dead time, and what's the rough crossover limit without a predictor?
:::solution
$\theta = 3/0.5 = 6$ s, so crossover should stay below about $1/6 = 0.17$ rad/s: a closed-loop response of tens of seconds.
:::end

:::exercise
Why does the Smith predictor not help reject a disturbance that enters at the process input?
:::solution
The disturbance only shows up in $y$, which still arrives through the real delay. The controller can't react before the measurement changes, so rejection is still delayed by $\theta$. The predictor speeds up reference tracking and allows more aggressive tuning, but nothing can undo the information delay.
:::end

## Quiz

:::quiz
- type: num
  q: Phase lag in degrees of a 2 s delay at 0.5 rad/s?
  answer: 57.3
  tol: 0.002
  unit: °
  py: "__import__('math').degrees(1.0)"
  explain: ωθ = 1 rad.
- type: num
  q: Phase margin in degrees of 0.5e^(−2s)/s?
  answer: 32.7
  tol: 0.01
  unit: °
  py: "180-90-__import__('math').degrees(1.0)"
  explain: Crossover at 0.5 rad/s.
- type: num
  q: Dead time in s for 3 m at 0.5 m/s?
  answer: 6
  tol: 0
  unit: s
  py: "3/0.5"
  explain: Distance over speed.
- type: num
  q: Phase error in degrees of the first-order Padé at ωθ = 0.5?
  answer: 0.58
  tol: 0.03
  unit: °
  py: "__import__('math').degrees(0.5-2*__import__('math').atan(0.25))"
  explain: −2 arctan(ωθ/2) versus −ωθ.
- type: mc
  q: With an exact model, the Smith predictor makes the closed loop…
  options:
    - the delay-free closed loop followed by the delay
    - delay-free
    - unstable
    - identical to plain PI
  answer: 0
  explain: The delay moves outside the loop.
- type: mc
  q: The first-order Padé approximation has…
  options:
    - a right-half-plane zero
    - a double pole
    - no phase
    - gain that falls with frequency
  answer: 0
  explain: Its zero is at +2/θ.
:::end
