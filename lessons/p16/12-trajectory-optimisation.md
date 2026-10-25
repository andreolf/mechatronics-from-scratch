---
id: p16-l12
minutes: 45
summary: Sampling planners return paths that are collision-free but jagged. Trajectory optimisation starts from any path, even one straight through an obstacle, and bends it to trade smoothness against clearance. You derive the minimum-jerk curve and a discrete smoothness cost, then implement a CHOMP-style optimiser with an obstacle cost and the covariant update, and test that the cost falls at every step, the final path clears every obstacle, and the covariant update beats plain gradient descent.
---

## Smoothness as a cost

Among all motions from rest to rest in time $T$, the one that minimises the integrated squared **jerk**

$$J = \int_0^T \dddot x(t)^2\, dt$$

satisfies the Euler-Lagrange equation $x^{(6)} = 0$, so it is a quintic. With zero velocity and acceleration at both ends, it is exactly the quintic of lesson 02, $x = x_0 + D(10\tau^3 - 15\tau^4 + 6\tau^5)$. Human reaching movements are close to it.

Optimisers work with a discrete stand-in. For a path of $N$ waypoints $x_1 \dots x_N$ between fixed ends, CHOMP's smoothness cost sums squared first differences, the squared velocities when the waypoints are evenly spaced in time:

$$\mathcal{F}_{smooth} = \tfrac12 \sum_{i=0}^{N} \lVert x_{i+1} - x_i \rVert^2 = \tfrac12 \lVert K x + e \rVert^2 = \tfrac12 x^T A x + b^T x + c, \qquad A = K^T K,$$

where $K$ is the first-difference matrix and $e$ holds the fixed ends. It is smallest for evenly spaced points on a straight line. Penalising second or third differences instead gives smoother motion in time, at the price of a much worse-conditioned $A$.

## Obstacle cost

For each waypoint, with $d$ the distance to the nearest obstacle surface and a clearance band $\varepsilon$:

$$c(d) = \begin{cases} -d + \varepsilon/2 & d < 0 \\ (\varepsilon - d)^2 / (2\varepsilon) & 0 \le d < \varepsilon \\ 0 & d \ge \varepsilon \end{cases}$$

which is smooth at $0$ and $\varepsilon$ and pushes outwards with a gradient along the distance gradient. CHOMP removes the component of that push along the path, so obstacles bend the path sideways instead of bunching up the waypoints. The total cost is $\mathcal{F} = \mathcal{F}_{smooth} + \lambda \mathcal{F}_{obs}$.

## The covariant update

Plain gradient descent, $x \leftarrow x - \alpha \nabla \mathcal F$, moves single waypoints and makes kinks, which the smoothness term then slowly irons out. CHOMP instead steps with

$$x \leftarrow x - \alpha A^{-1} \nabla \mathcal{F}.$$

$A^{-1}$ spreads each waypoint's push smoothly along the whole path: it is gradient descent measured in a norm where non-smooth changes are expensive. Its largest eigenvalue is big (here about 260), so the code also caps each step so that no waypoint moves more than 10 cm, and halves the step whenever the cost would rise, so it never does.

:::figure widget=chomp caption="A path starting straight through two obstacles, bent by the optimiser. Step through the iterations and change the obstacle weight; compare the covariant update with plain gradient descent."
:::end

## Worked example

From $(0, 0)$ to $(10, 0)$ with 50 free waypoints, two illustrative circular obstacles, $\varepsilon = 0.6$ m and $\lambda = 20$.

1. The analytic smoothness gradient matches finite differences to $3 \times 10^{-10}$, and gradient $- Ax$ is the same constant $b$ everywhere.
2. The straight line penetrates 0.69 m into an obstacle; its cost is 214.7.
3. After 300 covariant steps the cost is 1.228 and has fallen at every step. The path weaves between the obstacles, passing below the first and above the second ($y$ from $-1.30$ to $0.80$ m), 11.18 m long. It keeps 0.598 m from them at the waypoints and 0.594 m between waypoints.
4. Cost after 30, 100 and 300 steps: covariant update 1.235, 1.229, 1.228; plain gradient 1.364, 1.307, 1.265.

