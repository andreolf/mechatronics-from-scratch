---
id: p12-l09
minutes: 40
summary: A state-space model writes any linear system as x' = Ax + Bu and y = Cx + Du, where the state holds exactly what you need to know to predict the future, and every transfer function has state-space realisations such as the controllable canonical form. You derive how to choose states and how to build that form from a transfer function's coefficients, implement the conversion, and test that converting back gives the original transfer function.
---

## What a state is

The **state** of a system is the smallest set of numbers that, with the future inputs, determines the future. For a mass on a spring it's position and velocity: knowing only position isn't enough, since the mass could be moving either way. Natural choices are the variables of the energy stores (lesson 01): positions of springs, velocities of masses, capacitor voltages, inductor currents. Then

$$\dot x = Ax + Bu, \qquad y = Cx + Du.$$

For $m\ddot x + c\dot x + kx = F$ with state $[x, v]$:

$$A = \begin{bmatrix} 0 & 1 \\ -k/m & -c/m\end{bmatrix},\quad B = \begin{bmatrix} 0 \\ 1/m \end{bmatrix},\quad C = \begin{bmatrix} 1 & 0\end{bmatrix},\quad D = 0.$$

State space handles many inputs and outputs, initial conditions and (with small changes) nonlinear and time-varying systems, which is why modern control (Phase 14) uses it.

## Back and forth

From state space to transfer function: take Laplace transforms with zero initial state,

$$G(s) = C(sI - A)^{-1}B + D,$$

and the poles of $G$ are the eigenvalues of $A$.

