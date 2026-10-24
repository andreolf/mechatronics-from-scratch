---
id: p12-l13
minutes: 45
summary: A quadrotor is a rigid body pushed by four thrusts, and its model is Newton's law for the centre of mass plus Euler's equations for rotation, joined by the rotation from body to world. You derive the mixer that turns four thrusts into total thrust and three torques, simulate the full 3D model with quaternions, test that hover needs exactly mg, and watch a tiny thrust imbalance make an uncontrolled drone drift away.
---

## Two halves of Newton-Euler

Translation, in the world frame with $z$ up:

$$m\ddot{\mathbf p} = R\begin{bmatrix}0\\0\\T\end{bmatrix} - \begin{bmatrix}0\\0\\mg\end{bmatrix},$$

where $T = \sum T_i$ is the total thrust and $R$ rotates body axes into world axes. Rotation, in the body frame:

$$I\dot{\boldsymbol\omega} = \boldsymbol\tau - \boldsymbol\omega \times I\boldsymbol\omega.$$

The cross term is the gyroscopic coupling: spinning about one axis and torquing about another rotates the third. Attitude is stored as a unit quaternion $q$ with $\dot q = \tfrac12 q \otimes (0, \boldsymbol\omega)$, which never hits the singularities Euler angles have.

## The mixer

In the "+" layout, motor 1 is at $+x$, 2 at $+y$, 3 at $-x$, 4 at $-y$, each at arm length $\ell$. Each thrust is along body $z$, so its torque is $\mathbf r_i \times T_i\hat z$; the propellers also produce a drag torque $\pm k_q T_i$ about $z$ (1 and 3 spin one way, 2 and 4 the other):

$$\begin{bmatrix}T\\ \tau_x\\ \tau_y\\ \tau_z\end{bmatrix} = \begin{bmatrix}1 & 1 & 1 & 1\\ 0 & \ell & 0 & -\ell\\ -\ell & 0 & \ell & 0\\ k_q & -k_q & k_q & -k_q\end{bmatrix}\begin{bmatrix}T_1\\T_2\\T_3\\T_4\end{bmatrix}.$$

