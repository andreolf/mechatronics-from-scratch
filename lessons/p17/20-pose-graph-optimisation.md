---
id: p17-l20
minutes: 50
summary: Modern SLAM writes the problem as a graph of poses linked by relative measurements and solves it by least squares. You derive the SE(2) edge error and its Jacobians, build the sparse Gauss-Newton system, and optimise an illustrative 80-pose graph with 40 loop closures, cutting the trajectory error from 1.14 m to 0.16 m with the final error matching its statistical expectation, as GTSAM does at scale.
---

## Poses and constraints

A **pose graph** has a node for each robot pose $x_i = (x, y, \theta)$ and an edge for each relative measurement $z_{ij}$ of pose $j$ seen from pose $i$, with information matrix $\Omega_{ij}$ (the inverse covariance). Odometry gives edges between consecutive poses; a **loop closure**, from scan matching (lesson 18) or place recognition, gives an edge between poses far apart in time. Mapping then means finding the poses that best satisfy every edge.

## The error

With poses as homogeneous transforms $X_i$, the edge error is the difference between measured and predicted relative pose:

$$e_{ij} = \operatorname{t2v}\!\big(Z_{ij}^{-1} X_i^{-1} X_j\big), \qquad F(x) = \sum_{ij} e_{ij}^\top \Omega_{ij} e_{ij}.$$

Its Jacobians with respect to $x_i$ and $x_j$, $A_{ij}$ and $B_{ij}$, are $3 \times 3$ blocks. Verify them numerically, as always.

## Gauss-Newton on a sparse system

Linearise each edge and accumulate

$$H_{ii} \mathrel{+}= A^\top\Omega A,\quad H_{ij} \mathrel{+}= A^\top\Omega B,\quad H_{jj} \mathrel{+}= B^\top\Omega B,\quad b_i \mathrel{+}= A^\top\Omega e,\quad b_j \mathrel{+}= B^\top\Omega e.$$

Solve $H\,\Delta x = -b$, update, repeat. Every edge touches only two poses, so $H$ is **sparse** and a sparse Cholesky solve handles thousands of poses in milliseconds. The total error does not change if every pose moves together, so $H$ is singular until one pose is **anchored** (here by adding a large prior on pose 0).

At the optimum, $F$ should be close to its number of degrees of freedom, $3 \times (\text{edges} - \text{poses} + 1)$. Much more means a bad edge, usually a false loop closure, which robust kernels and outlier rejection guard against.

:::figure widget=posegraph caption="An illustrative pose graph from two laps of a square. Step through Gauss-Newton iterations and toggle the loop closures: without them nothing changes; with them the drifted trajectory snaps back onto the square."
:::end

## Worked example

An illustrative robot drives a 10 m square twice in 1 m steps (80 poses). Odometry edges have noise 5 cm, 5 cm and 1°; 40 loop closures link each second-lap pose to its first-lap twin with half that noise. Dead reckoning gives the initial guess.

1. Analytic and numerical Jacobians agree to $1.5 \times 10^{-10}$.
2. The total error falls from 160 958 to 1457 after one iteration and to 124.3 after 6; the expected value at the optimum is $3 \times 40 = 120$.
3. RMS position error against the truth: dead reckoning 1.14 m, optimised 0.162 m.
4. With odometry edges only, the dead-reckoning guess already has zero error and the optimiser moves nothing ($10^{-14}$): without loop closures there is nothing to correct.

## Code it from scratch

