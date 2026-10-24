---
id: p05-l22
minutes: 45
summary: SPICE is nodal analysis plus a time-stepping integrator plus Newton's method. You build a small transient simulator that stamps resistors, capacitors and sources into a matrix, uses backward-Euler companion models, matches analytic RC and RLC answers, and see why implicit integration is the default.
---

## Modified nodal analysis

Lesson 3 stamped resistors into $G\mathbf v = \mathbf i$. Ideal voltage sources don't fit that form (their current is unknown), so **modified nodal analysis (MNA)** adds each source's current as an extra unknown and its equation $v_a - v_b = V$ as an extra row:

$$\begin{bmatrix}G & B\\ B^T & 0\end{bmatrix}\begin{bmatrix}\mathbf v\\ \mathbf i_V\end{bmatrix} = \begin{bmatrix}\mathbf i\\ \mathbf V\end{bmatrix}.$$

## Companion models

Capacitors relate current to the *derivative* of voltage, so a transient simulator discretises time. **Backward Euler** at step $h$:

$$i_{n+1} = C\frac{v_{n+1} - v_n}{h} = \frac Ch\,v_{n+1} - \frac Ch\,v_n.$$

That's a conductance $C/h$ in parallel with a current source $\frac Chv_n$ that depends on the previous step's (known) voltage. Stamp both, solve the linear system, and repeat. An inductor becomes a resistor $L/h$ in series with a source; in MNA it's easiest to give it its own current unknown.

