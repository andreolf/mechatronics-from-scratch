---
id: p14-l01
minutes: 40
summary: A linear state-space model x' = Ax + Bu has an exact solution, the matrix exponential acting on the initial state plus a convolution of the input. You derive it, compute e^(At) two ways from scratch (eigen-decomposition, then Pade approximation with scaling and squaring), and test both against scipy, including the defective matrix where the eigenvector route breaks.
---

## The solution of $\dot x = Ax$

For a scalar, $\dot x = ax$ gives $x(t) = e^{at}x_0$. The matrix version is the same, with the **matrix exponential** defined by the power series

$$e^{At} = I + At + \frac{(At)^2}{2!} + \frac{(At)^3}{3!} + \cdots$$

Differentiate term by term: $\tfrac{d}{dt}e^{At} = Ae^{At}$, so $x(t) = e^{At}x_0$ solves $\dot x = Ax$ with $x(0) = x_0$.

With an input, multiply $\dot x - Ax = Bu$ by $e^{-At}$: the left side is $\tfrac{d}{dt}(e^{-At}x)$. Integrate from 0 to $t$:

$$x(t) = e^{At}x_0 + \int_0^t e^{A(t-\tau)}Bu(\tau)\,d\tau.$$

The first term is the free response, the second the forced response: a convolution with the impulse response $e^{At}B$.

## Two ways to compute it

**Eigen-decomposition.** If $A = V\Lambda V^{-1}$, then $A^k = V\Lambda^kV^{-1}$ and

$$e^{At} = V\,\mathrm{diag}(e^{\lambda_i t})\,V^{-1}.$$

This shows where the modes come from: each eigenvalue contributes $e^{\lambda_i t}$. But it fails when $A$ lacks a full set of eigenvectors (a **defective** matrix, such as a Jordan block, whose exponential contains $te^{\lambda t}$), and it's inaccurate when $V$ is badly conditioned.

**Padé with scaling and squaring** (what `scipy.linalg.expm` does, in a more refined form). Approximate $e^M \approx D(M)^{-1}N(M)$ with polynomials matched to the series, accurate when $\|M\|$ is small. So scale first: $e^{M} = \left(e^{M/2^s}\right)^{2^s}$, pick $s$ so $\|M/2^s\| < 1$, then square $s$ times.

**Exact discretisation.** With $u$ held constant over a step $T$ (zero-order hold), $x_{k+1} = A_dx_k + B_du_k$ where $A_d = e^{AT}$ and $B_d = \int_0^T e^{A\tau}d\tau\,B$. Both come out of a single exponential:

$$\exp\left(\begin{bmatrix}A & B\\ 0 & 0\end{bmatrix}T\right) = \begin{bmatrix}A_d & B_d\\ 0 & I\end{bmatrix}.$$

:::figure widget=expmtraj caption="State trajectories x(t) = e^(At) x0 for a few 2-state systems. Choose the system and slide the time: the dot is e^(At) applied to the starting point, moving along the curve the eigenvalues dictate."
:::end

## Worked example

$A = \begin{bmatrix}0 & 1\\ -2 & -3\end{bmatrix}$, eigenvalues $-1$ and $-2$, eigenvectors $(1, -1)$ and $(1, -2)$.

1. $e^{At} = \begin{bmatrix}2e^{-t} - e^{-2t} & e^{-t} - e^{-2t}\\ -2e^{-t} + 2e^{-2t} & -e^{-t} + 2e^{-2t}\end{bmatrix}$.
2. At $t = 1$: $e^{-1} = 0.36788$, $e^{-2} = 0.13534$, so $e^{A} = \begin{bmatrix}0.60042 & 0.23254\\ -0.46509 & -0.09721\end{bmatrix}$.
3. With $B = (0, 1)$ and a unit step input, the steady state is $-A^{-1}B = (0.5, 0)$.

## Code it from scratch

