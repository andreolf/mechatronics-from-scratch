---
id: p13-l11
minutes: 40
summary: The root locus is the path the closed-loop poles trace as one gain goes from zero to infinity, and a handful of rules from the angle and magnitude conditions let you sketch it by hand, including where it starts and ends, its asymptotes and where branches break away from the real axis. You derive those rules, compute the locus by sweeping the gain and tracking roots, and test every computed point against the angle condition, the asymptotes, the breakaway equation and the Routh crossing gain.
---

## Two conditions

With loop $KL(s) = K\,N(s)/D(s)$, the closed-loop poles solve $D(s) + KN(s) = 0$, that is $KL(s) = -1$. A point $s$ is on the locus for some $K > 0$ exactly when

$$\angle L(s) = 180° \pmod{360°} \qquad\text{(angle condition)},$$

and the gain that puts a pole there is $K = 1/|L(s)|$ (magnitude condition).

## Sketching rules

For $n$ poles and $m$ zeros of $L$:

1. Branches start at the open-loop poles ($K = 0$) and end at the zeros ($K \to \infty$); $n - m$ go to infinity.
2. On the real axis, the locus lies to the left of an odd number of real poles and zeros.
3. The $n - m$ far branches follow asymptotes at angles $\frac{(2q + 1)180°}{n - m}$ from the centroid $\sigma_a = \frac{\sum p_i - \sum z_j}{n - m}$.
4. Branches meet and leave the real axis at **breakaway points**, roots of $N'D - ND' = 0$.
5. Crossings of the imaginary axis come from the Routh array (lesson 03).

:::figure widget=rootlocus caption="The root locus of K/(s(s + 2)(s + 4)) with the closed-loop poles for the gain you choose. Above K = 48 two poles cross into the right half-plane."
:::end

## Worked example

$L(s) = \dfrac{1}{s(s + 2)(s + 4)}$: three poles, no zeros.

1. Real-axis segments: $(-2, 0)$ and $(-\infty, -4)$.
2. Asymptotes: centroid $(0 - 2 - 4)/3 = -2$, angles 60°, 180°, 300°.
3. Breakaway: $D' = 3s^2 + 12s + 8 = 0$ gives $s = -2 \pm 1.155$; only $-0.845$ lies on the locus. The gain there is $1/|L(-0.845)| = 3.08$.
4. Imaginary-axis crossing: $s^3 + 6s^2 + 8s + K$, Routh limit $6 \times 8 = K$, so $K = 48$ at $\omega = \sqrt8 = 2.83$ rad/s.

## Code it from scratch

