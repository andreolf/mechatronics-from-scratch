---
id: p02-l01
minutes: 30
summary: A derivative is a sensitivity, how much the output moves per unit input. You derive forward and central finite differences with their error orders, find the step size where round-off takes over, and measure the error slope on a log-log plot.
---

## Derivatives as sensitivity

The derivative of $f$ at $x$ is the limit

$$f'(x) = \lim_{h\to 0}\frac{f(x+h) - f(x)}{h}.$$

In engineering terms it is a sensitivity: a motor's torque constant is $d\tau/di$, a sensor's gain is $dV_\text{out}/dx$, and a controller cares how much the output moves per unit of input. When you only have code for $f$, perhaps a simulator, you estimate the derivative with a finite step.

## Truncation error from Taylor's theorem

Expand $f$ around $x$ (lesson 2 derives this in detail):

$$f(x + h) = f(x) + hf'(x) + \tfrac{h^2}{2}f''(x) + \tfrac{h^3}{6}f'''(x) + \dots$$

Rearranging gives the **forward difference** and its error:

$$\frac{f(x+h) - f(x)}{h} = f'(x) + \underbrace{\tfrac{h}{2}f''(x) + \dots}_{O(h)}.$$

Subtract the expansion of $f(x - h)$ from that of $f(x + h)$ and the even terms cancel, giving the **central difference**:

$$\frac{f(x+h) - f(x-h)}{2h} = f'(x) + \underbrace{\tfrac{h^2}{6}f'''(x) + \dots}_{O(h^2)}.$$

Halving $h$ halves the forward error but quarters the central error. On a log-log plot of error against $h$ the slopes are 1 and 2.

## Round-off sets a floor

Each function value carries a rounding error of about $\varepsilon|f|$ with $\varepsilon = 2.2\times10^{-16}$. Dividing their difference by $h$ amplifies it to about $\varepsilon|f|/h$. The total forward error is roughly

$$E(h) \approx \frac{h}{2}|f''| + \frac{\varepsilon|f|}{h},$$

which is smallest near $h^* = \sqrt{2\varepsilon|f|/|f''|} \approx 10^{-8}$ for well-scaled $f$. For the central difference the balance is between $h^2$ and $\varepsilon/h$, so $h^* \approx \varepsilon^{1/3} \approx 6\times10^{-6}$. Smaller steps make the answer worse, not better.

:::figure widget=fderror caption="Error of the forward (amber) and central (lime) differences for sin x at x = 1. Right of the minimum the truncation error dominates; left of it, round-off."
:::end

## Worked example

Estimate $\frac{d}{dx}\sin x$ at $x = 1$ with $h = 0.1$. The exact value is $\cos 1 = 0.540302$.

- Forward: $(\sin 1.1 - \sin 1)/0.1 = (0.891207 - 0.841471)/0.1 = 0.497364$, error $-0.0429$.
- Central: $(\sin 1.1 - \sin 0.9)/0.2 = (0.891207 - 0.783327)/0.2 = 0.539402$, error $-0.00090$.

