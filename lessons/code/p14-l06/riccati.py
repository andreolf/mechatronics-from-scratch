import numpy as np
from scipy.linalg import solve_continuous_are, solve_discrete_are, expm

def care_hamiltonian(A, B, Q, R):
    """stable invariant subspace of the Hamiltonian [[A, -B R^-1 B^T], [-Q, -A^T]]: P = Y X^-1"""
    n = len(A)
    H = np.block([[A, -B @ np.linalg.solve(R, B.T)], [-Q, -A.T]])
    lam, V = np.linalg.eig(H)
    Vs = V[:, lam.real < 0]                                # the n stable eigenvectors
    X, Y = Vs[:n], Vs[n:]
    P = np.real(Y @ np.linalg.inv(X))
    return (P + P.T) / 2, lam

def dare_iterate(A, B, Q, R, tol=1e-12, max_iter=100000):
    """value iteration: P <- Q + A'PA - A'PB (R + B'PB)^-1 B'PA, starting from P = Q"""
    P = Q.copy(); hist = []
    for k in range(max_iter):
        G = np.linalg.solve(R + B.T @ P @ B, B.T @ P @ A)
        Pn = Q + A.T @ P @ A - A.T @ P @ B @ G
        d = np.abs(Pn - P).max() / np.abs(Pn).max(); hist.append(d); P = Pn
        if d < tol: return P, k + 1, hist
    raise RuntimeError("no convergence")

def zoh(A, B, T):
    n, m = B.shape; Mx = np.zeros((n + m, n + m)); Mx[:n, :n] = A; Mx[:n, n:] = B
    E = expm(Mx * T); return E[:n, :n], E[:n, n:]

def cartpole_AB(M=0.8, m=0.25, l=0.45, g=9.81):
    tot = M + m; den = l * (4 / 3 - m / tot); p2, beta = g / den, 1 / (tot * den)
    A = np.array([[0, 1, 0, 0], [0, 0, -m * l * p2 / tot, 0], [0, 0, 0, 1], [0, 0, p2, 0]], float)
    B = np.array([[0], [1 / tot + m * l * beta / tot], [0], [-beta]], float)
    return A, B

A, B = cartpole_AB(); Q = np.diag([10.0, 1.0, 100.0, 1.0]); R = np.array([[0.1]])

def test_hamiltonian_matches_scipy():
    P, lam = care_hamiltonian(A, B, Q, R)
    Pref = solve_continuous_are(A, B, Q, R)
    print(f"Hamiltonian eigenvalues (real parts) come in +/- pairs: {np.round(np.sort(lam.real), 3)}")
    print(f"P from the Hamiltonian vs scipy: max relative difference {np.abs(P - Pref).max() / np.abs(Pref).max():.1e}")
    assert np.allclose(P, Pref, rtol=1e-8)
    assert np.allclose(np.sort(lam.real), -np.sort(lam.real)[::-1], atol=1e-8)   # symmetric spectrum

def test_discrete_iteration_matches_scipy():
    for T in (0.02, 0.005):
        Ad, Bd = zoh(A, B, T)
        P, n, hist = dare_iterate(Ad, Bd, Q * T, R * T)          # running cost sampled every T
        Pref = solve_discrete_are(Ad, Bd, Q * T, R * T)
        print(f"T = {T * 1000:.0f} ms: Riccati iteration converged in {n} steps, max relative difference {np.abs(P - Pref).max() / np.abs(Pref).max():.1e}")
        assert np.allclose(P, Pref, rtol=1e-8)
    # as T shrinks, the discrete P (with cost scaled by T) approaches the continuous one
    Pc = solve_continuous_are(A, B, Q, R)
    Ad, Bd = zoh(A, B, 0.001); Pd = solve_discrete_are(Ad, Bd, Q * 0.001, R * 0.001)
    assert np.abs(Pd - Pc).max() / np.abs(Pc).max() < 0.01

def test_convergence_is_geometric():
    Ad, Bd = zoh(A, B, 0.02); _, n, hist = dare_iterate(Ad, Bd, Q * 0.02, R * 0.02)
    h = np.array(hist); tail = h[n // 2:n - 5]
    rate = np.exp(np.polyfit(np.arange(len(tail)), np.log(tail), 1)[0])
    Pd = solve_discrete_are(Ad, Bd, Q * 0.02, R * 0.02)
    Kd = np.linalg.solve(R * 0.02 + Bd.T @ Pd @ Bd, Bd.T @ Pd @ Ad)
    rho = np.abs(np.linalg.eigvals(Ad - Bd @ Kd)).max()
    print(f"error shrinks by {rate:.4f} per step; squared spectral radius of the closed loop {rho**2:.4f}")
    assert abs(rate - rho**2) < 0.01

test_hamiltonian_matches_scipy()
test_discrete_iteration_matches_scipy()
test_convergence_is_geometric()
print("PASS")
