---
id: p06-l09
minutes: 35
summary: An incremental encoder reports motion as two square waves a quarter-cycle apart. You derive the Gray-code state sequence, build a 4× quadrature decoder as a state machine, count through direction reversals against ground truth, and size the counter and sampling rate for a real motor.
---

## Two channels in quadrature

An optical or magnetic encoder produces channels A and B, square waves with a 90° phase offset. Each line of the disk gives one full cycle on each channel, so there are four edges per line. Read together as a 2-bit state $(A, B)$:

$$00 \to 10 \to 11 \to 01 \to 00 \quad \text{(forward)},$$

and the reverse order backwards. Only one bit changes per step: it's a **Gray code**. That gives three things:

- **Direction**: which neighbour state comes next.
- **4× resolution**: count every edge of both channels. A 500-line encoder gives 2000 counts per revolution, or 0.18°.
- **Error detection**: if both bits change at once, a state was skipped (noise, or sampling too slowly). Count it as an error instead of guessing.

## The decoder as a lookup table

Combine the previous state and the new state into a 4-bit index and look up the count change: +1, −1, 0 (no change) or *error*. It's a 16-entry table, implemented in hardware by every microcontroller timer's "encoder mode", or in software in an interrupt or a fast polling loop.

**Sampling rate.** A polling decoder must see every state, so it must sample faster than the edge rate: $f_{edge} = 4\times\text{lines}\times\text{rev/s}$. Use a hardware timer when the edge rate gets into the kHz range.

**Counter width.** A 16-bit counter wraps after 32 768 counts in either direction. Extend it in software by tracking wraps, or compute differences modulo $2^{16}$ every control period (two's complement makes that work, lesson 1).

:::figure widget=quadrature caption="A shaft swings forward and back. The decoded count (lime) tracks the true angle (dashed) exactly through the reversal."
:::end

## Worked example

A motor shaft carries a 500-line encoder and spins at up to 6000 rpm.

1. Counts per revolution: $4\times500 = 2000$, so the resolution is $360/2000 = 0.18°$.
2. Edge rate at 100 rev/s: $2000\times100 = 200\,000$ edges per second. A polling loop would need more than 200 kHz, so use the timer's encoder mode.
3. A 16-bit counter wraps after $32\,768/2000 = 16.4$ revolutions, which takes 0.16 s at full speed. A 1 kHz control loop reads it far more often than that, so modulo-$2^{16}$ differences work.
4. Speed estimation from these counts is Phase 07 lesson 7.

## Code it from scratch

:::code file=quadrature.py
```python
import math
import numpy as np

# index = (prev << 2) | new, states encoded as (A << 1) | B; 'E' marks an illegal double change
TABLE = [0, -1, +1, "E", +1, 0, "E", -1, -1, "E", 0, +1, "E", +1, -1, 0]

def ab_from_phase(ph):
    k = math.floor(ph) % 4                     # quarter-cycle index
    return (1 if k in (1, 2) else 0), (1 if k >= 2 else 0)

class Decoder:
    def __init__(self, a, b):
        self.state, self.count, self.errors = (a << 1) | b, 0, 0
    def update(self, a, b):
        new = (a << 1) | b
        d = TABLE[(self.state << 2) | new]
        if d == "E":
            self.errors += 1
        else:
            self.count += d
        self.state = new

if __name__ == "__main__":
    lines = 500
    t = np.linspace(0, 2, 400_001)
    angle_rev = 1.7 * np.sin(2 * math.pi * 0.75 * t) + 0.4 * t          # reverses several times
    quarter = angle_rev * lines * 4
    dec = Decoder(*ab_from_phase(quarter[0]))
    for q in quarter[1:]:
        dec.update(*ab_from_phase(q))
        assert dec.count == math.floor(q) - math.floor(quarter[0])
    print(f"final count {dec.count}, truth {math.floor(quarter[-1]) - math.floor(quarter[0])}, errors {dec.errors}")
    assert dec.errors == 0
    # sampling too slowly skips states: the decoder reports errors instead of silently miscounting direction
    slow = Decoder(*ab_from_phase(quarter[0]))
    for q in quarter[::400][1:]:
        slow.update(*ab_from_phase(q))
    assert slow.errors > 0
    assert 360 / (4 * lines) == 0.18 and 4 * lines * 6000 / 60 == 200_000
```
:::end

## Exercises

:::exercise
The table says 00 → 01 is −1. Using the forward sequence, explain why.
:::solution
Forward is 00 → 10 → 11 → 01 → 00, so 01 → 00 is forward and 00 → 01 is the reverse of that step: −1.
:::end

:::exercise
A 1024-line encoder on a wheel of 100 mm diameter. What linear distance is one count?
:::solution
$\pi\times100/(4\times1024) = 0.0767$ mm.
:::end

## Quiz

:::quiz
- type: num
  q: Counts per revolution of a 500-line encoder with 4× decoding?
  answer: 2000
  tol: 0.001
  py: "4*500"
  explain: Every edge of A and B.
- type: num
  q: Edge rate in kHz at 6000 rpm?
  answer: 200
  tol: 0.001
  unit: kHz
  py: "2000*6000/60/1000"
  explain: Counts per rev × rev per second.
- type: mc
  q: If both A and B change between two samples, the decoder should…
  options:
    - count +2
    - flag an error, because a state was skipped
    - count −1
    - ignore it silently
  answer: 1
  explain: The direction is ambiguous.
- type: mc
  q: The A/B state sequence is a Gray code, meaning…
  options:
    - both bits change at each step
    - only one bit changes per step
    - it counts in binary
    - the states are random
  answer: 1
  explain: That's what makes direction and error detection possible.
- type: num
  q: Distance per count in mm, 1024 lines, 100 mm wheel?
  answer: 0.076699
  tol: 0.002
  unit: mm
  py: "math.pi*100/4096"
  explain: Circumference over counts per rev.
- type: num
  q: Revolutions before a signed 16-bit counter wraps (2000 counts/rev)?
  answer: 16.384
  tol: 0.001
  py: "32768/2000"
  explain: $2^{15}/2000$.
:::end

:::verify
assert [0b00,0b10,0b11,0b01] == [0,2,3,1]
:::end
