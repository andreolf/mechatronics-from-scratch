import numpy as np

class TF:
    """Transfer function as numerator/denominator coefficient arrays (highest power first)."""
    def __init__(self, num, den):
        self.num = np.trim_zeros(np.atleast_1d(np.asarray(num, float)), "f")
        self.den = np.trim_zeros(np.atleast_1d(np.asarray(den, float)), "f")

    def __mul__(self, o):            # series
        return TF(np.polymul(self.num, o.num), np.polymul(self.den, o.den))

    def feedback(self, H=None):      # negative feedback, unity by default
        H = H or TF([1], [1])
        return TF(np.polymul(self.num, H.den),
                  np.polyadd(np.polymul(self.den, H.den), np.polymul(self.num, H.num)))

    def __call__(self, s):
        return np.polyval(self.num, s) / np.polyval(self.den, s)

    poles = property(lambda self: np.roots(self.den))
    dc = property(lambda self: self(0.0))

def motor(J=1e-4, b=1e-5, K=0.05, R=1.0, L=1e-3):
    return TF([K], np.polyadd(np.polymul([J, b], [L, R]), [K * K]))

if __name__ == "__main__":
    G = motor()
    print("open-loop poles", np.round(np.sort(G.poles.real), 2), "DC gain", round(G.dc, 3))
    assert np.allclose(np.sort(G.poles.real), [-974.3389, -25.7611], atol=1e-3)
    assert abs(G.dc - 19.9203) < 1e-3
    T = (TF([0.5], [1]) * G).feedback()
    p = T.poles
    assert np.allclose(sorted(p, key=lambda z: z.imag), [-500.05 - 158.2719j, -500.05 + 158.2719j], atol=1e-3)
    assert abs(T.dc - 0.90876) < 1e-4
    # feedback formula agrees with direct evaluation G/(1+G) at many frequencies
    w = np.logspace(0, 5, 200) * 1j
    Gc = 0.5 * G(w)
    assert np.allclose(T(w), Gc / (1 + Gc), rtol=1e-10)
    print("closed-loop poles", np.round(p, 2), "DC gain", round(T.dc, 4))
