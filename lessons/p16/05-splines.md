---
id: p16-l05
minutes: 40
summary: Chaining cubics through many waypoints leaves jumps in acceleration at every join. A cubic spline removes them by choosing the slopes at the waypoints so that the curvature is continuous too. You derive the tridiagonal system for a natural cubic spline, solve it in linear time, and test that the spline passes through every waypoint, is C2 continuous at every knot, and matches SciPy's implementation to rounding error.
---

## One cubic per interval

Given knots $(x_0, y_0), \dots, (x_n, y_n)$, a **cubic spline** is a cubic on each interval $[x_i, x_{i+1}]$ such that the value, slope and second derivative are continuous at every interior knot. That is **C2 continuity**: no jumps in position, velocity or acceleration when $x$ is time.

Write $M_i = S''(x_i)$. Because $S''$ is linear on each interval, with $h_i = x_{i+1} - x_i$, $A = (x_{i+1} - x)/h_i$ and $B = 1 - A$:

$$S(x) = A y_i + B y_{i+1} + \frac{h_i^2}{6}\big[(A^3 - A) M_i + (B^3 - B) M_{i+1}\big].$$

This interpolates both knots and has continuous $S''$ by construction, for any $M$.

## The tridiagonal system

Requiring the slope to be continuous at each interior knot gives one equation per knot:

$$h_{i-1} M_{i-1} + 2(h_{i-1} + h_i) M_i + h_i M_{i+1} = 6\left(\frac{y_{i+1} - y_i}{h_i} - \frac{y_i - y_{i-1}}{h_{i-1}}\right).$$

That is $n - 1$ equations for $n + 1$ unknowns. Two **end conditions** close it. A **natural** spline sets $M_0 = M_n = 0$: no curvature at the ends. A **clamped** spline instead sets the end slopes, for example to zero for a move from rest. The matrix is tridiagonal and diagonally dominant, so it solves in $O(n)$ without pivoting.

Among all twice-differentiable curves through the knots, the natural spline minimises the bending energy $\int S''(x)^2 dx$. That is why it was named after the flexible strips draughtsmen bent through pins.

:::figure widget=spline caption="A natural cubic spline through draggable waypoints, with its curvature underneath. The curvature is piecewise linear and continuous, and zero at both ends. Turn on drag mode on a phone to move the points."
:::end

## Worked example

1. Knots $(0, 0), (1, 1), (2, 0)$, natural: the single equation is $4M_1 = 6(-1 - 1)$, so $M_1 = -3$. The slope at $x = 0$ is $1 - (2M_0 + M_1)/6 = 1.5$, and at the top it is 0.
2. Six illustrative waypoints of a joint angle over 6 s: the spline passes through all six. At the interior knots, value, slope and curvature jump by at most $1.1 \times 10^{-16}$.
3. It agrees with `scipy.interpolate.CubicSpline(bc_type='natural')` to $1.3 \times 10^{-15}$ in value, slope and curvature.
4. Its bending energy is 4.79, against 50.9 for the degree-5 polynomial through the same points.

## Code it from scratch

