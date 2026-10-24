import math
import numpy as np

M = 0.5

def model(p, t):
    k, c = p
    wn, z = math.sqrt(k / M), c / (2 * math.sqrt(k * M))
    wd = wn * math.sqrt(1 - z * z)
    return (1 / k) * (1 - np.exp(-z * wn * t) / math.sqrt(1 - z * z) * np.sin(wd * t + math.acos(z)))

def gauss_newton(res, p0, iters=30, tol=1e-10):
    p = np.asarray(p0, float)
    for _ in range(iters):
        r = res(p)
        R = np.column_stack([(res(p + dp) - res(p - dp)) / (2 * dp[j])        # central-difference Jacobian
                             for j, dp in enumerate(np.diag(1e-6 * np.abs(p)))])
        step = np.linalg.solve(R.T @ R, -R.T @ r)
        p = p + step
        if np.all(np.abs(step) < tol * np.abs(p)): break
    return p

def gradient_descent_bowl(alpha, n=40):
    x, y = 2.6, 1.2
    for _ in range(n): x, y = x - alpha * x, y - alpha * 10 * y
    return x, y

if __name__ == "__main__":
    t = np.linspace(0, 1.5, 301)
    k_true, c_true = 200.0, 4.0
    clean = model([k_true, c_true], t)
    data = clean + np.random.default_rng(16).normal(0, 0.02 * clean.max(), t.size)
    k_hat, c_hat = gauss_newton(lambda p: model(p, t) - data, [150.0, 6.0])
    print(f"k = {k_hat:.2f} N/m ({100*(k_hat/k_true - 1):+.2f} %), c = {c_hat:.3f} N·s/m ({100*(c_hat/c_true - 1):+.2f} %)")
    assert abs(k_hat / k_true - 1) < 0.02 and abs(c_hat / c_true - 1) < 0.02
    assert abs(gradient_descent_bowl(0.15)[1]) < 1e-10 and abs(gradient_descent_bowl(0.21)[1]) > 1.2
