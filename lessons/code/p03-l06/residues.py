import numpy as np
from scipy import signal

def residues(num, den):
    """Residues r_i = N(p_i)/D'(p_i) for a strictly proper TF with distinct poles."""
    p = np.roots(den)
    if np.min(np.abs(p[:, None] - p[None, :]) + np.eye(len(p)) * 1e9) < 1e-6:
        raise ValueError("repeated poles: use the repeated-pole formula")
    return np.polyval(num, p) / np.polyval(np.polyder(den), p), p

def impulse(num, den, t):
    r, p = residues(num, den)
    return np.real(sum(ri * np.exp(pi * t) for ri, pi in zip(r, p)))

if __name__ == "__main__":
    num, den = [1, 3], np.poly([-1, -2, -4])
    r, p = residues(num, den)
    order = np.argsort(-p.real)
    assert np.allclose(r[order].real, [2/3, -1/2, -1/6])
    t = np.linspace(0, 8, 4001)
    g = impulse(num, den, t)
    _, g_sim = signal.impulse((num, den), T=t)              # scipy's state-space simulation
    assert np.max(np.abs(g - g_sim)) < 1e-9
    # complex pair: 20/(s^2 + 4s + 20) times step 1/s
    t2 = np.linspace(0, 5, 2001)
    y = impulse([20], np.polymul([1, 4, 20], [1, 0]), t2)
    _, y_sim = signal.step(([20], [1, 4, 20]), T=t2)
    assert np.max(np.abs(y - y_sim)) < 1e-9
    try:
        residues([1], [1, 2, 1]); raise AssertionError("should refuse a repeated pole")
    except ValueError:
        pass
    x = lambda t: 1 - np.exp(-t) - t * np.exp(-t)          # repeated-pole result
    _, xs = signal.step(([1], [1, 2, 1]), T=t)
    assert np.max(np.abs(x(t) - xs)) < 1e-9
    print("residues", np.round(r[order].real, 4), "; reconstruction matches simulation")
