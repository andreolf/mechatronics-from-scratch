import numpy as np

rng = np.random.default_rng(15)
CD, D, RS = 0.61, 0.010, 287.0
A = np.pi * D**2 / 4

def rho_air(p_abs=101_300.0, T_c=20.0):
    return p_abs / (RS * (T_c + 273.15))

def flow(dp, rho):
    return CD * A * np.sqrt(2 * np.maximum(dp, 0) / rho)

class DpSensor:
    """0-5 kPa differential sensor: 12-bit, 0.25 % FS offset, 0.05 % FS noise."""
    def __init__(self):
        self.offset, self.zero = 12.5, 0.0
    def read(self, dp, n=16):
        raw = dp + self.offset + 2.5 * rng.standard_normal(n)
        return float(np.mean(np.round(raw / (5000 / 4096)) * (5000 / 4096))) - self.zero
    def calibrate_zero(self):
        self.zero = self.read(0.0, n=256)

if __name__ == "__main__":
    rho = rho_air()
    q = flow(2000, rho)
    assert abs(rho - 1.204) < 0.001 and abs(q * 1000 - 2.76) < 0.01
    s = DpSensor()
    q_full = flow(5000, rho)
    def worst_error(sensor):
        worst = 0.0
        for frac in np.linspace(0.1, 1.0, 10):              # 10-100 % of full flow
            q_true = frac * q_full
            dp = (q_true / (CD * A)) ** 2 * rho / 2
            worst = max(worst, abs(flow(sensor.read(dp), rho) - q_true) / q_true)
        return worst
    before = worst_error(s)
    s.calibrate_zero()
    after = worst_error(s)
    print(f"worst flow error over 10-100 % flow: {100*before:.1f} % before zeroing, {100*after:.2f} % after")
    assert before > 0.05 and after < 0.05
    # temperature: using 20 C density when the air is at 50 C
    err = flow(2000, rho_air(T_c=20)) / flow(2000, rho_air(T_c=50)) - 1
    assert abs(err - (np.sqrt(293.15 / 323.15) - 1)) < 1e-12
    print(f"density from the wrong temperature (20 vs 50 C): {100*err:.1f} % flow error")