:::code file=rootlocus.py
```python
import numpy as np
from scipy.optimize import linear_sum_assignment

def root_locus(num, den, gains):
    """closed-loop roots of den + K num for each K, ordered so each branch is continuous"""
    num = np.pad(num, (len(den) - len(num), 0))
    prev = np.roots(den); out = [prev]
    for K in gains[1:]:
        r = np.roots(den + K * num)
        cost = np.abs(prev[:, None] - r[None, :])
        _, j = linear_sum_assignment(cost)
        prev = r[j]; out.append(prev)
    return np.array(out)

num, den = np.array([1.0]), np.poly([0, -2, -4])
L = lambda s: np.polyval(num, s) / np.polyval(den, s)
gains = np.concatenate([[0], np.logspace(-3, 4, 4000)])
locus = root_locus(num, den, gains)

def test_angle_and_magnitude_conditions():
    worst_a = worst_m = 0
    for K, roots in zip(gains[1:], locus[1:]):
        for s in roots:
            ang = np.degrees(np.angle(L(s)))
            worst_a = max(worst_a, abs(abs(ang) - 180))
            worst_m = max(worst_m, abs(K * abs(L(s)) - 1))
    print(f"{locus[1:].size} locus points: worst angle error {worst_a:.1e} deg, worst magnitude error {worst_m:.1e}")
    assert worst_a < 1e-6 and worst_m < 1e-6

def test_asymptotes():
    far = locus[-1]                                       # K = 1e4
    centroid = (0 - 2 - 4) / 3
    angles = sorted(np.degrees(np.angle(far - centroid)) % 360)
    print("far-branch angles from the centroid:", np.round(angles, 2))
    assert np.allclose(angles, [60, 180, 300], atol=1.0)

def test_breakaway():
    cands = np.roots(np.polysub(np.polymul(np.polyder(num), den), np.polymul(num, np.polyder(den))))
    real = [c.real for c in cands if abs(c.imag) < 1e-9 and -2 < c.real < 0]
    sb = real[0]; Kb = 1 / abs(L(sb))
    print(f"breakaway at s = {sb:.4f}, K = {Kb:.4f}")
    assert abs(sb - (-2 + 2 / np.sqrt(3))) < 1e-9
    # just below Kb two real roots near sb, just above a complex pair
    r_lo = np.roots(den + (Kb * 0.999) * np.pad(num, (3, 0))); r_hi = np.roots(den + (Kb * 1.001) * np.pad(num, (3, 0)))
    assert np.sum(np.abs(r_lo.imag) > 1e-6) == 0 and np.sum(np.abs(r_hi.imag) > 1e-6) == 2

def test_crossing_matches_routh():
    i = np.argmax([np.max(r.real) > 0 for r in locus])
    K_cross = gains[i]
    print(f"first right-half-plane pole at K = {K_cross:.2f} (Routh: 48)")
    assert abs(K_cross - 48) / 48 < 0.01
    r = np.roots(den + 48 * np.pad(num, (3, 0)))
    assert np.isclose(np.max(np.abs(r.imag)), np.sqrt(8), atol=1e-6)

test_angle_and_magnitude_conditions()
test_asymptotes()
test_breakaway()
test_crossing_matches_routh()
print("PASS")
```
:::end

## Exercises

:::exercise
Add a zero at $s = -3$ to the example: $L = (s + 3)/(s(s + 2)(s + 4))$. Where are the asymptotes now, and can the loop go unstable?
:::solution
$n - m = 2$, so asymptotes at ±90° from $\sigma_a = (-6 + 3)/2 = -1.5$. The far branches run vertically at $\operatorname{Re} = -1.5$ and never cross into the right half-plane: the loop is stable for all $K > 0$. Zeros pull the locus left, which is what lead compensation exploits (lesson 12).
:::end

:::exercise
Use the magnitude condition to find the gain that puts the complex poles of the example at damping $\zeta = 0.5$.
:::solution
The $\zeta = 0.5$ line is at 120° from the positive real axis. Searching along it for the angle condition gives $s \approx -0.67 + 1.16j$, and $K = 1/|L(s)| = |s||s + 2||s + 4| \approx 1.33 \times 1.76 \times 3.53 \approx 8.3$.
:::end

## Quiz

:::quiz
- type: num
  q: Asymptote centroid of 1/(s(s + 2)(s + 4))?
  answer: -2
  tol: 0
  py: "(0-2-4)/3"
  explain: Sum of poles over n − m.
- type: num
  q: Breakaway point of that locus?
  answer: -0.8453
  tol: 0.001
  py: "-2+2/3**0.5"
  explain: Root of 3s² + 12s + 8 between the poles.
- type: num
  q: Gain at the breakaway point?
  answer: 3.079
  tol: 0.002
  py: "0.8453*(2-0.8453)*(4-0.8453)"
  explain: K = |s||s + 2||s + 4|.
- type: num
  q: Gain at which it crosses into the right half-plane?
  answer: 48
  tol: 0
  py: "6*8"
  explain: Routh.
- type: mc
  q: A point is on the root locus when…
  options:
    - the angle of L(s) is 180° (mod 360°)
    - "|L(s)| = 1"
    - L(s) is real
    - it is a pole of L
  answer: 0
  explain: The magnitude then gives K.
- type: mc
  q: As K → ∞, branches end at…
  options:
    - the open-loop zeros, or infinity along asymptotes
    - the open-loop poles
    - the origin
    - the imaginary axis
  answer: 0
  explain: D + KN ≈ KN.
:::end
