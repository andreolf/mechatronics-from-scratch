---
id: p14-l18
minutes: 50
summary: Model predictive control plans a whole sequence of future inputs by solving an optimisation at every sample, applies only the first, and re-plans, which lets it respect actuator limits explicitly. You derive the condensed quadratic program for a receding horizon, show that without constraints its first move is exactly the LQR gain, add box limits on the input solved by an accelerated projected-gradient method checked against scipy, and test that the closed loop respects the limits and beats a saturated LQR.
---

## Receding horizon

At each sample, from the measured state $x_0$, choose inputs $u_0, \dots, u_{N-1}$ to minimise

$$J = \sum_{k=0}^{N-1}\left(x_{k+1}^TQx_{k+1} + u_k^TRu_k\right) \quad\text{(with } Q \to P \text{ on the last state)}$$

subject to $x_{k+1} = Ax_k + Bu_k$ and $u_{min} \le u_k \le u_{max}$. Apply $u_0$, measure again, repeat. The plan window slides forward each step.

**Condensing.** Stack the predictions: $X = S_xx_0 + S_uU$ with $S_x = (A; A^2; \dots; A^N)$ and $S_u$ the lower block-triangular matrix of $A^{k-j}B$. The cost becomes a quadratic in $U$:

$$J = \tfrac12U^THU + x_0^TF^TU + \text{const}, \qquad H = 2(S_u^T\bar QS_u + \bar R), \quad F = 2S_u^T\bar QS_x.$$

**Without constraints** $U^* = -H^{-1}Fx_0$, linear in $x_0$. With the terminal weight $P$ from the discrete Riccati equation, the first move equals the infinite-horizon LQR exactly (dynamic programming, lesson 06).

**With box constraints** it's a quadratic program. For bounds on $U$ alone, projected gradient is simple: step along $-(HU + f)$, then clip into the box. FISTA's momentum term speeds it up. Real MPC solvers (OSQP, qpOASES, or CVXPY as a modelling layer) also handle state constraints and warm-start from the previous plan.

:::figure widget=mpcwindow caption="A cart moved 5 m with the force limited to ±1. At each step the MPC plans the next N moves (the faint window) and applies only the first. Slide through time to watch the window slide; change the horizon and the limit."
:::end

## Worked example

Double integrator at $T = 0.1$ s, $Q = \mathrm{diag}(1, 0.1)$, $R = 0.01$, $|u| \le 1$.

1. LQR gain from the DARE: $K = (7.61, 4.58)$. A 5 m error asks for 38 N per kg, 38 times the limit.
2. Clipping that LQR at ±1 overshoots by 2.13 m: it brakes too late because it doesn't know about the limit.
3. MPC with $N = 20$ (2 s look-ahead): overshoot 0.29 m, never exceeding the limit, settles at the target. With $N = 5$ it's 1.71 m: a short horizon can't see the braking it needs.

## Code it from scratch

