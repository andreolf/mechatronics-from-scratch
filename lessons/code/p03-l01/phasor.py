import math
import numpy as np

class Phasor:
    """A sinusoid A cos(wt + phi) at a shared frequency, stored as a complex number."""
    def __init__(self, amp, deg):
        self.z = amp * complex(math.cos(math.radians(deg)), math.sin(math.radians(deg)))

    @classmethod
    def from_complex(cls, z):
        p = cls(0, 0); p.z = complex(z); return p

    amp = property(lambda self: abs(self.z))
    deg = property(lambda self: math.degrees(math.atan2(self.z.imag, self.z.real)))

    def __add__(self, o): return Phasor.from_complex(self.z + o.z)
    def __mul__(self, o): return Phasor.from_complex(self.z * o.z)
    def __truediv__(self, o): return Phasor.from_complex(self.z / o.z)

    def at(self, t, w):
        return self.amp * np.cos(w * t + math.radians(self.deg))

if __name__ == "__main__":
    w = 2 * math.pi * 50
    v1, v2 = Phasor(2, 30), Phasor(4, -45)
    v = v1 + v2
    print(f"sum = {v.amp:.4f} V at {v.deg:.2f} deg")
    t = np.linspace(0, 0.04, 1000)                       # two periods, 1000 points
    err = np.max(np.abs(v.at(t, w) - (v1.at(t, w) + v2.at(t, w))))
    assert err < 1e-12, err
    assert abs(v.amp - 4.9134) < 1e-4 and abs(v.deg + 21.85) < 0.01
    q = v1 / v2
    assert abs(q.amp - 0.5) < 1e-12 and abs(q.deg - 75) < 1e-9
    assert abs((v1 * v2).deg + 15) < 1e-9
