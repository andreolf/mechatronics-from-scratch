---
id: p15-l08
minutes: 40
summary: At a singular pose the Jacobian loses rank, and the pseudo-inverse responds with enormous joint speeds; damped least squares trades a little accuracy for bounded motion everywhere. You derive the damped step as the solution of a regularised least-squares problem, show through the singular values why its gain can never exceed one over twice the damping, drive the arm lab's arm out past full stretch, and test that its joint speeds stay bounded while the pseudo-inverse's explode.
---

## What goes wrong at a singularity

Velocity control of an arm, called **resolved-rate** control, asks for joint speeds $\dot q$ that produce a tool velocity $v$: $J\dot q = v$. Write $J = U\Sigma V^T$ (singular value decomposition). The pseudo-inverse gives

$$\dot q = J^+v = \sum_i \frac{1}{\sigma_i}\,v_i\,(u_i^Tv), \quad v_i \text{ the columns of } V.$$

As the arm approaches full stretch, $q_2 \to 0$, the smallest singular value $\sigma_2 \to 0$, and any request with a component along $u_2$ (here, straight out along the arm) gets a joint speed proportional to $1/\sigma_2$. At the singularity itself, the request is impossible and the speed is unbounded.

## Damped least squares

Instead of solving $J\dot q = v$ exactly, minimise a cost that also charges for joint speed:

$$\min_{\dot q}\;\|J\dot q - v\|^2 + \lambda^2\|\dot q\|^2 \quad\Rightarrow\quad \dot q = J^T(JJ^T + \lambda^2 I)^{-1}v.$$

In terms of singular values, each $1/\sigma_i$ becomes

$$\frac{\sigma_i}{\sigma_i^2 + \lambda^2} \le \frac{1}{2\lambda},$$

