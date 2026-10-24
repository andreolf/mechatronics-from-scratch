---
id: p15-l12
minutes: 45
summary: Inverse dynamics asks which joint torques produce a given motion, and the recursive Newton-Euler algorithm answers it in two sweeps along the chain, with work proportional to the number of links. You derive the outward pass for velocities and accelerations and the inward pass for forces and moments, implement it for the arm lab's 2-link arm, recover the mass matrix from it, and test it against the closed-form Lagrangian model the lab integrates.
---

## Two passes

Given $q$, $\dot q$, $\ddot q$, find $\tau$. Newton-Euler applies $F = ma$ and $\sum M = I\alpha$ to each link, and the recursion organises the bookkeeping.

**Outward pass** (base to tool). In the plane each link's angular velocity and acceleration are sums of the joint rates: $\omega_i = \dot q_1 + \cdots + \dot q_i$, $\alpha_i = \ddot q_1 + \cdots + \ddot q_i$. A point at $r$ from joint $i$ on link $i$ accelerates at

$$a = a_{joint\,i} + \alpha_i\hat z \times r + \omega_i\hat z \times (\omega_i\hat z \times r),$$

the tangential and centripetal terms. This gives each centre of mass $a_{c_i}$ and the next joint's acceleration.

**Inward pass** (tool to base). Link $i$ needs net force $F_i = m_ia_{c_i}$. The joint supplies that plus whatever the next link pulls with, $f_i = F_i + f_{i+1}$. Taking moments about joint $i$:

$$\tau_i = I_i\alpha_i + r_{c_i} \times F_i + r_{i,i+1} \times f_{i+1} + \tau_{i+1}.$$

**Gravity for free:** give the base an upward acceleration $g$. Every link then "feels" its weight, with no separate gravity term. A tool force enters as the starting $f_{n+1}$.

## Why it matters

The Lagrangian route (lesson 13) builds $M(q)$, $C(q, \dot q)$ and $g(q)$ symbolically, which grows quickly with the number of links. RNEA does a fixed amount of work per link: $O(n)$. That is why Pinocchio, MuJoCo and every real-time controller use recursive algorithms. Calling RNEA with $\dot q = 0$, $g = 0$ and $\ddot q = e_j$ gives column $j$ of $M(q)$.

:::figure widget=rnea caption="The arm lab's arm swinging through a motion, with the force each joint transmits drawn as an arrow and the joint torques as bars. Speed the motion up to see the inertial and centripetal terms take over from gravity."
:::end

## Worked example

