---
id: p14-l05
minutes: 45
summary: The linear quadratic regulator picks the state-feedback gain that minimises a weighted sum of state error and control effort, and the answer comes from the algebraic Riccati equation. You derive the Riccati equation from a quadratic cost-to-go, compute K = R^-1 B^T P from scratch by Newton's method, and test the gain against scipy, the double integrator's closed form, and random perturbations that all cost more.
---

## The cost

Instead of choosing poles, choose what you care about:

$$J = \int_0^\infty \left(x^TQx + u^TRu\right)dt, \qquad Q \succeq 0,\ R \succ 0.$$

$Q$ penalises state error, $R$ penalises effort. Their ratio is the design knob: large $Q/R$ means aggressive control.

## Deriving the Riccati equation

Guess that the optimal cost-to-go from state $x$ is quadratic, $V(x) = x^TPx$ with $P$ symmetric. Along an optimal path, the cost-to-go falls at exactly the running cost rate (the Hamilton-Jacobi-Bellman equation):

$$0 = \min_u\left[x^TQx + u^TRu + \frac{dV}{dx}(Ax + Bu)\right] = \min_u\left[x^TQx + u^TRu + 2x^TP(Ax + Bu)\right].$$

The bracket is quadratic in $u$; setting its gradient $2Ru + 2B^TPx$ to zero gives

$$u = -Kx, \qquad K = R^{-1}B^TP.$$

Substitute back; the result must hold for every $x$, so the matrix in the middle vanishes. That is the **continuous algebraic Riccati equation** (CARE):

$$A^TP + PA - PBR^{-1}B^TP + Q = 0.$$

Take the solution with $A - BK$ stable (it exists and is unique when $(A, B)$ is stabilisable and $(A, Q^{1/2})$ detectable). The optimal cost from $x_0$ is $x_0^TPx_0$.

## Solving it from scratch: Newton's method

Kleinman's iteration: start from any stabilising $K_0$. For the current $K$, the cost matrix $P$ solves a linear **Lyapunov** equation

$$(A - BK)^TP + P(A - BK) + Q + K^TRK = 0,$$

then update $K \leftarrow R^{-1}B^TP$. Each step lowers the cost and convergence is quadratic. Lesson 06 shows two other routes.

:::figure widget=lqrtrade caption="LQR on a double integrator (a mass with a force) starting 1 m from the target. Slide the ratio of state weight to effort weight: the response gets faster and the force bigger, and the point moves along the trade-off curve between the two parts of the cost."
:::end

## Worked example

Double integrator $\ddot x = u$, $Q = \mathrm{diag}(q, 0)$, $R = 1$. Write $P = \begin{bmatrix}a & b\\ b & c\end{bmatrix}$ and expand the CARE:

1. Entry (1,1): $q - b^2 = 0$, so $b = \sqrt q$.
2. Entry (1,2): $a - bc = 0$. Entry (2,2): $2b - c^2 = 0$, so $c = \sqrt{2\sqrt q}$.
3. $K = R^{-1}B^TP = (b, c) = \left(\sqrt q,\ \sqrt{2\sqrt q}\right)$. For $q = 100$: $K = (10, 4.472)$, closed-loop $s^2 + 4.472s + 10$: $\omega_n = 3.16$ rad/s and $\zeta = 0.707$, whatever $q$ is.

## Code it from scratch

