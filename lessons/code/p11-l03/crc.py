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
