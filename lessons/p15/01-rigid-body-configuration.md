---
id: p15-l01
minutes: 30
summary: Before you can compute where a robot is, you need to know how many numbers it takes to say where it is. You derive Grubler's formula for the degrees of freedom of a mechanism, meet configuration space, code the formula and an independent rank test on the constraint Jacobian, and test both against mechanisms whose mobility is known, including a parallelogram linkage where the formula is wrong.
---

## Degrees of freedom

A rigid body in the plane needs 3 numbers to place it: $(x, y, \theta)$. In space it needs 6: a position and an orientation. A robot is a set of such bodies, the **links**, connected by **joints** that remove freedom. A revolute (pin) joint allows one rotation and removes 2 planar freedoms; a prismatic (slider) joint allows one translation and removes 2 as well.

The **configuration** of a robot is the position of every point on it, and the **degrees of freedom** (DOF) are the smallest number of real coordinates that describe it. The set of all configurations is the **configuration space** (C-space). For a 2-link arm it is a torus: two angles, each wrapping round.

## Grubler's formula

Count $N$ bodies including the fixed ground, $J$ joints, and let joint $i$ allow $f_i$ freedoms. Start with all moving bodies free, then subtract what each joint removes:

$$\text{DOF} = m(N - 1 - J) + \sum_{i=1}^{J} f_i, \qquad m = 3 \text{ (planar)}, \; m = 6 \text{ (spatial)}.$$

The formula assumes every constraint is independent. Special geometry can make some constraints redundant, and then the true mobility is higher than the count.

## An independent check: the constraint Jacobian

Write each moving body's pose as $q_k = (x_k, y_k, \theta_k)$. A pin joint between bodies $a$ and $b$ at world point $P$ says their copies of $P$ stay together: 2 equations. Linearise all constraints at the current pose to get $A\,\dot q = 0$. The mechanism can move instantaneously in every direction of the null space of $A$, so

$$\text{DOF} = 3(N - 1) - \operatorname{rank} A.$$

For a body in its reference pose, a point $P$ moves at $\dot P = (\dot x - \dot\theta P_y,\; \dot y + \dot\theta P_x)$, which gives each row of $A$ directly from the geometry. This test sees redundant constraints; Grubler's count doesn't.

:::figure widget=dofcount caption="Pick a mechanism and drive it with the slider. The counter compares Grubler's formula with the rank test at the drawn pose. The double parallelogram moves even though the formula says 0."
:::end

## Worked example

1. **Four-bar:** $N = 4$ (ground, crank, coupler, rocker), $J = 4$ pins: $3(4 - 1 - 4) + 4 = 1$. One motor drives it.
2. **Five-bar:** $N = 5$, $J = 5$: $3(-1) + 5 = 2$, the basis of two-motor planar parallel robots.
3. **Triangle truss:** $N = 3$, $J = 3$: $3(-1) + 3 = 0$. It is a structure.
4. **Stewart platform** (spatial): $N = 14$ (ground, top plate, two parts per leg), 6 universal joints ($f = 2$), 6 spherical ($f = 3$), 6 prismatic ($f = 1$): $6(14 - 1 - 18) + 36 = 6$.
5. **Double parallelogram:** a parallelogram four-bar plus a fifth bar parallel to the cranks: $N = 5$, $J = 6$, so $3(-2) + 6 = 0$. It moves anyway, because the extra bar's constraint repeats one that is already there. The rank test finds $\operatorname{rank} A = 11$, not 12, so DOF $= 12 - 11 = 1$.

## Code it from scratch

