import numpy as np

def allan(rate, fs, taus):
    """Non-overlapping Allan deviation of a rate signal."""
    out = []
    for tau in taus:
        m = int(round(tau * fs))
        k = len(rate) // m
        ybar = rate[: k * m].reshape(k, m).mean(axis=1)
        out.append(np.sqrt(0.5 * np.mean(np.diff(ybar) ** 2)))
    return np.array(out)

if __name__ == "__main__":
    fs, T = 100.0, 3600.0
    arw = 0.2                                   # deg/sqrt(h)
    N = arw / 60                                 # (deg/s)/sqrt(Hz)
    rng = np.random.default_rng(4)
    n = int(fs * T)
    rate = N * np.sqrt(fs) * rng.standard_normal(n) + 0.7    # constant bias 0.7 deg/s
    assert abs(rate.std() - 0.0333) < 1e-3
    taus = np.array([0.1, 1.0, 10.0])
    ad = allan(rate, fs, taus)
    print("sigma(1 s) =", ad[1], "expected", N)
    assert abs(ad[1] / N - 1) < 0.10                          # ARW recovered within 10 %
    slope = np.polyfit(np.log(taus), np.log(ad), 1)[0]
    assert abs(slope + 0.5) < 0.05                            # -1/2 slope; the bias cancels
    # add rate random walk: the long-tau end rises with slope +1/2
    K = 40 / 216000                                           # 40 deg/h/sqrt(h)
    bias = np.cumsum(K * np.sqrt(1 / fs) * rng.standard_normal(n))
    ad2 = allan(rate + bias, fs, [1.0, 100.0, 300.0])
    assert ad2[2] > ad2[1] and abs(ad2[2] / (K * np.sqrt(300 / 3)) - 1) < 0.5
