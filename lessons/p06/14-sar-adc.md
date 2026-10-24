---
id: p06-l14
minutes: 40
summary: The successive-approximation ADC in nearly every microcontroller is a binary search with a DAC and a comparator. You derive it, measure differential and integral non-linearity from transition levels and from a ramp histogram, and see how one mismatched capacitor creates missing codes.
---

## A binary search in hardware

An $n$-bit SAR ADC holds the input on a sampling capacitor, then decides one bit per clock:

1. Set the MSB of the trial code and let the internal DAC produce $V_{dac} = V_{ref}\cdot\text{code}/2^n$.
2. The comparator checks $V_{in} \ge V_{dac}$. If so, keep the bit; otherwise clear it.
3. Move to the next bit. After $n$ comparisons the code is the largest one with $V_{dac} \le V_{in}$.

A 12-bit SAR at 16 MHz needs 12 conversion clocks plus a few for sampling, so it converts at about 1 MS/s. The DAC is usually a binary-weighted capacitor array, so its accuracy is set by how well the capacitors match.

## DNL and INL

An ideal ADC switches from code $k-1$ to $k$ at the transition level $T_k = k\cdot\text{LSB}$. Real ones don't:

- **Differential non-linearity**: $\text{DNL}_k = (T_{k+1}-T_k)/\text{LSB} - 1$, the error in each code's width. $\text{DNL} = -1$ means the code never appears: a **missing code**.
- **Integral non-linearity**: $\text{INL}_k = (T_k - k\cdot\text{LSB})/\text{LSB}$, the accumulated deviation from the straight line (after removing offset and gain error).

You can measure them without knowing the transitions: feed a slow ramp covering the range, histogram the codes, and each code's count is proportional to its width.

:::figure widget=sar caption="The SAR trials for one conversion: each dot is a DAC voltage tried, lime where the bit was kept. Change the resolution and watch the search take one step per bit."
:::end

## Worked example

An 8-bit SAR with $V_{ref} = 3.3$ V converts 2.137 V.

1. LSB $= 3.3/256 = 12.89$ mV.
2. Trials, MSB first: 128 (1.650 V) keep; 192 (2.475 V) clear; 160 (2.063 V) keep; 176 (2.269 V) clear; 168 (2.166 V) clear; 164 (2.114 V) keep; 166 (2.140 V) clear; 165 (2.127 V) keep.
3. The final code is **165**, and $165\times12.89 = 2.127$ V. That's 0.77 LSB below the input, because a SAR truncates.
4. If the MSB capacitor is 1 % large, its weight is 129.28 LSB instead of 128, while the lower bits are unchanged. The transition into code 128 moves up by 1.28 LSB, so code 127 becomes 2.28 LSB wide: DNL +1.28. If the MSB is 1 % *small* instead, the transition into 128 falls to 126.72 LSB, below the transition into 127. Code 127 can never appear: a missing code.

## Code it from scratch

:::code file=sar.py
```python
import numpy as np

def sar_convert(vin, weights, lsb):
    """weights[k] is the DAC weight of bit k in LSB units (ideal: 2**k)."""
    code = 0
    for k in reversed(range(len(weights))):
        trial = code | (1 << k)
        vdac = lsb * sum(weights[b] for b in range(len(weights)) if trial >> b & 1)
        if vin >= vdac:
            code = trial
    return code

def transitions(weights, lsb):
    """Transition level into each code: the DAC voltage of that code."""
    n = len(weights)
    return np.array([lsb * sum(weights[b] for b in range(n) if c >> b & 1) for c in range(2**n)])

def dnl_inl(T, lsb):
    width = np.diff(T) / lsb
    dnl = width - 1               # dnl[k] is code k's width error (the top code has no upper edge)
    inl = T / lsb - np.arange(len(T))
    return dnl, inl

if __name__ == "__main__":
    n, vref = 8, 3.3
    lsb = vref / 2**n
    ideal = [2**k for k in range(n)]
    assert sar_convert(2.137, ideal, lsb) == 165 and abs(2.137 / lsb - 165 - 0.77) < 0.01
    dnl, inl = dnl_inl(transitions(ideal, lsb), lsb)
    assert np.allclose(dnl, 0) and np.allclose(inl, 0)
    bad = ideal.copy(); bad[7] *= 1.01                      # MSB 1 % large
    T = transitions(bad, lsb)
    dnl, inl = dnl_inl(T, lsb)
    print(f"MSB +1 %: DNL at code 127 = {dnl[127]:+.2f} LSB, max INL = {inl.max():.2f} LSB")
    assert abs(dnl[127] - 1.28) < 1e-9                       # code 127 is wider by the extra MSB weight
    # MSB 1 % small instead: code 127 gets narrower than 0 -> the code goes missing
    small = ideal.copy(); small[7] *= 0.99
    vin = np.linspace(0, vref * 0.999, 200_000)
    codes = np.array([sar_convert(v, small, lsb) for v in vin[::20]])
    hist = np.bincount(codes, minlength=256)
    assert hist[127] == 0, "missing code"
    # histogram test recovers code widths for the +1 % case
    codes = np.array([sar_convert(v, bad, lsb) for v in vin[::4]])
    hist = np.bincount(codes, minlength=256).astype(float)
    est = hist / hist[1:125].mean() - 1
    assert abs(est[127] - dnl[127]) < 0.05
    print("missing code 127 found with MSB -1 %; ramp histogram DNL matches the transition levels")
```
:::end

## Exercises

:::exercise
Why does a SAR's error lie between 0 and +1 LSB, and how do you centre it?
:::solution
It finds the largest code at or below the input, so it truncates. Shift the DAC (or the input) by half an LSB so the transitions sit at $(k-\tfrac12)$ LSB. The error then lies within ±½ LSB.
:::end

:::exercise
How many comparator decisions does a 16-bit SAR conversion take? And a 16-bit flash ADC needs how many comparators?
:::solution
16 decisions in sequence. A flash ADC decides all at once with $2^{16}-1 = 65\,535$ comparators, which is why flash converters stop at about 8 bits.
:::end

## Quiz

:::quiz
- type: num
  q: LSB in mV of an 8-bit ADC with a 3.3 V reference?
  answer: 12.891
  tol: 0.001
  unit: mV
  py: "3.3/256*1000"
  explain: $V_{ref}/2^n$.
- type: num
  q: Output code for 2.137 V, 8 bits, 3.3 V reference?
  answer: 165
  tol: 0.001
  py: "math.floor(2.137/(3.3/256))"
  explain: SAR truncates.
- type: mc
  q: DNL of −1 LSB at a code means…
  options:
    - the code is twice as wide
    - the code never appears (missing code)
    - the code is ideal
    - offset error
  answer: 1
  explain: Zero width.
- type: num
  q: Comparator decisions for a 12-bit SAR conversion?
  answer: 12
  tol: 0.001
  py: "12"
  explain: One per bit.
- type: num
  q: Extra width in LSB of code 127 when the MSB weight is 1 % high (8 bits)?
  answer: 1.28
  tol: 0.001
  unit: LSB
  py: "128*0.01"
  explain: The MSB transition moves up by 1.28 LSB.
- type: mc
  q: The ramp histogram test estimates code widths because…
  options:
    - each code's hit count is proportional to its width
    - it measures the comparator
    - it averages noise
    - it removes the reference
  answer: 0
  explain: A uniform ramp spends time in each code proportional to its width.
:::end

:::verify
import math
assert math.floor(2.137/(3.3/256)) == 165
:::end