:::code file=mpc.py
```python
import numpy as np
from scipy.linalg import solve_discrete_are
from scipy.optimize import minimize

T = 0.1
A = np.array([[1, T], [0, 1]]); B = np.array([[T**2 / 2], [T]])     # double integrator: a cart pushed by a force (per kg)
Q = np.diag([1.0, 0.1]); R = np.array([[0.01]])
P_term = solve_discrete_are(A, B, Q, R)                              # terminal cost: the infinite-horizon cost-to-go

def condense(N):
    """predictions X = Sx x0 + Su U over N steps, and the QP 1/2 U'HU + x0'F'U"""
    n, m = B.shape
    Sx = np.vstack([np.linalg.matrix_power(A, k + 1) for k in range(N)])
    Su = np.zeros((N * n, N * m))
    for k in range(N):
        for j in range(k + 1):
            Su[k * n:(k + 1) * n, j * m:(j + 1) * m] = np.linalg.matrix_power(A, k - j) @ B
    Qb = np.kron(np.eye(N), Q); Qb[-n:, -n:] = P_term; Rb = np.kron(np.eye(N), R)
    H = 2 * (Su.T @ Qb @ Su + Rb); Fm = 2 * Su.T @ Qb @ Sx
    return H, Fm, Sx, Su

def solve_box_qp(H, f, lo, hi, iters=3000):
    """minimise 1/2 U'HU + f'U with lo <= U <= hi: accelerated projected gradient (FISTA)"""
    Lc = np.linalg.eigvalsh(H).max(); U = np.clip(-np.linalg.solve(H, f), lo, hi); Y = U.copy(); t = 1.0
    for _ in range(iters):
        Un = np.clip(Y - (H @ Y + f) / Lc, lo, hi)
        tn = (1 + np.sqrt(1 + 4 * t * t)) / 2; Y = Un + (t - 1) / tn * (Un - U); U, t = Un, tn
    return U

def mpc_step(x, N, umax):
    H, Fm, _, _ = condense(N); f = Fm @ x
    if umax is None: return -np.linalg.solve(H, f)
    return solve_box_qp(H, f, -umax, umax)

def closed_loop(N=20, umax=1.0, x0=(-5.0, 0.0), steps=120, clip_only=False):
    x = np.array(x0); xs, us = [x.copy()], []
    for _ in range(steps):
        U = mpc_step(x, N, None if clip_only else umax)
        u = float(np.clip(U[0], -umax, umax))                       # apply the first move, then re-plan
        x = A @ x + B[:, 0] * u; xs.append(x.copy()); us.append(u)
    return np.array(xs), np.array(us)

def test_unconstrained_mpc_equals_lqr():
    K = np.linalg.solve(R + B.T @ P_term @ B, B.T @ P_term @ A)
    H, Fm, _, _ = condense(10); Kmpc = np.linalg.solve(H, Fm)[0]
    print(f"first move of unconstrained MPC: u = -{np.round(Kmpc, 4)} x; LQR gain {np.round(K.ravel(), 4)}")
    assert np.allclose(Kmpc, K.ravel(), atol=1e-9)

def test_qp_solver_matches_scipy():
    H, Fm, _, _ = condense(20); f = Fm @ np.array([-1.5, 0.0])
    U = solve_box_qp(H, f, -1.0, 1.0)
    ref = minimize(lambda u: 0.5 * u @ H @ u + f @ u, np.zeros(20), jac=lambda u: H @ u + f,
                   bounds=[(-1, 1)] * 20, method="L-BFGS-B", options=dict(ftol=1e-15, gtol=1e-12, maxiter=10000)).x
    cost = lambda u: 0.5 * u @ H @ u + f @ u
    print(f"box QP: {np.sum(U > 0.999)} moves at +1, {np.sum(U < -0.999)} at -1, {np.sum(np.abs(U) <= 0.999)} inside; cost {cost(U):.6f} vs scipy {cost(ref):.6f}")
    assert cost(U) <= cost(ref) + 1e-7 and np.abs(U).max() <= 1.0 + 1e-12

def test_constraints_respected_and_better_than_clipping():
    xs, us = closed_loop()
    xc, uc = closed_loop(clip_only=True)                              # plan as if unconstrained, then saturate
    os_mpc, os_clip = xs[:, 0].max(), xc[:, 0].max()
    print(f"move from -5 m to 0 with |u| <= 1: max |u| {np.abs(us).max():.3f}; overshoot MPC {os_mpc:.3f} m, clipped LQR {os_clip:.3f} m;"
          f" final position {xs[-1, 0]:.4f} m")
    assert np.abs(us).max() <= 1.0 + 1e-12 and abs(xs[-1, 0]) < 1e-3
    assert os_mpc < 0.5 * os_clip

test_unconstrained_mpc_equals_lqr()
test_qp_solver_matches_scipy()
test_constraints_respected_and_better_than_clipping()
print("PASS")
```
:::end

## Exercises

:::exercise
Why does MPC re-plan at every step instead of applying the whole plan?
:::solution
Feedback. The plan is only as good as the model and the measured state; disturbances and model error make the real trajectory diverge from the prediction. Re-solving from each new measurement corrects that, which is what makes MPC a closed-loop controller.
:::end

:::exercise
How would you add a limit on the cart's speed?
:::solution
Speeds are linear in $U$: $V = S_{v,x}x_0 + S_{v,u}U$. The bound $|V| \le v_{max}$ becomes linear inequalities on $U$. That's no longer a simple box, so projected gradient no longer applies directly; use a general QP solver (active-set or ADMM such as OSQP), or soften the limit with a penalty.
:::end

## Quiz

:::quiz
- type: num
  q: Number of decision variables for a single-input MPC with horizon 20?
  answer: 20
  tol: 0.001
  py: "20*1"
  explain: One input per step.
- type: num
  q: Look-ahead time in s for N = 20 at T = 0.1 s?
  answer: 2
  tol: 0.001
  unit: s
  py: "20*0.1"
  explain: N T.
- type: num
  q: Unconstrained LQR force per kg in N for a 5 m position error with K₁ = 7.613?
  answer: 38.07
  tol: 0.01
  unit: N
  py: "7.613*5"
  explain: Far beyond a ±1 limit.
- type: num
  q: Size of H (rows) for a single-input horizon of 20?
  answer: 20
  tol: 0.001
  py: "20"
  explain: H is N·m by N·m.
- type: mc
  q: Unconstrained MPC with the Riccati terminal cost gives a first move equal to…
  options:
    - the infinite-horizon LQR
    - zero
    - a PID
    - a bang-bang input
  answer: 0
  explain: The terminal cost is the exact cost-to-go.
- type: mc
  q: Clipping an unconstrained controller's output at the limit…
  options:
    - ignores the limit in the plan and can overshoot badly
    - is always optimal
    - is identical to MPC
    - is unstable for any plant
  answer: 0
  explain: The plan doesn't know it can't brake as hard as it assumed.
:::end
