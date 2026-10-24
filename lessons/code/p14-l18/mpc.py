import numpy as np
from scipy.linalg import solve_discrete_are
from scipy.optimize import minimize

T = 0.1
A = np.array([[1, T], [0, 1]]); B = np.array([[T**2 / 2], [T]])     # double integrator: a cart pushed by a force (per kg)
Q = np.diag([1.0, 0.1]); R = np.array([[0.01]])
P_term = solve_discrete_are(A, B, Q, R)                              # terminal cost: the infinite-horizon cost-to-go

def condense(N):
    """predictions X = Sx x0 + Su U over N steps, and the QP 1/2 U'HU + x0'F'U"""
    n, m = B.shape
    Sx = np.vstack([np.linalg.matrix_power(A, k + 1) for k in range(N)])
    Su = np.zeros((N * n, N * m))
    for k in range(N):
        for j in range(k + 1):
            Su[k * n:(k + 1) * n, j * m:(j + 1) * m] = np.linalg.matrix_power(A, k - j) @ B
    Qb = np.kron(np.eye(N), Q); Qb[-n:, -n:] = P_term; Rb = np.kron(np.eye(N), R)
    H = 2 * (Su.T @ Qb @ Su + Rb); Fm = 2 * Su.T @ Qb @ Sx
    return H, Fm, Sx, Su

def solve_box_qp(H, f, lo, hi, iters=3000):
    """minimise 1/2 U'HU + f'U with lo <= U <= hi: accelerated projected gradient (FISTA)"""
    Lc = np.linalg.eigvalsh(H).max(); U = np.clip(-np.linalg.solve(H, f), lo, hi); Y = U.copy(); t = 1.0
    for _ in range(iters):
        Un = np.clip(Y - (H @ Y + f) / Lc, lo, hi)
        tn = (1 + np.sqrt(1 + 4 * t * t)) / 2; Y = Un + (t - 1) / tn * (Un - U); U, t = Un, tn
    return U

def mpc_step(x, N, umax):
    H, Fm, _, _ = condense(N); f = Fm @ x
    if umax is None: return -np.linalg.solve(H, f)
    return solve_box_qp(H, f, -umax, umax)

def closed_loop(N=20, umax=1.0, x0=(-5.0, 0.0), steps=120, clip_only=False):
    x = np.array(x0); xs, us = [x.copy()], []
    for _ in range(steps):
        U = mpc_step(x, N, None if clip_only else umax)
        u = float(np.clip(U[0], -umax, umax))                       # apply the first move, then re-plan
        x = A @ x + B[:, 0] * u; xs.append(x.copy()); us.append(u)
    return np.array(xs), np.array(us)

def test_unconstrained_mpc_equals_lqr():
    K = np.linalg.solve(R + B.T @ P_term @ B, B.T @ P_term @ A)
    H, Fm, _, _ = condense(10); Kmpc = np.linalg.solve(H, Fm)[0]
    print(f"first move of unconstrained MPC: u = -{np.round(Kmpc, 4)} x; LQR gain {np.round(K.ravel(), 4)}")
    assert np.allclose(Kmpc, K.ravel(), atol=1e-9)

def test_qp_solver_matches_scipy():
    H, Fm, _, _ = condense(20); f = Fm @ np.array([-1.5, 0.0])
    U = solve_box_qp(H, f, -1.0, 1.0)
    ref = minimize(lambda u: 0.5 * u @ H @ u + f @ u, np.zeros(20), jac=lambda u: H @ u + f,
                   bounds=[(-1, 1)] * 20, method="L-BFGS-B", options=dict(ftol=1e-15, gtol=1e-12, maxiter=10000)).x
    cost = lambda u: 0.5 * u @ H @ u + f @ u
    print(f"box QP: {np.sum(U > 0.999)} moves at +1, {np.sum(U < -0.999)} at -1, {np.sum(np.abs(U) <= 0.999)} inside; cost {cost(U):.6f} vs scipy {cost(ref):.6f}")
    assert cost(U) <= cost(ref) + 1e-7 and np.abs(U).max() <= 1.0 + 1e-12

def test_constraints_respected_and_better_than_clipping():
    xs, us = closed_loop()
    xc, uc = closed_loop(clip_only=True)                              # plan as if unconstrained, then saturate
    os_mpc, os_clip = xs[:, 0].max(), xc[:, 0].max()
    print(f"move from -5 m to 0 with |u| <= 1: max |u| {np.abs(us).max():.3f}; overshoot MPC {os_mpc:.3f} m, clipped LQR {os_clip:.3f} m;"
          f" final position {xs[-1, 0]:.4f} m")
    assert np.abs(us).max() <= 1.0 + 1e-12 and abs(xs[-1, 0]) < 1e-3
    assert os_mpc < 0.5 * os_clip

test_unconstrained_mpc_equals_lqr()
test_qp_solver_matches_scipy()
test_constraints_respected_and_better_than_clipping()
print("PASS")
