---
id: p02-l08
minutes: 30
summary: Swapping the order of two lines turns explicit Euler into an integrator that keeps the energy of an oscillator bounded forever. You derive semi-implicit (symplectic) Euler, prove its stability limit h < 2/ω, and compare energy drift over 10⁵ steps.
---

## Update velocity first

For a mechanical system $\dot x = v$, $\dot v = a(x)$, explicit Euler uses the old values for both updates. **Semi-implicit Euler** updates the velocity first and then moves with the new velocity:

$$v_{k+1} = v_k + h\,a(x_k), \qquad x_{k+1} = x_k + h\,v_{k+1}.$$

Same cost, same first-order accuracy, and most game physics engines, and the labs on this site, use it.

## Why it is stable

Take the oscillator $a(x) = -\omega^2 x$. One step is a linear map on $(x, v)$:

$$\begin{pmatrix} x \\ v\end{pmatrix}_{k+1} = \underbrace{\begin{pmatrix} 1 - h^2\omega^2 & h \\ -h\omega^2 & 1\end{pmatrix}}_{M}\begin{pmatrix} x \\ v\end{pmatrix}_k .$$

Its determinant is $(1 - h^2\omega^2) + h^2\omega^2 = 1$: the map preserves area in phase space, which is the defining property of a **symplectic** integrator. With $\det M = 1$, the eigenvalues satisfy $\lambda_1\lambda_2 = 1$; with $\operatorname{tr}M = 2 - h^2\omega^2$, they lie on the unit circle whenever $|\operatorname{tr}M| < 2$, which means

$$h < \frac{2}{\omega}.$$

Inside that limit the solution neither grows nor decays. Compare explicit Euler, whose matrix has $\det = 1 + h^2\omega^2$: every step inflates phase-space area and energy.

The energy isn't exactly constant. Symplectic Euler exactly conserves a nearby "shadow" energy $\tfrac12(v^2 + \omega^2x^2 - h\omega^2 xv)$, so the true energy oscillates within $O(h)$ of its starting value and never drifts.

## Worked example: 30 seconds of a 1 rad/s oscillator

With $\omega = 1$ rad/s, $h = 0.1$ s and 300 steps:

- Explicit Euler multiplies the energy by $1.01$ every step: $1.01^{300} = 19.8$. The simulated spring ends with 20 times its energy.
- Semi-implicit Euler keeps the energy between 0.952 and 1.053 times the start, and that band stays the same after $10^5$ steps.

## Code it from scratch

:::code file=symplectic.py
```python
import numpy as np

def explicit_euler(x, v, h, w2):
    return x + h * v, v - h * w2 * x

def symplectic_euler(x, v, h, w2):
    v = v - h * w2 * x
    return x + h * v, v

def energy_history(step, n, h=0.1, w2=1.0):
    x, v = 1.0, 0.0
    E = np.empty(n + 1); E[0] = 0.5 * (v * v + w2 * x * x)
    for k in range(n):
        x, v = step(x, v, h, w2)
        E[k + 1] = 0.5 * (v * v + w2 * x * x)
    return E / E[0]

if __name__ == "__main__":
    Ee = energy_history(explicit_euler, 300)
    assert abs(Ee[-1] - 1.01 ** 300) < 1e-9
    Es = energy_history(symplectic_euler, 100_000)
    print(f"explicit: x{Ee[-1]:.1f} after 300 steps; symplectic: {Es.min():.4f}…{Es.max():.4f} over 1e5 steps")
    assert 0.95 < Es.min() and Es.max() < 1.06
    first, last = Es[:10_000], Es[-10_000:]
    assert abs(first.max() - last.max()) < 1e-6           # bounded: no drift
    M = np.array([[1 - 0.01, 0.1], [-0.1, 1.0]])
    assert abs(np.linalg.det(M) - 1) < 1e-15 and np.allclose(abs(np.linalg.eigvals(M)), 1)
    x, v = 1.0, 0.0
    for _ in range(1000): x, v = symplectic_euler(x, v, 2.01, 1.0)   # just above 2/ω
    assert abs(x) > 1e3
```
:::end

## Exercises

:::exercise
What is the largest stable semi-implicit Euler step for a motor shaft resonance at 500 rad/s?
:::solution
$h < 2/\omega = 2/500 = 4$ ms. To resolve the oscillation accurately you'd want ten times smaller, about 0.4 ms.
:::end

:::exercise
Show that $\det M = 1$ for the semi-implicit Euler matrix with any $h$ and $\omega$.
:::solution
$\det M = (1 - h^2\omega^2)(1) - (h)(-h\omega^2) = 1 - h^2\omega^2 + h^2\omega^2 = 1$.
:::end

## Quiz

:::quiz
- type: num
  q: Explicit Euler, ω = 1 rad/s, h = 0.1 s. By what factor has the energy grown after 300 steps?
  answer: 19.788
  tol: 0.002
  py: "1.01**300"
  explain: $(1 + h^2\omega^2)^{300} = 1.01^{300} = 19.8$.
- type: num
  q: Largest stable semi-implicit Euler step for ω = 500 rad/s, in milliseconds?
  answer: 4
  tol: 0.001
  unit: ms
  py: "1000*2/500"
  explain: $h < 2/\omega = 4$ ms.
- type: mc
  q: What is the only difference between explicit and semi-implicit Euler?
  options:
    - Semi-implicit Euler solves a nonlinear equation
    - The position update uses the newly updated velocity
    - It uses two function evaluations
    - It is second-order accurate
  answer: 1
  explain: Update $v$ first, then use $v_{k+1}$ to update $x$.
- type: mc
  q: What does det M = 1 mean for the integrator?
  options:
    - The solution is exact
    - It preserves phase-space area, so energy errors stay bounded instead of drifting
    - The step size is 1
    - It only works for linear systems
  answer: 1
  explain: Area preservation is the symplectic property; it rules out systematic growth or decay.
:::end

:::verify
import numpy as np
x,v,h=1.,0.,.1; E=[]
for i in range(300): v-=h*x; x+=h*v; E.append(.5*(x*x+v*v)/.5)
assert abs(min(E)-0.952)<5e-4 and abs(max(E)-1.053)<5e-4
assert abs(1.01**300-19.8)<0.05
:::end
