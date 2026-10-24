---
id: p16-l03
minutes: 35
summary: Motor drives move axes with a trapezoidal velocity profile, accelerating at the limit, cruising at the speed limit and braking at the limit. You derive when the move is a trapezoid and when it is too short and becomes a triangle, implement the profile and a multi-axis version that finishes every axis together, and test that it reaches the goal exactly without ever exceeding either limit.
---

## Accelerate, cruise, brake

An axis must move a distance $D$ from rest to rest, with speed at most $v_{max}$ and acceleration at most $a_{max}$. The fastest way is to accelerate at $a_{max}$, cruise at $v_{max}$, then brake at $a_{max}$: the velocity is a **trapezoid**.

Reaching $v_{max}$ takes $t_a = v_{max}/a_{max}$ and covers $\tfrac12 v_{max} t_a = v_{max}^2/(2a_{max})$; braking covers the same. What is left is cruised:

$$t_c = \frac{D - v_{max}^2/a_{max}}{v_{max}}, \qquad T = 2t_a + t_c = \frac{D}{v_{max}} + \frac{v_{max}}{a_{max}}.$$

## Too short to reach full speed

If $D < v_{max}^2/a_{max}$, then $t_c$ would be negative. The axis must start braking before it reaches $v_{max}$, and the profile is a **triangle** with a lower peak:

$$v_p = \sqrt{a_{max} D}, \qquad T = 2\sqrt{D/a_{max}}.$$

Either way, the move is **bang-coast-bang**: at every instant, either the acceleration or the speed is at its limit. No other profile within the limits is faster, because the area under $v(t)$ must be $D$, and these curves rise and fall as steeply as allowed.

## Several axes together

A gantry moving in $x$, $y$ and $z$ should arrive on all axes at once, or the tool travels a dog-leg path. Plan the slowest axis first, then scale the limits of the others so their moves take the same time $T$. Scaling both $v$ and $a$ by the same factor keeps each profile's shape.

:::figure widget=trapprofile caption="A trapezoidal velocity profile with the speed and acceleration limits shaded. Shorten the move until the cruise disappears and the trapezoid becomes a triangle with a lower peak."
:::end

## Worked example

1. $D = 1$ m, $v_{max} = 0.5$ m/s, $a_{max} = 1$ m/s²: since $v^2/a = 0.25 < 1$, it is a trapezoid. Accelerate for 0.5 s, cruise 1.5 s, total 2.5 s.
2. $D = 0.1$ m with the same limits: a triangle with peak $\sqrt{0.1} = 0.316$ m/s, total 0.632 s.
3. $D = 2$ m, $v_{max} = 1.2$ m/s, $a_{max} = 0.8$ m/s²: accelerate 1.5 s, cruise only 0.167 s, total 3.167 s.
4. Lowering either limit by 5 % makes the 1 m move take at least 2.526 s, so 2.5 s is the minimum.
5. Three axes moving 0.8, 0.2 and −0.5 m with the same limits all finish at 2.1 s.

## Code it from scratch

