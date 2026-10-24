---
id: p15-l03
minutes: 40
summary: Denavit-Hartenberg parameters describe any serial chain with four numbers per joint, and a table of them is all forward kinematics needs. You derive the DH link transform from two rotations and two translations, write the table for a 3-joint arm with a base yaw, a shoulder and an elbow, build its forward kinematics from the table, and test it against an independent chain of elementary transforms and a closed-form formula.
---

## Four numbers per link

A spatial pose is a $4 \times 4$ homogeneous transform $T = \begin{bmatrix}R & p\\ 0 & 1\end{bmatrix}$ with a rotation $R$ and a position $p$. For a chain, $T_{0n} = T_{01}T_{12}\cdots T_{n-1,n}$. In general each $T_{i-1,i}$ needs 6 numbers. Denavit and Hartenberg showed that by placing the frames cleverly you need only 4:

- $z_i$ lies along the axis of joint $i + 1$;
- $x_i$ lies along the common normal from $z_{i-1}$ to $z_i$.

Then frame $i$ is reached from frame $i - 1$ by rotating $\theta_i$ about $z_{i-1}$, sliding $d_i$ along it, sliding $a_i$ along the new $x$, and twisting $\alpha_i$ about that $x$:

$$T_{i-1,i} = R_z(\theta_i)\,T_z(d_i)\,T_x(a_i)\,R_x(\alpha_i) = \begin{bmatrix}c_\theta & -s_\theta c_\alpha & s_\theta s_\alpha & a c_\theta\\ s_\theta & c_\theta c_\alpha & -c_\theta s_\alpha & a s_\theta\\ 0 & s_\alpha & c_\alpha & d\\ 0 & 0 & 0 & 1\end{bmatrix}.$$

For a revolute joint, $\theta_i = q_i$ plus a fixed offset; for a prismatic joint, $d_i$ is the variable.

## The table for a 3-joint arm

An illustrative desktop arm: a base that yaws about vertical, a shoulder 0.4 m up, an upper arm of 0.5 m and a forearm of 0.4 m.

| $i$ | $\theta_i$ | $d_i$ | $a_i$ | $\alpha_i$ |
|---|---|---|---|---|
| 1 | $q_1$ | 0.4 | 0 | $90°$ |
| 2 | $q_2$ | 0 | 0.5 | 0 |
| 3 | $q_3$ | 0 | 0.4 | 0 |

The $90°$ twist in row 1 turns the vertical base axis into the horizontal shoulder axis. Rows 2 and 3 are the planar 2-link arm of lesson 02, standing in the vertical plane that $q_1$ swings round.

:::figure widget=dhframes caption="The 3-joint arm drawn in 3D with every DH frame: x axes lime, z axes blue (each one a joint axis). Move the joints and turn the view to see how the twist in row 1 tips the shoulder axis horizontal."
:::end

## Worked example

At $q = (30°, 45°, -60°)$:

1. In the arm's vertical plane, the reach is $r = 0.5\cos 45° + 0.4\cos(-15°) = 0.3536 + 0.3864 = 0.7399$ m.
2. Height: $z = 0.4 + 0.5\sin 45° + 0.4\sin(-15°) = 0.4 + 0.3536 - 0.1035 = 0.6500$ m.
3. Yaw it round by 30°: $x = 0.7399\cos 30° = 0.6408$ m, $y = 0.3700$ m.
4. The DH product gives the same $(0.6408, 0.3700, 0.6500)$, and frame 1's $z$ axis (the shoulder axis) is $(\sin 30°, -\cos 30°, 0)$: horizontal, as it should be.

## Code it from scratch

