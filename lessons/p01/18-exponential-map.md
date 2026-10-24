---
id: p01-l18
minutes: 40
summary: The exponential map connects angular velocity to rotation. You build the skew-symmetric hat operator, derive Rodrigues' formula as the closed form of exp([ω]×), invert it with the log map, and check your implementation against a general matrix exponential to 10⁻¹⁰.
---

## Cross products as matrices

The cross product with a fixed vector is linear, so it has a matrix. Define the **hat** operator

$$[\boldsymbol\omega]_\times = \begin{pmatrix} 0 & -\omega_3 & \omega_2 \\ \omega_3 & 0 & -\omega_1 \\ -\omega_2 & \omega_1 & 0\end{pmatrix}, \qquad [\boldsymbol\omega]_\times\mathbf v = \boldsymbol\omega\times\mathbf v .$$

It is skew-symmetric, $[\boldsymbol\omega]_\times^\top = -[\boldsymbol\omega]_\times$, and the **vee** operator reads the three numbers back out. Skew-symmetric matrices are the Lie algebra so(3): the space of angular velocities.

## Why exponentials appear

A body spinning at a constant angular velocity $\boldsymbol\omega$ has $\dot R = [\boldsymbol\omega]_\times R$. That is a linear ODE with the solution

$$R(t) = \exp\!\big([\boldsymbol\omega]_\times t\big)\,R(0), \qquad \exp(A) = I + A + \tfrac{A^2}{2!} + \tfrac{A^3}{3!} + \dots$$

## Rodrigues' formula

Write $\boldsymbol\omega t = \theta\,\mathbf u$ with $\lVert\mathbf u\rVert = 1$ and $K = [\mathbf u]_\times$. The key identity, which you can check by multiplying out, is $K^3 = -K$. So the powers cycle: $K^4 = -K^2$, $K^5 = K$, and so on. Group the series by $K$ and $K^2$:

$$\exp(\theta K) = I + \Big(\theta - \tfrac{\theta^3}{3!} + \dots\Big)K + \Big(\tfrac{\theta^2}{2!} - \tfrac{\theta^4}{4!} + \dots\Big)K^2,$$

and recognise the sine and cosine series:

$$\boxed{R = I + \sin\theta\,K + (1 - \cos\theta)\,K^2.}$$

## The log map

Going back, take the trace of Rodrigues' formula: $\operatorname{tr}K = 0$ and $\operatorname{tr}K^2 = -2$, so $\operatorname{tr}R = 3 - 2(1 - \cos\theta) = 1 + 2\cos\theta$. Hence

$$\theta = \arccos\frac{\operatorname{tr}R - 1}{2}, \qquad K = \frac{R - R^\top}{2\sin\theta}.$$

In code, compute $\theta = \operatorname{atan2}(\sin\theta, \cos\theta)$ with $\sin\theta = \lVert\operatorname{vee}(R - R^\top)\rVert/2$: arccos loses about half the digits near 0 and π, atan2 doesn't. Two special cases still need care. Near $\theta = 0$, divide by the series $\sin\theta/\theta \approx 1 - \theta^2/6$ instead of $\sin\theta$. Near $\theta = \pi$, $R - R^\top \approx 0$ carries no axis information; use $R + I = 2\mathbf u\mathbf u^\top$ instead and read $\mathbf u$ from its largest column.

## Worked example

Take $\boldsymbol\omega t = (0, 0, \pi/2)$: $\theta = \pi/2$, $\mathbf u = \mathbf e_3$.

1. $\sin\theta = 1$, $1 - \cos\theta = 1$, and $K^2 = \operatorname{diag}(-1, -1, 0)$.
2. $R = I + K + K^2 = \begin{pmatrix} 0 & -1 & 0 \\ 1 & 0 & 0\\ 0 & 0 & 1\end{pmatrix} = R_z(90°)$.
3. Log map: $\operatorname{tr}R = 1$, so $\theta = \arccos 0 = \pi/2$, and $(R - R^\top)/2 = K$ gives back $\mathbf u = \mathbf e_3$.

A second check with a general angle: a rotation with $\operatorname{tr}R = 2$ has $\theta = \arccos(0.5) = 60°$.

## Code it from scratch

