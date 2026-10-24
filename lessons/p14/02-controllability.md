---
id: p14-l02
minutes: 35
summary: A system is controllable when some input can steer it from any state to any other, and the test is the rank of the controllability matrix built from B, AB, A squared B and so on. You derive the rank test and the PBH eigenvector test, apply both to the cart-pole and to pairs of mass-springs driven by one force, and test that the ranks match what the physics predicts.
---

## Can the input reach every state?

$\dot x = Ax + Bu$ with $n$ states is **controllable** if, for any $x_0$, $x_1$ and time $T > 0$, some input $u(t)$ drives $x(0) = x_0$ to $x(T) = x_1$.

From the solution in lesson 01, the reachable states from $x_0 = 0$ are $\int_0^T e^{A(T-\tau)}Bu(\tau)\,d\tau$. Expand $e^{A\sigma}$ in powers of $A$; by the Cayley-Hamilton theorem, $A^n$ and higher are combinations of $I, A, \dots, A^{n-1}$. So every reachable state lies in the span of

$$\mathcal{C} = \begin{bmatrix}B & AB & A^2B & \cdots & A^{n-1}B\end{bmatrix},$$

and the system is controllable exactly when $\operatorname{rank}\mathcal{C} = n$.

**PBH test** (Popov-Belevitch-Hautus): controllable if and only if $\operatorname{rank}\begin{bmatrix}\lambda I - A & B\end{bmatrix} = n$ for every eigenvalue $\lambda$ of $A$. A failure means a left eigenvector $w$ with $w^TA = \lambda w^T$ and $w^TB = 0$: a mode the input can't touch.

## Two masses, one force

Two separate mass-spring systems, both pushed by the same force $u$. If they are identical, $x_1 - x_2$ obeys $m\ddot e = -ke$ with no input at all: you can never separate them. Rank 2 of 4. Make the springs different and the input excites the two resonances differently: rank 4. This is why identical parallel modes (two identical motors on one shaft, symmetric flexible modes) cause trouble.

:::figure widget=reachset caption="Where a bounded input can take a 2-state system from the origin in a given time. Each dot is the end of one random input history. When the system is uncontrollable the cloud collapses onto a line: no input reaches anything off it."
:::end

## Worked example