with equality at $\sigma_i = \lambda$. Far from singularities ($\sigma_i \gg \lambda$) this is almost $1/\sigma_i$, so DLS tracks nearly exactly. Near them it gracefully gives up on the impossible direction. The price is a small tracking error everywhere, which a feedback term on the position error mostly removes. The [arm lab](#lab-arm) uses DLS with $\lambda = 0.08$ m.

:::figure widget=dlsdemo caption="The target slides out along a line and past the edge of the workspace. Compare the joint speeds under the pseudo-inverse and under damped least squares, and change the damping to trade tracking accuracy for smoothness."
:::end

## Worked example

Resolved-rate control with position feedback ($\dot q = \text{step}(v_d + 20\,e)$), the target moving at 0.2 m/s along $y = 0.3$ m from inside the workspace to beyond the 1.8 m reach:

1. The pseudo-inverse peaks at about $2 \times 10^5$ rad/s as the arm reaches full stretch: in practice, a fault.
2. DLS with $\lambda = 0.08$ peaks at 1.8 rad/s; the arm stretches towards the target and stops, 0.57 m short because the target is out of reach.
3. At $q_2 = 1°$, $\sigma_2 = 0.0071$: 1 m/s along the weak direction needs 141 rad/s from the pseudo-inverse, but only 1.1 rad/s from DLS. The bound is $1/(2 \times 0.08) = 6.25$ rad/s.
4. The cost: at the lab's start pose DLS delivers the requested velocity to within 2.7 %.

## Code it from scratch

:::code file=dls.py
```python
import numpy as np

L = np.array([1.0, 0.8])                      # the arm lab's links (m)
LAMBDA = 0.08                                 # the lab's damping (m)

def fk(q): a = np.cumsum(q); return np.array([L @ np.cos(a), L @ np.sin(a)])
def jac(q):
    a = np.cumsum(q); return np.array([[-L @ np.sin(a), -L[1] * np.sin(a[1])], [L @ np.cos(a), L[1] * np.cos(a[1])]])

def step_pinv(J, v, lam): return np.linalg.pinv(J) @ v
def step_dls(J, v, lam):   # J^T (J J^T + lambda^2 I)^-1 v
    return J.T @ np.linalg.solve(J @ J.T + lam ** 2 * np.eye(2), v)

def track(step, lam=LAMBDA, speed=0.2, k=20.0, dt=1e-3, T=4.0):
    """resolved-rate control: the target slides along y = 0.3 out past the reach limit; dq = step(J, v_d + k e)"""
    q = np.radians([20.0, -60.0]); x0 = fk(q); qdmax, errs, qs = 0.0, [], []
    for i in range(int(T / dt)):
        t = i * dt
        xd = np.array([x0[0] + speed * t, x0[1] + (0.3 - x0[1]) * min(1, t / 0.5)])
        vd = np.array([speed, (0.3 - x0[1]) / 0.5 if t < 0.5 else 0.0])
        e = xd - fk(q)
        qd = step(jac(q), vd + k * e, lam)
        qdmax = max(qdmax, np.abs(qd).max()); q = q + dt * qd
        errs.append(np.linalg.norm(e)); qs.append(q.copy())
    return qdmax, np.array(errs), np.array(qs)

def test_dls_bounded_at_singularity():
    p_max, p_err, _ = track(step_pinv)
    d_max, d_err, _ = track(step_dls)
    print(f"pseudo-inverse: peak joint speed {p_max:9.1f} rad/s")
    print(f"DLS (lambda = {LAMBDA}): peak joint speed {d_max:6.2f} rad/s, final error {d_err[-1] * 1000:.0f} mm (target beyond reach)")
    assert p_max > 100 and d_max < 10

def test_singular_value_filter():
    # DLS gain on each singular direction is s/(s^2 + lambda^2): never more than 1/(2 lambda)
    for s in np.logspace(-4, 1, 200):
        assert s / (s * s + LAMBDA ** 2) <= 1 / (2 * LAMBDA) + 1e-12
    U, S, Vt = np.linalg.svd(jac(np.radians([30, 1.0])))
    v = U[:, 1]                                                   # ask for motion along the weak direction
    for lam in (0, LAMBDA):
        qd = step_dls(jac(np.radians([30, 1.0])), v, lam) if lam else step_pinv(jac(np.radians([30, 1.0])), v, 0)
        print(f"lambda = {lam:4.2f}: smallest singular value {S[1]:.4f}, joint speed for 1 m/s along it {np.linalg.norm(qd):7.2f} rad/s")
    assert np.linalg.norm(step_dls(jac(np.radians([30, 1.0])), v, LAMBDA)) <= 1 / (2 * LAMBDA) + 1e-9

def test_damping_costs_accuracy_far_from_singularity():
    q = np.radians([60, -70]); J = jac(q); v = np.array([0.1, 0.0])
    err = np.linalg.norm(J @ step_dls(J, v, LAMBDA) - v) / 0.1
    print(f"away from the singularity, DLS tracks the requested velocity within {err * 100:.2f} %")
    assert err < 0.03

test_dls_bounded_at_singularity()
test_singular_value_filter()
test_damping_costs_accuracy_far_from_singularity()
print("PASS")
```
:::end

## Exercises

:::exercise
How would you choose $\lambda$ in practice?
:::solution
From the joint speed limit. The worst-case gain is $1/(2\lambda)$ per unit of commanded tool speed, so $\lambda \ge v_{max}/(2\dot q_{max})$. Many implementations go further and vary $\lambda$, using zero far from singularities and raising it only when the smallest singular value (or the manipulability) drops below a threshold.
:::end

:::exercise
Is the singularity at full stretch a problem for position IK, or only for velocity control?
:::solution
Both. Newton IK (lesson 07) uses the same $J^+$ step, so near full stretch it takes huge steps and can jump to the wrong branch or diverge. DLS IK is the standard fix there too, and it is what the lab runs.
:::end

## Quiz

:::quiz
- type: num
  q: Maximum DLS gain per singular direction with λ = 0.08 m?
  answer: 6.25
  tol: 0.001
  unit: rad/m
  py: "1/(2*0.08)"
  explain: σ/(σ² + λ²) peaks at σ = λ.
- type: num
  q: Pseudo-inverse gain along a direction with σ = 0.01?
  answer: 100
  tol: 0.001
  unit: rad/m
  py: "1/0.01"
  explain: 1/σ.
- type: num
  q: DLS gain along that direction with λ = 0.08?
  answer: 1.5385
  tol: 0.002
  unit: rad/m
  py: "0.01/(0.01**2+0.08**2)"
  explain: σ/(σ² + λ²).
- type: num
  q: Manipulability det J of the lab arm at q2 = 1°?
  answer: 0.013962
  tol: 0.002
  unit: m²
  py: "0.8*math.sin(math.radians(1))"
  explain: l1 l2 sin q2, nearly zero.
- type: mc
  q: Damped least squares minimises…
  options:
    - tracking error squared plus λ² times joint speed squared
    - joint speed only
    - tracking error only
    - the condition number of J
  answer: 0
  explain: A regularised least-squares problem.
- type: mc
  q: Far from singularities, DLS…
  options:
    - is almost identical to the pseudo-inverse
    - is always much slower
    - cannot move the tool
    - needs a larger λ
  answer: 0
  explain: σ ≫ λ, so σ/(σ² + λ²) ≈ 1/σ.
:::end
