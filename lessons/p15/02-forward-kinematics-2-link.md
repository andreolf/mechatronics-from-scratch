---
id: p15-l02
minutes: 30
summary: Forward kinematics answers the first question about any arm, which is where the tool is for given joint angles. You derive it for the planar 2-link arm of the arm lab by adding two rotated link vectors, write it again as a chain of homogeneous transforms, plot the reachable workspace with and without joint limits, and test that every version agrees with a geometric construction.
---

## Adding two link vectors

The [arm lab](#lab-arm) has two links of length $\ell_1 = 1.0$ m and $\ell_2 = 0.8$ m. Joint angle $q_1$ is measured from the horizontal, and $q_2$ is the elbow angle relative to link 1. The elbow sits at $\ell_1(\cos q_1, \sin q_1)$; link 2 points at the absolute angle $q_1 + q_2$. So

$$x = \ell_1\cos q_1 + \ell_2\cos(q_1 + q_2), \qquad y = \ell_1\sin q_1 + \ell_2\sin(q_1 + q_2).$$

In complex numbers this is $z = \ell_1 e^{jq_1} + \ell_2 e^{j(q_1 + q_2)}$: rotate, add, rotate again.

## The same thing as transforms

A planar homogeneous transform packs a rotation and a translation into one $3 \times 3$ matrix:

$$T(\theta, a) = \begin{bmatrix}\cos\theta & -\sin\theta & a\cos\theta\\ \sin\theta & \cos\theta & a\sin\theta\\ 0 & 0 & 1\end{bmatrix},$$

which rotates by $\theta$ and then moves $a$ along the new $x$ axis. The tool frame is $T(q_1, \ell_1)\,T(q_2, \ell_2)$, and its last column is the tool position. Chaining matrices like this scales to any number of joints, which is the idea behind lessons 03 to 05.

## Workspace

The tool's distance from the base is $r = \sqrt{\ell_1^2 + \ell_2^2 + 2\ell_1\ell_2\cos q_2}$, so with free joints the reachable set is an annulus from $|\ell_1 - \ell_2| = 0.2$ m to $\ell_1 + \ell_2 = 1.8$ m. Its area is $\pi(1.8^2 - 0.2^2) = 10.05$ m². The lab's joint limits ($0 \le q_1 \le 180°$, $|q_2| \le 135°$) cut it to about 6.0 m².

:::figure widget=armws caption="The lab's 2-link arm with the reachable workspace shaded. Move the joints, and switch the joint limits on to see which part of the annulus disappears."
:::end

## Worked example

At the lab's start pose $q_1 = 60°$, $q_2 = -70°$:

1. Elbow: $(\cos 60°, \sin 60°) = (0.500, 0.866)$ m.
2. Link 2 points at $60° - 70° = -10°$: it adds $0.8(\cos(-10°), \sin(-10°)) = (0.788, -0.139)$ m.
3. Tool: $(1.288, 0.727)$ m, at a distance of 1.479 m from the base.
4. Check with $r$: $\sqrt{1 + 0.64 + 1.6\cos 70°} = \sqrt{2.187} = 1.479$ m.

## Code it from scratch

:::code file=fk2link.py
```python
import numpy as np

L1, L2 = 1.0, 0.8                                   # the arm lab's link lengths (m)
Q1_LIM, Q2_LIM = (0.0, np.pi), (-np.radians(135), np.radians(135))

def fk(q1, q2, l1=L1, l2=L2):
    """tool (x, y) and elbow position of a planar 2-link arm"""
    elbow = np.array([l1 * np.cos(q1), l1 * np.sin(q1)])
    return elbow + l2 * np.array([np.cos(q1 + q2), np.sin(q1 + q2)]), elbow

def T(theta, a):
    """homogeneous transform: rotate by theta, then move a along the new x axis"""
    c, s = np.cos(theta), np.sin(theta)
    return np.array([[c, -s, a * c], [s, c, a * s], [0, 0, 1]])

def fk_chain(q1, q2):
    return (T(q1, L1) @ T(q2, L2))[:2, 2]

def fk_geometric(q1, q2):
    """compass-and-ruler construction with complex numbers: rotate, add, rotate again"""
    z = L1 * np.exp(1j * q1) + L2 * np.exp(1j * (q1 + q2))
    return np.array([z.real, z.imag])

def workspace_area(limits, n=600, cell=0.01):
    """area covered by the tool, by rasterising a dense joint grid"""
    q1 = np.linspace(*(limits[0] if limits else (-np.pi, np.pi)), n)
    q2 = np.linspace(*(limits[1] if limits else (-np.pi, np.pi)), n)
    A, B = np.meshgrid(q1, q2)
    x = L1 * np.cos(A) + L2 * np.cos(A + B); y = L1 * np.sin(A) + L2 * np.sin(A + B)
    cells = set(zip(np.floor(x.ravel() / cell).astype(int), np.floor(y.ravel() / cell).astype(int)))
    return len(cells) * cell * cell

def test_fk_matches_construction():
    rng = np.random.default_rng(0)
    for q1, q2 in rng.uniform(-np.pi, np.pi, (500, 2)):
        p, _ = fk(q1, q2)
        assert np.allclose(p, fk_chain(q1, q2)) and np.allclose(p, fk_geometric(q1, q2))
    p, e = fk(np.radians(60), np.radians(-70))      # the lab's start pose
    print(f"lab start pose: elbow ({e[0]:.3f}, {e[1]:.3f}), tool ({p[0]:.3f}, {p[1]:.3f}) m")
    assert np.allclose(p, [0.5 + 0.8 * np.cos(np.radians(-10)), np.sqrt(3) / 2 + 0.8 * np.sin(np.radians(-10))])

def test_reach():
    rng = np.random.default_rng(1)
    r = [np.hypot(*fk(*q)[0]) for q in rng.uniform(-np.pi, np.pi, (2000, 2))]
    assert min(r) >= L1 - L2 - 1e-12 and max(r) <= L1 + L2 + 1e-12
    assert abs(np.hypot(*fk(0.3, 0)[0]) - 1.8) < 1e-12 and abs(np.hypot(*fk(0.3, np.pi)[0]) - 0.2) < 1e-12

def test_workspace_area():
    full = workspace_area(None); lim = workspace_area((Q1_LIM, Q2_LIM))
    exact = np.pi * ((L1 + L2) ** 2 - (L1 - L2) ** 2)
    print(f"workspace area: unlimited {full:.3f} m^2 (exact {exact:.3f}), with the lab's joint limits {lim:.3f} m^2")
    assert abs(full - exact) / exact < 0.02 and lim < full

test_fk_matches_construction()
test_reach()
test_workspace_area()
print("PASS")
```
:::end

## Exercises

:::exercise
Which joint angles reach the outer edge of the workspace, and why is that a problem for control?
:::solution
$q_2 = 0$: the arm is fully stretched. There a small change in $q_2$ barely moves the tool along the radius, because $\partial r/\partial q_2 = 0$. The arm has lost a direction of motion, which is a singularity (lessons 08 and 09).
:::end

:::exercise
If you swapped the links so that $\ell_1 = 0.8$ and $\ell_2 = 1.0$, how would the free-joint workspace change?
:::solution
It wouldn't: the annulus depends only on $|\ell_1 - \ell_2|$ and $\ell_1 + \ell_2$. With joint limits it would change, because the limits act on different links.
:::end

## Quiz

:::quiz
- type: num
  q: Outer radius of the lab arm's workspace?
  answer: 1.8
  tol: 0.001
  unit: m
  py: "1.0+0.8"
  explain: Fully stretched, q2 = 0.
- type: num
  q: Free-joint workspace area of the lab arm?
  answer: 10.053
  tol: 0.002
  unit: m²
  py: "math.pi*(1.8**2-0.2**2)"
  explain: An annulus from 0.2 m to 1.8 m.
- type: num
  q: Tool x position at q1 = 60°, q2 = −70°?
  answer: 1.288
  tol: 0.002
  unit: m
  py: "math.cos(math.radians(60))+0.8*math.cos(math.radians(-10))"
  explain: 0.5 + 0.788.
- type: num
  q: Distance from base to tool when q2 = 90°?
  answer: 1.2806
  tol: 0.002
  unit: m
  py: "math.sqrt(1+0.64)"
  explain: The links are at right angles.
- type: mc
  q: In T(θ, a) = rotate then translate, the tool position is…
  options:
    - the last column of the chained matrix
    - the first row
    - the determinant
    - the diagonal
  answer: 0
  explain: The translation part sits in the last column.
- type: mc
  q: The inner hole of the workspace exists because…
  options:
    - the links have different lengths
    - of gravity
    - of joint friction
    - the base is offset
  answer: 0
  explain: The tool can come no closer than |l1 − l2|.
:::end
