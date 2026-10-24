---
id: p02-l10
minutes: 40
summary: A fixed step wastes effort where the solution is smooth and loses accuracy where it changes fast. You implement the Dormand-Prince 5(4) embedded pair, estimate the local error for free from two solutions, and let a control law pick each step, then check the result against a reference on the Van der Pol oscillator.
---

## Two answers for the price of one

An **embedded pair** computes two solutions of different order from the same stage values $k_1, \dots, k_7$:

$$x^{(5)}_{k+1} = x_k + h\sum_i b_i k_i, \qquad x^{(4)}_{k+1} = x_k + h\sum_i b^*_i k_i .$$

Their difference estimates the local error of the less accurate one, $e = \lVert x^{(5)} - x^{(4)}\rVert$, without extra function evaluations. Dormand and Prince chose the coefficients so the fifth-order solution has a small error constant, then continue with it ("local extrapolation"). Their seventh stage is evaluated at the new point, so it becomes the next step's $k_1$. This is the method behind MATLAB's `ode45` and SciPy's `RK45`.

## The step-size controller

Measure the error relative to a mixed tolerance, per component,

$$\text{err} = \max_i \frac{|x^{(5)}_i - x^{(4)}_i|}{\text{atol} + \text{rtol}\,\max(|x_{k,i}|, |x_{k+1,i}|)} .$$

If $\text{err} \le 1$, accept the step. In both cases, since the local error of a fourth-order estimate scales like $h^5$, the step that would give $\text{err} = 1$ is

$$h_\text{new} = h\cdot s\cdot\text{err}^{-1/5},$$

with a safety factor $s \approx 0.9$ and limits on how fast $h$ can grow or shrink (here between 0.2× and 5×).

Note what is controlled: the error made in each step. The global error at the end also depends on how errors grow along the trajectory, so it isn't guaranteed to be below the tolerance, though for well-behaved problems it lands within a small factor of it.

## Worked example: rejecting a step

A step of $h = 0.05$ s gives $\text{err} = 4$ with rtol $= 10^{-6}$.

1. $\text{err} > 1$, so reject and retry from the same point.
2. $h_\text{new} = 0.05\times 0.9\times 4^{-1/5} = 0.05 \times 0.9 \times 0.7579 = 0.0341$ s.
3. If the retry gives $\text{err} = 0.1$, accept it and grow: $0.0341\times0.9\times 0.1^{-1/5} = 0.0341\times 1.426 = 0.0486$ s.

## The Van der Pol oscillator

$$\ddot x - \mu(1 - x^2)\dot x + x = 0$$

models a self-excited oscillator, like an old valve circuit. Its limit cycle has slow, smooth phases and fast transitions, the situation where adaptive steps pay off.

:::figure widget=phase args={"system":"vdp"} caption="Van der Pol phase portrait. Every trajectory joins the same limit cycle. Tap to start a new one."
:::end

## Code it from scratch

