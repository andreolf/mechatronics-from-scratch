---
id: p12-l10
minutes: 35
summary: Most real systems are nonlinear, but near an operating point their behaviour is well described by a linear model whose matrices are the Jacobians of the dynamics at equilibrium. You derive linearisation by Taylor expansion, write a numerical Jacobian that linearises any model automatically, apply it to the orifice tank from lesson 07, and test that the linear model's error is small for small deviations and grows with the square of the step.
---

## Taylor expansion at an equilibrium

Write the model as $\dot x = f(x, u)$. An **equilibrium** $(x_0, u_0)$ satisfies $f(x_0, u_0) = 0$. For small deviations $\delta x = x - x_0$, $\delta u = u - u_0$:

$$\dot{\delta x} \approx \underbrace{\frac{\partial f}{\partial x}\Big|_0}_{A}\,\delta x + \underbrace{\frac{\partial f}{\partial u}\Big|_0}_{B}\,\delta u.$$

The neglected terms are second order, so the linear model's error grows like the **square** of the deviation: half the step, a quarter of the error.

## The tank

From lesson 07, $A_t\dot h = q_{in} - \kappa\sqrt h$ with $\kappa = C_d a\sqrt{2g}$. At equilibrium $h_0 = (q_0/\kappa)^2$, and

$$A = -\frac{\kappa}{2A_t\sqrt{h_0}} = -\frac{q_0}{2A_t h_0}, \qquad B = \frac{1}{A_t}.$$

So the time constant $\tau = 2A_th_0/q_0$ depends on the operating point: a fuller tank responds more slowly. A controller tuned at one level behaves differently at another; gain scheduling (Phase 14) handles that.

## Numerical Jacobians

You don't need symbolic derivatives: a central difference

$$\frac{\partial f_i}{\partial x_j} \approx \frac{f_i(x + \epsilon e_j) - f_i(x - \epsilon e_j)}{2\epsilon}$$

with $\epsilon \approx 10^{-6}\max(1, |x_j|)$ is accurate to about $10^{-9}$ for smooth models. That linearises a full robot model in a few lines.

:::figure widget=linoverlay caption="The orifice tank's response to a step in inflow, nonlinear in lime and linearised in blue. For small steps they overlap; as the step grows the linear model's error grows with its square."
:::end

## Worked example

The lesson 07 tank at $q_0 = 2$ L/s, $h_0 = 1.133$ m, $A_t = 1$ m².

1. $A = -0.002/(2 \times 1 \times 1.133) = -8.83\times10^{-4}$ s⁻¹, so $\tau = 1133$ s.
2. $B = 1$ m⁻², so a +0.2 L/s step changes the level by $B/|A| \times 0.0002 = 0.227$ m in the linear model.
3. The nonlinear steady level for 2.2 L/s is $1.133 \times 1.1^2 = 1.371$ m, a change of 0.238 m: the linear prediction is 4.8 % low, close to half the 10 % step, as the second-order term predicts.

## Code it from scratch

