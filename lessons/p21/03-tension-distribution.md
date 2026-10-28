---
id: p21-l03
minutes: 45
summary: A cable can pull but never push. With four cables holding a three-dimensional force there is one spare degree of freedom, and it decides how the weight is shared. You find the null space, the range of tensions that keep every line taut, and the choice a controller has to make inside that range.
---

## Four unknowns, three equations

Hold the pivot still with a payload of mass $m$ hanging under it. Each line pulls along its own unit vector $\mathbf u_i$, from the pivot towards its anchor, with tension $t_i$. Static balance is

$$ \sum_{i=1}^{4} t_i\,\mathbf u_i = m g\,\hat{\mathbf z} \qquad\Longleftrightarrow\qquad U\mathbf t = \mathbf f, \quad U = [\mathbf u_1\ \mathbf u_2\ \mathbf u_3\ \mathbf u_4]. $$

$U$ is 3 × 4, so if any three of the lines point in independent directions the solutions form a line in four-dimensional tension space:

$$ \mathbf t = \mathbf t_p + \lambda\,\mathbf n, \qquad U\mathbf n = 0 . $$

$\mathbf t_p = U^\mathsf T (U U^\mathsf T)^{-1}\mathbf f$ is the minimum-norm solution, the smallest set of tensions in the least-squares sense. The null vector $\mathbf n$ has a neat closed form for a 3 × 4 matrix, the generalised cross product: $n_i = (-1)^{i}\det(U \text{ with column } i \text{ removed})$, which is just Cramer's rule in disguise.

The physical constraint is the part that matters: **cables only pull**, so we need $t_i \ge 0$ for every line, and in practice $t_i \ge t_\text{min}$ so that no line sags. Each inequality cuts the line $\lambda \in \mathbb R$ into a half-line, and what is left is an interval $[\lambda_\text{lo}, \lambda_\text{hi}]$. If it is empty, no set of pulling cables can hold the load there.

## What the spare degree of freedom does

Put the pivot dead centre in Stringman's 7 × 7 × 3 m example room, at 1.5 m, with Stringman's average rated payload of 1.25 kg. All four lines are 5.172 m long and rise at the same angle, $\sin\theta = 1.5/5.172 = 0.290$. Symmetry says the minimum-norm answer shares the load equally:

$$ t_i = \frac{m g}{4\sin\theta} = \frac{1.25 \times 9.81}{4 \times 0.290} = 10.57\ \text{N}. $$

That is about 0.86 times the weight, on every line, to hold up the weight once. The shallow angle is the price of a big workspace.

The null vector at the centre is $\mathbf n \propto (1, -1, 1, -1)$. Moving along it tightens one diagonal pair and loosens the other by the same amount. You can go all the way to $\lambda = \pm 21.14$ N: one diagonal pair carries 21.14 N each and the other pair goes slack. Every split in between holds the same gripper still.

Notice what you cannot do: there is no direction that tightens all four lines at once. With every anchor above the pivot, the cables can only ever lift. Robots whose anchors surround the platform (some above and some below, or on opposite walls with the payload between them) can be *pretensioned* and made stiff in every direction. A suspended robot like Stringman relies on gravity for its tension, so a downward pull it cannot resist is the only thing keeping it taut.

## Why this is a control problem

Position control picks lengths, not tensions. Four lengths over-determine three coordinates, so if one winch is 1 mm off, the geometry has no solution with all four lines straight. In practice one line goes a little slack and the load sits on the other three, or two lines share it as a diagonal pair. Which happens depends on errors you do not see.

So a working four-line robot needs some way to steer along the null space: measure tension (load cells, or motor current as a proxy) and adjust, run the winches in a compliant mode, or choose a deliberately conservative distribution and hold the lines to it. The simulator below uses the minimum-norm distribution whenever it is inside the feasible interval, which is the smoothest choice as the gripper moves. When the minimum-norm solution would slacken a line or breach the tension limit, it slides along the null space just far enough to fix that. If no point on the line keeps every tension between zero and the limit, it shows the minimax choice, the λ that makes the tightest line as loose as possible, and flags the pose.

