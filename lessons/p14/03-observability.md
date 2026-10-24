---
id: p14-l03
minutes: 35
summary: A system is observable when its outputs, watched for a while, pin down the whole state, and the test is the rank of the observability matrix built from C, CA, C A squared and so on. You derive the test and its duality with controllability, find which cart-pole sensors make every state recoverable, and test that the ranks match theory and that unobservable states really produce identical sensor readings.
---

## Can the output reveal every state?

$\dot x = Ax$, $y = Cx$ is **observable** if $y(t)$ over any interval determines $x(0)$. Differentiate the output:

$$y = Cx,\quad \dot y = CAx,\quad \ddot y = CA^2x,\ \dots$$

Stacking these, $x(0)$ is recoverable exactly when the **observability matrix**

$$\mathcal{O} = \begin{bmatrix}C\\ CA\\ \vdots\\ CA^{n-1}\end{bmatrix}$$

has rank $n$. Its null space is the **unobservable subspace**: initial states in it produce $y(t) \equiv 0$, so two states differing by such a vector look identical to every sensor forever.

**Duality.** $\mathcal{O}(A, C)^T = \mathcal{C}(A^T, C^T)$, so $(A, C)$ is observable if and only if $(A^T, C^T)$ is controllable. Every controller-design tool becomes an observer-design tool by transposing, which lesson 09 uses.

## Which sensors does the cart-pole need?

Linearised, the pole's angle obeys $\ddot\theta = p^2\theta - \beta F$: nothing about the cart's position or speed enters. So an angle sensor (or a gyro on the pole) can never tell where the cart is: rank 2. A cart-speed sensor sees the angle through the coupling $\ddot x = A_{23}\theta + \dots$ but can't tell absolute position: rank 3. A cart-position encoder sees everything, because position integrates speed and speed responds to angle: rank 4.

:::figure widget=obsensors caption="Toggle the cart-pole's sensors. The rank of the observability matrix updates, and the plot compares what the chosen sensors read for two different starting states that differ only along the unobservable direction: when the system is unobservable, the readings coincide."
:::end

## Worked example

Angle sensor only, $C = (0, 0, 1, 0)$:

1. $CA = (0, 0, 0, 1)$, $CA^2 = (0, 0, p^2, 0)$, $CA^3 = (0, 0, 0, p^2)$.
2. Only columns 3 and 4 are nonzero: rank 2. Null space: $(1, 0, 0, 0)$ and $(0, 1, 0, 0)$, the cart position and speed.
3. Add the cart encoder, $C = \begin{bmatrix}1 & 0 & 0 & 0\\ 0 & 0 & 1 & 0\end{bmatrix}$: rank 4. That's the pendulum lab's sensor set: a cart encoder and a pole encoder.

## Code it from scratch

