---
id: p16-l02
minutes: 35
summary: A path says where to go, and a trajectory also says when. You derive cubic and quintic polynomials from their boundary conditions, see why a cubic starts with a jump in acceleration while a quintic does not, implement both as small linear solves, and test that every boundary condition is met to rounding error and that the peak velocity and acceleration match the closed forms.
---

## Boundary conditions make the polynomial

Move a joint from $q_0$ to $q_f$ in time $T$. A **cubic** $q(t) = a_0 + a_1 t + a_2 t^2 + a_3 t^3$ has four coefficients, enough for four conditions: position and velocity at both ends.

$$q(0) = q_0,\quad \dot q(0) = v_0,\quad q(T) = q_f,\quad \dot q(T) = v_f.$$

The first two give $a_0 = q_0$, $a_1 = v_0$ directly. For a rest-to-rest move ($v_0 = v_f = 0$) with $D = q_f - q_0$, the last two give

$$a_2 = \frac{3D}{T^2}, \qquad a_3 = -\frac{2D}{T^3}.$$

The velocity $\dot q = 6D\,(t/T)(1 - t/T)/T$ peaks at mid-move at $1.5\,D/T$. The acceleration $6D/T^2$ at $t = 0$ is not zero: the motor is asked to go from no torque to full torque instantly.

## Quintic: acceleration too

A **quintic** has six coefficients, so it can also set the accelerations at both ends. For rest-to-rest with zero end accelerations, in normalised time $\tau = t/T$:

$$q = q_0 + D\,(10\tau^3 - 15\tau^4 + 6\tau^5).$$

Its peak velocity is $1.875\,D/T$ and its peak acceleration $\frac{10}{\sqrt 3} D/T^2 \approx 5.77\,D/T^2$, at $\tau = 0.5 \pm \frac{\sqrt3}{6}$. Starting and ending smoothly costs a little more peak speed, but the acceleration and the torque ramp up from zero.

In general the coefficients come from a small linear system: one row per condition, $\frac{d^k}{dt^k} t^n = \frac{n!}{(n - k)!} t^{n - k}$ evaluated at $0$ or $T$.

:::figure widget=polytraj caption="Position, velocity and acceleration of a cubic or quintic move. Watch the cubic's acceleration start and end with a jump, and the quintic's start from zero. Non-zero end velocities let you chain segments through via points."
:::end

## Worked example

Rest to rest, $D = 1$ rad in $T = 2$ s.

1. Cubic: $a_2 = 0.75$, $a_3 = -0.25$. Peak velocity $0.75$ rad/s at $t = 1$ s; acceleration $\pm 1.5$ rad/s² at the ends, jumping from zero.
2. Quintic: peak velocity $0.9375$ rad/s, peak acceleration $1.443$ rad/s², starting from exactly zero.
3. With non-zero end velocities and accelerations, the solved polynomials meet every condition to within $2 \times 10^{-15}$.
4. Three cubics chained through via points with chosen via velocities join with continuous velocity, but the acceleration jumps by 1.07 and 1.53 rad/s² at the joins. Splines (lesson 05) remove those jumps.

## Code it from scratch

