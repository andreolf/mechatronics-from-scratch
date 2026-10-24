---
id: p03-l05
minutes: 35
summary: Pole locations on the s-plane predict the shape of a response before you simulate it. You derive what the real and imaginary parts of a pole do, the second-order formulas for overshoot, peak time and settling time, and why a fast extra pole barely matters.
---

## What a pole does

Each pole $p$ of $G(s)$ contributes a term $c\,e^{pt}$ to the impulse and step responses (lesson 6 shows why). Write $p = \sigma + j\omega_d$:

$$e^{pt} = e^{\sigma t}\,e^{j\omega_d t}.$$

- The real part $\sigma$ sets the envelope. If $\sigma < 0$ the term decays with time constant $1/|\sigma|$; if $\sigma > 0$ it grows, and the system is unstable.
- The imaginary part $\omega_d$ sets the oscillation frequency. Real systems have real coefficients, so complex poles come in conjugate pairs and their terms combine into $e^{\sigma t}\cos(\omega_d t + \varphi)$.

So the left half-plane is stable, the right half-plane is unstable, and the further left a pole sits, the faster its term dies.

## The second-order prototype

$$G(s) = \frac{\omega_n^2}{s^2 + 2\zeta\omega_n s + \omega_n^2}, \qquad p_{1,2} = -\zeta\omega_n \pm j\omega_n\sqrt{1 - \zeta^2}.$$

Geometry on the s-plane: the pole's distance from the origin is $\omega_n$, and the angle $\theta$ it makes with the negative real axis satisfies $\cos\theta = \zeta$. For $0 < \zeta < 1$ the step response is

$$y(t) = 1 - \frac{e^{-\zeta\omega_n t}}{\sqrt{1 - \zeta^2}}\sin(\omega_d t + \theta).$$

Setting $\dot y = 0$ gives the first peak at $t_p = \pi/\omega_d$. Substituting:

$$M_p = e^{-\pi\zeta/\sqrt{1 - \zeta^2}}, \qquad t_s \approx \frac{4}{\zeta\omega_n}.$$

The settling time is an envelope estimate: $e^{-\zeta\omega_n t} = 0.02$ at $t = 3.91/(\zeta\omega_n)$, rounded to 4. It's a rule of thumb, not a law. The true envelope carries an extra factor $1/\sqrt{1 - \zeta^2}$, and the response can enter the band early when an oscillation peak happens to fall just inside it. For $0.3 \le \zeta \le 0.7$ the real 2 % settling time lands within about 16 % of $4/(\zeta\omega_n)$, on either side.

