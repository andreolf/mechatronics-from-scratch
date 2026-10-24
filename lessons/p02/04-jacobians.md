---
id: p02-l04
minutes: 35
summary: The Jacobian collects every partial derivative of a vector function, and it is the matrix that maps joint speeds to tool speeds. You derive the two-link arm's Jacobian, compute it numerically with central differences and with the complex-step trick, and match the analytic result to 10⁻⁸.
---

## A matrix of sensitivities

For a function $\mathbf f: \mathbb R^n \to \mathbb R^m$, the Jacobian is the $m\times n$ matrix

$$J_{ij} = \frac{\partial f_i}{\partial x_j}, \qquad \mathbf f(\mathbf x + \delta\mathbf x) \approx \mathbf f(\mathbf x) + J\,\delta\mathbf x .$$

Column $j$ is how every output moves when input $j$ alone changes. This is the multi-dimensional version of lesson 2's linearisation, and you'll use it everywhere: robot velocity kinematics, linearising dynamics, Newton's method (lesson 15) and the extended Kalman filter.

## The two-link arm

A planar arm with link lengths $l_1$, $l_2$ and joint angles $q_1$, $q_2$ puts its tip at

$$x = l_1\cos q_1 + l_2\cos(q_1 + q_2), \qquad y = l_1\sin q_1 + l_2\sin(q_1+q_2).$$

Differentiating each with respect to each joint,

$$J(\mathbf q) = \begin{pmatrix} -l_1 s_1 - l_2 s_{12} & -l_2 s_{12} \\ l_1 c_1 + l_2 c_{12} & l_2 c_{12}\end{pmatrix},$$

with $s_{12} = \sin(q_1 + q_2)$. Tip velocity is $\dot{\mathbf p} = J\dot{\mathbf q}$, and $\det J = l_1 l_2\sin q_2$, the singularity test of Phase 01 lesson 7.

## Numerical Jacobians

Apply lesson 1's central difference to each input in turn:

$$J_{:,j} \approx \frac{\mathbf f(\mathbf x + h\mathbf e_j) - \mathbf f(\mathbf x - h\mathbf e_j)}{2h},$$

costing $2n$ evaluations, with a best accuracy around $10^{-10}$ because of round-off.

### The complex-step derivative

For a real-analytic $f$, expand with an imaginary step:

$$f(x + ih) = f(x) + ihf'(x) - \tfrac{h^2}{2}f''(x) - i\tfrac{h^3}{6}f'''(x) + \dots$$

Taking the imaginary part,

$$f'(x) = \frac{\operatorname{Im} f(x + ih)}{h} + O(h^2).$$

There is no subtraction, so no cancellation: you can take $h = 10^{-20}$ and get the derivative to machine precision. It works whenever your code uses operations that extend to complex numbers (no `abs`, no comparisons on the perturbed value).

## Worked example

Let $l_1 = 0.3$ m, $l_2 = 0.2$ m, $q_1 = 30°$, $q_2 = 45°$. Then $s_1 = 0.5$, $c_1 = 0.8660$, $s_{12} = \sin 75° = 0.9659$, $c_{12} = \cos 75° = 0.2588$.

$$J = \begin{pmatrix} -0.15 - 0.1932 & -0.1932 \\ 0.2598 + 0.0518 & 0.0518\end{pmatrix} = \begin{pmatrix} -0.3432 & -0.1932 \\ 0.3116 & 0.0518\end{pmatrix}.$$

Check: $\det J = -0.3432\times0.0518 + 0.1932\times 0.3116 = 0.0424$, and $l_1l_2\sin 45° = 0.06\times0.7071 = 0.0424$. Driving joint 1 at 1 rad/s alone moves the tip at $(-0.343, 0.312)$ m/s.

## Code it from scratch