:::code file=dof.py
```python
import numpy as np

def grubler(n_links, joints, planar=True):
    """Grubler-Kutzbach mobility. n_links counts the ground; joints is a list of joint freedoms f_i."""
    m = 3 if planar else 6
    return m * (n_links - 1 - len(joints)) + sum(joints)

def rank(M, tol=1e-9):
    s = np.linalg.svd(M, compute_uv=False)
    return int(np.sum(s > tol * max(1.0, s[0]))) if len(s) else 0

def mobility_from_geometry(n_bodies, joints):
    """Planar check independent of Grubler: each moving body has (x, y, theta); body 0 is ground.
    joints: ('R', a, b, P) pin at world point P, or ('P', a, b, P, u) slider along unit direction u.
    Bodies sit in their reference pose, so the constraints hold; DOF = 3(n - 1) - rank(constraint Jacobian)."""
    nq = 3 * (n_bodies - 1); rows = []
    def blk(body, P):               # d(world position of body point P) / d(q_body)
        J = np.zeros((2, nq))
        if body > 0:
            k = 3 * (body - 1); J[:, k:k + 2] = np.eye(2); J[:, k + 2] = [-P[1], P[0]]
        return J
    for j in joints:
        kind, a, b, P = j[:4]
        D = blk(a, P) - blk(b, P)
        if kind == 'R':
            rows += [D[0], D[1]]
        else:
            u = np.array(j[4], float); n = np.array([-u[1], u[0]])
            rot = np.zeros(nq)
            if a > 0: rot[3 * (a - 1) + 2] += 1
            if b > 0: rot[3 * (b - 1) + 2] -= 1
            rows += [n @ D, rot]
    return nq - rank(np.array(rows))

# planar mechanisms: (bodies incl. ground, joints with geometry, Grubler joint list, known DOF)
MECH = {
    "four-bar": (4, [('R', 0, 1, (0, 0)), ('R', 1, 2, (0.3, 0.9)), ('R', 2, 3, (1.6, 1.1)), ('R', 3, 0, (2.0, 0))], 1),
    "slider-crank": (4, [('R', 0, 1, (0, 0)), ('R', 1, 2, (0.4, 0.5)), ('R', 2, 3, (1.8, 0)), ('P', 3, 0, (1.8, 0), (1, 0))], 1),
    "five-bar": (5, [('R', 0, 1, (0, 0)), ('R', 1, 2, (0.2, 1.0)), ('R', 2, 3, (1.1, 1.6)), ('R', 3, 4, (2.2, 1.0)), ('R', 4, 0, (2.4, 0))], 2),
    "triangle truss": (3, [('R', 0, 1, (0, 0)), ('R', 1, 2, (0.6, 1.0)), ('R', 2, 0, (1.2, 0))], 0),
    "3R serial arm": (4, [('R', 0, 1, (0, 0)), ('R', 1, 2, (1.0, 0.3)), ('R', 2, 3, (1.8, 0.6))], 3),
    "Watt six-bar": (6, [('R', 0, 1, (0, 0)), ('R', 1, 2, (0.3, 0.9)), ('R', 2, 3, (1.6, 1.1)), ('R', 3, 0, (2.0, 0)),
                               ('R', 2, 4, (0.9, 1.6)), ('R', 4, 5, (1.9, 2.1)), ('R', 5, 3, (2.3, 0.9))], 1),
}

def test_known_mechanisms():
    for name, (n, js, known) in MECH.items():
        g = grubler(n, [1] * len(js))
        r = mobility_from_geometry(n, js)
        print(f"{name:20s} Grubler {g:2d}  rank test {r:2d}  known {known}")
        assert g == known and r == known

def test_parallelogram_exception():
    # a parallelogram with a redundant middle bar: Grubler says 0, the special geometry still moves (1 DOF)
    js = [('R', 0, 1, (0, 0)), ('R', 1, 2, (0.5, 1.0)), ('R', 2, 3, (2.5, 1.0)), ('R', 3, 0, (2.0, 0)),
          ('R', 0, 4, (1.0, 0)), ('R', 4, 2, (1.5, 1.0))]
    g, r = grubler(5, [1] * 6), mobility_from_geometry(5, js)
    print(f"double parallelogram: Grubler {g}, rank test {r}")
    assert g == 0 and r == 1
    js[5] = ('R', 4, 2, (1.7, 1.0))            # break the parallel geometry: it locks
    assert mobility_from_geometry(5, js) == 0

def test_spatial():
    # Stewart platform: 14 bodies (ground, top, 6 x 2 leg parts), 6 U + 6 S + 6 P joints
    assert grubler(14, [2] * 6 + [3] * 6 + [1] * 6, planar=False) == 6
    # a 6R industrial arm
    assert grubler(7, [1] * 6, planar=False) == 6

test_known_mechanisms()
test_parallelogram_exception()
test_spatial()
print("PASS")
```
:::end

## Exercises

:::exercise
A planar 3R arm holds a pen on a sheet of paper. How many DOF does the arm have, and how many does the task use?
:::solution
The arm has 3 DOF. Placing a pen tip on paper uses 2 (its $x, y$). The spare one is **redundancy**: the arm can reach the same point with a family of elbow poses, which lesson 11 uses to avoid joint limits.
:::end

:::exercise
Why does the rank test say "at this pose"?
:::solution
The Jacobian depends on the geometry at that instant. At special poses (a four-bar with all links lined up, for example) the rank can drop and the mechanism gains an instantaneous freedom or locks. These are singular configurations, and the rest of the phase deals with them.
:::end

## Quiz

:::quiz
- type: num
  q: DOF of a planar four-bar linkage by Grubler's formula?
  answer: 1
  tol: 0.001
  py: "3*(4-1-4)+4"
  explain: One input angle sets the whole linkage.
- type: num
  q: DOF of a planar five-bar linkage?
  answer: 2
  tol: 0.001
  py: "3*(5-1-5)+5"
  explain: Two motors are needed.
- type: num
  q: DOF of a Stewart platform with 6 U, 6 S and 6 P joints and 14 bodies?
  answer: 6
  tol: 0.001
  py: "6*(14-1-18)+6*2+6*3+6*1"
  explain: A full 6-DOF parallel robot.
- type: num
  q: How many coordinates does a free rigid body need in space?
  answer: 6
  tol: 0.001
  py: "3+3"
  explain: Three for position, three for orientation.
- type: mc
  q: Grubler's formula gives 0 for the double parallelogram but it moves because…
  options:
    - one constraint is redundant for that special geometry
    - revolute joints have backlash
    - the formula is only for spatial mechanisms
    - the ground counts twice
  answer: 0
  explain: The rank of the constraint Jacobian is one less than the count assumes.
- type: mc
  q: The configuration space of a planar 2R arm with unlimited joints is…
  options:
    - a torus
    - a plane
    - a sphere
    - a line segment
  answer: 0
  explain: Two angles, each wrapping round.
:::end
