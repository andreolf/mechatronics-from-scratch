---
id: p15-l06
minutes: 40
summary: Inverse kinematics runs forward kinematics backwards, finding the joint angles that put the tool at a target, and for a planar arm the law of cosines gives the answer in closed form. You derive both elbow branches for the arm lab's 2-link arm, extend the method to a 3-link arm with a tool orientation, implement the lab's rule for picking a branch within the joint limits, and test that FK(IK(x)) returns x for every reachable target.
---

## The law of cosines

Forward kinematics (lesson 02) has a unique answer. Inverse kinematics (IK) can have none, one or several. For the [arm lab](#lab-arm)'s arm, the distance from base to target $r^2 = x^2 + y^2$ fixes the elbow angle through the triangle formed by the two links:

$$r^2 = \ell_1^2 + \ell_2^2 + 2\ell_1\ell_2\cos q_2 \quad\Rightarrow\quad c_2 = \cos q_2 = \frac{x^2 + y^2 - \ell_1^2 - \ell_2^2}{2\ell_1\ell_2}.$$

If $|c_2| > 1$ the target is out of reach. Otherwise $q_2 = \operatorname{atan2}(\pm\sqrt{1 - c_2^2},\, c_2)$: two **branches**, elbow up and elbow down. For each,

$$q_1 = \operatorname{atan2}(y, x) - \operatorname{atan2}(\ell_2\sin q_2,\; \ell_1 + \ell_2\cos q_2).$$

Always use `atan2`, never `acos` followed by `atan`, so every quadrant comes out right.

## Choosing a branch

The lab keeps the branches that are inside its joint limits ($0 \le q_1 \le 180°$, $|q_2| \le 135°$) and then takes the one nearest the current pose, so the arm doesn't flip its elbow mid-move. If neither branch is inside the limits, it flags the target.

## Adding a wrist: 3 links with orientation

Give the arm a third link $\ell_3$ and ask for the tool to point at angle $\phi$ as well. Step back from the target along $\phi$ to the wrist point $(x - \ell_3\cos\phi,\; y - \ell_3\sin\phi)$, solve the 2-link problem for it, then $q_3 = \phi - q_1 - q_2$. This is the planar version of lesson 05's wrist decomposition.

:::figure widget=ikbranches caption="Move the target and see both IK branches. Solid is the branch the lab would pick; dashed is the other one, drawn red when it breaks a joint limit. Move the target outside the ring and there is no solution."
:::end

## Worked example

Target $(1.2, 0.6)$ m:

1. $c_2 = (1.44 + 0.36 - 1 - 0.64)/1.6 = 0.1$, so $q_2 = \pm 84.26°$.
2. $\operatorname{atan2}(0.6, 1.2) = 26.57°$; $\operatorname{atan2}(0.8\sin 84.26°, 1 + 0.8 \times 0.1) = \operatorname{atan2}(0.796, 1.08) = 36.39°$.
3. Branch $q_2 = +84.26°$: $q_1 = 26.57° - 36.39° = -9.83°$, below the lab's $q_1 \ge 0$ limit.
4. Branch $q_2 = -84.26°$: $q_1 = 26.57° + 36.39° = 62.96°$, inside the limits, so the lab uses it.

## Code it from scratch

:::code file=ik_analytic.py
```python
import numpy as np

L1, L2 = 1.0, 0.8                          # the arm lab's links (m)
Q1_LIM, Q2_LIM = (0.0, np.pi), (-np.radians(135), np.radians(135))

def fk2(q1, q2, l1=L1, l2=L2):
    return np.array([l1 * np.cos(q1) + l2 * np.cos(q1 + q2), l1 * np.sin(q1) + l2 * np.sin(q1 + q2)])

def ik2(x, y, l1=L1, l2=L2):
    """both closed-form solutions [(q1, q2) with q2 >= 0, (q1, q2) with q2 <= 0], or [] if out of reach"""
    c2 = (x * x + y * y - l1 * l1 - l2 * l2) / (2 * l1 * l2)       # law of cosines
    if abs(c2) > 1 + 1e-12: return []
    c2 = np.clip(c2, -1, 1); sols = []
    for s2 in (np.sqrt(1 - c2 * c2), -np.sqrt(1 - c2 * c2)):
        q2 = np.arctan2(s2, c2)
        q1 = np.arctan2(y, x) - np.arctan2(l2 * s2, l1 + l2 * c2)
        sols.append((np.arctan2(np.sin(q1), np.cos(q1)), q2))
    return sols

def in_limits(q): return Q1_LIM[0] <= q[0] <= Q1_LIM[1] and Q2_LIM[0] <= q[1] <= Q2_LIM[1]

def pick(sols, current):
    """what the lab does: keep the solutions inside the joint limits, then take the one nearest the current pose"""
    ok = [s for s in sols if in_limits(s)] or sols
    return min(ok, key=lambda s: np.hypot(s[0] - current[0], s[1] - current[1])) if ok else None

L3 = 0.3   # an illustrative third link for the orientation version
def fk3(q, l=(L1, L2, L3)):
    a = np.cumsum(q); return np.array([np.dot(l, np.cos(a)), np.dot(l, np.sin(a)), a[-1]])

def ik3(x, y, phi, l=(L1, L2, L3)):
    """3-link planar arm, tool at (x, y) pointing at angle phi: solve the wrist point with ik2, then q3"""
    wx, wy = x - l[2] * np.cos(phi), y - l[2] * np.sin(phi)
    return [(q1, q2, np.arctan2(np.sin(phi - q1 - q2), np.cos(phi - q1 - q2))) for q1, q2 in ik2(wx, wy, l[0], l[1])]

def test_round_trip_2link():
    rng = np.random.default_rng(8); n = 0
    for x, y in rng.uniform(-2, 2, (3000, 2)):
        sols, r = ik2(x, y), np.hypot(x, y)
        if L1 - L2 + 1e-9 < r < L1 + L2 - 1e-9:
            assert len(sols) == 2; n += 1
            for q in sols: assert np.allclose(fk2(*q), [x, y], atol=1e-9)
        elif r > L1 + L2 + 1e-9 or r < L1 - L2 - 1e-9:
            assert sols == []
    print(f"{n} reachable targets, both branches satisfy FK(IK(x)) = x")

def test_round_trip_3link():
    rng = np.random.default_rng(9)
    for q in rng.uniform(-np.pi, np.pi, (500, 3)):
        x, y, phi = fk3(q)
        for s in ik3(x, y, phi):
            p = fk3(np.array(s)); assert np.allclose(p[:2], [x, y], atol=1e-9) and abs(np.sin(p[2] - phi)) < 1e-9

def test_worked_example():
    sols = ik2(1.2, 0.6)
    for q1, q2 in sols: print(f"q1 = {np.degrees(q1):7.2f} deg, q2 = {np.degrees(q2):7.2f} deg, in limits: {in_limits((q1, q2))}")
    assert abs(np.degrees(sols[0][1]) - 84.26) < 0.01 and not in_limits(sols[0]) and in_limits(sols[1])
    assert pick(sols, (np.radians(60), np.radians(-70))) == sols[1]

test_round_trip_2link()
test_round_trip_3link()
test_worked_example()
print("PASS")
```
:::end

## Exercises

:::exercise
At the outer edge of the workspace, how many IK solutions are there?
:::solution
One. With $c_2 = 1$ the two branches meet at $q_2 = 0$, the fully stretched arm. Right at the edge the two solutions merge, which is the singularity lesson 08 deals with.
:::end

:::exercise
How many solutions does a 3-link planar arm have for a position-only target (no orientation)?
:::solution
Infinitely many: three joints for two numbers leave one free parameter. Pick $\phi$ freely and solve as above, giving a one-parameter family of poses. That redundancy is the topic of lesson 11.
:::end

## Quiz

:::quiz
- type: num
  q: cos q2 for the lab arm reaching (1.2, 0.6)?
  answer: 0.1
  tol: 0.001
  py: "(1.2**2+0.6**2-1-0.64)/(2*0.8)"
  explain: Law of cosines.
- type: num
  q: Elbow angle magnitude for that target?
  answer: 84.26
  tol: 0.001
  unit: °
  py: "math.degrees(math.acos(0.1))"
  explain: Either sign.
- type: num
  q: q1 of the branch the lab picks for (1.2, 0.6)?
  answer: 62.96
  tol: 0.002
  unit: °
  py: "math.degrees(math.atan2(0.6,1.2)+math.atan2(0.8*math.sin(math.acos(0.1)),1+0.08))"
  explain: The elbow-up branch, inside the limits.
- type: num
  q: How many IK solutions for a target strictly inside the annulus?
  answer: 2
  tol: 0.001
  py: "2"
  explain: Elbow up and elbow down.
- type: mc
  q: Why use atan2 rather than atan?
  options:
    - it keeps the quadrant from the signs of both arguments
    - it is faster
    - it avoids the law of cosines
    - atan is undefined for negative numbers
  answer: 0
  explain: atan alone loses half the circle.
- type: mc
  q: For a 3-link arm with tool orientation φ, you first solve…
  options:
    - the wrist point x − l3 cos φ, y − l3 sin φ with the 2-link formula
    - q3 from the law of cosines
    - the Jacobian
    - q1 = φ
  answer: 0
  explain: The planar wrist decomposition.
:::end
