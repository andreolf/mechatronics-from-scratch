---
id: p16-l08
minutes: 35
summary: A potential field plans nothing in advance. The goal pulls, obstacles push, and the robot slides downhill on the sum, which is cheap enough to run every control cycle. You derive the attractive and repulsive potentials and their gradients, implement gradient-descent navigation, and test that it reaches the goal on an open map and that it detects being stuck in the local minimum of a U-shaped obstacle.
---

## Pull and push

The goal creates an **attractive** potential, a bowl:

$$U_{att} = \tfrac12 k_{att} \lVert q - q_{goal} \rVert^2, \qquad -\nabla U_{att} = -k_{att}(q - q_{goal}).$$

Each obstacle creates a **repulsive** potential that acts only within a range $\rho_0$ of its surface, where $\rho(q)$ is the distance to the surface:

$$U_{rep} = \begin{cases} \tfrac12 k_{rep}\left(\dfrac{1}{\rho} - \dfrac{1}{\rho_0}\right)^2 & \rho < \rho_0 \\ 0 & \rho \ge \rho_0 \end{cases}, \qquad -\nabla U_{rep} = k_{rep}\left(\frac1\rho - \frac1{\rho_0}\right)\frac{1}{\rho^2}\,\nabla\rho.$$

The repulsion grows without bound at the surface, so the robot can't touch it, and it vanishes smoothly at $\rho_0$. The robot moves along $-\nabla U$, here with a speed limit.

## Local minima

Wherever the forces cancel, $\nabla U = 0$. At the goal that is the plan. Anywhere else the robot stops for good. A **U-shaped** obstacle with the goal behind it is the classic trap: the attraction pulls the robot into the U, and every way out leads uphill.

Potential fields are fast and reactive but **incomplete**: they can fail when a path exists. So a practical system detects the stall (the gradient vanishes, or the robot stops making progress, away from the goal) and falls back to a global planner such as A*, or uses a **navigation function**, a potential designed to have a single minimum.

:::figure widget=potfield caption="The robot sliding down the summed potential. On the open map it reaches the goal. On the U-shaped trap it stops in a local minimum, where the arrows cancel. Increase the repulsive gain or range and watch the trap change."
:::end

## Worked example

Illustrative gains: $k_{att} = 1$, $k_{rep} = 2$, $\rho_0 = 1$ m, steps of 2 cm.

1. The analytic gradient matches a finite-difference gradient to 6 significant figures.
2. Open map, from $(0, 0)$ to $(10, 6)$ past three circular obstacles: the robot reaches the goal in 709 steps along a 12.14 m path (the straight line is 11.66 m), never closer than 0.53 m to an obstacle.
3. U-shaped trap, from $(1, 3)$ to a goal at $(8, 3)$ behind the U: the robot stops at $(3.99, 3.00)$, 4.01 m from the goal, with $|\nabla U| = 5 \times 10^{-4}$. Every point on a 5 cm ring around it has higher $U$: it is a true local minimum, not a slow patch.

## Code it from scratch

