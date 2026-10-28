---
id: p21-l02
minutes: 40
summary: Inverse kinematics of a four-cable robot is one line per cable, a distance. You derive it, differentiate it into the Jacobian that turns gripper velocity into winch speeds, and invert it the other way with a closed form for anchors at one height and Gauss-Newton for the general case.
---

## Inverse kinematics is a distance

Call the anchor points $\mathbf a_1 \dots \mathbf a_4$ and the pivot, where the four lines meet, $\mathbf p$. If each line runs straight from its anchor to the pivot, its length is

$$ l_i = \lVert \mathbf a_i - \mathbf p \rVert . $$

That is the whole inverse kinematics. Compare it with the trigonometry of a two-link arm in Phase 15: a parallel robot is easy in this direction and hard in the other, a serial arm the other way round.

Two details make real machines messier, and they are worth knowing before you trust the formula:

- **The gripper is not the pivot.** Stringman's gripper hangs on a pole 50 cm below the point where the lines meet. When it hangs still, $\mathbf p = \mathbf g + l_\text{pole}\,\hat{\mathbf z}$, so you command the pivot 0.5 m above where you want the fingers. Stringman's own agent guide says exactly this: aim the gantry at the point plus the pole offset.
- **A line does not start at a fixed point.** It leaves a pulley or eyelet whose contact point moves a little as the angle changes, and some of the line sits between the spool and that eyelet. Stringman's MuJoCo model, for example, treats each slider as the *free span* from the last eyelet to the gantry, and adds a fixed cross-room run of about 6 m for the two lines that are redirected through passive eyelets. For a room-sized robot, the pulley-radius correction is millimetres; at desk scale it is not, and Lesson 6 calibrates it away.

## The Jacobian: from gripper speed to winch speed

Differentiate $l_i^2 = (\mathbf a_i - \mathbf p)\cdot(\mathbf a_i - \mathbf p)$:

$$ 2 l_i \dot l_i = -2 (\mathbf a_i - \mathbf p)\cdot \dot{\mathbf p} \quad\Rightarrow\quad \dot l_i = -\mathbf u_i \cdot \dot{\mathbf p}, \qquad \mathbf u_i = \frac{\mathbf a_i - \mathbf p}{l_i}. $$

Stack the rows and you have $\dot{\mathbf l} = J \dot{\mathbf p}$ with $J = -[\mathbf u_1 \dots \mathbf u_4]^\mathsf{T}$, a 4 × 3 matrix. Each row is minus the unit vector pointing up the line. Moving straight towards an anchor shortens that line at full speed; moving across it barely changes it.

The same unit vectors appear in the statics (Lesson 3): the cables push on the pivot with force $\sum_i t_i \mathbf u_i = -J^\mathsf{T}\mathbf t$. That is the kinetostatic duality you met for arms, with the transpose of the same Jacobian.

## Forward kinematics, two ways

Given four measured lengths, where is the pivot? Four equations, three unknowns, and in general they will not quite agree.

**Closed form when the anchors share a height.** Subtract the sphere equation of line 1 from that of line $i$:

$$ 2(\mathbf a_1 - \mathbf a_i)\cdot \mathbf p = l_i^2 - l_1^2 - \lVert\mathbf a_i\rVert^2 + \lVert \mathbf a_1\rVert^2, \qquad i = 2, 3, 4 . $$

With all anchors at the same height $h$, the left side has no $z$ in it: three linear equations in $x$ and $y$, solved by least squares. Then $z = h - \sqrt{l_1^2 - (x - a_{1x})^2 - (y - a_{1y})^2}$, taking the root below the ceiling.

**Gauss-Newton in general.** Minimise $\sum_i (\lVert \mathbf a_i - \mathbf p\rVert - l_i)^2$. The residual Jacobian is the $J$ above, so each step solves $J\,\Delta\mathbf p = -\mathbf r$ in the least-squares sense. It converges in a handful of iterations from any sensible start, and the size of the final residual tells you whether the lengths are consistent: a slack or slipped line shows up as a residual of centimetres instead of micrometres.

:::figure widget=cablebot args={"preset":"ik"} caption="Inverse kinematics live. The bars show each line’s length under its tension. Switch off Auto tour and drag the target, or use the sliders: moving towards an anchor shortens that line one for one."
:::end

## Worked example

Stringman's example room, 7 × 7 × 3 m, anchors at the top corners numbered anticlockwise from $(-3.5, -3.5, 3)$. Put the gripper at $(1.0, -0.5, 0.4)$ m, so the pivot is at $(1.0, -0.5, 0.9)$ m.

