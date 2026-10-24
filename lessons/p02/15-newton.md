---
id: p02-l15
minutes: 35
summary: Newton's method solves nonlinear equations by repeatedly solving their linearisation, doubling the number of correct digits at every step once it is close. You derive the update, prove quadratic convergence, add a backtracking line search so it doesn't diverge from bad starts, and use it for inverse kinematics.
---

## Solve the tangent instead

To solve $f(x) = 0$, replace $f$ near the current guess by its tangent line, $f(x_k) + f'(x_k)(x - x_k)$, and solve that instead:

$$x_{k+1} = x_k - \frac{f(x_k)}{f'(x_k)} .$$

For a system $\mathbf f(\mathbf x) = 0$ the tangent is the Jacobian (lesson 4), and each step solves a linear system:

$$J(\mathbf x_k)\,\Delta\mathbf x = -\mathbf f(\mathbf x_k), \qquad \mathbf x_{k+1} = \mathbf x_k + \Delta\mathbf x .$$

Never form $J^{-1}$; solve with elimination (Phase 01 lesson 5).

## Quadratic convergence

Let $r$ be a simple root and $e_k = x_k - r$. Expand $f(x_k) = f'(r)e_k + \tfrac12 f''(r)e_k^2 + \dots$ and substitute into the update. After a few lines,

$$e_{k+1} \approx \frac{f''(r)}{2f'(r)}\,e_k^2 .$$

The error is squared each step: $10^{-2}$, $10^{-4}$, $10^{-8}$, $10^{-16}$. Four iterations take you from two correct digits to machine precision. The catch is "near the root": far away, the tangent can point anywhere, and the plain method can diverge or cycle.

## Backtracking line search

Treat $\Delta\mathbf x$ as a direction and only accept a fraction $\alpha$ of it if the full step makes things worse. Measure progress with $\phi(\mathbf x) = \tfrac12\lVert\mathbf f(\mathbf x)\rVert^2$. Starting from $\alpha = 1$, halve $\alpha$ until the Armijo condition holds:

$$\phi(\mathbf x_k + \alpha\Delta\mathbf x) \le (1 - 2c\alpha)\,\phi(\mathbf x_k), \qquad c = 10^{-4}.$$

It asks for a decrease proportional to the step taken, since the Newton direction reduces $\phi$ at the initial rate $-2\phi$. Close to the root the full step is accepted and you keep quadratic convergence; far away the method can't blow up.

:::figure widget=newton caption="Newton's method on f(x) = x³ − 2x − 5. Move x₀ and watch the tangent steps. Near x₀ = 0.8, where f′ is small, the first step overshoots wildly."
:::end

## Worked example: x³ − 2x − 5 = 0

Newton's own example from 1669. With $f'(x) = 3x^2 - 2$ and $x_0 = 2$:

| $k$ | $x_k$ | error |
|---|---|---|
| 0 | 2 | $-9.5\times10^{-2}$ |
| 1 | 2.1 | $5.4\times10^{-3}$ |
| 2 | 2.094568121 | $1.7\times10^{-5}$ |
| 3 | 2.094551481698 | $1.6\times10^{-10}$ |
| 4 | 2.0945514815423265 | 0 (to float64) |

The predicted ratio $e_{k+1}/e_k^2 = f''(r)/(2f'(r)) = 6r/(2(3r^2 - 2)) = 0.563$. Check: $1.7\times10^{-5}/(5.4\times10^{-3})^2 = 0.56$.

## Code it from scratch

:::code file=newton.py
```python
import math
import numpy as np

def newton(f, jac, x0, tol=1e-12, max_iter=50, c=1e-4):
    x = np.atleast_1d(np.asarray(x0, float)); history = [x.copy()]
    for _ in range(max_iter):
        fx = f(x); phi = 0.5 * fx @ fx
        if math.sqrt(2 * phi) < tol: break
        dx = np.linalg.solve(np.atleast_2d(jac(x)), -fx)
        alpha = 1.0
        while alpha > 1e-8:
            fn = f(x + alpha * dx)
            if 0.5 * fn @ fn <= (1 - 2 * c * alpha) * phi: break
            alpha /= 2
        x = x + alpha * dx; history.append(x.copy())
    return x, history

if __name__ == "__main__":
    f = lambda x: np.array([x[0] ** 3 - 2 * x[0] - 5])
    J = lambda x: np.array([[3 * x[0] ** 2 - 2]])
    root, hist = newton(f, J, [2.0])
    r = 2.0945514815423265
    e = [abs(h[0] - r) for h in hist]
    assert abs(root[0] - r) < 1e-15 and abs(hist[1][0] - 2.1) < 1e-15
    assert abs(e[2] / e[1] ** 2 - 0.563) < 0.01        # quadratic convergence
    root_bad, _ = newton(f, J, [0.8])                   # tangent nearly flat here
    assert abs(root_bad[0] - r) < 1e-12
    # inverse kinematics of a two-link arm: find q with fk(q) = target
    l1, l2, target = 0.3, 0.2, np.array([0.25, 0.30])
    fk = lambda q: np.array([l1 * math.cos(q[0]) + l2 * math.cos(q[0] + q[1]), l1 * math.sin(q[0]) + l2 * math.sin(q[0] + q[1])])
    Jq = lambda q: np.array([[-l1 * math.sin(q[0]) - l2 * math.sin(q[0] + q[1]), -l2 * math.sin(q[0] + q[1])],
                             [l1 * math.cos(q[0]) + l2 * math.cos(q[0] + q[1]), l2 * math.cos(q[0] + q[1])]])
    q, hist = newton(lambda q: fk(q) - target, Jq, [0.3, 0.8])
    assert np.linalg.norm(fk(q) - target) < 1e-12
    print(f"IK solution q = {np.degrees(q).round(4)}° in {len(hist) - 1} iterations")
```
:::end

## Exercises

:::exercise
Use Newton's method to compute $\sqrt{2}$ by solving $x^2 - 2 = 0$ from $x_0 = 1$. Do two steps.
:::solution
1. $x_{k+1} = x_k - (x_k^2 - 2)/(2x_k) = \tfrac12(x_k + 2/x_k)$.
2. $x_1 = 1.5$, $x_2 = \tfrac12(1.5 + 1.3333) = 1.416667$.
3. $\sqrt2 = 1.414214$: the error went from 0.086 to 0.0025. One more step gives 1.4142157, error $2.1\times10^{-6}$.
:::end

:::exercise
Why does Newton's method converge only linearly to a double root such as $x^2 = 0$?
:::solution
At a double root $f'(r) = 0$, so the derivation breaks down. For $f = x^2$ the update is $x_{k+1} = x_k - x_k^2/(2x_k) = x_k/2$: the error only halves each step.
:::end

## Quiz

:::quiz
- type: num
  q: Newton's method on $x^3 - 2x - 5$ from $x_0 = 2$. What is $x_1$?
  answer: 2.1
  tol: 0.0001
  py: "2 - (8 - 4 - 5)/(12 - 2)"
  explain: $f(2) = -1$, $f'(2) = 10$, so $x_1 = 2 + 0.1 = 2.1$.
- type: num
  q: Two Newton steps for $\sqrt2$ from $x_0 = 1$. What is $x_2$?
  answer: 1.416667
  tol: 0.00001
  py: "(1.5 + 2/1.5)/2"
  explain: $x_1 = 1.5$ and $x_2 = (1.5 + 1.3333)/2 = 1.41667$.
- type: mc
  q: Near a simple root, Newton's error behaves like…
  options:
    - e_{k+1} ≈ e_k / 2
    - e_{k+1} ≈ C e_k², doubling the correct digits each step
    - e_{k+1} ≈ e_k − h
    - it doesn't converge
  answer: 1
  explain: Quadratic convergence, with $C = f''(r)/(2f'(r))$.
- type: mc
  q: What does the backtracking line search do?
  options:
    - Makes each step longer
    - Shrinks the Newton step until the residual decreases enough, preventing divergence from poor starts
    - Computes the Jacobian
    - Switches to bisection permanently
  answer: 1
  explain: Close to the root the full step passes the test, so the fast convergence is kept.
- type: num
  q: For $x^3 - 2x - 5$, what is the convergence constant $f''(r)/(2f'(r))$ at the root r = 2.09455?
  answer: 0.56298
  tol: 0.002
  py: "6*2.0945514815423265/(2*(3*2.0945514815423265**2 - 2))"
  explain: $6r/(2(3r^2 - 2)) = 12.567/22.322 = 0.563$.
:::end

:::verify
r = 2.0945514815423265; x = 2.0; e = [x-r]
for _ in range(4): x = x-(x**3-2*x-5)/(3*x*x-2); e.append(x-r)
assert abs(e[0]+9.5e-2)<5e-4 and abs(e[1]-5.4e-3)<5e-5 and abs(e[2]-1.7e-5)<5e-7 and abs(e[3]-1.6e-10)<5e-12 and e[4]==0
assert abs(1.7e-5/(5.4e-3)**2-0.58)<0.03 and abs(e[2]/e[1]**2-0.56)<0.005
x=1.0
for _ in range(3): x=(x+2/x)/2
assert abs(x-1.4142157)<5e-8 and abs(x-2**.5-2.1e-6)<5e-8
:::end