:::figure widget=cablebot args={"preset":"tension"} caption="Tensions under payload. Each line is coloured by its tension; coral means slack or over the limit. Drag the target towards a wall or corner and watch the far lines go slack. Raise the payload and watch the near line climb towards the limit."
:::end

## Worked example: off centre

Take the gripper from Lesson 2 at $(1.0, -0.5, 0.4)$, pivot at $(1.0, -0.5, 0.9)$, 1.25 kg. The weight is $12.26$ N.

1. Minimum norm: $\mathbf t_p = (6.70, 9.68, 8.11, 5.94)$ N. Line 2, the one with its anchor in the pivot's own quarter of the room, carries the most. It is also the steepest.
2. Null vector, normalised: $\mathbf n = (0.528, -0.404, 0.470, -0.581)$. Still alternating in sign, but no longer symmetric.
3. Feasible interval with $t_i \ge 0$: $\lambda \in [-12.68, 10.23]$ N. At the lower end line 1 goes slack, at the upper end line 4 does.
4. Minimax: the lowest possible peak tension is $8.96$ N, with lines 2 and 3 equal at the peak and $\mathbf t = (7.64, 8.96, 8.96, 4.90)$ N. That is 7 % below the minimum-norm peak of 9.68 N.
5. Check: the vertical components of either set add up to 12.26 N and the horizontal ones cancel. That is the test you should always write first.

Move the pivot further, to $(3.0, -0.5, 0.9)$, half a metre from the wall. Now the far lines nearly vanish: minimum norm $(1.40, 11.64, 10.33, 1.82)$ N, and the feasible interval has shrunk to $[-2.32, 2.84]$ N. The robot still holds the load, but a small disturbance can slacken a line.

## Code it from scratch

:::code file=tension_distribution.py
```python
import numpy as np

G = 9.81
A = np.array([[-3.5, -3.5, 3.0], [3.5, -3.5, 3.0], [3.5, 3.5, 3.0], [-3.5, 3.5, 3.0]])

def structure(p):
    v = A - p
    return (v / np.linalg.norm(v, axis=1)[:, None]).T          # 3 x 4, columns u_i

def null_vector(U):
    """generalised cross product: n_i = (-1)^i det(U without column i)"""
    n = np.array([(-1) ** i * np.linalg.det(np.delete(U, i, axis=1)) for i in range(4)])
    n /= np.linalg.norm(n)
    return n if n[0] >= 0 else -n

def feasible_range(tp, n, t_min=0.0):
    lo, hi = -np.inf, np.inf
    for t, k in zip(tp, n):
        if k > 0: lo = max(lo, (t_min - t) / k)
        elif k < 0: hi = min(hi, (t_min - t) / k)
        elif t < t_min: return None
    return (lo, hi) if lo <= hi else None

def minimax(tp, n, lo, hi):
    """lambda in [lo, hi] that minimises max_i (tp_i + lambda n_i): a convex piecewise-linear function,
    so its minimum is at an end or where two lines cross"""
    cands = [lo, hi] + [(tp[j] - tp[i]) / (n[i] - n[j]) for i in range(4) for j in range(i + 1, 4) if n[i] != n[j]]
    cands = [c for c in cands if lo - 1e-12 <= c <= hi + 1e-12]
    return min(cands, key=lambda c: np.max(tp + c * n))

def distribute(p, mass, t_min=0.0):
    U = structure(p)
    f = np.array([0, 0, mass * G])
    tp = U.T @ np.linalg.solve(U @ U.T, f)
    n = null_vector(U)
    assert np.allclose(U @ n, 0, atol=1e-12)
    r = feasible_range(tp, n, t_min)
    return U, tp, n, r

# centre of the room: equal tensions, m g / (4 sin theta)
U, tp, n, r = distribute(np.array([0, 0, 1.5]), 1.25)
s = 1.5 / np.hypot(np.hypot(3.5, 3.5), 1.5)
assert np.allclose(tp, 1.25 * G / (4 * s)) and abs(tp[0] - 10.57) < 0.005
assert np.allclose(n, [0.5, -0.5, 0.5, -0.5])                 # one diagonal pair against the other
assert abs(r[1] - 21.14) < 0.01 and abs(r[0] + r[1]) < 1e-9
print(f"centre: {tp[0]:.2f} N on each line; lambda can range over ±{r[1]:.2f} N")

# off centre
p = np.array([1.0, -0.5, 0.9])
U, tp, n, (lo, hi) = distribute(p, 1.25)
lam = minimax(tp, n, lo, hi)
t = tp + lam * n
print("min-norm:", tp.round(2), " minimax:", t.round(2), " range:", round(lo, 2), round(hi, 2))
assert np.allclose(tp, [6.70, 9.68, 8.11, 5.94], atol=0.006)
assert np.allclose(t, [7.64, 8.96, 8.96, 4.90], atol=0.006)
for tt in (tp, t):
    assert np.all(tt >= -1e-9)
    assert np.allclose(U @ tt, [0, 0, 1.25 * G])               # vertical sums to the weight, horizontal cancels

# brute force agrees with the minimax choice
grid = np.linspace(lo, hi, 200001)
assert abs(np.min(np.max(tp[None] + grid[:, None] * n[None], axis=1)) - t.max()) < 1e-3

# no direction tightens every line: the null vector always has mixed signs when all anchors are above
rng = np.random.default_rng(0)
for _ in range(1000):
    q = np.array([rng.uniform(-3.4, 3.4), rng.uniform(-3.4, 3.4), rng.uniform(0.2, 2.9)])
    nq = null_vector(structure(q))
    assert nq.min() < 0 < nq.max()
print("1000 random poses: the null vector always mixes signs, so a suspended robot cannot pretension")
print("PASS")
```
:::end