The central difference costs one extra function evaluation and is 48 times more accurate here. Compare with the predicted leading errors: $\tfrac{h}{2}f'' = -0.05\sin 1 = -0.0421$ and $\tfrac{h^2}{6}f''' = -\tfrac{0.01}{6}\cos 1 = -0.00090$.

## Code it from scratch

:::code file=numdiff.py
```python
import math
import numpy as np

def forward(f, x, h): return (f(x + h) - f(x)) / h
def central(f, x, h): return (f(x + h) - f(x - h)) / (2 * h)

def slope(hs, errs):
    return np.polyfit(np.log10(hs), np.log10(errs), 1)[0]

if __name__ == "__main__":
    x, exact = 1.0, math.cos(1.0)
    assert abs(forward(math.sin, x, 0.1) - 0.497364) < 1e-6
    assert abs(central(math.sin, x, 0.1) - 0.539402) < 1e-6
    hs = np.logspace(-4, -1, 13)                    # truncation-dominated range
    ef = [abs(forward(math.sin, x, h) - exact) for h in hs]
    ec = [abs(central(math.sin, x, h) - exact) for h in hs]
    sf, sc = slope(hs, ef), slope(hs, ec)
    print(f"log-log slopes: forward {sf:.3f}, central {sc:.3f}")
    assert abs(sf - 1) < 0.05 and abs(sc - 2) < 0.05
    hs_all = np.logspace(-15, 0, 151)
    best_f = hs_all[np.argmin([abs(forward(math.sin, x, h) - exact) for h in hs_all])]
    best_c = hs_all[np.argmin([abs(central(math.sin, x, h) - exact) for h in hs_all])]
    print(f"best h: forward {best_f:.1e}, central {best_c:.1e}")
    assert 1e-10 < best_f < 1e-6 and 1e-7 < best_c < 1e-4
```
:::end

## Exercises

:::exercise
A forward difference has error 0.02 at $h = 0.1$. What do you expect at $h = 0.025$, and what would a central difference with error 0.02 at $h = 0.1$ give?
:::solution
1. Forward is $O(h)$: dividing $h$ by 4 divides the error by 4, so 0.005.
2. Central is $O(h^2)$: dividing $h$ by 4 divides the error by 16, so 0.00125.
:::end

:::exercise
Why does a central difference with $h = 10^{-12}$ give a worse derivative than $h = 10^{-5}$?
:::solution
The round-off term $\varepsilon|f|/h$ grows as $h$ shrinks. At $h = 10^{-12}$ it is about $2\times10^{-4}$, much larger than the truncation error at $h = 10^{-5}$, which is about $10^{-11}$.
:::end

## Quiz

:::quiz
- type: num
  q: Compute the forward difference $(\sin 1.1 - \sin 1)/0.1$ to 4 decimal places.
  answer: 0.4974
  tol: 0.001
  py: "(math.sin(1.1)-math.sin(1))/0.1"
  explain: $(0.891207 - 0.841471)/0.1 = 0.4974$.
- type: num
  q: A central difference has error $8\times10^{-4}$ at $h = 0.02$. What error do you expect at $h = 0.01$?
  answer: 0.0002
  tol: 0.001
  py: "8e-4/4"
  explain: Halving $h$ divides an $O(h^2)$ error by 4.
- type: mc
  q: What is the slope of the central-difference error on a log-log plot, in the truncation-dominated range?
  options:
    - "1"
    - "2"
    - "−1"
    - "4"
  answer: 1
  explain: The leading error term is $\tfrac{h^2}{6}f'''$, proportional to $h^2$.
- type: num
  q: Roughly what step size minimises the forward-difference error for a well-scaled function? Give $\sqrt{\varepsilon}$ for float64.
  answer: 1.49e-8
  tol: 0.01
  py: "math.sqrt(np.finfo(float).eps)"
  explain: $\sqrt{2.2\times10^{-16}} = 1.49\times10^{-8}$.
- type: mc
  q: Why does the central difference cancel the O(h) term?
  options:
    - It uses a smaller step
    - The even-power terms of the Taylor expansions of f(x+h) and f(x−h) are equal and cancel when subtracted
    - It averages two forward differences with different h
    - Round-off cancels
  answer: 1
  explain: The $h^2 f''/2$ terms appear with the same sign in both expansions and drop out of the difference.
:::end

:::verify
import math
assert abs(math.sin(1.1)-0.891207)<5e-7 and abs(math.sin(1)-0.841471)<5e-7 and abs(math.sin(.9)-0.783327)<5e-7 and abs(math.cos(1)-0.540302)<5e-7
f = (math.sin(1.1)-math.sin(1))/.1; c = (math.sin(1.1)-math.sin(.9))/.2
assert abs(f-math.cos(1)+0.0429)<5e-5 and abs(c-math.cos(1)+0.00090)<5e-6
assert 47 < (f-math.cos(1))/(c-math.cos(1)) < 49
assert abs(-0.05*math.sin(1)+0.0421)<5e-5 and abs(-0.01/6*math.cos(1)+0.00090)<5e-6
assert abs((2.2e-16)**(1/3) - 6e-6) < 1e-6
:::end
