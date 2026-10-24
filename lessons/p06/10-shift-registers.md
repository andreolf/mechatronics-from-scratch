---
id: p06-l10
minutes: 35
summary: A shift register moves bits one position per clock, turning three pins into as many outputs as you like. You drive a 74HC595-style serial-to-parallel register bit by bit, then build linear-feedback shift registers and show that the right taps give the maximal period 2^n − 1.
---

## Serial in, parallel out

A shift register is a chain of D flip-flops (lesson 7) with each Q feeding the next D. On each clock edge every bit moves one place along. The **74HC595** adds an output latch:

1. Put a bit on **SER** and pulse **SRCLK**; repeat 8 times, MSB first.
2. Pulse **RCLK** to copy all 8 bits to the outputs at once, so the outputs never show the shifting in progress.
3. Chain several by connecting each one's serial output **Q7′** to the next one's SER.

Three microcontroller pins can then drive 8, 16 or 64 LEDs or relay drivers; SPI hardware (Phase 11) does the shifting at MHz rates. The reverse, **parallel-in serial-out** (74HC165), reads many buttons with few pins.

## Linear-feedback shift registers

Feed the XOR of some register bits (the **taps**) back into the input and the register cycles through a sequence of states. With the right taps, an $n$-bit LFSR visits every non-zero state before repeating: a period of $2^n - 1$. That happens exactly when the feedback polynomial is **primitive** over GF(2); for example $x^4 + x^3 + 1$ for 4 bits, or $x^{16} + x^{15} + x^{13} + x^4 + 1$ for 16. (The all-zero state maps to itself, so it's excluded.)

LFSRs are tiny (one XOR gate or so) and fast. They generate pseudo-random test patterns, CRC checks (Phase 11), scrambling and spread-spectrum codes, and the noise sequences used for system identification (Phase 12).

:::figure widget=lfsr caption="An LFSR with maximal taps. Shift it and watch the state; the readout shows the period. Turn on wrong taps and the period collapses."
:::end

## Worked example

A 4-bit Fibonacci LFSR with taps 4 and 3, starting at 0001.

1. Each step: the new bit is $b_4 \oplus b_3$ (taps counted from the input end), shifted in at the top while everything moves right.
2. From 0001: the output bits are 0 and 1, so the feedback is 1 and the next state is 1000. Then 0100, 0010, 1001, 1100, …
3. After 15 steps it returns to 0001, visiting all 15 non-zero states: maximal length.
4. With taps 4 and 2 instead ($x^4 + x^2 + 1$, not primitive) the period from 0001 is only 6.

## Code it from scratch

:::code file=shift.py
```python
class HC595:
    def __init__(self, n_chips=1):
        self.shift = [0] * (8 * n_chips)
        self.out = [0] * (8 * n_chips)
    def srclk(self, ser):                         # rising edge on SRCLK
        self.shift = [ser] + self.shift[:-1]
    def rclk(self):                               # rising edge on RCLK: latch to outputs
        self.out = self.shift[:]

def write_byte(chip, value):
    for i in range(7, -1, -1):                    # MSB first: it ends up in Q7
        chip.srclk((value >> i) & 1)
    chip.rclk()

def lfsr_period(n, taps, seed=1):
    s, k = seed, 0
    while True:
        b = 0
        for t in taps:
            b ^= (s >> (n - t)) & 1
        s = (s >> 1) | (b << (n - 1))
        k += 1
        if s == seed:
            return k

if __name__ == "__main__":
    chip = HC595()
    write_byte(chip, 0b1010_0011)
    assert chip.out == [1, 1, 0, 0, 0, 1, 0, 1]        # out[i] is Q_i: Q0 = LSB
    two = HC595(2)
    for byte in (0x0F, 0xA5):                         # the first byte shifted ends up in the far chip
        for i in range(7, -1, -1):
            two.srclk((byte >> i) & 1)
    two.rclk()
    assert two.out[8:] == [1, 1, 1, 1, 0, 0, 0, 0] and two.out[:8] == [1, 0, 1, 0, 0, 1, 0, 1]
    maximal = {3: [3, 2], 4: [4, 3], 5: [5, 3], 6: [6, 5], 7: [7, 6], 8: [8, 6, 5, 4], 12: [12, 11, 10, 4], 16: [16, 15, 13, 4]}
    for n, taps in maximal.items():
        assert lfsr_period(n, taps) == 2**n - 1, n
    assert lfsr_period(4, [4, 2]) == 6
    print("595 shifting verified; LFSR periods are 2^n - 1 for all maximal tap sets, 16-bit period", 2**16 - 1)
```
:::end

## Exercises

:::exercise
How long does updating 32 outputs (four chained 595s) take with an SPI clock of 8 MHz?
:::solution
32 bits / 8 MHz = 4 µs, plus the latch pulse. Fast enough to update a display every millisecond with time to spare.
:::end

:::exercise
Why can an $n$-bit LFSR never have period $2^n$?
:::solution
The all-zeros state feeds back 0 forever, so it's a cycle of its own. Every other state can at most share one cycle of $2^n - 1$ states.
:::end

## Quiz

:::quiz
- type: num
  q: Maximal period of an 8-bit LFSR?
  answer: 255
  tol: 0.001
  py: "2**8-1"
  explain: $2^n - 1$.
- type: mc
  q: The 74HC595's RCLK pin…
  options:
    - shifts in one bit
    - copies the shift register to the outputs
    - resets the chip
    - sets the output enable
  answer: 1
  explain: Outputs change all at once.
- type: num
  q: Period of the 4-bit LFSR with taps 4 and 2 from state 0001?
  answer: 6
  tol: 0.001
  py: "6"
  explain: $x^4 + x^2 + 1$ isn't primitive.
- type: num
  q: Time in µs to shift 32 bits at 8 MHz?
  answer: 4
  tol: 0.001
  unit: µs
  py: "32/8"
  explain: One bit per clock.
- type: mc
  q: An LFSR has maximal period when its feedback polynomial is…
  options:
    - even
    - primitive over GF(2)
    - of degree 1
    - all ones
  answer: 1
  explain: That's the algebraic condition.
- type: num
  q: Pins needed to drive 64 outputs with chained 595s?
  answer: 3
  tol: 0.001
  py: "3"
  explain: SER, SRCLK and RCLK.
:::end

:::verify
s, seq = 1, []
for _ in range(4):
    b = ((s >> 0) ^ (s >> 1)) & 1; s = (s >> 1) | (b << 3); seq.append(s)
assert seq == [0b1000, 0b0100, 0b0010, 0b1001]
:::end
