import numpy as np

N, TS, FT = 2000, 1e-3, 10e6
rng = np.random.default_rng(2)

def edge_times(speed, duration, jitter=0.0):
    """Times of encoder counts for a constant speed in rev/s, with optional edge jitter (seconds)."""
    dt = 1 / (speed * N)
    t = np.arange(dt * rng.uniform(0, 1), duration, dt)
    return np.sort(t + jitter * rng.standard_normal(t.size))

def frequency_method(edges, duration):
    windows = np.arange(0, duration, TS)
    counts = np.histogram(edges, bins=np.append(windows, duration))[0]
    return counts / (N * TS)

def period_method(edges):
    ticks = np.diff(np.floor(edges * FT))                     # captured timer values at each edge
    return FT / (N * ticks)

def rel_err(est, speed):
    return np.sqrt(np.mean((est - speed) ** 2)) / speed

if __name__ == "__main__":
    for speed in (0.73, 3.3, 83.7):            # speeds that are not whole counts per window
        e = edge_times(speed, 2.0)
        f = rel_err(frequency_method(e, 2.0)[1:-1], speed)
        p = rel_err(period_method(e), speed)
        print(f"{speed:5.2f} rev/s: frequency method {100*f:6.2f} % rms, period method {100*p:6.3f} % rms")
        if speed < 50:
            assert p < f
        else:
            assert f < p
    crossover = np.sqrt(FT / (N**2 * TS))
    assert abs(crossover - 50) < 1e-9
    assert abs(1 / (N * TS) - 0.5) < 1e-12 and abs(FT / (2 * N) - 2500) < 1e-9
