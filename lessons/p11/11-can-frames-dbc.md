---
id: p11-l11
minutes: 40
summary: A classic CAN data frame wraps an 11-bit ID and up to 8 data bytes in fixed fields with a CRC-15, and inserts a stuff bit after any five equal bits so receivers never lose sync, while a DBC file says which bits of the data mean which physical signal. You derive the frame layout, the stuffing rule and its worst case, and signal scaling, write a frame encoder, decoder and DBC signal decoder, and test them against a reference log with known values.
---

## The classic data frame

| field | bits | notes |
|---|---|---|
| SOF | 1 | dominant, starts the frame |
| identifier | 11 | priority and meaning |
| RTR, IDE, r0 | 3 | data frame, standard ID, reserved |
| DLC | 4 | 0–8 data bytes |
| data | 8n | |
| CRC | 15 | polynomial 0x4599, over SOF to the end of data |
| CRC delimiter, ACK slot, ACK delimiter | 3 | any receiver drives the ACK slot dominant |
| EOF | 7 | recessive |
| interframe space | 3 | recessive |

That's $47 + 8n$ bits, 111 for 8 bytes: 57 % efficiency at best. CAN's sender sees its frame acknowledged by *someone* (the ACK slot), not by a specific node.

## Bit stuffing

CAN has no clock line, and receivers re-synchronise on recessive-to-dominant edges. A long run of equal bits has no edges, so after **five identical bits** the transmitter inserts one bit of the opposite value, and receivers remove it. Six equal bits in a row are an error (the error and EOF fields use that on purpose). Stuffing applies from SOF to the end of the CRC: $34 + 8n$ bits.

The worst case is a run of five, then a stuff bit that itself starts a new run of four more equal bits, repeated: one stuff bit per four bits after the first five, so at most

$$\left\lfloor \frac{34 + 8n - 1}{4} \right\rfloor$$

stuff bits, 24 for 8 bytes. The worst-case frame is 135 bits, which is the number to use for bus-load and latency analysis.

## Signals and DBC files

Eight bytes rarely hold one value. A **DBC** file, the de facto standard format for describing a CAN network, defines messages (`BO_`) and the signals inside them (`SG_`):

```text
SG_ Speed : 0|16@1+ (0.125,0) [0|8191.875] "rpm" Vector__XXX
```

That's start bit 0, length 16, `@1` little-endian (Intel; `@0` is big-endian, Motorola), `+` unsigned (`-` is two's complement signed), and the physical value is $\text{raw} \times 0.125 + 0$ rpm.

For Intel signals, the payload is a little-endian integer and the signal is $(\text{payload} \gg \text{start}) \mathbin{\&} (2^{len} - 1)$. For Motorola signals, the start bit names the signal's **most significant** bit in a numbering where bit 7 is the MSB of byte 0, and the signal continues into the following bytes: easy to get wrong, so test it.

:::figure widget=candbc caption="A CAN frame's bits with the stuff bits highlighted, and the DBC signals decoded from the data bytes. Change the signal values to see the data bytes, the stuffing and the decoded values update."
:::end

## Worked example

The motor controller sends ID 0x123 with data `E0 2E 83 9F 36 00 00 00`.

1. As a little-endian integer the payload is 0x369F832EE0.
2. Speed = bits 0–15 = 0x2EE0 = 12 000, × 0.125 = **1500 rpm**.
3. Current = bits 16–27 = 0xF83, a 12-bit signed value: 3971 − 4096 = −125, × 0.1 = **−12.5 A**.
4. Temperature = bits 28–35 = 0x69 = 105, × 1 − 40 = **65 °C**. State = bits 36–38 = 3.

## Code it from scratch

