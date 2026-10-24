---
id: p14-l06
minutes: 40
summary: The Riccati equation can be solved several ways, and knowing them tells you what scipy is doing and how to run LQR on a microcontroller. You derive the Hamiltonian-matrix method, where P comes from the stable eigenvectors, and the discrete Riccati iteration, which is dynamic programming run backwards until it stops changing, implement both, and test them against scipy's solvers along with the predicted convergence rate.
---

## The Hamiltonian matrix

Optimal control pairs the state $x$ with a costate $\lambda$, which on the optimal path equals $Px$. Together they obey

$$\begin{bmatrix}\dot x\\ \dot\lambda\end{bmatrix} = \underbrace{\begin{bmatrix}A & -BR^{-1}B^T\\ -Q & -A^T\end{bmatrix}}_{H}\begin{bmatrix}x\\ \lambda\end{bmatrix}.$$

$H$ has a special symmetry: if $\mu$ is an eigenvalue, so is $-\mu$. Exactly half its eigenvalues are stable. On the optimal trajectory $x$ decays, so $(x, \lambda)$ lives in the **stable invariant subspace**. Stack its eigenvectors as $\begin{bmatrix}X\\ Y\end{bmatrix}$; then $\lambda = Px$ for every $x$ in it means

$$P = YX^{-1}.$$

