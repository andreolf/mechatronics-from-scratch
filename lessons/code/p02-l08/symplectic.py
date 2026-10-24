import numpy as np

def explicit_euler(x, v, h, w2):
    return x + h * v, v - h * w2 * x

def symplectic_euler(x, v, h, w2):
    v = v - h * w2 * x
    return x + h * v, v

def energy_history(step, n, h=0.1, w2=1.0):
    x, v = 1.0, 0.0
    E = np.empty(n + 1); E[0] = 0.5 * (v * v + w2 * x * x)
    for k in range(n):
        x, v = step(x, v, h, w2)
        E[k + 1] = 0.5 * (v * v + w2 * x * x)
    return E / E[0]

if __name__ == "__main__":
    Ee = energy_history(explicit_euler, 300)
    assert abs(Ee[-1] - 1.01 ** 300) < 1e-9
    Es = energy_history(symplectic_euler, 100_000)
    print(f"explicit: x{Ee[-1]:.1f} after 300 steps; symplectic: {Es.min():.4f}…{Es.max():.4f} over 1e5 steps")
    assert 0.95 < Es.min() and Es.max() < 1.06
    first, last = Es[:10_000], Es[-10_000:]
    assert abs(first.max() - last.max()) < 1e-6           # bounded: no drift
    M = np.array([[1 - 0.01, 0.1], [-0.1, 1.0]])
    assert abs(np.linalg.det(M) - 1) < 1e-15 and np.allclose(abs(np.linalg.eigvals(M)), 1)
    x, v = 1.0, 0.0
    for _ in range(1000): x, v = symplectic_euler(x, v, 2.01, 1.0)   # just above 2/ω
    assert abs(x) > 1e3
