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
