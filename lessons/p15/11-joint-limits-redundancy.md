---
id: p15-l11
minutes: 40
summary: A robot with more joints than its task needs has a family of poses for every target, and the extra freedom can be spent on a second goal without disturbing the first. You derive the null-space projector I minus J plus J, use it to push joints away from their limits while the tool tracks a circle, see the arm lab's joint limits make some targets unreachable, and test that the limits are respected only when the null-space term is on.
---

## Spare degrees of freedom

The 3-link planar arm reaching a 2-D point (lesson 07) has one more joint than it needs. Every solution of $J\dot q = v$ can be written

$$\dot q = J^+v + (I - J^+J)\,z,$$

for any vector $z$. The matrix $N = I - J^+J$ projects onto the **null space** of $J$: joint motions that don't move the tool at all ($JN = 0$). For this arm $N$ has rank 1, one spare direction: the elbow swinging while the tool stays put, like your own elbow when your hand is on a table.

## A secondary goal

Choose $z$ to descend a cost you'd like small. For joint limits, a standard cost is

$$H(q) = \sum_i\left(\frac{q_i - \bar q_i}{q_{i,max} - q_{i,min}}\right)^2,$$

zero when every joint is mid-range. Use $z = -k_0\nabla H$ and the arm drifts away from its limits through the null space, while the first term keeps the tool on track. If the two goals conflict, the tool wins, because the projector removes any part of $z$ that would move it.

## When limits make targets unreachable

