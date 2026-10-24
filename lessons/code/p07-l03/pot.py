import numpy as np

def v_loaded(x, Rp, RL, Vs=3.3):
    lower = x * Rp
    par = lower * RL / (lower + RL) if RL != np.inf else lower
    return Vs * par / (par + (1 - x) * Rp)

def worst_error(Rp, RL, Vs=3.3):
    xs = np.linspace(0, 1, 10_001)
    err = xs * Vs - np.array([v_loaded(x, Rp, RL, Vs) for x in xs])
    i = int(np.argmax(np.abs(err)))
    return err[i] / Vs * 100, xs[i]

if __name__ == "__main__":
    e, at = worst_error(10e3, 100e3)
    print(f"10k pot into 100k: worst error {e:.2f} % at x = {at:.3f}")
    assert abs(e - 1.45) < 0.01 and 0.6 < at < 0.7
    # closed form matches the circuit
    x, k = 2 / 3, 10
    assert abs(v_loaded(x, 10e3, 100e3) / 3.3 - x / (1 + x * (1 - x) / k)) < 1e-12
    # rule of thumb: about 15/k percent for large k
    for k in (10, 30, 100, 1000):
        e, _ = worst_error(10e3, k * 10e3)
        assert abs(e * k - 15) < 2.5, (k, e * k)
    # buffered: an op-amp follower with 1e12 ohm input and 1 mV offset
    e_buf, _ = worst_error(10e3, 1e12)
    total = abs(e_buf) + 1e-3 / 3.3 * 100
    print(f"buffered: loading {e_buf:.2e} %, with 1 mV offset {total:.3f} %")
    assert total < 0.1
