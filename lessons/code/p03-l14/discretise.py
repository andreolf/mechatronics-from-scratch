import numpy as np
from scipy.linalg import expm
from scipy import signal

def zoh(A, B, T):
    n, m = A.shape[0], B.shape[1]
    M = np.zeros((n + m, n + m)); M[:n, :n] = A; M[:n, n:] = B
    E = expm(M * T)
    return E[:n, :n], E[:n, n:]

def tustin_first_order(a, T, prewarp=None):
    """a/(s+a) -> (b, den) in z^-1 form, optional prewarping at prewarp rad/s."""
    k = 2 / T if prewarp is None else prewarp / np.tan(prewarp * T / 2)
    return np.array([a, a]) / (k + a), np.array([1, (a - k) / (k + a)])

if __name__ == "__main__":
    a, T = 2 * np.pi * 10, 0.01
    Phi, Gam = zoh(np.array([[-a]]), np.array([[a]]), T)
    assert abs(Phi[0, 0] - np.exp(-a * T)) < 1e-12 and abs(Gam[0, 0] - (1 - np.exp(-a * T))) < 1e-12
    # ZOH step response equals the continuous one at every sample
    x, xs = 0.0, []
    for _ in range(30):
        xs.append(x); x = Phi[0, 0] * x + Gam[0, 0] * 1.0
    t = np.arange(30) * T
    assert np.max(np.abs(np.array(xs) - (1 - np.exp(-a * t)))) < 1e-12
    b, den = tustin_first_order(a, T)
    assert abs(-den[1] - 0.52189) < 1e-5
    nd, dd, _ = signal.cont2discrete(([a], [1, a]), T, method="bilinear")
    assert np.allclose(b, np.ravel(nd), atol=1e-12) and np.allclose(den, dd, atol=1e-12)
    # warping: Tustin's -3 dB point sits at 9.69 Hz; prewarping puts it back at 10 Hz
    def corner(b, den):
        f = np.linspace(5, 15, 200_001)
        z = np.exp(1j * 2 * np.pi * f * T)
        H = (b[0] + b[1] / z) / (den[0] + den[1] / z)
        return f[np.argmin(np.abs(np.abs(H) - 1 / np.sqrt(2)))]
    assert abs(corner(b, den) - 9.689) < 0.001
    assert abs(corner(*tustin_first_order(a, T, prewarp=a)) - 10.0) < 0.001
    print(f"ZOH pole {Phi[0,0]:.4f}, Tustin pole {-den[1]:.4f}, Tustin corner {corner(b, den):.3f} Hz")
