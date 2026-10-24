---
id: p03-l03
minutes: 35
summary: The Laplace transform turns linear ODEs into algebra. You derive the transform of a derivative by integration by parts, build a small table from the definition, solve a first-order ODE without integrating it, and check numeric Laplace integrals against the table.
---

## The definition

For a signal $x(t)$ that starts at $t = 0$, the Laplace transform is

$$X(s) = \mathcal L\{x\}(s) = \int_0^\infty x(t)\,e^{-st}\,dt,$$

with $s = \sigma + j\omega$ a complex frequency. The factor $e^{-st} = e^{-\sigma t}e^{-j\omega t}$ does two things: $e^{-j\omega t}$ probes for oscillation at $\omega$, like a Fourier transform, and $e^{-\sigma t}$ tames signals that grow, so the integral converges for $\operatorname{Re}s$ large enough.

**Exponential.** For $x = e^{-at}$:

$$X(s) = \int_0^\infty e^{-(s+a)t}dt = \left[\frac{-e^{-(s+a)t}}{s+a}\right]_0^\infty = \frac{1}{s+a}, \qquad \operatorname{Re}s > -a.$$

Setting $a = 0$ gives the unit step: $1/s$. Setting $a = -j\omega$ and taking real and imaginary parts gives $\mathcal L\{\cos\omega t\} = s/(s^2 + \omega^2)$ and $\mathcal L\{\sin\omega t\} = \omega/(s^2 + \omega^2)$. Notice that the denominator vanishes at $s = -a$: that point is the transform's **pole**, and it sits exactly at the signal's exponent.

## Derivatives become multiplication by s

Integrate by parts with $u = e^{-st}$ and $dv = \dot x\,dt$:

$$\mathcal L\{\dot x\} = \big[x e^{-st}\big]_0^\infty + s\int_0^\infty x e^{-st}dt = sX(s) - x(0).$$

The boundary term at infinity vanishes inside the region of convergence. Apply it twice:

$$\mathcal L\{\ddot x\} = s^2X(s) - s\,x(0) - \dot x(0).$$

Differentiation becomes multiplication by $s$, and the initial conditions appear as plain additive terms. A linear ODE with constant coefficients becomes a polynomial equation in $s$.

:::figure widget=response args={"order":1} caption="A first-order step response. Its Laplace transform 1/(s(τs + 1)) has poles at 0 (the step) and −1/τ (the decay)."
:::end

## Worked example

Solve $\dot x = -2x + 1$ with $x(0) = 0$. This is an RC circuit charging toward 0.5 V with $\tau = 0.5$ s.

1. Transform both sides: $sX - 0 = -2X + \frac1s$.
2. Solve the algebra: $X(s) = \dfrac{1}{s(s+2)}$.
3. Split into known transforms: $\dfrac{1}{s(s+2)} = \dfrac{1/2}{s} - \dfrac{1/2}{s+2}$ (lesson 6 makes this systematic).
4. Read the table backwards: $x(t) = \tfrac12(1 - e^{-2t})$.
5. Check: at $t = 1$ s, $x = 0.5(1 - e^{-2}) = 0.43233$, and the solution satisfies the ODE: $\dot x = e^{-2t} = -2x + 1$.

No integration constant to chase: the initial condition went in at step 1.

## Code it from scratch

Evaluate the defining integral numerically for real $s$ and compare with the table.

