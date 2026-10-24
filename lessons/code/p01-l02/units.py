import math

DIMS = ("kg", "m", "s", "A")

class Quantity:
    def __init__(self, value, dims=(0, 0, 0, 0)):
        self.value = float(value)
        self.dims = tuple(dims)

    def __add__(self, other):
        if self.dims != other.dims:
            raise TypeError(f"cannot add {self.unit()} and {other.unit()}")
        return Quantity(self.value + other.value, self.dims)

    __sub__ = lambda self, o: self + Quantity(-o.value, o.dims)

    def __mul__(self, other):
        if not isinstance(other, Quantity):
            return Quantity(self.value * other, self.dims)
        return Quantity(self.value * other.value,
                        [a + b for a, b in zip(self.dims, other.dims)])

    __rmul__ = __mul__

    def __truediv__(self, other):
        if not isinstance(other, Quantity):
            return Quantity(self.value / other, self.dims)
        return Quantity(self.value / other.value,
                        [a - b for a, b in zip(self.dims, other.dims)])

    def unit(self):
        parts = [f"{d}^{e}" if e != 1 else d for d, e in zip(DIMS, self.dims) if e]
        return "·".join(parts) or "1"

    def __repr__(self):
        return f"{self.value:g} {self.unit()}"

kg, m, s, A = (Quantity(1, d) for d in [(1,0,0,0), (0,1,0,0), (0,0,1,0), (0,0,0,1)])
N = kg * m / (s * s)
W = N * m / s

if __name__ == "__main__":
    torque = 0.5 * N * m
    omega = Quantity(2 * math.pi * 3000 / 60, (0, 0, -1, 0))   # rad/s
    P = torque * omega
    assert P.dims == W.dims and abs(P.value - 157.0796) < 1e-3
    print("shaft power:", P)
    try:
        (2 * m) + (3 * s)
    except TypeError as e:
        print("refused:", e)
    else:
        raise SystemExit("adding metres to seconds must fail")