:::code file=lqr.py
```python
import numpy as np
from scipy.linalg import solve_continuous_are, expm

def lyap(Acl, Qc):
    """solve Acl^T P + P Acl + Qc = 0 by vectorising (Kronecker form); fine for small n"""
    n = len(Acl); I = np.eye(n)
    M = np.kron(I, Acl.T) + np.kron(Acl.T, I)
    P = np.linalg.solve(M, -Qc.reshape(-1)).reshape(n, n)
    return (P + P.T) / 2

def lqr(A, B, Q, R, K0, iters=30):
    """Kleinman's Newton iteration: evaluate the cost of K, then improve K = R^-1 B^T P"""
    K = K0
    for _ in range(iters):
        Acl = A - B @ K
        P = lyap(Acl, Q + K.T @ R @ K)                 # cost-to-go matrix of the current K
        K_new = np.linalg.solve(R, B.T @ P)
        if np.abs(K_new - K).max() < 1e-12: break
        K = K_new
    return K_new, P

def cost_of(A, B, Q, R, K, x0):
    """J = integral of x'Qx + u'Ru for u = -Kx, from x0 (exact, via the Lyapunov equation)"""
    return float(x0 @ lyap(A - B @ K, Q + K.T @ R @ K) @ x0)

def cartpole_AB(M=0.8, m=0.25, l=0.45, g=9.81):
    tot = M + m; den = l * (4 / 3 - m / tot); p2, beta = g / den, 1 / (tot * den)
    A = np.array([[0, 1, 0, 0], [0, 0, -m * l * p2 / tot, 0], [0, 0, 0, 1], [0, 0, p2, 0]], float)
    B = np.array([[0], [1 / tot + m * l * beta / tot], [0], [-beta]], float)
    return A, B

A2 = np.array([[0.0, 1.0], [0.0, 0.0]]); B2 = np.array([[0.0], [1.0]])     # double integrator

def test_double_integrator_closed_form():
    for q in (0.1, 1.0, 100.0):
        K, P = lqr(A2, B2, np.diag([q, 0.0]), np.eye(1), K0=np.array([[1.0, 2.0]]))
        Kx = np.array([np.sqrt(q), np.sqrt(2 * np.sqrt(q))])
        assert np.allclose(K.ravel(), Kx, rtol=1e-9)
    print(f"double integrator, Q = diag(q, 0), R = 1: K = (sqrt q, sqrt(2 sqrt q)), e.g. q = 100 gives {np.round(K.ravel(), 4)}")

def test_matches_scipy_care():
    A, B = cartpole_AB(); Q = np.diag([10.0, 1.0, 100.0, 1.0]); R = np.array([[0.1]])
    K0 = np.array([[-18.991, -18.041, -83.277, -20.14]])     # any stabilising gain (lesson 04's pole placement)
    K, P = lqr(A, B, Q, R, K0)
    Pref = solve_continuous_are(A, B, Q, R); Kref = np.linalg.solve(R, B.T @ Pref)
    print(f"cart-pole LQR K = {np.round(K.ravel(), 3)}, max difference from scipy {np.abs(K - Kref).max():.1e}")
    assert np.allclose(P, Pref, rtol=1e-8) and np.allclose(K, Kref, rtol=1e-8)
    res = A.T @ P + P @ A - P @ B @ np.linalg.solve(R, B.T @ P) + Q
    assert np.abs(res).max() < 1e-6 * np.abs(Q).max()               # P solves the Riccati equation

def test_lqr_is_optimal():
    A, B = cartpole_AB(); Q = np.diag([10.0, 1.0, 100.0, 1.0]); R = np.array([[0.1]])
    P = solve_continuous_are(A, B, Q, R); K = np.linalg.solve(R, B.T @ P)
    x0 = np.array([0.0, 0.0, 0.1, 0.0])
    J = cost_of(A, B, Q, R, K, x0)
    assert abs(J - x0 @ P @ x0) < 1e-9 * J                          # optimal cost is x0' P x0
    rng = np.random.default_rng(0); worse = 0
    for _ in range(200):
        Kp = K * (1 + 0.1 * rng.normal(size=K.shape))
        if np.all(np.linalg.eigvals(A - B @ Kp).real < 0):
            worse += cost_of(A, B, Q, R, Kp, x0) > J
    print(f"optimal cost {J:.4f}; 200 random 10 % gain perturbations all cost more: {worse == 200}")
    assert worse == 200
    # and the simulated integral agrees with x0' P x0
    dt = 1e-3; E = expm((A - B @ K) * dt); x = x0.copy(); acc = 0.0
    f = lambda x: x @ (Q + K.T @ R @ K) @ x
    for _ in range(20000):
        xn = E @ x; acc += dt * (f(x) + f(xn)) / 2; x = xn            # trapezoid rule
    print(f"simulated cost {acc:.4f}")
    assert abs(acc / J - 1) < 1e-4

test_double_integrator_closed_form()
test_matches_scipy_care()
test_lqr_is_optimal()
print("PASS")
```
:::end

## Exercises

:::exercise
Why does the double integrator's LQR always give $\zeta = 0.707$ with $Q = \mathrm{diag}(q, 0)$?
:::solution
The closed-loop polynomial is $s^2 + \sqrt{2\sqrt q}\,s + \sqrt q$, so $\omega_n = q^{1/4}$ and $2\zeta\omega_n = \sqrt2\,q^{1/4}$, giving $\zeta = 1/\sqrt2$ for every $q$. The weight sets only the speed. A velocity weight in $Q$ would add damping.
:::end

:::exercise
Bryson's rule picks $Q_{ii} = 1/x_{i,max}^2$ and $R = 1/u_{max}^2$. What does it achieve?
:::solution
It normalises each term so that a state at its largest acceptable value, or the input at its limit, costs 1. It's a sensible starting point that makes the weights dimensionless; you then adjust by watching the response and actuator use.
:::end

## Quiz

:::quiz
- type: num
  q: Position gain for a double integrator with Q = diag(100, 0) and R = 1?
  answer: 10
  tol: 0.001
  py: "math.sqrt(100)"
  explain: K₁ = √q.
- type: num
  q: Velocity gain for the same design?
  answer: 4.4721
  tol: 0.001
  py: "math.sqrt(2*math.sqrt(100))"
  explain: K₂ = √(2√q).
- type: num
  q: Closed-loop natural frequency in rad/s for q = 16?
  answer: 2
  tol: 0.001
  unit: rad/s
  py: "16**0.25"
  explain: ω_n = q^(1/4).
- type: num
  q: Optimal cost from x0 = (1, 0) for q = 1, where P = [[√2, 1], [1, √2]]?
  answer: 1.4142
  tol: 0.001
  py: "math.sqrt(2)"
  explain: J = x0ᵀPx0 = P₁₁.
- type: mc
  q: Raising R with Q fixed makes the controller…
  options:
    - gentler, with slower response and less effort
    - more aggressive
    - unstable
    - unchanged
  answer: 0
  explain: Effort becomes more expensive.
- type: mc
  q: The Lyapunov equation in Newton's method gives…
  options:
    - the exact cost matrix of the current gain
    - the optimal gain directly
    - the closed-loop poles
    - the observer gain
  answer: 0
  explain: Then the gain is improved from it.
:::end