:::code file=potential.py
```python
import numpy as np

K_ATT, K_REP, RHO0 = 1.0, 2.0, 1.0      # illustrative gains and the repulsive range (m)

def grad_U(q, goal, obst):
    """gradient of U = 1/2 k_att |q - goal|^2 + sum over obstacles of 1/2 k_rep (1/rho - 1/rho0)^2 for rho < rho0"""
    g = K_ATT * (q - goal)
    for c, r in obst:
        d = q - c; dist = np.linalg.norm(d); rho = dist - r          # distance to the obstacle's surface
        if rho < RHO0:
            g += -K_REP * (1 / rho - 1 / RHO0) / rho**2 * d / dist   # pushes away, growing without bound near the surface
    return g

def U(q, goal, obst):
    u = 0.5 * K_ATT * np.sum((q - goal)**2)
    for c, r in obst:
        rho = np.linalg.norm(q - c) - r
        if rho < RHO0: u += 0.5 * K_REP * (1 / rho - 1 / RHO0)**2
    return u

def navigate(start, goal, obst, step=0.02, iters=4000, tol=0.05, stall=1e-3):
    """descend the potential with a speed limit; stop at the goal or when the robot stops moving away from it"""
    q = np.array(start, float); path = [q.copy()]
    for _ in range(iters):
        g = grad_U(q, goal, obst); n = np.linalg.norm(g)
        if np.linalg.norm(q - goal) < tol: return path, "goal"
        if n < stall: return path, "local minimum"
        q = q - step * g / max(n, 1.0)                                # move at most `step` per iteration
        path.append(q.copy())
        if len(path) > 200 and np.linalg.norm(path[-1] - path[-200]) < 10 * step:
            return path, "local minimum"                              # oscillating in place
    return path, "gave up"

OPEN = [(np.array([3.0, 2.5]), 0.6), (np.array([6.0, 4.0]), 0.8), (np.array([8.0, 1.5]), 0.5)]
U_TRAP = [(np.array([5.0, y]), 0.35) for y in np.arange(1.0, 5.01, 0.5)] + \
         [(np.array([x, 1.0]), 0.35) for x in (4.0, 3.0)] + [(np.array([x, 5.0]), 0.35) for x in (4.0, 3.0)]

def test_gradient_is_right():
    q, goal = np.array([2.2, 2.0]), np.array([10.0, 6.0]); h = 1e-6
    num = np.array([(U(q + h * e, goal, OPEN) - U(q - h * e, goal, OPEN)) / (2 * h) for e in np.eye(2)])
    print(f"analytic gradient {grad_U(q, goal, OPEN).round(5)}, finite differences {num.round(5)}")
    assert np.allclose(num, grad_U(q, goal, OPEN), rtol=1e-6)

def test_open_map_reaches_goal():
    goal = np.array([10.0, 6.0]); path, why = navigate([0.0, 0.0], goal, OPEN)
    P = np.array(path); clear = min(np.linalg.norm(P - c, axis=1).min() - r for c, r in OPEN)
    print(f"open map: {why} after {len(path)} steps, path length {np.sum(np.linalg.norm(np.diff(P, axis=0), axis=1)):.2f} m, closest approach to an obstacle {clear:.2f} m")
    assert why == "goal" and clear > 0

def test_u_trap_is_detected():
    goal = np.array([8.0, 3.0]); path, why = navigate([1.0, 3.0], goal, U_TRAP)
    q = path[-1]
    print(f"U-shaped trap: {why} at ({q[0]:.2f}, {q[1]:.2f}), {np.linalg.norm(q - goal):.2f} m from the goal, |grad U| = {np.linalg.norm(grad_U(q, goal, U_TRAP)):.1e}")
    assert why == "local minimum" and np.linalg.norm(q - goal) > 2
    # it really is a minimum of U: every nearby point is higher
    ring = [U(q + 0.05 * np.array([np.cos(a), np.sin(a)]), goal, U_TRAP) for a in np.linspace(0, 2 * np.pi, 36, endpoint=False)]
    print(f"U there {U(q, goal, U_TRAP):.4f}; lowest U on a 5 cm ring around it {min(ring):.4f}")
    assert min(ring) > U(q, goal, U_TRAP)

test_gradient_is_right()
test_open_map_reaches_goal()
test_u_trap_is_detected()
print("PASS")
```
:::end

## Exercises

:::exercise
Why does a robot sometimes oscillate in a narrow corridor under a potential field?
:::solution
Both walls push, and the repulsion rises steeply near each. A step that overshoots the centre lands where the other wall pushes harder, so the robot zig-zags. Smaller steps, a velocity filter or a smaller $\rho_0$ help; the global planners avoid the issue.
:::end

:::exercise
The goal is 0.3 m from a wall, with $\rho_0 = 1$ m. What goes wrong?
:::solution
At the goal, the repulsion is not zero, so the minimum of $U$ is shifted away from the wall and the robot stops short. This is the "goal non-reachable with obstacles nearby" problem. Reduce $\rho_0$ near the goal or make the repulsion fade as the goal gets close.
:::end

## Quiz

:::quiz
- type: num
  q: Attractive force magnitude 3 m from the goal with k_att = 1.5?
  answer: 4.5
  tol: 0.001
  py: "1.5*3"
  explain: k_att times the distance.
- type: num
  q: Repulsive force magnitude at ρ = 0.5 m with k_rep = 2 and ρ0 = 1 m?
  answer: 8
  tol: 0.001
  py: "2*(1/0.5-1/1)/0.5**2"
  explain: k_rep(1/ρ − 1/ρ0)/ρ².
- type: num
  q: Repulsive force at ρ = 1.2 m with ρ0 = 1 m?
  answer: 0
  tol: 0.001
  py: "0.0"
  explain: Outside the range, no repulsion.
- type: num
  q: Repulsive potential at ρ = 0.25 m with k_rep = 2 and ρ0 = 1 m?
  answer: 9
  tol: 0.001
  py: "0.5*2*(1/0.25-1)**2"
  explain: ½ k_rep (1/ρ − 1/ρ0)².
- type: mc
  q: A potential-field planner is incomplete because…
  options:
    - it can stop at a local minimum when a path exists
    - it needs a grid
    - its repulsion is unbounded
    - it can't handle moving goals
  answer: 0
  explain: Forces can cancel away from the goal.
- type: mc
  q: A sensible response to a detected local minimum is…
  options:
    - fall back to a global planner such as A*
    - increase the step size until it escapes
    - set the repulsive gain to zero
    - stop and report success
  answer: 0
  explain: Reactive fields work best combined with a global plan.
:::end
