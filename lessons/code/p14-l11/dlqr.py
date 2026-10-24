import numpy as np
from scipy.linalg import solve_continuous_are, solve_discrete_are, expm

def cartpole_AB(M=0.8, m=0.25, l=0.45, g=9.81):
    tot = M + m; den = l * (4 / 3 - m / tot); p2, beta = g / den, 1 / (tot * den)
    A = np.array([[0, 1, 0, 0], [0, 0, -m * l * p2 / tot, 0], [0, 0, 0, 1], [0, 0, p2, 0]], float)
    B = np.array([[0], [1 / tot + m * l * beta / tot], [0], [-beta]], float)
    return A, B

def zoh(A, B, T):
    n, m = B.shape; Mx = np.zeros((n + m, n + m)); Mx[:n, :n] = A; Mx[:n, n:] = B
    E = expm(Mx * T); return E[:n, :n], E[:n, n:]

def dlqr(Ad, Bd, Qd, Rd, tol=1e-13):
    """iterate the discrete Riccati equation to its fixed point, then K = (R + B'PB)^-1 B'PA"""
    P = Qd.copy()
    for _ in range(200000):
        K = np.linalg.solve(Rd + Bd.T @ P @ Bd, Bd.T @ P @ Ad)
        Pn = Qd + Ad.T @ P @ (Ad - Bd @ K)
        if np.abs(Pn - P).max() < tol * np.abs(Pn).max(): break
        P = Pn
    return np.linalg.solve(Rd + Bd.T @ Pn @ Bd, Bd.T @ Pn @ Ad), Pn

A, B = cartpole_AB(); Q = np.diag([5.0, 1, 50, 1]); R = np.array([[0.05]])
Kc = np.linalg.solve(R, B.T @ solve_continuous_are(A, B, Q, R))

def test_matches_scipy_dare():
    for T in (0.005, 0.02, 0.08):
        Ad, Bd = zoh(A, B, T)
        K, P = dlqr(Ad, Bd, Q * T, R * T)
        Pref = solve_discrete_are(Ad, Bd, Q * T, R * T)
        Kref = np.linalg.solve(R * T + Bd.T @ Pref @ Bd, Bd.T @ Pref @ Ad)
        print(f"T = {T * 1000:3.0f} ms: K = {np.round(K.ravel(), 2)}, difference from scipy {np.abs(K - Kref).max():.1e}")
        assert np.allclose(K, Kref, rtol=1e-7)

def rho(T, K):
    Ad, Bd = zoh(A, B, T)
    return np.abs(np.linalg.eigvals(Ad - Bd @ K)).max()

def test_dlqr_beats_emulation_at_slow_rates():
    print(" T (ms) | spectral radius: DLQR   continuous K emulated")
    for T in (0.005, 0.05, 0.1, 0.15):
        Ad, Bd = zoh(A, B, T); Kd, _ = dlqr(Ad, Bd, Q * T, R * T)
        print(f" {T * 1000:5.0f}  |                  {rho(T, Kd):.4f}   {rho(T, Kc):.4f}")
        assert rho(T, Kd) < 1                                   # the discrete design is always stable
    assert rho(0.15, Kc) > 1                                    # the emulated continuous gain has gone unstable
    # at fast rates the two designs agree
    Ad, Bd = zoh(A, B, 0.001); Kd, _ = dlqr(Ad, Bd, Q * 0.001, R * 0.001)
    assert np.abs(Kd - Kc).max() / np.abs(Kc).max() < 0.01

def test_discrete_matches_continuous_response():
    T = 0.005; Ad, Bd = zoh(A, B, T); Kd, _ = dlqr(Ad, Bd, Q * T, R * T)
    x0 = np.array([0, 0, 0.1, 0]); xd = x0.copy(); E = expm((A - B @ Kc) * T); xc = x0.copy(); d = 0.0
    for _ in range(600):
        xd = (Ad - Bd @ Kd) @ xd; xc = E @ xc; d = max(d, abs(xd[2] - xc[2]))
    print(f"T = 5 ms: discrete and continuous LQR angle responses differ by at most {np.degrees(d):.3f} deg")
    assert np.degrees(d) < 0.2

test_matches_scipy_dare()
test_dlqr_beats_emulation_at_slow_rates()
test_discrete_matches_continuous_response()
print("PASS")
