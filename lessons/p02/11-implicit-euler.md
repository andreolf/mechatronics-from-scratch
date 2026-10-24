---
id: p02-l11
minutes: 35
summary: A stiff system mixes fast and slow dynamics, and explicit methods must crawl at the fast time scale even when it has died out. You derive backward Euler, show it is stable for every step on every decaying mode, and implement it with a Newton solve per step that runs 100 times past the explicit limit.
---

## Stiffness

Lesson 7 showed that explicit Euler needs $h < 2/|\lambda|$ for every mode. Suppose a motor model has an electrical mode with $L/R = 0.5$ ms and a thermal mode of 100 s. You want to simulate an hour of thermal behaviour, but the electrical mode forces $h < 1$ ms: 3.6 million steps to follow a transient that ended in the first few milliseconds. A system like this, with widely separated time scales where the fast ones are stable, is **stiff**.

## Backward Euler

Evaluate the slope at the end of the step instead of the start:

$$\mathbf x_{k+1} = \mathbf x_k + h\,\mathbf f(t_{k+1}, \mathbf x_{k+1}).$$

On the test equation $\dot x = \lambda x$:

$$x_{k+1} = \frac{x_k}{1 - h\lambda}.$$

For any $\lambda$ with negative real part, $|1 - h\lambda| > 1$, so the solution decays for **every** $h > 0$. A method with this property is **A-stable**. For very fast modes, $h\lambda \to -\infty$ and the factor goes to 0: backward Euler kills stiff transients in one step, which is what you want. It is still only first-order accurate, so accuracy, not stability, now sets the step.

## A Newton solve each step

The unknown $\mathbf x_{k+1}$ appears on both sides, so each step solves

$$\mathbf g(\mathbf y) = \mathbf y - \mathbf x_k - h\,\mathbf f(t_{k+1}, \mathbf y) = 0$$

with Newton's method (lesson 15): $\mathbf y \leftarrow \mathbf y - (I - hJ)^{-1}\mathbf g(\mathbf y)$, where $J = \partial\mathbf f/\partial\mathbf x$. Start from $\mathbf y = \mathbf x_k$; two or three iterations usually suffice. For linear systems one iteration is exact. Production stiff solvers such as SciPy's `BDF` and `Radau`, or SUNDIALS' CVODE, use higher-order versions of the same idea.

:::figure widget=integrators args={"system":"stiff","method":"euler"} caption="x′ = −100(x − cos t). Explicit Euler explodes above h = 0.02 s; switch to implicit Euler and try h = 0.1 s."
:::end

## Worked example

Take $\dot x = -100(x - \cos t)$ with $x(0) = 1.5$ and $h = 0.1$ s, five times the explicit limit of 0.02 s.

- Explicit Euler multiplies the error by $|1 - 100\times0.1| = 9$ per step. It diverges.
- Backward Euler: $x_1 = x_0 + h\big(-100(x_1 - \cos 0.1)\big)$, so

$$x_1 = \frac{x_0 + 100h\cos 0.1}{1 + 100h} = \frac{1.5 + 10\times 0.995004}{11} = 1.04091 .$$

The solution has been pulled from 1.5 most of the way to the slow curve $\cos t \approx 0.995$ in one step.

## Code it from scratch

