---
id: p15-l07
minutes: 40
summary: When no closed form exists, inverse kinematics becomes root finding, and Newton's method with the Jacobian pseudo-inverse solves it for any chain. You derive the Newton step from a first-order expansion of forward kinematics, build the planar Jacobian, implement the iteration with a step cap, and test that it converges within 20 iterations for 500 random reachable targets on the arm lab's arm and on a redundant 3-link arm.
---

## IK as root finding

Write the IK problem as $f(q) = x_d - \mathrm{FK}(q) = 0$. Near the current guess, forward kinematics is linear in the joint change:

$$\mathrm{FK}(q + \Delta q) \approx \mathrm{FK}(q) + J(q)\,\Delta q, \qquad J = \frac{\partial\,\mathrm{FK}}{\partial q}.$$

Setting this equal to the target gives $J\,\Delta q = e$ with $e = x_d - \mathrm{FK}(q)$. Solve, update $q \leftarrow q + \Delta q$, repeat. This is Newton-Raphson, and near the answer the error roughly squares at each step.

## The pseudo-inverse

$J$ is square only when the number of joints matches the task. For a 3-link arm reaching a 2-D point, $J$ is $2 \times 3$ and $J\,\Delta q = e$ has infinitely many solutions. The **Moore-Penrose pseudo-inverse** picks the smallest:

$$\Delta q = J^+ e, \qquad J^+ = J^T(JJ^T)^{-1} \text{ (full row rank)}.$$

Any other solution is $J^+e + (I - J^+J)z$, with a null-space motion added that doesn't move the tool. Lesson 11 uses that freedom.

## The planar Jacobian

With absolute link angles $a_k = q_1 + \cdots + q_k$, column $j$ of $J$ is the tool velocity when only joint $j$ turns:

$$J_{1j} = -\sum_{k \ge j}\ell_k\sin a_k, \qquad J_{2j} = \sum_{k \ge j}\ell_k\cos a_k.$$

