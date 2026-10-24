---
id: p13-l14
minutes: 45
summary: The Nyquist criterion decides closed-loop stability from the open-loop frequency response alone, by counting how many times the plot of L around the whole right half-plane contour encircles the point minus one, and it handles unstable plants and integrators that Bode-based margins cannot. You derive it from the argument principle, implement an adaptive contour with indentations around imaginary-axis poles, and test that N = Z minus P predicts stability correctly in 11 cases checked against the closed-loop roots.
---

## The argument principle

Trace a closed contour in the $s$-plane clockwise. For a rational function $F(s)$, the image $F(s)$ encircles the origin clockwise

$$N = Z - P$$

times, where $Z$ and $P$ count the zeros and poles of $F$ inside the contour.

## Applying it to feedback

Take $F = 1 + L$. Its zeros are the closed-loop poles; its poles are the open-loop poles. Choose the **Nyquist contour**: up the imaginary axis and round a huge semicircle enclosing the right half-plane. Encircling the origin by $1 + L$ is the same as $L$ encircling $-1$. So

$$Z = N + P,$$

where $P$ is the number of open-loop right-half-plane poles and $N$ the clockwise encirclements of $-1$ by $L(j\omega)$. Stable means $Z = 0$: an open-loop stable plant ($P = 0$) must not encircle $-1$; an unstable one must encircle it counter-clockwise $P$ times.

**Poles on the imaginary axis** (integrators, undamped pairs) sit on the contour. Detour round them on tiny semicircles to the right; there $L$ swings round a huge arc, which is where most hand-drawn plots go wrong.

:::figure widget=nyquistplot caption="The Nyquist plot of a loop with an integrator and the critical point −1. Raise the gain until the plot wraps around −1: the count of encirclements switches and the closed loop goes unstable."
:::end

## Worked example

$L = \dfrac{K}{(s - 1)(s + 2)}$: one open-loop RHP pole, $P = 1$.

1. At $\omega = 0$, $L = -K/2$. As $\omega \to \infty$, $L \to 0$ from below; the plot is a loop through $-K/2$.
2. For $K = 3$ the plot crosses the real axis at $-1.5$, left of $-1$, and circles $-1$ once counter-clockwise: $N = -1$, $Z = 0$. Stable: the characteristic polynomial $s^2 + s + 1$ confirms it.
3. For $K = 1$ it crosses at $-0.5$ and doesn't encircle $-1$: $N = 0$, $Z = 1$. Unstable ($s^2 + s - 1$ has a root at 0.62).

## Code it from scratch

