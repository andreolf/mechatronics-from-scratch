import numpy as np

rng = np.random.default_rng(0)
N = 64

def is_linear(system, trials=5):
    for _ in range(trials):
        x1, x2 = rng.standard_normal(N), rng.standard_normal(N)
        a, b = rng.standard_normal(2)
        if not np.allclose(system(a * x1 + b * x2), a * system(x1) + b * system(x2)):
            return False
    return True

def is_time_invariant(system, shift=7, trials=5):
    for _ in range(trials):
        x = np.concatenate([rng.standard_normal(N - 20), np.zeros(20)])
        xs = np.concatenate([np.zeros(shift), x[:-shift]])
        if not np.allclose(system(xs)[shift:], system(x)[:-shift]):
            return False
    return True

def is_causal(system):
    """Changing future inputs must not change past outputs."""
    x = rng.standard_normal(N)
    x2 = x.copy(); x2[40:] = rng.standard_normal(N - 40)
    return np.allclose(system(x)[:40], system(x2)[:40])

def iir(b, a):
    def run(x):
        y = np.zeros(len(x))
        for n in range(len(x)):
            y[n] = sum(b[k] * x[n - k] for k in range(len(b)) if n - k >= 0) \
                 - sum(a[k] * y[n - k] for k in range(1, len(a)) if n - k >= 0)
        return y
    return run

def bibo_stable(h, tol=1e6):
    return np.sum(np.abs(h)) < tol

if __name__ == "__main__":
    systems = {
        "moving average": lambda x: np.convolve(x, np.ones(4) / 4)[:len(x)],
        "square": lambda x: x ** 2,
        "offset": lambda x: x + 1,
        "n * x": lambda x: np.arange(len(x)) * x,
        "advance": lambda x: np.append(x[1:], 0),
        "iir": iir([1.0], [1.0, -0.9]),
    }
    expected = {"moving average": (1, 1, 1), "square": (0, 1, 1), "offset": (0, 1, 1),
                "n * x": (1, 0, 1), "advance": (1, 1, 0), "iir": (1, 1, 1)}
    for name, f in systems.items():
        got = (is_linear(f), is_time_invariant(f), is_causal(f))
        print(f"{name:15s} linear {got[0]!s:5}  time-invariant {got[1]!s:5}  causal {got[2]}")
        assert tuple(map(int, got)) == expected[name], name
    imp = np.zeros(2000); imp[0] = 1
    assert bibo_stable(iir([1.0], [1.0, -0.9])(imp)) and abs(iir([1.0], [1.0, -0.9])(imp).sum() - 10) < 1e-6
    assert not bibo_stable(iir([1.0], [1.0, -1.01])(imp))