The [arm lab](#lab-arm)'s 2-link arm has no spare joint. With its limits on ($0 \le q_1 \le 180°$, $|q_2| \le 135°$), some points inside the annulus can only be reached by a branch that breaks a limit (lesson 06), and the lab flags them. The 3-link arm's null space is how a redundant robot keeps more of its workspace usable.

:::figure widget=nullspace caption="A 3-link arm with joint limits tracks a circle. Without the null-space term the elbow drifts past its 135 degree limit; switch the term on and the arm reconfigures itself to stay inside every limit while the tool follows the same circle."
:::end

## Worked example

An illustrative arm with links (1.0, 0.8, 0.5) m and limits $q_1 \in [0°, 180°]$, $q_2 \in [-135°, 135°]$, $q_3 \in [-60°, 60°]$. The tool tracks a circle of radius 0.4 m centred at (1.2, 0.5) m every 4 s, using resolved-rate control with feedback gain 20:

1. Pseudo-inverse only: the minimum-norm solution doesn't care about limits, and $q_2$ swings between $-96°$ and $-149°$: 14° past the elbow limit.
2. With the null-space term, $k_0 = 10$: $q_2$ stays between $-83°$ and $-131°$, and every joint keeps at least 3.9° from its limits.
3. The tracking error is the same with and without the term (under 1 mm, set by the 1 ms integration step), confirming that the null-space motion is invisible at the tool.

## Code it from scratch

:::code file=redundancy.py
```python
import numpy as np

L = np.array([1.0, 0.8, 0.5])                                 # illustrative 3-link planar arm (m)
LIM = np.radians([[0, 180], [-135, 135], [-60, 60]])          # joint limits
MID, RNG = LIM.mean(axis=1), LIM[:, 1] - LIM[:, 0]

def fk(q): a = np.cumsum(q); return np.array([L @ np.cos(a), L @ np.sin(a)])
def jac(q):
    a = np.cumsum(q)
    return np.array([[-(L[j:] @ np.sin(a[j:])) for j in range(3)], [L[j:] @ np.cos(a[j:]) for j in range(3)]])

def limit_cost_grad(q):
    """H = sum ((q - mid) / range)^2 is smallest mid-range; its gradient pushes joints away from their limits"""
    return 2 * (q - MID) / RNG ** 2

def track_circle(null_gain, T=8.0, dt=1e-3, k=20.0, centre=(1.2, 0.5), radius=0.4, period=4.0):
    q = np.radians([70.0, -80.0, 40.0])
    x_start = np.array(centre) + [radius, 0]
    for _ in range(200):                                        # start on the circle (pseudo-inverse IK)
        q += np.linalg.pinv(jac(q)) @ (x_start - fk(q))
    worst_margin, errs, qs = np.inf, [], []
    for i in range(int(T / dt)):
        w = 2 * np.pi / period; t = i * dt
        xd = np.array(centre) + radius * np.array([np.cos(w * t), np.sin(w * t)])
        vd = radius * w * np.array([-np.sin(w * t), np.cos(w * t)])
        J = jac(q); Jp = np.linalg.pinv(J); N = np.eye(3) - Jp @ J
        qd = Jp @ (vd + k * (xd - fk(q))) + N @ (-null_gain * limit_cost_grad(q))
        q = q + dt * qd
        worst_margin = min(worst_margin, np.min(np.minimum(q - LIM[:, 0], LIM[:, 1] - q)))
        errs.append(np.linalg.norm(xd - fk(q))); qs.append(q.copy())
    return np.degrees(worst_margin), np.array(errs), np.array(qs)

def test_null_space_keeps_limits():
    m0, e0, q0 = track_circle(0.0)
    m1, e1, q1 = track_circle(10.0)
    print(f"pseudo-inverse only : worst limit margin {m0:7.2f} deg (negative = limit broken), q2 range {np.degrees(q0[:, 1].min()):.1f} to {np.degrees(q0[:, 1].max()):.1f} deg")
    print(f"with null-space term: worst limit margin {m1:7.2f} deg, q2 range {np.degrees(q1[:, 1].min()):.1f} to {np.degrees(q1[:, 1].max()):.1f} deg")
    print(f"tracking error after 1 s: {e0[1000:].max() * 1000:.3f} mm and {e1[1000:].max() * 1000:.3f} mm")
    assert m0 < 0 and m1 > 0                                  # limits respected only with the null-space term
    assert e1[1000:].max() < 1e-3                              # and the tool still tracks the circle

def test_null_space_motion_is_invisible():
    rng = np.random.default_rng(14)
    for q in rng.uniform(-2, 2, (100, 3)):
        J = jac(q); N = np.eye(3) - np.linalg.pinv(J) @ J
        assert np.allclose(J @ N @ rng.normal(size=3), 0, atol=1e-12)
        assert np.linalg.matrix_rank(N, tol=1e-9) == 1        # one spare degree of freedom

test_null_space_motion_is_invisible()
test_null_space_keeps_limits()
print("PASS")
```
:::end

## Exercises

:::exercise
Name two other useful secondary goals for the null space.
:::solution
Keep away from singularities (climb the manipulability $w$ of lesson 09), avoid an obstacle with the elbow, minimise the gravity torques, or hold a posture that looks natural to people nearby. Several can be stacked in priority order, each projected into the null space of those above it.
:::end

:::exercise
Why does a pure pseudo-inverse controller drift in joint space even when the tool returns to the same point each lap?
:::solution
The minimum-norm solution is not integrable: following $\dot q = J^+v$ round a closed path in task space doesn't generally return to the same joint angles. Each lap leaves the arm in a slightly different elbow pose. The null-space term fixes this by pulling every lap towards the same preferred posture.
:::end

## Quiz

:::quiz
- type: num
  q: Rank of the null-space projector for a 3-link planar arm with a 2-D position task (away from singularities)?
  answer: 1
  tol: 0.001
  py: "3-2"
  explain: Joints minus task dimensions.
- type: num
  q: Number of spare degrees of freedom for a 7-joint arm doing a full 6-D pose task?
  answer: 1
  tol: 0.001
  py: "7-6"
  explain: Like the human arm's elbow swivel.
- type: num
  q: H contribution of a joint at its limit (|q − mid| = half the range)?
  answer: 0.25
  tol: 0.001
  py: "0.5**2"
  explain: ((range/2)/range)².
- type: num
  q: In the worked example, by how many degrees did the pseudo-inverse break the elbow limit?
  answer: 13.7
  tol: 0.01
  unit: °
  py: "148.7-135"
  explain: q2 reached −148.7°.
- type: mc
  q: J (I − J⁺J) equals…
  options:
    - zero
    - the identity
    - J
    - J⁺
  answer: 0
  explain: Null-space motions don't move the tool.
- type: mc
  q: If the secondary goal conflicts with the tool task…
  options:
    - the tool task wins, because the projector removes the conflicting part
    - the secondary goal wins
    - the arm stops
    - they average
  answer: 0
  explain: Strict priority.
:::end
