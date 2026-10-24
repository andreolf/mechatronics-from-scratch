---
id: p02-l07
minutes: 30
summary: Explicit Euler is the simplest integrator and the easiest to break. You derive its stability condition |1 + hλ| < 1 from the test equation, predict the exact step size where a damped spring-mass simulation diverges, and find it numerically.
---

## The method

To integrate $\dot{\mathbf x} = \mathbf f(\mathbf x)$, step forward along the current slope:

$$\mathbf x_{k+1} = \mathbf x_k + h\,\mathbf f(\mathbf x_k).$$

It's one function evaluation per step and its global error is $O(h)$. That makes it popular in microcontroller code, and it's a fine choice as long as you respect its stability limit.

## The test equation

Linearise any system near an equilibrium and diagonalise it (Phase 01 lesson 11): each mode behaves like $\dot x = \lambda x$ with a possibly complex $\lambda$. Apply Euler:

$$x_{k+1} = (1 + h\lambda)\,x_k \quad\Rightarrow\quad x_k = (1 + h\lambda)^k x_0 .$$

The numerical solution decays only if $|1 + h\lambda| < 1$: $h\lambda$ must lie inside the unit disc centred at $-1$ in the complex plane. For a real decaying mode $\lambda = -a$,

$$h < \frac{2}{a}.$$

Exceed it and a perfectly stable physical system explodes in simulation, alternating sign at every step.

## The damped oscillator

For $\ddot x + 2\zeta\omega\dot x + \omega^2 x = 0$ the eigenvalues are $\lambda = \omega(-\zeta \pm i\sqrt{1 - \zeta^2})$. Then

$$|1 + h\lambda|^2 = (1 - h\zeta\omega)^2 + h^2\omega^2(1-\zeta^2) = 1 - 2h\zeta\omega + h^2\omega^2,$$

which is below 1 exactly when

$$h < \frac{2\zeta}{\omega}.$$

With no damping ($\zeta = 0$) there is no stable step at all: every step multiplies the energy by $1 + h^2\omega^2$. The next lesson fixes this with a one-line change.

:::figure widget=integrators args={"method":"euler"} caption="x″ = −x integrated with different methods. With explicit Euler the amplitude grows at every step size; compare semi-implicit Euler and RK4."
:::end

## Worked example

A motor shaft resonance with $\omega = 10$ rad/s and $\zeta = 0.1$:

1. Stability limit $h < 2 \times 0.1/10 = 0.02$ s, so a 50 Hz simulation is right on the edge.
2. At $h = 0.01$ s: $|1 + h\lambda|^2 = 1 - 0.02 + 0.01 = 0.99$, so the simulated mode decays by $\sqrt{0.99} = 0.995$ per step, while the true decay is $e^{-\zeta\omega h} = 0.990$. Stable, but under-damped by about half.
3. At $h = 0.03$ s: $|1 + h\lambda|^2 = 1 - 0.06 + 0.09 = 1.03$. It grows.

For a real decay $\lambda = -50$ s⁻¹, such as an RL circuit with $L/R = 20$ ms, the limit is $h < 0.04$ s.

## Code it from scratch

:::code file=euler_stability.py
```python
import math
import numpy as np

def euler(f, x0, h, n):
    x = np.array(x0, float)
    for _ in range(n):
        x = x + h * f(x)
    return x

def diverges(h, w=10.0, zeta=0.1, t_end=200.0):
    f = lambda s: np.array([s[1], -2 * zeta * w * s[1] - w * w * s[0]])
    x = euler(f, [1.0, 0.0], h, round(t_end / h))
    return np.hypot(w * x[0], x[1]) > w           # energy norm above its starting value

if __name__ == "__main__":
    lo, hi = 1e-4, 0.05                     # bisection on the divergence threshold
    assert not diverges(lo) and diverges(hi)
    for _ in range(40):
        mid = (lo + hi) / 2
        lo, hi = (lo, mid) if diverges(mid) else (mid, hi)
    print(f"measured threshold h = {lo:.5f} s, predicted 2ζ/ω = {2 * 0.1 / 10:.5f} s")
    assert abs(lo - 0.02) < 2e-4
    g = lambda x: -50 * x                    # real mode: limit 2/50 = 0.04 s
    assert abs(euler(g, [1.0], 0.039, 2000)[0]) < 1 and abs(euler(g, [1.0], 0.041, 2000)[0]) > 1
```
:::end

## Exercises

:::exercise
A thermal model has modes with time constants 50 s and 0.2 s. What is the largest stable explicit Euler step?
:::solution
1. $\lambda = -1/\tau$, so $-0.02$ and $-5$ s⁻¹.
2. The fast mode sets the limit: $h < 2/5 = 0.4$ s, even though the slow mode, which is the one you care about, would allow 100 s. This mismatch is called stiffness (lesson 11).
:::end

:::exercise
Simulating an undamped pendulum with explicit Euler at $h\omega = 0.1$, by how much does the energy grow over 100 steps?
:::solution
Each step multiplies the energy by $1 + (h\omega)^2 = 1.01$, so 100 steps give $1.01^{100} = 2.70$: the energy nearly triples.
:::end

## Quiz

:::quiz
- type: num
  q: What is the largest stable explicit Euler step for $\dot x = -50x$, in seconds?
  answer: 0.04
  tol: 0.001
  unit: s
  py: "2/50"
  explain: $|1 - 50h| < 1$ requires $h < 2/50$.
- type: num
  q: Damped oscillator with ω = 10 rad/s and ζ = 0.1. What is the explicit Euler stability limit in seconds?
  answer: 0.02
  tol: 0.001
  unit: s
  py: "2*0.1/10"
  explain: $h < 2\zeta/\omega = 0.02$ s.
- type: mc
  q: Explicit Euler on an undamped spring-mass system is…
  options:
    - stable for small h
    - unstable for every h > 0, with energy growing by 1 + h²ω² per step
    - exact
    - stable only for h > 2/ω
  answer: 1
  explain: $|1 + ih\omega|^2 = 1 + h^2\omega^2 > 1$ always.
- type: num
  q: By what factor does energy grow over 100 explicit Euler steps of an undamped oscillator with hω = 0.1?
  answer: 2.7048
  tol: 0.002
  py: "1.01**100"
  explain: $1.01^{100} = 2.705$.
- type: mc
  q: Modes with time constants 50 s and 0.2 s. Which sets the explicit Euler step limit?
  options:
    - The 50 s mode
    - The 0.2 s mode
    - Their average
    - Neither
  answer: 1
  explain: The fastest mode gives the largest $|\lambda|$ and the strictest limit $h < 2\tau_\text{min}$.
:::end

:::verify
import math
assert abs(1-0.02+0.01-0.99)<1e-12 and abs(math.sqrt(.99)-.995)<5e-4 and abs(math.exp(-.1*10*.01)-.990)<5e-4
assert abs(1-0.06+0.09-1.03)<1e-12 and abs(2/5-0.4)<1e-12
:::end