From a transfer function to state space there are infinitely many answers, because any invertible change of state $z = Tx$ gives another valid model ($A' = TAT^{-1}$, $B' = TB$, $C' = CT^{-1}$). One standard choice is the **controllable canonical form**. For

$$G(s) = \frac{b_{n-1}s^{n-1} + \cdots + b_0}{s^n + a_{n-1}s^{n-1} + \cdots + a_0} + D,$$

$$A = \begin{bmatrix} 0 & 1 & & \\ & \ddots & \ddots & \\ & & 0 & 1 \\ -a_0 & -a_1 & \cdots & -a_{n-1}\end{bmatrix}, \quad B = \begin{bmatrix}0\\ \vdots \\ 0 \\ 1\end{bmatrix}, \quad C = \begin{bmatrix} b_0 & b_1 & \cdots & b_{n-1}\end{bmatrix}.$$

If the numerator has the same degree as the denominator, divide first: the quotient is $D$, the remainder gives the $b$'s.

:::figure widget=statetraj caption="Trajectories of a third-order system in its three-dimensional state space from different initial states. Change the damping to see spirals into the origin turn into straight decays."
:::end

## Worked example

$G(s) = \dfrac{2s + 3}{s^2 + 4s + 5}$.

1. $a_1 = 4, a_0 = 5$; $b_1 = 2, b_0 = 3$; $D = 0$.
2. $A = \begin{bmatrix} 0 & 1 \\ -5 & -4\end{bmatrix}$, $B = \begin{bmatrix}0\\1\end{bmatrix}$, $C = \begin{bmatrix}3 & 2\end{bmatrix}$.
3. Check at $s = 0$: $C(-A)^{-1}B = 3/5$, and $G(0) = 3/5$.
4. Eigenvalues of $A$: $-2 \pm j$, the roots of $s^2 + 4s + 5$.

## Code it from scratch

:::code file=canonical.py
```python
import numpy as np
from scipy import signal

def tf2ccf(num, den):
    """controllable canonical form of num/den (proper); returns A, B, C, D"""
    num, den = np.array(num, float), np.array(den, float)
    num, den = num / den[0], den / den[0]
    n = len(den) - 1
    num = np.concatenate([np.zeros(n + 1 - len(num)), num])     # pad to degree n
    D = num[0]
    rem = num - D * den                                         # strictly proper remainder
    b = rem[1:][::-1]                                           # b0 .. b_{n-1}
    a = den[1:][::-1]                                           # a0 .. a_{n-1}
    A = np.zeros((n, n)); A[:-1, 1:] = np.eye(n - 1); A[-1, :] = -a
    B = np.zeros((n, 1)); B[-1, 0] = 1
    C = b.reshape(1, n)
    return A, B, C, np.array([[D]])

def ss_eval(A, B, C, D, s):
    n = A.shape[0]
    return (C @ np.linalg.solve(s * np.eye(n) - A, B) + D)[0, 0]

def test_worked_example():
    A, B, C, D = tf2ccf([2, 3], [1, 4, 5])
    assert np.allclose(A, [[0, 1], [-5, -4]]) and np.allclose(C, [[3, 2]]) and D[0, 0] == 0
    assert abs(ss_eval(A, B, C, D, 0) - 0.6) < 1e-12
    assert np.allclose(sorted(np.linalg.eigvals(A), key=lambda z: z.imag), [-2 - 1j, -2 + 1j])

def test_round_trip_random():
    rng = np.random.default_rng(2)
    for _ in range(300):
        n = rng.integers(1, 7)
        den = np.concatenate([[1.0], rng.uniform(-5, 5, n)])
        num = rng.uniform(-5, 5, rng.integers(1, n + 2))           # up to the same degree: D can be non-zero
        A, B, C, D = tf2ccf(num, den)
        for s in [0.3j, 1.7j, 2.0 + 1j, 11j]:
            g = np.polyval(num, s) / np.polyval(den, s)
            assert abs(ss_eval(A, B, C, D, s) - g) <= 1e-8 * max(1, abs(g))
        n2, d2 = signal.ss2tf(A, B, C, D)                          # independent conversion back
        L = max(len(num), len(n2[0]))
        assert np.allclose(np.pad(num / den[0], (L - len(num), 0)), np.pad(n2[0], (L - len(n2[0]), 0)), atol=1e-8)
        assert np.allclose(d2, den, atol=1e-8)
        assert np.allclose(np.sort_complex(np.linalg.eigvals(A)), np.sort_complex(np.roots(den)), atol=1e-6)
    print("300 random transfer functions: CCF -> TF matches the original (own evaluation and scipy.signal.ss2tf)")

def test_similarity_invariance():
    A, B, C, D = tf2ccf([1, 2, 3], [1, 6, 11, 6])
    T = np.random.default_rng(3).normal(size=(3, 3))
    Ti = np.linalg.inv(T)
    A2, B2, C2 = T @ A @ Ti, T @ B, C @ Ti
    for s in [0.5j, 3j, 1 + 2j]:
        assert abs(ss_eval(A, B, C, D, s) - ss_eval(A2, B2, C2, D, s)) < 1e-9
    print("a random change of state variables leaves the transfer function unchanged")

def test_mass_spring():
    m, c, k = 2.0, 3.0, 50.0
    A = np.array([[0, 1], [-k / m, -c / m]]); B = np.array([[0], [1 / m]]); C = np.array([[1.0, 0]]); D = np.zeros((1, 1))
    for s in [0.1j, 5j, 2 + 3j]:
        assert abs(ss_eval(A, B, C, D, s) - 1 / (m * s ** 2 + c * s + k)) < 1e-12

test_worked_example()
test_round_trip_random()
test_similarity_invariance()
test_mass_spring()
print("PASS")
```
:::end

## Exercises

:::exercise
Write a state-space model of a series RLC circuit with the capacitor voltage as output.
:::solution
States: capacitor voltage $v_C$ and inductor current $i$. $C\dot v_C = i$ and $L\dot i = V - Ri - v_C$, so $A = \begin{bmatrix}0 & 1/C\\ -1/L & -R/L\end{bmatrix}$, $B = \begin{bmatrix}0\\1/L\end{bmatrix}$, $C_{out} = \begin{bmatrix}1 & 0\end{bmatrix}$, $D = 0$.
:::end

:::exercise
Why might two different state-space models with the same transfer function still behave differently in a simulation that starts from non-zero initial conditions?
:::solution
They don't, if they're related by a similarity transform and you transform the initial state too. But a model can also contain uncontrollable or unobservable modes that cancel in the transfer function; those modes respond to initial conditions even though the transfer function hides them. Minimal realisations have none.
:::end

## Quiz

:::quiz
- type: num
  q: The D term of G(s) = (3s + 1)/(s + 2)?
  answer: 3
  tol: 0
  py: "3"
  explain: Divide first; the remainder is −5/(s + 2).
- type: num
  q: Number of states in a minimal realisation of a fourth-order transfer function?
  answer: 4
  tol: 0
  py: "4"
  explain: The denominator degree.
- type: num
  q: DC gain C(−A)⁻¹B of the worked example?
  answer: 0.6
  tol: 0.001
  py: "3/5"
  explain: b₀/a₀.
- type: num
  q: The entry A[2,1] (bottom-left) of the CCF of 1/(s² + 7s + 12)?
  answer: -12
  tol: 0
  py: "-12"
  explain: The bottom row is −a₀, −a₁.
- type: mc
  q: The poles of C(sI − A)⁻¹B + D are…
  options:
    - eigenvalues of A (for a minimal realisation)
    - entries of B
    - zeros of C
    - eigenvalues of D
  answer: 0
  explain: det(sI − A) is the denominator.
- type: mc
  q: What does a similarity transform change?
  options:
    - the state variables, not the input-output behaviour
    - the transfer function
    - the poles
    - the DC gain
  answer: 0
  explain: A' = TAT⁻¹ has the same eigenvalues.
:::end
