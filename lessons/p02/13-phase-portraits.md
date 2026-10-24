---
id: p02-l13
minutes: 35
summary: A phase portrait shows every possible motion of a two-state system at once. You find equilibria by solving f(x) = 0, sketch nullclines and vector fields, classify each equilibrium from its eigenvalues as a node, saddle or focus, and detect the pendulum's equilibria automatically.
---

## The state plane

For a system with two states, say angle and angular velocity, plot $x_2$ against $x_1$. At every point the dynamics $\dot{\mathbf x} = \mathbf f(\mathbf x)$ assign a velocity arrow, and each solution is a curve that follows the arrows. A **phase portrait** draws the arrow field and a few trajectories. You can read stability, oscillation and the regions that lead to each outcome without solving anything.

## Equilibria and nullclines

An **equilibrium** is a point where nothing moves: $\mathbf f(\mathbf x^*) = 0$. Geometrically it lies where the two **nullclines** cross: the curve $\dot x_1 = 0$, where arrows are vertical, and the curve $\dot x_2 = 0$, where they are horizontal.

For the damped pendulum $\ddot\theta = -\tfrac{g}{l}\sin\theta - c\dot\theta$, with $x_1 = \theta$ and $x_2 = \omega = \dot\theta$:

$$\dot x_1 = x_2, \qquad \dot x_2 = -\tfrac{g}{l}\sin x_1 - c\,x_2 .$$

The first nullcline is the axis $x_2 = 0$; on it the second vanishes when $\sin x_1 = 0$. So the equilibria are $\theta = k\pi$ with $\omega = 0$: hanging ($k$ even) and upright ($k$ odd).

## Classifying an equilibrium

Near $\mathbf x^*$, $\mathbf f(\mathbf x) \approx J(\mathbf x - \mathbf x^*)$ with the Jacobian $J = \partial\mathbf f/\partial\mathbf x$ (lesson 14 develops this). Its eigenvalues decide the local picture:

| Eigenvalues | Type | Behaviour |
|---|---|---|
| Real, both negative | Stable node | Trajectories slide straight in |
| Real, opposite signs | Saddle | In along one direction, out along the other |
| Complex, negative real part | Stable focus | Spiral in |
| Complex, positive real part | Unstable focus | Spiral out |
| Purely imaginary | Centre | Closed orbits (linear analysis is inconclusive) |

For the pendulum,

$$J = \begin{pmatrix} 0 & 1 \\ -\tfrac{g}{l}\cos\theta^* & -c\end{pmatrix}.$$

:::figure widget=phase args={"system":"pendulum"} caption="Pendulum phase portrait. Amber dots are hanging equilibria (stable foci), red dots upright ones (saddles). Tap anywhere to launch a trajectory; set damping to zero to see closed orbits and the separatrix."
:::end

## Worked example: a 1 m pendulum with c = 0.5 s⁻¹

$g/l = 9.81$ s⁻².

- **Hanging**, $\theta^* = 0$: $\lambda^2 + 0.5\lambda + 9.81 = 0$, so $\lambda = -0.25 \pm 3.122i$. A stable focus: it rings at 3.12 rad/s (0.50 Hz) and decays with time constant $1/0.25 = 4$ s.
- **Upright**, $\theta^* = \pi$: $\cos\pi = -1$, so $\lambda^2 + 0.5\lambda - 9.81 = 0$, giving $\lambda = 2.892$ and $-3.392$. A saddle: almost every nearby start falls away.

The two trajectories that run into the upright saddle are the **separatrices**: they split swings that stop short of the top from ones that go over.

## Code it from scratch

