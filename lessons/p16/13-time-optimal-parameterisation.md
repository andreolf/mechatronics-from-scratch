---
id: p16-l13
minutes: 45
summary: Once a path is fixed, the only freedom left is how fast to travel along it, and the fastest schedule rides the joint limits all the way. You derive the phase plane of path position and path speed, how velocity and acceleration limits become bounds on the path acceleration, and the maximum velocity curve. You implement time-optimal path parameterisation by reachability analysis, as TOPP-RA does, and test that it respects every limit and beats a constant-speed schedule.
---

## One degree of freedom left

A geometric path $q(s)$, $s \in [0, 1]$, says where to go. A time scaling $s(t)$ says when. By the chain rule,

$$\dot q = q'(s)\,\dot s, \qquad \ddot q = q'(s)\,\ddot s + q''(s)\,\dot s^2.$$

Each joint's limits $|\dot q_i| \le v_i$ and $|\ddot q_i| \le a_i$ become constraints on the pair $(\dot s, \ddot s)$ at each $s$. The problem is now one-dimensional: choose $\dot s$ as a function of $s$, as large as possible, so the trip is short.

## Work with $x = \dot s^2$

Let $x = \dot s^2$ and $u = \ddot s$. Then $dx/ds = 2u$: constant $u$ over a short stage makes $x$ linear in $s$. Along the stage, the limits read

$$q_i'^2\, x \le v_i^2, \qquad -a_i \le q_i'\, u + q_i''\, x \le a_i,$$

which are **linear** in $(x, u)$. At each $s$, the velocity limits and the condition that some $u$ satisfies all the acceleration limits give an upper bound on $x$: the **maximum velocity curve** (MVC) in the phase plane of $s$ against $\dot s$. Above it, no path acceleration keeps every joint within its limits.

## Reachability analysis

Split the path into stages $s_0 \dots s_N$, with $x_{k+1} = x_k + 2\Delta s\, u_k$.

1. **Backward pass.** The robot must stop: $x_N = 0$. For each stage from the end, the **controllable set** is the interval of $x_k$ from which some allowed $u_k$ lands inside the next stage's controllable set. With linear constraints, its ends come from two small linear programs.
2. **Forward pass.** From $x_0 = 0$, pick the largest allowed $u_k$ that stays inside the next controllable set.

The result is **bang-bang**: at every stage, some limit is active. The duration is $T = \sum 2\Delta s / (\sqrt{x_k} + \sqrt{x_{k+1}})$.

:::figure widget=topp caption="The phase plane of path position s and path speed. The red curve is the maximum velocity curve; the green profile is the time-optimal schedule, which touches it or rides an acceleration limit everywhere. Change the limits and watch the profile and the travel time respond."
:::end

## Worked example

An illustrative wavy path, $x = 2s$, $y = 0.4\sin(2\pi s)$, with $v_{max} = 1$ m/s and $a_{max} = 2$ m/s² on each axis, in 400 stages.

1. The time-optimal schedule takes 3.093 s. Peak speeds are 0.857 and 1.000 m/s, peak accelerations 2.000 m/s² on both axes; the largest constraint violation at the stages is $2 \times 10^{-14}$.
2. On 99.2 % of the stages, some limit is within 0.1 % of active.
3. The best schedule with a single constant path speed and linear ramps takes 3.297 s, 1.07 times longer.
4. Rebuilding $q(t)$ and differencing it in time, peak accelerations are 2.000 and 2.058 m/s². The limits hold exactly at the 400 stages; between them, $q''$ changes and the acceleration can exceed the limit by up to 2.9 %. Finer stages, or a small safety factor on the limits, close that gap.

## Code it from scratch