The optimiser only finds a **local** optimum. Started on the other side of an obstacle, it bends the other way; it can't jump across one. That is why it is usually seeded with a path from a sampling planner.

## Code it from scratch

:::code file=chomp.py
```python
import numpy as np

START, GOAL, N = np.array([0.0, 0.0]), np.array([10.0, 0.0]), 50          # 50 free waypoints between fixed ends
OBST = [(np.array([4.0, 0.3]), 1.0), (np.array([7.0, -0.6]), 0.8)]         # illustrative circular obstacles
EPS, LAM = 0.6, 20.0                                                       # clearance band (m) and obstacle weight

# smoothness, as in CHOMP: half the sum of squared first differences of [START, x_1..x_N, GOAL].
# It equals 1/2 x^T A x + b^T x + c with A = K^T K, K the first-difference operator on the free waypoints.
K = np.zeros((N + 1, N))
for i in range(N + 1):
    if i < N: K[i, i] = 1.0
    if i > 0: K[i, i - 1] = -1.0
A = K.T @ K

def diffs(X): return np.diff(np.vstack([START, X, GOAL]), axis=0)
def smooth_cost(X): return 0.5 * np.sum(diffs(X)**2)
def smooth_grad(X): return K.T @ diffs(X)

def dist(p):
    """signed distance to the nearest obstacle surface, and its gradient"""
    best, grad = np.inf, None
    for c, r in OBST:
        d = np.linalg.norm(p - c)
        if d - r < best: best, grad = d - r, (p - c) / d
    return best, grad

def obst_cost_point(d):
    if d < 0: return -d + EPS / 2
    if d < EPS: return (EPS - d)**2 / (2 * EPS)
    return 0.0

def obst_cost_grad(d):
    if d < 0: return -1.0
    if d < EPS: return -(EPS - d) / EPS
    return 0.0

def obst_cost(X): return sum(obst_cost_point(dist(p)[0]) for p in X)

def obst_grad(X):
    """workspace gradient, with the component along the path removed (CHOMP's projection), so obstacles bend the path sideways"""
    full = np.vstack([START, X, GOAL]); G = np.zeros_like(X)
    for i, p in enumerate(X):
        d, n = dist(p); g = obst_cost_grad(d) * n
        t = full[i + 2] - full[i]; t = t / np.linalg.norm(t)
        G[i] = g - (g @ t) * t
    return G

def total(X): return smooth_cost(X) + LAM * obst_cost(X)

def optimise(X, iters=300, step=0.2, covariant=True, trust=0.1):
    Ainv = np.linalg.inv(A); hist = [total(X)]
    for _ in range(iters):
        g = smooth_grad(X) + LAM * obst_grad(X)
        d = Ainv @ g if covariant else g
        s = min(step, trust / np.abs(d).max())                              # no waypoint moves more than 10 cm per step
        while total(X - s * d) > hist[-1] and s > 1e-10: s /= 2               # backtrack so the cost never rises
        X = X - s * d; hist.append(total(X))
    return X, np.array(hist)

def test_gradient_is_right():
    X = np.linspace(START, GOAL, N + 2)[1:-1] + np.random.default_rng(0).normal(0, 0.1, (N, 2)); h = 1e-6
    num = np.array([[(smooth_cost(X + h * E) - smooth_cost(X - h * E)) / (2 * h) for E in (np.eye(1, 2 * N, 2 * i + k).reshape(N, 2) for k in range(2))] for i in range(N)])
    b1, b2 = smooth_grad(X) - A @ X, smooth_grad(2 * X) - A @ (2 * X)        # gradient = A x + b: the same b anywhere
    print(f"smoothness gradient vs finite differences: largest difference {np.abs(num - smooth_grad(X)).max():.1e}; gradient - A x is constant to {np.abs(b1 - b2).max():.1e}")
    assert np.abs(num - smooth_grad(X)).max() < 1e-6 and np.abs(b1 - b2).max() < 1e-9

def test_bends_away_and_cost_falls():
    X0 = np.linspace(START, GOAL, N + 2)[1:-1]
    c0 = min(dist(p)[0] for p in X0)
    X, hist = optimise(X0.copy())
    seg = np.vstack([START, X, GOAL]); fine = np.concatenate([np.linspace(a, b, 10) for a, b in zip(seg[:-1], seg[1:])])
    print(f"straight line: deepest penetration {-c0:.2f} m, cost {hist[0]:.2f}")
    print(f"after {len(hist) - 1} covariant steps: cost {hist[-1]:.4f}, smallest clearance {min(dist(p)[0] for p in X):.3f} m at the waypoints, "
          f"{min(dist(p)[0] for p in fine):.3f} m densely checked; length {np.sum(np.linalg.norm(np.diff(seg, axis=0), axis=1)):.2f} m, y from {X[:, 1].min():.2f} to {X[:, 1].max():.2f} m")
    assert c0 < 0 and np.all(np.diff(hist) <= 1e-12) and min(dist(p)[0] for p in fine) > 0

def test_covariant_beats_plain_gradient():
    X0 = np.linspace(START, GOAL, N + 2)[1:-1]
    _, hc = optimise(X0.copy()); _, hp = optimise(X0.copy(), covariant=False)
    print("cost after 30, 100 and 300 steps: covariant " + ", ".join(f"{hc[k]:.4f}" for k in (30, 100, 300)) + "; plain gradient " + ", ".join(f"{hp[k]:.4f}" for k in (30, 100, 300)))
    assert all(hc[k] < hp[k] for k in (30, 100, 300))

test_gradient_is_right()
test_bends_away_and_cost_falls()
test_covariant_beats_plain_gradient()
print("PASS")
```
:::end

