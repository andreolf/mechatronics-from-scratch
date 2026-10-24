---
id: p06-l01
minutes: 30
summary: Every sensor register is a pattern of bits, and reading it wrong gives garbage. You derive positional notation and two's complement, negate by "invert and add one", detect overflow, and write encode/decode functions that round-trip every 16-bit value.
---

## Positional notation

A number in base $b$ with digits $d_{n-1}\dots d_0$ means $\sum_k d_kb^k$. In binary each digit is a **bit**: $1011_2 = 8 + 2 + 1 = 11$. Hexadecimal groups four bits per digit (0–9, A–F), so $0\text{xB}5 = 1011\,0101_2 = 181$. Datasheets write register values in hex because each hex digit maps to exactly four bits.

An $n$-bit **unsigned** value covers $0$ to $2^n - 1$: 0–255 for 8 bits, 0–65 535 for 16.

## Two's complement

Signed values on every modern processor use two's complement. The top bit (MSB) has weight $-2^{n-1}$ instead of $+2^{n-1}$:

$$v = -b_{n-1}2^{n-1} + \sum_{k=0}^{n-2}b_k2^k.$$

So 8 bits cover −128 to +127, and $1111\,1111_2 = -128 + 127 = -1$.

**Negation is "invert all bits, then add 1".** Inverting gives $(2^n - 1) - u$, and adding one gives $2^n - u$, which is $-u$ modulo $2^n$. The same adder hardware therefore handles signed and unsigned numbers: only the interpretation differs.

**Sign extension.** To widen a signed value, copy its MSB into the new upper bits: $-3$ in 8 bits is 0xFD, and in 16 bits 0xFFFD.

**Overflow.** Adding two signed numbers overflows when both operands have the same sign and the result has the other sign; $100 + 100$ in 8 bits gives $-56$. Unsigned overflow is the carry out of the top bit. A classic sensor bug: reading a 16-bit two's-complement accelerometer register as unsigned turns −1 into 65 535.

:::figure widget=bits caption="Toggle the bits of an 8-bit register and read it as unsigned and as two's complement. Negate flips every bit and adds one."
:::end

## Worked example

An IMU's 16-bit temperature register reads `0xFF38`, and the datasheet says temperature = raw/256 + 25 °C.

1. Unsigned: $0\text{xFF}38 = 65\,336$.
2. The MSB is set, so as two's complement: $65\,336 - 65\,536 = -200$.
3. Temperature: $-200/256 + 25 = 24.22$ °C. Read as unsigned, it would claim 280 °C.
4. Check by negating: invert 0xFF38 to get 0x00C7 = 199, add 1 to get 200. So the raw value is −200. ✓

## Code it from scratch

:::code file=twos.py
```python
def encode(v, bits):
    """Signed integer -> unsigned bit pattern; raises on overflow."""
    lo, hi = -(1 << (bits - 1)), (1 << (bits - 1)) - 1
    if not lo <= v <= hi:
        raise OverflowError(f"{v} doesn't fit in {bits} bits")
    return v & ((1 << bits) - 1)

def decode(u, bits):
    u &= (1 << bits) - 1
    return u - (1 << bits) if u >> (bits - 1) else u

def add_signed(a, b, bits):
    """Returns (result, overflow) the way an ALU would."""
    s = (encode(a, bits) + encode(b, bits)) & ((1 << bits) - 1)
    r = decode(s, bits)
    return r, (a >= 0) == (b >= 0) and (r >= 0) != (a >= 0)

def negate(u, bits):
    return ((~u) + 1) & ((1 << bits) - 1)

if __name__ == "__main__":
    for v in range(-32768, 32768):                         # every 16-bit value round-trips
        assert decode(encode(v, 16), 16) == v
    assert decode(0xFF38, 16) == -200 and abs(decode(0xFF38, 16) / 256 + 25 - 24.21875) < 1e-12
    assert negate(0xFF38, 16) == 200 and decode(negate(encode(-128, 8), 8), 8) == -128   # -128 has no positive twin
    assert add_signed(100, 100, 8) == (-56, True) and add_signed(-100, 50, 8) == (-50, False)
    assert add_signed(-128, -1, 8) == (127, True)
    assert encode(-3, 8) == 0xFD and encode(-3, 16) == 0xFFFD                            # sign extension
    for v in (128, -129):
        try:
            encode(v, 8); raise AssertionError("no overflow detected")
        except OverflowError:
            pass
    assert decode(0x80000000, 32) == -2**31
    print("all 65536 values round-trip; overflow rules check out")
```
:::end

## Exercises

:::exercise
Write −1, −128 and +127 as 8-bit hex.
:::solution
0xFF, 0x80, 0x7F.
:::end

:::exercise
A 12-bit ADC in differential mode returns two's complement in the low 12 bits of a 16-bit register: 0x0F9C. What signed value is it?
:::solution
Low 12 bits 0xF9C = 3996. Bit 11 is set, so the value is $3996 - 4096 = -100$. Sign-extend before using it: 0xFF9C as 16 bits.
:::end

## Quiz

:::quiz
- type: num
  q: What is 0xB5 in decimal?
  answer: 181
  tol: 0.001
  py: "0xB5"
  explain: 11×16 + 5.
- type: num
  q: What signed value does the 16-bit pattern 0xFF38 hold?
  answer: -200
  tol: 0.001
  py: "0xFF38-65536"
  explain: Subtract $2^{16}$ because the MSB is set.
- type: mc
  q: Two's-complement negation is…
  options:
    - flip the MSB
    - invert every bit and add 1
    - subtract 1 and invert the MSB
    - reverse the bit order
  answer: 1
  explain: $(2^n - 1 - u) + 1 = 2^n - u$.
- type: num
  q: What is the smallest 16-bit signed value?
  answer: -32768
  tol: 0.001
  py: "-2**15"
  explain: $-2^{n-1}$.
- type: mc
  q: Signed addition overflows when…
  options:
    - there is a carry out of the top bit
    - both operands have the same sign and the result's sign differs
    - the result is zero
    - one operand is negative
  answer: 1
  explain: The carry out is the unsigned overflow rule.
- type: num
  q: The 12-bit two's-complement value 0xF9C, in decimal?
  answer: -100
  tol: 0.001
  py: "0xF9C-4096"
  explain: Bit 11 is set.
:::end

:::verify
assert (0x7F, 0x80, 0xFF) == (127 & 255, (-128) & 255, (-1) & 255)
:::end
