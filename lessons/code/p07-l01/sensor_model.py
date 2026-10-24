import numpy as np

class SensorModel:
    """0-100 kPa in, 0.5-4.5 V out, with gain, offset, bow non-linearity, hysteresis, noise and saturation."""
    def __init__(self, gain_err=0.0, offset_fs=0.0, nl_fs=0.0, hys_fs=0.0, noise_fs=0.0, seed=0):
        self.g, self.o, self.nl, self.hys, self.noise = gain_err, offset_fs, nl_fs, hys_fs, noise_fs
        self.rng = np.random.default_rng(seed)
        self.last = 0.0
    def read(self, p):
        x = p / 100.0                                          # fraction of full scale
        rising = p >= self.last
        self.last = p
        y = x * (1 + self.g) + self.o + self.nl * 4 * x * (1 - x) + (-0.5 if rising else 0.5) * self.hys
        y += self.noise * self.rng.standard_normal()
        v = 0.5 + 4.0 * y
        return float(np.clip(v, 0.25, 4.75))                   # output stage saturates
    @staticmethod
    def to_kpa(v):
        return (v - 0.5) / 4.0 * 100

if __name__ == "__main__":
    spec = dict(offset_fs=0.005, gain_err=0.015, nl_fs=0.0025, hys_fs=0.001)
    worst = sum(spec.values()) * 100
    rss = np.sqrt(sum(v**2 for v in spec.values())) * 100
    assert abs(worst - 2.35) < 1e-9 and abs(rss - 1.60) < 0.005
    # worst-case corner: all errors at their limit, read at full scale while rising
    s = SensorModel(gain_err=0.015, offset_fs=0.005, nl_fs=0.0, hys_fs=0.001)
    s.last = -1
    assert abs(s.to_kpa(s.read(100)) - 100 - (1.5 + 0.5 - 0.05)) < 1e-9
    # random parts within the spec never exceed the worst case
    rng = np.random.default_rng(1)
    errs = []
    for part in range(2000):
        e = {k: v * rng.uniform(-1, 1) for k, v in spec.items()}
        e["hys_fs"] = spec["hys_fs"]
        m = SensorModel(**e, seed=part)
        for p in np.linspace(0, 100, 21):
            errs.append(m.to_kpa(m.read(p)) - p)
    errs = np.abs(errs)
    print(f"max error over 2000 parts {errs.max():.2f} kPa (worst case {worst:.2f}), 99th percentile {np.percentile(errs, 99):.2f}")
    assert errs.max() <= worst and np.percentile(errs, 99) < rss
    # accuracy against precision: bias survives averaging, scatter does not
    m = SensorModel(offset_fs=0.01, noise_fs=0.002, seed=3)
    r = np.array([m.to_kpa(m.read(50)) for _ in range(10_000)])
    assert abs(r.mean() - 50 - 1.0) < 0.01 and abs(r.std() - 0.2) < 0.01
    assert SensorModel().read(150) == 4.75                        # saturates above range