:::code file=can_dbc.py
```python
import random, re

# ---------- CRC-15/CAN ----------
def crc15(bits):
    crc = 0
    for b in bits:
        nxt = b ^ (crc >> 14)
        crc = (crc << 1) & 0x7FFF
        if nxt:
            crc ^= 0x4599
    return crc

def to_bits(value, n):
    return [(value >> i) & 1 for i in range(n - 1, -1, -1)]

def bytes_to_bits(data):
    return [b for byte in data for b in to_bits(byte, 8)]

# ---------- stuffing ----------
def stuff(bits):
    out, run, last = [], 0, None
    for b in bits:
        out.append(b)
        run = run + 1 if b == last else 1
        last = b
        if run == 5:
            out.append(1 - b)
            last, run = 1 - b, 1
    return out

def unstuff(bits):
    out, run, last, i = [], 0, None, 0
    while i < len(bits):
        b = bits[i]
        out.append(b)
        run = run + 1 if b == last else 1
        last = b
        if run == 5:
            i += 1
            if i >= len(bits):
                break
            if bits[i] == b:
                raise ValueError("stuff error: six equal bits")
            last, run = bits[i], 1
        i += 1
    return out

# ---------- frames ----------
def encode_frame(can_id, data):
    assert 0 <= can_id < 0x800 and len(data) <= 8
    head = [0] + to_bits(can_id, 11) + [0, 0, 0] + to_bits(len(data), 4) + bytes_to_bits(data)
    body = head + to_bits(crc15(head), 15)
    return stuff(body) + [1, 0, 1] + [1] * 7 + [1] * 3     # CRC delim, ACK (acked), ACK delim, EOF, IFS

def decode_frame(bits):
    # find the end of the stuffed region by unstuffing progressively
    raw = unstuff(bits[:-13])
    dlc = int("".join(map(str, raw[15:19])), 2)
    n = 19 + 8 * dlc
    head, crc = raw[:n], int("".join(map(str, raw[n:n + 15])), 2)
    if len(raw) != n + 15 or crc15(head) != crc:
        raise ValueError("CRC error")
    can_id = int("".join(map(str, raw[1:12])), 2)
    data = bytes(int("".join(map(str, head[19 + 8 * k:27 + 8 * k])), 2) for k in range(dlc))
    return can_id, data

def max_stuff_bits(n):
    return (34 + 8 * n - 1) // 4

# ---------- DBC ----------
DBC = """
BO_ 291 MotorStatus: 8 Drive
 SG_ Speed : 0|16@1+ (0.125,0) [0|8191.875] "rpm" Vector__XXX
 SG_ Current : 16|12@1- (0.1,0) [-204.8|204.7] "A" Vector__XXX
 SG_ Temp : 28|8@1+ (1,-40) [-40|215] "degC" Vector__XXX
 SG_ State : 36|3@1+ (1,0) [0|7] "" Vector__XXX

BO_ 1280 BMS: 8 BMS
 SG_ PackVoltage : 7|16@0+ (0.01,0) [0|655.35] "V" Vector__XXX
 SG_ PackCurrent : 23|16@0- (0.1,0) [-3276.8|3276.7] "A" Vector__XXX
 SG_ SoC : 39|8@0+ (0.5,0) [0|100] "%" Vector__XXX
"""

SG = re.compile(r'SG_ (\w+) : (\d+)\|(\d+)@([01])([+-]) \(([^,]+),([^)]+)\) \[([^|]+)\|([^\]]+)\] "([^"]*)"')

def parse_dbc(text):
    msgs, cur = {}, None
    for line in text.splitlines():
        line = line.strip()
        if line.startswith("BO_ "):
            _, mid, name, dlc, _ = line.replace(":", "").split()
            cur = msgs[int(mid)] = {"name": name, "dlc": int(dlc), "signals": []}
        elif line.startswith("SG_ "):
            m = SG.match(line)
            name, start, length, order, sign, factor, offset, lo, hi, unit = m.groups()
            cur["signals"].append(dict(name=name, start=int(start), length=int(length), intel=order == "1",
                                       signed=sign == "-", factor=float(factor), offset=float(offset), unit=unit))
    return msgs

def raw_value(sig, data):
    n = sig["length"]
    if sig["intel"]:
        raw = (int.from_bytes(data, "little") >> sig["start"]) & ((1 << n) - 1)
    else:                                                 # Motorola: start is the MSB; count in big-endian order
        msb = (sig["start"] // 8) * 8 + (7 - sig["start"] % 8)
        total = 8 * len(data)
        raw = (int.from_bytes(data, "big") >> (total - msb - n)) & ((1 << n) - 1)
    if sig["signed"] and raw >> (n - 1):
        raw -= 1 << n
    return raw

def decode(msgs, can_id, data):
    m = msgs[can_id]
    return {s["name"]: raw_value(s, data) * s["factor"] + s["offset"] for s in m["signals"]}

def encode(msgs, can_id, values):
    m = msgs[can_id]
    payload_le, payload_be = 0, 0
    total = 8 * m["dlc"]
    for s in m["signals"]:
        n = s["length"]
        raw = round((values[s["name"]] - s["offset"]) / s["factor"]) & ((1 << n) - 1)
        if s["intel"]:
            payload_le |= raw << s["start"]
        else:
            msb = (s["start"] // 8) * 8 + (7 - s["start"] % 8)
            payload_be |= raw << (total - msb - n)
    le = payload_le.to_bytes(m["dlc"], "little")
    be = payload_be.to_bytes(m["dlc"], "big")
    return bytes(a | b for a, b in zip(le, be))

# a short reference log (candump format) with the values each frame should decode to
LOG = """
(1700000000.000100) can0 123#E02E839F36000000
(1700000000.000600) can0 500#9BC4FE3BA3000000
(1700000000.001100) can0 123#0000000080040000
"""
EXPECT = [
    {"Speed": 1500.0, "Current": -12.5, "Temp": 65.0, "State": 3.0},
    {"PackVoltage": 398.76, "PackCurrent": -45.3, "SoC": 81.5},
    {"Speed": 0.0, "Current": 0.0, "Temp": -40.0, "State": 0.0},
]

def test_crc_and_stuffing():
    assert crc15(bytes_to_bits(b"123456789")) == 0x059E          # CRC-15/CAN check value
    rng = random.Random(2)
    worst_seen = 0
    for _ in range(3000):
        can_id, data = rng.randrange(0x800), bytes(rng.randrange(256) for _ in range(rng.randrange(9)))
        bits = encode_frame(can_id, data)
        s = "".join(map(str, bits[:-13]))
        assert "000000" not in s and "111111" not in s
        assert decode_frame(bits) == (can_id, data)
        stuffed = len(bits) - (47 + 8 * len(data))
        assert 0 <= stuffed <= max_stuff_bits(len(data))
        if len(data) == 8:
            worst_seen = max(worst_seen, stuffed)
        flip = rng.randrange(len(bits) - 13)                     # a single bit error inside the stuffed region
        bad = bits[:]; bad[flip] ^= 1
        try:
            assert decode_frame(bad) != (can_id, data)
        except (ValueError, IndexError):
            pass
    pattern = [0] * 5 + [1, 1, 1, 1, 0, 0, 0, 0] * 12           # the worst case: every stuff bit starts a new run
    pattern = pattern[:98]
    assert len(stuff(pattern)) - 98 == max_stuff_bits(8) == 24
    print(f"CRC-15 check 0x059E; 3000 random frames round-trip; worst stuffing seen {worst_seen} of max {max_stuff_bits(8)}")

def test_dbc_log():
    msgs = parse_dbc(DBC)
    for line, want in zip(LOG.strip().splitlines(), EXPECT):
        frame = line.split()[2]
        can_id, data = int(frame.split("#")[0], 16), bytes.fromhex(frame.split("#")[1])
        got = decode(msgs, can_id, data)
        for k, v in want.items():
            assert abs(got[k] - v) < 1e-9, (k, got[k], v)
        assert decode_frame(encode_frame(can_id, data)) == (can_id, data)
    print("reference log decodes to:", decode(msgs, 0x123, bytes.fromhex("E02E839F36000000")))
    rng = random.Random(9)
    for _ in range(2000):                                         # encode/decode round trip within range
        v = {"Speed": rng.randrange(65536) * 0.125, "Current": rng.randrange(-2048, 2048) * 0.1,
             "Temp": rng.randrange(256) - 40.0, "State": float(rng.randrange(8))}
        got = decode(msgs, 0x123, encode(msgs, 0x123, v))
        assert all(abs(got[k] - v[k]) < 1e-6 for k in v)
        b = {"PackVoltage": rng.randrange(65536) * 0.01, "PackCurrent": rng.randrange(-32768, 32768) * 0.1, "SoC": rng.randrange(201) * 0.5}
        got = decode(msgs, 0x500, encode(msgs, 0x500, b))
        assert all(abs(got[k] - b[k]) < 1e-6 for k in b)
    print("DBC: reference log matches; 2000 Intel and Motorola round trips")

test_crc_and_stuffing()
test_dbc_log()
print("PASS")
```
:::end

