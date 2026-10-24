---
id: p06-l15
minutes: 35
summary: An R-2R ladder makes an n-bit DAC from just two resistor values. You derive the binary weights by Thevenin reduction, check them against a full nodal solve, then use Monte Carlo resistor tolerances to see when the DAC stops being monotonic.
---

## Why R-2R works

Build a ladder: a chain of series resistors $R$, with a $2R$ leg from each node to a bit switch (0 V or $V_{ref}$) and a $2R$ termination at the LSB end. Look into the LSB node from the right: the termination $2R$ in parallel with bit 0's $2R$ leg is $R$, plus the next series $R$ gives $2R$ again. Every node therefore sees $2R$ to its left. So at each node, the voltage injected by a bit is **halved** on its way to the next node.

Bit $k$ (0 = LSB) contributes $V_{ref}\,2^{k-n}$ at the output, so

$$V_{out} = V_{ref}\,\frac{\text{code}}{2^n},$$

with an output resistance of $R$ whatever the code (buffer it with an op-amp, Phase 05). Only two resistor values are needed, which is easy to match on a chip or in a resistor network. A binary-weighted DAC would need values spanning $2^n : 1$.

## Mismatch, DNL and monotonicity

DNL is defined as for the ADC (lesson 14): each step's size error in LSB. The worst step is usually the **major carry** 0111 1111 → 1000 0000, where all the low bits switch off and the MSB switches on. The MSB weight must match the sum of all the others to better than 1 LSB, which means about 1 part in $2^n$ relative to the MSB. If a step comes out negative (DNL < −1) the DAC is **non-monotonic**. Inside a control loop that's dangerous: a higher command gives a lower output, and the loop gain changes sign locally.

:::figure widget=r2r caption="DNL of an 8-bit ladder built from random resistors within the tolerance. Raise the tolerance past about 1 % and steps start to fall below −1 LSB."
:::end

## Worked example

An 8-bit ladder with $R = 10$ kΩ, $V_{ref} = 3.3$ V and code 0xA5 = 165.

1. $V_{out} = 3.3\times165/256 = 2.127$ V.
2. The output resistance is 10 kΩ. Loading it with 100 kΩ would cut the output by 9 %, so add a buffer.
3. The MSB carries half the scale, about 128 LSB. To keep the major carry within ±0.5 LSB, its weight must be right to about $0.5/128 = 0.4$ %. That error is shared among several resistors, so ±0.1 % parts are comfortable and ±1 % parts are marginal.
4. The Monte Carlo below confirms it: at ±0.1 % every DAC is monotonic; at ±1 % a noticeable fraction isn't.

## Code it from scratch