**Zeros** are roots of the numerator. A left-half-plane zero adds a derivative-like kick and increases overshoot; a right-half-plane zero makes the response start in the wrong direction (like a bicycle's countersteer).

**Dominant poles.** A pole five to ten times further left than the others decays so quickly that the slow ones dominate the response. Designers routinely approximate a high-order system by its dominant pair.

:::figure widget=splane caption="Drag the pole (or tap with Drag on). Moving left speeds up the decay; moving up raises the oscillation frequency. ζ is the cosine of the angle from the negative real axis."
:::end

## Worked example

Poles at $-2 \pm 4j$:

1. $\omega_n = \sqrt{2^2 + 4^2} = 4.472$ rad/s, $\zeta = 2/4.472 = 0.4472$, and $\omega_d = 4$ rad/s.
2. Overshoot: $\zeta/\sqrt{1 - \zeta^2} = 0.5$, so $M_p = e^{-\pi/2} = 20.8$ %.
3. Peak time: $t_p = \pi/4 = 0.785$ s.
4. Settling estimate: $4/(\zeta\omega_n) = 4/2 = 2.0$ s. Simulating gives 1.87 s to stay within 2 %, so here the estimate is about 7 % pessimistic.
5. Add a third pole at $s = -20$, ten times further left, keeping the DC gain at 1. Overshoot drops only to 20.2 % and settling becomes 1.92 s. The dominant pair still explains the response.

## Code it from scratch

:::code file=poles.py
```python
import numpy as np

def step_response(num, den, t_end=10.0, n=200_001):
    """Step response from partial fractions with distinct poles: y = sum r_i/p_i (e^{p_i t} - 1)."""
    p = np.roots(den)
    dden = np.polyder(den)
    r = np.polyval(num, p) / np.polyval(dden, p)        # impulse-response residues
    t = np.linspace(0, t_end, n)
    y = np.real(sum(ri / pi * (np.exp(pi * t) - 1) for ri, pi in zip(r, p)))
    return t, y

def settling_time(t, y, band=0.02):
    final = y[-1]
    outside = np.nonzero(np.abs(y - final) > band * abs(final))[0]
    return t[outside[-1] + 1]

if __name__ == "__main__":
    t, y = step_response([20.0], [1.0, 4.0, 20.0])
    zeta, wn = 2 / np.sqrt(20), np.sqrt(20)
    Mp = y.max() - 1
    assert abs(Mp - np.exp(-np.pi * zeta / np.sqrt(1 - zeta**2))) < 1e-6
    assert abs(t[y.argmax()] - np.pi / 4) < 1e-3
    ts = settling_time(t, y)
    print(f"overshoot {Mp*100:.2f} %, settling {ts:.3f} s (estimate {4/(zeta*wn):.2f} s)")
    assert abs(ts - 1.868) < 0.002
    # the envelope rule is within about 16 % either way across practical damping ratios
    for z in (0.3, 0.4, 0.5, 0.6, 0.7):
        tt, yy = step_response([1.0], [1.0, 2 * z, 1.0], t_end=40.0)
        ratio = settling_time(tt, yy) / (4 / z)
        assert 0.84 < ratio < 1.05, (z, ratio)
    # a pole 10x further left barely changes things
    t3, y3 = step_response([400.0], np.polymul([1, 4, 20], [1, 20]))
    assert abs((y3.max() - 1) - 0.2021) < 1e-3 and abs(settling_time(t3, y3) - 1.917) < 0.003
```
:::end

## Exercises

:::exercise
A position loop must overshoot by at most 5 % and settle within 0.4 s. Where must its dominant poles lie?
:::solution
1. $M_p \le 5$ % needs $\zeta \ge 0.69$, which is $\theta \le \arccos 0.69 = 46.4°$ from the negative real axis.
2. $t_s \approx 4/(\zeta\omega_n) \le 0.4$ needs $\zeta\omega_n \ge 10$: real part at or left of $-10$.
3. The allowed region is a wedge of ±46° about the negative real axis, cut off to the left of $\sigma = -10$.
:::end

:::exercise
What happens to the step response as a pole pair moves straight up (constant $\sigma$, increasing $\omega_d$)?
:::solution
The envelope $e^{\sigma t}$ is unchanged, so the settling time stays about the same. Oscillation frequency rises and $\zeta$ falls, so overshoot grows toward 100 %.
:::end

## Quiz

:::quiz
- type: num
  q: Poles at $-2 \pm 4j$. What is $\zeta$?
  answer: 0.4472
  tol: 0.001
  py: "2/math.sqrt(20)"
  explain: $\zeta = |\sigma|/\omega_n = 2/\sqrt{20}$.
- type: num
  q: What overshoot in percent do poles at $-2 \pm 4j$ give?
  answer: 20.79
  tol: 0.003
  unit: "%"
  py: "100*math.exp(-math.pi/2)"
  explain: $\zeta/\sqrt{1 - \zeta^2} = 0.5$, so $M_p = e^{-\pi/2}$.
- type: num
  q: What is the peak time in seconds for poles at $-2 \pm 4j$?
  answer: 0.7854
  tol: 0.001
  unit: s
  py: "math.pi/4"
  explain: $t_p = \pi/\omega_d$.
- type: mc
  q: A pole at $s = +0.5$ means…
  options:
    - a slow but stable mode
    - a mode that grows like $e^{0.5t}$: unstable
    - an oscillation at 0.5 rad/s
    - nothing, positive poles cancel
  answer: 1
  explain: Positive real part means a growing exponential.
- type: num
  q: Estimate the 2 % settling time in seconds for $\zeta = 0.5$ and $\omega_n = 8$ rad/s.
  answer: 1
  tol: 0.001
  unit: s
  py: "4/(0.5*8)"
  explain: $4/(\zeta\omega_n) = 1$ s.
- type: mc
  q: Which pole dominates the response of a system with poles at −1 and −50?
  options:
    - −50, because it is larger
    - −1, because its term decays slowest
    - Both equally
    - Neither; zeros dominate
  answer: 1
  explain: $e^{-50t}$ vanishes within 0.1 s; $e^{-t}$ lasts for seconds.
:::end

:::verify
import math
assert abs(math.degrees(math.acos(0.69))-46.4)<0.05
assert abs(math.log(1/0.02)-3.91)<0.005
:::end
