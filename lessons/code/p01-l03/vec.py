import math, random
import numpy as np

def dot(a, b):
    return sum(x * y for x, y in zip(a, b))

def norm(a):
    return math.sqrt(dot(a, a))

def cross(a, b):
    ax, ay, az = a
    bx, by, bz = b
    return (ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx)

if __name__ == "__main__":
    M = cross((0.2, 0.1, 0.0), (0.0, 0.0, -50.0))
    assert np.allclose(M, (-5, 10, 0)) and abs(norm(M) - 11.1803) < 1e-4
    rng = random.Random(0)
    for _ in range(1000):
        a = [rng.uniform(-1, 1) for _ in range(3)]
        b = [rng.uniform(-1, 1) for _ in range(3)]
        c = cross(a, b)
        assert np.allclose(c, np.cross(a, b), atol=1e-12)
        assert abs(dot(c, a)) < 1e-12 and abs(dot(c, b)) < 1e-12
        assert abs(dot(a, b) - np.dot(a, b)) < 1e-12
    print("dot, cross and norm match NumPy on 1000 random pairs")
