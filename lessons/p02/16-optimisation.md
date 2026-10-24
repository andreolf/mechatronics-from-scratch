---
id: p02-l16
minutes: 40
summary: System identification is optimisation, choosing parameters so a model matches data. You derive the step-size limit of gradient descent, build Gauss-Newton from linearised residuals, and recover a spring's stiffness and damping within 2 % from a noisy step response.
---

## Gradient descent and its speed limit

To minimise a smooth cost $J(\mathbf p)$, step downhill:

$$\mathbf p_{k+1} = \mathbf p_k - \alpha\,\nabla J(\mathbf p_k).$$

How large may $\alpha$ be? Near a minimum, $J$ looks like a quadratic bowl $\tfrac12\mathbf p^\top H\mathbf p$ with Hessian $H$. Then $\nabla J = H\mathbf p$ and the update is $\mathbf p_{k+1} = (I - \alpha H)\mathbf p_k$. Along each eigen-direction of $H$ with curvature $\lambda_i$ the error is multiplied by $1 - \alpha\lambda_i$, so convergence needs

$$0 < \alpha < \frac{2}{L}, \qquad L = \lambda_{\max}(H).$$

This is lesson 7's Euler stability condition again: gradient descent is explicit Euler on the "gradient flow" $\dot{\mathbf p} = -\nabla J$. With the best fixed step $\alpha = 2/(L + \mu)$, where $\mu = \lambda_{\min}$, the error shrinks per step by $(\kappa - 1)/(\kappa + 1)$ with $\kappa = L/\mu$. Badly scaled problems with large $\kappa$ crawl.

:::figure widget=gd caption="Gradient descent on ½(x² + 10y²), so L = 10. Below α = 0.1 the path creeps; near 0.2 it zig-zags across the valley; above 0.2 it diverges."
:::end

## Gauss-Newton for least squares

Model fitting usually has the form $J(\mathbf p) = \tfrac12\lVert\mathbf r(\mathbf p)\rVert^2$, where $r_i = \text{model}_i(\mathbf p) - \text{data}_i$. Linearise the residual around the current guess with its Jacobian $R = \partial\mathbf r/\partial\mathbf p$:

$$\mathbf r(\mathbf p + \Delta\mathbf p) \approx \mathbf r(\mathbf p) + R\,\Delta\mathbf p .$$

Minimising the norm of that linear model is a linear least-squares problem (Phase 01 lesson 8), whose normal equations give the step

$$R^\top R\,\Delta\mathbf p = -R^\top\mathbf r .$$

Gauss-Newton uses the curvature $R^\top R$ for free, so it takes well-scaled steps without a hand-tuned $\alpha$. When the model fits the data well, it converges almost as fast as Newton. Levenberg-Marquardt adds $\lambda I$ to $R^\top R$ to make it robust far from the answer, which is what `scipy.optimize.least_squares` does.

## Worked example: gradient descent by hand

Minimise $J = \tfrac12(x^2 + 10y^2)$ from $(2.6, 1.2)$, so $L = 10$, $\mu = 1$.

- $\alpha = 0.1$: the factors are $1 - 0.1 = 0.9$ for x and $1 - 1 = 0$ for y. One step kills the y error, then x shrinks by 10 % per step: 53 steps to bring it from 2.6 below $10^{-2}$.
- $\alpha = 0.21 > 2/L$: the y factor is $1 - 2.1 = -1.1$. It flips sign and grows 10 % per step.
- Best fixed step $\alpha = 2/11 = 0.182$: both factors have magnitude $9/11 = 0.818$.

## Code it from scratch: fit a spring from its step response

A mass $m = 0.5$ kg is known; stiffness $k$ and damping $c$ are not. You apply a 1 N step and record position at 200 Hz with sensor noise of 2 % of full scale.

