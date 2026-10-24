---
id: p13-l03
minutes: 40
summary: A linear system is stable when every root of its characteristic polynomial has a negative real part, and the Routh-Hurwitz test tells you how many roots are in the right half-plane from the coefficients alone, without solving for them. You derive the Routh array and its two special cases, implement it, find the gain at which a third-order loop goes unstable, and test that the array's sign changes agree with numerically computed roots for hundreds of random polynomials.
---

## Stability is about roots

A closed loop with characteristic polynomial $a(s) = a_ns^n + \cdots + a_0$ is stable when every root has $\operatorname{Re} < 0$. A necessary condition is that all coefficients are non-zero and have the same sign. For degree three and up it isn't sufficient.

## The Routh array

Write the coefficients in two rows, alternating:

$$\begin{array}{c|cccc} s^n & a_n & a_{n-2} & a_{n-4} & \cdots \\ s^{n-1} & a_{n-1} & a_{n-3} & a_{n-5} & \cdots \end{array}$$

Each new row comes from the two above it: $b_i = \dfrac{a_{n-1}a_{n-2i} - a_na_{n-2i-1}}{a_{n-1}}$, and so on down to $s^0$.

**The number of sign changes in the first column equals the number of roots in the right half-plane.** The system is stable if and only if the first column has no sign change.

## Two special cases

