import numpy as np

rng = np.random.default_rng(6)
FS, BIAS, N_DENS = 100.0, 0.5, 0.01                     # Hz, deg/s, deg/s/sqrt(Hz)

def gyro(true_rate):
    return true_rate + BIAS + N_DENS * np.sqrt(FS) * rng.standard_normal(np.shape(true_rate))

def estimate_bias(seconds_at_rest):
    return gyro(np.zeros(int(seconds_at_rest * FS))).mean()

if __name__ == "__main__":
    ests = np.array([estimate_bias(10) for _ in range(300)])
    rel = np.abs(ests - BIAS) / BIAS
    print(f"bias estimates from 10 s: mean {ests.mean():.4f}, std {ests.std():.4f} deg/s, worst {100*rel.max():.2f} %")
    assert rel.max() < 0.05
    assert abs(ests.std() - N_DENS / np.sqrt(10)) < 0.0007
    # a manoeuvre: rotate 90 deg in 2 s, then hold, over 60 s
    t = np.arange(0, 60, 1 / FS)
    rate = np.where(t < 2, 45.0, 0.0)
    m = gyro(rate)
    b = estimate_bias(10)
    raw = np.cumsum(m) / FS
    corrected = np.cumsum(m - b) / FS
    truth = np.cumsum(rate) / FS
    print(f"after 60 s: raw error {raw[-1]-truth[-1]:.1f} deg, corrected error {corrected[-1]-truth[-1]:.2f} deg")
    assert abs(raw[-1] - truth[-1] - 30) < 1 and abs(corrected[-1] - truth[-1]) < 1
    assert abs(2 * np.radians(100) * 0.1 - 0.349) < 0.001