1. Lengths: $l = (5.802, 4.434, 5.163, 6.377)$ m. Line 2, the anchor at $(3.5, -3.5)$, is shortest because the pivot is in its quarter of the room.
2. Move at 0.4 m/s in $+x$. The winch speeds are $J\dot{\mathbf p} = (0.310, -0.226, -0.194, 0.282)$ m/s: lines 1 and 4 pay out, lines 2 and 3 reel in, and none exceeds the gripper's own speed.
3. Lift at 0.4 m/s instead: every line shortens, by $(0.145, 0.189, 0.163, 0.132)$ m/s. Vertical motion near the floor is cheap in winch speed because the lines are shallow; the same lift near the ceiling would need much more.
4. Round trip: feed the four lengths back into either forward solver and you get $(1.0, -0.5, 0.9)$ back to better than a micrometre.

## Code it from scratch

:::code file=cdpr_ik.py
```python
import numpy as np

W, D, H, POLE = 7.0, 7.0, 3.0, 0.5
A = np.array([[-W/2, -D/2, H], [W/2, -D/2, H], [W/2, D/2, H], [-W/2, D/2, H]])

def ik(p):
    """cable lengths and unit vectors from the pivot towards each anchor"""
    v = A - p
    L = np.linalg.norm(v, axis=1)
    return L, v / L[:, None]

def jacobian(p):
    """dl/dp, 4 x 3: row i is -u_i"""
    _, u = ik(p)
    return -u

def fk_closed_form(L):
    """anchors at one height: three linear equations in x, y, then z from one sphere"""
    M = 2 * (A[0, :2] - A[1:, :2])
    b = L[1:]**2 - L[0]**2 - (A[1:]**2).sum(1) + (A[0]**2).sum()
    xy, *_ = np.linalg.lstsq(M, b, rcond=None)
    z = A[0, 2] - np.sqrt(L[0]**2 - ((xy - A[0, :2])**2).sum())
    return np.array([xy[0], xy[1], z])

def fk_gauss_newton(L, p0=(0.0, 0.0, 1.0), iters=20):
    p = np.array(p0, float)
    for _ in range(iters):
        Lp, _ = ik(p)
        r = Lp - L
        step, *_ = np.linalg.lstsq(jacobian(p), -r, rcond=None)
        p += step
        if np.linalg.norm(step) < 1e-12:
            break
    return p, np.linalg.norm(ik(p)[0] - L)

gripper = np.array([1.0, -0.5, 0.4])
p = gripper + [0, 0, POLE]
L, u = ik(p)
print("lengths (m):", np.round(L, 3))
assert np.allclose(L, [5.802, 4.434, 5.163, 6.377], atol=5e-4)

# Jacobian against central finite differences
J, eps = jacobian(p), 1e-6
Jfd = np.column_stack([(ik(p + eps * e)[0] - ik(p - eps * e)[0]) / (2 * eps) for e in np.eye(3)])
assert np.allclose(J, Jfd, atol=1e-8)
print("winch speeds for 0.4 m/s in +x:", np.round(J @ [0.4, 0, 0], 3))
print("winch speeds for 0.4 m/s up:   ", np.round(J @ [0, 0, 0.4], 3))
assert np.all(np.abs(J @ [0.4, 0, 0]) <= 0.4 + 1e-12)      # |u_i . v| <= |v|

# forward kinematics both ways, at many random poses
rng = np.random.default_rng(1)
for _ in range(500):
    q = np.array([rng.uniform(-3.3, 3.3), rng.uniform(-3.3, 3.3), rng.uniform(0.3, 2.8)])
    Lq, _ = ik(q)
    assert np.linalg.norm(fk_closed_form(Lq) - q) < 1e-9
    pg, res = fk_gauss_newton(Lq)
    assert np.linalg.norm(pg - q) < 1e-9 and res < 1e-9
print("FK(IK(p)) = p at 500 random poses, closed form and Gauss-Newton")

# a line that has slipped by 3 cm no longer agrees with the other three
bad = L.copy(); bad[2] += 0.03
_, res = fk_gauss_newton(bad, p0=p)
print(f"residual with one line 3 cm long: {res * 1000:.1f} mm")
assert res > 0.005
print("PASS")
```
:::end

## In practice

The forward solver earns its keep at start-up and after anything goes wrong. A robot that wakes up with four encoder counts but no idea where it is can solve for its pose from the lengths, but only if the counts still mean what they meant before. If a line slipped on its spool or someone pulled it, the Gauss-Newton residual jumps, and the right reaction is to stop and recalibrate rather than drive on a pose that cannot exist. Stringman's quick calibration does a version of this, using its cameras to reset the line-length counters.

## Exercises

