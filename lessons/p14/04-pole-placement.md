---
id: p14-l04
minutes: 40
summary: With full state feedback u = -Kx and a controllable system, you can put the closed-loop poles anywhere you like. You derive Ackermann's formula from the controllable canonical form and Cayley-Hamilton, implement it, and test that the closed-loop eigenvalues of the cart-pole and of an anti-sway crane land exactly on the chosen targets and agree with scipy.
---

## State feedback moves every pole

With $u = -Kx$ the closed loop is $\dot x = (A - BK)x$. Its characteristic polynomial $\det(sI - A + BK)$ has coefficients that are affine in the entries of $K$. For a single input and a controllable pair, there are $n$ gains and $n$ coefficients, and the match is always solvable: **any** set of poles (closed under conjugation) can be placed.

## Ackermann's formula

Let the desired polynomial be $\varphi(s) = s^n + a_1s^{n-1} + \dots + a_n$. In controllable canonical form the gains just subtract the open-loop coefficients from the desired ones. Transforming back to the original coordinates gives

$$K = \begin{bmatrix}0 & \cdots & 0 & 1\end{bmatrix}\mathcal{C}^{-1}\varphi(A), \qquad \varphi(A) = A^n + a_1A^{n-1} + \dots + a_nI.$$

The reason is Cayley-Hamilton: $A - BK$ must satisfy $\varphi(A - BK) = 0$; expanding and collecting terms in $B, AB, \dots$ leaves exactly the last row of $\mathcal{C}^{-1}\varphi(A)$. It's elegant but numerically poor for large $n$ (it needs $\mathcal{C}^{-1}$); `scipy.signal.place_poles` uses a robust orthogonal method instead.

**Where to put the poles.** Faster poles need larger gains and more actuator effort, and amplify sensor noise. A common choice: dominant pairs with $\zeta \approx 0.7$ at the bandwidth you need, other poles 2–5 times further left. LQR (lesson 05) replaces this guesswork with weights.

## Real-world anchor: anti-sway on a crane

Gantry cranes, and the material ropeways that supply building sites and mountain huts in the Swiss Alps, carry loads that swing like pendulums. Moving the trolley fast without leaving the load swinging is a pole-placement problem: the open-loop sway mode is undamped, and feedback on trolley position, speed, rope angle and angle rate can give it any damping you choose. The crane values below (500 kg trolley, 1 t load, 8 m rope) are illustrative.

:::figure widget=poleplace caption="An anti-sway crane under pole placement. Choose the speed and damping of the trolley poles and the sway poles: the gains come from Ackermann's formula, and the plot shows the trolley position and load sway during a 10 m move."
:::end

## Worked example

Crane: $\dot x = v$, $\dot v = (F + mg\phi)/M$, $\ddot\phi = -\tfrac{(M + m)g}{ML}\phi - \tfrac{F}{ML}$.

1. Open-loop sway frequency: $\sqrt{1500 \times 9.81/(500 \times 8)} = 1.918$ rad/s, undamped.
2. Targets: trolley pair $\omega_n = 0.8$, $\zeta = 0.8$; sway pair $\omega_n = 1.2$, $\zeta = 0.7$.
3. Ackermann gives $K = (375.8, 1190, 799.6, -2320)$. A 10 m move peaks at about 10° of sway and is quiet (under 0.01°) after 15 s.

## Code it from scratch