## In practice

The first time you hang a four-line robot you will see the null space with your own eyes: one line hums tight and its diagonal partner droops, and pushing the gripper sideways a centimetre swaps them. That is not a fault in the maths, it is the maths. Real fixes are a tension estimate from each motor, a little deliberate compliance, or a controller that winds each line until it feels a small minimum tension before treating it as a position axis.

## Exercises

:::exercise
At the room centre with the pivot at 1.5 m, what is the largest tension any one line can be made to carry while the gripper stays put, and what are the other three doing then?
:::solution
The end of the feasible interval: λ = 21.14 N on the normalised null vector $(0.5, -0.5, 0.5, -0.5)$ gives $10.57 + 0.5 \times 21.14 = 21.14$ N on lines 1 and 3, and zero on lines 2 and 4. The load hangs on one diagonal pair at twice the even-share tension.
:::end

:::exercise
Why is the minimum-norm distribution not always the right one to command?
:::solution
It minimises the sum of squares, not the peak. Near the edge of the workspace, where the peak tension is what trips a limit or breaks a line, the minimax choice can carry the same load with a lower worst-case tension, 8.96 N against 9.68 N in the worked example. The minimum-norm solution can also leave a line closer to slack than you would like, so many controllers enforce a $t_\text{min}$ of a few newtons as well.
:::end

## Quiz

:::quiz
- type: num
  q: Tension in each line at the centre of a 7 × 7 × 3 m room with the pivot at 1.5 m and 1.25 kg (N)?
  answer: 10.57
  tol: 0.005
  py: "1.25*9.81/(4*1.5/math.sqrt(24.5+2.25))"
  explain: m g / (4 sin θ) with sin θ = 1.5/5.172.
- type: mc
  q: What does moving along the null vector do at the centre of a square room?
  options: ["Tightens one diagonal pair and loosens the other", "Tightens all four lines", "Lifts the gripper", "Rotates the gripper"]
  answer: 0
  explain: n ∝ (1, −1, 1, −1); the net force does not change.
- type: mc
  q: Why can't a robot with all four anchors above the payload be pretensioned?
  options: ["Every null-space direction has mixed signs, so no internal force tightens all lines at once", "Its motors are too weak", "Cables stretch", "The pole is too short"]
  answer: 0
  explain: All lines can only pull upwards; gravity provides the tension.
