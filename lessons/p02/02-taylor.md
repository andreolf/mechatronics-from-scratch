---
id: p02-l02
minutes: 30
summary: Taylor series let you replace a hard function with a polynomial near a point. You derive the expansion, bound its error, and find exactly when the small-angle approximation sin θ ≈ θ is good to 1 %, which is the step that turns a nonlinear pendulum into a linear one.
---

## Matching derivatives at a point

Suppose you want a polynomial $p(x)$ that behaves like $f(x)$ near $x_0$. Require $p$ and $f$ to have the same value, slope, curvature and so on at $x_0$. Each condition fixes one coefficient, giving

$$f(x_0 + \delta) = f(x_0) + f'(x_0)\,\delta + \frac{f''(x_0)}{2!}\delta^2 + \dots + \frac{f^{(n)}(x_0)}{n!}\delta^n + R_n .$$

Taylor's theorem bounds the remainder: for some $\xi$ between $x_0$ and $x_0 + \delta$,

$$R_n = \frac{f^{(n+1)}(\xi)}{(n+1)!}\delta^{n+1}.$$

The error shrinks like $\delta^{n+1}$, so a low-order polynomial is accurate close to $x_0$ and drifts away further out.

## Linearisation

Keeping only the first two terms is **linearisation**:

$$f(x_0 + \delta) \approx f(x_0) + f'(x_0)\,\delta .$$

Nearly all of classical control is built on this step. You linearise a nonlinear plant around an operating point, design a controller for the linear model, and rely on staying close enough to the point for the approximation to hold. Lesson 14 does this for state-space systems.

## The small-angle approximation

For $\sin\theta$ around 0 the derivatives cycle through $\cos, -\sin, -\cos, \sin$, so

$$\sin\theta = \theta - \frac{\theta^3}{6} + \frac{\theta^5}{120} - \dots$$

The first-order approximation $\sin\theta \approx \theta$ has a relative error of about $\theta^2/6$. Setting this to 1 % gives $\theta \approx \sqrt{0.06} = 0.245$ rad $= 14.0°$. The exact crossing, solving $(\theta - \sin\theta)/\sin\theta = 0.01$, is 13.99°. A pendulum swinging less than about 14° behaves like the linear oscillator $\ddot\theta + (g/l)\theta = 0$ to within 1 % in its restoring torque.

:::figure widget=taylor caption="Compare sin θ (white) with its Taylor polynomials (lime dashes). Increase the order to see the accurate region widen."
:::end

## Worked example: a square root by hand

Estimate $\sqrt{4.1}$ by linearising $f(x) = \sqrt x$ at $x_0 = 4$.

1. $f(4) = 2$, $f'(x) = \tfrac{1}{2\sqrt x}$ so $f'(4) = 0.25$.
2. $\sqrt{4.1} \approx 2 + 0.25 \times 0.1 = 2.025$.
3. The exact value is 2.024846, an error of $1.5\times10^{-4}$.
4. Bound: $f''(x) = -\tfrac14 x^{-3/2}$, so $|R_1| \le \tfrac{1}{2}\cdot\tfrac{1}{4}\cdot 4^{-3/2}\cdot 0.1^2 = 1.56\times10^{-4}$. The actual error is just inside it.

## Code it from scratch

:::code file=taylor.py
```python
import math
import numpy as np

def sin_taylor(x, order):
    term, total = x, x
    for k in range(3, order + 1, 2):
        term *= -x * x / ((k - 1) * k)
        total += term
    return total

def rel_err(theta, order):
    return abs(sin_taylor(theta, order) - math.sin(theta)) / abs(math.sin(theta))

if __name__ == "__main__":
    # find the angle where sinθ ≈ θ reaches 1 % error, by bisection
    lo, hi = 0.01, 1.0
    for _ in range(60):
        mid = (lo + hi) / 2
        lo, hi = (mid, hi) if rel_err(mid, 1) < 0.01 else (lo, mid)
    crossing = math.degrees(lo)
    print(f"sin θ ≈ θ is within 1 % up to {crossing:.2f}°")
    assert 13.9 < crossing < 14.0
    for deg in np.arange(0.5, 13.9, 0.5):
        assert rel_err(math.radians(deg), 1) < 0.01
    for order, limit in ((3, 1e-3), (5, 1e-5)):
        assert rel_err(math.radians(30), order) < limit
    assert abs((2 + 0.25 * 0.1) - math.sqrt(4.1)) < 1.6e-4
```
:::end