:::code file=rk45.py
```python
import numpy as np
from scipy.integrate import solve_ivp      # only for the reference solution

C = [0, 1/5, 3/10, 4/5, 8/9, 1, 1]
A = [[], [1/5], [3/40, 9/40], [44/45, -56/15, 32/9],
     [19372/6561, -25360/2187, 64448/6561, -212/729],
     [9017/3168, -355/33, 46732/5247, 49/176, -5103/18656],
     [35/384, 0, 500/1113, 125/192, -2187/6784, 11/84]]
B5 = np.array([35/384, 0, 500/1113, 125/192, -2187/6784, 11/84, 0])
B4 = np.array([5179/57600, 0, 7571/16695, 393/640, -92097/339200, 187/2100, 1/40])

def rk45(f, t, x, t_end, rtol=1e-6, atol=1e-6, h=1e-2):
    x = np.asarray(x, float); accepted = rejected = 0
    while t < t_end - 1e-15:
        h = min(h, t_end - t)
        k = []
        for i in range(7):
            xi = x + h * sum(A[i][j] * k[j] for j in range(i)) if i else x
            k.append(f(t + C[i] * h, xi))
        k = np.array(k)
        x5, x4 = x + h * B5 @ k, x + h * B4 @ k
        err = np.max(np.abs(x5 - x4) / (atol + rtol * np.maximum(abs(x), abs(x5))))
        if err <= 1:
            t, x = t + h, x5; accepted += 1
        else:
            rejected += 1
        h *= min(5.0, max(0.2, 0.9 * err ** -0.2)) if err > 0 else 5.0
    return x, accepted, rejected

if __name__ == "__main__":
    vdp = lambda t, s: np.array([s[1], (1 - s[0] ** 2) * s[1] - s[0]])
    ref = solve_ivp(vdp, [0, 20], [2, 0], method="DOP853", rtol=1e-13, atol=1e-13).y[:, -1]
    last_steps = 0
    for tol in (1e-4, 1e-6, 1e-8, 1e-10):
        x, n, r = rk45(vdp, 0.0, [2.0, 0.0], 20.0, tol, tol)
        e = np.abs(x - ref).max()
        print(f"tol {tol:.0e}: error {e:.1e}, {n} steps, {r} rejected")
        assert e < 20 * tol and n > last_steps
        last_steps = n
    assert abs(0.05 * 0.9 * 4 ** -0.2 - 0.0341) < 1e-4
```
:::end

On this problem the final error stays within about ten times the tolerance, and tightening the tolerance by $10^2$ costs only about $10^{2/5} = 2.5$ times more steps, the payoff of a fifth-order method.

## Exercises

:::exercise
A step with $h = 0.01$ gives $\text{err} = 0.01$. What step does the controller try next?
:::solution
$0.9\times 0.01^{-1/5} = 0.9\times 2.512 = 2.26$, so $h_\text{new} = 0.0226$. The 5× cap doesn't bind here.
:::end

:::exercise
Why is the error exponent $-1/5$ and not $-1/4$ for a 5(4) pair?
:::solution
The error estimate is the local error of the fourth-order solution, which scales like $h^{4+1} = h^5$. To change err by a factor $F$ you change $h$ by $F^{1/5}$.
:::end

## Quiz

:::quiz
- type: num
  q: A step with h = 0.05 s gives err = 4. What step does the controller retry with, in seconds (safety 0.9)?
  answer: 0.034105
  tol: 0.002
  unit: s
  py: "0.05*0.9*4**-0.2"
  explain: $0.05 \times 0.9 \times 4^{-1/5} = 0.0341$ s.
- type: num
  q: A step with h = 0.01 gives err = 0.01. What is the next step size?
  answer: 0.022607
  tol: 0.002
  py: "0.01*0.9*0.01**-0.2"
  explain: $0.01\times 0.9\times 2.512 = 0.0226$.
- type: mc
  q: How does an embedded pair estimate the local error?
  options:
    - By taking two half steps
    - From the difference between a fifth- and a fourth-order solution built from the same stages
    - From the exact solution
    - By comparing with Euler
  answer: 1
  explain: Both solutions share $k_1 \dots k_7$, so the estimate costs no extra evaluations.
- type: mc
  q: An adaptive solver is run with rtol = 10⁻⁶. The final error…
  options:
    - is guaranteed below 10⁻⁶
    - is usually of the order of the tolerance, but not guaranteed, because only the per-step error is controlled
    - is exactly 10⁻⁶
    - doesn't depend on the tolerance
  answer: 1
  explain: Local errors can grow along the trajectory, so the global error can exceed the per-step tolerance.
- type: num
  q: For a fifth-order method, tightening the tolerance by 100× multiplies the number of steps by about… ($100^{1/5}$)
  answer: 2.5119
  tol: 0.002
  py: "100**0.2"
  explain: Step size scales as $\text{tol}^{1/5}$, so the count scales by $100^{1/5} = 2.51$.
:::end

:::verify
assert abs(4**-0.2-0.7579)<5e-5 and abs(0.9*0.1**-0.2-1.426)<5e-4 and abs(0.0341*1.426-0.0486)<5e-4
assert abs(0.01**-0.2-2.512)<5e-4
:::end