:::code file=so3.py
```python
import math
import numpy as np
from scipy.linalg import expm

def hat(w):
    return np.array([[0, -w[2], w[1]], [w[2], 0, -w[0]], [-w[1], w[0], 0]], float)

def vee(K):
    return np.array([K[2, 1], K[0, 2], K[1, 0]])

def expm_so3(w):
    th = np.linalg.norm(w)
    K = hat(w)
    if th < 1e-8:                                   # series: I + K + K²/2
        return np.eye(3) + K + 0.5 * K @ K
    return np.eye(3) + math.sin(th) / th * K + (1 - math.cos(th)) / th ** 2 * K @ K

def logm_so3(R):
    c = (np.trace(R) - 1) / 2
    s = np.linalg.norm(vee(R - R.T)) / 2           # sinθ
    th = math.atan2(s, c)                           # accurate at every angle, unlike acos
    if th < 1e-8:
        return vee(R - R.T) / 2                     # sinθ/θ → 1
    if math.pi - th < 1e-6:                         # axis from R + I = 2uuᵀ
        B = (R + np.eye(3)) / 2
        u = B[:, np.argmax(np.diag(B))]; u /= np.linalg.norm(u)
        return th * u
    return th / (2 * math.sin(th)) * vee(R - R.T)

if __name__ == "__main__":
    assert np.allclose(expm_so3([0, 0, math.pi / 2]), [[0, -1, 0], [1, 0, 0], [0, 0, 1]])
    rng = np.random.default_rng(12)
    for _ in range(2000):
        u = rng.standard_normal(3); u /= np.linalg.norm(u)
        w = u * rng.uniform(1e-10, 3.1)             # angles below π, where log is unique
        R = expm_so3(w)
        assert np.allclose(R, expm(hat(w)), atol=1e-10)
        assert np.allclose(logm_so3(R), w, atol=1e-8)
    for w in ([math.pi, 0, 0], [0, math.pi - 1e-9, 0], [1e-12, 0, 0]):
        assert np.allclose(expm_so3(logm_so3(expm_so3(w))), expm_so3(w), atol=1e-8)
    print("expm_so3 matches scipy.linalg.expm to 1e-10; log map round-trips, including θ ≈ 0 and θ ≈ π")
```
:::end

## Exercises

:::exercise
Verify $K^3 = -K$ for $K = [\mathbf e_3]_\times$.
:::solution
1. $K = \begin{pmatrix} 0&-1&0\\1&0&0\\0&0&0\end{pmatrix}$, $K^2 = \operatorname{diag}(-1,-1,0)$.
2. $K^3 = K^2 K = \begin{pmatrix} 0 & 1 & 0\\-1&0&0\\0&0&0\end{pmatrix} = -K$.
:::end

:::exercise
A rotation matrix has trace 0. What angle does it rotate by?
:::solution
$\cos\theta = (0 - 1)/2 = -0.5$, so $\theta = 120°$.
:::end

## Quiz

:::quiz
- type: num
  q: A rotation matrix has trace 2. What is its rotation angle in degrees?
  answer: 60
  tol: 0.001
  unit: °
  py: "math.degrees(math.acos((2-1)/2))"
  explain: $\cos\theta = (2 - 1)/2 = 0.5$.
- type: num
  q: A rotation matrix has trace 0. What is its rotation angle in degrees?
  answer: 120
  tol: 0.001
  unit: °
  py: "math.degrees(math.acos((0-1)/2))"
  explain: $\cos\theta = -0.5$ gives $120°$.
- type: mc
  q: Which identity makes the exponential series collapse to Rodrigues' formula?
  options:
    - K² = I
    - K³ = −K for a unit axis
    - K = Kᵀ
    - det K = 1
  answer: 1
  explain: Powers of $K$ cycle between $\pm K$ and $\pm K^2$, so the series splits into the sine and cosine series.
- type: mc
  q: Why does the log map need special handling near θ = π?
  options:
    - The trace is undefined
    - R − Rᵀ is nearly zero, so it carries no axis information
    - The angle becomes negative
    - The exponential diverges
  answer: 1
  explain: $\sin\pi = 0$, so the formula divides zero by zero. Use $R + I = 2\mathbf u\mathbf u^\top$ instead.
- type: num
  q: What is the $(2,1)$ entry of $\exp([\boldsymbol\omega]_\times)$ for $\boldsymbol\omega = (0, 0, 0.3)$?
  answer: 0.29552
  tol: 0.001
  py: "math.sin(0.3)"
  explain: It is $R_z(0.3)$, whose $(2,1)$ entry is $\sin 0.3 = 0.2955$.
:::end

:::verify
import numpy as np, math
K = np.array([[0,-1,0],[1,0,0],[0,0,0.]]); assert np.allclose(K@K, np.diag([-1,-1,0])) and np.allclose(K@K@K, -K)
assert np.allclose(np.eye(3)+K+K@K, [[0,-1,0],[1,0,0],[0,0,1]])
assert abs(np.trace(np.eye(3)+K+K@K)-1) < 1e-15
:::end