:::code file=equilibria.py
```python
import math
import numpy as np

G_L, C = 9.81, 0.5
f = lambda x: np.array([x[1], -G_L * math.sin(x[0]) - C * x[1]])
jac = lambda x: np.array([[0.0, 1.0], [-G_L * math.cos(x[0]), -C]])

def find_equilibria(f, jac, starts, tol=1e-12):
    found = []
    for x in starts:
        x = np.array(x, float)
        for _ in range(50):
            dx = np.linalg.solve(jac(x), -f(x)); x += dx
            if np.abs(dx).max() < tol: break
        if np.abs(f(x)).max() < 1e-10 and not any(np.allclose(x, y, atol=1e-6) for y in found):
            found.append(x)
    return sorted(found, key=lambda v: v[0])

def classify(J):
    lam = np.linalg.eigvals(J)
    if np.all(abs(lam.imag) > 1e-12):
        return ("stable focus" if lam.real.max() < 0 else "unstable focus" if lam.real.min() > 0 else "centre"), lam
    re = np.sort(lam.real)
    return ("stable node" if re[1] < 0 else "unstable node" if re[0] > 0 else "saddle"), lam

if __name__ == "__main__":
    starts = [(a, w) for a in np.linspace(-7, 7, 29) for w in (-1.0, 0.0, 1.0)]
    eq = find_equilibria(f, jac, starts)
    eq = [e for e in eq if -7 <= e[0] <= 7]
    angles = [round(e[0] / math.pi) for e in eq]
    assert angles == [-2, -1, 0, 1, 2] and all(abs(e[0] - k * math.pi) < 1e-9 for e, k in zip(eq, angles))
    for e, k in zip(eq, angles):
        kind, lam = classify(jac(e))
        print(f"θ* = {k:+d}π: {kind}, λ = {np.round(lam, 3)}")
        assert kind == ("stable focus" if k % 2 == 0 else "saddle")
    _, lam = classify(jac([0, 0])); assert np.allclose(sorted(lam.imag), [-3.1222, 3.1222], atol=1e-4)
    _, lam = classify(jac([math.pi, 0])); assert np.allclose(sorted(lam.real), [-3.392, 2.892], atol=1e-3)
```
:::end

## Exercises

:::exercise
Classify the origin of the Van der Pol oscillator $\ddot x - \mu(1 - x^2)\dot x + x = 0$ for $\mu = 1$.
:::solution
1. $J = \begin{pmatrix} 0 & 1 \\ -1 & \mu\end{pmatrix}$ at the origin.
2. $\lambda^2 - \mu\lambda + 1 = 0$, so for $\mu = 1$: $\lambda = 0.5 \pm 0.866i$.
3. An unstable focus: trajectories spiral out until they meet the limit cycle.
:::end

:::exercise
At what damping $c$ does the hanging pendulum ($g/l = 9.81$) change from a focus to a node?
:::solution
The eigenvalues become real when $c^2 \ge 4g/l$, so $c = 2\sqrt{9.81} = 6.26$ s⁻¹. That is critical damping ($\zeta = 1$).
:::end

## Quiz

:::quiz
- type: num
  q: For the pendulum with g/l = 9.81 and c = 0.5, what is the positive eigenvalue at the upright equilibrium?
  answer: 2.892
  tol: 0.002
  py: "(-0.5 + math.sqrt(0.25 + 4*9.81))/2"
  explain: $\lambda^2 + 0.5\lambda - 9.81 = 0$ gives $\lambda = (-0.5 + 6.284)/2 = 2.892$.
- type: mc
  q: An equilibrium has eigenvalues −2 and +3. What type is it?
  options:
    - Stable node
    - Saddle
    - Centre
    - Stable focus
  answer: 1
  explain: Real eigenvalues of opposite sign give a saddle.
- type: num
  q: At what damping c (in s⁻¹) does the hanging pendulum with g/l = 9.81 become a node?
  answer: 6.2642
  tol: 0.002
  py: "2*math.sqrt(9.81)"
  explain: $c = 2\sqrt{g/l} = 6.264$ s⁻¹.
- type: mc
  q: Where do equilibria lie in the phase plane?
  options:
    - Where trajectories cross
    - At intersections of the nullclines ẋ₁ = 0 and ẋ₂ = 0
    - Only at the origin
    - Where the vector field is largest
  answer: 1
  explain: Both derivatives vanish there, so the state doesn't move.
- type: mc
  q: The Van der Pol origin with μ = 1 has eigenvalues 0.5 ± 0.866i. It is…
  options:
    - a stable focus
    - an unstable focus
    - a saddle
    - a centre
  answer: 1
  explain: Complex eigenvalues with positive real part spiral outward.
:::end

:::verify
import numpy as np, math
lam = np.roots([1,.5,9.81]); assert np.allclose(sorted(lam.imag),[-3.1222,3.1222],atol=1e-4) and np.allclose(lam.real,-.25)
assert abs(3.1222/(2*math.pi)-0.50)<0.005
lam = np.sort(np.roots([1,.5,-9.81]).real); assert np.allclose(lam,[-3.392,2.892],atol=5e-4)
assert np.allclose(np.roots([1,-1,1]), [0.5+0.866j,0.5-0.866j], atol=5e-4) or np.allclose(np.roots([1,-1,1]), [0.5-0.866j,0.5+0.866j], atol=5e-4)
assert abs(2*math.sqrt(9.81)-6.26)<0.005
:::end