## Exercises

:::exercise
Linearise $f(x) = e^x$ at $x_0 = 0$ and estimate $e^{0.2}$. How large is the error?
:::solution
1. $e^x \approx 1 + x$, so $e^{0.2} \approx 1.2$.
2. The exact value is 1.221403, error 0.0214.
3. Adding the quadratic term $x^2/2 = 0.02$ gives 1.22, error 0.0014.
:::end

:::exercise
Linearise $\cos\theta$ around $\theta_0 = 0$. What does that tell you about the vertical position of a pendulum bob for small swings?
:::solution
$\cos\theta \approx 1 - \theta^2/2$; the linear term is zero because $\cos$ has a maximum at 0. The bob's height $l(1 - \cos\theta) \approx l\theta^2/2$ changes only to second order, which is why small swings look horizontal.
:::end

## Quiz

:::quiz
- type: num
  q: Linearise $\sqrt x$ at $x_0 = 4$. What estimate do you get for $\sqrt{4.1}$?
  answer: 2.025
  tol: 0.0001
  py: "2 + 0.25*0.1"
  explain: $2 + \tfrac{1}{4}(0.1) = 2.025$.
- type: num
  q: What is the relative error of $\sin\theta \approx \theta$ at θ = 10°, in percent?
  answer: 0.5095
  tol: 0.005
  unit: "%"
  py: "100*(math.radians(10)-math.sin(math.radians(10)))/math.sin(math.radians(10))"
  explain: $\theta = 0.17453$ rad and $\sin\theta = 0.17365$, a relative error of 0.51 %, close to $\theta^2/6 = 0.51$ %.
- type: mc
  q: What is the third-order Taylor polynomial of sin θ around 0?
  options:
    - θ − θ²/2
    - θ − θ³/6
    - 1 − θ²/2
    - θ + θ³/3
  answer: 1
  explain: The derivatives at 0 are 0, 1, 0, −1, so the $\theta^3$ coefficient is $-1/3! = -1/6$.
- type: num
  q: Estimate $e^{0.2}$ with the second-order Taylor polynomial $1 + x + x^2/2$.
  answer: 1.22
  tol: 0.0001
  py: "1 + 0.2 + 0.2**2/2"
  explain: $1 + 0.2 + 0.02 = 1.22$.
- type: mc
  q: In control engineering, why is linearisation so widely used?
  options:
    - Real systems are linear
    - Near an operating point a linear model is accurate, and linear systems have complete design and analysis tools
    - It makes systems faster
    - It removes noise
  answer: 1
  explain: The error is second order in the deviation, so small deviations are captured well.
:::end

:::verify
import math
assert abs(math.sqrt(0.06)-0.245)<5e-4 and abs(math.degrees(math.sqrt(0.06))-14.0)<0.05
assert abs(math.sqrt(4.1)-2.024846)<5e-7 and abs(2.025-math.sqrt(4.1)-1.5e-4)<5e-6
assert abs(0.5*0.25*4**-1.5*0.01 - 1.56e-4) < 5e-7
assert abs(math.exp(.2)-1.221403)<5e-7 and abs(math.exp(.2)-1.2-0.0214)<5e-5 and abs(math.exp(.2)-1.22-0.0014)<5e-5
t = math.radians(10); assert abs(t-0.17453)<5e-6 and abs(math.sin(t)-0.17365)<5e-6 and abs(100*t*t/6-0.51)<0.005
:::end