1. **A zero in the first column** (the rest of the row isn't zero). Replace it with a small $\epsilon > 0$, carry on, and count sign changes as $\epsilon \to 0^+$.
2. **A whole row of zeros.** The row above defines an **auxiliary polynomial** $A(s)$ whose roots are symmetric about the origin (such as $\pm j\omega$ pairs). Replace the zero row with the coefficients of $A'(s)$ and continue. The roots of $A(s)$ are also roots of $a(s)$, which is how you find where a loop oscillates at the stability limit.

:::figure widget=routhgain caption="The closed-loop poles of K/((s + 1)(s + 2)(s + 3)) and the first column of its Routh array as you raise K. At K = 60 a pair of poles crosses the imaginary axis and two sign changes appear."
:::end

## Worked example

$L(s) = \dfrac{K}{(s + 1)(s + 2)(s + 3)}$, so $a(s) = s^3 + 6s^2 + 11s + 6 + K$.

$$\begin{array}{c|cc} s^3 & 1 & 11 \\ s^2 & 6 & 6 + K \\ s^1 & \frac{66 - 6 - K}{6} & 0 \\ s^0 & 6 + K & \end{array}$$

1. Stable if $60 - K > 0$ and $6 + K > 0$: $-6 < K < 60$.
2. At $K = 60$ the $s^1$ row is all zeros. The auxiliary polynomial is $6s^2 + 66$, so the loop oscillates at $\omega = \sqrt{11} = 3.32$ rad/s.

## Code it from scratch

:::code file=routh.py
```python
import numpy as np

def routh(coeffs, eps=1e-9):
    """Routh array of a polynomial (highest power first); returns the array and the number of RHP roots"""
    a = np.array(coeffs, float)
    if a[0] < 0: a = -a
    n = len(a) - 1
    width = (n + 2) // 2
    rows = [np.zeros(width), np.zeros(width)]
    rows[0][:len(a[0::2])] = a[0::2]; rows[1][:len(a[1::2])] = a[1::2]
    scale = np.max(np.abs(a))
    for i in range(2, n + 1):
        prev, above = rows[i - 1], rows[i - 2]
        if np.all(np.abs(prev) < 1e-12 * scale):            # row of zeros: use derivative of auxiliary polynomial
            order = n - (i - 2)
            powers = order - 2 * np.arange(width)
            prev = above * np.where(powers >= 0, powers, 0)
            rows[i - 1] = prev
        if abs(prev[0]) < 1e-12 * scale:                    # zero pivot: epsilon method
            prev = prev.copy(); prev[0] = eps * scale; rows[i - 1] = prev
        new = np.zeros(width)
        for j in range(width - 1):
            new[j] = (prev[0] * above[j + 1] - above[0] * prev[j + 1]) / prev[0]
        rows.append(new)
    first = np.array([r[0] for r in rows[:n + 1]])
    changes = int(np.sum(np.sign(first[:-1]) != np.sign(first[1:])))
    return rows[:n + 1], changes

def rhp_roots(coeffs):
    return int(np.sum(np.roots(coeffs).real > 0))

def test_worked_example():
    for K, expect in [(10, 0), (59, 0), (61, 2), (200, 2)]:
        _, ch = routh([1, 6, 11, 6 + K])
        assert ch == expect == rhp_roots([1, 6, 11, 6 + K])
    rows, _ = routh([1, 6, 11, 66])                        # K = 60: row of zeros
    w = np.sqrt(rows[1][1] / rows[1][0])
    print(f"K = 60: auxiliary polynomial {rows[1][0]:.0f}s^2 + {rows[1][1]:.0f}, oscillation at {w:.3f} rad/s")
    assert abs(w - np.sqrt(11)) < 1e-12

def test_special_cases():
    # zero in the first column: s^4 + s^3 + 2s^2 + 2s + 3 has two RHP roots
    _, ch = routh([1, 1, 2, 2, 3]); assert ch == 2 == rhp_roots([1, 1, 2, 2, 3])
    # row of zeros: (s - 1)(s + 1)(s + 2)(s^2 + 25) has one RHP root and a pair on the axis
    p = np.poly([1, -1, -2, 5j, -5j]).real
    _, ch = routh(p); assert ch == 1 == rhp_roots(np.round(p, 9))

def test_random_agreement():
    rng = np.random.default_rng(5); n_ok = 0
    for _ in range(500):
        deg = rng.integers(2, 9)
        roots = []
        while len(roots) < deg:
            if rng.random() < 0.4 and len(roots) <= deg - 2:
                re, im = rng.uniform(-3, 3), rng.uniform(0.2, 3); roots += [re + 1j * im, re - 1j * im]
            else:
                roots.append(rng.uniform(-3, 3))
        roots = np.array(roots)
        if np.min(np.abs(roots.real)) < 0.05: continue      # keep clear of the axis for a clean count
        p = np.poly(roots).real
        _, ch = routh(p)
        assert ch == int(np.sum(roots.real > 0)), (roots, ch)
        n_ok += 1
    print(f"{n_ok} random polynomials: Routh sign changes = RHP roots")

test_worked_example()
test_special_cases()
test_random_agreement()
print("PASS")
```
:::end

## Exercises

:::exercise
For what $K$ is $s^3 + 2s^2 + (K + 1)s + 3K$ stable?
:::solution
Routh: rows $[1, K + 1]$, $[2, 3K]$, then $s^1$: $(2(K + 1) - 3K)/2 = (2 - K)/2$, and $s^0$: $3K$. Need $K > 0$ and $K < 2$, so $0 < K < 2$.
:::end

:::exercise
Why does the epsilon method give the right answer?
:::solution
The roots depend continuously on the coefficients. Perturbing the polynomial slightly so that the zero becomes $\epsilon$ doesn't move any root across the imaginary axis (provided none sits on it), so the sign-change count of the perturbed array equals that of the original.
:::end

## Quiz

:::quiz
- type: num
  q: Largest stable K for K/((s + 1)(s + 2)(s + 3))?
  answer: 60
  tol: 0
  py: "6*11-6"
  explain: a₂a₁ = a₃a₀ at the limit.
- type: num
  q: Oscillation frequency in rad/s at that gain?
  answer: 3.317
  tol: 0.001
  unit: rad/s
  py: "11**0.5"
  explain: Auxiliary polynomial 6s² + 66.
- type: num
  q: Number of RHP roots of s⁴ + s³ + 2s² + 2s + 3?
  answer: 2
  tol: 0
  py: "2"
  explain: The epsilon method shows two sign changes.
- type: num
  q: Upper gain limit for s³ + 2s² + (K + 1)s + 3K?
  answer: 2
  tol: 0
  py: "2"
  explain: From the s¹ row.
- type: mc
  q: A row of zeros in the Routh array means…
  options:
    - roots symmetric about the origin, such as a pair on the imaginary axis
    - the system is always stable
    - a root at infinity
    - an arithmetic mistake
  answer: 0
  explain: Use the auxiliary polynomial.
- type: mc
  q: All coefficients positive guarantees stability for…
  options:
    - first- and second-order polynomials only
    - every polynomial
    - no polynomial
    - odd orders only
  answer: 0
  explain: From third order on you need the full test.
:::end
