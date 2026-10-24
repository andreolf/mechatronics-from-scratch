---
id: p11-l03
minutes: 40
summary: A CRC is the remainder of dividing the message, read as a polynomial over GF(2), by a fixed generator, so it catches every single-bit error, every burst shorter than the CRC and every odd number of flips for the right generator, where a byte sum misses many double errors. You derive the division, write bitwise and table-driven CRC-8 and CRC-16 that match the standard check values, and measure which errors each checksum misses.
---

## Arithmetic with no carries

Read a bit string as a polynomial with coefficients 0 or 1: 1011 is $x^3 + x + 1$. In GF(2), addition is XOR and there are no carries, so subtraction is also XOR. Polynomial long division then works like ordinary long division, but each "subtract" is an XOR.

A CRC with an $r$-bit generator $G(x)$ (degree $r$) is:

$$\text{CRC}(M) = M(x)\, x^r \bmod G(x).$$

Append those $r$ bits to the message and the whole codeword is divisible by $G$. The receiver divides again: a non-zero remainder means an error. An error pattern $E(x)$ slips through only if $G$ divides $E$.

## What a good generator guarantees

- **Single-bit errors** $E = x^i$: caught if $G$ has more than one term.
- **Two-bit errors** $x^i + x^j = x^j(x^{i-j} + 1)$: caught if $G$ doesn't divide $x^k + 1$ for any $k$ up to the codeword length. CRC-16/CCITT's generator $x^{16} + x^{12} + x^5 + 1$ is fine up to 32 767 bits.
- **Odd numbers of flips**: caught if $(x+1)$ divides $G$, because then $E(1) = 1$ isn't divisible. CCITT's generator has that factor.
- **Bursts** of length $\le r$: $E = x^j B(x)$ with $\deg B < r$, which $G$ (degree $r$, with a constant term) can't divide. Bursts of length $r+1$ slip through only when $B = G$: one pattern in $2^{r-1}$.
- **Anything else**: about one in $2^r$ random errors survives.

A byte sum (checksum-8) or XOR misses two flips of the same bit in different bytes whenever they cancel, which happens a lot. On a 16-byte message the code below finds that the byte sum misses 168 of the 9 180 possible double-bit errors in its 136-bit codeword, CRC-8 misses 9 of 9 180 (its generator repeats after 127 bits, shorter than the codeword), and CRC-16 misses none of 10 296.

## Table-driven

The bitwise loop does one shift and a conditional XOR per bit. Because the CRC is linear, the effect of the top 8 bits on the register can be precomputed for all 256 values: process a byte at a time with one table lookup, eight times faster. The same table idea works in C on an MCU (512 bytes of flash for CRC-16), and many MCUs have a CRC peripheral.

There are dozens of named CRCs that differ in polynomial, initial value, bit order (*reflected* or not) and a final XOR. Always check against the published **check value**, the CRC of the ASCII string "123456789".

:::figure widget=crcdetect caption="Which errors each check catches. Pick an error type; the bars show the fraction of error patterns each check lets through on a 16-byte message, computed in your browser (exhaustively for single, double and short-burst errors, by random sampling otherwise)."
:::end

## Worked example

Divide the message 1101 by $G = x^3 + x + 1$ (1011) for a 3-bit CRC.

1. Append three zeros: 1101 000.
2. XOR 1011 under the leading 1: 1101 ⊕ 1011 = 0110, bring down: 110 0.
3. 1100 ⊕ 1011 = 0111, bring down: 111 0.
4. 1110 ⊕ 1011 = 0101, bring down the last 0: 1010 ⊕ 1011 = 0001.
5. The remainder is 001, the codeword is 1101 001, and dividing 1101001 by 1011 leaves 0.

## Code it from scratch

