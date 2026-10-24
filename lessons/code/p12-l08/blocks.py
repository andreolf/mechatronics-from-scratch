import numpy as np
from scipy import signal

class TF:
    """transfer function as numerator and denominator coefficient arrays, highest power first"""
    def __init__(self, num, den):
        num, den = np.atleast_1d(np.array(num, float)), np.atleast_1d(np.array(den, float))
        s = den[np.flatnonzero(den)[0]]
        self.num, self.den = np.trim_zeros(num / s, "f") if np.any(num) else np.array([0.0]), np.trim_zeros(den / s, "f")
    def __mul__(self, o):
        o = o if isinstance(o, TF) else TF([o], [1])
        return TF(np.polymul(self.num, o.num), np.polymul(self.den, o.den))
    __rmul__ = __mul__
    def __add__(self, o):
        o = o if isinstance(o, TF) else TF([o], [1])
        return TF(np.polyadd(np.polymul(self.num, o.den), np.polymul(o.num, self.den)), np.polymul(self.den, o.den))
    def feedback(self, H=1, sign=-1):
        H = H if isinstance(H, TF) else TF([H], [1])
        num = np.polymul(self.num, H.den)
        den = np.polyadd(np.polymul(self.den, H.den), -sign * np.polymul(self.num, H.num))
        return TF(num, den)
    def __call__(self, s):
        return np.polyval(self.num, s) / np.polyval(self.den, s)
    def __repr__(self):
        return f"TF({np.round(self.num, 6).tolist()}, {np.round(self.den, 6).tolist()})"

def servo_by_reduction(K, km, tau, kv):
    Gm = TF([km], [tau, 1])
    inner = Gm.feedback(kv)
    return (K * inner * TF([1], [1, 0])).feedback(1)

def servo_by_mason(K, km, tau, kv):
    Gm = TF([km], [tau, 1]); I = TF([1], [1, 0])
    P = K * Gm * I
    L1 = -kv * Gm
    L2 = -1 * (K * Gm * I)
    delta = TF([1], [1]) + (-1) * L1 + (-1) * L2
    return TF(np.polymul(P.num, delta.den), np.polymul(P.den, delta.num))

def servo_by_state_space(K, km, tau, kv):
    """independent check: connect the blocks as state-space systems with scipy and convert back"""
    A1, B1, C1, D1 = signal.tf2ss([km], [tau, 1])          # motor: voltage -> speed
    # states: motor state(s) x, position p.  u = K*(r - p) - kv*w,  w = C1 x
    n = A1.shape[0]
    A = np.zeros((n + 1, n + 1)); B = np.zeros((n + 1, 1)); C = np.zeros((1, n + 1))
    A[:n, :n] = A1 - kv * B1 @ C1
    A[:n, n:] = -K * B1
    A[n, :n] = C1                                          # p' = w
    B[:n, 0] = K * B1[:, 0]
    C[0, n] = 1
    num, den = signal.ss2tf(A, B, C, np.zeros((1, 1)))
    return TF(num[0], den)

def test_worked_example():
    T = servo_by_reduction(4, 10, 0.1, 0.2)
    print("reduced:", T)
    assert np.allclose(T.num, [400]) and np.allclose(T.den, [1, 30, 400])

def test_three_methods_agree():
    rng = np.random.default_rng(1)
    for _ in range(50):
        K, km, tau, kv = rng.uniform(0.5, 10), rng.uniform(1, 20), rng.uniform(0.01, 1), rng.uniform(0, 1)
        T1, T2, T3 = servo_by_reduction(K, km, tau, kv), servo_by_mason(K, km, tau, kv), servo_by_state_space(K, km, tau, kv)
        for w in np.geomspace(0.1, 1000, 30):
            s = 1j * w
            assert abs(T1(s) - T3(s)) <= 1e-9 * max(1, abs(T3(s)))
            assert abs(T2(s) - T3(s)) <= 1e-9 * max(1, abs(T3(s)))
    print("block reduction, Mason's rule and the SciPy state-space interconnection agree on 50 random servos")

def test_rules():
    G1, G2 = TF([1], [1, 2]), TF([3], [1, 5])
    s = 2j
    assert abs((G1 * G2)(s) - G1(s) * G2(s)) < 1e-12
    assert abs((G1 + G2)(s) - (G1(s) + G2(s))) < 1e-12
    assert abs(G1.feedback(G2)(s) - G1(s) / (1 + G1(s) * G2(s))) < 1e-12
    assert abs(G1.feedback(G2, sign=+1)(s) - G1(s) / (1 - G1(s) * G2(s))) < 1e-12

test_worked_example()
test_three_methods_agree()
test_rules()
print("PASS")
