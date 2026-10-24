---
id: p01-l01
minutes: 20
summary: You set up the workflow every lesson in this course follows. You write a tolerance-based check called `assert_close`, see why `0.1 + 0.2 == 0.3` is false on every computer, and keep your first artifact.
---

## Why every lesson ends in a test

A derivation on paper can be wrong and a plot can look right by accident, but a test that runs gives you a yes or no answer each time you change the code. In this course you derive the maths, code it from scratch, check it against a reference, then keep the result as an artifact you can rerun later.

The loop has four steps:

1. **Derive**: write the equation by hand and predict a number.
2. **Code**: implement it with plain Python and NumPy, or C on a microcontroller.
3. **Test**: compare your result with the prediction or a trusted library.
4. **Keep**: save the plot, log or firmware in an `artifacts/` folder.

## Comparing numbers with a tolerance

Computers store real numbers as 64-bit floating point values, so most decimals are rounded. The decimal $0.1$ has no exact binary form, which is why

$$0.1 + 0.2 = 0.30000000000000004 \neq 0.3 .$$

You therefore never compare computed values with `==`. Instead you define the **residual** $r = \hat{x} - x$ between the computed value $\hat{x}$ and the expected value $x$, and accept the result when

$$|r| \le \text{atol} + \text{rtol}\,|x| .$$

The absolute tolerance atol matters near zero, where a relative test would demand impossible precision. The relative tolerance rtol scales with the size of the number, so a motor speed of 3000 rpm and a current of 0.002 A get sensible bounds from the same rule.

:::figure widget=tolerance caption="Drag the expected value and the tolerances. The band is atol + rtol·|x|; the test passes while the computed value stays inside it."
:::end

### How small can the error get?

The spacing between neighbouring float64 numbers near 1 is the **machine epsilon**,

$$\varepsilon = 2^{-52} \approx 2.22 \times 10^{-16} .$$

One arithmetic operation can introduce a relative error of up to $\varepsilon/2$. After thousands of operations in a simulation, errors of $10^{-12}$ are normal, which is why this course's tests use tolerances around $10^{-9}$ for exact algebra and much looser ones for measured or simulated data.

## Worked example: does 0.1 + 0.2 pass?

Take $\hat{x} = 0.1 + 0.2$ and $x = 0.3$. Python gives $r = 5.55 \times 10^{-17}$. With rtol $= 10^{-9}$ and atol $= 10^{-12}$ the bound is

$$10^{-12} + 10^{-9} \times 0.3 = 3.01 \times 10^{-10},$$

and $5.55 \times 10^{-17} \le 3.01 \times 10^{-10}$, so the test passes. The same rule rejects $\hat{x} = 0.3001$, whose residual $10^{-4}$ is six orders of magnitude above the bound.

## Code it from scratch

This helper is the first file in your course repository. Every later lesson imports it. It checks scalars and arrays, and its message tells you the worst offending element.

:::code file=checks.py
```python
import numpy as np

def assert_close(actual, expected, rtol=1e-9, atol=1e-12):
    a = np.asarray(actual, dtype=float)
    e = np.asarray(expected, dtype=float)
    bound = atol + rtol * np.abs(e)
    err = np.abs(a - e)
    if np.all(err <= bound):
        return True
    i = np.unravel_index(np.argmax(err - bound), err.shape)
    raise AssertionError(
        f"element {i}: got {a[i]!r}, expected {e[i]!r}, "
        f"error {err[i]:.3e} > bound {bound[i]:.3e}")

if __name__ == "__main__":
    assert 0.1 + 0.2 != 0.3            # exact comparison fails
    assert_close(0.1 + 0.2, 0.3)       # tolerance comparison passes
    assert_close([1.0, 2.0], [1.0, 2.0 + 1e-10])
    try:
        assert_close(0.3001, 0.3)
    except AssertionError as err:
        print("rejected as expected:", err)
    else:
        raise SystemExit("0.3001 should fail")
    print("eps =", np.finfo(float).eps)
```
:::end

Run it with `python checks.py`. Then copy the folder layout you'll use for the whole course: one folder per lesson, a `test_*.py` file in each, and `pytest` from the repository root to run everything.

## Exercises

:::exercise
A wheel encoder reports a distance of $\hat{x} = 12.0004$ m for a true distance of $12$ m. With rtol $= 10^{-4}$ and atol $= 10^{-6}$ m, does the measurement pass?
:::solution
1. Residual: $|r| = 0.0004$ m.
2. Bound: $10^{-6} + 10^{-4} \times 12 = 0.001201$ m.
3. $0.0004 \le 0.001201$, so it passes. The relative tolerance of 0.01 % allows 1.2 mm on a 12 m run.
:::end

:::exercise
Why does a purely relative test (atol $= 0$) fail when you check that a balanced bridge outputs $x = 0$ V?
:::solution
With $x = 0$ the bound is $\text{rtol} \times 0 = 0$, so only an exact zero passes. Any round-off, say $10^{-17}$ V, is rejected. A small absolute tolerance such as atol $= 10^{-9}$ V fixes it.
:::end

## Quiz

:::quiz
- type: mc
  q: Why should you avoid `==` when comparing two computed floating point values?
  options:
    - Python's `==` is slower than subtraction
    - Most decimals are rounded in binary, so mathematically equal results can differ in the last bits
    - Floats can't be compared at all
    - '`==` only works on integers in NumPy'
  answer: 1
  explain: Decimal values like 0.1 have no exact binary representation, so two routes to the same number can round differently.
- type: num
  q: What is the tolerance bound $\text{atol} + \text{rtol}|x|$ for $x = 50$, rtol $= 10^{-3}$, atol $= 10^{-6}$?
  answer: 0.050001
  tol: 0.0001
  py: "1e-6 + 1e-3*50"
  explain: $10^{-6} + 10^{-3} \times 50 = 0.050001$.
- type: num
  q: Give the float64 machine epsilon $2^{-52}$ (in scientific notation, e.g. 2.2e-16).
  answer: 2.220446e-16
  tol: 0.001
  py: "np.finfo(float).eps"
  explain: $2^{-52} \approx 2.220446 \times 10^{-16}$, the gap between 1 and the next float64.
- type: mc
  q: Which tolerance protects a test when the expected value is exactly zero?
  options:
    - rtol
    - atol
    - Neither; zero can't be tested
    - Both must be zero
  answer: 1
  explain: The relative term vanishes at $x = 0$, so only the absolute tolerance leaves room for round-off.
:::end

:::verify
import numpy as np
r = abs((0.1 + 0.2) - 0.3)
assert 5.5e-17 < r < 5.6e-17
assert abs((1e-12 + 1e-9*0.3) - 3.01e-10) < 1e-15
assert abs(12.0004 - 12) <= 1e-6 + 1e-4*12
:::end