:::code file=trapezoid.py
```python
import numpy as np

def trapezoid(D, vmax, amax):
    """rest-to-rest move of distance D >= 0: returns (accel time, cruise time, peak velocity, total time)"""
    if D >= vmax**2 / amax:                       # long enough to reach vmax: trapezoid
        ta, vp = vmax / amax, vmax
        tc = (D - vmax**2 / amax) / vmax
    else:                                         # too short: triangle, peak below vmax
        vp = np.sqrt(amax * D); ta, tc = vp / amax, 0.0
    return ta, tc, vp, 2 * ta + tc

def sample(D, vmax, amax, t):
    """position, velocity and acceleration of the profile at times t (exact, piecewise quadratic)"""
    ta, tc, vp, T = trapezoid(D, vmax, amax); a = vp / ta
    t = np.clip(t, 0, T); p = np.empty_like(t); v = np.empty_like(t); acc = np.empty_like(t)
    m1, m2 = t < ta, (t >= ta) & (t < ta + tc); m3 = ~(m1 | m2)
    p[m1] = a * t[m1]**2 / 2; v[m1] = a * t[m1]; acc[m1] = a
    p[m2] = a * ta**2 / 2 + vp * (t[m2] - ta); v[m2] = vp; acc[m2] = 0
    r = T - t[m3]; p[m3] = D - a * r**2 / 2; v[m3] = a * r; acc[m3] = -a
    return p, v, acc

def synchronise(Ds, vmax, amax):
    """several axes, one move: stretch the faster axes to finish with the slowest, by scaling their limits"""
    T = max(trapezoid(abs(D), v, a)[3] for D, v, a in zip(Ds, vmax, amax))
    out = []
    for D, v, a in zip(Ds, vmax, amax):
        lo, hi = 0.0, 1.0                         # bisect one scale k applied to both limits
        for _ in range(100):
            k = (lo + hi) / 2
            lo, hi = (k, hi) if trapezoid(abs(D), v * k, a * k)[3] > T else (lo, k)
        out.append((hi * v, hi * a))
    return T, out

def test_limits_and_goal():
    t = np.linspace(0, 4, 400001)
    for D, v, a in [(1.0, 0.5, 1.0), (0.1, 0.5, 1.0), (2.0, 1.2, 0.8)]:
        ta, tc, vp, T = trapezoid(D, v, a)
        p, vel, acc = sample(D, v, a, t)
        kind = "trapezoid" if tc > 0 else "triangle"
        print(f"D = {D} m, vmax = {v} m/s, amax = {a} m/s^2: {kind}, peak {vp:.4f} m/s, accel {ta:.4f} s, cruise {tc:.4f} s, total {T:.4f} s")
        assert vel.max() <= v + 1e-12 and np.abs(acc).max() <= a + 1e-12      # never exceeds the limits
        assert abs(p[-1] - D) < 1e-12 and abs(vel[-1]) < 1e-12 and np.all(np.diff(p) >= -1e-15)
        # position matches the integral of velocity (the sampled profile is self-consistent)
        assert abs(np.trapezoid(vel, t) - D) < 1e-6

def test_time_optimal():
    """bang-coast-bang is the fastest: any slower peak or acceleration takes longer"""
    D, v, a = 1.0, 0.5, 1.0; T = trapezoid(D, v, a)[3]
    slower = [trapezoid(D, v * k, a)[3] for k in (0.6, 0.8, 0.95)] + [trapezoid(D, v, a * k)[3] for k in (0.6, 0.8, 0.95)]
    print(f"minimum time {T:.4f} s; with lower limits it takes {min(slower):.4f} s or more")
    assert min(slower) > T

def test_synchronised_axes():
    T, lim = synchronise([0.8, 0.2, -0.5], [0.5, 0.5, 0.5], [1.0, 1.0, 1.0])
    ends = [trapezoid(abs(D), v, a)[3] for D, (v, a) in zip([0.8, 0.2, -0.5], lim)]
    print(f"three axes finish together at {T:.4f} s: " + ", ".join(f"{e:.4f}" for e in ends) + " s")
    assert max(abs(e - T) for e in ends) < 1e-9

test_limits_and_goal()
test_time_optimal()
test_synchronised_axes()
print("PASS")
```
:::end

## Exercises

:::exercise
Show that the trapezoid's total time is $D/v_{max} + v_{max}/a_{max}$.
:::solution
$T = 2t_a + t_c = 2\frac{v}{a} + \frac{D - v^2/a}{v} = \frac{2v}{a} + \frac{D}{v} - \frac{v}{a} = \frac{D}{v} + \frac{v}{a}$. Compared with an instant jump to full speed ($D/v$), the limited acceleration costs exactly $v/a$.
:::end

:::exercise
Doubling $v_{max}$ on a long move doesn't halve the time. Why?
:::solution
$T = D/v + v/a$: the first term halves, but the second doubles because it takes longer to reach the higher speed. For short moves, it doesn't help at all once the profile is a triangle.
:::end

## Quiz

:::quiz
- type: num
  q: Total time to move 3 m with vmax = 1 m/s and amax = 2 m/s²?
  answer: 3.5
  tol: 0.001
  unit: s
  py: "3/1+1/2"
  explain: D/v + v/a, since v²/a = 0.5 m is less than 3 m.
- type: num
  q: Shortest move that still reaches vmax = 1 m/s with amax = 2 m/s²?
  answer: 0.5
  tol: 0.001
  unit: m
  py: "1**2/2"
  explain: v²/a, half for accelerating and half for braking.
- type: num
  q: Peak velocity of a 0.2 m move with vmax = 1 m/s and amax = 2 m/s²?
  answer: 0.6325
  tol: 0.002
  unit: m/s
  py: "math.sqrt(2*0.2)"
  explain: "Triangle: √(a D)."
- type: num
  q: Total time of that 0.2 m move?
  answer: 0.6325
  tol: 0.002
  unit: s
  py: "2*math.sqrt(0.2/2)"
  explain: 2√(D/a).
- type: mc
  q: The trapezoidal profile is time-optimal because…
  options:
    - at every instant it accelerates, brakes or cruises at a limit
    - it has the lowest jerk
    - its acceleration is continuous
    - it uses the least energy
  answer: 0
  explain: Bang-coast-bang uses the full acceleration or the full speed at every instant.
- type: mc
  q: Its main weakness is that…
  options:
    - acceleration jumps instantly, which means infinite jerk
    - it can overshoot the target
    - it can exceed the speed limit
    - it can't do short moves
  answer: 0
  explain: Steps in acceleration excite vibration; S-curves (lesson 04) limit jerk.
:::end