:::code file=fit_spring.py
```python
import math
import numpy as np

M = 0.5

def model(p, t):
    k, c = p
    wn, z = math.sqrt(k / M), c / (2 * math.sqrt(k * M))
    wd = wn * math.sqrt(1 - z * z)
    return (1 / k) * (1 - np.exp(-z * wn * t) / math.sqrt(1 - z * z) * np.sin(wd * t + math.acos(z)))

def gauss_newton(res, p0, iters=30, tol=1e-10):
    p = np.asarray(p0, float)
    for _ in range(iters):
        r = res(p)
        R = np.column_stack([(res(p + dp) - res(p - dp)) / (2 * dp[j])        # central-difference Jacobian
                             for j, dp in enumerate(np.diag(1e-6 * np.abs(p)))])
        step = np.linalg.solve(R.T @ R, -R.T @ r)
        p = p + step
        if np.all(np.abs(step) < tol * np.abs(p)): break
    return p

def gradient_descent_bowl(alpha, n=40):
    x, y = 2.6, 1.2
    for _ in range(n): x, y = x - alpha * x, y - alpha * 10 * y
    return x, y

if __name__ == "__main__":
    t = np.linspace(0, 1.5, 301)
    k_true, c_true = 200.0, 4.0
    clean = model([k_true, c_true], t)
    data = clean + np.random.default_rng(16).normal(0, 0.02 * clean.max(), t.size)
    k_hat, c_hat = gauss_newton(lambda p: model(p, t) - data, [150.0, 6.0])
    print(f"k = {k_hat:.2f} N/m ({100*(k_hat/k_true - 1):+.2f} %), c = {c_hat:.3f} N·s/m ({100*(c_hat/c_true - 1):+.2f} %)")
    assert abs(k_hat / k_true - 1) < 0.02 and abs(c_hat / c_true - 1) < 0.02
    assert abs(gradient_descent_bowl(0.15)[1]) < 1e-10 and abs(gradient_descent_bowl(0.21)[1]) > 1.2
```
:::end

Starting 25 % low on stiffness and 50 % high on damping, Gauss-Newton converges in a handful of iterations to within about 0.2 % of both true values despite the noise.

## Exercises

:::exercise
Gradient descent on $J = \tfrac12(4x^2 + y^2)$. What is the largest stable step, and the best fixed step?
:::solution
1. Curvatures are 4 and 1, so $L = 4$, $\mu = 1$.
2. Stable for $\alpha < 2/4 = 0.5$.
3. Best $\alpha = 2/(4 + 1) = 0.4$, with rate $(4 - 1)/(4 + 1) = 0.6$ per step.
:::end

:::exercise
Why does Gauss-Newton need a good starting guess on the spring fit, and what could go wrong if you started at $c = 30$ N·s/m?
:::solution
The model assumes $\zeta < 1$ (it uses $\sqrt{1 - \zeta^2}$). At $k = 150$, $c = 30$ gives $\zeta = 30/(2\sqrt{75}) = 1.73$, so the model is undefined and the fit fails. Start from a physically sensible guess, read off the overshoot and peak time (lesson 6), or use a model valid for all $\zeta$.
:::end

## Quiz

:::quiz
- type: num
  q: What is the largest stable gradient descent step for $J = \tfrac12(x^2 + 10y^2)$?
  answer: 0.2
  tol: 0.001
  py: "2/10"
  explain: $\alpha < 2/L$ with $L = 10$.
- type: num
  q: With the best fixed step on that bowl, by what factor does the error shrink per step?
  answer: 0.81818
  tol: 0.002
  py: "(10-1)/(10+1)"
  explain: $(\kappa - 1)/(\kappa + 1) = 9/11 = 0.818$.
- type: mc
  q: The Gauss-Newton step solves…
  options:
    - RᵀR Δp = −Rᵀr, the normal equations of the linearised residual
    - Δp = −α r
    - H Δp = r with the exact Hessian
    - R Δp = p
  answer: 0
  explain: Linearise $\mathbf r$, then solve the linear least-squares problem for the step.
- type: num
  q: For $J = \tfrac12(4x^2 + y^2)$, what is the best fixed step size?
  answer: 0.4
  tol: 0.001
  py: "2/(4+1)"
  explain: $2/(L + \mu) = 2/5$.
- type: mc
  q: Gradient descent with step α is the same as which integrator applied to ṗ = −∇J?
  options:
    - RK4
    - Explicit Euler with step α
    - Implicit Euler
    - Symplectic Euler
  answer: 1
  explain: $\mathbf p_{k+1} = \mathbf p_k + \alpha(-\nabla J)$ is one explicit Euler step, which is why the stability limits match.
:::end

:::verify
import math
assert abs(2/11-0.182)<5e-4 and abs(9/11-0.818)<5e-4
n = math.ceil(math.log(1e-2/2.6)/math.log(0.9)); assert n == 53, n
:::end