:::code file=r2r.py
```python
import numpy as np

def ladder_weights(R, R2):
    """Thevenin reduction from the LSB end. R[k] series resistors between nodes k and k+1 (n-1 of them),
    R2[0] the termination, R2[k+1] the 2R leg of bit k. Returns each bit's output voltage for 1 V drive."""
    n = len(R2) - 1
    w = []
    for bit in range(n):
        rth, vth = R2[0], 0.0
        for k in range(n):
            rb, vin = R2[k + 1], 1.0 if k == bit else 0.0
            v = (vth / rth + vin / rb) / (1 / rth + 1 / rb)
            rp = 1 / (1 / rth + 1 / rb)
            if k == n - 1:
                w.append(v); break
            vth, rth = v, rp + R[k]
    return np.array(w)

def nodal_output(R, R2, code, vref=1.0):
    """Independent check: solve the ladder's node equations G v = i directly."""
    n = len(R2) - 1
    G, I = np.zeros((n, n)), np.zeros(n)
    for k in range(n):
        g = 1 / R2[k + 1]; G[k, k] += g; I[k] += g * vref * ((code >> k) & 1)
        if k == 0:
            G[0, 0] += 1 / R2[0]
        if k < n - 1:
            g = 1 / R[k]; G[k, k] += g; G[k + 1, k + 1] += g; G[k, k + 1] -= g; G[k + 1, k] -= g
    return np.linalg.solve(G, I)[-1]

def dnl(w):
    codes = np.arange(2 ** len(w))
    out = np.array([sum(w[b] for b in range(len(w)) if c >> b & 1) for c in codes])
    lsb = (out[-1] - out[0]) / (len(codes) - 1)
    return np.diff(out) / lsb - 1

if __name__ == "__main__":
    n, Rv = 8, 10e3
    R, R2 = np.full(n - 1, Rv), np.full(n + 1, 2 * Rv)
    w = ladder_weights(R, R2)
    assert np.allclose(w, [2.0**(k - n) for k in range(n)])        # bit k contributes Vref * 2^(k-n)
    assert abs(nodal_output(R, R2, 0b1010_0101) - 0xA5 / 256) < 1e-12
    rng = np.random.default_rng(5)
    def trial(tol):
        Rt = R * (1 + tol * rng.uniform(-1, 1, n - 1)); R2t = R2 * (1 + tol * rng.uniform(-1, 1, n + 1))
        wt = ladder_weights(Rt, R2t)
        c = 0b1100_1010
        assert abs(nodal_output(Rt, R2t, c) - sum(wt[b] for b in range(n) if c >> b & 1)) < 1e-12
        d = dnl(wt)
        return np.abs(d).max(), d.min() > -1
    for tol, max_mean, mono_lo, mono_hi in ((0.001, 0.15, 1.0, 1.0), (0.01, 1.2, 0.6, 0.97), (0.02, 2.5, 0.2, 0.8)):
        res = [trial(tol) for _ in range(300)]
        worst = np.mean([r[0] for r in res]); mono = np.mean([r[1] for r in res])
        print(f"tolerance ±{tol*100:.1f} %: mean worst |DNL| {worst:.2f} LSB, monotonic {mono*100:.0f} % of DACs")
        assert worst < max_mean and mono_lo <= mono <= mono_hi
```
:::end

## Exercises

:::exercise
Why does the R-2R output resistance not depend on the code?
:::solution
Each bit switch connects its $2R$ leg to either 0 V or $V_{ref}$, both ideal voltage sources and so AC ground. The resistor network seen from the output is the same for every code, and it reduces to $R$.
:::end

:::exercise
How many resistors does a 12-bit R-2R ladder use, and what ratio would a binary-weighted 12-bit DAC need?
:::solution
11 series $R$ plus 13 $2R$ (12 legs and the termination): 24 resistors of two values. Binary-weighted needs $2^{11} = 2048 : 1$.
:::end

## Quiz

:::quiz
- type: num
  q: Output voltage for code 165, 8 bits, 3.3 V reference?
  answer: 2.1270
  tol: 0.001
  unit: V
  py: "3.3*165/256"
  explain: $V_{ref}\cdot\text{code}/2^n$.
- type: num
  q: Output resistance of an R-2R ladder with R = 10 kΩ?
  answer: 10
  tol: 0.001
  unit: kΩ
  py: "10"
  explain: It's $R$ for every code.
- type: mc
  q: The worst DNL of a binary DAC is usually at…
  options:
    - code 0
    - the major carry at mid-scale
    - full scale
    - a random code
  answer: 1
  explain: All bits switch at once.
- type: mc
  q: A non-monotonic DAC in a control loop…
  options:
    - is harmless
    - can locally reverse the loop gain's sign
    - improves stability
    - only adds offset
  answer: 1
  explain: A higher command gives a lower output.
- type: num
  q: Relative accuracy needed on the MSB weight for ±0.5 LSB at the major carry, 8 bits (in %)?
  answer: 0.39
  tol: 0.01
  unit: '%'
  py: "0.5/128*100"
  explain: Half an LSB out of 128.
- type: num
  q: Resistors in a 12-bit R-2R ladder?
  answer: 24
  tol: 0.001
  py: "11+13"
  explain: 11 series and 13 legs including the termination.
:::end

:::verify
assert abs(3.3*165/256 - 2.127) < 0.001
:::end
