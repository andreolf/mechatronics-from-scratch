---
id: p02-l14
minutes: 35
summary: Linearisation turns a nonlinear model into ẋ = A x + B u around an operating point, the starting point of almost all control design. You derive A and B from Jacobians, linearise the pendulum hanging and upright, and confirm the upright model's unstable eigenvalue √(g/l).
---

## Small deviations from an operating point

Pick an operating point $(\mathbf x^*, \mathbf u^*)$ with $\mathbf f(\mathbf x^*, \mathbf u^*) = 0$, an equilibrium the system can hold. Write the state and input as deviations, $\mathbf x = \mathbf x^* + \delta\mathbf x$ and $\mathbf u = \mathbf u^* + \delta\mathbf u$, and Taylor-expand (lesson 2) in both:

$$\dot{\delta\mathbf x} = \mathbf f(\mathbf x^* + \delta\mathbf x, \mathbf u^* + \delta\mathbf u) \approx \underbrace{\mathbf f(\mathbf x^*, \mathbf u^*)}_{0} + \frac{\partial\mathbf f}{\partial\mathbf x}\Big|_*\delta\mathbf x + \frac{\partial\mathbf f}{\partial\mathbf u}\Big|_*\delta\mathbf u .$$

So near the operating point

$$\dot{\delta\mathbf x} = A\,\delta\mathbf x + B\,\delta\mathbf u, \qquad A = \frac{\partial\mathbf f}{\partial\mathbf x}\Big|_*,\quad B = \frac{\partial\mathbf f}{\partial\mathbf u}\Big|_* .$$

The eigenvalues of $A$ give local stability, and Phases 04 and 06 design controllers for exactly this $(A, B)$ pair. The neglected terms are second order in the deviations, so the model is good while deviations stay small.

## The pendulum with a motor

A pendulum of mass $m$ on a massless rod of length $l$, driven by motor torque $u$:

$$\dot\theta = \omega, \qquad \dot\omega = -\frac{g}{l}\sin\theta + \frac{u}{ml^2}.$$

Differentiating,

$$A = \begin{pmatrix} 0 & 1 \\ -\tfrac{g}{l}\cos\theta^* & 0\end{pmatrix}, \qquad B = \begin{pmatrix} 0 \\ \tfrac{1}{ml^2}\end{pmatrix}.$$

- **Hanging** ($\theta^* = 0$): $\lambda = \pm i\sqrt{g/l}$, an oscillator at $\sqrt{g/l}$ rad/s.
- **Upright** ($\theta^* = \pi$): $\cos\pi = -1$, so $\lambda = \pm\sqrt{g/l}$. One eigenvalue is positive: deviations grow like $e^{\sqrt{g/l}\,t}$.

## Worked example: how fast does an upright pendulum fall?

For $l = 1$ m, $\sqrt{g/l} = \sqrt{9.81} = 3.132$ s⁻¹. Once the growing mode dominates, a deviation doubles every $\ln 2/3.132 = 0.221$ s.

Released from rest at a tilt $\delta\theta_0$, the linear model gives $\delta\theta(t) = \delta\theta_0\cosh(\sqrt{g/l}\,t)$: half the start excites the growing mode and half the decaying one. A 1° tilt becomes $\cosh(3.132 \times 0.735) = 5.05°$ after 0.735 s and reaches 10° at $t = \operatorname{arccosh}(10)/3.132 = 0.956$ s. A balancing controller has to act well within those times, so it runs at hundreds of hertz.

Shorter pendulums are harder: at $l = 0.25$ m the rate doubles to 6.26 s⁻¹. That's why balancing a pencil on your finger is harder than balancing a broom.

## Code it from scratch