## Exercises

:::exercise
A signal decodes correctly when it's small but jumps to nonsense above 255. Intel or Motorola is wrong?
:::solution
Almost certainly the byte order. A 16-bit value under 256 fits in one byte, so it decodes the same either way; above 255 the high byte matters and swapping order gives garbage. Check `@0` versus `@1` in the DBC and remember that a Motorola start bit is the signal's MSB.
:::end

:::exercise
Why are six equal bits in a row on the bus never part of a valid frame body, and who uses that?
:::solution
Stuffing guarantees at most five equal bits between SOF and the CRC. Error frames deliberately send six dominant bits (an error flag) to violate the rule, so every node notices immediately and discards the frame; the 7-bit recessive EOF also lies outside the stuffed region.
:::end

## Quiz

:::quiz
- type: num
  q: Unstuffed length in bits of a classic data frame with 4 data bytes, including the interframe space?
  answer: 79
  tol: 0
  unit: bits
  py: "47 + 8*4"
  explain: 47 + 8n.
- type: num
  q: Maximum stuff bits for an 8-byte frame?
  answer: 24
  tol: 0
  unit: bits
  py: "(34 + 8*8 - 1)//4"
  explain: One per four bits after the first five.
- type: num
  q: Physical value for raw 0xF83 as a 12-bit signed signal with factor 0.1?
  answer: -12.5
  tol: 0.0001
  unit: A
  py: "(0xF83 - 4096)*0.1"
  explain: Two's complement.
- type: num
  q: Worst-case duration in µs of an 8-byte frame at 500 kbit/s?
  answer: 270
  tol: 0.001
  unit: µs
  py: "135/500e3*1e6"
  explain: 111 + 24 stuff bits.
- type: mc
  q: What does @0 mean in a DBC signal definition?
  options:
    - big-endian (Motorola) byte order
    - unsigned
    - start bit zero
    - no scaling
  answer: 0
  explain: "@1 is little-endian (Intel)."
- type: mc
  q: Why does CAN stuff bits?
  options:
    - so receivers see edges often enough to stay synchronised
    - to add error correction
    - to encrypt the data
    - to pad frames to 8 bytes
  answer: 0
  explain: There's no clock line.
:::end

:::verify
v = 0x2EE0 | 0xF83 << 16 | 0x69 << 28 | 3 << 36
assert v.to_bytes(8, "little").hex().upper() == "E02E839F36000000"
assert (39876).to_bytes(2, "big").hex() == "9bc4" and (65536 - 453).to_bytes(2, "big").hex() == "fe3b" and 163 == 0xA3
:::end
