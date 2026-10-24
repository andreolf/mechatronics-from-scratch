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