:::code file=matrix_exponential.py
```python
import numpy as np
from scipy.linalg import expm, solve
from scipy.integrate import solve_ivp

def expm_eig(A, t=1.0):
    """e^(At) = V diag(e^(lambda t)) V^-1; needs a full set of eigenvectors"""
    lam, V = np.linalg.eig(A)
    return (V @ np.diag(np.exp(lam * t)) @ np.linalg.inv(V)).real

def expm_pade(A, t=1.0, q=6):
    """scaling and squaring with a (q, q) Pade approximant"""
    M = np.asarray(A, float) * t
    nrm = np.linalg.norm(M, np.inf)
    s = max(0, int(np.ceil(np.log2(nrm))) + 1) if nrm > 0 else 0
    M = M / 2**s
    c, N, D, X = 1.0, np.eye(len(M)), np.eye(len(M)), np.eye(len(M))
    for k in range(1, q + 1):
        c *= (q - k + 1) / (k * (2 * q - k + 1))
        X = X @ M
        N = N + c * X
        D = D + (-1) ** k * c * X
    E = solve(D, N)
    for _ in range(s):
        E = E @ E
    return E

def zoh(A, B, T):
    """exact discretisation: one exponential of the augmented matrix [[A, B], [0, 0]]"""
    n, m = B.shape
    M = np.zeros((n + m, n + m)); M[:n, :n] = A; M[:n, n:] = B
    E = expm_pade(M, T)
    return E[:n, :n], E[:n, n:]

A = np.array([[0.0, 1.0], [-2.0, -3.0]])

def test_worked_example():
    e1, e2 = np.exp(-1), np.exp(-2)
    exact = np.array([[2 * e1 - e2, e1 - e2], [-2 * e1 + 2 * e2, -e1 + 2 * e2]])
    print("e^A for A = [[0, 1], [-2, -3]]:\n", np.round(expm_pade(A), 5))
    assert np.allclose(expm_eig(A), exact, atol=1e-12) and np.allclose(expm_pade(A), exact, atol=1e-12)

def test_matches_scipy():
    rng = np.random.default_rng(0)
    cases = [A, np.array([[0.0, 1.0], [-1.0, 0.0]]) * 5, np.array([[-1.0, 1.0], [0.0, -1.0]]),   # oscillator, defective (Jordan block)
             rng.normal(size=(4, 4)) * 3, rng.normal(size=(6, 6))]
    worst = 0.0
    for M in cases:
        for t in (0.01, 1.0, 4.0):
            ref = expm(M * t)
            err = np.abs(expm_pade(M, t) - ref).max() / max(1.0, np.abs(ref).max())
            worst = max(worst, err)
    print(f"Pade vs scipy.linalg.expm, worst relative error over {len(cases) * 3} cases: {worst:.1e}")
    assert worst < 1e-10

def test_eig_fails_on_defective():
    J = np.array([[-1.0, 1.0], [0.0, -1.0]])
    err = np.abs(expm_eig(J, 1.0) - expm(J)).max()
    print(f"eigen-decomposition on a Jordan block: error {err:.1e} (V is singular)")
    assert err > 1e-6 or not np.isfinite(err)

def test_forced_response():
    B = np.array([[0.0], [1.0]]); T = 0.1; Ad, Bd = zoh(A, B, T)
    x = np.array([1.0, 0.0]); xs = [x]
    for k in range(50): x = Ad @ x + Bd[:, 0] * 1.0; xs.append(x)
    sol = solve_ivp(lambda t, z: A @ z + B[:, 0], (0, 5), [1.0, 0.0], t_eval=np.arange(51) * T, rtol=1e-11, atol=1e-12)
    err = np.abs(np.array(xs) - sol.y.T).max()
    print(f"x(t) = e^(At)x0 + integral of e^(A(t-tau))B u: ZOH steps vs ODE solver, max error {err:.1e}")
    assert err < 1e-8
    assert abs(xs[-1][0] - 0.5) < 0.01                # step input 1 settles at x1 = 1/2

test_worked_example()
test_matches_scipy()
test_eig_fails_on_defective()
test_forced_response()
print("PASS")
```
:::end

## Exercises

:::exercise
Show that $e^{At}$ for the Jordan block $J = \begin{bmatrix}\lambda & 1\\ 0 & \lambda\end{bmatrix}$ is $e^{\lambda t}\begin{bmatrix}1 & t\\ 0 & 1\end{bmatrix}$.
:::solution
Write $J = \lambda I + N$ with $N = \begin{bmatrix}0 & 1\\ 0 & 0\end{bmatrix}$. $\lambda I$ and $N$ commute, so $e^{Jt} = e^{\lambda t}e^{Nt}$. $N^2 = 0$, so the series stops: $e^{Nt} = I + Nt$. The $te^{\lambda t}$ term is what a diagonalisation can't produce, which is why the eigenvector route fails here.
:::end

:::exercise
For $A = \begin{bmatrix}0 & \omega\\ -\omega & 0\end{bmatrix}$, what is $e^{At}$, and what does it do to $x_0$?
:::solution
$e^{At} = \begin{bmatrix}\cos\omega t & \sin\omega t\\ -\sin\omega t & \cos\omega t\end{bmatrix}$, a rotation by $-\omega t$. The state circles the origin at constant radius: the undamped oscillator, eigenvalues $\pm j\omega$.
:::end

## Quiz

:::quiz
- type: num
  q: Entry (1,1) of e^(At) at t = 1 for A = [[0, 1], [-2, -3]]?
  answer: 0.60042
  tol: 0.001
  py: "2*math.exp(-1)-math.exp(-2)"
  explain: 2e^(-t) − e^(-2t) at t = 1.
- type: num
  q: Steady-state x1 for A = [[0, 1], [-2, -3]], B = (0, 1) and a unit step input?
  answer: 0.5
  tol: 0.001
  py: "float(-np.linalg.solve([[0,1],[-2,-3]],[0,1])[0])"
  explain: x∞ = −A⁻¹B.
- type: num
  q: Scaling exponent s (smallest integer with ‖M‖/2^s < 1) for ‖M‖ = 40?
  answer: 6
  tol: 0.001
  py: "math.ceil(math.log2(40))"
  explain: 2^6 = 64 > 40 > 32.
- type: num
  q: Determinant of e^(At) at t = 1 for A with trace −3?
  answer: 0.049787
  tol: 0.001
  py: "math.exp(-3)"
  explain: det e^(At) = e^(trace(A) t).
- type: mc
  q: When does the eigen-decomposition route to e^(At) fail?
  options:
    - when A is defective (not enough eigenvectors)
    - when A has complex eigenvalues
    - when A is stable
    - when t is negative
  answer: 0
  explain: Complex eigenvalues are fine; a missing eigenvector makes V singular.
- type: mc
  q: The second term in x(t) = e^(At)x0 + ∫e^(A(t−τ))Bu(τ)dτ is…
  options:
    - the forced response, a convolution with the impulse response
    - the free response
    - the steady state only
    - an approximation error
  answer: 0
  explain: e^(At)B is the impulse response from u to x.
:::end
