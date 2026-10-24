import numpy as np
from scipy import signal

def tf2ccf(num, den):
    """controllable canonical form of num/den (proper); returns A, B, C, D"""
    num, den = np.array(num, float), np.array(den, float)
    num, den = num / den[0], den / den[0]
    n = len(den) - 1
    num = np.concatenate([np.zeros(n + 1 - len(num)), num])     # pad to degree n
    D = num[0]
    rem = num - D * den                                         # strictly proper remainder
    b = rem[1:][::-1]                                           # b0 .. b_{n-1}
    a = den[1:][::-1]                                           # a0 .. a_{n-1}
    A = np.zeros((n, n)); A[:-1, 1:] = np.eye(n - 1); A[-1, :] = -a
    B = np.zeros((n, 1)); B[-1, 0] = 1
    C = b.reshape(1, n)
    return A, B, C, np.array([[D]])

def ss_eval(A, B, C, D, s):
    n = A.shape[0]
    return (C @ np.linalg.solve(s * np.eye(n) - A, B) + D)[0, 0]

def test_worked_example():
    A, B, C, D = tf2ccf([2, 3], [1, 4, 5])
    assert np.allclose(A, [[0, 1], [-5, -4]]) and np.allclose(C, [[3, 2]]) and D[0, 0] == 0
    assert abs(ss_eval(A, B, C, D, 0) - 0.6) < 1e-12
    assert np.allclose(sorted(np.linalg.eigvals(A), key=lambda z: z.imag), [-2 - 1j, -2 + 1j])

def test_round_trip_random():
    rng = np.random.default_rng(2)
    for _ in range(300):
        n = rng.integers(1, 7)
        den = np.concatenate([[1.0], rng.uniform(-5, 5, n)])
        num = rng.uniform(-5, 5, rng.integers(1, n + 2))           # up to the same degree: D can be non-zero
        A, B, C, D = tf2ccf(num, den)
        for s in [0.3j, 1.7j, 2.0 + 1j, 11j]:
            g = np.polyval(num, s) / np.polyval(den, s)
            assert abs(ss_eval(A, B, C, D, s) - g) <= 1e-8 * max(1, abs(g))
        n2, d2 = signal.ss2tf(A, B, C, D)                          # independent conversion back
        L = max(len(num), len(n2[0]))
        assert np.allclose(np.pad(num / den[0], (L - len(num), 0)), np.pad(n2[0], (L - len(n2[0]), 0)), atol=1e-8)
        assert np.allclose(d2, den, atol=1e-8)
        assert np.allclose(np.sort_complex(np.linalg.eigvals(A)), np.sort_complex(np.roots(den)), atol=1e-6)
    print("300 random transfer functions: CCF -> TF matches the original (own evaluation and scipy.signal.ss2tf)")

def test_similarity_invariance():
    A, B, C, D = tf2ccf([1, 2, 3], [1, 6, 11, 6])
    T = np.random.default_rng(3).normal(size=(3, 3))
    Ti = np.linalg.inv(T)
    A2, B2, C2 = T @ A @ Ti, T @ B, C @ Ti
    for s in [0.5j, 3j, 1 + 2j]:
        assert abs(ss_eval(A, B, C, D, s) - ss_eval(A2, B2, C2, D, s)) < 1e-9
    print("a random change of state variables leaves the transfer function unchanged")

def test_mass_spring():
    m, c, k = 2.0, 3.0, 50.0
    A = np.array([[0, 1], [-k / m, -c / m]]); B = np.array([[0], [1 / m]]); C = np.array([[1.0, 0]]); D = np.zeros((1, 1))
    for s in [0.1j, 5j, 2 + 3j]:
        assert abs(ss_eval(A, B, C, D, s) - 1 / (m * s ** 2 + c * s + k)) < 1e-12

test_worked_example()
test_round_trip_random()
test_similarity_invariance()
test_mass_spring()
print("PASS")
