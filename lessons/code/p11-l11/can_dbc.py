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
