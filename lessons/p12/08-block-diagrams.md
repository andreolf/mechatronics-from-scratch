---
id: p12-l08
minutes: 40
summary: Block diagrams describe a system as transfer functions joined by summing junctions and pick-off points, and three rules (series multiplies, parallel adds, feedback gives G over 1 plus GH) reduce any diagram to one transfer function, with Mason's rule doing it in one step. You derive the rules, implement polynomial transfer-function algebra and reduce a two-loop motor servo, and test the result against an independent state-space interconnection built with SciPy.
---

## Three rules

With transfer functions as ratios of polynomials in $s$:

- **series**: $G_1$ then $G_2$ is $G_1 G_2$;
- **parallel**: two paths summed is $G_1 + G_2$;
- **negative feedback**: forward path $G$, feedback $H$ gives

$$\frac{Y}{R} = \frac{G}{1 + GH}.$$

Moving a summing junction or a pick-off point past a block means multiplying or dividing the moved branch by that block. With these you can reduce nested loops from the inside out.

## Mason's gain formula

For tangled diagrams, Mason's rule gives the answer directly:

$$T = \frac{\sum_k P_k \Delta_k}{\Delta}, \qquad \Delta = 1 - \sum L_i + \sum L_iL_j - \ldots$$

where $P_k$ are the forward path gains, $L_i$ the loop gains (with their signs), the products run over loops that don't touch, and $\Delta_k$ is $\Delta$ with the loops touching path $k$ removed. For two nested loops that touch each other and the forward path, $\Delta = 1 - L_1 - L_2$ and $\Delta_1 = 1$.

## A motor servo

A position servo: controller $K$, an inner velocity loop around the motor, position from integrating velocity.

- Motor: $G_m(s) = \dfrac{k_m}{\tau s + 1}$ (voltage to speed).
- Inner loop: velocity feedback gain $k_v$.
- Integrator: $1/s$. Outer loop: unity position feedback.

Inside out: the velocity loop is $\frac{G_m}{1 + k_v G_m}$, then multiply by $K$ and $1/s$, then close the outer loop. Mason agrees: one forward path $P = KG_m/s$, loops $L_1 = -k_vG_m$, $L_2 = -KG_m/s$, which touch, so $T = P/(1 - L_1 - L_2)$.

:::figure widget=blockreduce caption="Reducing the two-loop servo step by step: the inner velocity loop collapses into one block, then the series blocks merge, then the outer loop closes. The transfer function at each step is shown below."
:::end

## Worked example

$K = 4$, $k_m = 10$, $\tau = 0.1$ s, $k_v = 0.2$.

1. Inner loop: $\frac{10/(0.1s + 1)}{1 + 2/(0.1s + 1)} = \frac{10}{0.1s + 3}$.
2. With $K$ and $1/s$: $\frac{40}{s(0.1s + 3)}$.
3. Outer loop: $T(s) = \dfrac{40}{0.1s^2 + 3s + 40} = \dfrac{400}{s^2 + 30s + 400}$.
4. So $\omega_n = 20$ rad/s and $\zeta = 30/40 = 0.75$: the velocity loop added the damping a pure position loop around $K G_m/s$ would lack ($\zeta = 10/(2\cdot\sqrt{400}) = 0.25$ without it).

## Code it from scratch

