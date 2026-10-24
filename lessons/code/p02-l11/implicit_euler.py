import numpy as np

def backward_euler(f, jac, t0, x0, h, n, newton_iters=8, tol=1e-12):
    x = np.array(x0, float); t = t0; out = [x.copy()]
    I = np.eye(len(x))
    for _ in range(n):
        t_new, y = t + h, x.copy()
        for _ in range(newton_iters):
            g = y - x - h * f(t_new, y)
            dy = np.linalg.solve(I - h * jac(t_new, y), g)
            y -= dy
            if np.abs(dy).max() < tol: break
        t, x = t_new, y; out.append(x.copy())
    return np.array(out)

if __name__ == "__main__":
    f1 = lambda t, x: -100 * (x - np.cos(t))
    j1 = lambda t, x: np.array([[-100.0]])
    xs = backward_euler(f1, j1, 0.0, [1.5], 0.1, 1)
    assert abs(xs[1, 0] - 1.04091) < 1e-5
    # stiff Van der Pol, mu = 1000: the fast eigenvalue is about -3000 near x = ±2
    mu = 1000.0
    f = lambda t, s: np.array([s[1], mu * (1 - s[0] ** 2) * s[1] - s[0]])
    J = lambda t, s: np.array([[0.0, 1.0], [-2 * mu * s[0] * s[1] - 1, mu * (1 - s[0] ** 2)]])
    lam_fast = abs(np.linalg.eigvals(J(0, [2.0, 0.0])).real).max()
    h_explicit = 2 / lam_fast
    h = 100 * h_explicit
    xs = backward_euler(f, J, 0.0, [2.0, 0.0], h, round(1500 / h))
    print(f"explicit limit {h_explicit:.2e} s; implicit step {h:.3f} s, |x| ≤ {abs(xs[:, 0]).max():.3f}")
    assert np.all(np.isfinite(xs)) and abs(xs[:, 0]).max() < 2.05