:::code file=topp.py
```python
import numpy as np
from scipy.optimize import linprog

VMAX, AMAX = np.array([1.0, 1.0]), np.array([2.0, 2.0])     # illustrative per-axis limits (m/s, m/s^2)
M = 400                                                     # path stages
s = np.linspace(0, 1, M + 1); ds = s[1] - s[0]

def path(s):
    """an illustrative wavy path in the plane: q(s), q'(s), q''(s) for s in [0, 1]"""
    w = 2 * np.pi
    q = np.stack([2 * s, 0.4 * np.sin(w * s)], 1)
    dq = np.stack([np.full_like(s, 2.0), 0.4 * w * np.cos(w * s)], 1)
    ddq = np.stack([np.zeros_like(s), -0.4 * w * w * np.sin(w * s)], 1)
    return q, dq, ddq

Q, dQ, ddQ = path(s)

def stage_constraints(k):
    """constraints at stage k as G @ [x, u] <= h, with x = sdot^2 and u = sddot (x' = 2u along s)"""
    G, h = [], []
    for i in range(2):
        G += [[ddQ[k, i], dQ[k, i]], [-ddQ[k, i], -dQ[k, i]]]; h += [AMAX[i], AMAX[i]]     # |q'' x + q' u| <= amax
        G += [[dQ[k, i]**2, 0.0]]; h += [VMAX[i]**2]                                       # (q' sdot)^2 <= vmax^2
    G += [[-1.0, 0.0]]; h += [0.0]                                                         # x >= 0
    return np.array(G), np.array(h)

def u_range(k, x):
    """interval of path accelerations allowed at stage k for a given x"""
    G, h = stage_constraints(k); lo, hi = -np.inf, np.inf
    for (gx, gu), hh in zip(G, h):
        r = hh - gx * x
        if abs(gu) < 1e-12:
            if r < -1e-9: return 1.0, -1.0                    # x itself infeasible
        elif gu > 0: hi = min(hi, r / gu)
        else: lo = max(lo, r / gu)
    return lo, hi

def topp():
    """reachability analysis as in TOPP-RA: a backward pass of controllable sets, then a greedy forward pass"""
    K = np.zeros((M + 1, 2)); K[M] = [0.0, 0.0]                # stop at the end
    for k in range(M - 1, -1, -1):
        G, h = stage_constraints(k)
        A = np.vstack([G, [[1, 2 * ds], [-1, -2 * ds]]]); b = np.concatenate([h, [K[k + 1, 1], -K[k + 1, 0]]])
        lo = linprog([1, 0], A_ub=A, b_ub=b, bounds=[(None, None)] * 2, method='highs')
        hi = linprog([-1, 0], A_ub=A, b_ub=b, bounds=[(None, None)] * 2, method='highs')
        K[k] = [lo.x[0], hi.x[0]]
    x = np.zeros(M + 1); u = np.zeros(M)
    for k in range(M):
        lo, hi = u_range(k, x[k])
        hi = min(hi, (K[k + 1, 1] - x[k]) / (2 * ds))          # stay inside the next controllable set
        u[k] = hi; x[k + 1] = max(0.0, x[k] + 2 * ds * u[k])
    return x, u

def duration(x):
    return np.sum(2 * ds / (np.sqrt(x[:-1]) + np.sqrt(x[1:])))

def test_respects_limits_and_is_fast():
    x, u = topp(); T = duration(x)
    worst = 0.0
    for k in range(M):
        G, h = stage_constraints(k); worst = max(worst, np.max(G @ [x[k], u[k]] - h))
    vel = dQ * np.sqrt(x)[:, None]; acc = ddQ[:-1] * x[:-1, None] + dQ[:-1] * u[:, None]
    print(f"time-optimal: {T:.4f} s; peak |velocity| {np.abs(vel).max(0).round(4)} m/s, peak |acceleration| {np.abs(acc).max(0).round(4)} m/s^2; worst constraint violation {worst:.1e}")
    assert worst < 1e-7 and x[0] == 0 and abs(x[-1]) < 1e-9
    # at every stage some constraint is tight: the profile is bang-bang along the limits
    slack = [np.max((G @ [x[k], u[k]]) / np.where(h > 0, h, 1)) for k in range(M) for G, h in [stage_constraints(k)]]
    print(f"stages with a limit within 0.1 % of active: {np.mean(np.array(slack) > 0.999) * 100:.1f} %")
    assert np.mean(np.array(slack) > 0.999) > 0.99
    # compare: the usual safe alternative, one constant path speed with linear ramps, as fast as the limits allow
    def feasible(sd, ar):
        xs = np.minimum.reduce([np.full(M + 1, sd**2), 2 * ar * s, 2 * ar * (1 - s)]); us = (xs[1:] - xs[:-1]) / (2 * ds)
        return all(np.all(stage_constraints(k)[0] @ [xs[k], us[k]] <= stage_constraints(k)[1] + 1e-12) for k in range(M)), xs
    best = np.inf
    for sd in np.linspace(0.05, 2.0, 40):
        lo, hi = 0.0, 50.0
        for _ in range(30):
            mid = (lo + hi) / 2; lo, hi = (mid, hi) if feasible(sd, mid)[0] else (lo, mid)
        if lo > 0: best = min(best, duration(feasible(sd, lo)[1]))
    print(f"best constant path speed with ramps: {best:.4f} s, {best / T:.2f} times longer")
    assert T < best
    return x, u

def test_time_domain_check():
    """rebuild s(t) with constant path acceleration in each stage, then difference q(s(t)) in time"""
    x, u = topp(); dt = 2 * ds / (np.sqrt(x[:-1]) + np.sqrt(x[1:])); t = np.concatenate([[0], np.cumsum(dt)])
    tf = np.linspace(0, t[-1], 40001); k = np.clip(np.searchsorted(t, tf, side='right') - 1, 0, M - 1); tau = tf - t[k]
    sf = s[k] + np.sqrt(x[k]) * tau + u[k] * tau**2 / 2
    qf = path(sf)[0]; v = np.gradient(qf, tf, axis=0); a = np.gradient(v, tf, axis=0)
    print(f"q(t) differenced in time: peak |v| {np.abs(v).max(0).round(3)} m/s, peak |a| {np.abs(a[5:-5]).max(0).round(3)} m/s^2")
    assert np.all(np.abs(v).max(0) <= VMAX * 1.01) and np.all(np.abs(a[5:-5]).max(0) <= AMAX * 1.03)

test_respects_limits_and_is_fast()
test_time_domain_check()
print("PASS")
```
:::end

