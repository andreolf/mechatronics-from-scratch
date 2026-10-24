import numpy as np
from scipy.linalg import solve_continuous_are, expm

def lyap(Acl, Qc):
    """solve Acl^T P + P Acl + Qc = 0 by vectorising (Kronecker form); fine for small n"""
    n = len(Acl); I = np.eye(n)
    M = np.kron(I, Acl.T) + np.kron(Acl.T, I)
    P = np.linalg.solve(M, -Qc.reshape(-1)).reshape(n, n)
    return (P + P.T) / 2

def lqr(A, B, Q, R, K0, iters=30):
    """Kleinman's Newton iteration: evaluate the cost of K, then improve K = R^-1 B^T P"""
    K = K0
    for _ in range(iters):
        Acl = A - B @ K
        P = lyap(Acl, Q + K.T @ R @ K)                 # cost-to-go matrix of the current K
        K_new = np.linalg.solve(R, B.T @ P)
        if np.abs(K_new - K).max() < 1e-12: break
        K = K_new
    return K_new, P

def cost_of(A, B, Q, R, K, x0):
    """J = integral of x'Qx + u'Ru for u = -Kx, from x0 (exact, via the Lyapunov equation)"""
    return float(x0 @ lyap(A - B @ K, Q + K.T @ R @ K) @ x0)

def cartpole_AB(M=0.8, m=0.25, l=0.45, g=9.81):
    tot = M + m; den = l * (4 / 3 - m / tot); p2, beta = g / den, 1 / (tot * den)
    A = np.array([[0, 1, 0, 0], [0, 0, -m * l * p2 / tot, 0], [0, 0, 0, 1], [0, 0, p2, 0]], float)
    B = np.array([[0], [1 / tot + m * l * beta / tot], [0], [-beta]], float)
    return A, B

A2 = np.array([[0.0, 1.0], [0.0, 0.0]]); B2 = np.array([[0.0], [1.0]])     # double integrator

def test_double_integrator_closed_form():
    for q in (0.1, 1.0, 100.0):
        K, P = lqr(A2, B2, np.diag([q, 0.0]), np.eye(1), K0=np.array([[1.0, 2.0]]))
        Kx = np.array([np.sqrt(q), np.sqrt(2 * np.sqrt(q))])
        assert np.allclose(K.ravel(), Kx, rtol=1e-9)
    print(f"double integrator, Q = diag(q, 0), R = 1: K = (sqrt q, sqrt(2 sqrt q)), e.g. q = 100 gives {np.round(K.ravel(), 4)}")

def test_matches_scipy_care():
    A, B = cartpole_AB(); Q = np.diag([10.0, 1.0, 100.0, 1.0]); R = np.array([[0.1]])
    K0 = np.array([[-18.991, -18.041, -83.277, -20.14]])     # any stabilising gain (lesson 04's pole placement)
    K, P = lqr(A, B, Q, R, K0)
    Pref = solve_continuous_are(A, B, Q, R); Kref = np.linalg.solve(R, B.T @ Pref)
    print(f"cart-pole LQR K = {np.round(K.ravel(), 3)}, max difference from scipy {np.abs(K - Kref).max():.1e}")
    assert np.allclose(P, Pref, rtol=1e-8) and np.allclose(K, Kref, rtol=1e-8)
    res = A.T @ P + P @ A - P @ B @ np.linalg.solve(R, B.T @ P) + Q
    assert np.abs(res).max() < 1e-6 * np.abs(Q).max()               # P solves the Riccati equation

def test_lqr_is_optimal():
    A, B = cartpole_AB(); Q = np.diag([10.0, 1.0, 100.0, 1.0]); R = np.array([[0.1]])
    P = solve_continuous_are(A, B, Q, R); K = np.linalg.solve(R, B.T @ P)
    x0 = np.array([0.0, 0.0, 0.1, 0.0])
    J = cost_of(A, B, Q, R, K, x0)
    assert abs(J - x0 @ P @ x0) < 1e-9 * J                          # optimal cost is x0' P x0
    rng = np.random.default_rng(0); worse = 0
    for _ in range(200):
        Kp = K * (1 + 0.1 * rng.normal(size=K.shape))
        if np.all(np.linalg.eigvals(A - B @ Kp).real < 0):
            worse += cost_of(A, B, Q, R, Kp, x0) > J
    print(f"optimal cost {J:.4f}; 200 random 10 % gain perturbations all cost more: {worse == 200}")
    assert worse == 200
    # and the simulated integral agrees with x0' P x0
    dt = 1e-3; E = expm((A - B @ K) * dt); x = x0.copy(); acc = 0.0
    f = lambda x: x @ (Q + K.T @ R @ K) @ x
    for _ in range(20000):
        xn = E @ x; acc += dt * (f(x) + f(xn)) / 2; x = xn            # trapezoid rule
    print(f"simulated cost {acc:.4f}")
    assert abs(acc / J - 1) < 1e-4

test_double_integrator_closed_form()
test_matches_scipy_care()
test_lqr_is_optimal()
print("PASS")