- type: mc
  q: The minimum-norm tensions at a pose have one negative entry, and the feasible interval for λ is empty. What does that mean?
  options: ["No combination of pulling cables can hold the load there", "Use the minimax solution", "Increase the payload", "The Jacobian is wrong"]
  answer: 0
  explain: An empty interval means there is no all-pulling solution; one line would have to push.
- type: num
  q: Lowest possible peak tension at the pivot (1.0, −0.5, 0.9) with 1.25 kg (N)?
  answer: 8.96
  tol: 0.01
  py: "8.955"
  explain: The minimax choice, with lines 2 and 3 equal at the peak.
- type: num
  q: With a position-controlled four-line robot at the centre, one line is commanded 1 mm too long. How many lines are left carrying the load in the ideal rigid model?
  answer: 3
  tol: 0
  py: "3"
  explain: Three lines fix the point; the fourth goes slack.
:::end

:::verify
import numpy as np, math
A = np.array([[-3.5,-3.5,3],[3.5,-3.5,3],[3.5,3.5,3],[-3.5,3.5,3]])
def S(p):
    v = A-p; return (v/np.linalg.norm(v,axis=1)[:,None]).T
U = S(np.array([0,0,1.5])); s = 1.5/math.sqrt(24.5+2.25)
assert abs(s-0.290) < 5e-4 and abs(math.sqrt(26.75)-5.172) < 5e-4
assert abs(1.25*9.81/(4*s)-10.57) < 0.005 and abs(1.25*9.81/(4*s)/(1.25*9.81)-0.86) < 0.005 and abs(2*1.25*9.81/(4*s)-21.14) < 0.01
assert abs(1.25*9.81-12.26) < 0.005
U = S(np.array([1.0,-0.5,0.9])); f = np.array([0,0,1.25*9.81]); tp = U.T@np.linalg.solve(U@U.T, f)
assert np.allclose(tp, [6.70,9.68,8.11,5.94], atol=0.006)
n = np.linalg.svd(U)[2][-1]; n = n/np.linalg.norm(n)*np.sign(np.linalg.svd(U)[2][-1][0])
assert np.allclose(n, [0.528,-0.404,0.470,-0.581], atol=6e-4)
lo = max(-tp[i]/n[i] for i in range(4) if n[i] > 0); hi = min(-tp[i]/n[i] for i in range(4) if n[i] < 0)
assert abs(lo+12.68) < 0.006 and abs(hi-10.23) < 0.006
g = np.linspace(lo, hi, 400001); pk = np.max(tp[None]+g[:,None]*n[None], axis=1); t = tp+g[np.argmin(pk)]*n
assert np.allclose(t, [7.64,8.96,8.96,4.90], atol=0.006) and abs(1-8.955/9.676-0.07) < 0.01
U = S(np.array([3.0,-0.5,0.9])); tp = U.T@np.linalg.solve(U@U.T, f)
assert np.allclose(tp, [1.40,11.64,10.33,1.82], atol=0.006)
n = np.linalg.svd(U)[2][-1]; n = n/np.linalg.norm(n)*np.sign(np.linalg.svd(U)[2][-1][0])
lo = max(-tp[i]/n[i] for i in range(4) if n[i] > 0); hi = min(-tp[i]/n[i] for i in range(4) if n[i] < 0)
assert abs(lo+2.32) < 0.006 and abs(hi-2.84) < 0.006
:::end

## Sources

- Neufangled, [Stringman tech specs](https://neufangled.com/) (7 × 7 × 3 m example room, 1.25 kg average payload).
- A. Pott, [*Cable-Driven Parallel Robots: Theory and Application*](https://doi.org/10.1007/978-3-319-76138-1), Springer, 2018 (structure matrix, force distribution, pretension).
- A. Pott, ["An improved force distribution algorithm for over-constrained cable-driven parallel robots"](https://doi.org/10.1007/978-94-007-7214-4_16), *Computational Kinematics*, 2013 (closed-form choices inside the feasible tension range).
