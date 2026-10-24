---
id: p13-l01
minutes: 30
summary: Feedback measures the output, compares it with what you wanted and acts on the difference, and the payoff is that a high loop gain makes the result depend on the sensor and the controller rather than on the poorly known plant. You derive the closed-loop transfer function GK over 1 plus GK and the sensitivity that links plant error to output error, then simulate a plant whose gain is 30 percent off and test that the closed-loop error is more than ten times smaller than the open-loop error.
---

## Open loop needs a perfect model

To make a plant $G$ produce output $r$ without feedback, you send $u = r/G_0$, using your model $G_0$ of the plant. If the real gain is 30 % higher, the output is 30 % high. Open loop passes model error straight through.

## Closed loop

Measure $y$, form the error $e = r - y$, and drive the plant with $u = Ke$:

$$y = GK(r - y) \quad\Rightarrow\quad T = \frac{Y}{R} = \frac{GK}{1 + GK}.$$

$L = GK$ is the **loop gain**. When $|L| \gg 1$, $T \approx 1$ whatever $G$ is.

How much does $T$ move when $G$ moves? Differentiate:

$$\frac{dT/T}{dG/G} = \frac{1}{1 + GK} = S.$$

$S$ is the **sensitivity function**. With a loop gain of 20, a 30 % plant change moves the output by about $30/21 \approx 1.4$ %.

The price: the sensor must be accurate, because the loop makes $y$ follow the measured value, errors included. And high gain risks instability, the subject of the rest of this phase.

:::figure widget=fbrobust caption="The same plant with open-loop and closed-loop control. Move the true plant gain away from the model and watch the open-loop output follow the error while the closed-loop output barely moves."
:::end

## Worked example

Plant $G(s) = 2/(0.5s + 1)$ modelled exactly; proportional controller $K = 10$, so $L(0) = 20$. A prefilter $1/T_0(0) = 21/20$ makes the nominal closed loop reach exactly $r$.

1. True gain +30 % ($G(0) = 2.6$): $L = 26$, $T(0) = 26/27 = 0.9630$. With the prefilter, output $= 0.9630 \times 21/20 = 1.0111$: an 1.1 % error, against 30 % open loop. 27 times smaller.
2. True gain −30 %: $L = 14$, $T(0) = 0.9333$, output 0.980: a 2.0 % error, 15 times smaller.
3. Bonus: the closed-loop time constant is $0.5/(1 + 20) = 24$ ms instead of 0.5 s.

## Code it from scratch

:::code file=feedback.py
```python
import numpy as np

tau, G0 = 0.5, 2.0
K = 10.0
L0 = K * G0
pre = (1 + L0) / L0                       # prefilter: nominal closed loop has unit DC gain

def simulate(Gtrue, closed, T=3.0, dt=1e-4, r=1.0):
    y, out = 0.0, []
    for _ in range(int(T / dt)):
        u = K * (pre * r - y) if closed else r / G0
        y += dt * (Gtrue * u - y) / tau    # first-order plant, exact enough at this step
        out.append(y)
    return np.array(out)

def test_closed_loop_error_ten_times_smaller():
    for change in (+0.3, -0.3):
        Gt = G0 * (1 + change)
        e_open = abs(simulate(Gt, False)[-1] - 1)
        e_closed = abs(simulate(Gt, True)[-1] - 1)
        Lt = K * Gt
        predicted = abs(Lt / (1 + Lt) * pre - 1)
        print(f"plant gain {change:+.0%}: open-loop error {e_open:.1%}, closed-loop {e_closed:.2%} (predicted {predicted:.2%}), {e_open / e_closed:.0f}x smaller")
        assert abs(e_closed - predicted) < 1e-4
        assert e_open / e_closed > 10

def test_sensitivity_formula():
    for L in (1.0, 5.0, 20.0, 100.0):
        T = lambda g: g * L / (1 + g * L)
        d = 1e-6
        rel = (T(1 + d) - T(1 - d)) / (2 * d) / T(1)
        assert abs(rel - 1 / (1 + L)) < 1e-8

def test_faster():
    y = simulate(G0, True, T=0.5)
    t63 = np.argmax(y > 0.632 * y[-1]) * 1e-4
    print(f"closed-loop time constant {t63 * 1000:.1f} ms (predicted {tau / (1 + L0) * 1000:.1f} ms)")
    assert abs(t63 - tau / (1 + L0)) < 5e-4

test_closed_loop_error_ten_times_smaller()
test_sensitivity_formula()
test_faster()
print("PASS")
```
:::end

## Exercises

:::exercise
Your sensor reads 2 % high. With a loop gain of 20, what is the actual output error in closed loop?
:::solution
The loop drives the measurement to the reference, so the true output settles about 2 % low (more exactly, $T/(1.02)$ of the target). Feedback can't correct sensor errors: the output is only as good as the measurement.
:::end

:::exercise
How large must the loop gain be for a 50 % plant gain change to cause under 1 % output change?
:::solution
For large changes use the exact form: output ratio $\frac{1.5L/(1 + 1.5L)}{L/(1 + L)} = \frac{1.5(1 + L)}{1 + 1.5L} < 1.01$. Solving: $1.5 + 1.5L < 1.01 + 1.515L \Rightarrow L > 32.7$. With $S \approx 1/(1 + L)$ and $\Delta G/G = 0.5$ the first-order estimate gives $L > 49$, which is conservative for an increase.
:::end

## Quiz

:::quiz
- type: num
  q: Closed-loop DC gain with a loop gain of 20?
  answer: 0.9524
  tol: 0.001
  py: "20/21"
  explain: L/(1 + L).
- type: num
  q: Sensitivity S at DC with a loop gain of 20?
  answer: 0.0476
  tol: 0.002
  py: "1/21"
  explain: 1/(1 + L).
- type: num
  q: Output error in % with the prefilter when the plant gain is 30 % high (L goes from 20 to 26)?
  answer: 1.11
  tol: 0.01
  unit: "%"
  py: "100*(26/27*21/20-1)"
  explain: About 27 times less than open loop.
- type: num
  q: Closed-loop time constant in ms for τ = 0.5 s and L = 20?
  answer: 23.8
  tol: 0.01
  unit: ms
  py: "500/21"
  explain: τ/(1 + L).
- type: mc
  q: What can feedback not correct?
  options:
    - errors in the sensor
    - changes in plant gain
    - slow plant dynamics
    - load disturbances
  answer: 0
  explain: The loop tracks the measured value.
- type: mc
  q: What is the main risk of raising loop gain?
  options:
    - instability
    - lower accuracy
    - higher sensitivity to plant changes
    - slower response
  answer: 0
  explain: Dynamics and delays make high gain oscillate.
:::end