:::code file=jacobian.py
```python
import math
import numpy as np

L1, L2 = 0.3, 0.2

def fk(q, cos=np.cos, sin=np.sin):
    return np.array([L1 * cos(q[0]) + L2 * cos(q[0] + q[1]),
                     L1 * sin(q[0]) + L2 * sin(q[0] + q[1])])

def jac_analytic(q):
    s1, c1 = math.sin(q[0]), math.cos(q[0]); s12, c12 = math.sin(q[0] + q[1]), math.cos(q[0] + q[1])
    return np.array([[-L1 * s1 - L2 * s12, -L2 * s12], [L1 * c1 + L2 * c12, L2 * c12]])

def jac_central(f, x, h=1e-6):
    x = np.asarray(x, float); cols = []
    for j in range(len(x)):
        e = np.zeros_like(x); e[j] = h
        cols.append((f(x + e) - f(x - e)) / (2 * h))
    return np.column_stack(cols)

def jac_complex(f, x, h=1e-20):
    x = np.asarray(x, complex); cols = []
    for j in range(len(x)):
        e = np.zeros_like(x); e[j] = 1j * h
        cols.append(np.imag(f(x + e)) / h)
    return np.column_stack(cols)

if __name__ == "__main__":
    q = np.radians([30, 45])
    J = jac_analytic(q)
    assert np.allclose(J, [[-0.3432, -0.1932], [0.3116, 0.0518]], atol=1e-4)
    assert abs(np.linalg.det(J) - L1 * L2 * math.sin(q[1])) < 1e-15
    rng = np.random.default_rng(13)
    worst_c, worst_z = 0, 0
    for _ in range(500):
        q = rng.uniform(-math.pi, math.pi, 2)
        Ja = jac_analytic(q)
        worst_c = max(worst_c, abs(jac_central(fk, q) - Ja).max())
        worst_z = max(worst_z, abs(jac_complex(fk, q) - Ja).max())
    print(f"max error: central {worst_c:.1e}, complex step {worst_z:.1e}")
    assert worst_c < 1e-8 and worst_z < 1e-15
```
:::end

## Exercises

:::exercise
At $q_2 = 0$ (arm straight), compute $J$ for $q_1 = 0$ and explain which tip direction is lost.
:::solution
1. $J = \begin{pmatrix} 0 & 0 \\ l_1 + l_2 & l_2\end{pmatrix}$, so $\det J = 0$.
2. Both columns point along y: no joint speed can move the tip along x, the direction of the stretched arm.
:::end

:::exercise
Use the complex step to differentiate $f(x) = x^2$ at $x = 3$ with $h = 10^{-20}$.
:::solution
$f(3 + ih) = 9 - h^2 + 6ih$, so $\operatorname{Im}f/h = 6$, exactly $f'(3)$. The $-h^2$ term lives in the real part and never touches the answer.
:::end

## Quiz

:::quiz
- type: num
  q: For the worked example ($l_1 = 0.3$, $l_2 = 0.2$, $q = (30°, 45°)$), what is $J_{11}$?
  answer: -0.34319
  tol: 0.001
  py: "-0.3*math.sin(math.radians(30)) - 0.2*math.sin(math.radians(75))"
  explain: $-0.3(0.5) - 0.2(0.9659) = -0.3432$.
- type: num
  q: What is $\det J$ for that configuration, in m²?
  answer: 0.042426
  tol: 0.001
  py: "0.3*0.2*math.sin(math.radians(45))"
  explain: $l_1l_2\sin q_2 = 0.06\times0.7071 = 0.0424$.
- type: mc
  q: Why can the complex-step method use h = 10⁻²⁰?
  options:
    - Complex numbers have more precision
    - It involves no subtraction of nearly equal numbers, so there is no cancellation
    - Round-off is zero for complex numbers
    - It only works for polynomials
  answer: 1
  explain: The derivative comes from the imaginary part directly, so the $\varepsilon/h$ round-off term never appears.
- type: mc
  q: How many function evaluations does a central-difference Jacobian of $f:\mathbb R^n\to\mathbb R^m$ need?
  options:
    - n
    - 2n
    - m
    - n·m
  answer: 1
  explain: Two evaluations per input direction, each returning all $m$ outputs.
- type: num
  q: With $J$ from the worked example, what tip speed in x (m/s) results from $\dot{\mathbf q} = (1, -1)$ rad/s?
  answer: -0.15
  tol: 0.002
  py: "(-0.3*math.sin(math.radians(30)) - 0.2*math.sin(math.radians(75))) - (-0.2*math.sin(math.radians(75)))"
  explain: $J_{11} - J_{12} = -0.3432 + 0.1932 = -0.15$ m/s. With $\dot q_1 + \dot q_2 = 0$ link 2 keeps its orientation, so only $-l_1 s_1 = -0.15$ remains.
:::end

:::verify
import math, numpy as np
s1,c1,s12,c12 = .5, math.cos(math.radians(30)), math.sin(math.radians(75)), math.cos(math.radians(75))
assert abs(c1-.8660)<5e-5 and abs(s12-.9659)<5e-5 and abs(c12-.2588)<5e-5
J = np.array([[-.3*s1-.2*s12, -.2*s12],[.3*c1+.2*c12, .2*c12]])
assert np.allclose(J, [[-.3432,-.1932],[.3116,.0518]], atol=5e-5)
assert abs(np.linalg.det(J)-.0424)<5e-5 and abs(.06*math.sin(math.pi/4)-.0424)<5e-5
:::end