:::code file=dh_fk.py
```python
import numpy as np

def dh(theta, d, a, alpha):
    """standard DH link transform: Rot_z(theta) Trans_z(d) Trans_x(a) Rot_x(alpha)"""
    ct, st, ca, sa = np.cos(theta), np.sin(theta), np.cos(alpha), np.sin(alpha)
    return np.array([[ct, -st * ca,  st * sa, a * ct],
                     [st,  ct * ca, -ct * sa, a * st],
                     [0,        sa,       ca,      d],
                     [0,         0,        0,      1]])

# illustrative desktop arm: base yaw, shoulder, elbow
D1, A2, A3 = 0.4, 0.5, 0.4
DH_TABLE = [  # (theta offset, d, a, alpha); theta_i = q_i + offset
    (0.0, D1, 0.0, np.pi / 2),
    (0.0, 0.0, A2, 0.0),
    (0.0, 0.0, A3, 0.0),
]

def fk_dh(q, table=DH_TABLE):
    T = np.eye(4); frames = [T]
    for qi, (off, d, a, al) in zip(q, table):
        T = T @ dh(qi + off, d, a, al); frames.append(T)
    return T, frames

# an independent chain of elementary motions in the base frame
def Rz(t): c, s = np.cos(t), np.sin(t); return np.array([[c, -s, 0, 0], [s, c, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]])
def Ry(t): c, s = np.cos(t), np.sin(t); return np.array([[c, 0, s, 0], [0, 1, 0, 0], [-s, 0, c, 0], [0, 0, 0, 1]])
def Tr(x, y, z): T = np.eye(4); T[:3, 3] = [x, y, z]; return T

def fk_chain(q):
    q1, q2, q3 = q   # yaw about z, then pitch up by q2 and q3 (a rotation of -q about y lifts the x axis)
    return Rz(q1) @ Tr(0, 0, D1) @ Ry(-q2) @ Tr(A2, 0, 0) @ Ry(-q3) @ Tr(A3, 0, 0)

def fk_closed(q):
    q1, q2, q3 = q
    r = A2 * np.cos(q2) + A3 * np.cos(q2 + q3)
    return np.array([r * np.cos(q1), r * np.sin(q1), D1 + A2 * np.sin(q2) + A3 * np.sin(q2 + q3)])

def test_matches_chain():
    rng = np.random.default_rng(2)
    for q in rng.uniform(-np.pi, np.pi, (300, 3)):
        T, _ = fk_dh(q); Tc = fk_chain(q)
        assert np.allclose(T[:3, 3], Tc[:3, 3]) and np.allclose(T[:3, 3], fk_closed(q))
        assert np.allclose(T[:3, 0], Tc[:3, 0])                    # both x axes point along the last link
        assert np.allclose(T[:3, :3] @ T[:3, :3].T, np.eye(3))     # a proper rotation
        assert abs(np.linalg.det(T[:3, :3]) - 1) < 1e-12

def test_worked_example():
    q = np.radians([30, 45, -60])
    T, frames = fk_dh(q)
    print("tool position at (30, 45, -60) deg:", np.round(T[:3, 3], 4))
    print("joint 2 axis z1 in the base frame:", np.round(frames[1][:3, 2], 4))
    assert np.allclose(T[:3, 3], [0.64079, 0.36996, 0.65003], atol=1e-5)
    T0, _ = fk_dh([0, 0, 0])
    assert np.allclose(T0[:3, 3], [A2 + A3, 0, D1])

test_matches_chain()
test_worked_example()
print("PASS")
```
:::end

## Exercises

:::exercise
Why is the DH convention not unique for a given robot?
:::solution
Wherever consecutive joint axes are parallel the common normal isn't unique, so you choose where $x_i$ sits; the base and tool frames are also free choices. Different but valid tables give the same tool pose. That is why manufacturers publish their own table, and why some use the modified (Craig) convention instead.
:::end

:::exercise
How would row 3 change if the elbow were a prismatic joint that slid the forearm out?
:::solution
$\theta_3$ would be a fixed angle and the variable would be the sliding distance. With the slide along the forearm, you would put $z_2$ along the forearm (an extra twist in row 2), then $d_3 = q_3$ in row 3.
:::end

## Quiz

:::quiz
- type: num
  q: How many DH parameters describe each link?
  answer: 4
  tol: 0.001
  py: "4"
  explain: θ, d, a and α.
- type: num
  q: Height of the tool at q = (30°, 45°, −60°)?
  answer: 0.65
  tol: 0.002
  unit: m
  py: "0.4+0.5*math.sin(math.radians(45))+0.4*math.sin(math.radians(-15))"
  explain: The shoulder height plus the planar arm's rise.
- type: num
  q: Tool x position when all joints are at zero?
  answer: 0.9
  tol: 0.001
  unit: m
  py: "0.5+0.4"
  explain: Arm stretched along x.
- type: num
  q: Entry (3, 3) of a DH transform with α = 90°?
  answer: 0
  tol: 0.001
  py: "round(math.cos(math.pi/2), 9)"
  explain: The entry is cos α.
- type: mc
  q: In the DH convention, axis z_i lies along…
  options:
    - the axis of joint i + 1
    - link i
    - gravity
    - the common normal
  answer: 0
  explain: Each z axis is a joint axis.
- type: mc
  q: For a prismatic joint the variable is…
  options:
    - d
    - θ
    - a
    - α
  answer: 0
  explain: It slides along z.
:::end
