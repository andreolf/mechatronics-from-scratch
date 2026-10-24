---
id: p15-l10
minutes: 35
summary: The same Jacobian that maps joint speeds to tool velocity maps tool forces back to joint torques, transposed. You derive tau = J transpose F from the principle of virtual work, compute the torques the arm lab's arm needs to hold its own links and a payload, find the heaviest payload its motors can hold stretched out, and test every result against free-body Newton-Euler moment balances.
---

## Virtual work

Hold the arm still while a force $F$ acts on the environment from the tool. Imagine a tiny joint motion $\delta q$. The tool moves $\delta x = J\,\delta q$, and since nothing is accelerating, the work done by the motors equals the work done on the environment:

$$\tau^T\delta q = F^T\delta x = F^TJ\,\delta q \quad\text{for every }\delta q \quad\Rightarrow\quad \tau = J^TF.$$

No inverse needed, so it holds even at singular poses. To *resist* an external force $F_{ext}$ pushing on the tool, the motors supply $\tau = -J^TF_{ext}$.

## Gravity is just more forces

Each link's weight acts at its centre of mass. With $J_{c_i}$ the Jacobian of that point (lesson 09, stopping at link $i$),

$$\tau_g = -\sum_i J_{c_i}^T\begin{bmatrix}0\\ -m_ig\end{bmatrix}, \qquad \tau_{hold} = \tau_g - J^T\begin{bmatrix}0\\ -m_{load}\,g\end{bmatrix}.$$