**Why implicit?** Forward Euler uses only the old values. It's simpler, but for a time constant τ it's unstable when $h > 2\tau$ (Phase 02 lesson 10). Real circuits have time constants from picoseconds to seconds, so explicit methods would need absurdly small steps. Backward Euler is stable for every $h$, at the cost of solving a matrix each step. The trapezoidal rule (SPICE's default) is second-order accurate and also stable. Nonlinear parts like diodes (lesson 10) add a Newton loop inside each time step.

:::figure widget=spice caption="RC charging (τ = 1 ms) with three integrators. Push the step past 2 ms with forward Euler and it diverges; backward Euler stays stable but lags; trapezoidal is the most accurate."
:::end

## Worked example

Simulate a 5 V step into $R = 1$ kΩ and $C = 1$ µF (τ = 1 ms), with $h = 0.1$ ms.

1. Nodes: 1 (source +) and 2 (capacitor). The source is an extra row.
2. Each step stamps: $R$ between 1 and 2; $C/h = 10$ mS from 2 to ground; and a current source $10\text{ mS}\times v_2^{(n)}$ into node 2.
3. After 1 ms (10 steps) backward Euler gives $5(1 - 1/1.1^{10}) = 3.072$ V; the exact value is $5(1 - e^{-1}) = 3.161$ V. Halving $h$ halves the error (first order).
4. The same code with an inductor solves a series RLC. With 10 mH, 1 µF and 20 Ω (lesson 7) and a small step, it reproduces the 72.9 % overshoot.

## Code it from scratch

:::code file=minispice.py
```python
import math
import numpy as np

class Circuit:
    def __init__(self, n):
        self.n, self.R, self.C, self.L, self.V = n, [], [], [], []

    def r(self, a, b, val): self.R.append((a, b, val))
    def c(self, a, b, val): self.C.append((a, b, val))
    def l(self, a, b, val): self.L.append((a, b, val))
    def v(self, a, b, val): self.V.append((a, b, val))

    def transient(self, h, steps):
        n, nv, nl = self.n, len(self.V), len(self.L)
        size = n + nv + nl
        x = np.zeros(size)
        out = [x[:n].copy()]
        def at(M, i, j, val):
            if i >= 0 and j >= 0:
                M[i, j] += val
        for _ in range(steps):
            A = np.zeros((size, size)); b = np.zeros(size)
            for a, c, val in self.R:
                g = 1 / val
                at(A, a - 1, a - 1, g); at(A, c - 1, c - 1, g); at(A, a - 1, c - 1, -g); at(A, c - 1, a - 1, -g)
            for a, c, val in self.C:                       # backward Euler companion
                g = val / h
                at(A, a - 1, a - 1, g); at(A, c - 1, c - 1, g); at(A, a - 1, c - 1, -g); at(A, c - 1, a - 1, -g)
                vprev = (x[a - 1] if a else 0) - (x[c - 1] if c else 0)
                if a: b[a - 1] += g * vprev
                if c: b[c - 1] -= g * vprev
            for k, (a, c, val) in enumerate(self.V):
                row = n + k
                at(A, a - 1, row, 1); at(A, row, a - 1, 1); at(A, c - 1, row, -1); at(A, row, c - 1, -1)
                b[row] = val
            for k, (a, c, val) in enumerate(self.L):       # v_a - v_c = L/h (i - i_prev)
                row = n + nv + k
                at(A, a - 1, row, 1); at(A, c - 1, row, -1)
                at(A, row, a - 1, 1); at(A, row, c - 1, -1); A[row, row] -= val / h
                b[row] = -val / h * x[row]
            x = np.linalg.solve(A, b)
            out.append(x[:n].copy())
        return np.array(out)

if __name__ == "__main__":
    ck = Circuit(2)
    ck.v(1, 0, 5.0); ck.r(1, 2, 1e3); ck.c(2, 0, 1e-6)
    v = ck.transient(1e-4, 10)[:, 1]
    assert abs(v[-1] - 5 * (1 - 1 / 1.1**10)) < 1e-9 and abs(v[-1] - 3.0722) < 1e-4
    errs = [abs(ck.transient(1e-3 / m, m)[-1, 1] - 5 * (1 - math.exp(-1))) for m in (100, 200)]
    assert 1.9 < errs[0] / errs[1] < 2.1                    # first order: halve h, halve the error
    # series RLC from lesson 7: nodes 1 (source), 2 (between R and L), 3 (capacitor)
    rlc = Circuit(3)
    rlc.v(1, 0, 1.0); rlc.r(1, 2, 20.0); rlc.l(2, 3, 10e-3); rlc.c(3, 0, 1e-6)
    vc = rlc.transient(2e-7, 5000)[:, 2]
    overshoot = vc.max() - 1
    print(f"RLC overshoot {100*overshoot:.2f} % (analytic 72.92 %)")
    assert abs(overshoot - 0.7292) < 0.01
    # backward Euler stays stable with a huge step; forward Euler would explode
    big = ck.transient(5e-3, 20)[:, 1]
    assert np.all(np.diff(big) >= 0) and abs(big[-1] - 5) < 1e-6
    fe = [0.0]
    for _ in range(20):
        fe.append(fe[-1] + 5.0 * (5 - fe[-1]))             # h/tau = 5
    assert abs(fe[-1]) > 1e6
```
:::end

## Exercises

:::exercise
Derive the trapezoidal companion model for a capacitor.
:::solution
Trapezoidal: $v_{n+1} = v_n + \frac h2\frac{i_{n+1} + i_n}{C}$, so $i_{n+1} = \frac{2C}hv_{n+1} - \left(\frac{2C}hv_n + i_n\right)$. That's a conductance $2C/h$ in parallel with a current source that depends on both the previous voltage and the previous current.
:::end

:::exercise
Why does backward Euler slightly *under*-shoot the RLC peak with a coarse step?
:::solution
Backward Euler adds numerical damping: for a pure oscillator its amplification factor per step has magnitude below 1, so energy is lost artificially. Smaller steps (or trapezoidal integration, which preserves oscillation amplitude) reduce it.
:::end

## Quiz

:::quiz
- type: num
  q: Backward-Euler capacitor voltage after 10 steps of h = 0.1 ms (5 V, τ = 1 ms)?
  answer: 3.07228
  tol: 0.001
  unit: V
  py: "5*(1-1/1.1**10)"
  explain: Each step multiplies the remaining gap by $1/(1 + h/\tau)$.
- type: num
  q: The exact value at t = 1 ms?
  answer: 3.16060
  tol: 0.001
  unit: V
  py: "5*(1-math.exp(-1))"
  explain: $5(1 - e^{-1})$.
- type: mc
  q: The backward-Euler companion model of a capacitor is…
  options:
    - a voltage source alone
    - a conductance C/h in parallel with a current source set by the previous voltage
    - an open circuit
    - a resistor h/C in series with an inductor
  answer: 1
  explain: $i_{n+1} = \frac Ch(v_{n+1} - v_n)$.
- type: mc
  q: MNA adds extra unknowns for…
  options:
    - resistors
    - voltage-source (and inductor) currents
    - node voltages only
    - capacitors
  answer: 1
  explain: Their currents can't be written from node voltages alone.
- type: num
  q: Largest stable forward-Euler step in ms for τ = 1 ms?
  answer: 2
  tol: 0.001
  unit: ms
  py: "2*1"
  explain: $|1 - h/\tau| \le 1$.
- type: mc
  q: SPICE handles a diode inside each time step with…
  options:
    - Newton iteration
    - a lookup table only
    - forward Euler
    - the Fourier transform
  answer: 0
  explain: Linearise, solve, repeat until converged.
:::end

:::verify
import math
assert abs(5*(1-math.exp(-1))-3.161)<5e-4
:::end