:::code file=spline.py
```python
import numpy as np
from scipy.interpolate import CubicSpline
from scipy.linalg import solve_banded

def natural_spline(x, y):
    """second derivatives M at the knots of the natural cubic spline (M_0 = M_n = 0), by a tridiagonal solve"""
    x, y = np.asarray(x, float), np.asarray(y, float); n = len(x) - 1; h = np.diff(x)
    rhs = 6 * (np.diff(y[1:]) / h[1:] - np.diff(y[:-1]) / h[:-1])          # n - 1 interior equations
    ab = np.zeros((3, n - 1))
    ab[0, 1:] = h[1:-1]; ab[1] = 2 * (h[:-1] + h[1:]); ab[2, :-1] = h[1:-1]   # super, main, sub diagonals
    M = np.zeros(n + 1); M[1:-1] = solve_banded((1, 1), ab, rhs)
    return M

def evaluate(x, y, M, t, d=0):
    """value (d = 0), slope (1) or curvature (2) of the spline at points t"""
    x, y = np.asarray(x, float), np.asarray(y, float)
    i = np.clip(np.searchsorted(x, t, side='right') - 1, 0, len(x) - 2)
    h = x[i + 1] - x[i]; A = (x[i + 1] - t) / h; B = (t - x[i]) / h
    if d == 0: return A * y[i] + B * y[i + 1] + ((A**3 - A) * M[i] + (B**3 - B) * M[i + 1]) * h**2 / 6
    if d == 1: return (y[i + 1] - y[i]) / h + (-(3 * A**2 - 1) * M[i] + (3 * B**2 - 1) * M[i + 1]) * h / 6
    return A * M[i] + B * M[i + 1]

def piece(x, y, M, k, t, d):
    """evaluate polynomial piece k at t, even outside its interval (to compare left and right limits at a knot)"""
    h = x[k + 1] - x[k]; A = (x[k + 1] - t) / h; B = (t - x[k]) / h
    return [A * y[k] + B * y[k + 1] + ((A**3 - A) * M[k] + (B**3 - B) * M[k + 1]) * h**2 / 6,
            (y[k + 1] - y[k]) / h + (-(3 * A**2 - 1) * M[k] + (3 * B**2 - 1) * M[k + 1]) * h / 6,
            A * M[k] + B * M[k + 1]][d]

X = np.array([0.0, 1.0, 2.5, 3.0, 4.5, 6.0])      # illustrative waypoints: time (s) and joint angle (rad)
Y = np.array([0.0, 0.6, 0.4, 0.9, 1.5, 1.2])

def test_interpolates_and_c2():
    M = natural_spline(X, Y)
    assert np.abs(evaluate(X, Y, M, X) - Y).max() < 1e-12
    jumps = [max(abs(piece(X, Y, M, k - 1, X[k], d) - piece(X, Y, M, k, X[k], d)) for k in range(1, len(X) - 1)) for d in range(3)]
    print("jumps at the interior knots: value {:.1e}, slope {:.1e}, curvature {:.1e}".format(*jumps))
    assert max(jumps) < 1e-12                                            # C2 continuity
    assert M[0] == 0 and M[-1] == 0                                      # natural end conditions

def test_matches_scipy():
    M = natural_spline(X, Y); ref = CubicSpline(X, Y, bc_type='natural'); t = np.linspace(0, 6, 1001)
    err = max(np.abs(evaluate(X, Y, M, t, d) - ref(t, d)).max() for d in range(3))
    print(f"largest difference from scipy's natural CubicSpline (value, slope, curvature): {err:.1e}")
    assert err < 1e-12

def test_three_knot_example():
    M = natural_spline([0, 1, 2], [0, 1, 0])
    s0, s1 = evaluate([0, 1, 2], [0, 1, 0], M, np.array([0.0, 1.0]), 1)
    print(f"knots (0,0), (1,1), (2,0): M1 = {M[1]:.4f}, slope at x = 0 {s0:.4f}, at x = 1 {s1:.1e}")
    assert abs(M[1] + 3) < 1e-12 and abs(s0 - 1.5) < 1e-12 and abs(s1) < 1e-12

def test_smoothest_interpolant():
    """the natural spline minimises the integral of y'' squared among all C2 interpolants: a polynomial through the same points bends more"""
    M = natural_spline(X, Y); t = np.linspace(0, 6, 60001)
    bend_s = np.trapezoid(evaluate(X, Y, M, t, 2)**2, t)
    p = np.polynomial.Polynomial.fit(X, Y, len(X) - 1); bend_p = np.trapezoid(p.deriv(2)(t)**2, t)
    print(f"bending energy: natural spline {bend_s:.3f}, degree-5 interpolating polynomial {bend_p:.3f}")
    assert bend_s < bend_p

test_interpolates_and_c2()
test_matches_scipy()
test_three_knot_example()
test_smoothest_interpolant()
print("PASS")
```
:::end

## Exercises

:::exercise
Why not fit one polynomial of degree $n$ through all $n + 1$ waypoints?
:::solution
High-degree interpolating polynomials oscillate between the knots, especially near the ends (Runge's phenomenon), and moving one waypoint changes the whole curve. The spline stays local and bounded: here the polynomial bends ten times more.
:::end

:::exercise
A robot must start and stop at rest along a spline through via points. Which end condition do you use?
:::solution
Clamped, with $S'(x_0) = S'(x_n) = 0$. The natural spline has zero curvature at the ends but generally non-zero slope, so the robot would start moving instantly.
:::end

## Quiz

:::quiz
- type: num
  q: Unknown coefficients in a cubic spline through 5 knots?
  answer: 16
  tol: 0.001
  py: "4*(5-1)"
  explain: Four per interval, four intervals.
- type: num
  q: Equations from continuity at the interior knots of a 5-knot spline (value on both sides, slope, curvature)?
  answer: 14
  tol: 0.001
  py: "2*4+2*3"
  explain: 8 interpolation conditions plus slope and curvature at 3 interior knots; the 2 end conditions make 16.
- type: num
  q: Natural spline through (0, 0), (1, 2), (2, 0) with h = 1. What is M₁?
  answer: -6
  tol: 0.001
  py: "6*(-2-2)/4"
  explain: 4M₁ = 6((0 − 2) − (2 − 0)).
- type: num
  q: Its slope at x = 0?
  answer: 3
  tol: 0.001
  py: "2-(2*0+(-6))/6"
  explain: (y₁ − y₀)/h − h(2M₀ + M₁)/6.
- type: mc
  q: A natural cubic spline sets…
  options:
    - the second derivative to zero at both ends
    - the slope to zero at both ends
    - the third derivative continuous
    - the end values free
  answer: 0
  explain: M₀ = Mₙ = 0.
- type: mc
  q: The spline system can be solved in O(n) because…
  options:
    - it is tridiagonal and diagonally dominant
    - it is triangular
    - it is orthogonal
    - the knots are equally spaced
  answer: 0
  explain: Each equation involves only a knot and its two neighbours.
:::end
