---
id: p03-l06
minutes: 30
summary: Partial fractions turn a transfer function times an input into a sum of table entries, so you can write the time response in closed form. You derive the residue formula for distinct poles, handle a repeated pole, and check the reconstruction against simulation.
---

## Splitting a rational function

If $X(s) = N(s)/D(s)$ has more poles than zeros and the poles $p_i$ are distinct,

$$X(s) = \sum_i \frac{r_i}{s - p_i} \quad\Longrightarrow\quad x(t) = \sum_i r_i\,e^{p_i t}.$$

Each term is one table entry from lesson 3. Finding the residues $r_i$ is the only work.

**Cover-up rule.** Multiply both sides by $(s - p_k)$ and let $s \to p_k$. Every other term vanishes:

$$r_k = \lim_{s \to p_k}(s - p_k)X(s) = \frac{N(p_k)}{D'(p_k)}.$$

The second form follows from L'Hôpital's rule, since $D(p_k) = 0$. It's the one to code, because you don't need to factor $D$ by hand.

**Complex poles** come in conjugate pairs with conjugate residues, so their two terms add to a real $2|r|e^{\sigma t}\cos(\omega t + \angle r)$.

**Repeated poles.** A pole of multiplicity $m$ needs terms $\frac{r_{k,1}}{s - p} + \dots + \frac{r_{k,m}}{(s - p)^m}$. In the time domain they become $t^{j-1}e^{pt}/(j-1)!$. The top coefficient is again a cover-up: $r_{k,m} = \lim (s - p)^m X(s)$. The others need derivatives, or you can match coefficients.

:::figure widget=response args={"order":2} caption="A second-order step response is the sum of a step (pole at 0) and a decaying oscillation (the complex pair). Each partial-fraction term is one of those pieces."
:::end

## Worked example

Find the impulse response of $G(s) = \dfrac{s + 3}{(s+1)(s+2)(s+4)}$.

1. $r_1 = \dfrac{-1 + 3}{(-1+2)(-1+4)} = \dfrac{2}{3}$.
2. $r_2 = \dfrac{-2 + 3}{(-2+1)(-2+4)} = -\dfrac{1}{2}$.
3. $r_3 = \dfrac{-4 + 3}{(-4+1)(-4+2)} = -\dfrac{1}{6}$.
4. So $g(t) = \tfrac23 e^{-t} - \tfrac12 e^{-2t} - \tfrac16 e^{-4t}$.
5. Check: $g(0) = \tfrac23 - \tfrac12 - \tfrac16 = 0$. That has to hold: $G$ has two more poles than zeros, so its impulse response starts at zero (lesson 7).

**A repeated pole.** The step response of $1/(s+1)^2$ is $X = \dfrac{1}{s(s+1)^2} = \dfrac{1}{s} - \dfrac{1}{s+1} - \dfrac{1}{(s+1)^2}$, which gives $x(t) = 1 - e^{-t} - t\,e^{-t}$. Check at $t = 1$: $1 - 2/e = 0.2642$.

## Code it from scratch

:::code file=residues.py
```python
import numpy as np
from scipy import signal

def residues(num, den):
    """Residues r_i = N(p_i)/D'(p_i) for a strictly proper TF with distinct poles."""
    p = np.roots(den)
    if np.min(np.abs(p[:, None] - p[None, :]) + np.eye(len(p)) * 1e9) < 1e-6:
        raise ValueError("repeated poles: use the repeated-pole formula")
    return np.polyval(num, p) / np.polyval(np.polyder(den), p), p

def impulse(num, den, t):
    r, p = residues(num, den)
    return np.real(sum(ri * np.exp(pi * t) for ri, pi in zip(r, p)))

if __name__ == "__main__":
    num, den = [1, 3], np.poly([-1, -2, -4])
    r, p = residues(num, den)
    order = np.argsort(-p.real)
    assert np.allclose(r[order].real, [2/3, -1/2, -1/6])
    t = np.linspace(0, 8, 4001)
    g = impulse(num, den, t)
    _, g_sim = signal.impulse((num, den), T=t)              # scipy's state-space simulation
    assert np.max(np.abs(g - g_sim)) < 1e-9
    # complex pair: 20/(s^2 + 4s + 20) times step 1/s
    t2 = np.linspace(0, 5, 2001)
    y = impulse([20], np.polymul([1, 4, 20], [1, 0]), t2)
    _, y_sim = signal.step(([20], [1, 4, 20]), T=t2)
    assert np.max(np.abs(y - y_sim)) < 1e-9
    try:
        residues([1], [1, 2, 1]); raise AssertionError("should refuse a repeated pole")
    except ValueError:
        pass
    x = lambda t: 1 - np.exp(-t) - t * np.exp(-t)          # repeated-pole result
    _, xs = signal.step(([1], [1, 2, 1]), T=t)
    assert np.max(np.abs(x(t) - xs)) < 1e-9
    print("residues", np.round(r[order].real, 4), "; reconstruction matches simulation")
```
:::end

## Exercises

:::exercise
Find the step response of $G(s) = \dfrac{6}{(s+1)(s+3)}$.
:::solution
$X = \frac{6}{s(s+1)(s+3)}$. Residues: at 0, $6/3 = 2$; at −1, $6/((-1)(2)) = -3$; at −3, $6/((-3)(-2)) = 1$. So $x(t) = 2 - 3e^{-t} + e^{-3t}$. Check: $x(0) = 0$, and $x(\infty) = 2 = G(0)$.
:::end

:::exercise
Why is the residue of a step response at $s = 0$ always the DC gain $G(0)$?
:::solution
$X = G(s)/s$, so the cover-up at $s = 0$ gives $r_0 = \lim_{s\to0} s\cdot G(s)/s = G(0)$. That term is the constant the response settles to, provided every other pole is in the left half-plane.
:::end

## Quiz

:::quiz
- type: num
  q: What is the residue at $s = -1$ of $(s+3)/((s+1)(s+2)(s+4))$?
  answer: 0.66667
  tol: 0.001
  py: "2/3"
  explain: $(−1 + 3)/((1)(3)) = 2/3$.
- type: num
  q: What is the residue at $s = -4$ of the same function?
  answer: -0.16667
  tol: 0.001
  py: "-1/6"
  explain: $(−4 + 3)/((−3)(−2)) = −1/6$.
- type: mc
  q: The cover-up formula $r_k = N(p_k)/D'(p_k)$ requires…
  options:
    - all poles real
    - the pole $p_k$ to be distinct (multiplicity 1)
    - $D$ to be monic
    - a stable system
  answer: 1
  explain: For a repeated pole $D'(p_k) = 0$ as well, and you need the repeated-pole terms.
- type: num
  q: "For $x(t) = 1 - e^{-t} - te^{-t}$, what is $x(1)$?"
  answer: 0.26424
  tol: 0.001
  py: "1-2*math.exp(-1)"
  explain: $1 - 2/e$.
- type: num
  q: What constant does the step response of $6/((s+1)(s+3))$ settle to?
  answer: 2
  tol: 0.001
  py: "6/3"
  explain: The residue at $s = 0$ equals $G(0) = 6/3$.
- type: mc
  q: A repeated pole at $s = -a$ produces a time-domain term like…
  options:
    - $e^{-2at}$
    - $t\,e^{-at}$
    - $\cos(at)$
    - $1/t$
  answer: 1
  explain: $1/(s + a)^2 \leftrightarrow t\,e^{-at}$.
:::end

:::verify
import math
assert abs(2/3-1/2-1/6)<1e-12 and abs(1-2/math.e-0.2642)<1e-4
:::end
