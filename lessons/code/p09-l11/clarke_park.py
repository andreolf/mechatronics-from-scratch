import numpy as np

S3 = np.sqrt(3)

def clarke(a, b, c):
    return (2 / 3) * (a - b / 2 - c / 2), (b - c) / S3

def inv_clarke(al, be):
    return al, -al / 2 + S3 / 2 * be, -al / 2 - S3 / 2 * be

def park(al, be, th):
    return al * np.cos(th) + be * np.sin(th), -al * np.sin(th) + be * np.cos(th)

def inv_park(d, q, th):
    return d * np.cos(th) - q * np.sin(th), d * np.sin(th) + q * np.cos(th)

if __name__ == "__main__":
    rng = np.random.default_rng(11)
    th = rng.uniform(-np.pi, np.pi, 100000)
    d0, q0 = rng.normal(size=th.size), rng.normal(size=th.size)
    a, b, c = inv_clarke(*inv_park(d0, q0, th))
    assert np.max(np.abs(a + b + c)) < 1e-12                 # inverse Clarke gives a balanced set
    d1, q1 = park(*clarke(a, b, c), th)
    err = max(np.max(np.abs(d1 - d0)), np.max(np.abs(q1 - q0)))
    print(f"round-trip error {err:.2e}")
    assert err < 1e-12
    # a balanced rotating set becomes constants in dq
    t = np.linspace(0, 2 * np.pi, 1000); g = np.radians(90)
    ia, ib, ic = (np.cos(t + g - k * 2 * np.pi / 3) for k in range(3))
    d, q = park(*clarke(ia, ib, ic), t)
    assert np.ptp(d) < 1e-12 and np.ptp(q) < 1e-12 and abs(q[0] - 1) < 1e-12
    # the two-sensor shortcut matches when a + b + c = 0
    al, be = clarke(ia, ib, ic)
    assert np.allclose(al, ia) and np.allclose(be, (ia + 2 * ib) / S3)
    # worked example
    d, q = park(*clarke(*(np.cos(np.radians(40) + g - k * 2 * np.pi / 3) for k in range(3))), np.radians(40))
    assert abs(d) < 1e-12 and abs(q - 1) < 1e-12