## In practice

TOPP-RA, an open-source library by Hung Pham and Quang-Cuong Pham, implements this reachability approach for robot arms, with torque limits from the dynamics of Phase 15 as further linear constraints. MoveIt uses its own time parameterisation for the same task.

## Exercises

:::exercise
For a straight path with $|q'| = 1$ and $q'' = 0$, what does TOPP give?
:::solution
The constraints become $x \le v^2$ and $|u| \le a$, the same for all $s$. The schedule accelerates at $a$ until $\dot s = v$, cruises, and brakes at $a$: the trapezoid of lesson 03.
:::end

:::exercise
Why does the MVC dip where the path curves sharply?
:::solution
There $q''$ is large, so $q_i'' x$ alone uses up the acceleration budget: the centripetal-like term grows with $\dot s^2$. For a circle of radius $R$ at speed $v$, the normal acceleration $v^2/R$ must stay within the limit, so $v \le \sqrt{aR}$.
:::end

## Quiz

:::quiz
- type: num
  q: Path speed limit ṡ where |q'| = 2 m and the joint speed limit is 1 m/s?
  answer: 0.5
  tol: 0.001
  unit: 1/s
  py: "1/2"
  explain: "|q'| ṡ ≤ v."
- type: num
  q: Fastest speed round a curve of radius 0.5 m with a 2 m/s² acceleration limit?
  answer: 1
  tol: 0.001
  unit: m/s
  py: "math.sqrt(2*0.5)"
  explain: v²/R ≤ a.
- type: num
  q: Duration of a stage of Δs = 0.01 with ṡ² = 0.25 at both ends?
  answer: 0.02
  tol: 0.001
  unit: s
  py: "2*0.01/(math.sqrt(0.25)+math.sqrt(0.25))"
  explain: 2Δs/(√x_k + √x_k+1).
- type: num
  q: Path acceleration that takes x = ṡ² from 0.2 to 0.3 over Δs = 0.05?
  answer: 1
  tol: 0.001
  unit: 1/s²
  py: "(0.3-0.2)/(2*0.05)"
  explain: dx/ds = 2u.
- type: mc
  q: TOPP works in x = ṡ² because…
  options:
    - the limits become linear in x and u, and dx/ds = 2u
    - x is always positive
    - it removes the velocity limits
    - time is then linear in s
  answer: 0
  explain: Linear constraints make each stage a tiny linear program.
- type: mc
  q: The time-optimal profile has the property that…
  options:
    - at every point some limit is active
    - the path speed is constant
    - the jerk is minimal
    - all joints reach their limits together
  answer: 0
  explain: It is bang-bang along the limits.
:::end
