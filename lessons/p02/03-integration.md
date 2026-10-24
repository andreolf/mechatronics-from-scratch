---
id: p02-l03
minutes: 30
summary: Integration turns rates into totals, speed into distance and current into charge. You derive the trapezoid and Simpson rules from polynomial fits, measure their error orders, and integrate a scooter's speed log into distance travelled.
---

## From rates to totals

If $v(t)$ is a speed, the distance travelled is the area under it, $s = \int_a^b v(t)\,dt$. Logged data arrives as samples $v_0, v_1, \dots, v_n$ at spacing $h$, so you approximate the area from those samples. Every rule below replaces $v$ by a simple polynomial on each piece and integrates that exactly.

## Three rules

**Left Riemann sum**: treat $v$ as constant on each interval, $\int \approx h\sum_{i=0}^{n-1} v_i$. The error is $O(h)$.

**Trapezoid rule**: join neighbouring samples with straight lines,

$$\int_a^b v\,dt \approx h\Big(\tfrac{v_0}{2} + v_1 + \dots + v_{n-1} + \tfrac{v_n}{2}\Big).$$

The error per interval comes from the curvature the line ignores: $-\tfrac{h^3}{12}v''(\xi)$. Summing $n = (b-a)/h$ intervals gives a global error of $-\tfrac{(b-a)h^2}{12}v''$, so $O(h^2)$.

**Simpson's rule**: fit a parabola through each pair of intervals (so $n$ must be even). Integrating the parabola through $v_0, v_1, v_2$ gives $\tfrac{h}{3}(v_0 + 4v_1 + v_2)$, and summing,

$$\int_a^b v\,dt \approx \frac{h}{3}\big(v_0 + 4v_1 + 2v_2 + 4v_3 + \dots + 4v_{n-1} + v_n\big).$$

By symmetry it is exact for cubics as well, and its global error is $-\tfrac{(b-a)h^4}{180}v^{(4)}$: halving $h$ cuts the error by 16.

:::figure widget=riemann caption="A synthetic scooter speed log over 12 s. Switch rules and change the number of intervals; the readout compares each estimate with the exact distance."
:::end

## Worked example: ∫₀² x³ dx = 4

- Trapezoid with $n = 2$ ($h = 1$): $1 \times (0/2 + 1 + 8/2) = 5$. Error $+1$.
- Trapezoid with $n = 4$ ($h = 0.5$): $0.5 \times (0 + 0.125 + 1 + 3.375 + 4) = 4.25$. Error $+0.25$, a quarter of before, as $O(h^2)$ predicts.
- Simpson with $n = 2$: $\tfrac13(0 + 4\times 1 + 8) = 4$. Exact, because the integrand is a cubic.

## Code it from scratch

:::code file=quadrature.py
```python
import math
import numpy as np

def trapz(y, h):
    y = np.asarray(y, float)
    return h * (y[0] / 2 + y[1:-1].sum() + y[-1] / 2)

def simpson(y, h):
    y = np.asarray(y, float)
    if (len(y) - 1) % 2:
        raise ValueError("Simpson needs an even number of intervals")
    return h / 3 * (y[0] + 4 * y[1:-1:2].sum() + 2 * y[2:-1:2].sum() + y[-1])

if __name__ == "__main__":
    x = np.linspace(0, 2, 3); assert trapz(x ** 3, 1) == 5 and simpson(x ** 3, 1) == 4
    x = np.linspace(0, 2, 5); assert trapz(x ** 3, 0.5) == 4.25
    errs = []                                     # order test on ∫₀¹ x⁴ dx = 1/5
    for n in (4, 8, 16, 32, 64):
        x = np.linspace(0, 1, n + 1)
        errs.append(abs(simpson(x ** 4, 1 / n) - 0.2))
    ratios = [errs[i] / errs[i + 1] for i in range(4)]
    assert all(abs(r - 16) < 1e-6 for r in ratios), ratios
    # scooter log: v(t) = 4 + 2 sin(t/2) + 0.5 t − 0.04 t² m/s, sampled at 10 Hz for 12 s
    t = np.linspace(0, 12, 121)
    v = 4 + 2 * np.sin(t / 2) + 0.5 * t - 0.04 * t ** 2
    F = lambda t: 4 * t - 4 * math.cos(t / 2) + 0.25 * t ** 2 - 0.04 * t ** 3 / 3
    exact = F(12) - F(0)
    print(f"distance: trapezoid {trapz(v, 0.1):.6f} m, Simpson {simpson(v, 0.1):.6f} m, exact {exact:.6f} m")
    assert abs(simpson(v, 0.1) - exact) < 1e-6 and abs(trapz(v, 0.1) - exact) < 1e-2
```
:::end

## Exercises

:::exercise
A battery current log, sampled every 0.5 s, reads 2.0, 2.4, 2.2, 1.8 and 1.6 A. How much charge left the battery?
:::solution
1. Trapezoid: $0.5\,(1.0 + 2.4 + 2.2 + 1.8 + 0.8) = 4.1$ C.
2. Simpson ($n = 4$): $\tfrac{0.5}{3}(2.0 + 4(2.4) + 2(2.2) + 4(1.8) + 1.6) = \tfrac{0.5}{3}\times 24.8 = 4.133$ C.
:::end

:::exercise
The trapezoid rule gives an error of $3\times10^{-3}$ with 50 intervals. How many intervals bring it below $10^{-5}$?
:::solution
The error scales as $1/n^2$. You need a factor of 300, so $n = 50\sqrt{300} = 866$ intervals. Simpson's rule would likely need far fewer.
:::end

## Quiz

:::quiz
- type: num
  q: Trapezoid rule for $\int_0^2 x^3\,dx$ with $h = 0.5$?
  answer: 4.25
  tol: 0.0001
  py: "0.5*(0/2 + 0.125 + 1 + 3.375 + 8/2)"
  explain: $0.5(0 + 0.125 + 1 + 3.375 + 4) = 4.25$.
- type: num
  q: Integrate the current log 2.0, 2.4, 2.2, 1.8, 1.6 A (0.5 s spacing) with the trapezoid rule. Charge in coulombs?
  answer: 4.1
  tol: 0.0001
  unit: C
  py: "0.5*(2.0/2 + 2.4 + 2.2 + 1.8 + 1.6/2)"
  explain: $0.5 \times 8.2 = 4.1$ C.
- type: mc
  q: Halving h in Simpson's rule reduces the error by about…
  options:
    - 2
    - 4
    - 16
    - 8
  answer: 2
  explain: The global error is $O(h^4)$, and $2^4 = 16$.
- type: mc
  q: Why is Simpson's rule exact for cubic polynomials, though it fits parabolas?
  options:
    - It uses more points than needed
    - The cubic term's error is odd about each panel's midpoint and integrates to zero
    - Cubics have zero curvature
    - It isn't exact for cubics
  answer: 1
  explain: The leftover $(t - t_m)^3$ term is antisymmetric about the midpoint, so its integral over the panel vanishes.
- type: num
  q: Simpson's rule for the current log, in coulombs?
  answer: 4.1333
  tol: 0.001
  unit: C
  py: "0.5/3*(2.0 + 4*2.4 + 2*2.2 + 4*1.8 + 1.6)"
  explain: $\tfrac{0.5}{3}\times 24.8 = 4.133$ C.
:::end

:::verify
import math
assert abs(0.5*(2.0+4*2.4+2*2.2+4*1.8+1.6)/3 - 4.1333) < 5e-5 and abs(2.0+4*2.4+2*2.2+4*1.8+1.6-24.8)<1e-12
assert abs(50*math.sqrt(300)-866) < 0.5
:::end