## In practice

CHOMP, STOMP and TrajOpt are available in MoveIt as planners or as post-processors. For small problems, `scipy.optimize.minimize` on the same cost works too, but it doesn't know the covariant metric.

## Exercises

:::exercise
Show that the minimum-jerk curve between rest states is a quintic.
:::solution
The Euler-Lagrange equation for $\int \dddot x^2 dt$ is $\frac{d^3}{dt^3}\left(2\dddot x\right) = 0$ up to sign, so $x^{(6)} = 0$: a polynomial of degree 5. Its 6 coefficients are fixed by position, velocity and acceleration at both ends, which gives the lesson 02 quintic.
:::end

:::exercise
Why does a waypoint inside an obstacle get a constant push, $c'(d) = -1$, instead of a growing one?
:::solution
A growing push deep inside would be huge and make the update unstable. Inside, any push outwards along the distance gradient will do. Linear growth of the cost keeps the gradient bounded while still forcing the waypoint out.
:::end

## Quiz

:::quiz
- type: num
  q: Obstacle cost at d = 0.3 m with ε = 0.6 m?
  answer: 0.075
  tol: 0.001
  py: "(0.6-0.3)**2/(2*0.6)"
  explain: (ε − d)²/(2ε).
- type: num
  q: Obstacle cost at d = −0.2 m (inside) with ε = 0.6 m?
  answer: 0.5
  tol: 0.001
  py: "0.2+0.6/2"
  explain: −d + ε/2.
- type: num
  q: Smoothness cost ½ Σ|Δx|² of a 3 m straight path split into 3 equal steps?
  answer: 1.5
  tol: 0.001
  py: "0.5*3*1.0**2"
  explain: Three steps of 1 m, each contributing ½.
- type: num
  q: Rows of K for 50 free waypoints between two fixed ends?
  answer: 51
  tol: 0.001
  py: "50+1"
  explain: One first difference per gap between consecutive points.
- type: mc
  q: CHOMP's update multiplies the gradient by A⁻¹ in order to…
  options:
    - spread each correction smoothly along the whole path
    - normalise it to unit length
    - remove the obstacle term
    - make the cost convex
  answer: 0
  explain: It is gradient descent in a smoothness-weighted norm.
- type: mc
  q: Trajectory optimisation is usually seeded with a sampling planner's path because…
  options:
    - it finds only a local optimum near its starting path
    - it can't handle straight lines
    - it needs a collision-free start to compute gradients
    - sampling paths are already smooth
  answer: 0
  explain: It can't jump across an obstacle to a better route.
:::end