:::code file=laplace_numeric.py
```python
import math
import numpy as np

def laplace(x, s, T=None, n=200_001):
    """Numeric Laplace transform for real s > 0 by Simpson's rule on [0, T]."""
    T = T or 40.0 / s                                  # e^{-sT} = e^{-40}: tail negligible
    t = np.linspace(0, T, n)
    f = x(t) * np.exp(-s * t)
    h = t[1] - t[0]
    return h / 3 * (f[0] + f[-1] + 4 * f[1:-1:2].sum() + 2 * f[2:-1:2].sum())

TABLE = {
    "step":     (lambda t: np.ones_like(t),     lambda s: 1 / s),
    "exp(-2t)": (lambda t: np.exp(-2 * t),      lambda s: 1 / (s + 2)),
    "t":        (lambda t: t,                   lambda s: 1 / s**2),
    "sin(3t)":  (lambda t: np.sin(3 * t),       lambda s: 3 / (s**2 + 9)),
    "cos(3t)":  (lambda t: np.cos(3 * t),       lambda s: s / (s**2 + 9)),
}

if __name__ == "__main__":
    for name, (x, X) in TABLE.items():
        for s in (0.5, 1.0, 3.0, 10.0):
            num, ref = laplace(x, s), X(s)
            assert abs(num - ref) < 1e-8 * max(1, abs(ref)), (name, s, num, ref)
    # derivative rule: L{x'} = s X - x(0) for x = cos 2t
    s = 1.7
    lhs = laplace(lambda t: -2 * np.sin(2 * t), s)
    rhs = s * laplace(lambda t: np.cos(2 * t), s) - 1.0
    assert abs(lhs - rhs) < 1e-8
    # the worked example
    x = lambda t: 0.5 * (1 - np.exp(-2 * t))
    assert abs(laplace(x, 3.0) - 1 / (3.0 * 5.0)) < 1e-9
    print("table verified at s = 0.5, 1, 3, 10; x(1) =", round(float(x(1.0)), 5))
```
:::end

## Exercises

:::exercise
Find the Laplace transform of $x(t) = t\,e^{-at}$ from the definition, or by differentiating $1/(s+a)$ with respect to $s$.
:::solution
$\frac{d}{ds}\int x e^{-st}dt = -\int t\,x\,e^{-st}dt$, so multiplying by $t$ corresponds to $-\frac{d}{ds}$. Then $\mathcal L\{t e^{-at}\} = -\frac{d}{ds}\frac{1}{s+a} = \frac{1}{(s+a)^2}$. A repeated pole means a $t\,e^{-at}$ term, which you'll meet again in critically damped systems.
:::end

:::exercise
Solve $\ddot x + 3\dot x + 2x = 0$ with $x(0) = 1$, $\dot x(0) = 0$ using the Laplace transform.
:::solution
$s^2X - s + 3(sX - 1) + 2X = 0$, so $X = \frac{s + 3}{(s+1)(s+2)} = \frac{2}{s+1} - \frac{1}{s+2}$. So $x(t) = 2e^{-t} - e^{-2t}$. Check: $x(0) = 1$ and $\dot x(0) = -2 + 2 = 0$.
:::end

## Quiz

:::quiz
- type: num
  q: Evaluate $\mathcal L\{e^{-2t}\}$ at $s = 3$.
  answer: 0.2
  tol: 0.001
  py: "1/(3+2)"
  explain: $1/(s + a) = 1/5$.
- type: mc
  q: The transform of $\dot x$ is…
  options:
    - $X(s)/s$
    - $sX(s) - x(0)$
    - $sX(s) + x(0)$
    - $X(s) - s\,x(0)$
  answer: 1
  explain: Integration by parts gives $sX(s) - x(0)$.
- type: num
  q: For $\dot x = -2x + 1$, $x(0) = 0$, what is $x$ at $t = 1$ s?
  answer: 0.43233
  tol: 0.001
  py: "0.5*(1-math.exp(-2))"
  explain: $x = \tfrac12(1 - e^{-2t})$.
- type: num
  q: What is $\mathcal L\{\sin 3t\}$ at $s = 1$?
  answer: 0.3
  tol: 0.001
  py: "3/(1+9)"
  explain: $\omega/(s^2 + \omega^2) = 3/10$.
- type: mc
  q: Where is the pole of $\mathcal L\{e^{-at}\}$?
  options:
    - $s = a$
    - $s = -a$
    - $s = 0$
    - It has no pole
  answer: 1
  explain: $1/(s + a)$ blows up at $s = -a$, matching the signal's exponent.
- type: num
  q: "For $x = 2e^{-t} - e^{-2t}$, what is $\\dot x(0)$?"
  answer: 0
  tol: 0.001
  py: "-2+2"
  explain: $\dot x = -2e^{-t} + 2e^{-2t}$, which is 0 at $t = 0$.
:::end

:::verify
import math
assert abs(0.5*(1-math.exp(-2))-0.43233)<1e-5
:::end
