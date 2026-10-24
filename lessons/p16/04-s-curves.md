---
id: p16-l04
minutes: 40
summary: A trapezoidal profile changes acceleration instantly, and every such step rings a flexible load like a hammer blow. You derive the seven-segment jerk-limited S-curve, implement it with exact piecewise-cubic integration, test that it reaches the goal within the speed, acceleration and jerk limits, and simulate a 4 Hz flexible load to show that choosing the jerk time equal to the vibration period almost cancels the residual vibration.
---

## Seven segments

Limit the **jerk** $j = \dot a$ as well. The acceleration then ramps instead of stepping, and the move has up to seven segments:

1. jerk $+j_{max}$: acceleration ramps up to $a_{max}$, taking $T_j = a_{max}/j_{max}$;
2. jerk 0: constant acceleration $a_{max}$ for $T_a$;
3. jerk $-j_{max}$: acceleration ramps back down to zero, reaching $v_{max}$;
4. cruise at $v_{max}$ for $T_v$;
5. to 7. the mirror image, braking.

In the acceleration phase, the two ramps gain $j T_j^2/2$ of velocity each and the flat part $a_{max} T_a$. To reach $v_{max}$:

$$T_a = \frac{v_{max}}{a_{max}} - T_j,$$

which needs $v_{max} \ge a_{max}^2/j_{max}$. If not, $a_{max}$ is never reached: $T_a = 0$ and $T_j = \sqrt{v_{max}/j_{max}}$. By symmetry the phase covers $d_a = v_{max}(2T_j + T_a)/2$. If $2d_a > D$ there is no room to cruise, and the peak velocity is lowered until $2d_a = D$; the code does this by bisection.

## Why the jerk time matters

A flexible load (a long arm, a belt, a part on a spring) is a lightly damped oscillator driven by the axis acceleration:

$$\ddot e + 2\zeta\omega_n \dot e + \omega_n^2 e = -a(t).$$

A step in $a$ excites every frequency, and the load rings after the move ends. A linear ramp of duration $T_j$ is a step smoothed by a box of width $T_j$. That box's spectrum is zero at $f = 1/T_j, 2/T_j, \dots$, so when $T_j$ equals the vibration period, each ramp excites almost nothing at $f_n$. Choosing the jerk limit from the load's natural frequency costs a little time and removes most of the ringing. The same idea, applied as a filter on the command, is called **input shaping**.

:::figure widget=scurve caption="An S-curve move driving a 4 Hz flexible load, compared with a trapezoid. Set the jerk time to 0.25 s, one period, and watch the residual vibration nearly vanish."
:::end

## Worked example

An illustrative axis: $D = 0.5$ m, $v_{max} = 0.6$ m/s, $a_{max} = 2$ m/s², carrying a load with $f_n = 4$ Hz and $\zeta = 0.02$.

1. $j_{max} = 20$ m/s³: $T_j = 0.1$ s, $T_a = 0.2$ s, cruise 0.433 s, total 1.233 s.
2. $j_{max} = 8$ m/s³: $T_j = 0.25$ s, $T_a = 0.05$ s, total 1.383 s.
3. A 2 cm move can't reach $v_{max}$: the peak is lowered to 0.126 m/s.
4. Residual vibration after the move: trapezoid (1.133 s) 4.90 mm; S-curve with $T_j = 0.1$ s, 3.71 mm; S-curve with $T_j = 0.25$ s, 0.090 mm. That is 54 times less for 0.25 s more.

Limiting jerk alone helps only a little. Matching the jerk time to the load's period is what does the work.

## Code it from scratch