:::code file=polytraj.py
```python
import numpy as np

def cubic(q0, qf, T, v0=0.0, vf=0.0):
    """coefficients a0..a3 of q(t) = sum a_k t^k meeting position and velocity at t = 0 and t = T"""
    A = np.array([[1, 0, 0, 0], [0, 1, 0, 0], [1, T, T**2, T**3], [0, 1, 2 * T, 3 * T**2]], float)
    return np.linalg.solve(A, [q0, v0, qf, vf])

def quintic(q0, qf, T, v0=0.0, vf=0.0, a0=0.0, af=0.0):
    """coefficients a0..a5 meeting position, velocity and acceleration at both ends"""
    A = np.array([[1, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0], [0, 0, 2, 0, 0, 0],
                  [1, T, T**2, T**3, T**4, T**5], [0, 1, 2 * T, 3 * T**2, 4 * T**3, 5 * T**4], [0, 0, 2, 6 * T, 12 * T**2, 20 * T**3]], float)
    return np.linalg.solve(A, [q0, v0, a0, qf, vf, af])

def evaluate(c, t, d=0):
    """d-th derivative of the polynomial with coefficients c (lowest power first) at times t"""
    p = np.polynomial.polynomial.Polynomial(c)
    return p.deriv(d)(t) if d else p(t)

def test_boundary_conditions():
    for c, n, conds in [(cubic(0.2, 1.4, 2.0, 0.3, -0.1), 2, [(0.2, 0.3), (1.4, -0.1)]),
                        (quintic(0.2, 1.4, 2.0, 0.3, -0.1, 0.5, 0.0), 3, [(0.2, 0.3, 0.5), (1.4, -0.1, 0.0)])]:
        err = max(abs(evaluate(c, t, d) - want[d]) for t, want in zip([0, 2.0], conds) for d in range(n))
        print(f"{'cubic' if n == 2 else 'quintic'}: largest boundary-condition error {err:.1e}")
        assert err < 1e-12

def test_rest_to_rest_peaks():
    D, T = 1.0, 2.0; t = np.linspace(0, T, 200001)
    c3, c5 = cubic(0, D, T), quintic(0, D, T)
    v3, a3 = np.abs(evaluate(c3, t, 1)).max(), np.abs(evaluate(c3, t, 2)).max()
    v5, a5 = np.abs(evaluate(c5, t, 1)).max(), np.abs(evaluate(c5, t, 2)).max()
    j3, j5 = np.abs(evaluate(c3, t, 3)).max(), np.abs(evaluate(c5, t, 3)).max()
    print(f"1 rad in 2 s, cubic: peak velocity {v3:.4f} rad/s, peak acceleration {a3:.4f} rad/s^2 (at the ends), jerk {j3:.3f}")
    print(f"1 rad in 2 s, quintic: peak velocity {v5:.4f} rad/s, peak acceleration {a5:.4f} rad/s^2, start acceleration {evaluate(c5, 0, 2):.1e}, peak jerk {j5:.3f}")
    assert abs(v3 - 1.5 * D / T) < 1e-9 and abs(a3 - 6 * D / T**2) < 1e-9
    assert abs(v5 - 1.875 * D / T) < 1e-9 and abs(a5 - 10 / np.sqrt(3) * D / T**2) < 1e-6
    assert abs(evaluate(c3, 0, 2)) > 1 and abs(evaluate(c5, 0, 2)) < 1e-12   # the cubic jumps from rest to 1.5 rad/s^2

def test_via_points_join_smoothly():
    """chain cubics through via points with chosen via velocities: velocity is continuous at each join"""
    qs, ts, vs = [0.0, 0.8, 0.5, 1.2], [0.0, 1.0, 2.5, 3.5], [0.0, 0.4, 0.2, 0.0]
    segs = [cubic(qs[i], qs[i + 1], ts[i + 1] - ts[i], vs[i], vs[i + 1]) for i in range(3)]
    jumps = [abs(evaluate(segs[i], ts[i + 1] - ts[i], 1) - evaluate(segs[i + 1], 0, 1)) for i in range(2)]
    acc_jumps = [abs(evaluate(segs[i], ts[i + 1] - ts[i], 2) - evaluate(segs[i + 1], 0, 2)) for i in range(2)]
    print(f"three cubics through via points: velocity jumps {max(jumps):.1e}, acceleration jumps {', '.join(f'{a:.2f}' for a in acc_jumps)} rad/s^2")
    assert max(jumps) < 1e-12 and min(acc_jumps) > 0.1                # C1 but not C2: splines (lesson 05) fix that

test_boundary_conditions()
test_rest_to_rest_peaks()
test_via_points_join_smoothly()
print("PASS")
```
:::end

## Exercises

:::exercise
Derive $a_2$ and $a_3$ for the rest-to-rest cubic.
:::solution
With $a_0 = q_0$ and $a_1 = 0$: $a_2 T^2 + a_3 T^3 = D$ and $2 a_2 T + 3 a_3 T^2 = 0$. The second gives $a_2 = -\tfrac32 a_3 T$; substituting, $-\tfrac12 a_3 T^3 = D$, so $a_3 = -2D/T^3$ and $a_2 = 3D/T^2$.
:::end

:::exercise
A move must take at most 0.9 rad/s on a joint with $D = 1.2$ rad. What is the shortest $T$ for a cubic and for a quintic?
:::solution
Cubic: $1.5 \times 1.2 / T \le 0.9$, so $T \ge 2.0$ s. Quintic: $1.875 \times 1.2 / T \le 0.9$, so $T \ge 2.5$ s. The smoother start costs 25 % more time under a velocity limit.
:::end

## Quiz

:::quiz
- type: num
  q: Peak velocity of a rest-to-rest cubic moving 0.6 rad in 1.5 s?
  answer: 0.6
  tol: 0.001
  unit: rad/s
  py: "1.5*0.6/1.5"
  explain: 1.5 D/T.
- type: num
  q: Peak velocity of a rest-to-rest quintic moving 0.6 rad in 1.5 s?
  answer: 0.75
  tol: 0.001
  unit: rad/s
  py: "1.875*0.6/1.5"
  explain: 1.875 D/T.
- type: num
  q: Starting acceleration of a rest-to-rest cubic with D = 1 rad and T = 0.5 s?
  answer: 24
  tol: 0.001
  unit: rad/s²
  py: "6*1/0.5**2"
  explain: 6D/T², applied instantly at t = 0.
- type: num
  q: Normalised quintic position 10τ³ − 15τ⁴ + 6τ⁵ at τ = 0.25?
  answer: 0.1035
  tol: 0.002
  py: "10*0.25**3-15*0.25**4+6*0.25**5"
  explain: A quarter of the way through the time, about a tenth of the way.
- type: mc
  q: How many boundary conditions does a quintic satisfy?
  options:
    - six
    - four
    - five
    - three
  answer: 0
  explain: Position, velocity and acceleration at both ends.
- type: mc
  q: The main drawback of a cubic for a rest-to-rest move is that…
  options:
    - its acceleration jumps at the start and end
    - it can't reach the goal exactly
    - its velocity is not zero at the ends
    - it overshoots the goal
  answer: 0
  explain: A step in acceleration is a step in torque, which excites vibration.
:::end