:::code file=linearise.py
```python
import numpy as np
import sympy as sp

At, kappa = 1.0, 0.6 * np.pi * 0.03 ** 2 / 4 * np.sqrt(2 * 9.81)

def tank(x, u):
    return np.array([(u[0] - kappa * np.sqrt(max(x[0], 0.0))) / At])

def jacobians(f, x0, u0):
    x0, u0 = np.array(x0, float), np.array(u0, float)
    fx = lambda x: f(x, u0); fu = lambda u: f(x0, u)
    def jac(g, z):
        cols = []
        for j in range(len(z)):
            e = np.zeros(len(z)); eps = 1e-6 * max(1.0, abs(z[j])); e[j] = eps
            cols.append((g(z + e) - g(z - e)) / (2 * eps))
        return np.column_stack(cols)
    return jac(fx, x0), jac(fu, u0)

def simulate(f, x0, u, T, dt):
    x = np.array(x0, float); out = [x.copy()]
    for _ in range(int(round(T / dt))):
        k1 = f(x, u); k2 = f(x + dt / 2 * k1, u); k3 = f(x + dt / 2 * k2, u); k4 = f(x + dt * k3, u)
        x = x + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4); out.append(x.copy())
    return np.array(out)

q0 = 0.002
h0 = (q0 / kappa) ** 2

def test_jacobian_matches_hand():
    A, B = jacobians(tank, [h0], [q0])
    assert abs(f_eq := tank([h0], [q0])[0]) < 1e-15
    hand = -q0 / (2 * At * h0)
    print(f"h0 = {h0:.4f} m; numerical A = {A[0, 0]:.6e}, hand {hand:.6e}; B = {B[0, 0]:.6f}")
    assert abs(A[0, 0] - hand) / abs(hand) < 1e-7 and abs(B[0, 0] - 1 / At) < 1e-7
    # and against SymPy's exact derivative
    h, u = sp.symbols("h u", positive=True)
    dfdh = sp.diff((u - sp.Float(kappa) * sp.sqrt(h)) / At, h).subs({h: h0, u: q0})
    assert abs(float(dfdh) - A[0, 0]) < 1e-12

def test_error_grows_quadratically():
    A, B = jacobians(tank, [h0], [q0])
    lin = lambda x, u: A @ (x - np.array([h0])) + B @ (u - np.array([q0]))
    errs = []
    for frac in (0.02, 0.04, 0.08, 0.16):
        u = np.array([q0 * (1 + frac)])
        hn = simulate(tank, [h0], u, 8000, 4.0)[:, 0]
        hl = simulate(lin, [h0], u, 8000, 4.0)[:, 0]
        dev = hn[-1] - h0
        errs.append(np.max(np.abs(hn - hl)) / abs(dev))
        print(f"inflow +{frac * 100:4.0f} %: level change {dev * 100:6.2f} cm, linear model error {errs[-1] * 100:5.2f} % of it")
    assert errs[0] < 0.02                       # small near the operating point
    ratios = [errs[i + 1] / errs[i] for i in range(3)]
    assert all(1.8 < r < 2.2 for r in ratios)   # relative error ~ step, so absolute error ~ step^2

def test_pendulum():
    g, l = 9.81, 0.5
    f = lambda x, u: np.array([x[1], -g / l * np.sin(x[0]) + u[0]])
    A_down, _ = jacobians(f, [0.0, 0.0], [0.0])
    A_up, _ = jacobians(f, [np.pi, 0.0], [0.0])
    ev_down, ev_up = np.linalg.eigvals(A_down), np.linalg.eigvals(A_up)
    print(f"pendulum eigenvalues hanging {np.round(ev_down, 3)}, inverted {np.round(ev_up, 3)}")
    assert np.allclose(sorted(ev_down.imag), [-np.sqrt(g / l), np.sqrt(g / l)], atol=1e-6)
    assert np.isclose(max(ev_up.real), np.sqrt(g / l), atol=1e-6)

test_jacobian_matches_hand()
test_error_grows_quadratically()
test_pendulum()
print("PASS")
```
:::end

## Exercises

:::exercise
Linearise the tank at $q_0 = 1$ L/s instead. What's the new time constant, and why does it matter for control?
:::solution
$h_0$ drops by a factor of 4 to 0.283 m, and $\tau = 2A_th_0/q_0 = 2 \times 0.283/0.001 = 566$ s, half the 2 L/s value. The plant is twice as fast at low level, so a controller tuned at high level is more aggressive than intended at low level.
:::end

:::exercise
Why can't you linearise $\dot x = |x|$ at $x = 0$?
:::solution
$|x|$ has no derivative at 0: the slopes from left and right are −1 and +1. Linearisation needs $f$ differentiable at the operating point. Friction, saturation and backlash often have such corners, which is why they need special treatment (describing functions, Phase 13).
:::end

## Quiz

:::quiz
- type: num
  q: Linearised time constant in s of the tank at q₀ = 2 L/s, h₀ = 1.133 m, A_t = 1 m²?
  answer: 1133
  tol: 0.002
  unit: s
  py: "2*1*1.133/0.002"
  explain: 2A_t h₀/q₀.
- type: num
  q: Factor by which the linearisation error grows when the step doubles?
  answer: 4
  tol: 0
  py: "2**2"
  explain: Second-order remainder.
- type: num
  q: Unstable eigenvalue in 1/s of an inverted pendulum with ℓ = 0.5 m?
  answer: 4.429
  tol: 0.001
  unit: 1/s
  py: "(9.81/0.5)**0.5"
  explain: sqrt(g/ℓ).
- type: num
  q: Exact steady level in m at 2.2 L/s if 2 L/s gives 1.133 m?
  answer: 1.371
  tol: 0.002
  unit: m
  py: "1.133*1.1**2"
  explain: h ∝ q².
- type: mc
  q: What is the A matrix of a linearised model?
  options:
    - the Jacobian ∂f/∂x at the operating point
    - f at the operating point
    - the Hessian
    - the inverse of B
  answer: 0
  explain: First-order Taylor term.
- type: mc
  q: Why does the tank's linear model change with the operating level?
  options:
    - the slope of √h depends on h
    - the tank's area changes
    - gravity changes
    - it doesn't
  answer: 0
  explain: The Jacobian is evaluated at h₀.
:::end