:::code file=blocks.py
```python
import numpy as np
from scipy import signal

class TF:
    """transfer function as numerator and denominator coefficient arrays, highest power first"""
    def __init__(self, num, den):
        num, den = np.atleast_1d(np.array(num, float)), np.atleast_1d(np.array(den, float))
        s = den[np.flatnonzero(den)[0]]
        self.num, self.den = np.trim_zeros(num / s, "f") if np.any(num) else np.array([0.0]), np.trim_zeros(den / s, "f")
    def __mul__(self, o):
        o = o if isinstance(o, TF) else TF([o], [1])
        return TF(np.polymul(self.num, o.num), np.polymul(self.den, o.den))
    __rmul__ = __mul__
    def __add__(self, o):
        o = o if isinstance(o, TF) else TF([o], [1])
        return TF(np.polyadd(np.polymul(self.num, o.den), np.polymul(o.num, self.den)), np.polymul(self.den, o.den))
    def feedback(self, H=1, sign=-1):
        H = H if isinstance(H, TF) else TF([H], [1])
        num = np.polymul(self.num, H.den)
        den = np.polyadd(np.polymul(self.den, H.den), -sign * np.polymul(self.num, H.num))
        return TF(num, den)
    def __call__(self, s):
        return np.polyval(self.num, s) / np.polyval(self.den, s)
    def __repr__(self):
        return f"TF({np.round(self.num, 6).tolist()}, {np.round(self.den, 6).tolist()})"

def servo_by_reduction(K, km, tau, kv):
    Gm = TF([km], [tau, 1])
    inner = Gm.feedback(kv)
    return (K * inner * TF([1], [1, 0])).feedback(1)

def servo_by_mason(K, km, tau, kv):
    Gm = TF([km], [tau, 1]); I = TF([1], [1, 0])
    P = K * Gm * I
    L1 = -kv * Gm
    L2 = -1 * (K * Gm * I)
    delta = TF([1], [1]) + (-1) * L1 + (-1) * L2
    return TF(np.polymul(P.num, delta.den), np.polymul(P.den, delta.num))

def servo_by_state_space(K, km, tau, kv):
    """independent check: connect the blocks as state-space systems with scipy and convert back"""
    A1, B1, C1, D1 = signal.tf2ss([km], [tau, 1])          # motor: voltage -> speed
    # states: motor state(s) x, position p.  u = K*(r - p) - kv*w,  w = C1 x
    n = A1.shape[0]
    A = np.zeros((n + 1, n + 1)); B = np.zeros((n + 1, 1)); C = np.zeros((1, n + 1))
    A[:n, :n] = A1 - kv * B1 @ C1
    A[:n, n:] = -K * B1
    A[n, :n] = C1                                          # p' = w
    B[:n, 0] = K * B1[:, 0]
    C[0, n] = 1
    num, den = signal.ss2tf(A, B, C, np.zeros((1, 1)))
    return TF(num[0], den)

def test_worked_example():
    T = servo_by_reduction(4, 10, 0.1, 0.2)
    print("reduced:", T)
    assert np.allclose(T.num, [400]) and np.allclose(T.den, [1, 30, 400])

def test_three_methods_agree():
    rng = np.random.default_rng(1)
    for _ in range(50):
        K, km, tau, kv = rng.uniform(0.5, 10), rng.uniform(1, 20), rng.uniform(0.01, 1), rng.uniform(0, 1)
        T1, T2, T3 = servo_by_reduction(K, km, tau, kv), servo_by_mason(K, km, tau, kv), servo_by_state_space(K, km, tau, kv)
        for w in np.geomspace(0.1, 1000, 30):
            s = 1j * w
            assert abs(T1(s) - T3(s)) <= 1e-9 * max(1, abs(T3(s)))
            assert abs(T2(s) - T3(s)) <= 1e-9 * max(1, abs(T3(s)))
    print("block reduction, Mason's rule and the SciPy state-space interconnection agree on 50 random servos")

def test_rules():
    G1, G2 = TF([1], [1, 2]), TF([3], [1, 5])
    s = 2j
    assert abs((G1 * G2)(s) - G1(s) * G2(s)) < 1e-12
    assert abs((G1 + G2)(s) - (G1(s) + G2(s))) < 1e-12
    assert abs(G1.feedback(G2)(s) - G1(s) / (1 + G1(s) * G2(s))) < 1e-12
    assert abs(G1.feedback(G2, sign=+1)(s) - G1(s) / (1 - G1(s) * G2(s))) < 1e-12

test_worked_example()
test_three_methods_agree()
test_rules()
print("PASS")
```
:::end

## Exercises

:::exercise
A disturbance torque enters between the controller output and the motor. Using the worked example, what's the transfer function from disturbance $D$ to position $Y$?
:::solution
The forward path from $D$ is $G_m/s$; the loops are unchanged. Mason: $Y/D = \frac{G_m/s}{1 + k_vG_m + KG_m/s} = \frac{10}{0.1s^2 + 3s + 40} = \frac{100}{s^2 + 30s + 400}$. At DC that's 0.25: a constant disturbance leaves a position error, which an integrator in $K$ would remove (Phase 13).
:::end

:::exercise
Why can't you always reduce a diagram by series/parallel/feedback rules alone, without moving blocks?
:::solution
When loops overlap without nesting (a pick-off inside one loop feeds a summer inside another), no subsystem is a pure series, parallel or feedback connection. You have to move a junction or pick-off past a block first, or use Mason's rule, which handles any topology.
:::end

## Quiz

:::quiz
- type: num
  q: DC gain of G/(1 + G) for G = 9 at DC?
  answer: 0.9
  tol: 0.001
  py: "9/(1 + 9)"
  explain: Unity feedback.
- type: num
  q: Damping ratio of the worked-example servo?
  answer: 0.75
  tol: 0.001
  py: "30/(2*400**0.5)"
  explain: 2ζω_n = 30, ω_n = 20.
- type: num
  q: Damping ratio without the velocity loop (k_v = 0)?
  answer: 0.25
  tol: 0.001
  py: "10/(2*400**0.5)"
  explain: Denominator s² + 10s + 400.
- type: num
  q: Value of Δ in Mason's rule for two touching loops with gains −2 and −3?
  answer: 6
  tol: 0
  py: "1 - (-2) - (-3)"
  explain: 1 − ΣL.
- type: mc
  q: Feedback with forward G and feedback H (negative) gives…
  options:
    - G/(1 + GH)
    - G/(1 − GH)
    - GH/(1 + G)
    - G + H
  answer: 0
  explain: The standard loop formula.
- type: mc
  q: What does Δ_k remove in Mason's rule?
  options:
    - the loops that touch forward path k
    - the forward paths
    - all loops
    - the non-touching pairs
  answer: 0
  explain: Δ_k is Δ evaluated without loops sharing a node with path k.
:::end