:::code file=crc.py
```python
import binascii, random, zlib

def crc_bitwise(data, width, poly, init, refin=False, refout=False, xorout=0):
    """MSB-first shift register; reflected variants shift right with the reversed polynomial"""
    mask = (1 << width) - 1
    if refin:
        rpoly = int(f"{poly:0{width}b}"[::-1], 2)
        crc = int(f"{init:0{width}b}"[::-1], 2)
        for b in data:
            crc ^= b
            for _ in range(8):
                crc = (crc >> 1) ^ rpoly if crc & 1 else crc >> 1
        out = crc if refout else int(f"{crc:0{width}b}"[::-1], 2)
    else:
        crc = init
        for b in data:
            crc ^= b << (width - 8)
            for _ in range(8):
                crc = ((crc << 1) ^ poly) & mask if crc & (1 << (width - 1)) else (crc << 1) & mask
        out = crc
    return out ^ xorout

def make_table(width, poly):
    mask, top = (1 << width) - 1, 1 << (width - 1)
    table = []
    for byte in range(256):
        crc = byte << (width - 8)
        for _ in range(8):
            crc = ((crc << 1) ^ poly) & mask if crc & top else (crc << 1) & mask
        table.append(crc)
    return table

T8, T16 = make_table(8, 0x07), make_table(16, 0x1021)

def crc8(data, init=0x00):                       # CRC-8 (SMBus), poly x^8+x^2+x+1
    crc = init
    for b in data:
        crc = T8[crc ^ b]
    return crc

def crc16_ccitt(data, init=0xFFFF):              # CRC-16/CCITT-FALSE, poly 0x1021
    crc = init
    for b in data:
        crc = ((crc << 8) & 0xFFFF) ^ T16[(crc >> 8) ^ b]
    return crc

RT16 = []                                        # reflected table for CRC-16/MODBUS (poly 0x8005 reversed = 0xA001)
for byte in range(256):
    c = byte
    for _ in range(8):
        c = (c >> 1) ^ 0xA001 if c & 1 else c >> 1
    RT16.append(c)

def crc16_modbus(data):
    crc = 0xFFFF
    for b in data:
        crc = (crc >> 8) ^ RT16[(crc ^ b) & 0xFF]
    return crc

def test_check_values():
    check = b"123456789"
    assert crc8(check) == 0xF4 == crc_bitwise(check, 8, 0x07, 0)
    assert crc16_ccitt(check) == 0x29B1 == crc_bitwise(check, 16, 0x1021, 0xFFFF)
    assert crc16_modbus(check) == 0x4B37 == crc_bitwise(check, 16, 0x8005, 0xFFFF, True, True)
    assert crc_bitwise(check, 32, 0x04C11DB7, 0xFFFFFFFF, True, True, 0xFFFFFFFF) == 0xCBF43926 == zlib.crc32(check)
    rng = random.Random(1)
    for _ in range(300):
        d = bytes(rng.randrange(256) for _ in range(rng.randrange(0, 64)))
        assert crc16_ccitt(d) == binascii.crc_hqx(d, 0xFFFF) == crc_bitwise(d, 16, 0x1021, 0xFFFF)
        assert crc8(d) == crc_bitwise(d, 8, 0x07, 0)
        assert crc16_modbus(d) == crc_bitwise(d, 16, 0x8005, 0xFFFF, True, True)
        cw = d + crc16_ccitt(d).to_bytes(2, "big")
        assert crc16_ccitt(cw) == 0                       # the codeword is divisible by G
    print("check values match: CRC-8 0xF4, CCITT 0x29B1, MODBUS 0x4B37, CRC-32 0xCBF43926 (= zlib)")

def test_hand_division():
    def polymod(a, g):
        while a.bit_length() >= g.bit_length():
            a ^= g << (a.bit_length() - g.bit_length())
        return a
    assert polymod(0b1101000, 0b1011) == 0b001
    assert polymod(0b1101001, 0b1011) == 0

# --- which errors slip through? (linearity: an error is missed iff its own syndrome is 0) ---
N = 16                                                   # message bytes

def syndromes(check_fn, nbytes_check):
    """syndrome of each single-bit error over the whole codeword, by linearity"""
    L = N + nbytes_check
    base = check_fn(bytes(L))
    syn = []
    for bit in range(8 * L):
        e = bytearray(L); e[bit // 8] |= 0x80 >> (bit % 8)
        syn.append(check_fn(bytes(e)) ^ base)
    return syn

def codeword_crc16(cw):                                 # remainder of the codeword: 0 when intact
    return crc16_ccitt(cw[:N]) ^ int.from_bytes(cw[N:], "big")

def codeword_crc8(cw):
    return crc8(cw[:N]) ^ cw[N]

def codeword_sum8(cw):
    return (sum(cw[:N]) - cw[N]) & 0xFF

def missed_double(check_fn, ncheck, msg):
    """exhaustive: every pair of flipped bits in the codeword of a real message"""
    L = N + ncheck
    if check_fn is codeword_sum8:
        cw = msg + bytes([sum(msg) & 0xFF])
    elif check_fn is codeword_crc8:
        cw = msg + bytes([crc8(msg)])
    else:
        cw = msg + crc16_ccitt(msg).to_bytes(2, "big")
    assert check_fn(cw) == 0
    missed = total = 0
    for i in range(8 * L):
        for j in range(i + 1, 8 * L):
            e = bytearray(cw); e[i // 8] ^= 0x80 >> (i % 8); e[j // 8] ^= 0x80 >> (j % 8)
            total += 1
            missed += check_fn(bytes(e)) == 0
    return missed, total

def bursts(syn, length):
    """count undetected bursts of exactly this length (first and last bit flipped)"""
    nbits, missed, total = len(syn), 0, 0
    for start in range(nbits - length + 1):
        ends = syn[start] ^ syn[start + length - 1]
        mids = syn[start + 1:start + length - 1]
        acc = [ends]
        for s in mids:                                   # all subsets of the middle bits
            acc = acc + [a ^ s for a in acc]
        total += len(acc)
        missed += acc.count(0)
    return missed, total

def test_error_detection():
    msg = bytes(random.Random(7).randrange(256) for _ in range(N))
    s16 = syndromes(codeword_crc16, 2)
    assert all(s16)                                      # every single-bit error caught
    m16, tot = missed_double(codeword_crc16, 2, msg)
    m8, _ = missed_double(codeword_crc8, 1, msg)
    ms, _ = missed_double(codeword_sum8, 1, msg)
    print(f"double-bit errors missed: CRC-16 {m16}, CRC-8 {m8}, sum-8 {ms} (of about {tot})")
    assert m16 == 0 and ms > 0
    for L in range(2, 17):
        missed, total = bursts(s16, L)
        assert missed == 0, L                            # every burst up to 16 bits
    missed, total = bursts(s16, 17)
    positions = len(s16) - 17 + 1
    print(f"bursts of 17 bits: {missed} missed of {total} = 1 in {total // missed}")
    assert missed == positions                           # only B(x) = G(x) at each position: 1 in 2^15
    rng = random.Random(3)
    odd_missed = 0
    for _ in range(20000):
        k = rng.choice([3, 5, 7, 9])
        e = 0
        for b in rng.sample(range(len(s16)), k):
            e ^= s16[b]
        odd_missed += e == 0
    assert odd_missed == 0                               # (x+1) divides G: all odd-weight errors caught
    print("all single, double, odd-weight and <=16-bit burst errors caught by CRC-16/CCITT")

test_check_values()
test_hand_division()
test_error_detection()
print("PASS")
```
:::end

