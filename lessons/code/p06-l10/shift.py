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