:::code file=linearise.py
```python
import math
import numpy as np

g, l, m = 9.81, 1.0, 0.2
def f(x, u):
    return np.array([x[1], -g / l * math.sin(x[0]) + u / (m * l * l)])

def linearise(f, x0, u0, h=1e-6):
    x0 = np.asarray(x0, float); n = len(x0)
    A = np.column_stack([(f(x0 + h * e, u0) - f(x0 - h * e, u0)) / (2 * h) for e in np.eye(n)])
    B = ((f(x0, u0 + h) - f(x0, u0 - h)) / (2 * h)).reshape(n, 1)
    return A, B

def rk4(fun, x, h):
    k1 = fun(x); k2 = fun(x + h/2*k1); k3 = fun(x + h/2*k2); k4 = fun(x + h*k3)
    return x + h/6*(k1 + 2*k2 + 2*k3 + k4)

if __name__ == "__main__":
    A_up, B = linearise(f, [math.pi, 0], 0.0)
    lam = np.sort(np.linalg.eigvals(A_up).real)
    assert np.allclose(lam, [-math.sqrt(g / l), math.sqrt(g / l)], atol=1e-6)
    assert np.allclose(B, [[0], [1 / (m * l * l)]], atol=1e-6)
    A_down, _ = linearise(f, [0, 0], 0.0)
    assert np.allclose(sorted(np.linalg.eigvals(A_down).imag), [-math.sqrt(g / l), math.sqrt(g / l)], atol=1e-6)
    # nonlinear vs linear model, starting 1° from upright
    x_nl = np.array([math.pi + math.radians(1), 0.0]); d_lin = np.array([math.radians(1), 0.0]); h = 1e-3
    for k in range(735):
        x_nl = rk4(lambda s: f(s, 0.0), x_nl, h)
        d_lin = rk4(lambda s: A_up @ s, d_lin, h)
    print(f"after 0.735 s: nonlinear {math.degrees(x_nl[0] - math.pi):.2f}°, linear {math.degrees(d_lin[0]):.2f}°")
    assert abs(math.degrees(d_lin[0]) - math.cosh(math.sqrt(g / l) * 0.735)) < 1e-6   # 1° · cosh(λt)
    assert abs(x_nl[0] - math.pi - d_lin[0]) < math.radians(0.2)
```
:::end

At 5° the nonlinear and linear models still agree within 0.2°, because $\sin$ of a small deviation from π is close to the deviation itself (lesson 2). Past about 15° they part ways.

## Exercises

:::exercise
Linearise $\dot x = -x^3 + u$ around the operating point $u^* = 8$.
:::solution
1. Equilibrium: $-x^{*3} + 8 = 0$, so $x^* = 2$.
2. $A = -3x^{*2} = -12$, $B = 1$.
3. Near $x = 2$: $\dot{\delta x} = -12\,\delta x + \delta u$, a first-order system with $\tau = 1/12$ s.
:::end

:::exercise
What is the unstable eigenvalue of an upright pendulum of length 0.5 m?
:::solution
$\sqrt{9.81/0.5} = \sqrt{19.62} = 4.43$ s⁻¹; deviations double every $0.693/4.43 = 0.156$ s.
:::end

## Quiz

:::quiz
- type: num
  q: What is the unstable eigenvalue (s⁻¹) of an upright pendulum with l = 0.5 m?
  answer: 4.4294
  tol: 0.002
  py: "math.sqrt(9.81/0.5)"
  explain: $\sqrt{g/l} = \sqrt{19.62} = 4.43$ s⁻¹.
- type: num
  q: For l = 1 m, how long (in seconds) does a small upright deviation take to double, once it grows exponentially?
  answer: 0.22131
  tol: 0.002
  unit: s
  py: "math.log(2)/math.sqrt(9.81)"
  explain: $\ln 2/3.132 = 0.221$ s.
- type: mc
  q: What is A in the linearised model?
  options:
    - The Hessian of f
    - The Jacobian ∂f/∂x evaluated at the operating point
    - f evaluated at the operating point
    - The input matrix
  answer: 1
  explain: $A$ maps state deviations to their rates of change, to first order.
- type: num
  q: Linearise $\dot x = -x^3 + u$ around $u^* = 8$. What is A?
  answer: -12
  tol: 0.0001
  py: "-3*2**2"
  explain: $x^* = 2$ and $A = -3x^{*2} = -12$.
- type: mc
  q: Why must the operating point satisfy f(x*, u*) = 0?
  options:
    - So the matrices are square
    - So the constant term vanishes and the model describes deviations from a point the system can hold
    - So the eigenvalues are real
    - It doesn't need to
  answer: 1
  explain: Otherwise the linear model has a constant drift term and the deviation variables don't stay small.
:::end

:::verify
import math
assert abs(math.sqrt(9.81)-3.132)<5e-4 and abs(math.log(2)/3.132-0.221)<5e-4 and abs(math.log(10)/3.132-0.735)<5e-4
assert abs(math.sqrt(9.81/0.25)-6.26)<0.005 and abs(math.cosh(math.sqrt(9.81)*0.735)-5.05)<0.005 and abs(math.acosh(10)/math.sqrt(9.81)-0.956)<5e-4
assert abs(math.sqrt(19.62)-4.43)<0.005 and abs(0.693/4.43-0.156)<5e-4
:::end