:::code file=nyquist.py
```python
import numpy as np

def winding(F, path, t0=0.0, t1=1.0, depth=0):
    """total change of arg F(path(t)) over [t0, t1], subdividing until each step is small"""
    a, b = F(path(t0)), F(path(t1))
    d = np.angle(b / a)
    if (abs(d) < 0.2 or depth > 50) and depth > 6:
        return d
    tm = (t0 + t1) / 2
    return winding(F, path, t0, tm, depth + 1) + winding(F, path, tm, t1, depth + 1)

def axis_pt(a, b, t):
    """frequency between a and b, spaced like asinh so that low frequencies get fine steps"""
    return np.sinh(np.arcsinh(a) + (np.arcsinh(b) - np.arcsinh(a)) * t)

def nyquist_N(num, den, R=1e4, eps=1e-4):
    """clockwise encirclements of -1 by L = num/den along the indented Nyquist contour"""
    L = lambda s: np.polyval(num, s) / np.polyval(den, s)
    F = lambda s: 1 + L(s)
    axis = sorted({round(r.imag, 9) for r in np.roots(den) if abs(r.real) < 1e-9})
    pieces, w0 = [], -R
    for wp in axis:                                       # straight up the axis, small right detours at each pole
        pieces.append(lambda t, a=w0, b=wp - eps: 1j * axis_pt(a, b, t))
        pieces.append(lambda t, c=wp: 1j * c + eps * np.exp(1j * (-np.pi / 2 + np.pi * t)))
        w0 = wp + eps
    pieces.append(lambda t, a=w0: 1j * axis_pt(a, R, t))
    pieces.append(lambda t: R * np.exp(1j * (np.pi / 2 - np.pi * t)))     # big arc, clockwise
    total = sum(winding(F, p) for p in pieces)
    return -int(round(total / (2 * np.pi)))               # counter-clockwise arg change -> clockwise count

CASES = [   # (description, numerator, denominator)
    ("4/(s+1)^3", [4], np.poly([-1, -1, -1])),
    ("10/(s+1)^3", [10], np.poly([-1, -1, -1])),
    ("3/(s(s+1)(s+2))", [3], np.poly([0, -1, -2])),
    ("8/(s(s+1)(s+2))", [8], np.poly([0, -1, -2])),
    ("3/((s-1)(s+2))", [3], np.poly([1, -2])),
    ("1/((s-1)(s+2))", [1], np.poly([1, -2])),
    ("10(s+1)/(s^2(s+5))", [10, 10], np.poly([0, 0, -5])),
    ("1/(s^2(s+1))", [1], np.poly([0, 0, -1])),
    ("4(s+2)/((s-1)(s+5))", [4, 8], np.poly([1, -5])),
    ("2(s+2)/((s-1)(s+5))", [2, 4], np.poly([1, -5])),
    ("1/((s^2+4)(s+1))", [1], np.real(np.poly([2j, -2j, -1]))),
]

def test_predicts_stability():
    for name, num, den in CASES:
        num, den = np.array(num, float), np.array(den, float)
        N = nyquist_N(num, den)
        P = int(np.sum(np.roots(den).real > 1e-9))
        Z = N + P
        cl = np.roots(np.polyadd(den, num))
        Z_true = int(np.sum(cl.real > 1e-9))
        print(f"{name:22s}: P = {P}, N = {N:+d} -> Z = {Z} ({'stable' if Z == 0 else 'unstable'}); closed-loop roots give {Z_true}")
        assert Z == Z_true
    print(f"{len(CASES)} cases predicted correctly")

test_predicts_stability()
print("PASS")
```
:::end

## Exercises

:::exercise
Why is a loop with $L = 1/(s^2(s + 1))$ unstable for every positive gain?
:::solution
The double integrator sends the indentation's image round a full 360° arc at infinite radius, and with the $(s + 1)$ lag the plot then passes on the wrong side of $-1$, giving $N = 2$ and $Z = 2$ for any $K$. Equivalently, $s^3 + s^2 + K$ has a zero $s$ coefficient, so it fails Routh's necessary condition. A zero (lead) is needed to stabilise it, as in the case $10(s + 1)/(s^2(s + 5))$.
:::end

:::exercise
Why can't you read stability of $3/((s - 1)(s + 2))$ from a Bode phase margin?
:::solution
Margins assume the open loop is stable ($P = 0$), so that "no encirclement" means stable. Here $P = 1$ and stability requires one counter-clockwise encirclement, which shows up on the Nyquist plot but has no clean meaning on a Bode plot.
:::end

## Quiz

:::quiz
- type: num
  q: Closed-loop RHP poles if P = 1 and the plot encircles −1 once clockwise?
  answer: 2
  tol: 0
  py: "1+1"
  explain: Z = N + P.
- type: num
  q: Encirclements needed for stability when P = 2 (counting clockwise as positive)?
  answer: -2
  tol: 0
  py: "-2"
  explain: Two counter-clockwise.
- type: num
  q: Where does L = K/((s − 1)(s + 2)) cross the negative real axis at ω = 0 for K = 3?
  answer: -1.5
  tol: 0
  py: "-3/2"
  explain: L(0) = −K/2.
- type: num
  q: Smallest K that stabilises K/((s − 1)(s + 2))?
  answer: 2
  tol: 0
  py: "2"
  explain: The constant term K − 2 must be positive.
- type: mc
  q: The zeros of 1 + L(s) are…
  options:
    - the closed-loop poles
    - the open-loop zeros
    - the open-loop poles
    - always stable
  answer: 0
  explain: 1 + L = (D + N)/D.
- type: mc
  q: Why indent the contour around poles on the imaginary axis?
  options:
    - L is infinite there, so the contour must avoid them
    - to make the plot symmetric
    - to count zeros
    - to remove the integrator
  answer: 0
  explain: The detour maps to a large arc.
:::end