:::code file=pole_placement.py
```python
import numpy as np
from scipy.signal import place_poles
from scipy.linalg import expm

def ctrb(A, B):
    n = len(A); cols = [B]
    for _ in range(n - 1): cols.append(A @ cols[-1])
    return np.hstack(cols)

def ackermann(A, B, poles):
    """K such that eig(A - B K) = poles, single input: K = e_n^T C^-1 phi(A)"""
    n = len(A)
    a = np.real(np.poly(poles))                            # desired characteristic polynomial, highest power first
    phi = sum(c * np.linalg.matrix_power(A, n - i) for i, c in enumerate(a))
    en = np.zeros((1, n)); en[0, -1] = 1.0
    return en @ np.linalg.solve(ctrb(A, B), phi)

def crane(M=500.0, m=1000.0, L=8.0, g=9.81):
    """trolley (mass M) with a load m hanging on a rope of length L: x = [x, xd, phi, phid], u = force on the trolley"""
    A = np.array([[0, 1, 0, 0], [0, 0, m * g / M, 0], [0, 0, 0, 1], [0, 0, -(M + m) * g / (M * L), 0]])
    B = np.array([[0], [1 / M], [0], [-1 / (M * L)]])
    return A, B

def cartpole_AB(M=0.8, m=0.25, l=0.45, g=9.81):
    tot = M + m; den = l * (4 / 3 - m / tot); p2, beta = g / den, 1 / (tot * den)
    A = np.array([[0, 1, 0, 0], [0, 0, -m * l * p2 / tot, 0], [0, 0, 0, 1], [0, 0, p2, 0]], float)
    B = np.array([[0], [1 / tot + m * l * beta / tot], [0], [-beta]], float)
    return A, B

def pair(wn, z):
    return [complex(-z * wn, wn * np.sqrt(1 - z * z)), complex(-z * wn, -wn * np.sqrt(1 - z * z))]

def test_eigenvalues_match_targets():
    for name, (A, B), poles in (("cart-pole", cartpole_AB(), [-3, -4, -5, -6]),
                                ("cart-pole, complex", cartpole_AB(), pair(4, 0.7) + pair(2, 0.9)),
                                ("crane", crane(), pair(0.8, 0.8) + pair(1.2, 0.7))):
        K = ackermann(A, B, poles)
        got = np.sort_complex(np.linalg.eigvals(A - B @ K)); want = np.sort_complex(np.array(poles, complex))
        Kref = place_poles(A, B, poles).gain_matrix
        print(f"{name:20s} K = {np.round(K.ravel(), 3)}  max eigenvalue error {np.abs(got - want).max():.1e}")
        assert np.abs(got - want).max() < 1e-6 and np.allclose(K, Kref, rtol=1e-6)

def test_crane_moves_without_sway():
    A, B = crane(); K = ackermann(A, B, pair(0.8, 0.8) + pair(1.2, 0.7))
    # move the trolley 10 m: feedback on x - 10
    Acl = A - B @ K; xr = np.array([10.0, 0, 0, 0]); dt = 0.05; E = expm(Acl * dt)
    e = -xr; xs = []
    for _ in range(int(30 / dt)): xs.append(e + xr); e = E @ e
    xs = np.array(xs)
    print(f"crane: 10 m move, max sway {np.degrees(np.abs(xs[:, 2]).max()):.1f} deg, sway after 15 s {np.degrees(np.abs(xs[300:, 2]).max()):.3f} deg, final x {xs[-1, 0]:.3f} m")
    assert abs(xs[-1, 0] - 10) < 0.01 and np.degrees(np.abs(xs[300:, 2]).max()) < 0.1
    # open loop the sway mode is undamped at sqrt((M+m)g/(ML))
    assert abs(np.abs(np.linalg.eigvals(A)).max() - np.sqrt(1500 * 9.81 / (500 * 8))) < 1e-9

test_eigenvalues_match_targets()
test_crane_moves_without_sway()
print("PASS")
```
:::end

## Exercises

:::exercise
Why does Ackermann's formula need the system to be controllable?
:::solution
It inverts the controllability matrix $\mathcal{C}$. If $\mathcal{C}$ is singular, some mode can't be influenced by $u$, so its eigenvalue stays where it is whatever $K$ you choose, and no formula can move it.
:::end

:::exercise
You double every target pole's distance from the origin. Roughly what happens to the gains and the force?
:::solution
Gains grow quickly: the polynomial coefficients scale as $\omega^k$ for the $s^{n-k}$ term, so the position-like gains rise by up to $2^4 = 16$. The peak force for the same move rises sharply too, and saturation and noise set the practical limit.
:::end

## Quiz

:::quiz
- type: num
  q: Open-loop sway frequency in rad/s for M = 500 kg, m = 1000 kg, L = 8 m?
  answer: 1.918
  tol: 0.001
  unit: rad/s
  py: "math.sqrt(1500*9.81/(500*8))"
  explain: √((M + m)g/(ML)).
- type: num
  q: Constant term of the desired polynomial for poles −3, −4, −5, −6?
  answer: 360
  tol: 0.001
  py: "3*4*5*6"
  explain: The product of the pole magnitudes.
- type: num
  q: Coefficient of s³ for poles −3, −4, −5, −6?
  answer: 18
  tol: 0.001
  py: "3+4+5+6"
  explain: The sum of the magnitudes.
- type: num
  q: Real part of a pole pair with ω_n = 0.8 rad/s and ζ = 0.8?
  answer: -0.64
  tol: 0.001
  py: "-0.8*0.8"
  explain: −ζω_n.
- type: mc
  q: Ackermann's formula applies directly to…
  options:
    - single-input controllable systems
    - any multi-input system
    - unobservable systems only
    - discrete systems only
  answer: 0
  explain: Multi-input placement has extra freedom and needs another method.
- type: mc
  q: Why is Ackermann avoided for large systems in practice?
  options:
    - it inverts the often ill-conditioned controllability matrix
    - it gives the wrong poles in theory
    - it cannot place complex poles
    - it needs a Kalman filter
  answer: 0
  explain: Robust methods use orthogonal transformations.
:::end