The matrix is invertible, so a controller computes the wrench it wants and the inverse mixer gives the four motor commands. The [live quadrotor lab](#lab-quad) uses this layout with $m = 1$ kg, $\ell = 0.22$ m, $I = \mathrm{diag}(0.012, 0.012, 0.022)$ kg·m² and $k_q = 0.016$ m (illustrative values).

:::figure widget=quaddrift caption="An uncontrolled quadrotor with all four motors at hover thrust except one, nudged by the imbalance you choose. A 0.01 N error, a thousandth of the weight, tips it and carries it off sideways within seconds."
:::end

## Worked example

1. Hover: $R = I$, $\boldsymbol\omega = 0$, so $T = mg = 9.81$ N and $T_i = 2.45$ N each.
2. Add $\Delta T = 0.01$ N to motor 3. That gives $\tau_y = \ell\Delta T = 2.2$ mN·m, so the pitch acceleration is $\alpha = 2.2\times10^{-3}/0.012 = 0.183$ rad/s².
3. The tilt grows as $\theta = \tfrac12\alpha t^2$, and the thrust's horizontal share gives $\ddot x \approx g\theta$. Integrating twice, $x = g\alpha t^4/24$: 7.5 cm after 1 s, 1.2 m after 2 s. Open-loop hover isn't a thing; the attitude loop is mandatory.

## Code it from scratch

:::code file=quad.py
```python
import numpy as np

m, l, g, kq = 1.0, 0.22, 9.81, 0.016
I = np.diag([0.012, 0.012, 0.022]); Iinv = np.linalg.inv(I)
arms = np.array([[l, 0, 0], [0, l, 0], [-l, 0, 0], [0, -l, 0]])
spin = np.array([1, -1, 1, -1])

def mixer_from_geometry():
    Mx = np.zeros((4, 4))
    for i in range(4):
        tau = np.cross(arms[i], [0, 0, 1.0]) + spin[i] * kq * np.array([0, 0, 1.0])
        Mx[:, i] = [1.0, *tau]
    return Mx

MIX = mixer_from_geometry()

def qmul(a, b):
    w1, x1, y1, z1 = a; w2, x2, y2, z2 = b
    return np.array([w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2, w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2,
                     w1 * y2 - x1 * z2 + y1 * w2 + z1 * x2, w1 * z2 + x1 * y2 - y1 * x2 + z1 * w2])

def rot(q):
    w, x, y, z = q
    return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - w * z), 2 * (x * z + w * y)],
                     [2 * (x * y + w * z), 1 - 2 * (x * x + z * z), 2 * (y * z - w * x)],
                     [2 * (x * z - w * y), 2 * (y * z + w * x), 1 - 2 * (x * x + y * y)]])

def f(s, thrusts, grav=True):
    p, v, q, w = s[:3], s[3:6], s[6:10], s[10:]
    wrench = MIX @ thrusts
    acc = rot(q) @ np.array([0, 0, wrench[0]]) / m - (np.array([0, 0, g]) if grav else 0)
    wd = Iinv @ (wrench[1:] - np.cross(w, I @ w))
    qd = 0.5 * qmul(q, np.array([0, *w]))
    return np.concatenate([v, acc, qd, wd])

def sim(s, thrusts, dt, n, grav=True):
    out = [s]
    for _ in range(n):
        k1 = f(s, thrusts, grav); k2 = f(s + dt / 2 * k1, thrusts, grav)
        k3 = f(s + dt / 2 * k2, thrusts, grav); k4 = f(s + dt * k3, thrusts, grav)
        s = s + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4); s[6:10] /= np.linalg.norm(s[6:10]); out.append(s)
    return np.array(out)

s0 = np.concatenate([np.zeros(3), np.zeros(3), [1, 0, 0, 0], np.zeros(3)])

def test_mixer():
    hand = np.array([[1, 1, 1, 1], [0, l, 0, -l], [-l, 0, l, 0], [kq, -kq, kq, -kq]])
    assert np.allclose(MIX, hand)
    want = np.array([9.81, 0.01, -0.02, 0.003])
    assert np.allclose(MIX @ np.linalg.solve(MIX, want), want)

def test_hover_thrust_is_mg():
    Th = np.linalg.solve(MIX, [m * g, 0, 0, 0])
    assert np.allclose(Th, m * g / 4) and abs(Th.sum() - m * g) < 1e-12
    traj = sim(s0.copy(), Th, 2e-3, 2500)
    print(f"hover thrust {Th.sum():.4f} N = mg; 5 s later the drone has moved {np.linalg.norm(traj[-1, :3]):.1e} m")
    assert np.linalg.norm(traj[-1, :3]) < 1e-9
    traj = sim(s0.copy(), Th * 1.01, 2e-3, 500)       # 1 % more thrust climbs at 0.01 g
    assert abs(traj[-1, 2] - 0.5 * 0.01 * g * 1.0 ** 2) < 1e-6

def test_imbalance_drift():
    Th = np.full(4, m * g / 4); Th[2] += 0.01
    traj = sim(s0.copy(), Th, 1e-3, 2000)
    alpha = l * 0.01 / I[1, 1]
    for t in (1.0, 2.0):
        k = int(t / 1e-3)
        x_pred = g * alpha * t ** 4 / 24
        print(f"t = {t:.0f} s: drift {traj[k, 0] * 100:6.2f} cm (small-angle prediction {x_pred * 100:6.2f} cm)")
        assert abs(traj[k, 0] - x_pred) / x_pred < 0.03

def test_torque_free_rotation():
    s = s0.copy(); s[10:] = [3.0, 0.2, 1.0]                 # tumbling, no gravity, thrusts zero
    traj = sim(s, np.zeros(4), 1e-3, 5000, grav=False)
    Lw = np.array([rot(x[6:10]) @ (I @ x[10:]) for x in traj])
    E = np.array([0.5 * x[10:] @ I @ x[10:] for x in traj])
    print(f"torque-free tumble: angular momentum drift {np.max(np.linalg.norm(Lw - Lw[0], axis=1)):.1e}, energy drift {np.ptp(E):.1e}")
    assert np.max(np.linalg.norm(Lw - Lw[0], axis=1)) < 1e-8 and np.ptp(E) < 1e-8

test_mixer()
test_hover_thrust_is_mg()
test_imbalance_drift()
test_torque_free_rotation()
print("PASS")
```
:::end

## Exercises

:::exercise
Which motors do you speed up, and which do you slow down, to yaw without changing total thrust, roll or pitch?
:::solution
Raise 1 and 3 by $\delta$ and lower 2 and 4 by $\delta$. Total thrust is unchanged, the roll and pitch torques cancel by symmetry, and $\tau_z = 4k_q\delta$. Yaw authority is weak because $k_q$ (1.6 cm) is much smaller than $\ell$ (22 cm).
:::end

:::exercise
In the "×" layout the arms sit at 45° to the body axes. What happens to the roll and pitch entries of the mixer?
:::solution
Each arm contributes $\pm\ell/\sqrt2$ to both roll and pitch, and all four motors take part in each. The maximum torque about a body axis stays the same in total, but it's shared between more motors, which is why most racing drones use ×.
:::end

## Quiz

:::quiz
- type: num
  q: Thrust in N per motor to hover a 1 kg quadrotor?
  answer: 2.4525
  tol: 0.001
  unit: N
  py: "9.81/4"
  explain: mg/4.
- type: num
  q: Pitch acceleration in rad/s² from a 0.01 N imbalance (ℓ = 0.22 m, I_yy = 0.012)?
  answer: 0.1833
  tol: 0.002
  unit: rad/s²
  py: "0.22*0.01/0.012"
  explain: ℓΔT/I.
- type: num
  q: Small-angle drift in m after 2 s from that imbalance?
  answer: 1.199
  tol: 0.01
  unit: m
  py: "9.81*0.1833*2**4/24"
  explain: gαt⁴/24.
- type: num
  q: Climb acceleration in m/s² with 1 % more than hover thrust?
  answer: 0.0981
  tol: 0.002
  unit: m/s²
  py: "0.01*9.81"
  explain: 0.01 g.
- type: mc
  q: What does the ω × Iω term describe?
  options:
    - gyroscopic coupling between axes
    - aerodynamic drag
    - gravity
    - motor lag
  answer: 0
  explain: It's zero when spinning about a single principal axis.
- type: mc
  q: Why use a quaternion for attitude?
  options:
    - no singularities and cheap normalisation
    - it's more accurate than physics
    - it removes gyroscopic effects
    - it's required for hover
  answer: 0
  explain: Euler angles have gimbal lock.
:::end