The cart-pole from the [pendulum lab](#lab-pendulum), linearised at upright (frictionless), has $A_{23} = -2.133$ (how tilt pushes the cart), $A_{43} = p^2 = 19.90$ (how tilt accelerates the fall), $B = (0, 1.159, 0, -1.932)$.

1. $AB = (1.159, 0, -1.932, 0)$, $A^2B = (0, 4.121, 0, -38.46)$, $A^3B = (4.121, 0, -38.46, 0)$.
2. $\det\mathcal{C} = 1342 \neq 0$: rank 4, controllable. One force on the cart can set position, speed, angle and angular rate.
3. For two identical decoupled lags $1/(s + 1)$ driven by one input, $\mathcal{C} = \begin{bmatrix}1 & -1\\ 1 & -1\end{bmatrix}$, rank 1.

## Code it from scratch

:::code file=controllability.py
```python
import numpy as np

def ctrb(A, B):
    n = len(A); cols = [B]
    for _ in range(n - 1): cols.append(A @ cols[-1])
    return np.hstack(cols)

def rank(M, tol=1e-9):
    s = np.linalg.svd(M, compute_uv=False)
    return int(np.sum(s > tol * max(1.0, s[0])))

def pbh_controllable(A, B):
    """Popov-Belevitch-Hautus: rank [lambda I - A, B] = n at every eigenvalue"""
    n = len(A)
    return all(rank(np.hstack([lam * np.eye(n) - A, B])) == n for lam in np.linalg.eigvals(A))

M, m, l, g = 0.8, 0.25, 0.45, 9.81
def cartpole_AB():
    """the live lab's cart-pole linearised at upright, frictionless: x = [x, xd, th, thd], u = F"""
    tot = M + m; den = l * (4 / 3 - m / tot)
    p2, beta = g / den, 1 / (tot * den)
    A = np.array([[0, 1, 0, 0], [0, 0, -m * l * p2 / tot, 0], [0, 0, 0, 1], [0, 0, p2, 0]], float)
    B = np.array([[0], [1 / tot + m * l * beta / tot], [0], [-beta]], float)
    return A, B

def two_masses(k1, k2, m1=1.0, m2=1.0):
    """two separate mass-spring systems pushed by the same force: x = [x1, v1, x2, v2]"""
    A = np.array([[0, 1, 0, 0], [-k1 / m1, 0, 0, 0], [0, 0, 0, 1], [0, 0, -k2 / m2, 0]], float)
    B = np.array([[0], [1 / m1], [0], [1 / m2]], float)
    return A, B

CASES = {   # name: (A, B, controllable in theory)
    "cart-pole, force on the cart": (*cartpole_AB(), True),
    "two identical mass-springs, one force": (*two_masses(4.0, 4.0), False),
    "two different mass-springs, one force": (*two_masses(4.0, 9.0), True),
    "decoupled lags 1/(s+1), 1/(s+1)": (-np.eye(2), np.ones((2, 1)), False),
    "decoupled lags 1/(s+1), 1/(s+2)": (np.diag([-1.0, -2.0]), np.ones((2, 1)), True),
    "input on one of two decoupled states": (np.diag([-1.0, -2.0]), np.array([[1.0], [0.0]]), False),
}

def test_rank_matches_theory():
    for name, (A, B, expect) in CASES.items():
        r = rank(ctrb(A, B))
        print(f"{name:40s} rank {r} of {len(A)}  {'controllable' if r == len(A) else 'NOT controllable'}")
        assert (r == len(A)) == expect
        assert pbh_controllable(A, B) == expect             # two independent tests agree

def test_identical_masses_move_together():
    # whatever the input, x1 - x2 obeys an unforced equation: from rest it stays zero
    A, B, _ = CASES["two identical mass-springs, one force"]
    dt, x = 1e-3, np.zeros(4); rng = np.random.default_rng(3)
    for k in range(5000):
        u = rng.normal() * 5
        x = x + dt * (A @ x + B[:, 0] * u)
    print(f"after 5 s of random force: x1 = {x[0]:.4f}, x2 = {x[2]:.4f}")
    assert abs(x[0] - x[2]) < 1e-12 and abs(x[0]) > 1e-3

def test_cartpole_ctrb_values():
    A, B = cartpole_AB()
    C = ctrb(A, B)
    assert abs(C[3, 0] + 1.93237) < 1e-4 and abs(np.linalg.det(C)) > 1.0

test_rank_matches_theory()
test_identical_masses_move_together()
test_cartpole_ctrb_values()
print("PASS")
```
:::end

## Exercises

:::exercise
A motor drives two identical wheels through identical shafts. Can a single motor torque control each wheel's angle independently?
:::solution
No. By symmetry the difference between the two wheel angles has dynamics with no input: like the identical mass-springs, it's an uncontrollable mode. It decays only if the shafts have damping, and you can't command it. A differential (or a second motor) fixes this.
:::end

:::exercise
Controllability is a yes/no test. Why might a "controllable" system still be hard to control?
:::solution
The controllability matrix can be nearly rank-deficient: its smallest singular value tiny compared with the largest. Moving the state in that direction then needs huge inputs. The two mass-springs with $k = 4$ and $k = 4.01$ are controllable on paper but separating them takes enormous force. The controllability Gramian quantifies this.
:::end

## Quiz

:::quiz
- type: num
  q: How many columns does the controllability matrix have for 4 states and 1 input?
  answer: 4
  tol: 0.001
  py: "4*1"
  explain: B, AB, A²B, A³B.
- type: num
  q: Rank of the controllability matrix for two identical mass-springs pushed by one force?
  answer: 2
  tol: 0.001
  py: "2"
  explain: The difference mode can't be excited.
- type: num
  q: Determinant of [[1, −1], [1, −2]], the controllability matrix of 1/(s+1) and 1/(s+2) in parallel?
  answer: -1
  tol: 0.001
  py: "1*(-2)-(-1)*1"
  explain: Nonzero, so controllable.
- type: num
  q: Cart-pole B entry for the pole's angular acceleration per newton (β = 1/((M+m)ℓ(4/3 − m/(M+m))))?
  answer: 1.9324
  tol: 0.001
  unit: rad/(s²·N)
  py: "1/(1.05*0.45*(4/3-0.25/1.05))"
  explain: The magnitude of the fourth entry of B.
- type: mc
  q: The PBH test fails at an eigenvalue λ when…
  options:
    - a left eigenvector for λ is orthogonal to B
    - λ is unstable
    - λ is complex
    - A is not invertible
  answer: 0
  explain: That mode is invisible to the input.
- type: mc
  q: Why do the powers stop at A^(n−1)B?
  options:
    - by Cayley-Hamilton, higher powers are combinations of lower ones
    - higher powers are always zero
    - the input is bounded
    - to save computation only
  answer: 0
  explain: A satisfies its own characteristic polynomial.
:::end