:::code file=pose_graph.py
```python
import numpy as np
from scipy.sparse import lil_matrix
from scipy.sparse.linalg import spsolve

def wrap(a): return (a + np.pi) % (2 * np.pi) - np.pi

def v2t(p):
    c, s = np.cos(p[2]), np.sin(p[2]); return np.array([[c, -s, p[0]], [s, c, p[1]], [0, 0, 1]])

def t2v(T): return np.array([T[0, 2], T[1, 2], np.arctan2(T[1, 0], T[0, 0])])

def relative(pi, pj):
    """pose j seen from pose i: inv(T_i) T_j as (x, y, theta)"""
    return t2v(np.linalg.inv(v2t(pi)) @ v2t(pj))

def make_problem(seed=0, side=10, step=1.0, laps=2, sig=(0.05, 0.05, np.radians(1.0))):
    """illustrative robot driving a 10 m square twice; odometry edges between consecutive poses,
    loop-closure edges whenever it passes a pose of the first lap again (as a scan matcher would report)"""
    rng = np.random.default_rng(seed); truth = []; p = np.zeros(3)
    for _ in range(laps):
        for _ in range(4):
            for _ in range(int(side / step)): truth.append(p.copy()); p = t2v(v2t(p) @ v2t([step, 0, 0]))
            p = t2v(v2t(p) @ v2t([0, 0, np.pi / 2]))
    truth = np.array(truth); n = len(truth); info_odo = np.diag(1 / np.array(sig) ** 2); edges = []
    for i in range(n - 1):
        z = relative(truth[i], truth[i + 1]) + rng.normal(0, sig); edges.append((i, i + 1, z, info_odo))
    per_lap = n // laps
    for i in range(per_lap, n):
        j = i - per_lap
        z = relative(truth[j], truth[i]) + rng.normal(0, np.array(sig) / 2); edges.append((j, i, z, 4 * info_odo))
    guess = [np.zeros(3)]
    for i, j, z, _ in edges[:n - 1]: guess.append(t2v(v2t(guess[-1]) @ v2t(z)))        # dead reckoning initial guess
    return truth, np.array(guess), edges

def error_and_jacobians(xi, xj, z):
    """residual e = t2v(Z^-1 Xi^-1 Xj) and its Jacobians with respect to pose i and pose j"""
    Ri, Rz = v2t(xi)[:2, :2], v2t(z)[:2, :2]; ci, si = np.cos(xi[2]), np.sin(xi[2])
    e = t2v(np.linalg.inv(v2t(z)) @ np.linalg.inv(v2t(xi)) @ v2t(xj)); e[2] = wrap(e[2])
    dRi = np.array([[-si, ci], [-ci, -si]])                            # d(Ri') / d theta_i
    A = np.zeros((3, 3)); B = np.zeros((3, 3))
    A[:2, :2] = -Rz.T @ Ri.T; A[:2, 2] = Rz.T @ dRi @ (xj[:2] - xi[:2]); A[2, 2] = -1
    B[:2, :2] = Rz.T @ Ri.T; B[2, 2] = 1
    return e, A, B

def chi2(x, edges):
    """total weighted squared error: sum of e' Omega e over all edges"""
    total = 0.0
    for i, j, z, om in edges:
        e = error_and_jacobians(x[i], x[j], z)[0]; total += e @ om @ e
    return total

def optimise(x, edges, iters=10):
    """Gauss-Newton: build the sparse system H dx = -b from every edge, fix the first pose, solve, update, repeat"""
    x = x.copy(); n = len(x); hist = [chi2(x, edges)]
    for _ in range(iters):
        H = lil_matrix((3 * n, 3 * n)); b = np.zeros(3 * n)
        for i, j, z, om in edges:
            e, A, B = error_and_jacobians(x[i], x[j], z); si, sj = slice(3 * i, 3 * i + 3), slice(3 * j, 3 * j + 3)
            H[si, si] += A.T @ om @ A; H[si, sj] += A.T @ om @ B; H[sj, si] += B.T @ om @ A; H[sj, sj] += B.T @ om @ B
            b[si] += A.T @ om @ e; b[sj] += B.T @ om @ e
        H[0:3, 0:3] += np.eye(3) * 1e9                                  # anchor pose 0 (the gauge freedom)
        dx = spsolve(H.tocsr(), -b).reshape(n, 3); x += dx; x[:, 2] = wrap(x[:, 2])
        hist.append(chi2(x, edges))
        if np.abs(dx).max() < 1e-8: break
    return x, np.array(hist)

def ate(x, truth): return np.sqrt(np.mean(np.sum((x[:, :2] - truth[:, :2]) ** 2, 1)))

def test_jacobians():
    xi, xj, z = np.array([1.0, 2.0, 0.5]), np.array([2.5, 2.7, 1.1]), np.array([1.2, 0.3, 0.4]); e0, A, B = error_and_jacobians(xi, xj, z); h = 1e-6
    An = np.column_stack([(error_and_jacobians(xi + h * d, xj, z)[0] - error_and_jacobians(xi - h * d, xj, z)[0]) / (2 * h) for d in np.eye(3)])
    Bn = np.column_stack([(error_and_jacobians(xi, xj + h * d, z)[0] - error_and_jacobians(xi, xj - h * d, z)[0]) / (2 * h) for d in np.eye(3)])
    print(f"analytic vs numerical Jacobians: A {np.abs(A - An).max():.1e}, B {np.abs(B - Bn).max():.1e}")
    assert max(np.abs(A - An).max(), np.abs(B - Bn).max()) < 1e-6

def test_optimisation():
    truth, guess, edges = make_problem()
    x, hist = optimise(guess, edges)
    n_loop = len(edges) - (len(truth) - 1)
    print(f"{len(truth)} poses, {len(truth) - 1} odometry edges, {n_loop} loop closures")
    print(f"chi2 {hist[0]:.0f} -> {hist[1]:.1f} -> {hist[-1]:.1f} after {len(hist) - 1} iterations (about {3 * (len(edges) - len(truth) + 1)} expected at the optimum)")
    print(f"trajectory error (RMS position): dead reckoning {ate(guess, truth):.2f} m, optimised {ate(x, truth):.3f} m")
    assert hist[-1] < 1e-3 * hist[0] and ate(x, truth) < 0.2 * ate(guess, truth)
    dof = 3 * (len(edges) - len(truth) + 1); assert 0.7 * dof < hist[-1] < 1.3 * dof

def test_no_loop_closure_no_change():
    truth, guess, edges = make_problem()
    x, hist = optimise(guess, edges[:len(truth) - 1])
    print(f"odometry edges only: chi2 {hist[0]:.2e}, trajectory moves by at most {np.abs(x - guess).max():.1e}")
    assert np.abs(x - guess).max() < 1e-6

test_jacobians()
test_optimisation()
test_no_loop_closure_no_change()
print("PASS")
```
:::end