:::code file=implicit_euler.py
```python
import numpy as np

def backward_euler(f, jac, t0, x0, h, n, newton_iters=8, tol=1e-12):
    x = np.array(x0, float); t = t0; out = [x.copy()]
    I = np.eye(len(x))
    for _ in range(n):
        t_new, y = t + h, x.copy()
        for _ in range(newton_iters):
            g = y - x - h * f(t_new, y)
            dy = np.linalg.solve(I - h * jac(t_new, y), g)
            y -= dy
            if np.abs(dy).max() < tol: break
        t, x = t_new, y; out.append(x.copy())
    return np.array(out)

if __name__ == "__main__":
    f1 = lambda t, x: -100 * (x - np.cos(t))
    j1 = lambda t, x: np.array([[-100.0]])
    xs = backward_euler(f1, j1, 0.0, [1.5], 0.1, 1)
    assert abs(xs[1, 0] - 1.04091) < 1e-5
    # stiff Van der Pol, mu = 1000: the fast eigenvalue is about -3000 near x = ±2
    mu = 1000.0
    f = lambda t, s: np.array([s[1], mu * (1 - s[0] ** 2) * s[1] - s[0]])
    J = lambda t, s: np.array([[0.0, 1.0], [-2 * mu * s[0] * s[1] - 1, mu * (1 - s[0] ** 2)]])
    lam_fast = abs(np.linalg.eigvals(J(0, [2.0, 0.0])).real).max()
    h_explicit = 2 / lam_fast
    h = 100 * h_explicit
    xs = backward_euler(f, J, 0.0, [2.0, 0.0], h, round(1500 / h))
    print(f"explicit limit {h_explicit:.2e} s; implicit step {h:.3f} s, |x| ≤ {abs(xs[:, 0]).max():.3f}")
    assert np.all(np.isfinite(xs)) and abs(xs[:, 0]).max() < 2.05
```
:::end

## Exercises

:::exercise
For $\dot x = -1000x$ and $h = 0.1$, compare the per-step factors of explicit and implicit Euler with the exact one.
:::solution
1. Explicit: $1 - 100 = -99$. It explodes and alternates sign.
2. Implicit: $1/(1 + 100) = 0.0099$.
3. Exact: $e^{-100} \approx 3.7\times10^{-44}$. Implicit Euler isn't accurate for this mode, but it decays fast, which is all that matters for a transient you don't care about.
:::end

:::exercise
Why does backward Euler need the Jacobian of f?
:::solution
Each step solves a nonlinear equation with Newton's method, whose linear system uses $\partial\mathbf g/\partial\mathbf y = I - hJ$. You can compute $J$ analytically or with the numerical Jacobian of lesson 4.
:::end

## Quiz

:::quiz
- type: num
  q: Backward Euler on $\dot x = -100(x - \cos t)$ with $x_0 = 1.5$ and $h = 0.1$. What is $x_1$?
  answer: 1.04091
  tol: 0.0001
  py: "(1.5 + 10*math.cos(0.1))/11"
  explain: $x_1 = (1.5 + 10\cos 0.1)/11 = 1.0409$.
- type: num
  q: Implicit Euler factor for $\dot x = -1000x$ with $h = 0.1$?
  answer: 0.0099010
  tol: 0.001
  py: "1/(1+100)"
  explain: $1/(1 - h\lambda) = 1/101$.
- type: mc
  q: What does A-stable mean?
  options:
    - Accurate to all orders
    - The numerical solution decays for every step size whenever the true mode decays
    - It never needs Newton's method
    - It only works on linear systems
  answer: 1
  explain: $|1/(1 - h\lambda)| < 1$ for every $h > 0$ when $\operatorname{Re}\lambda < 0$.
- type: mc
  q: A motor model has an electrical time constant of 0.5 ms and a thermal one of 100 s. Why is it stiff?
  options:
    - It is nonlinear
    - The time scales differ by 200 000×, and the fast stable mode limits explicit step size
    - Motors are always stiff
    - It has complex eigenvalues
  answer: 1
  explain: Stiffness is about stable fast modes forcing tiny explicit steps.
- type: num
  q: Explicit Euler on $\dot x = -100x$ with $h = 0.1$. What is the per-step amplification factor?
  answer: -9
  tol: 0.0001
  py: "1 - 100*0.1"
  explain: $1 + h\lambda = 1 - 10 = -9$.
:::end

:::verify
import math
assert abs(math.cos(.1)-0.995004)<5e-7 and abs((1.5+10*math.cos(.1))/11-1.04091)<5e-6
assert abs(3600/1e-3-3.6e6)<1
assert abs(100/0.5e-3-2e5)<1
:::end