(Production solvers use the ordered Schur form instead of eigenvectors for numerical robustness, but it's the same subspace.)

## Discrete Riccati iteration

In discrete time, $x_{k+1} = A_dx_k + B_du_k$ with cost $\sum x^TQ_dx + u^TR_du$, dynamic programming from the last step backwards gives

$$P_{k} = Q_d + A_d^TP_{k+1}A_d - A_d^TP_{k+1}B_d\left(R_d + B_d^TP_{k+1}B_d\right)^{-1}B_d^TP_{k+1}A_d.$$

Iterate from $P = Q_d$ until it stops changing: the fixed point is the **discrete algebraic Riccati equation** (DARE). Near the solution the error shrinks by about $\rho(A_d - B_dK)^2$ per step, so a slow closed loop or a short sample time means many iterations. With $Q_d = QT$ and $R_d = RT$ the discrete solution approaches the continuous one as $T \to 0$.

:::figure widget=riccaticonv caption="Discrete Riccati iteration for the cart-pole: the change in P per step on a log scale. Shorten the sample time and the iteration needs more steps, at the rate set by the closed-loop spectral radius."
:::end

## Worked example

Scalar: $\dot x = ax + bu$ with $a = 1$, $b = 1$, $q = 3$, $r = 1$.

1. CARE: $2ap - p^2b^2/r + q = 0$, so $p^2 - 2p - 3 = 0$, $p = 3$ (the positive root).
2. Hamiltonian $H = \begin{bmatrix}1 & -1\\ -3 & -1\end{bmatrix}$, eigenvalues $\pm 2$. The stable eigenvector for $-2$ is $(1, 3)$, so $P = 3/1 = 3$. Same answer.
3. $K = 3$, closed loop $a - bK = -2$: the stable Hamiltonian eigenvalue is the closed-loop pole.

## Code it from scratch

:::code file=riccati.py
```python
import numpy as np
from scipy.linalg import solve_continuous_are, solve_discrete_are, expm

def care_hamiltonian(A, B, Q, R):
    """stable invariant subspace of the Hamiltonian [[A, -B R^-1 B^T], [-Q, -A^T]]: P = Y X^-1"""
    n = len(A)
    H = np.block([[A, -B @ np.linalg.solve(R, B.T)], [-Q, -A.T]])
    lam, V = np.linalg.eig(H)
    Vs = V[:, lam.real < 0]                                # the n stable eigenvectors
    X, Y = Vs[:n], Vs[n:]
    P = np.real(Y @ np.linalg.inv(X))
    return (P + P.T) / 2, lam

def dare_iterate(A, B, Q, R, tol=1e-12, max_iter=100000):
    """value iteration: P <- Q + A'PA - A'PB (R + B'PB)^-1 B'PA, starting from P = Q"""
    P = Q.copy(); hist = []
    for k in range(max_iter):
        G = np.linalg.solve(R + B.T @ P @ B, B.T @ P @ A)
        Pn = Q + A.T @ P @ A - A.T @ P @ B @ G
        d = np.abs(Pn - P).max() / np.abs(Pn).max(); hist.append(d); P = Pn
        if d < tol: return P, k + 1, hist
    raise RuntimeError("no convergence")

def zoh(A, B, T):
    n, m = B.shape; Mx = np.zeros((n + m, n + m)); Mx[:n, :n] = A; Mx[:n, n:] = B
    E = expm(Mx * T); return E[:n, :n], E[:n, n:]

def cartpole_AB(M=0.8, m=0.25, l=0.45, g=9.81):
    tot = M + m; den = l * (4 / 3 - m / tot); p2, beta = g / den, 1 / (tot * den)
    A = np.array([[0, 1, 0, 0], [0, 0, -m * l * p2 / tot, 0], [0, 0, 0, 1], [0, 0, p2, 0]], float)
    B = np.array([[0], [1 / tot + m * l * beta / tot], [0], [-beta]], float)
    return A, B

A, B = cartpole_AB(); Q = np.diag([10.0, 1.0, 100.0, 1.0]); R = np.array([[0.1]])

def test_hamiltonian_matches_scipy():
    P, lam = care_hamiltonian(A, B, Q, R)
    Pref = solve_continuous_are(A, B, Q, R)
    print(f"Hamiltonian eigenvalues (real parts) come in +/- pairs: {np.round(np.sort(lam.real), 3)}")
    print(f"P from the Hamiltonian vs scipy: max relative difference {np.abs(P - Pref).max() / np.abs(Pref).max():.1e}")
    assert np.allclose(P, Pref, rtol=1e-8)
    assert np.allclose(np.sort(lam.real), -np.sort(lam.real)[::-1], atol=1e-8)   # symmetric spectrum

def test_discrete_iteration_matches_scipy():
    for T in (0.02, 0.005):
        Ad, Bd = zoh(A, B, T)
        P, n, hist = dare_iterate(Ad, Bd, Q * T, R * T)          # running cost sampled every T
        Pref = solve_discrete_are(Ad, Bd, Q * T, R * T)
        print(f"T = {T * 1000:.0f} ms: Riccati iteration converged in {n} steps, max relative difference {np.abs(P - Pref).max() / np.abs(Pref).max():.1e}")
        assert np.allclose(P, Pref, rtol=1e-8)
    # as T shrinks, the discrete P (with cost scaled by T) approaches the continuous one
    Pc = solve_continuous_are(A, B, Q, R)
    Ad, Bd = zoh(A, B, 0.001); Pd = solve_discrete_are(Ad, Bd, Q * 0.001, R * 0.001)
    assert np.abs(Pd - Pc).max() / np.abs(Pc).max() < 0.01

def test_convergence_is_geometric():
    Ad, Bd = zoh(A, B, 0.02); _, n, hist = dare_iterate(Ad, Bd, Q * 0.02, R * 0.02)
    h = np.array(hist); tail = h[n // 2:n - 5]
    rate = np.exp(np.polyfit(np.arange(len(tail)), np.log(tail), 1)[0])
    Pd = solve_discrete_are(Ad, Bd, Q * 0.02, R * 0.02)
    Kd = np.linalg.solve(R * 0.02 + Bd.T @ Pd @ Bd, Bd.T @ Pd @ Ad)
    rho = np.abs(np.linalg.eigvals(Ad - Bd @ Kd)).max()
    print(f"error shrinks by {rate:.4f} per step; squared spectral radius of the closed loop {rho**2:.4f}")
    assert abs(rate - rho**2) < 0.01

test_hamiltonian_matches_scipy()
test_discrete_iteration_matches_scipy()
test_convergence_is_geometric()
print("PASS")
```
:::end

## Exercises

:::exercise
Run the discrete iteration for a fixed number of steps $N$ instead of to convergence. What have you computed?
:::solution
The optimal time-varying gains for a finite-horizon problem of $N$ steps: $P_k$ is the cost-to-go with $N - k$ steps left. Only as $N \to \infty$ do the gains become constant, which is why MPC (lesson 18) with a long horizon behaves like LQR.
:::end

:::exercise
Why does the iteration converge slowly at short sample times?
:::solution
The closed-loop discrete poles are $e^{s_iT}$. As $T \to 0$ they approach 1, so $\rho(A_d - B_dK)^2$ approaches 1 and each step removes only a tiny fraction of the error. Halving $T$ roughly doubles the iteration count, as the 20 ms and 5 ms runs show.
:::end

## Quiz

:::quiz
- type: num
  q: Riccati solution p for ẋ = x + u with q = 3 and r = 1?
  answer: 3
  tol: 0.001
  py: "1+math.sqrt(1+3)"
  explain: The positive root of p² − 2p − 3 = 0.
- type: num
  q: Closed-loop pole for that design?
  answer: -2
  tol: 0.001
  py: "1-3"
  explain: a − bK with K = p b/r = 3.
- type: num
  q: How many eigenvalues does the Hamiltonian of a 4-state system have?
  answer: 8
  tol: 0.001
  py: "2*4"
  explain: It's 2n by 2n; half are stable.
- type: num
  q: Discrete pole at T = 5 ms for a continuous pole at −2 rad/s?
  answer: 0.99005
  tol: 0.001
  py: "math.exp(-2*0.005)"
  explain: z = e^(sT).
- type: mc
  q: If μ is an eigenvalue of the Hamiltonian, then so is…
  options:
    - −μ
    - 1/μ
    - μ²
    - only μ itself
  answer: 0
  explain: The Hamiltonian structure makes the spectrum symmetric about the imaginary axis.
- type: mc
  q: The discrete Riccati iteration is…
  options:
    - dynamic programming run backwards from the end of the horizon
    - Newton's method on the CARE
    - a Kalman filter
    - pole placement
  answer: 0
  explain: Each step adds one more stage of optimal cost-to-go.
:::end