:::code file=observability.py
```python
import numpy as np
from itertools import combinations
from scipy.linalg import expm, null_space

def obsv(A, C):
    n = len(A); rows = [C]
    for _ in range(n - 1): rows.append(rows[-1] @ A)
    return np.vstack(rows)

def ctrb(A, B):
    n = len(A); cols = [B]
    for _ in range(n - 1): cols.append(A @ cols[-1])
    return np.hstack(cols)

def rank(M, tol=1e-9):
    s = np.linalg.svd(M, compute_uv=False)
    return int(np.sum(s > tol * max(1.0, s[0])))

M, m, l, g = 0.8, 0.25, 0.45, 9.81
def cartpole_AB():
    tot = M + m; den = l * (4 / 3 - m / tot)
    p2, beta = g / den, 1 / (tot * den)
    A = np.array([[0, 1, 0, 0], [0, 0, -m * l * p2 / tot, 0], [0, 0, 0, 1], [0, 0, p2, 0]], float)
    B = np.array([[0], [1 / tot + m * l * beta / tot], [0], [-beta]], float)
    return A, B

A, B = cartpole_AB()
SENSORS = ["x", "xd", "th", "thd"]                      # each sensor measures one state
THEORY = {("x",): 4, ("xd",): 3, ("th",): 2, ("thd",): 2, ("x", "th"): 4, ("xd", "th"): 3, ("th", "thd"): 2}

def C_of(names):
    return np.array([[1.0 if s == n else 0.0 for s in SENSORS] for n in names])

def test_sensor_sets():
    for names, r_expect in THEORY.items():
        C = C_of(names); r = rank(obsv(A, C))
        print(f"sensors {', '.join(names):10s}: rank {r} of 4 {'observable' if r == 4 else ''}")
        assert r == r_expect
        assert rank(ctrb(A.T, C.T)) == r                  # duality: (A, C) observable <=> (A^T, C^T) controllable

def test_unobservable_states_look_identical():
    # with only the angle sensor, shifting the cart (and its speed) changes nothing the sensor sees
    C = C_of(("th",)); N = null_space(obsv(A, C))
    x0 = np.array([0.0, 0.0, 0.05, 0.0]); x1 = x0 + 0.7 * N[:, 0] + 0.3 * N[:, 1]
    y0 = [C @ expm(A * t) @ x0 for t in np.linspace(0, 1, 21)]
    y1 = [C @ expm(A * t) @ x1 for t in np.linspace(0, 1, 21)]
    print(f"unobservable subspace for the angle sensor spans x and xd: {np.round(np.abs(N).sum(axis=1), 3)}")
    assert np.abs(np.array(y0) - np.array(y1)).max() < 1e-9 and np.linalg.norm(x1 - x0) > 0.5

def test_all_single_and_pairs():
    count = sum(rank(obsv(A, C_of(c))) == 4 for k in (1, 2) for c in combinations(SENSORS, k))
    print(f"{count} of 10 single sensors and pairs make the cart-pole observable")
    assert count == 4                                      # every set that contains x: x, (x,xd), (x,th), (x,thd)

test_sensor_sets()
test_unobservable_states_look_identical()
test_all_single_and_pairs()
print("PASS")
```
:::end

## Exercises

:::exercise
A drone has only a GPS receiver, which gives position. Is its velocity observable in the model $\dot p = v$, $\dot v = u$?
:::solution
Yes. $C = (1, 0)$, $CA = (0, 1)$: rank 2. Watching position over time reveals its rate of change. The practical catch is noise: differentiating noisy positions amplifies it, which is what the Kalman filter (lesson 13) handles properly.
:::end

:::exercise
Why can't a rate gyro alone give a robot's heading, even with a perfect model?
:::solution
With $\dot\psi = r$ and $y = r$, $C = (0, 1)$ on states $(\psi, r)$ and $A = \begin{bmatrix}0 & 1\\ 0 & 0\end{bmatrix}$: $CA = (0, 0)$, rank 1. The initial heading never appears in the output. You need an absolute reference such as a magnetometer or GPS track.
:::end

## Quiz

:::quiz
- type: num
  q: Rank of the cart-pole observability matrix with only the pole angle measured?
  answer: 2
  tol: 0.001
  py: "2"
  explain: Cart position and speed never reach the angle.
- type: num
  q: Rank with only the cart speed measured?
  answer: 3
  tol: 0.001
  py: "3"
  explain: Absolute cart position is missing.
- type: num
  q: How many rows does the observability matrix have for 4 states and 2 sensors?
  answer: 8
  tol: 0.001
  py: "4*2"
  explain: n blocks of C, each with 2 rows.
- type: num
  q: CA² for the angle sensor has p² in column 3. What is p² for the lab cart-pole in s⁻²?
  answer: 19.904
  tol: 0.001
  unit: s⁻²
  py: "9.81/(0.45*(4/3-0.25/1.05))"
  explain: g/(ℓ(4/3 − m/(M+m))).
- type: mc
  q: Observability of (A, C) is equivalent to…
  options:
    - controllability of (Aᵀ, Cᵀ)
    - controllability of (A, B)
    - stability of A
    - C being square
  answer: 0
  explain: The duality used to design observers.
- type: mc
  q: Two initial states that differ by a vector in the unobservable subspace…
  options:
    - give identical outputs for all time
    - converge to each other
    - give outputs that differ by a constant
    - cannot both exist
  answer: 0
  explain: The difference produces zero output.
:::end