:::code file=scurve.py
```python
import numpy as np

def scurve(D, vmax, amax, jmax):
    """seven-segment jerk-limited rest-to-rest move. Returns the segment durations and jerks."""
    def accel_phase(v):                           # jerk time, constant-accel time, distance to reach v from rest
        tj = min(amax / jmax, np.sqrt(v / jmax)); ta = v / (jmax * tj) - tj
        return tj, ta, v * (2 * tj + ta) / 2
    v = vmax
    if 2 * accel_phase(v)[2] > D:                 # too short to reach vmax: lower the peak velocity (bisection)
        lo, hi = 0.0, vmax
        for _ in range(200):
            v = (lo + hi) / 2; lo, hi = (v, hi) if 2 * accel_phase(v)[2] < D else (lo, v)
        v = lo
    tj, ta, da = accel_phase(v); tv = (D - 2 * da) / v
    durs = [tj, ta, tj, tv, tj, ta, tj]
    jerks = [jmax, 0, -jmax, 0, -jmax, 0, jmax]
    return durs, jerks

def integrate(durs, jerks, t):
    """exact piecewise-cubic position, velocity, acceleration, jerk at times t"""
    p = v = a = 0.0; t0 = 0.0; out = np.zeros((4, len(t)))
    for d, j in zip(durs, jerks):
        m = (t >= t0) & (t < t0 + d); s = t[m] - t0
        out[:, m] = [p + v * s + a * s**2 / 2 + j * s**3 / 6, v + a * s + j * s**2 / 2, a + j * s, np.full_like(s, j)]
        p, v, a = p + v * d + a * d**2 / 2 + j * d**3 / 6, v + a * d + j * d**2 / 2, a + j * d; t0 += d
    out[:, t >= t0] = np.array([[p], [v], [a], [0]])
    return out, t0

def trapezoid(D, vmax, amax):
    ta = vmax / amax; tc = D / vmax - ta          # assumes the cruise exists
    return [ta, tc, ta], [amax, 0, -amax]

def residual(base_acc, t, fn=4.0, zeta=0.02):
    """a flexible load on the moving axis: deflection e'' + 2 zeta wn e' + wn^2 e = -base acceleration.
    Returns the largest deflection after the move ends."""
    wn = 2 * np.pi * fn; dt = t[1] - t[0]; e = de = 0.0; E = np.zeros(len(t))
    f = lambda e, de, u: (de, -2 * zeta * wn * de - wn**2 * e - u)
    for i in range(len(t) - 1):
        u0, u1 = base_acc[i], base_acc[i + 1]; um = (u0 + u1) / 2
        k1 = f(e, de, u0); k2 = f(e + dt / 2 * k1[0], de + dt / 2 * k1[1], um)
        k3 = f(e + dt / 2 * k2[0], de + dt / 2 * k2[1], um); k4 = f(e + dt * k3[0], de + dt * k3[1], u1)
        e += dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); de += dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]); E[i + 1] = e
    return E

D, V, A = 0.5, 0.6, 2.0                          # illustrative axis: 0.5 m move, 0.6 m/s, 2 m/s^2

def test_limits():
    t = np.linspace(0, 3, 300001)
    for J in (20.0, 8.0):
        durs, jerks = scurve(D, V, A, J); (p, v, a, j), T = integrate(durs, jerks, t)
        print(f"jerk limit {J:g} m/s^3: segments " + ", ".join(f"{d:.4f}" for d in durs) + f" s, total {T:.4f} s, peak v {v.max():.4f}, peak a {np.abs(a).max():.4f}")
        assert v.max() <= V + 1e-12 and np.abs(a).max() <= A + 1e-12 and np.abs(j).max() <= J + 1e-12
        assert abs(p[-1] - D) < 1e-12 and abs(v[-1]) < 1e-12 and abs(a[-1]) < 1e-12
    durs, jerks = scurve(0.02, V, A, 20.0); (p, v, a, j), T = integrate(durs, jerks, t)
    print(f"short 2 cm move: peak velocity lowered to {v.max():.4f} m/s, total {T:.4f} s")
    assert abs(p[-1] - 0.02) < 1e-9 and v.max() < V

def test_vibration_reduced():
    t = np.linspace(0, 3, 60001)
    trap_d, trap_j = trapezoid(D, V, A)
    acc_trap = np.select([t < trap_d[0], t < trap_d[0] + trap_d[1], t < sum(trap_d)], [A, 0, -A], 0)
    E_trap = residual(acc_trap, t); T_trap = sum(trap_d)
    res = {}
    for J in (20.0, 8.0):
        durs, jerks = scurve(D, V, A, J); (p, v, a, j), T = integrate(durs, jerks, t)
        E = residual(a, t); res[J] = (np.abs(E[t > T]).max(), T, durs[0])
    r_trap = np.abs(E_trap[t > T_trap]).max()
    print(f"4 Hz load, residual vibration after the move: trapezoid {r_trap * 1000:.2f} mm ({T_trap:.3f} s)")
    for J, (r, T, tj) in res.items():
        print(f"   S-curve, jerk {J:g} m/s^3 (jerk time {tj:.3f} s): {r * 1000:.3f} mm ({T:.3f} s)")
    assert res[20.0][0] < r_trap and res[8.0][0] < r_trap / 20   # a jerk time equal to the 0.25 s period nearly cancels it

test_limits()
test_vibration_reduced()
print("PASS")
```
:::end

## Exercises

:::exercise
How much velocity does one jerk ramp of 0.1 s at 20 m/s³ add?
:::solution
$j T_j^2/2 = 20 \times 0.01/2 = 0.1$ m/s. The acceleration rises from 0 to 2 m/s² during it, averaging 1 m/s² for 0.1 s.
:::end

:::exercise
The load's frequency drops from 4 Hz to 3 Hz when it carries a heavier part. What happens to the residual vibration with $T_j = 0.25$ s?
:::solution
The zero of the ramp's spectrum stays at 4 Hz, so the cancellation is lost and the load rings again, though less than with a trapezoid. Either retune $T_j$ to 0.333 s or use a shaper designed to be robust to frequency errors.
:::end

## Quiz

:::quiz
- type: num
  q: Jerk time to reach 3 m/s² at a jerk limit of 30 m/s³?
  answer: 0.1
  tol: 0.001
  unit: s
  py: "3/30"
  explain: amax/jmax.
- type: num
  q: Constant-acceleration time to reach 1.2 m/s with amax = 3 m/s² and a 0.1 s jerk time?
  answer: 0.3
  tol: 0.001
  unit: s
  py: "1.2/3-0.1"
  explain: vmax/amax − Tj.
- type: num
  q: Distance covered while accelerating to 1.2 m/s with those times?
  answer: 0.3
  tol: 0.001
  unit: m
  py: "1.2*(2*0.1+0.3)/2"
  explain: "Symmetric phase: v(2Tj + Ta)/2."
- type: num
  q: Jerk time that cancels the residual vibration of a 5 Hz load?
  answer: 0.2
  tol: 0.001
  unit: s
  py: "1/5"
  explain: One vibration period.
- type: mc
  q: How many segments does a full S-curve move have?
  options:
    - seven
    - three
    - five
    - nine
  answer: 0
  explain: Three to accelerate, one to cruise, three to brake.
- type: mc
  q: An S-curve with T_j equal to the load's period works because…
  options:
    - the ramp's spectrum has a zero at the load's natural frequency
    - it is slower
    - the load's damping increases
    - the jerk is zero during the ramp
  answer: 0
  explain: A ramp is a step smoothed by a box, and the box's spectrum is zero at multiples of 1/T_j.
:::end
