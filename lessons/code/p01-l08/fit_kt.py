import numpy as np

def solve(M, v):                       # small Gaussian elimination with pivoting
    M = np.array(M, float); v = np.array(v, float); n = len(v)
    for k in range(n):
        p = k + np.argmax(abs(M[k:, k])); M[[k, p]] = M[[p, k]]; v[[k, p]] = v[[p, k]]
        for i in range(k + 1, n):
            l = M[i, k] / M[k, k]; M[i] -= l * M[k]; v[i] -= l * v[k]
    x = np.zeros(n)
    for i in reversed(range(n)):
        x[i] = (v[i] - M[i, i + 1:] @ x[i + 1:]) / M[i, i]
    return x

def lstsq_normal(A, b):
    A = np.asarray(A, float)
    return solve(A.T @ A, A.T @ b)

if __name__ == "__main__":
    i = np.array([1, 2, 3, 4.]); tau = np.array([0.08, 0.15, 0.23, 0.30])
    k0 = lstsq_normal(i[:, None], tau)[0]
    k1, c1 = lstsq_normal(np.column_stack([i, np.ones(4)]), tau)
    assert abs(k0 - 0.075667) < 1e-6 and abs(k1 - 0.074) < 1e-9 and abs(c1 - 0.005) < 1e-9

    rng = np.random.default_rng(4)
    kt, c = 0.075, 0.01
    cur = rng.uniform(0.5, 10, 5000)          # a 5 s log at 1 kHz
    clean = kt * cur + c
    sigma = np.sqrt(np.mean(clean ** 2)) / 10      # 20 dB: noise rms is a tenth of signal rms
    meas = clean + rng.normal(0, sigma, cur.size)
    k_hat, c_hat = lstsq_normal(np.column_stack([cur, np.ones_like(cur)]), meas)
    err = abs(k_hat - kt) / kt
    print(f"k_t = {k_hat:.5f} N·m/A (error {100*err:.2f} %), offset {c_hat:.4f} N·m")
    assert err < 0.01
