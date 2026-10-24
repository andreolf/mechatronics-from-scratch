---
id: p06-l02
minutes: 35
summary: Many microcontrollers have no floating-point unit, so control code uses fixed-point integers. You derive the Q15 format, multiply with rounding and saturation, and prove the error stays within half an LSB, matching a float reference over thousands of random products.
---

## Q formats

A **Qm.n** number is an integer that you agree to divide by $2^n$. **Q15** is a 16-bit signed integer read as $x = k/2^{15}$, covering $[-1, 1 - 2^{-15}]$ in steps of $2^{-15} \approx 3.05\times10^{-5}$. **Q31** uses 32 bits for extra precision. Q15 suits filter coefficients and normalised signals; for physical values you pick $n$ to fit the range (a Q7.8 value in a 16-bit register covers ±128 in steps of 1/256).

**Addition** is ordinary integer addition, because both operands share the same scale. The result can overflow, so DSP code uses **saturation**: clamp to the largest or smallest representable value instead of wrapping around. In a control loop, a wrapped value turns full positive torque into full negative torque.

**Multiplication** doubles the scale: $(a/2^{15})(b/2^{15}) = ab/2^{30}$. Keep the 32-bit product, then shift right by 15 to get back to Q15. Two details matter:

- **Rounding**: add $2^{14}$ before the shift. Plain truncation (shifting) always rounds toward −∞, which biases results by −½ LSB on average. That bias accumulates in integrators.
- **The one overflow case**: $-1\times-1 = +1$, which Q15 can't represent. Saturate it to $1 - 2^{-15}$ (0x7FFF).

With rounding, the error of each multiply is at most ½ LSB, $2^{-16}$.

:::figure widget=q15 caption="Error of 20 000 random Q15 multiplies against exact arithmetic. Rounding keeps the error centred within ±½ LSB; truncation shifts it to between −1 and 0."
:::end

## Worked example

Multiply $0.7$ by $-0.3$ in Q15.

1. Encode: $0.7\times32768 = 22\,937.6$, round to 22 938. $-0.3\times32768 = -9830.4$, round to −9830.
2. Integer product: $22\,938\times(-9830) = -225\,480\,540$.
3. Add $2^{14} = 16\,384$ and shift right by 15 (floor division): $\lfloor -225\,464\,156/32768\rfloor = -6881$.
4. Decode: $-6881/32768 = -0.209991$. The exact product is −0.21; the error (+0.28 LSB) mostly comes from encoding 0.7 and −0.3, not from the multiply.
5. Truncating instead gives $\lfloor -225\,480\,540/32768\rfloor = -6882$, which is half an LSB further away.

## Code it from scratch

:::code file=q15.py
```python
import numpy as np

ONE = 1 << 15
MAX, MIN = ONE - 1, -ONE

def sat(x):
    return max(MIN, min(MAX, x))

def to_q15(x):
    return sat(int(round(x * ONE)))

def q15_add(a, b):
    return sat(a + b)

def q15_mul(a, b, rounding=True):
    p = a * b
    return sat((p + (1 << 14)) >> 15 if rounding else p >> 15)   # >> is floor division, like the hardware

if __name__ == "__main__":
    a, b = to_q15(0.7), to_q15(-0.3)
    assert (a, b) == (22938, -9830) and q15_mul(a, b) == -6881 and q15_mul(a, b, False) == -6882
    assert q15_mul(MIN, MIN) == MAX                                 # -1 * -1 saturates
    assert q15_add(to_q15(0.75), to_q15(0.75)) == MAX               # saturates instead of wrapping
    rng = np.random.default_rng(15)
    A = rng.integers(MIN, MAX + 1, 50_000); B = rng.integers(MIN, MAX + 1, 50_000)
    err_r = np.array([q15_mul(int(x), int(y)) for x, y in zip(A, B)]) - A * B / ONE
    err_t = np.array([q15_mul(int(x), int(y), False) for x, y in zip(A, B)]) - A * B / ONE
    ok = ~((A == MIN) & (B == MIN))
    print(f"rounding: max |err| {np.abs(err_r[ok]).max():.4f} LSB, mean {err_r.mean():+.4f}; truncation mean {err_t.mean():+.4f} LSB")
    assert np.abs(err_r[ok]).max() <= 0.5 and abs(err_r.mean()) < 0.01   # within half an LSB, unbiased
    assert -1 < err_t.min() and err_t.max() <= 0 and abs(err_t.mean() + 0.5) < 0.01
```
:::end

## Exercises

:::exercise
A motor current of ±40 A must be stored in a 16-bit signed register with the finest resolution possible. Which Q format, and what's the resolution?
:::solution
You need ±40, so 6 integer bits plus sign cover ±64: Q6.9, giving $1/512 = 1.95$ mA steps. (Q5.10 only reaches ±32.)
:::end

:::exercise
Why does truncation make a discrete integrator drift?
:::solution
Each truncated multiply errs by −½ LSB on average. An integrator sums thousands of them, so the error grows linearly with time instead of averaging out.
:::end

## Quiz

:::quiz
- type: num
  q: What is 0.7 in Q15 (rounded)?
  answer: 22938
  tol: 0.0001
  py: "round(0.7*32768)"
  explain: Multiply by $2^{15}$.
- type: num
  q: Q15 product of 22938 and −9830, with rounding?
  answer: -6881
  tol: 0.0001
  py: "(22938*-9830 + 16384)//32768"
  explain: Add $2^{14}$, then floor-shift by 15.
- type: num
  q: What is one Q15 LSB as a decimal?
  answer: 3.0518e-5
  tol: 0.001
  py: "2**-15"
  explain: $2^{-15}$.
- type: mc
  q: Saturation means…
  options:
    - wrapping around on overflow
    - clamping to the largest or smallest representable value
    - rounding to the nearest LSB
    - converting to float
  answer: 1
  explain: Wrapping flips the sign, which is dangerous in control.
- type: mc
  q: The only Q15 × Q15 product that overflows is…
  options:
    - 0.5 × 0.5
    - −1 × −1
    - −1 × 1
    - 1 × 1
  answer: 1
  explain: +1 isn't representable in Q15.
- type: num
  q: Resolution in mA of Q6.9 for amps?
  answer: 1.9531
  tol: 0.001
  unit: mA
  py: "1000/512"
  explain: $2^{-9}$ A.
:::end

:::verify
assert (22938*-9830) == -225480540 and (-225480540+16384)//32768 == -6881
:::end