:::exercise
At the centre of the room, at what height does lifting the pivot at 0.4 m/s require each line to reel in at 0.2 m/s?
:::solution
At the centre, $\dot l_i = -0.4 \sin\theta$ with $\sin\theta = (3 - z)/l$ and $l = \sqrt{24.5 + (3 - z)^2}$. Setting $\sin\theta = 0.5$ gives $(3 - z)^2 = 0.25\,(24.5 + (3-z)^2)$, so $(3 - z)^2 = 8.17$, $3 - z = 2.858$ and $z = 0.142$ m. Above that height the lines are steeper and reel in faster than 0.2 m/s; below it, slower. With Stringman's 0.5 m pole the pivot never gets that low, since the gripper would be under the floor, so a 0.4 m/s lift always needs more than 0.2 m/s from every winch.
:::end

:::exercise
Why does the closed-form FK need only three of the four lines for $x$ and $y$, and what is the fourth line good for?
:::solution
Any two independent differences of sphere equations fix $x$ and $y$; three give a least-squares estimate. The redundant line is a consistency check: with good lengths all four agree to micrometres, and when one has slipped the residual shows which one disagrees.
:::end

## Quiz

:::quiz
- type: num
  q: Length of line 2 from anchor (3.5, −3.5, 3) to a pivot at (1.0, −0.5, 0.9) (m)?
  answer: 4.434
  tol: 0.001
  py: "math.dist((3.5,-3.5,3),(1.0,-0.5,0.9))"
  explain: The straight-line distance.
- type: num
  q: Rate of change of that line when the pivot moves at 0.4 m/s in +x (m/s)?
  answer: -0.2255
  tol: 0.005
  py: "0.4*(1.0-3.5)/math.dist((3.5,-3.5,3),(1.0,-0.5,0.9))"
  explain: −u·v, with the x component of (p − a)/l equal to −2.5/4.434.
- type: mc
  q: What is row i of the length Jacobian dl/dp?
  options: ["Minus the unit vector from the pivot to anchor i", "The anchor position", "The cable tension", "The cross product of two cable directions"]
  answer: 0
  explain: Differentiating the distance gives −u_iᵀ.
- type: mc
  q: You want Stringman's fingers at a point on the floor. Where do you aim the pivot?
  options: ["0.5 m above the point", "At the point", "0.5 m below the point", "At the nearest anchor"]
  answer: 0
  explain: The gripper hangs on a 50 cm pole below the pivot.
- type: mc
  q: The forward-kinematics residual jumps to several centimetres. What is the most likely cause?
  options: ["A line has slipped or gone slack, so the lengths no longer agree", "The robot is at the centre", "Gauss-Newton always does that", "The anchors are too high"]
  answer: 0
  explain: Consistent lengths leave micrometre residuals.
- type: num
  q: At the room centre, height where lifting at 0.4 m/s needs 0.2 m/s of winch speed per line (m)?
  answer: 0.142
  tol: 0.01
  py: "3-math.sqrt(24.5/3)"
  explain: sinθ = 1/2 means (3 − z)² = 24.5/3.
:::end

:::verify
import numpy as np, math
A = np.array([[-3.5,-3.5,3],[3.5,-3.5,3],[3.5,3.5,3],[-3.5,3.5,3]]); p = np.array([1.0,-0.5,0.9])
L = np.linalg.norm(A-p, axis=1); assert np.allclose(L, [5.802,4.434,5.163,6.377], atol=5e-4)
J = (p-A)/L[:,None]
assert np.allclose(J@[0.4,0,0], [0.310,-0.226,-0.194,0.282], atol=6e-4)
assert np.allclose(-(J@[0,0,0.4]), [0.145,0.189,0.163,0.132], atol=6e-4)
assert abs((3-math.sqrt(24.5/3)) - 0.142) < 6e-4 and abs(24.5/3 - 8.17) < 0.005 and abs(math.sqrt(24.5/3) - 2.858) < 6e-4
:::end

## Sources

- Neufangled, [Stringman tech specs](https://neufangled.com/) (pole 50 cm below the pivot) and the Stringman [agent guide](https://github.com/nhnifong/cranebot3-firmware/blob/main/src/nf_robot/host/mcp_bridge/GUIDE.md) (aim the gantry at the point plus the pole offset).
- Stringman [simulator README](https://github.com/nhnifong/cranebot3-firmware/tree/main/simulator) (free span from the last eyelet; fixed cross-room run of the indirect lines), Apache-2.0.
- Neufangled, [usage guide](https://neufangled.com/docs/usage_guide/) (quick calibration resets the line-length counters from visual observation).
- A. Pott, [*Cable-Driven Parallel Robots: Theory and Application*](https://doi.org/10.1007/978-3-319-76138-1), Springer, 2018 (kinematics and pulley models).
