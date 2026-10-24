import numpy as np
from scipy.linalg import expm, solve
from scipy.integrate import solve_ivp

def expm_eig(A, t=1.0):
    """e^(At) = V diag(e^(lambda t)) V^-1; needs a full set of eigenvectors"""
    lam, V = np.linalg.eig(A)
    return (V @ np.diag(np.exp(lam * t)) @ np.linalg.inv(V)).real

def expm_pade(A, t=1.0, q=6):
    """scaling and squaring with a (q, q) Pade approximant"""
    M = np.asarray(A, float) * t
    nrm = np.linalg.norm(M, np.inf)
    s = max(0, int(np.ceil(np.log2(nrm))) + 1) if nrm > 0 else 0
    M = M / 2**s
    c, N, D, X = 1.0, np.eye(len(M)), np.eye(len(M)), np.eye(len(M))
    for k in range(1, q + 1):
        c *= (q - k + 1) / (k * (2 * q - k + 1))
        X = X @ M
        N = N + c * X
        D = D + (-1) ** k * c * X
    E = solve(D, N)
    for _ in range(s):
        E = E @ E
    return E

def zoh(A, B, T):
    """exact discretisation: one exponential of the augmented matrix [[A, B], [0, 0]]"""
    n, m = B.shape
    M = np.zeros((n + m, n + m)); M[:n, :n] = A; M[:n, n:] = B
    E = expm_pade(M, T)
    return E[:n, :n], E[:n, n:]

A = np.array([[0.0, 1.0], [-2.0, -3.0]])

def test_worked_example():
    e1, e2 = np.exp(-1), np.exp(-2)
    exact = np.array([[2 * e1 - e2, e1 - e2], [-2 * e1 + 2 * e2, -e1 + 2 * e2]])
    print("e^A for A = [[0, 1], [-2, -3]]:\n", np.round(expm_pade(A), 5))
    assert np.allclose(expm_eig(A), exact, atol=1e-12) and np.allclose(expm_pade(A), exact, atol=1e-12)

def test_matches_scipy():
    rng = np.random.default_rng(0)
    cases = [A, np.array([[0.0, 1.0], [-1.0, 0.0]]) * 5, np.array([[-1.0, 1.0], [0.0, -1.0]]),   # oscillator, defective (Jordan block)
             rng.normal(size=(4, 4)) * 3, rng.normal(size=(6, 6))]
    worst = 0.0
    for M in cases:
        for t in (0.01, 1.0, 4.0):
            ref = expm(M * t)
            err = np.abs(expm_pade(M, t) - ref).max() / max(1.0, np.abs(ref).max())
            worst = max(worst, err)
    print(f"Pade vs scipy.linalg.expm, worst relative error over {len(cases) * 3} cases: {worst:.1e}")
    assert worst < 1e-10

def test_eig_fails_on_defective():
    J = np.array([[-1.0, 1.0], [0.0, -1.0]])
    err = np.abs(expm_eig(J, 1.0) - expm(J)).max()
    print(f"eigen-decomposition on a Jordan block: error {err:.1e} (V is singular)")
    assert err > 1e-6 or not np.isfinite(err)

def test_forced_response():
    B = np.array([[0.0], [1.0]]); T = 0.1; Ad, Bd = zoh(A, B, T)
    x = np.array([1.0, 0.0]); xs = [x]
    for k in range(50): x = Ad @ x + Bd[:, 0] * 1.0; xs.append(x)
    sol = solve_ivp(lambda t, z: A @ z + B[:, 0], (0, 5), [1.0, 0.0], t_eval=np.arange(51) * T, rtol=1e-11, atol=1e-12)
    err = np.abs(np.array(xs) - sol.y.T).max()
    print(f"x(t) = e^(At)x0 + integral of e^(A(t-tau))B u: ZOH steps vs ODE solver, max error {err:.1e}")
    assert err < 1e-8
    assert abs(xs[-1][0] - 0.5) < 0.01                # step input 1 settles at x1 = 1/2

test_worked_example()
test_matches_scipy()
test_eig_fails_on_defective()
test_forced_response()
print("PASS")
