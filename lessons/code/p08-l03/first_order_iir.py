import numpy as np

class OnePole:
    def __init__(self, tau, ts, exact=True):
        self.a = np.exp(-ts / tau) if exact else tau / (tau + ts)
        self.y = 0.0
    def __call__(self, x):
        self.y = self.a * self.y + (1 - self.a) * x
        return self.y

def measured_tau(f, ts, n=2000):
    y = np.array([f(1.0) for _ in range(n)])
    k = np.argmax(y >= 1 - np.exp(-1))                  # first sample at or past 63.2 %
    # interpolate between samples k-1 and k
    y0, y1 = (y[k - 1] if k else 0.0), y[k]
    return ((k - 1) + (1 - np.exp(-1) - y0) / (y1 - y0) + 1) * ts   # sample k is at time (k+1) ts

if __name__ == "__main__":
    tau, ts = 0.020, 0.001
    f = OnePole(tau, ts)
    assert abs(f.a - 0.95123) < 1e-5
    t = np.arange(1, 200) * ts
    y = np.array([f(1.0) for _ in t])
    assert np.allclose(y, 1 - np.exp(-t / tau))              # step-invariant: exact at every sample
    for tau_design in (0.005, 0.02, 0.1):
        est = measured_tau(OnePole(tau_design, ts), ts)
        assert abs(est - tau_design) / tau_design < 0.01, (tau_design, est)
    rng = np.random.default_rng(3)
    f = OnePole(tau, ts)
    out = np.array([f(v) for v in rng.standard_normal(200_000)])
    ratio = out[1000:].std()
    assert abs(ratio - np.sqrt((1 - f.a) / (1 + f.a))) < 0.005
    be = OnePole(0.001, 0.001, exact=False).a
    assert abs(be - 0.5) < 1e-12 and abs(np.exp(-1) - 0.3679) < 1e-4    # they differ a lot at Ts = tau
    print(f"a = {OnePole(tau, ts).a:.5f}, noise rms ratio {ratio:.3f}, measured tau matches design within 1 %")