## Exercises

:::exercise
Your Modbus frame's CRC check fails on every frame, but the bytes look right. What's the likely cause?
:::solution
Byte order or bit reflection. Modbus RTU sends its CRC-16 low byte first and uses the reflected algorithm (0xA001, shift right). Computing CCITT-style MSB-first, or appending the CRC high byte first, gives a "wrong" value on every frame. Check your function against 0x4B37 for "123456789".
:::end

:::exercise
Why can a CRC detect all bursts up to 16 bits but not guarantee detecting four random flips?
:::solution
A burst confines the error polynomial to $x^j B(x)$ with $\deg B < 16$, which a degree-16 generator with a constant term can't divide. Four scattered flips form a polynomial of high degree; some of those are multiples of $G$, roughly a $2^{-16}$ fraction, so a few slip through.
:::end

## Quiz

:::quiz
- type: num
  q: CRC-16/CCITT-FALSE check value of "123456789", in decimal?
  answer: 10673
  tol: 0
  py: "0x29B1"
  explain: 0x29B1.
- type: num
  q: Fraction of 17-bit bursts a CRC-16 misses, as 1 in how many?
  answer: 32768
  tol: 0
  py: "2**15"
  explain: Only B = G, one in 2^(r−1).
- type: num
  q: Approximate fraction of random errors a CRC-32 misses, as 1 in how many?
  answer: 4294967296
  tol: 0.0001
  py: "2**32"
  explain: 2^−r.
- type: num
  q: Table size in bytes for a byte-wise CRC-16 table?
  answer: 512
  tol: 0
  unit: bytes
  py: "256*2"
  explain: 256 entries of 2 bytes.
- type: mc
  q: The remainder of 1101000 divided by 1011 in GF(2) is…
  options:
    - "001"
    - "011"
    - "101"
    - "000"
  answer: 0
  explain: The worked example.
- type: mc
  q: Why does a generator with a factor (x+1) catch every odd number of flips?
  options:
    - because E(1) = 1 for odd weight, which a multiple of (x+1) can't be
    - because odd errors are bursts
    - because the CRC is reflected
    - it doesn't
  answer: 0
  explain: Multiples of (x+1) evaluate to 0 at x = 1.
:::end

:::verify
import binascii
assert binascii.crc_hqx(b"123456789", 0xFFFF) == 0x29B1
:::end
