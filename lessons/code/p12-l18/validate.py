import numpy as np
from scipy import stats

A_TRUE, B_TRUE = [1.5, -0.7], [0.5, 0.25]          # second-order system, poles at 0.75 +- 0.37j
N, M = 4000, 20

def simulate(seed, noise=0.1):
    rng = np.random.default_rng(seed)
    u = np.sign(rng.normal(size=N))                 # random binary input
    e = rng.normal(0, noise, N)
    y = np.zeros(N)
    for k in range(2, N):
        y[k] = A_TRUE[0] * y[k - 1] + A_TRUE[1] * y[k - 2] + B_TRUE[0] * u[k - 1] + B_TRUE[1] * u[k - 2] + e[k]
    return u, y

def regressors(u, y, n):
    rows = [np.concatenate([y[k - n:k][::-1], u[k - n:k][::-1]]) for k in range(n, len(y))]
    return np.array(rows), y[n:]

def fit_arx(u, y, n):
    Phi, Y = regressors(u, y, n)
    return np.linalg.lstsq(Phi, Y, rcond=None)[0]

def residuals(theta, u, y, n):
    Phi, Y = regressors(u, y, n)
    return Y - Phi @ theta

def simulate_model(theta, u, n):
    y = np.zeros(len(u))
    for k in range(n, len(u)):
        y[k] = theta[:n] @ y[k - n:k][::-1] + theta[n:] @ u[k - n:k][::-1]
    return y

def acf(r, m):
    r = r - r.mean(); d = r @ r
    return np.array([r[l:] @ r[:-l] / d for l in range(1, m + 1)])

def ljung_box(r, m=M):
    n = len(r); rho = acf(r, m)
    Q = n * (n + 2) * np.sum(rho ** 2 / (n - np.arange(1, m + 1)))
    return Q, 1 - stats.chi2.cdf(Q, m)

def fit_percent(y, yhat):
    return 100 * (1 - np.linalg.norm(y - yhat) / np.linalg.norm(y - y.mean()))

def test_correct_order_passes_whiteness():
    u, y = simulate(0); uv, yv = simulate(1)          # estimation and validation records
    th = fit_arx(u, y, 2)
    r = residuals(th, uv, yv, 2)
    Q, p = ljung_box(r)
    fit = fit_percent(yv, simulate_model(th, uv, 2))
    print(f"ARX(2): params {np.round(th, 3)}, validation fit {fit:.1f} %, Ljung-Box Q = {Q:.1f}, p = {p:.2f}")
    assert np.allclose(th, A_TRUE + B_TRUE, atol=0.02)
    assert p > 0.05 and Q < stats.chi2.ppf(0.95, M)
    assert np.max(np.abs(acf(r, 2))) < 1.96 / np.sqrt(len(r)) * 1.5
    # residuals uncorrelated with past input too
    rr = (r - r.mean()) / r.std(); uu = (uv[2:] - uv[2:].mean()) / uv[2:].std()
    xc = [np.mean(rr[l:] * uu[:-l]) for l in range(1, M + 1)]
    assert np.max(np.abs(xc)) < 3 / np.sqrt(len(r))

def test_under_modelled_fails():
    u, y = simulate(0); uv, yv = simulate(1)
    th = fit_arx(u, y, 1)
    r = residuals(th, uv, yv, 1)
    Q, p = ljung_box(r)
    fit = fit_percent(yv, simulate_model(th, uv, 1))
    print(f"ARX(1): validation fit {fit:.1f} %, lag-1 residual correlation {acf(r, 1)[0]:.2f}, Q = {Q:.0f}, p = {p:.1e}")
    assert p < 1e-6

def test_pass_rate_is_about_95_percent():
    passes = 0
    for seed in range(100, 200):
        u, y = simulate(seed)
        th = fit_arx(u, y, 2)
        uv, yv = simulate(seed + 1000)
        passes += ljung_box(residuals(th, uv, yv, 2))[1] > 0.05
    print(f"correct model passes Ljung-Box in {passes} of 100 independent experiments")
    assert 85 <= passes <= 100

test_correct_order_passes_whiteness()
test_under_modelled_fails()
test_pass_rate_is_about_95_percent()
print("PASS")