For the [arm lab](#lab-arm)'s uniform links ($m_1 = 1.5$ kg, $m_2 = 1.0$ kg) this reproduces exactly the gravity term the lab uses for its gravity compensation: $\tau_{g,1} = (m_1\ell_{c1} + m_2\ell_1)g\cos q_1 + m_2\ell_{c2}g\cos(q_1 + q_2)$, $\tau_{g,2} = m_2\ell_{c2}g\cos(q_1 + q_2)$.

:::figure widget=statics caption="Hold a payload and push on the tool: the bars show the joint torques from tau = J transpose F against the lab's motor limits of 45 and 25 N m. Stretch the arm out horizontally to see why the shoulder runs out first."
:::end

## Worked example

1. At the lab's start pose $(60°, -70°)$ the arm alone needs $(12.45, 3.86)$ N·m.
2. With a 2 kg payload: $(37.72, 19.32)$ N·m, 84 % of the shoulder's 45 N·m limit.
3. Stretched horizontally, the links alone need $\tau_1 = (1.5 \times 0.5 + 1.0 \times 1.0 + 1.0 \times 0.4) \times 9.81\,\text{N} \cdot \text{m} = 21.09$ N·m and $\tau_2 = 3.92$ N·m. Each kg at the tool adds $1.8g = 17.7$ N·m and $0.8g = 7.85$ N·m. So the shoulder runs out at $(45 - 21.09)/17.66 = 1.35$ kg, before the elbow (2.69 kg).
4. With the upper arm vertical and the forearm horizontal, a 10 N push along the forearm at the tool needs 10 N·m at the shoulder and nothing at the elbow: the force's line passes through the elbow.

## Code it from scratch

:::code file=statics.py
```python
import numpy as np

L1, L2, M1, M2, G = 1.0, 0.8, 1.5, 1.0, 9.81    # the arm lab's links: uniform rods (m, kg)
TAU_MAX = np.array([45.0, 25.0])                # the lab's motor torque limits (N m)

def fk(q):
    e = L1 * np.array([np.cos(q[0]), np.sin(q[0])]); return e + L2 * np.array([np.cos(q[0] + q[1]), np.sin(q[0] + q[1])]), e
def jac(q):
    s1, c1, s12, c12 = np.sin(q[0]), np.cos(q[0]), np.sin(q[0] + q[1]), np.cos(q[0] + q[1])
    return np.array([[-L1 * s1 - L2 * s12, -L2 * s12], [L1 * c1 + L2 * c12, L2 * c12]])

def jac_point(q, link, d):
    """Jacobian of a point a distance d along link 1 or 2 (zero column for joints beyond it)"""
    s1, c1, s12, c12 = np.sin(q[0]), np.cos(q[0]), np.sin(q[0] + q[1]), np.cos(q[0] + q[1])
    if link == 1: return np.array([[-d * s1, 0], [d * c1, 0]])
    return np.array([[-L1 * s1 - d * s12, -d * s12], [L1 * c1 + d * c12, d * c12]])

def holding_torque(q, payload=0.0, F_tool=(0.0, 0.0)):
    """virtual work: tau = sum J_i^T F_i over every applied force, here the link weights, the payload and a tool force.
    Returned as the torque the motors must supply to hold still."""
    tau = np.zeros(2)
    for link, m, d in ((1, M1, L1 / 2), (2, M2, L2 / 2)):
        tau -= jac_point(q, link, d).T @ np.array([0, -m * G])
    tau -= jac(q).T @ (np.array([0, -payload * G]) + np.asarray(F_tool, float))
    return tau

def newton_euler_static(q, payload=0.0, F_tool=(0.0, 0.0)):
    """free-body diagrams: each joint must cancel the moment of everything outboard of it"""
    tip, elbow = fk(q); F_tool = np.asarray(F_tool, float)
    c1 = elbow / 2; c2 = elbow + (tip - elbow) / 2
    cross = lambda r, f: r[0] * f[1] - r[1] * f[0]
    forces2 = [(c2, np.array([0, -M2 * G])), (tip, np.array([0, -payload * G]) + F_tool)]
    tau2 = -sum(cross(p - elbow, f) for p, f in forces2)
    tau1 = -sum(cross(p, f) for p, f in forces2 + [(c1, np.array([0, -M1 * G]))])
    return np.array([tau1, tau2])

def test_matches_newton_euler():
    rng = np.random.default_rng(13)
    for _ in range(300):
        q = rng.uniform(-np.pi, np.pi, 2); m = rng.uniform(0, 3); F = rng.normal(size=2) * 10
        assert np.allclose(holding_torque(q, m, F), newton_euler_static(q, m, F))

def test_lab_gravity_model():
    # the lab's gravity term: (m1 lc1 + m2 l1) g cos q1 + m2 lc2 g cos(q1 + q2), m2 lc2 g cos(q1 + q2)
    q = np.radians([60, -70])
    lab = np.array([(M1 * 0.5 + M2 * L1) * G * np.cos(q[0]) + M2 * 0.4 * G * np.cos(q[0] + q[1]), M2 * 0.4 * G * np.cos(q[0] + q[1])])
    assert np.allclose(holding_torque(q), lab)

def test_payload_example():
    q = np.radians([60, -70])
    for m in (0.0, 2.0):
        t = holding_torque(q, m); print(f"payload {m:.1f} kg: tau = ({t[0]:6.2f}, {t[1]:6.2f}) N m, {np.abs(t / TAU_MAX).max() * 100:.0f} % of the worst limit")
    # the heaviest payload the lab arm can hold stretched out horizontally
    qh = np.array([0.0, 0.0]); base = holding_torque(qh); per_kg = holding_torque(qh, 1.0) - base
    mmax = np.min((TAU_MAX - base) / per_kg)
    print(f"stretched horizontally: {base.round(2)} N m with no payload, max payload {mmax:.2f} kg")
    assert abs(mmax - min((45 - base[0]) / (1.8 * G), (25 - base[1]) / (0.8 * G))) < 1e-9

def test_force_at_tool():
    q = np.radians([90, -90])                 # upper arm up, forearm horizontal
    t = holding_torque(q, 0, F_tool=(10.0, 0.0)) - holding_torque(q)
    print("resisting a 10 N push in +x at the tool needs", t.round(3), "N m extra")
    assert np.allclose(t, [10 * 1.0, 0.0], atol=1e-9)          # the push runs along the forearm, so the elbow feels none of it

test_matches_newton_euler()
test_lab_gravity_model()
test_payload_example()
test_force_at_tool()
print("PASS")
```
:::end

## Exercises

:::exercise
At full stretch ($q_2 = 0$), the tool pushes straight outwards along the arm. What torques are needed?
:::solution
None. The force's line passes through both joints, so $J^TF = 0$. The structure carries the load. This is the dual of the velocity singularity: the direction in which the tool cannot move is exactly the direction in which it can resist any force for free.
:::end

:::exercise
Why do industrial arms often have a counterweight or a gas spring at the shoulder?
:::solution
The shoulder's gravity torque, which grows with reach, is the largest load in the arm and is there all the time. Balancing it passively frees the motor's torque for payload and acceleration, and lets a smaller motor and gearbox do the job.
:::end

## Quiz

:::quiz
- type: num
  q: Shoulder torque to hold the lab arm stretched horizontally with no payload?
  answer: 21.09
  tol: 0.002
  unit: N·m
  py: "(1.5*0.5+1.0*1.0+1.0*0.4)*9.81"
  explain: Both links' weights times their distances from the shoulder.
- type: num
  q: Extra shoulder torque per kilogram of payload at full horizontal reach?
  answer: 17.658
  tol: 0.002
  unit: N·m/kg
  py: "1.8*9.81"
  explain: Weight times 1.8 m.
- type: num
  q: Maximum payload the lab arm can hold stretched horizontally?
  answer: 1.354
  tol: 0.005
  unit: kg
  py: "(45-21.0915)/(1.8*9.81)"
  explain: The shoulder limit is reached first.
- type: num
  q: Elbow torque to hold the forearm horizontal with no payload?
  answer: 3.924
  tol: 0.002
  unit: N·m
  py: "1.0*0.4*9.81"
  explain: m2 g times half of l2.
- type: mc
  q: tau = J transpose F follows from…
  options:
    - equal virtual work at the joints and at the tool
    - Newton's third law only
    - the inverse of J
    - conservation of momentum
  answer: 0
  explain: Work in, work out, for any small motion.
- type: mc
  q: At a singular pose, the static relation tau = J transpose F…
  options:
    - still holds; some force directions need no torque at all
    - fails, because J has no inverse
    - needs damped least squares
    - gives infinite torque
  answer: 0
  explain: Only the transpose is used.
:::end
