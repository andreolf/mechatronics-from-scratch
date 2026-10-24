import numpy as np

def routh(coeffs, eps=1e-9):
    """Routh array of a polynomial (highest power first); returns the array and the number of RHP roots"""
    a = np.array(coeffs, float)
    if a[0] < 0: a = -a
    n = len(a) - 1
    width = (n + 2) // 2
    rows = [np.zeros(width), np.zeros(width)]
    rows[0][:len(a[0::2])] = a[0::2]; rows[1][:len(a[1::2])] = a[1::2]
    scale = np.max(np.abs(a))
    for i in range(2, n + 1):
        prev, above = rows[i - 1], rows[i - 2]
        if np.all(np.abs(prev) < 1e-12 * scale):            # row of zeros: use derivative of auxiliary polynomial
            order = n - (i - 2)
            powers = order - 2 * np.arange(width)
            prev = above * np.where(powers >= 0, powers, 0)
            rows[i - 1] = prev
        if abs(prev[0]) < 1e-12 * scale:                    # zero pivot: epsilon method
            prev = prev.copy(); prev[0] = eps * scale; rows[i - 1] = prev
        new = np.zeros(width)
        for j in range(width - 1):
            new[j] = (prev[0] * above[j + 1] - above[0] * prev[j + 1]) / prev[0]
        rows.append(new)
    first = np.array([r[0] for r in rows[:n + 1]])
    changes = int(np.sum(np.sign(first[:-1]) != np.sign(first[1:])))
    return rows[:n + 1], changes

def rhp_roots(coeffs):
    return int(np.sum(np.roots(coeffs).real > 0))

def test_worked_example():
    for K, expect in [(10, 0), (59, 0), (61, 2), (200, 2)]:
        _, ch = routh([1, 6, 11, 6 + K])
        assert ch == expect == rhp_roots([1, 6, 11, 6 + K])
    rows, _ = routh([1, 6, 11, 66])                        # K = 60: row of zeros
    w = np.sqrt(rows[1][1] / rows[1][0])
    print(f"K = 60: auxiliary polynomial {rows[1][0]:.0f}s^2 + {rows[1][1]:.0f}, oscillation at {w:.3f} rad/s")
    assert abs(w - np.sqrt(11)) < 1e-12

def test_special_cases():
    # zero in the first column: s^4 + s^3 + 2s^2 + 2s + 3 has two RHP roots
    _, ch = routh([1, 1, 2, 2, 3]); assert ch == 2 == rhp_roots([1, 1, 2, 2, 3])
    # row of zeros: (s - 1)(s + 1)(s + 2)(s^2 + 25) has one RHP root and a pair on the axis
    p = np.poly([1, -1, -2, 5j, -5j]).real
    _, ch = routh(p); assert ch == 1 == rhp_roots(np.round(p, 9))

def test_random_agreement():
    rng = np.random.default_rng(5); n_ok = 0
    for _ in range(500):
        deg = rng.integers(2, 9)
        roots = []
        while len(roots) < deg:
            if rng.random() < 0.4 and len(roots) <= deg - 2:
                re, im = rng.uniform(-3, 3), rng.uniform(0.2, 3); roots += [re + 1j * im, re - 1j * im]
            else:
                roots.append(rng.uniform(-3, 3))
        roots = np.array(roots)
        if np.min(np.abs(roots.real)) < 0.05: continue      # keep clear of the axis for a clean count
        p = np.poly(roots).real
        _, ch = routh(p)
        assert ch == int(np.sum(roots.real > 0)), (roots, ch)
        n_ok += 1
    print(f"{n_ok} random polynomials: Routh sign changes = RHP roots")

test_worked_example()
test_special_cases()
test_random_agreement()
print("PASS")