A full Newton step can overshoot badly when $J$ is nearly singular, so the code caps the step at 0.5 rad. The [arm lab](#lab-arm) uses the same iteration in its damped form (lesson 08).

:::figure widget=newtonik caption="Newton iterations converging on the target: each faint arm is one iterate. The lower plot shows the error on a log scale. Watch it drop slowly at first, then square at each step."
:::end

## Worked example

Lab arm from the start pose $(60°, -70°)$ to the target $(1.2, 0.6)$ m:

1. The start tool position is $(1.288, 0.727)$, an error of 0.15 m.
2. The errors after each iteration are 0.15, 0.018, $1.5 \times 10^{-4}$, $1.3 \times 10^{-8}$ and $2 \times 10^{-16}$ m: done in 4 steps, the error squaring each time.
3. It lands on $q_1 = 62.96°$, the lesson 06 branch nearest the start.
4. Over 500 random reachable targets, the median is 8 iterations and the worst 14 (lab arm) or 16 (3-link arm).

## Code it from scratch

:::code file=ik_newton.py
```python
import numpy as np

def fk(q, l):
    a = np.cumsum(q); return np.array([np.dot(l, np.cos(a)), np.dot(l, np.sin(a))])

def jacobian(q, l):
    """d(tool x, y)/dq for a planar chain: column j sums the links from joint j outwards"""
    a = np.cumsum(q); J = np.zeros((2, len(q)))
    for j in range(len(q)):
        J[0, j] = -np.dot(l[j:], np.sin(a[j:])); J[1, j] = np.dot(l[j:], np.cos(a[j:]))
    return J

def ik_newton(target, q0, l, tol=1e-9, max_iter=20, max_step=0.5):
    """Newton-Raphson on FK(q) = target with the pseudo-inverse; the step is capped at max_step rad"""
    q = np.array(q0, float); hist = []
    for k in range(max_iter):
        e = target - fk(q, l); hist.append(np.linalg.norm(e))
        if hist[-1] < tol: return q, k, hist
        dq = np.linalg.pinv(jacobian(q, l)) @ e
        n = np.linalg.norm(dq)
        q += dq if n <= max_step else dq * max_step / n
    e = target - fk(q, l); hist.append(np.linalg.norm(e))
    return q, (max_iter if hist[-1] < tol else None), hist

LAB = np.array([1.0, 0.8]); START = np.radians([60, -70])     # the arm lab's links and start pose
ARM3 = np.array([1.0, 0.8, 0.3])

def test_jacobian_numeric():
    rng = np.random.default_rng(10)
    for q in rng.uniform(-np.pi, np.pi, (50, 3)):
        Jn = np.column_stack([(fk(q + h, ARM3) - fk(q - h, ARM3)) / 2e-6 for h in np.eye(3) * 1e-6])
        assert np.allclose(jacobian(q, ARM3), Jn, atol=1e-8)

def test_converges_in_20():
    rng = np.random.default_rng(11)
    for l, q0, name in ((LAB, START, "lab 2-link arm"), (ARM3, np.radians([60, -70, 20]), "3-link arm")):
        iters = []
        for _ in range(500):
            r, a = rng.uniform(abs(l[0] - l[1:].sum()) + 0.05 if len(l) == 2 else 0.3, l.sum() - 0.05), rng.uniform(0, np.pi)
            target = r * np.array([np.cos(a), np.sin(a)])
            q, k, _ = ik_newton(target, q0, l)
            assert k is not None and np.linalg.norm(fk(q, l) - target) < 1e-9
            iters.append(k)
        print(f"{name}: 500 targets, iterations median {np.median(iters):.0f}, max {max(iters)}")
        assert max(iters) <= 20

def test_quadratic_convergence():
    q, k, h = ik_newton(np.array([1.2, 0.6]), START, LAB)
    print("error per iteration (m):", " ".join(f"{e:.1e}" for e in h))
    assert all(h[i + 1] < 3 * h[i] ** 2 / h[0] + 1e-12 for i in range(1, len(h) - 1))   # error roughly squares
    assert abs(np.degrees(q[0]) - 62.96) < 0.01      # lands on the lesson 06 branch nearest the start

def test_redundant_minimum_norm_step():
    q = np.radians([60, -70, 20]); J = jacobian(q, ARM3); e = np.array([0.01, -0.02])
    dq = np.linalg.pinv(J) @ e
    N = np.eye(3) - np.linalg.pinv(J) @ J                 # adding a null-space motion keeps J dq the same
    other = dq + N @ np.array([0.3, -0.1, 0.2])
    assert np.allclose(J @ other, e) and np.linalg.norm(dq) < np.linalg.norm(other)

test_jacobian_numeric()
test_converges_in_20()
test_quadratic_convergence()
test_redundant_minimum_norm_step()
print("PASS")
```
:::end

## Exercises

:::exercise
Newton IK lands on one branch. Which one, and how could you get the other?
:::solution
Usually the branch nearest the starting guess, because each step follows the local linearisation. To find the other, start from a guess with the opposite sign of $q_2$. For arms with many solutions, a few random restarts is the practical approach.
:::end

:::exercise
Why is gradient descent on $\tfrac12\|e\|^2$, $\Delta q = \alpha J^Te$, slower than Newton?
:::solution
It moves along $J^Te$, which ignores how strongly each direction couples to the error, so it converges linearly at a rate set by the conditioning of $J^TJ$. Newton rescales by $(JJ^T)^{-1}$ and converges quadratically near the solution. On the other hand, $J^T$ stays bounded at singularities, which is the idea damped least squares builds on.
:::end

## Quiz

:::quiz
- type: num
  q: How many rows does the Jacobian of a 3-link planar arm have for a 2-D position target?
  answer: 2
  tol: 0.001
  py: "2"
  explain: Two task coordinates, three joints.
- type: num
  q: J₂₂ (∂y/∂q2) for the lab arm at q = (90°, 0°)?
  answer: 0
  tol: 0.001
  py: "round(0.8*math.cos(math.pi/2), 9)"
  explain: Link 2 points straight up, so the elbow moves the tool sideways.
- type: num
  q: In the worked example the error fell from 0.018 m to 1.5e-4 m in one step. By what factor?
  answer: 120
  tol: 0.001
  py: "0.018/1.5e-4"
  explain: Near the answer each step multiplies the number of correct digits, roughly doubling it.
- type: num
  q: Determinant of J for the lab arm at q2 = 90°?
  answer: 0.8
  tol: 0.001
  py: "1.0*0.8*math.sin(math.pi/2)"
  explain: det J = l1 l2 sin q2.
- type: mc
  q: The pseudo-inverse step for a redundant arm is…
  options:
    - the smallest joint change that achieves J dq = e
    - the largest
    - always zero in the null space of J transposed
    - undefined
  answer: 0
  explain: Minimum norm.
- type: mc
  q: Why cap the Newton step?
  options:
    - near singularities a full step can be huge and overshoot
    - to save memory
    - the pseudo-inverse needs it
    - joint encoders are slow
  answer: 0
  explain: J⁺ blows up near singular poses.
:::end
