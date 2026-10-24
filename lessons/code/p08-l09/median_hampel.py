import numpy as np

def running_median(x, k):
    h = (k - 1) // 2
    xp = np.pad(x, h, mode="edge")
    return np.array([np.median(xp[i:i + k]) for i in range(len(x))])     # centred window (offline)

def hampel(x, k=7, t=3.0):
    h = (k - 1) // 2
    xp = np.pad(x, h, mode="edge")
    y, flagged = x.copy(), np.zeros(len(x), bool)
    for i in range(len(x)):
        w = xp[i:i + k]
        m = np.median(w)
        mad = np.median(np.abs(w - m))
        if np.abs(x[i] - m) > t * 1.4826 * mad:
            y[i], flagged[i] = m, True
    return y, flagged

def moving_average(x, k):
    h = (k - 1) // 2
    return np.convolve(np.pad(x, h, mode="edge"), np.ones(k) / k, mode="valid")

if __name__ == "__main__":
    rng = np.random.default_rng(9)
    n = 400
    truth = np.where(np.arange(n) >= 200, 2.0, 0.0)
    x = truth + 0.05 * rng.standard_normal(n)
    spikes = rng.choice(np.r_[10:190, 210:390], 12, replace=False)
    x[spikes] += rng.choice([-3, 4], 12)
    med = running_median(x, 7)
    ham, flagged = hampel(x, 7)
    ma = moving_average(x, 7)
    err = lambda y: np.abs(y - truth)[np.r_[5:195, 205:395]].max()
    print(f"worst error away from the step: moving average {err(ma):.2f}, median {err(med):.2f}, Hampel {err(ham):.2f}")
    assert err(med) < 0.25 and err(ham) < 0.25 and err(ma) > 0.4
    assert set(spikes) <= set(np.flatnonzero(flagged))
    assert flagged.sum() < 30                                        # good samples mostly untouched
    # the step stays sharp: within one sample, the median output switches level
    assert med[198] < 0.5 and med[201] > 1.5
    assert ma[198] > 0.5 or ma[201] < 1.5                            # the average smears it
    w = np.array([1.0, 1.1, 0.9, 9.0, 1.0, 1.1, 0.9])
    assert abs(np.mean(w[2:7]) - 2.58) < 1e-9 and np.median(w[2:7]) == 1.0
    y, f = hampel(w, 7)
    assert f[3] and y[3] == 1.0                                     # the spike is flagged and replaced by the median