## In practice

GTSAM (and its iSAM2 incremental solver), g2o and Ceres solve exactly this problem, in 2D and 3D, with robust kernels and many factor types (IMU preintegration, landmarks, GPS). slam_toolbox in ROS 2 builds a pose graph from lidar scans and optimises it with Ceres. Pose-graph SLAM replaced EKF-SLAM because sparsity keeps it fast as the map grows.

## Exercises

:::exercise
Why does the optimiser need an anchor, and what happens without one?
:::solution
Moving or rotating every pose by the same transform leaves every relative error unchanged, so $H$ has a 3-dimensional null space and is singular. Fixing one pose (or adding a prior) removes this gauge freedom.
:::end

:::exercise
A false loop closure says pose 10 is at the same place as pose 60, which is 8 m away. What happens to the optimised map and to the final error?
:::solution
Least squares bends the whole trajectory to partly satisfy the wrong edge, distorting the map. The final error ends up far above its expected value and concentrated on that edge, which is how such edges are found; robust kernels (Huber, Cauchy) or switchable constraints limit the damage.
:::end

## Quiz

:::quiz
- type: num
  q: Unknowns in a 2D pose graph with 500 poses (before anchoring)?
  answer: 1500
  tol: 0.001
  py: "500*3"
  explain: Three per pose.
- type: num
  q: Expected final error for 300 edges among 250 poses in 2D?
  answer: 153
  tol: 0.001
  py: "3*(300-250+1)"
  explain: 3 × (edges − poses + 1).
- type: num
  q: Non-zero 3 × 3 blocks one edge adds to H?
  answer: 4
  tol: 0.001
  py: "4"
  explain: ii, ij, ji and jj.
- type: num
  q: Dimension of the gauge freedom of a 2D pose graph?
  answer: 3
  tol: 0.001
  py: "3"
  explain: A global x, y and rotation.
- type: mc
  q: Pose-graph SLAM scales better than EKF-SLAM because…
  options:
    - its system matrix is sparse
    - it ignores odometry
    - it uses fewer measurements
    - it needs no initial guess
  answer: 0
  explain: Each edge links only two poses.
- type: mc
  q: A final error far above its expected value suggests…
  options:
    - a wrong edge, such as a false loop closure
    - perfect convergence
    - too few iterations always
    - a missing anchor
  answer: 0
  explain: Inconsistent constraints cannot all be satisfied.
:::end