The [arm lab](#lab-arm)'s arm ($m_1 = 1.5$ kg, $m_2 = 1.0$ kg, uniform rods) at $q = (60°, -70°)$, $\dot q = (1, -0.5)$ rad/s, $\ddot q = (2, 1)$ rad/s²:

1. RNEA gives $\tau = (16.490, 4.402)$ N·m.
2. Gravity alone (from the same call with $\dot q = \ddot q = 0$) is $(12.448, 3.864)$ N·m, the holding torque of lesson 10.
3. The mass matrix from unit accelerations is $M = \begin{bmatrix}1.987 & 0.350\\ 0.350 & 0.213\end{bmatrix}$ kg·m², symmetric as it must be.
4. The closed-form Lagrangian model gives the same torques to $10^{-10}$ over 500 random states.

## Code it from scratch

:::code file=rnea.py
```python
import numpy as np

# the arm lab's links: uniform rods, centre of mass halfway, I about the centre m l^2 / 12
P = dict(l=[1.0, 0.8], m=[1.5, 1.0], g=9.81)
P["lc"] = [P["l"][0] / 2, P["l"][1] / 2]; P["I"] = [m * l * l / 12 for m, l in zip(P["m"], P["l"])]
cross2 = lambda a, b: a[0] * b[1] - a[1] * b[0]               # z component of a 3-D cross product
def wx(w, r): return np.array([-w * r[1], w * r[0]])            # (w z) x r in the plane

def rnea(q, qd, qdd, p=P, f_tool=(0.0, 0.0)):
    """recursive Newton-Euler for a planar chain of revolute joints.
    Gravity enters as an upward acceleration of the base, so every link 'feels' it."""
    n = len(q); th = np.cumsum(q); w = np.cumsum(qd); al = np.cumsum(qdd)
    a_joint = np.array([0.0, p["g"]]); a_c, r_c, r_next = [], [], []
    for i in range(n):                                            # forward pass: velocities and accelerations
        u = np.array([np.cos(th[i]), np.sin(th[i])])
        rc, rn = p["lc"][i] * u, p["l"][i] * u
        a_c.append(a_joint + wx(al[i], rc) + wx(w[i], wx(w[i], rc)))
        a_joint = a_joint + wx(al[i], rn) + wx(w[i], wx(w[i], rn))
        r_c.append(rc); r_next.append(rn)
    f, tau_next, tau = -np.asarray(f_tool, float), 0.0, np.zeros(n)   # force the outer link applies to the next one
    for i in reversed(range(n)):                                  # backward pass: forces and moments
        F = p["m"][i] * a_c[i]                                    # net force needed on link i
        f_i = F + f                                               # force from joint i onto link i
        # moments about joint i: joint torque + moment of f_i (at the joint, zero arm) - moment of f at the far end
        tau[i] = p["I"][i] * al[i] + cross2(r_c[i], F) + cross2(r_next[i], f) + tau_next
        f, tau_next = f_i, tau[i]
    return tau

def lagrange(q, qd, qdd, p=P):
    """the closed-form M, C, g the arm lab integrates"""
    (l1, _), (m1, m2), (lc1, lc2), (I1, I2), g = p["l"], p["m"], p["lc"], p["I"], p["g"]
    c2, s2 = np.cos(q[1]), np.sin(q[1])
    M = np.array([[m1 * lc1 ** 2 + I1 + m2 * (l1 ** 2 + lc2 ** 2 + 2 * l1 * lc2 * c2) + I2, m2 * (lc2 ** 2 + l1 * lc2 * c2) + I2],
                  [m2 * (lc2 ** 2 + l1 * lc2 * c2) + I2, m2 * lc2 ** 2 + I2]])
    h = m2 * l1 * lc2 * s2
    c = np.array([-h * (2 * qd[0] * qd[1] + qd[1] ** 2), h * qd[0] ** 2])
    G = np.array([(m1 * lc1 + m2 * l1) * g * np.cos(q[0]) + m2 * lc2 * g * np.cos(q[0] + q[1]), m2 * lc2 * g * np.cos(q[0] + q[1])])
    return M @ qdd + c + G

def test_matches_lagrangian():
    rng = np.random.default_rng(15)
    for _ in range(500):
        q, qd, qdd = rng.uniform(-3, 3, 2), rng.uniform(-4, 4, 2), rng.uniform(-10, 10, 2)
        assert np.allclose(rnea(q, qd, qdd), lagrange(q, qd, qdd), atol=1e-10)

def test_tool_force_matches_statics():
    q = np.radians([90, -90]); F = np.array([10.0, 0.0])
    extra = rnea(q, [0, 0], [0, 0], f_tool=F) - rnea(q, [0, 0], [0, 0])
    assert np.allclose(extra, [10.0, 0.0])                        # lesson 10's answer, resisting a 10 N push

def test_worked_example():
    q, qd, qdd = np.radians([60, -70]), np.array([1.0, -0.5]), np.array([2.0, 1.0])
    t = rnea(q, qd, qdd); s = rnea(q, [0, 0], [0, 0])
    print(f"tau = ({t[0]:.3f}, {t[1]:.3f}) N m, of which gravity ({s[0]:.3f}, {s[1]:.3f})")
    # mass matrix column by column: unit accelerations, no velocity, no gravity
    p0 = dict(P, g=0.0)
    Mcols = np.column_stack([rnea(q, [0, 0], e, p0) for e in np.eye(2)])
    print("M(q) from RNEA:\n", Mcols.round(4))
    assert np.allclose(Mcols, Mcols.T)

test_matches_lagrangian()
test_tool_force_matches_statics()
test_worked_example()
print("PASS")
```
:::end

## Exercises

:::exercise
How would you compute *forward* dynamics, $\ddot q$ from $\tau$, using only RNEA?
:::solution
Call RNEA with $\ddot q = 0$ to get the bias $b = C\dot q + g$. Call it $n$ more times with $\dot q = 0$, $g = 0$ and $\ddot q = e_j$ to build $M$. Then solve $M\ddot q = \tau - b$. This takes $O(n^2)$ work plus an $O(n^3)$ solve. The articulated-body algorithm does it in $O(n)$.
:::end

:::exercise
Why does the elbow torque change sign when the shoulder spins fast, even with $\ddot q = 0$?
:::solution
The centripetal acceleration of the forearm's centre points back towards the shoulder. Its moment about the elbow is $m_2\ell_1\ell_{c2}\sin q_2\,\dot q_1^2$, the $h\dot q_1^2$ term of the Lagrangian model, which grows with $\dot q_1^2$ and can outweigh gravity.
:::end

## Quiz

:::quiz
- type: num
  q: Moment of inertia of the lab's forearm about its centre (1.0 kg, 0.8 m uniform rod)?
  answer: 0.053333
  tol: 0.002
  unit: kg·m²
  py: "1.0*0.8**2/12"
  explain: m l² / 12.
- type: num
  q: M22 for the lab arm (any pose)?
  answer: 0.21333
  tol: 0.002
  unit: kg·m²
  py: "1.0*0.4**2+1.0*0.8**2/12"
  explain: m2 lc2² + I2.
- type: num
  q: Centripetal acceleration of a point 0.5 m from a joint spinning at 2 rad/s?
  answer: 2
  tol: 0.001
  unit: m/s²
  py: "0.5*2**2"
  explain: ω² r.
- type: num
  q: How many RNEA calls build M(q) for a 6-joint arm (one per column)?
  answer: 6
  tol: 0.001
  py: "6"
  explain: Unit acceleration on each joint in turn.
- type: mc
  q: In RNEA, gravity is included by…
  options:
    - giving the base an upward acceleration g
    - adding a separate potential-energy term
    - ignoring it
    - a downward force on the tool only
  answer: 0
  explain: Then every link feels its weight.
- type: mc
  q: The cost of RNEA grows with the number of links n as…
  options:
    - O(n)
    - O(n²)
    - O(n³)
    - O(2ⁿ)
  answer: 0
  explain: One pass out, one pass in.
:::end
